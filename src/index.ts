import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { ExchangeCode } from "@controllers/authentication-controller";

const app = express();
const port = 8080;
const exchangeCodeController = new ExchangeCode();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
	res.send("Server is running");
});

app.post("/authenticate", async (req, res) => {
	const { code } = req.body;

	try {
		const response = await exchangeCodeController.exchangeCode(code);
		res.status(200).json({ access_token: response?.data });
	} catch (error: unknown) {
		console.error("Error exchanging code for token:", error);
		res.status(500).json({ error });
	}
});

app.listen(port, () => {
	console.log(`Server listening to port ${port}`);
});
