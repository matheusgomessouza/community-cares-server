import { Request, Response } from "express";
import {
	verifyRefreshToken,
	createAccessToken,
	createRefreshToken,
	setRefreshCookie,
	clearRefreshCookie,
} from "api/services/auth-tokens.js";
import { RefreshTokensRepository } from "api/repositories/refresh-tokens-repository.js";

function getCookies(req: Request) {
	if (req.cookies) return req.cookies;
	const list: Record<string, string> = {};
	const cookieHeader = req.headers.cookie;
	if (!cookieHeader) return list;

	cookieHeader.split(";").forEach(function (cookie) {
		const parts = cookie.split("=");
		const name = parts[0]?.trim();
		const rest = parts.slice(1);
		if (!name) return;
		const value = rest.join("=").trim();
		if (!value) return;
		list[name] = decodeURIComponent(value);
	});
	return list;
}

export class RefreshTokenController {
	async refresh(req: Request, res: Response) {
		const repo = new RefreshTokensRepository();
		const cookies = getCookies(req);
		const cookieToken = cookies.refresh;
		const bodyToken = req.body?.refresh_token;
		const token = cookieToken || bodyToken;

		if (!token) {
			return res
				.status(401)
				.json({ message: "No refresh token provided" });
		}

		const payload = await verifyRefreshToken(token);
		if (!payload) {
			return res.status(401).json({ message: "Invalid refresh token" });
		}

		const revoked = await repo.isRevoked(token);
		if (revoked) {
			return res.status(401).json({ message: "Refresh token revoked" });
		}

		const accessToken = await createAccessToken({
			sub: payload.sub,
			role: payload.role,
		});

		const newRefreshToken = await createRefreshToken({
			sub: payload.sub,
			role: payload.role,
		});

		// Derive expiresAt for the new refresh token from its JWT exp claim
		const newPayload = await verifyRefreshToken(newRefreshToken);
		let expiresAt: number | undefined;
		if (
			newPayload &&
			"exp" in newPayload &&
			typeof newPayload.exp === "number"
		) {
			expiresAt = newPayload.exp;
		}

		await repo.save(newRefreshToken, payload.sub as string, expiresAt);
		await repo.revoke(token);

		if (cookieToken) {
			setRefreshCookie(res, newRefreshToken);
		}

		return res.status(200).json({
			access_token: accessToken,
			refresh_token: newRefreshToken,
		});
	}

	async logout(req: Request, res: Response) {
		const repo = new RefreshTokensRepository();
		const cookies = getCookies(req);
		const cookieToken = cookies.refresh;
		const bodyToken = req.body?.refresh_token;
		const token = cookieToken || bodyToken;
		if (token) await repo.revoke(token);
		clearRefreshCookie(res);
		return res.status(200).json({ message: "Logged out" });
	}

	async me(req: Request, res: Response) {
		try {
			const repo = new RefreshTokensRepository();
			const cookies = getCookies(req);
			const cookieToken = cookies.refresh;
			if (!cookieToken) {
				return res.status(401).json({ message: "Not authenticated" });
			}

			const payload = await verifyRefreshToken(cookieToken);
			if (!payload) {
				return res
					.status(401)
					.json({ message: "Invalid refresh token" });
			}

			const revoked = await repo.isRevoked(cookieToken);
			if (revoked) {
				return res
					.status(401)
					.json({ message: "Refresh token revoked" });
			}

			// Normalize payload fields you expect. Ajuste nomes conforme o que você inclui no createRefreshToken.
			const user = {
				id:
					(payload.sub as string) ||
					(payload.userId as string) ||
					undefined,
				name: (payload.name as string) || undefined,
				avatar_url: (payload.avatar_url as string) || undefined,
				provider: (payload.provider as string) || undefined,
				email: (payload.email as string) || undefined,
			};

			return res.status(200).json(user);
		} catch (err) {
			console.error("RefreshTokenController.me error", err);
			return res.status(500).json({ message: "Server error" });
		}
	}
}
