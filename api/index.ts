import "dotenv/config";
import crypto from "node:crypto";
import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../swagger.js";
import { logger } from "api/lib/logger.js";

import usersRouter from "api/routes/users.js";
import adminUsersRouter from "api/routes/admin-users.js";
import adminPasswordResetRouter from "api/routes/admin-password-reset.js";
import locationsRouter from "api/routes/locations.js";
import pendingLocationsRouter from "api/routes/pending-locations.js";
import authRouter from "api/routes/auth.js";
import uploadsRouter from "api/routes/uploads.js";
import { envs } from "env.js";
import { setMailTransport } from "api/lib/mailer.js";
import { createNodemailerTransport } from "api/lib/nodemailer-transport.js";

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
 *         image_url:
 *           type: string
 *           nullable: true
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
 *     PasswordResetRequestInput:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *     PasswordResetConfirmInput:
 *       type: object
 *       required: [token, password]
 *       properties:
 *         token:
 *           type: string
 *         password:
 *           type: string
 *           minLength: 8
 *           maxLength: 128
 *     PasswordResetTokenValidation:
 *       type: object
 *       properties:
 *         valid:
 *           type: boolean
 *         expiresAt:
 *           type: string
 *           format: date-time
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
 *         image_url:
 *           type: string
 *           nullable: true
 *           description: Public URL returned by POST /uploads.
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
 *         image_url:
 *           type: string
 *           nullable: true
 *           description: Public URL from the pending location.
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
export const app = express();
const port = 8088;

const mailTransport = createNodemailerTransport();

if (!mailTransport && process.env.NODE_ENV === "production") {
	throw new Error(
		"No mail transport configured. Set SMTP_HOST to send password reset email.",
	);
}

setMailTransport(mailTransport);

app.use(
	pinoHttp({
		logger,
		genReqId: (req) =>
			(req.headers["x-request-id"] as string) || crypto.randomUUID(),
		customLogLevel: (_req, res, err) => {
			if (res.statusCode >= 500 || err) return "error";
			if (res.statusCode >= 400) return "warn";
			return "info";
		},
		autoLogging: {
			ignore: (req) =>
				req.url === "/" ||
				(req.url ? req.url.startsWith("/api-docs") : false),
		},
	}),
);

app.use(bodyParser.json());
app.use(
	cors({
		origin: envs.FRONTEND_ORIGIN || "http://localhost:3000",
		credentials: true,
	}),
);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/admin-users/password-reset", adminPasswordResetRouter);
app.use("/admin-users", adminUsersRouter);
app.use("/locations", locationsRouter);
app.use("/pending-locations", pendingLocationsRouter);
app.use("/uploads", uploadsRouter);

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

if (process.env.NODE_ENV !== "test") {
	app.listen(port, "0.0.0.0", () => {
		logger.info({ port }, `Server is running on port ${port}`);
	});
}
