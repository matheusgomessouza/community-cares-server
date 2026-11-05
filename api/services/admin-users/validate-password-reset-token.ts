import { hashResetToken } from "api/lib/reset-token.js";
import { AdminPasswordResetTokensRepository } from "api/repositories/admin-password-reset-tokens-repository.js";

export class ValidatePasswordResetTokenService {
	async validate(rawToken: string): Promise<{ expiresAt: Date } | null> {
		if (!rawToken) return null;

		const tokensRepository = new AdminPasswordResetTokensRepository();
		const token = await tokensRepository.findValidByHash(
			hashResetToken(rawToken),
		);

		if (!token) return null;

		return { expiresAt: token.expiresAt };
	}
}
