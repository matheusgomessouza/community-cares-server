import axios from "axios";

export class ExchangeCode {
	async exchangeCode(code: string) {
		try {
			const response = await axios.post(
				"https://github.com/login/access_token",
				{
					client_id: process.env.GITHUB_CLIENT_ID,
					client_secret: process.env.GITHUB_CLIENT_SECRET,
					code,
				},
				{
					headers: {
						Accept: "application/json",
					},
				},
			);
			const { data, status } = response;
			return { data, status };
		} catch (error) {
			console.error("Error on the HTTP request", error);
		}
	}
}
