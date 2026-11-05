import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class AdminPasswordResetTokensRepository {
	async create(input: {
		tokenHash: string;
		adminUserId: number;
		expiresAt: Date;
	}) {
		await prisma.adminPasswordResetToken.create({ data: input });
	}

	async findValidByHash(tokenHash: string) {
		return await prisma.adminPasswordResetToken.findFirst({
			where: {
				tokenHash,
				usedAt: null,
				expiresAt: { gt: new Date() },
			},
		});
	}

	async deleteActiveForUser(adminUserId: number) {
		await prisma.adminPasswordResetToken.deleteMany({
			where: { adminUserId, usedAt: null },
		});
	}

	async deleteExpired(now: Date) {
		await prisma.adminPasswordResetToken.deleteMany({
			where: { expiresAt: { lt: now } },
		});
	}

	async consumeAndUpdatePassword(input: {
		tokenHash: string;
		hashedPassword: string;
		now: Date;
	}): Promise<{ adminUserId: number } | null> {
		return await prisma.$transaction(async (transaction) => {
			const token = await transaction.adminPasswordResetToken.findFirst({
				where: {
					tokenHash: input.tokenHash,
					usedAt: null,
					expiresAt: { gt: input.now },
				},
			});

			if (!token) return null;

			const consumed =
				await transaction.adminPasswordResetToken.updateMany({
					where: { id: token.id, usedAt: null },
					data: { usedAt: input.now },
				});

			if (consumed.count !== 1) return null;

			await transaction.adminUser.update({
				where: { id: token.adminUserId },
				data: {
					password: input.hashedPassword,
					passwordChangedAt: input.now,
				},
			});

			await transaction.adminPasswordResetToken.updateMany({
				where: { adminUserId: token.adminUserId, usedAt: null },
				data: { usedAt: input.now },
			});

			return { adminUserId: token.adminUserId };
		});
	}
}
