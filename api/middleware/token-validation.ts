import fetch from "node-fetch";
import { OAuth2Client } from "google-auth-library";
import { envs } from "env.js";

export async function validateGithubToken(token: string) {
	// Determine which credentials to use based on environment
	const isProduction = process.env.NODE_ENV === "production";
	const clientId = isProduction
		? "GITHUB_CLIENT_ID_WEB_PRD" in envs
			? envs.GITHUB_CLIENT_ID_WEB_PRD
			: ""
		: "GITHUB_CLIENT_ID_WEB_DEV" in envs
			? envs.GITHUB_CLIENT_ID_WEB_DEV
			: "";
	const clientSecret = isProduction
		? "GITHUB_CLIENT_SECRET_WEB_PRD" in envs
			? envs.GITHUB_CLIENT_SECRET_WEB_PRD
			: ""
		: "GITHUB_CLIENT_SECRET_WEB_DEV" in envs
			? envs.GITHUB_CLIENT_SECRET_WEB_DEV
			: "";

	// Encode the credentials in base64
	const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
		"base64",
	);

	const options = {
		method: "POST",
		headers: {
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			Authorization: `Basic ${credentials}`,
		},
		body: JSON.stringify({ access_token: `${String(token)}` }),
	};

	try {
		const response = await fetch(
			`https://api.github.com/applications/${clientId}/token`,
			options,
		);
		return response.status;
	} catch (error) {
		console.error("Token expired /validateGithubToken", error);
	}
}

export async function validateGoogleToken(token: string) {
	const expiredToken = 401;
	const notExpiredToken = 200;

	try {
		const client = new OAuth2Client();
		const response = await client.getTokenInfo(token);

		const { expiry_date } = response;

		if (expiry_date !== 0 && Date.now() < expiry_date) {
			return notExpiredToken;
		} else {
			return expiredToken;
		}
	} catch (error) {
		console.error(
			"Unable to perform token validation /validateGoogleToken",
			error,
		);
	}
}
