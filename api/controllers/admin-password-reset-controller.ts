import { Request, Response } from "express";
import { z } from "zod";

import { RequestPasswordResetService } from "api/services/admin-users/request-password-reset.js";

const requestSchema = z.object({
	email: z.string().trim().toLowerCase().pipe(z.email()),
});

const GENERIC_MESSAGE =
	"If an account exists for this email, a reset link has been sent.";

export class AdminPasswordResetController {
	async request(req: Request, res: Response) {
		const parsed = requestSchema.safeParse(req.body);

		if (!parsed.success) {
			return res
				.status(400)
				.json({ message: "Error: A valid email is required." });
		}

		try {
			await new RequestPasswordResetService().request(parsed.data.email);
		} catch (error) {
			console.error("[password-reset] request failed", { error });
		}

		return res.status(202).json({ message: GENERIC_MESSAGE });
	}
}
