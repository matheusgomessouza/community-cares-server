import { Request } from "express";
import { verifyRefreshToken } from "api/services/auth-tokens.js";
import { RefreshTokensRepository } from "api/repositories/refresh-tokens-repository.js";

function getCookie(req: Request, name: string): string | undefined {
	const header = req.headers.cookie;
	if (!header) return undefined;

	for (const part of header.split(";")) {
		const separator = part.indexOf("=");
		if (separator === -1) continue;

		const key = part.slice(0, separator).trim();
		if (key !== name) continue;

		return decodeURIComponent(part.slice(separator + 1).trim());
	}

	return undefined;
}

export function getBearerToken(req: Request): string | undefined {
	const header = req.headers.authorization;
	if (!header?.startsWith("Bearer ")) return undefined;

	const token = header.slice("Bearer ".length).trim();

	return token || undefined;
}

/**
 * The web app signs in through the OAuth code flow and receives the refresh
 * token in an httpOnly cookie. That cookie is the session for the browser; the
 * Bearer path stays for clients that hold a provider token.
 */
export async function hasValidSession(req: Request): Promise<boolean> {
	const token = getCookie(req, "refresh");
	if (!token) return false;

	const payload = await verifyRefreshToken(token);
	if (!payload) return false;

	const repo = new RefreshTokensRepository();

	return !(await repo.isRevoked(token));
}
