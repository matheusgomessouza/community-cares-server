import argon2 from "argon2";

import { hashResetToken } from "api/lib/reset-token.js";
import { AdminPasswordResetTokensRepository } from "api/repositories/admin-password-reset-tokens-repository.js";
import { AdminUsersRepository } from "api/repositories/admin-users-repository.js";
import { RefreshTokensRepository } from "api/repositories/refresh-tokens-repository.js";

export class ResetPasswordService {
	async reset(rawToken: string, newPassword: string): Promise<boolean> {
		const tokensRepository = new AdminPasswordResetTokensRepository();
		const tokenHash = hashResetToken(rawToken);

		const token = await tokensRepository.findValidByHash(tokenHash);

		if (!token) return false;

		const hashedPassword = await argon2.hash(newPassword);
		const result = await tokensRepository.consumeAndUpdatePassword({
			tokenHash,
			hashedPassword,
			now: new Date(),
		});

		if (result === null) return false;

		const user = await new AdminUsersRepository().findById(
			result.adminUserId,
		);

		if (user) {
			await new RefreshTokensRepository().revokeAllForUser(user.username);
		}

		return true;
	}
}
