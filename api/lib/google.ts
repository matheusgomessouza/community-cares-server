import { OAuth2Client } from "google-auth-library";

export async function exchangeCodeGoogle(code: string) {
	const client = new OAuth2Client(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_SECRET,
		process.env.GOOGLE_REDIRECT_URI,
	);

	try {
		const response = await client.getToken(code);
		const { tokens } = response;

		return tokens;
	} catch (error) {
		console.error("Error on the HTTP request /exchangeCodeGoogle", error);
	}
}
