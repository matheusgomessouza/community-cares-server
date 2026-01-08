import "dotenv/config";
import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../swagger.js";

import usersRouter from "api/routes/users.js";
import adminUsersRouter from "api/routes/admin-users.js";
import locationsRouter from "api/routes/locations.js";
import pendingLocationsRouter from "api/routes/pending-locations.js";

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
export const app = express();
const port = 8088;

app.use(bodyParser.json());
app.use(cors());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/users", usersRouter);
app.use("/admin-users", adminUsersRouter);
app.use("/locations", locationsRouter);
app.use("/pending-locations", pendingLocationsRouter);

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
		console.log(`Server is running on port:`, port);
	});
}
