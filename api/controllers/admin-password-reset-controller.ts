import { Request, Response } from "express";
import { z } from "zod";

import { logger } from "api/lib/logger.js";
import { RequestPasswordResetService } from "api/services/admin-users/request-password-reset.js";
import { ResetPasswordService } from "api/services/admin-users/reset-password.js";
import { ValidatePasswordResetTokenService } from "api/services/admin-users/validate-password-reset-token.js";

const requestSchema = z.object({
	email: z.string().trim().toLowerCase().pipe(z.email()),
});

const confirmSchema = z.object({
	token: z.string().min(1),
	password: z.string().min(8).max(128),
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
			logger.error({ err: error }, "[password-reset] request failed");
		}

		return res.status(202).json({ message: GENERIC_MESSAGE });
	}

	async validate(req: Request, res: Response) {
		const rawToken =
			typeof req.query.token === "string" ? req.query.token : "";

		try {
			const result =
				await new ValidatePasswordResetTokenService().validate(
					rawToken,
				);

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
			logger.error({ err: error }, "[password-reset] validation failed");

			return res
				.status(400)
				.json({ message: "Invalid or expired reset link." });
		}
	}

	async confirm(req: Request, res: Response) {
		const parsed = confirmSchema.safeParse(req.body);

		if (!parsed.success) {
			return res.status(400).json({
				message: "Error: Password must have at least 8 characters.",
			});
		}

		try {
			const updated = await new ResetPasswordService().reset(
				parsed.data.token,
				parsed.data.password,
			);

			if (!updated) {
				return res
					.status(400)
					.json({ message: "Invalid or expired reset link." });
			}

			return res.status(200).json({
				message: "Password updated. Sign in with your new password.",
			});
		} catch (error) {
			logger.error({ err: error }, "[password-reset] confirm failed");

			return res
				.status(400)
				.json({ message: "Invalid or expired reset link." });
		}
	}
}
