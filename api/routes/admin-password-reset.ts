import express, { Request, Response } from "express";

import { createRateLimiter } from "api/lib/rate-limit.js";
import { AdminPasswordResetController } from "../controllers/admin-password-reset-controller.js";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const skipInTests = () => process.env.NODE_ENV === "test";

/**
 * @swagger
 * /admin-users/password-reset/request:
 *   post:
 *     summary: Request a password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequestInput'
 *     responses:
 *       202:
 *         description: Request accepted. The response is the same for any valid email.
 *       400:
 *         description: Invalid email
 *       429:
 *         description: Too many requests
 */
/**
 * @swagger
 * /admin-users/password-reset/validate:
 *   get:
 *     summary: Validate a password reset token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PasswordResetTokenValidation'
 *       400:
 *         description: Invalid or expired token
 *       429:
 *         description: Too many requests
 */
/**
 * @swagger
 * /admin-users/password-reset/confirm:
 *   post:
 *     summary: Set a new password with a reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetConfirmInput'
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Invalid token or invalid password
 *       429:
 *         description: Too many requests
 */
const router = express.Router();
const adminPasswordResetController = new AdminPasswordResetController();

const requestLimiter = createRateLimiter({
	windowMs: RATE_LIMIT_WINDOW_MS,
	limit: 5,
	skip: skipInTests,
});
const validateLimiter = createRateLimiter({
	windowMs: RATE_LIMIT_WINDOW_MS,
	limit: 30,
	skip: skipInTests,
});
const confirmLimiter = createRateLimiter({
	windowMs: RATE_LIMIT_WINDOW_MS,
	limit: 10,
	skip: skipInTests,
});

router.post("/request", requestLimiter, async (req: Request, res: Response) => {
	await adminPasswordResetController.request(req, res);
});

router.get(
	"/validate",
	validateLimiter,
	async (req: Request, res: Response) => {
		await adminPasswordResetController.validate(req, res);
	},
);

router.post("/confirm", confirmLimiter, async (req: Request, res: Response) => {
	await adminPasswordResetController.confirm(req, res);
});

export default router;
