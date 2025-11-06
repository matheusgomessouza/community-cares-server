import express, { Request, Response } from "express";
import { AdminUsersController } from "../controllers/admin-users-controller.js";

const router = express.Router();
const adminUsersController = new AdminUsersController();

/**
 * @swagger
 * /admin-users/authenticate:
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
router.post("/authenticate", async (req: Request, res: Response) => {
	await adminUsersController.authenticate(req, res);
});

/**
 * @swagger
 * /admin-users:
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
router.post("/", async (req: Request, res: Response) => {
	await adminUsersController.createAdminUser(req, res);
});

export default router;
