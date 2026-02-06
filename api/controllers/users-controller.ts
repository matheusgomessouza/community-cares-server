import { exchangeCodeGithub } from "api/lib/github.js";
import { exchangeCodeGoogle } from "api/lib/google.js";
import { Request, Response } from "express";
import {
	createAccessToken,
	createRefreshToken,
	setRefreshCookie,
} from "api/services/auth-tokens.js";
import fetch, { type RequestInit } from "node-fetch";
import { RefreshTokensRepository } from "api/repositories/refresh-tokens-repository.js";

type OAuthTokenResponse = {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
};

type GitHubUserResponse = {
	id: number | string;
	name?: string | null;
	login?: string | null;
	avatar_url?: string | null;
	email?: string | null;
};

type GitHubEmailResponse = {
	email?: string | null;
	primary?: boolean;
};

type GooglePeopleResponse = {
	names?: { displayName?: string }[];
	photos?: { url?: string }[];
	emailAddresses?: { value?: string }[];
	resourceName?: string;
};

export class UsersController {
	async fetchGithubProfile(providerAccessToken: string) {
		if (!providerAccessToken) {
			throw new Error("No GitHub access token provided");
		}

		const headers = {
			Authorization: `Bearer ${providerAccessToken}`,
			Accept: "application/vnd.github.v3+json",
			"User-Agent": "community-cares-server",
		};

		const userRes = await fetch("https://api.github.com/user", {
			method: "GET",
			headers,
		} as RequestInit);

		const userText = await userRes.text();
		let userJson: GitHubUserResponse | null = null;
		try {
			userJson = JSON.parse(userText) as GitHubUserResponse;
		} catch (err) {
			console.error("Failed to parse GitHub /user response as JSON", {
				status: userRes.status,
				statusText: userRes.statusText,
				body: userText,
				err,
			});
			throw new Error("Failed to parse GitHub user profile");
		}

		if (!userRes.ok) {
			console.error("GitHub /user returned non-OK", {
				status: userRes.status,
				statusText: userRes.statusText,
				body: userJson,
			});
			throw new Error("Failed to fetch GitHub user profile");
		}

		let email = userJson.email ?? undefined;
		if (!email) {
			const emailsRes = await fetch(
				"https://api.github.com/user/emails",
				{
					method: "GET",
					headers,
				} as RequestInit,
			);

			const emailsText = await emailsRes.text();
			let emailsJson: GitHubEmailResponse[] | null = null;
			try {
				emailsJson = JSON.parse(emailsText) as GitHubEmailResponse[];
			} catch (err) {
				console.warn("Failed to parse GitHub /user/emails response", {
					status: emailsRes.status,
					statusText: emailsRes.statusText,
					body: emailsText,
					err,
				});
				emailsJson = null;
			}

			if (emailsRes.ok && Array.isArray(emailsJson)) {
				const primary =
					emailsJson.find((e) => e.primary) || emailsJson[0];
				email = primary?.email ?? undefined;
			} else {
				console.warn(
					"Could not fetch GitHub emails or no emails available",
					{
						status: emailsRes.status,
						statusText: emailsRes.statusText,
						body: emailsJson,
					},
				);
			}
		}

		return {
			providerId: String(userJson.id),
			name: userJson.name || userJson.login || "",
			avatar_url: userJson.avatar_url ?? undefined,
			email,
		};
	}

