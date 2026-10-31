export interface DetectedImage {
	extension: "jpg" | "png" | "webp";
	contentType: "image/jpeg" | "image/png" | "image/webp";
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * The browser sends the file type in the request, but the client controls that
 * value. The bytes decide the type, and the type decides the object extension.
 */
export function detectImageType(buffer: Buffer): DetectedImage | null {
	if (
		buffer.length >= 3 &&
		buffer[0] === 0xff &&
		buffer[1] === 0xd8 &&
		buffer[2] === 0xff
	) {
		return { extension: "jpg", contentType: "image/jpeg" };
	}

	if (
		buffer.length >= PNG_SIGNATURE.length &&
		PNG_SIGNATURE.every((byte, index) => buffer[index] === byte)
	) {
		return { extension: "png", contentType: "image/png" };
	}

	// WEBP is a RIFF container: "RIFF" at byte 0 and "WEBP" at byte 8.
	if (
		buffer.length >= 12 &&
		buffer.toString("ascii", 0, 4) === "RIFF" &&
		buffer.toString("ascii", 8, 12) === "WEBP"
	) {
		return { extension: "webp", contentType: "image/webp" };
	}

	return null;
}
