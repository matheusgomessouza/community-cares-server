import { afterEach, describe, expect, it, vi } from "vitest";

const order = vi.hoisted(() => [] as string[]);

vi.mock("./bootstrap.js", () => ({
	loadSecrets: vi.fn(async () => {
		order.push("secrets");
	}),
}));

vi.mock("./api/index.js", () => {
	order.push("app");
	return {};
});

describe("server entry", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("loads the secrets before the app module evaluates", async () => {
		process.env.NODE_ENV = "production";

		await import("./server.js");

		expect(order).toEqual(["secrets", "app"]);
	});
});
