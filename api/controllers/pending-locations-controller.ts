import * as jose from "jose";
import { Request, Response } from "express";
import { PendingLocationsRepository } from "api/repositories/pending-locations-repository.js";
import {
	validateGithubToken,
	validateGoogleToken,
} from "api/middleware/token-validation.js";

export class PendingLocationsController {
	async getAllPendingLocations(req: Request, res: Response) {
		try {
			const pendingLocationsRepository = new PendingLocationsRepository();

			const pendingLocations =
				await pendingLocationsRepository.getAllPendingLocations();
			res.status(200).json(pendingLocations);
		} catch (error) {
			console.error(
				"Error on trying to retrieve pendingLocations:",
				error,
			);
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
				const pendingLocationsRepository =
					new PendingLocationsRepository();
				await pendingLocationsRepository.createPendingLocation(
					name,
					type,
					address,
					contact,
					coords,
				);
				res.status(200).json({
					message: "Pending Location successfully created!",
				});
			} catch (error) {
				console.error("Error on trying creating a location:", error);
				res.status(500).json({
					message:
						error instanceof Error ? error.message : String(error),
				});
			}
		} else {
			res.status(401).json({
				message: "Unable to perform query | Token expired",
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
			const pendingLocationsRepository = new PendingLocationsRepository();

			await pendingLocationsRepository.deletePendingLocationById(
				Number(id),
			);
			res.status(200).json({
				message: "Pending Location successfully deleted!",
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
