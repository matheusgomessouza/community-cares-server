import "dotenv/config";
import cors from "cors";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

import { exchangeCode } from "./lib/github.js";
import { validateGithubToken } from "./middleware/token-validation.js";

const prisma = new PrismaClient();
const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
	res.send("Server is running");
});

app.post("/authenticate", async (req: Request, res: Response) => {
	const { code, env } = req.body;

	try {
		const response = await exchangeCode(code, env);
		res.status(200).json(response);
	} catch (error: unknown) {
		console.error("Error exchanging code for token:", error);
		res.status(500).json({ message: error });
	}
});

app.get("/locations", async (req: Request, res: Response) => {
	try {
		const locations = await prisma.locations.findMany();
		res.status(200).json(locations);
	} catch (error) {
		console.error("Error on trying to retrieve locations:", error);
		res.status(500).json({ message: error });
	}
});

app.get("/pending-locations", async (req: Request, res: Response) => {
	try {
		const pendingLocations = await prisma.pendingLocations.findMany();
		res.status(200).json(pendingLocations);
	} catch (error) {
		console.error("Error on trying to retrieve pendingLocations:", error);
		res.status(500).json({ message: error });
	}
});

app.post("/pending-location", async (req: Request, res: Response) => {
	const { name, type, address, contact, coords } = req.body;

	if (
		!req.headers.authorization ||
		!req.headers.authorization.startsWith("Bearer ")
	) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const access_token = req.headers.authorization.split(" ")[1];

	const tokenValidity = await validateGithubToken(access_token);

	if (tokenValidity === 200) {
		try {
			await prisma.pendingLocations.create({
				data: {
					name,
					type,
					address,
					contact,
					coords,
				},
			});
			res.status(200).json({ message: "Location successfully created!" });
		} catch (error) {
			console.error("Error on trying creating a location:", error);
			res.status(500).json({ message: error });
		}
	} else {
		res.status(401).json({
			message: "Unable to perform query | Token expired",
		});
	}
});

app.post("/admin-user", async (req: Request, res: Response) => {
	const { name, username, email, password } = req.body;

	try {
		const hashedPassword = await argon2.hash(password);

		await prisma.adminUser.create({
			data: {
				name,
				username,
				email,
				password: hashedPassword,
			},
		});
		res.status(200).json({ message: "AdminUser successfully created!" });
	} catch (error) {
		console.error("Unable to register new admin user", error);
		res.status(500).json({ error });
	}
});

app.listen(port, () => {
	console.log(`Server is running on port:`, port);
});
