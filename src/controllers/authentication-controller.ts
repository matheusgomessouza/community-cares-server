import axios from "axios";

export class ExchangeCode {
	async exchangeCode(code: string) {
		try {
			const response = await axios.post(
				`https://github.com/login/oauth/access_token`,
				{
					client_id: process.env.GITHUB_CLIENT_ID,
					client_secret: process.env.GITHUB_CLIENT_SECRET,
					code: code,
					redirect_uri:"exp://192.168.15.147:8081",
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
}
