import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { envs } from "env.js";

export interface ImageUpload {
	buffer: Buffer;
	extension: string;
	contentType: string;
}

export interface StorageService {
	uploadImage(image: ImageUpload): Promise<string>;
}

export class S3StorageService implements StorageService {
	private readonly client: S3Client;

	constructor(client?: S3Client) {
		this.client =
			client ??
			new S3Client({
				region: envs.AWS_REGION,
				credentials: {
					accessKeyId: envs.AWS_ACCESS_KEY_ID,
					secretAccessKey: envs.AWS_SECRET_ACCESS_KEY,
				},
			});
	}

	async uploadImage({ buffer, extension, contentType }: ImageUpload) {
		const key = `locations/${randomUUID()}.${extension}`;

		await this.client.send(
			new PutObjectCommand({
				Bucket: envs.S3_BUCKET,
				Key: key,
				Body: buffer,
				ContentType: contentType,
				// The key holds a UUID, so the bytes never change for a URL.
				CacheControl: "public, max-age=31536000, immutable",
			}),
		);

		return `${envs.S3_PUBLIC_BASE_URL.replace(/\/+$/, "")}/${key}`;
	}
}
