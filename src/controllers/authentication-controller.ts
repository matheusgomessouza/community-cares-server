import axios from "axios";

export class ExchangeCode {
	async exchangeCode(code: string) {
		try {
			const response = await axios.post(
				`https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`,
				{
					headers: {
						Accept: "application/json",
					},
				},
			);
			return response;
		} catch (error) {
			console.error("Error on the HTTP request", error);
		}
	}
}
