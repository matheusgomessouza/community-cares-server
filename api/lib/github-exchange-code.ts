import axios from "axios";

export async function exchangeCode(code: string, state: string) {
	try {
		const response = await axios.post(
			`https://github.com/login/oauth/access_token`,
			{
				client_id: process.env.GITHUB_CLIENT_ID,
				client_secret: process.env.GITHUB_CLIENT_SECRET,
				code: code,
				redirect_uri:
					state === "web-app"
						? process.env.WEB
						: process.env.LOCAL_EXPO_IP,
			},
			{
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
			},
		);
		return response;
	} catch (error) {
		console.error("Error on the HTTP request", error);
	}
}
