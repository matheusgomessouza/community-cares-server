import fetch from "node-fetch";
import { envs } from "env.js";

type EnvsWithOptionalProps = typeof envs & {
	GITHUB_CLIENT_ID_WEB_PRD?: string;
	GITHUB_CLIENT_ID_WEB_DEV?: string;
	GITHUB_CLIENT_SECRET_WEB_PRD?: string;
	GITHUB_CLIENT_SECRET_WEB_DEV?: string;
};

/**
 * The client id is public. The prefix is enough to tell which OAuth App the
 * server used, and it settles a 404 from GitHub in one log line.
 */
function describeClientId(clientId: string) {
	return `${clientId.slice(0, 6)}... (${clientId.length} chars)`;
}

export async function exchangeCodeGithub(
	code: string,
	codeVerifier: string,
	env: string,
) {
	const isProd = process.env.NODE_ENV === "production";
	const envsTyped = envs as EnvsWithOptionalProps;

	// A value pasted with a trailing space or newline reaches GitHub as a
	// different client id, and GitHub answers 404 Not Found.
	const client_id = (
		env === "web"
			? isProd
				? envsTyped.GITHUB_CLIENT_ID_WEB_PRD
				: envsTyped.GITHUB_CLIENT_ID_WEB_DEV
			: envs.GITHUB_CLIENT_ID
	)?.trim();
	const client_secret = (
		env === "web"
			? isProd
				? envsTyped.GITHUB_CLIENT_SECRET_WEB_PRD
				: envsTyped.GITHUB_CLIENT_SECRET_WEB_DEV
			: envs.GITHUB_CLIENT_SECRET
	)?.trim();

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
			// GitHub answers 404 when it does not know the client id. Without
			// the prefix below, a wrong app and a wrong secret look the same
			// in the log.
			throw new Error(
				`GitHub OAuth error: ${response.status} ${response.statusText} - ${JSON.stringify(responseBody)} (client_id ${describeClientId(client_id)})`,
			);
		}
	} catch (error) {
		console.error("Error on the HTTP request /exchangeCode", error);
		throw error;
	}
}
