import express, { Request, Response } from "express";

import { createRateLimiter } from "api/lib/rate-limit.js";
import { AdminPasswordResetController } from "../controllers/admin-password-reset-controller.js";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const skipInTests = () => process.env.NODE_ENV === "test";

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

router.get("/validate", validateLimiter, async (req: Request, res: Response) => {
	await adminPasswordResetController.validate(req, res);
});

router.post("/confirm", confirmLimiter, async (req: Request, res: Response) => {
	await adminPasswordResetController.confirm(req, res);
});

export default router;