	async authenticateWithGitHub(req: Request, res: Response) {
		const { code, env, code_verifier } = req.body;

		if (!code) {
			return res.status(400).json({ message: "Code is required" });
		}

		try {
			const response = (await exchangeCodeGithub(
				code,
				code_verifier,
				env,
			)) as OAuthTokenResponse | null;
			if (!response) {
				console.error("exchangeCodeGithub returned null/undefined");
				return res
					.status(500)
					.json({ message: "Failed to exchange code with GitHub" });
			}

			const providerAccessToken = response.access_token;
			if (!providerAccessToken) {
				console.error(
					"No access_token returned by exchangeCodeGithub",
					{ response },
				);
				return res.status(500).json({
					message: "Failed to retrieve GitHub access token",
				});
			}

			let profile;
			try {
				profile = await this.fetchGithubProfile(providerAccessToken);
			} catch (err) {
				console.error("Error fetching GitHub profile:", err);
				return res
					.status(500)
					.json({ message: "Failed to fetch GitHub profile" });
			}

			const userPayload = {
				sub: `github:${profile.providerId}`,
				provider: "github",
				providerId: profile.providerId,
				name: profile.name,
				avatar_url: profile.avatar_url,
				email: profile.email,
			};

			const accessToken = await createAccessToken(userPayload);
			const refreshToken = await createRefreshToken(userPayload);

			const repo = new RefreshTokensRepository();
			const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
			await repo.save(refreshToken, userPayload.sub, expiresAt);

			if (env === "web") {
				setRefreshCookie(res, refreshToken);
				return res
					.status(200)
					.json({ message: "Authentication successful" });
			} else {
				return res.status(200).json({
					access_token: accessToken,
					refresh_token: refreshToken,
					provider: { access_token: providerAccessToken },
				});
			}
		} catch (error: unknown) {
			console.error("Error exchanging code for token:", error);
			return res.status(500).json({
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async fetchGoogleProfile(tokens: {
		access_token?: string;
		id_token?: string;
	}) {
		if (tokens.access_token) {
			const res = await fetch(
				"https://people.googleapis.com/v1/people/me?personFields=names,photos,emailAddresses",
				{
					method: "GET",
					headers: { Authorization: `Bearer ${tokens.access_token}` },
				} as RequestInit,
			);

			const text = await res.text();
			let json: GooglePeopleResponse | null = null;
			try {
				json = JSON.parse(text) as GooglePeopleResponse;
			} catch (err) {
				console.error("Failed to parse Google People API response", {
					status: res.status,
					statusText: res.statusText,
					body: text,
					err,
				});
				throw new Error("Failed to parse Google profile");
			}

			if (!res.ok) {
				console.error("Google People API returned non-OK", {
					status: res.status,
					statusText: res.statusText,
					body: json,
				});
				throw new Error("Failed to fetch Google profile");
			}

			const name = json.names?.[0]?.displayName ?? "";
			const avatar_url = json.photos?.[0]?.url ?? undefined;
			const email = json.emailAddresses?.[0]?.value ?? undefined;
			const providerId =
				json.resourceName?.replace("people/", "") || undefined;

			return { providerId, name, avatar_url, email };
		}

		if (tokens.id_token) {
			try {
				const parts = tokens.id_token.split(".");
				const payload = JSON.parse(
					Buffer.from(parts[1], "base64").toString(),
				);
				return {
					providerId: payload.sub,
					name: payload.name,
					avatar_url: payload.picture,
					email: payload.email,
				};
			} catch (err) {
				console.error("Failed to decode Google id_token", err);
				throw new Error("Failed to decode Google id_token");
			}
		}

		throw new Error("No token available to fetch Google profile");
	}

	async authenticateWithGoogle(req: Request, res: Response) {
		const { code, env } = req.body;

		if (!code) {
			return res.status(400).json({ message: "Code is required" });
		}

		try {
			const response = (await exchangeCodeGoogle(
				code,
			)) as OAuthTokenResponse | null;
			if (!response) {
				console.error("exchangeCodeGoogle returned null/undefined");
				return res
					.status(500)
					.json({ message: "Failed to exchange code with Google" });
			}

			const providerAccessToken = response.access_token;
			const idToken = response.id_token;

			let profile;
			try {
				profile = await this.fetchGoogleProfile({
					access_token: providerAccessToken,
					id_token: idToken,
				});
			} catch (err) {
				console.error("Error fetching Google profile:", err);
				return res
					.status(500)
					.json({ message: "Failed to fetch Google profile" });
			}

			const userPayload = {
				sub: `google:${profile.providerId}`,
				provider: "google",
				providerId: profile.providerId,
				name: profile.name,
				avatar_url: profile.avatar_url,
				email: profile.email,
			};

			const accessToken = await createAccessToken(userPayload);
			const refreshToken = await createRefreshToken(userPayload);

			const repo = new RefreshTokensRepository();
			const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
			await repo.save(refreshToken, userPayload.sub, expiresAt);

			if (env === "web") {
				setRefreshCookie(res, refreshToken);
				return res
					.status(200)
					.json({ message: "Authentication successful" });
			} else {
				return res.status(200).json({
					access_token: accessToken,
					refresh_token: refreshToken,
					provider: {
						access_token: providerAccessToken,
						id_token: idToken,
					},
				});
			}
		} catch (error) {
			console.error("Error exchanging code for token:", error);
			return res.status(500).json({
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}
}
