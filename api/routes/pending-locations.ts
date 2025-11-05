import express, { Request, Response } from "express";
import { PendingLocationsController } from "../controllers/pending-locations-controller.js";

const router = express.Router();
const pendingLocationsController = new PendingLocationsController();

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
router.get("/pending-locations", async (req: Request, res: Response) => {
	await pendingLocationsController.getAllPendingLocations(req, res);
});

/**
 * @swagger
 * /pending-locations:
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
router.post("/pending-locations", async (req: Request, res: Response) => {
	await pendingLocationsController.createPendingLocation(req, res);
});

/**
 * @swagger
 * /pending-locations/{id}:
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
router.delete("/pending-locations/:id", async (req: Request, res: Response) => {
	await pendingLocationsController.deletePendingLocation(req, res);
});

export default router;
