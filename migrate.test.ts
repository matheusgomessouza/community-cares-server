import { afterEach, describe, expect, it, vi } from "vitest";

const order = vi.hoisted(() => [] as string[]);

vi.mock("./bootstrap.js", () => ({
	loadSecrets: vi.fn(async () => {
		order.push("secrets");
	}),
}));

vi.mock("node:child_process", () => ({
	spawnSync: vi.fn(() => {
		order.push("migrate");
		return { status: 0 };
	}),
}));

describe("migrate entry", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("loads the secrets before prisma runs", async () => {
		process.env.NODE_ENV = "production";

		await import("./migrate.js");

		expect(order).toEqual(["secrets", "migrate"]);
	});
});
