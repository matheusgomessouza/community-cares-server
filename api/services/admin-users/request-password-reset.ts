import { envs } from "env.js";
import { logger } from "api/lib/logger.js";

import { sendPasswordResetEmail } from "api/lib/mailer.js";
import { generateResetToken } from "api/lib/reset-token.js";
import { AdminPasswordResetTokensRepository } from "api/repositories/admin-password-reset-tokens-repository.js";
import { AdminUsersRepository } from "api/repositories/admin-users-repository.js";

function maskEmail(email: string) {
	const [localPart, domain] = email.split("@");

	if (!domain) return "***";

	return `${localPart.slice(0, 1)}***@${domain}`;
}

export class RequestPasswordResetService {
	async request(email: string): Promise<void> {
		const normalizedEmail = email.trim().toLowerCase();
		const adminUsersRepository = new AdminUsersRepository();
		const tokensRepository = new AdminPasswordResetTokensRepository();

		const users = await adminUsersRepository.findManyByEmail(
			normalizedEmail,
			2,
		);

		if (users.length > 1) {
			logger.warn(
				{ email: maskEmail(normalizedEmail) },
				"[password-reset] duplicate email, request ignored",
			);
			return;
		}

		if (users.length === 0) return;

		const user = users[0];
		const now = new Date();
		const ttlMinutes = envs.PASSWORD_RESET_TOKEN_TTL_MINUTES;
		const expiresAt = new Date(now.getTime() + ttlMinutes * 60_000);

		await tokensRepository.deleteExpired(now);
		await tokensRepository.deleteActiveForUser(user.id);

		const { raw, hash } = generateResetToken();

		await tokensRepository.create({
			tokenHash: hash,
			adminUserId: user.id,
			expiresAt,
		});

		const baseUrl = envs.ADMIN_FRONTEND_URL.replace(/\/$/, "");
		const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(raw)}`;

		try {
			await sendPasswordResetEmail(user.email, resetUrl, ttlMinutes);
		} catch (error) {
			logger.error(
				{
					err: error,
					email: maskEmail(user.email),
				},
				"[password-reset] unable to send email",
			);
		}
	}
}
