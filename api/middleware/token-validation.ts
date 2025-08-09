import fetch from "node-fetch";
import { OAuth2Client } from "google-auth-library";

export async function validateGithubToken(token: string) {
	// Encode the credentials in base64
	const credentials = Buffer.from(
		`${process.env.GITHUB_CLIENT_ID_WEB}:${process.env.GITHUB_CLIENT_SECRET_WEB}`,
	).toString("base64");

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
			`https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID_WEB}/token`,
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
