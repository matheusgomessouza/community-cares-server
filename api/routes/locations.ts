import express, { Request, Response } from "express";
import { LocationsController } from "../controllers/locations-controller.js";

const router = express.Router();
const locationsController = new LocationsController();

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
router.get("/", async (_: Request, res: Response) => {
	await locationsController.getLocations(res);
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
router.post("/", async (req: Request, res: Response) => {
	await locationsController.createLocation(req, res);
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
router.patch("/", async (req: Request, res: Response) => {
	await locationsController.updateLocation(req, res);
});

export default router;
