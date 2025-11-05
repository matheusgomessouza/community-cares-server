import fetch from "node-fetch";
import { envs } from "env.js";

export async function exchangeCodeGithub(
	code: string,
	codeVerifier: string,
	env: string,
) {
	const client_id =
		env === "web" ? envs.GITHUB_CLIENT_ID_WEB_DEV : envs.GITHUB_CLIENT_ID;
	const client_secret =
		env === "web"
			? envs.GITHUB_CLIENT_SECRET_WEB_DEV
			: envs.GITHUB_CLIENT_SECRET;

	if (!client_id || !client_secret) {
		throw new Error(
			"Missing GitHub OAuth client credentials (client_id/client_secret).",
		);
	}

	const paramsObj: Record<string, string> = {
		client_id,
		client_secret,
		code,
	};

	if (codeVerifier) {
		paramsObj.code_verifier = codeVerifier;
	}

	const params = new URLSearchParams(paramsObj);

	const options = {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json",
		},
		body: params.toString(),
	};

	try {
		const response = await fetch(
			"https://github.com/login/oauth/access_token",
			options,
		);

		const responseBody = await response.json().catch((e) => {
			console.error("Failed to parse response as JSON:", e);
			return null;
		});

		if (response.status === 200) {
			return responseBody;
		} else {
			throw new Error(
				`GitHub OAuth error: ${response.status} ${response.statusText} - ${JSON.stringify(responseBody)}`,
			);
		}
	} catch (error) {
		console.error("Error on the HTTP request /exchangeCode", error);
		throw error;
	}
}
