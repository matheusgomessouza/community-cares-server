import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
	fetch: vi.fn(),
}));

vi.mock("node-fetch", () => ({ default: hoisted.fetch }));

vi.mock("env.js", () => ({
	envs: {
		GITHUB_CLIENT_ID: " mobile-client-id ",
		GITHUB_CLIENT_SECRET: " mobile-client-secret ",
		GITHUB_CLIENT_ID_WEB_DEV: " web-dev-client-id ",
		GITHUB_CLIENT_SECRET_WEB_DEV: " web-dev-client-secret ",
		GITHUB_CLIENT_ID_WEB_PRD: " prd-client-id ",
		GITHUB_CLIENT_SECRET_WEB_PRD: " prd-client-secret ",
	},
}));

import { exchangeCodeGithub } from "./github.js";

function sentParams() {
	const [, options] = hoisted.fetch.mock.calls.at(-1) as [
		string,
		{ body: string },
	];
	return new URLSearchParams(options.body);
}

function reply(status: number, body: unknown, statusText = "") {
	hoisted.fetch.mockResolvedValue({
		status,
		statusText,
		json: async () => body,
	});
}

describe("exchangeCodeGithub", () => {
	const originalNodeEnv = process.env.NODE_ENV;

	beforeEach(() => {
		hoisted.fetch.mockReset();
	});

	afterEach(() => {
		process.env.NODE_ENV = originalNodeEnv;
	});

	it("uses the web production app and trims the pasted values", async () => {
		process.env.NODE_ENV = "production";
		reply(200, { access_token: "token" });

		await exchangeCodeGithub("code", "", "web");

		const params = sentParams();
		expect(params.get("client_id")).toBe("prd-client-id");
		expect(params.get("client_secret")).toBe("prd-client-secret");
	});

	it("uses the web development app outside production", async () => {
		process.env.NODE_ENV = "test";
		reply(200, { access_token: "token" });

		await exchangeCodeGithub("code", "", "web");

		const params = sentParams();
		expect(params.get("client_id")).toBe("web-dev-client-id");
		expect(params.get("client_secret")).toBe("web-dev-client-secret");
	});

	it("uses the mobile app when env is not web", async () => {
		process.env.NODE_ENV = "production";
		reply(200, { access_token: "token" });

		await exchangeCodeGithub("code", "", "mobile");

		expect(sentParams().get("client_id")).toBe("mobile-client-id");
	});

	it("names the client id prefix when GitHub returns 404", async () => {
		process.env.NODE_ENV = "production";
		reply(404, { error: "Not Found" }, "Not Found");

		await expect(exchangeCodeGithub("code", "", "web")).rejects.toThrow(
			/client_id prd-cl\.\.\. \(13 chars\)/,
		);
	});

	it("returns the body when GitHub accepts the code", async () => {
		process.env.NODE_ENV = "production";
		reply(200, { access_token: "token-123" });

		await expect(exchangeCodeGithub("code", "", "web")).resolves.toEqual({
			access_token: "token-123",
		});
	});
});
