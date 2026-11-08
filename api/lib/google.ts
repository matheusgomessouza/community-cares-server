import { OAuth2Client } from "google-auth-library";
import { envs } from "env.js";
import { logger } from "api/lib/logger.js";

export async function exchangeCodeGoogle(code: string) {
	const client = new OAuth2Client(
		envs.GOOGLE_CLIENT_ID,
		envs.GOOGLE_SECRET,
		envs.GOOGLE_REDIRECT_URI,
	);

	try {
		const response = await client.getToken(code);
		const { tokens } = response;

		return tokens;
	} catch (error) {
		logger.error(
			{ err: error },
			"Error on the HTTP request /exchangeCodeGoogle",
		);
	}
}
