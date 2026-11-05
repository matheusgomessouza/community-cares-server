import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateResetToken, hashResetToken } from "api/lib/reset-token.js";
import {
	sendPasswordResetEmail,
	setMailTransport,
} from "api/lib/mailer.js";

const hoisted = vi.hoisted(() => {
	const tx = {
		adminPasswordResetToken: {
			findFirst: vi.fn(),
			updateMany: vi.fn(),
		},
		adminUser: {
			update: vi.fn(),
		},
	};

	return {
		tx,
		client: {
			adminPasswordResetToken: {
				create: vi.fn(),
				findFirst: vi.fn(),
				deleteMany: vi.fn(),
			},
			$transaction: vi.fn(
				async (
					callback: (transaction: typeof tx) => Promise<unknown>,
				) => callback(tx),
			),
		},
	};
});

vi.mock("@prisma/client", () => ({
	PrismaClient: class {
		adminPasswordResetToken = hoisted.client.adminPasswordResetToken;
		$transaction = hoisted.client.$transaction;
	},
}));

import { AdminPasswordResetTokensRepository } from "api/repositories/admin-password-reset-tokens-repository.js";

describe("mailer", () => {
	afterEach(() => {
		setMailTransport(null);
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it("logs the reset link when no transport is configured in development", async () => {
		vi.stubEnv("NODE_ENV", "development");
		const info = vi.spyOn(console, "info").mockImplementation(() => {});

		await sendPasswordResetEmail(
			"admin@example.com",
			"http://localhost:3000/reset-password?token=abc",
		);

		expect(info).toHaveBeenCalledWith(
			expect.stringContaining(
				"http://localhost:3000/reset-password?token=abc",
			),
		);
	});

	it("throws when no transport is configured in production", async () => {
		vi.stubEnv("NODE_ENV", "production");

		await expect(
			sendPasswordResetEmail(
				"admin@example.com",
				"http://localhost:3000/reset-password?token=abc",
			),
		).rejects.toThrow("No mail transport configured");
	});

	it("uses the configured transport", async () => {
		const send = vi.fn().mockResolvedValue(undefined);
		setMailTransport(send);

		await sendPasswordResetEmail(
			"admin@example.com",
			"http://localhost:3000/reset-password?token=abc",
		);

		expect(send).toHaveBeenCalledWith(
			expect.objectContaining({ to: "admin@example.com" }),
		);
	});
});

describe("reset token", () => {
	it("generates a 256-bit token and stores only its SHA-256 hash", () => {
		const { raw, hash } = generateResetToken();

		expect(raw).toHaveLength(43);
		expect(hash).toHaveLength(64);
		expect(hash).not.toBe(raw);
		expect(hashResetToken(raw)).toBe(hash);
	});
});

describe("AdminPasswordResetTokensRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("does not update a password when the token is not valid", async () => {
		hoisted.tx.adminPasswordResetToken.findFirst.mockResolvedValue(null);

		const repository = new AdminPasswordResetTokensRepository();
		const result = await repository.consumeAndUpdatePassword({
			tokenHash: "hash",
			hashedPassword: "argon2-hash",
			now: new Date("2026-11-05T12:00:00.000Z"),
		});

		expect(result).toBeNull();
		expect(hoisted.tx.adminUser.update).not.toHaveBeenCalled();
	});

	it("updates the password and invalidates the other tokens", async () => {
		const now = new Date("2026-11-05T12:00:00.000Z");
		hoisted.tx.adminPasswordResetToken.findFirst.mockResolvedValue({
			id: "token-1",
			adminUserId: 7,
		});
		hoisted.tx.adminPasswordResetToken.updateMany
			.mockResolvedValueOnce({ count: 1 })
			.mockResolvedValueOnce({ count: 0 });

		const repository = new AdminPasswordResetTokensRepository();
		const result = await repository.consumeAndUpdatePassword({
			tokenHash: "hash",
			hashedPassword: "argon2-hash",
			now,
		});

		expect(result).toEqual({ adminUserId: 7 });
		expect(hoisted.tx.adminUser.update).toHaveBeenCalledWith({
			where: { id: 7 },
			data: { password: "argon2-hash", passwordChangedAt: now },
		});
		expect(
			hoisted.tx.adminPasswordResetToken.updateMany,
		).toHaveBeenLastCalledWith({
			where: { adminUserId: 7, usedAt: null },
			data: { usedAt: now },
		});
	});

	it("does not update a password when another request consumed the token first", async () => {
		hoisted.tx.adminPasswordResetToken.findFirst.mockResolvedValue({
			id: "token-1",
			adminUserId: 7,
		});
		hoisted.tx.adminPasswordResetToken.updateMany.mockResolvedValueOnce({
			count: 0,
		});

		const repository = new AdminPasswordResetTokensRepository();
		const result = await repository.consumeAndUpdatePassword({
			tokenHash: "hash",
			hashedPassword: "argon2-hash",
			now: new Date("2026-11-05T12:00:00.000Z"),
		});

		expect(result).toBeNull();
		expect(hoisted.tx.adminUser.update).not.toHaveBeenCalled();
	});
});
