import express, { NextFunction, Request, Response } from "express";
import multer, { MulterError } from "multer";
import { UploadsController } from "../controllers/uploads-controller.js";

const router = express.Router();
const uploadsController = new UploadsController();

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
});

/**
 * Reject a request with no credential before multer buffers the file. The
 * token or the session cookie is checked in the controller, after the parse.
 */
function requireCredentials(req: Request, res: Response, next: NextFunction) {
	if (!req.headers.authorization && !req.headers.cookie) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	next();
}

function parseImage(req: Request, res: Response, next: NextFunction) {
	upload.single("image")(req, res, (error: unknown) => {
		if (error instanceof MulterError) {
			return res.status(400).json({
				message:
					error.code === "LIMIT_FILE_SIZE"
						? "Error: image must be 10 MB or smaller."
						: "Error: invalid image upload.",
			});
		}

		if (error) {
			return res.status(400).json({
				message: "Error: invalid image upload.",
			});
		}

		next();
	});
}

/**
 * @swagger
 * /uploads:
 *   post:
 *     summary: Upload an establishment image to S3
 *     tags: [Uploads]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: false
 *         schema:
 *           type: string
 *         description: Bearer token from GitHub or Google. Omit it to use the session cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               provider:
 *                 type: string
 *                 enum: [github, google]
 *                 description: Required only with a Bearer token.
 *     responses:
 *       201:
 *         description: The public URL of the stored image.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *       400:
 *         description: Missing file, unsupported format or file above 10 MB
 *       401:
 *         description: Unauthorized or token expired
 *       500:
 *         description: S3 rejected the upload
 */
router.post(
	"/",
	requireCredentials,
	parseImage,
	async (req: Request, res: Response) => {
		await uploadsController.uploadImage(req, res);
	},
);

export default router;
