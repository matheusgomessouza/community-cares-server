import "dotenv/config";
import cors from "cors";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import * as jose from "jose";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../swagger.js";

import {
	validateGithubToken,
	validateGoogleToken,
} from "./middleware/token-validation.js";
import { exchangeCode } from "./lib/github.js";
import { exchangeCodeGoogle } from "./lib/google.js";

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Coordinates:
 *       type: object
 *       additionalProperties: true
 *       description: Arbitrary JSON object with coordinate data.
 *     Location:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         address:
 *           type: string
 *         contact:
 *           type: string
 *         coords:
 *           $ref: '#/components/schemas/Coordinates'
 *     PendingLocation:
 *       allOf:
 *         - $ref: '#/components/schemas/Location'
 *     AdminUserInput:
 *       type: object
 *       required: [name, username, email, password]
 *       properties:
 *         name:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     AdminAuthInput:
 *       type: object
 *       required: [username, password]
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *     OAuthCodeInput:
 *       type: object
 *       required: [code]
 *       properties:
 *         code:
 *           type: string
 *         env:
 *           type: string
 *           description: Optional environment/channel identifier.
 *     PendingLocationInput:
 *       type: object
 *       required: [name, type, address, contact, coords, provider]
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         address:
 *           type: string
 *         contact:
 *           type: string
 *         coords:
 *           $ref: '#/components/schemas/Coordinates'
 *         provider:
 *           type: string
 *           description: Token provider used for validation.
 *           enum: [github, google]
 *     ApproveLocationInput:
 *       type: object
 *       required: [id, name, type, address, contact, coords]
 *       properties:
 *         id:
 *           type: integer
 *           description: Pending location id to delete after approval.
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         address:
 *           type: string
 *         contact:
 *           type: string
 *         coords:
 *           $ref: '#/components/schemas/Coordinates'
 *     UpdateLocationFieldInput:
 *       type: object
 *       required: [field]
 *       properties:
 *         field:
 *           type: object
 *           required: [id, type, info]
 *           properties:
 *             id:
 *               type: integer
 *             type:
 *               type: string
 *               description: Column name to update.
 *             info:
 *               description: New value for the column.
 *   responses:
 *     MessageResponse:
 *       description: A simple message response.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 */

const prisma = new PrismaClient();
export const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(cors());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check
 *     description: Returns a simple message indicating the server is running.
 *     tags: [Misc]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Server is running
 */
app.get("/", (req, res) => {
	res.send("Server is running");
});

/**
 * @swagger
 * /authenticate:
 *   post:
 *     summary: Exchange OAuth code for tokens (GitHub)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OAuthCodeInput'
 *     responses:
 *       200:
 *         description: OAuth exchange successful
 *       500:
 *         description: Failed to exchange code
 */
app.post("/authenticate", async (req: Request, res: Response) => {
	const { code, env } = req.body;

	try {
		const response = await exchangeCode(code, env);
		res.status(200).json(response);
	} catch (error: unknown) {
		console.error("Error exchanging code for token:", error);
		res.status(500).json({
			message: error instanceof Error ? error.message : String(error),
		});
	}
});

/**
 * @swagger
 * /authenticate-admin:
 *   post:
 *     summary: Authenticate admin user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminAuthInput'
 *     responses:
 *       200:
 *         description: Authentication successful with JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Incorrect password
 *       500:
 *         description: Unable to authenticate
 */
app.post("/authenticate-admin", async (req: Request, res: Response) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res
			.status(400)
			.json({ message: "Username and password are required" });
	}

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
		res.status(500).json({
			message: "Unable to authenticate, please try again.",
		});
	}
});

/**
 * @swagger
 * /authenticate-google:
 *   post:
 *     summary: Exchange OAuth code for tokens (Google)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OAuthCodeInput'
 *     responses:
 *       200:
 *         description: OAuth exchange successful
 *       500:
 *         description: Failed to exchange code
 */
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

/**
 * @swagger
 * /locations:
 *   get:
 *     summary: Retrieve a list of locations
 *     description: Retrieve a list of all approved locations from the database.
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: A list of locations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Location'
 */
app.get("/locations", async (req: Request, res: Response) => {
	try {
		const locations = await prisma.locations.findMany();
		res.status(200).json(locations);
	} catch (error) {
		console.error("Error on trying to retrieve locations:", error);
		res.status(500).json({ message: error });
	}
});

/**
 * @swagger
 * /pending-locations:
 *   get:
 *     summary: Retrieve a list of pending locations
 *     tags: [PendingLocations]
 *     responses:
 *       200:
 *         description: A list of pending locations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PendingLocation'
 */
app.get("/pending-locations", async (req: Request, res: Response) => {
	try {
		const pendingLocations = await prisma.pendingLocations.findMany();
		res.status(200).json(pendingLocations);
	} catch (error) {
		console.error("Error on trying to retrieve pendingLocations:", error);
		res.status(500).json({
			message: error instanceof Error ? error.message : error,
		});
	}
});

/**
 * @swagger
 * /pending-location:
 *   post:
 *     summary: Create a new pending location
 *     tags: [PendingLocations]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token from GitHub or Google
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PendingLocationInput'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/MessageResponse'
 *       401:
 *         description: Unauthorized or token expired
 *       500:
 *         description: Error creating pending location
 */
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
			res.status(500).json({
				message: error instanceof Error ? error.message : String(error),
			});
		}
	} else {
		res.status(401).json({
			message: "Unable to perform query | Token expired",
		});
	}
});

/**
 * @swagger
 * /pending-location/{id}:
 *   delete:
 *     summary: Delete a pending location by id
 *     tags: [PendingLocations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         $ref: '#/components/responses/MessageResponse'
 *       500:
 *         description: JWT verification failed or other error
 */
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
			res.status(500).json({ message: error.message || String(error) });
		} else {
			console.error(
				"Error on trying deleting a pending location | JWT verification failed or delete error:",
				error,
			);
			return res.status(500).json({
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}
});

/**
 * @swagger
 * /locations:
 *   post:
 *     summary: Approve a pending location and create it in locations
 *     tags: [Locations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApproveLocationInput'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/MessageResponse'
 *       500:
 *         description: Error creating location
 */
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

/**
 * @swagger
 * /admin-user:
 *   post:
 *     summary: Create a new admin user
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUserInput'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/MessageResponse'
 *       500:
 *         description: Error creating admin user
 */
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
		res.status(500).json({
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

/**
 * @swagger
 * /locations:
 *   patch:
 *     summary: Update a single field of a location
 *     tags: [Locations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLocationFieldInput'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/MessageResponse'
 *       500:
 *         description: Error updating location
 */
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

if (process.env.NODE_ENV !== "test") {
	app.listen(port, "0.0.0.0", () => {
		console.log(`Server is running on port:`, port);
	});
}
