import axios from "axios";

export async function validateGithubToken(token: string) {
	try {
		const response = await axios.post(
			`https://github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`,
			{
				access_token: token,
			},
			{
				headers: {
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2022-11-28",
					Authorization: "",
				},
			},
		);

		return response.status;
	} catch (error) {
		console.error("Token expired /validateGithubToken", error);
	}
}
