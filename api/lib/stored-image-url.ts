import { envs } from "env.js";

/**
 * A client can send any string as image_url. Only a URL under the bucket that
 * POST /uploads writes to is accepted, so the database cannot hold a foreign
 * URL that the client never uploaded.
 */
export function isStoredImageUrl(value: unknown): value is string {
	if (typeof value !== "string") {
		return false;
	}

	const base = envs.S3_PUBLIC_BASE_URL.replace(/\/+$/, "");

	return value.startsWith(`${base}/locations/`);
}
