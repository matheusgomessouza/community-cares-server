import type { Express } from "express";
import request from "supertest";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

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

	const client = {
		adminUser: {
			create: vi.fn(),
			findMany: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
		},
		adminPasswordResetToken: {
			create: vi.fn(),
			findFirst: vi.fn(),
			deleteMany: vi.fn(),
		},
		locations: {
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
		pendingLocations: {
			findMany: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
		},
		$transaction: vi.fn(
			async (callback: (transaction: typeof tx) => Promise<unknown>) =>
				callback(tx),
		),
	};

	return {
		tx,
		client,
		argon2Verify: vi.fn(),
		argon2Hash: vi.fn(),
	};
});

vi.mock("env.js", () => ({
	envs: {
		AUTH_SECRET_KEY: "test-secret",
		DATABASE_URL: "postgres://test:test@localhost:5432/test",
		GITHUB_CLIENT_ID: "test-client-id",
		GITHUB_CLIENT_SECRET: "test-client-secret",
		GITHUB_CLIENT_ID_WEB_DEV: "test-web-dev-id",
		GITHUB_CLIENT_SECRET_WEB_DEV: "test-web-dev-secret",
		GOOGLE_CLIENT_ID: "test-google-id",
		GOOGLE_REDIRECT_URI: "http://localhost:3000",
		GOOGLE_SECRET: "test-google-secret",
		REFRESH_SECRET_KEY: "test-refresh-secret",
		FRONTEND_ORIGIN: "http://localhost:3000",
		ADMIN_FRONTEND_URL: "http://localhost:3000",
		PASSWORD_RESET_TOKEN_TTL_MINUTES: 30,
	},
}));

vi.mock("@prisma/client", () => ({
	PrismaClient: class {
		adminUser = hoisted.client.adminUser;
		adminPasswordResetToken = hoisted.client.adminPasswordResetToken;
		locations = hoisted.client.locations;
		pendingLocations = hoisted.client.pendingLocations;
		$transaction = hoisted.client.$transaction;
	},
}));

vi.mock("argon2", () => ({
	default: {
		verify: hoisted.argon2Verify,
		hash: hoisted.argon2Hash,
	},
}));

import { AdminPasswordResetTokensRepository } from "api/repositories/admin-password-reset-tokens-repository.js";

let app: Express;

beforeAll(async () => {
	process.env.AUTH_SECRET_KEY = "test-secret";
	const module = await import("./index.js");
	app = module.app;
});

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

describe("POST /admin-users/password-reset/request", () => {
	const genericMessage =
		"If an account exists for this email, a reset link has been sent.";

	beforeEach(() => {
		vi.clearAllMocks();
		setMailTransport(null);
		hoisted.client.adminPasswordResetToken.create.mockResolvedValue({});
		hoisted.client.adminPasswordResetToken.deleteMany.mockResolvedValue({
			count: 0,
		});
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it("returns 202 and sends a link for an existing email", async () => {
		hoisted.client.adminUser.findMany.mockResolvedValue([
			{ id: 1, email: "admin@example.com" },
		]);
		const send = vi.fn().mockResolvedValue(undefined);
		setMailTransport(send);

		const response = await request(app)
			.post("/admin-users/password-reset/request")
			.send({ email: "Admin@Example.com" });

		expect(response.status).toBe(202);
		expect(response.body).toEqual({ message: genericMessage });
		expect(send).toHaveBeenCalledTimes(1);
		expect(hoisted.client.adminUser.findMany).toHaveBeenCalledWith({
			where: {
				email: { equals: "admin@example.com", mode: "insensitive" },
			},
			take: 2,
		});

		const mail = send.mock.calls[0][0];
		expect(mail.to).toBe("admin@example.com");
		expect(mail.text).toContain(
			"http://localhost:3000/reset-password?token=",
		);

		const rawToken = mail.text.match(/token=([^\s]+)/)?.[1];
		expect(rawToken).toBeTruthy();
		expect(hoisted.client.adminPasswordResetToken.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				adminUserId: 1,
				tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
			}),
		});
		expect(
			hoisted.client.adminPasswordResetToken.create.mock.calls[0][0].data
				.tokenHash,
		).not.toBe(rawToken);
	});

	it("returns 202 and sends nothing for an unknown email", async () => {
		hoisted.client.adminUser.findMany.mockResolvedValue([]);
		const send = vi.fn().mockResolvedValue(undefined);
		setMailTransport(send);

		const response = await request(app)
			.post("/admin-users/password-reset/request")
			.send({ email: "nobody@example.com" });

		expect(response.status).toBe(202);
		expect(response.body).toEqual({ message: genericMessage });
		expect(send).not.toHaveBeenCalled();
		expect(
			hoisted.client.adminPasswordResetToken.create,
		).not.toHaveBeenCalled();
	});

	it("fails closed when more than one account shares the email", async () => {
		hoisted.client.adminUser.findMany.mockResolvedValue([
			{ id: 1, email: "admin@example.com" },
			{ id: 2, email: "admin@example.com" },
		]);
		const send = vi.fn().mockResolvedValue(undefined);
		setMailTransport(send);
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		const response = await request(app)
			.post("/admin-users/password-reset/request")
			.send({ email: "admin@example.com" });

		expect(response.status).toBe(202);
		expect(send).not.toHaveBeenCalled();
		expect(
			hoisted.client.adminPasswordResetToken.create,
		).not.toHaveBeenCalled();
		expect(warn).toHaveBeenCalled();
	});

	it("returns 400 for an invalid email", async () => {
		const response = await request(app)
			.post("/admin-users/password-reset/request")
			.send({ email: "not-an-email" });

		expect(response.status).toBe(400);
		expect(hoisted.client.adminUser.findMany).not.toHaveBeenCalled();
	});

	it("returns 202 when the mail transport fails", async () => {
		hoisted.client.adminUser.findMany.mockResolvedValue([
			{ id: 1, email: "admin@example.com" },
		]);
		setMailTransport(vi.fn().mockRejectedValue(new Error("smtp down")));
		const error = vi.spyOn(console, "error").mockImplementation(() => {});

		const response = await request(app)
			.post("/admin-users/password-reset/request")
			.send({ email: "admin@example.com" });

		expect(response.status).toBe(202);
		expect(response.body).toEqual({ message: genericMessage });
		expect(error).toHaveBeenCalled();
	});
});
