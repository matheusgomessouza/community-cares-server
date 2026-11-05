import express, { Request, Response } from "express";

import { AdminPasswordResetController } from "../controllers/admin-password-reset-controller.js";

const router = express.Router();
const adminPasswordResetController = new AdminPasswordResetController();

router.post("/request", async (req: Request, res: Response) => {
	await adminPasswordResetController.request(req, res);
});

router.get("/validate", async (req: Request, res: Response) => {
	await adminPasswordResetController.validate(req, res);
});

router.post("/confirm", async (req: Request, res: Response) => {
	await adminPasswordResetController.confirm(req, res);
});

export default router;
