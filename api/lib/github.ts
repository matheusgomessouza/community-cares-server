import fetch from "node-fetch";

export async function exchangeCode(code: string, env: string) {
	const options = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json", // Used to define the returned response type
		},
		body: JSON.stringify({
			client_id:
				env === "web"
					? process.env.GITHUB_CLIENT_ID_WEB
					: process.env.GITHUB_CLIENT_ID,
			client_secret:
				env === "web"
					? process.env.GITHUB_CLIENT_SECRET_WEB
					: process.env.GITHUB_CLIENT_SECRET,
			code: code,
		}),
	};

	try {
		const response = await fetch(
			"https://github.com/login/oauth/access_token",
			options,
		);

		if (response.status === 200) return await response.json();
	} catch (error) {
		console.error("Error on the HTTP request /exchangeCode", error);
	}
}
