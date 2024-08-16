export async function validateGithubToken(token: string) {
	// Encode the credentials in base64
	const credentials = Buffer.from(
		`${process.env.GITHUB_CLIENT_ID_WEB}:${process.env.GITHUB_CLIENT_SECRET_WEB}`,
	).toString("base64");

	const options = {
		method: "POST",
		headers: {
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			Authorization: `Basic ${credentials}`,
		},
		data: { access_token: `${String(token)}` },
	};

	try {
		const response = await fetch(
			`https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID_WEB}/token`,
			options,
		);

		return response.status;
	} catch (error) {
		console.error("Token expired /validateGithubToken", error);
	}
}
