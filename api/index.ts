import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";

const app = express();
const port = 8080;

async function exchangeCode(code: string) {
	try {
		const response = await axios.post(
			`https://github.com/login/oauth/access_token`,
			{
				client_id: process.env.GITHUB_CLIENT_ID,
				client_secret: process.env.GITHUB_CLIENT_SECRET,
				code: code,
				redirect_uri: process.env.LOCAL_EXPO_IP,
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

app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
	res.send("Server is running");
});

app.post("/authenticate", async (req, res) => {
	const { code } = req.body;

	try {
		const response = await exchangeCode(code);
		res.status(200).json(response?.data);
	} catch (error: unknown) {
		console.error("Error exchanging code for token:", error);
		res.status(500).json({ error });
	}
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
