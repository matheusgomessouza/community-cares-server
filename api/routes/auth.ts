import express, { Request, Response } from "express";
import { RefreshTokenController } from "../controllers/refresh-token-controller.js";

const router = express.Router();
const refreshTokenController = new RefreshTokenController();

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New access token
 *       401:
 *         description: Unixthorized
 */
router.post("/refresh", async (req: Request, res: Response) => {
	await refreshTokenController.refresh(req, res);
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user (revoke token)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post("/logout", async (req: Request, res: Response) => {
	await refreshTokenController.logout(req, res);
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Authenticated user info
 *       401:
 *         description: Unauthorized
 */
router.get("/me", async (req: Request, res: Response) => {
	await refreshTokenController.me(req, res);
});

export default router;
