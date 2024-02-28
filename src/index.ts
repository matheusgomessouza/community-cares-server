import express from "express";
import bodyParser from "body-parser";

import "dotenv/config";
import { ExchangeCode } from "@controllers/authentication-controller";

const app = express();
const port = 8080;

const exchangeCodeController = new ExchangeCode();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
	res.send("Server is running");
});

app.post("/authenticate", async (req, res) => {
	const { code } = req.body;

	try {
		const response = await exchangeCodeController.exchangeCode(code);
		const accessToken = response?.data.access_token;

		res.json({ access_token: accessToken });
	} catch (error: unknown) {
		console.error("Error exchanging code for token:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

app.listen(port, () => {
	console.log(`Server listening to port ${port}`);
});
