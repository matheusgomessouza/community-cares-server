import * as jose from "jose";
import { Request, Response } from "express";
import {
	validateGithubToken,
	validateGoogleToken,
} from "api/middleware/token-validation.js";
import { PendingLocationsCreateService } from "api/services/pending-locations/create.js";
import { PendingLocationsRetrieveService } from "api/services/pending-locations/retrieve.js";
import { PendingLocationsDeleteService } from "api/services/pending-locations/delete.js";

export class PendingLocationsController {
	async getAllPendingLocations(_: Request, res: Response) {
		try {
			const pendingLocationsRetrieveService =
				new PendingLocationsRetrieveService();
			const response =
				await pendingLocationsRetrieveService.retrieveAllPendingLocations();
			res.status(200).json({
				message: response.message,
				payload: response.payload,
			});
		} catch (error) {
			res.status(500).json({
				message: error instanceof Error ? error.message : error,
			});
		}
	}

	async createPendingLocation(req: Request, res: Response) {
		const { name, type, address, contact, coords, provider } = req.body;

		if (
			!req.headers.authorization ||
			!req.headers.authorization.startsWith("Bearer ")
		) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const access_token = req.headers.authorization.split(" ")[1];

		const tokenValidity =
			provider === "github"
				? await validateGithubToken(access_token)
				: await validateGoogleToken(access_token);

		if (tokenValidity === 200) {
			try {
				const pendingLocationsCreateService =
					new PendingLocationsCreateService();

				const response =
					await pendingLocationsCreateService.createLocation(
						name,
						type,
						address,
						contact,
						coords,
					);
				res.status(200).json({
					message: response.message,
					payload: response.payload,
				});
			} catch (error) {
				res.status(500).json({
					message:
						error instanceof Error ? error.message : String(error),
				});
			}
		} else {
			res.status(401).json({
				message:
					"Error: Could not create pending location. | Token expired",
			});
		}
	}

	async deletePendingLocation(req: Request, res: Response) {
		const id = req.params.id;

		if (
			!req.headers.authorization ||
			!req.headers.authorization.startsWith("Bearer ")
		) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const access_token = req.headers.authorization.split(" ")[1];

		const secret = new TextEncoder().encode(process.env.AUTH_SECRET_KEY);

		try {
			await jose.jwtVerify(access_token, secret, {
				algorithms: ["HS256"],
			});
			const pendingLocationsDeleteService =
				new PendingLocationsDeleteService();
			const response =
				await pendingLocationsDeleteService.deletePendingLocationById(
					Number(id),
				);
			res.status(200).json({
				message: response.message,
				payload: response.payload,
			});
		} catch (error) {
			if (error instanceof jose.errors.JWTExpired) {
				console.error(
					"Error on trying deleting a pending location | JWT is expired",
					error,
				);
				res.status(500).json({
					message: error.message || String(error),
				});
			} else {
				console.error(
					"Error on trying deleting a pending location | JWT verification failed or delete error:",
					error,
				);
				return res.status(500).json({
					message:
						error instanceof Error ? error.message : String(error),
				});
			}
		}
	}
}
