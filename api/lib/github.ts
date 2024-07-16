import axios from "axios";

export async function exchangeCode(code: string, env: string) {
	const options = {
		method: "POST",
		url: "https://github.com/login/oauth/access_token",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json", // Used to define the returned response type
		},
		data: {
			client_id:
				env === "web"
					? process.env.GITHUB_CLIENT_ID_WEB
					: process.env.GITHUB_CLIENT_ID,
			client_secret:
				env === "web"
					? process.env.GITHUB_CLIENT_SECRET_WEB
					: process.env.GITHUB_CLIENT_SECRET,
			code: code,
		},
	};

	try {
		const response = await axios.request(options);

		if (response.status === 200) return response;
	} catch (error) {
		console.error("Error on the HTTP request", error);
	}
}
