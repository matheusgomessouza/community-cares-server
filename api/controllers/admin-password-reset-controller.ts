import { Request, Response } from "express";
import { z } from "zod";

import { RequestPasswordResetService } from "api/services/admin-users/request-password-reset.js";
import { ValidatePasswordResetTokenService } from "api/services/admin-users/validate-password-reset-token.js";

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

	async validate(req: Request, res: Response) {
		const rawToken =
			typeof req.query.token === "string" ? req.query.token : "";

		try {
			const result =
				await new ValidatePasswordResetTokenService().validate(rawToken);

			if (!result) {
				return res
					.status(400)
					.json({ message: "Invalid or expired reset link." });
			}

			return res.status(200).json({
				valid: true,
				expiresAt: result.expiresAt.toISOString(),
			});
		} catch (error) {
			console.error("[password-reset] validation failed", { error });

			return res
				.status(400)
				.json({ message: "Invalid or expired reset link." });
		}
	}
}
