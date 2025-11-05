import express, { Request, Response } from "express";
import { UsersController } from "../controllers/users-controller.js";

const router = express.Router();
const usersController = new UsersController();

/**
 * @swagger
 * /users/authenticate/github:
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
router.post(
	"/users/authenticate/github",
	async (req: Request, res: Response) => {
		await usersController.authenticateWithGitHub(req, res);
	},
);

/**
 * @swagger
 * /users/authenticate/google:
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
router.post(
	"/users/authenticate/google",
	async (req: Request, res: Response) => {
		await usersController.authenticateWithGoogle(req, res);
	},
);

export default router;
