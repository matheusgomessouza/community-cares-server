import "dotenv/config";
import cors from "cors";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import * as jose from "jose";

import {
	validateGithubToken,
	validateGoogleToken,
} from "./middleware/token-validation.js";
import { exchangeCode } from "./lib/github.js";
import { exchangeCodeGoogle } from "./lib/google.js";

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

app.post("/authenticate-admin", async (req: Request, res: Response) => {
	const { username, password } = req.body;

	try {
		const user = await prisma.adminUser.findUnique({
			where: {
				username: username,
			},
		});

		const passwordMatch =
			user && (await argon2.verify(user?.password, password));

		if (passwordMatch) {
			const secret = new TextEncoder().encode(
				process.env.AUTH_SECRET_KEY,
			);
			const jwtConfig = new jose.SignJWT()
				.setProtectedHeader({
					alg: "HS256",
				})
				.setExpirationTime("2h")
				.sign(secret);

			const jwtToken = (await jwtConfig).toString();

			res.status(200).json({
				message: "Authentication successfully done.",
				token: jwtToken,
			});
		} else {
			res.status(401).json({ message: "Incorrect password." });
		}
	} catch (error) {
		console.error("Unable to perform authentication", error);
		res.sendStatus(500).json({
			message: "Unable to authenticate, please try again.",
		});
	}
});

app.post("/authenticate-google", async (req: Request, res: Response) => {
	const { code } = req.body;

	try {
		const response = await exchangeCodeGoogle(code);
		res.status(200).json(response);
	} catch (error) {
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
	const { name, type, address, contact, coords, provider } = req.body;

	if (
		!req.headers.authorization ||
		!req.headers.authorization.startsWith("Bearer ")
	) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const access_token = req.headers.authorization.split(" ")[1];

	const tokenValidity =
		provider === "github"
			? await validateGithubToken(access_token)
			: await validateGoogleToken(access_token);

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
			res.status(200).json({
				message: "Pending Location successfully created!",
			});
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

app.delete("/pending-location/:id", async (req: Request, res: Response) => {
	const id = req.params.id;

	if (
		!req.headers.authorization ||
		!req.headers.authorization.startsWith("Bearer ")
	) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const access_token = req.headers.authorization.split(" ")[1];

	const secret = new TextEncoder().encode(process.env.AUTH_SECRET_KEY);

	try {
		await jose.jwtVerify(access_token, secret, {
			algorithms: ["HS256"],
		});

		await prisma.pendingLocations.delete({
			where: {
				id: Number(id),
			},
		});
		res.status(200).json({
			message: "Pending Location successfully deleted!",
		});
	} catch (error) {
		if (error instanceof jose.errors.JWTExpired) {
			console.error(
				"Error on trying deleting a pending location | JWT is expired",
				error,
			);
			res.status(500).json({ message: error });
		} else {
			console.error(
				"Error on trying deleting a pending location | JWT verification failed:",
				error,
			);
			res.status(500).json({ message: error });
		}
	}
});

app.post("/locations", async (req: Request, res: Response) => {
	const { id, name, type, address, contact, coords } = req.body;

	if (
		!req.headers.authorization ||
		!req.headers.authorization.startsWith("Bearer ")
	) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const access_token = req.headers.authorization.split(" ")[1];

	const secret = new TextEncoder().encode(process.env.AUTH_SECRET_KEY);

	try {
		await jose.jwtVerify(access_token, secret, {
			algorithms: ["HS256"],
		});

		await prisma.locations.create({
			data: {
				name,
				type,
				address,
				contact,
				coords,
			},
		});

		await prisma.pendingLocations.delete({
			where: {
				id: Number(id),
			},
		});
		res.status(201).json({ message: "Location successfully created!" });
	} catch (error) {
		res.status(500).json({
			message: "Error on trying creating a location",
			messageError: error,
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
		res.status(201).json({ message: "AdminUser successfully created!" });
	} catch (error) {
		console.error("Unable to register new admin user", error);
		res.status(500).json({ error });
	}
});

app.patch("/locations", async (req: Request, res: Response) => {
	const { field } = req.body;

	if (
		!req.headers.authorization ||
		!req.headers.authorization.startsWith("Bearer ")
	) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const access_token = req.headers.authorization.split(" ")[1];

	const secret = new TextEncoder().encode(process.env.AUTH_SECRET_KEY);

	try {
		await jose.jwtVerify(access_token, secret, {
			algorithms: ["HS256"],
		});

		await prisma.locations.update({
			where: {
				id: Number(field.id),
			},
			data: {
				[field.type]: field.info,
			},
		});

		res.status(200).json({
			message: "Location information successfully updated!",
		});
	} catch (error) {
		res.status(500).json({
			message: "Error on trying updating location data",
			messageError: error,
		});
	}
});

app.listen(port, "0.0.0.0", () => {
	console.log(`Server is running on port:`, port);
});
