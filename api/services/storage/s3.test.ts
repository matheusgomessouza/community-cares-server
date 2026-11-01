import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { S3StorageService } from "./s3.js";

vi.mock("env.js", () => ({
	envs: {
		AWS_REGION: "sa-east-1",
		AWS_ACCESS_KEY_ID: "test-key-id",
		AWS_SECRET_ACCESS_KEY: "test-secret",
		S3_BUCKET: "test-bucket",
		S3_PUBLIC_BASE_URL: "https://test-bucket.s3.sa-east-1.amazonaws.com/",
	},
}));

describe("S3StorageService", () => {
	const send = vi.fn();

	beforeEach(() => {
		send.mockReset();
		send.mockResolvedValue({});
	});

	function buildService() {
		return new S3StorageService({ send } as unknown as S3Client);
	}

	it("puts the image under locations/ with a UUID key", async () => {
		const buffer = Buffer.from("image-bytes");

		const url = await buildService().uploadImage({
			buffer,
			extension: "webp",
			contentType: "image/webp",
		});

		const command = send.mock.calls[0][0] as PutObjectCommand;

		expect(command.input).toMatchObject({
			Bucket: "test-bucket",
			Body: buffer,
			ContentType: "image/webp",
		});
		expect(command.input.Key).toMatch(/^locations\/[0-9a-f-]{36}\.webp$/);
		expect(url).toBe(
			`https://test-bucket.s3.sa-east-1.amazonaws.com/${command.input.Key}`,
		);
	});

	it("does not double the slash of the base URL", async () => {
		const url = await buildService().uploadImage({
			buffer: Buffer.from("x"),
			extension: "png",
			contentType: "image/png",
		});

		expect(url).not.toContain("amazonaws.com//locations/");
	});
});
