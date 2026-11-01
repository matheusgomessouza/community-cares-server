import { describe, expect, it } from "vitest";
import { detectImageType } from "./image.js";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG = Buffer.from([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
]);
const WEBP = Buffer.from([
	0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

describe("detectImageType", () => {
	it("detects a JPEG from the magic bytes", () => {
		expect(detectImageType(JPEG)).toEqual({
			extension: "jpg",
			contentType: "image/jpeg",
		});
	});

	it("detects a PNG from the magic bytes", () => {
		expect(detectImageType(PNG)).toEqual({
			extension: "png",
			contentType: "image/png",
		});
	});

	it("detects a WEBP from the RIFF header", () => {
		expect(detectImageType(WEBP)).toEqual({
			extension: "webp",
			contentType: "image/webp",
		});
	});

	it("rejects a GIF", () => {
		const gif = Buffer.from("GIF89a", "ascii");
		expect(detectImageType(gif)).toBeNull();
	});

	it("rejects a RIFF file that is not WEBP", () => {
		const wav = Buffer.from("RIFF0000WAVE", "ascii");
		expect(detectImageType(wav)).toBeNull();
	});

	it("rejects a buffer shorter than any signature", () => {
		expect(detectImageType(Buffer.from([0xff, 0xd8]))).toBeNull();
		expect(detectImageType(Buffer.alloc(0))).toBeNull();
	});
});
