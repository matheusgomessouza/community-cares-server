import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadSecrets } from "./bootstrap.js";

const { getAccessToken, getClient } = vi.hoisted(() => ({
	getAccessToken: vi.fn(),
	getClient: vi.fn(),
}));

vi.mock("google-auth-library", () => ({
	GoogleAuth: vi.fn(() => ({ getClient })),
}));

function secretResponse(value: string) {
	return {
		ok: true,
		json: async () => ({
			payload: { data: Buffer.from(value).toString("base64") },
		}),
	};
}

describe("loadSecrets", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.clearAllMocks();
		getClient.mockResolvedValue({ getAccessToken });
		getAccessToken.mockResolvedValue({ token: "access-token" });
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("writes every secret into process.env", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => secretResponse("value-from-gcp")),
		);

		await loadSecrets();

		expect(process.env.AUTH_SECRET_KEY).toBe("value-from-gcp");
		expect(process.env.DATABASE_URL).toBe("value-from-gcp");
		expect(process.env.GOOGLE_SECRET).toBe("value-from-gcp");
	});

	it("throws when Secret Manager rejects the read", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => ({ ok: false, status: 403 })),
		);

		await expect(loadSecrets()).rejects.toThrow("HTTP 403");
	});

	it("throws when a secret is still a placeholder", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => secretResponse("__unset__")),
		);

		await expect(loadSecrets()).rejects.toThrow("placeholder");
	});
});
