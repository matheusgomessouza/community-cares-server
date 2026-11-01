import { describe, expect, it, vi } from "vitest";
import { isStoredImageUrl } from "./stored-image-url.js";

vi.mock("env.js", () => ({
	envs: {
		S3_PUBLIC_BASE_URL: "https://bucket.s3.sa-east-1.amazonaws.com/",
	},
}));

describe("isStoredImageUrl", () => {
	it("accepts a URL under locations/", () => {
		expect(
			isStoredImageUrl(
				"https://bucket.s3.sa-east-1.amazonaws.com/locations/a.webp",
			),
		).toBe(true);
	});

	it("rejects a URL from another host", () => {
		expect(isStoredImageUrl("https://evil.example/locations/a.webp")).toBe(
			false,
		);
	});

	it("rejects a bucket URL outside locations/", () => {
		expect(
			isStoredImageUrl(
				"https://bucket.s3.sa-east-1.amazonaws.com/private/a",
			),
		).toBe(false);
	});

	it("rejects a value that is not a string", () => {
		expect(isStoredImageUrl(undefined)).toBe(false);
		expect(isStoredImageUrl(null)).toBe(false);
		expect(isStoredImageUrl(10)).toBe(false);
	});
});
