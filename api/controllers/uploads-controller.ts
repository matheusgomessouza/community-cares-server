import { Request, Response } from "express";
import { detectImageType } from "api/lib/image.js";
import { getBearerToken, hasValidSession } from "api/lib/session.js";
import {
	validateGithubToken,
	validateGoogleToken,
} from "api/middleware/token-validation.js";
import { S3StorageService, StorageService } from "api/services/storage/s3.js";

export class UploadsController {
	constructor(
		private readonly storageService: StorageService = new S3StorageService(),
	) {}

	async uploadImage(req: Request, res: Response) {
		const file = req.file;

		if (!file) {
			return res.status(400).json({
				message: "Error: image file is required.",
			});
		}

		const imageType = detectImageType(file.buffer);

		if (!imageType) {
			return res.status(400).json({
				message: "Error: image must be JPEG, PNG or WEBP.",
			});
		}

		const access_token = getBearerToken(req);
		const hasSession = access_token ? false : await hasValidSession(req);

		if (!access_token && !hasSession) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		if (access_token) {
			const { provider } = req.body ?? {};

			if (provider !== "github" && provider !== "google") {
				return res.status(400).json({
					message: "Error: provider must be github or google.",
				});
			}

			const tokenValidity =
				provider === "github"
					? await validateGithubToken(access_token)
					: await validateGoogleToken(access_token);

			if (tokenValidity !== 200) {
				return res.status(401).json({
					message:
						"Error: could not upload the image. | Token expired",
				});
			}
		}

		try {
			const url = await this.storageService.uploadImage({
				buffer: file.buffer,
				extension: imageType.extension,
				contentType: imageType.contentType,
			});

			return res.status(201).json({ url });
		} catch (error) {
			console.error(
				"Unable to upload the image to S3",
				error instanceof Error ? error.message : "unknown error",
			);
			return res.status(500).json({
				message: "Error: could not upload the image.",
			});
		}
	}
}
