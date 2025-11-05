import * as jose from "jose";
import { Request, Response } from "express";
import { LocationsRepository } from "api/repositories/locations-repository.js";
import { PendingLocationsRepository } from "api/repositories/pending-locations-repository.js";

export class LocationsController {
	async getLocations(res: Response) {
		try {
			const locationsRepository = new LocationsRepository();
			const locations = await locationsRepository.getAllLocations();

			res.status(200).json(locations);
		} catch (error) {
			console.error("Error on trying to retrieve locations:", error);
			res.status(500).json({ message: error });
		}
	}

	async createLocation(req: Request, res: Response) {
		const { id, name, type, address, contact, coords } = req.body;

		if (
			!req.headers.authorization ||
			!req.headers.authorization.startsWith("Bearer ")
		) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const access_token = req.headers.authorization.split(" ")[1];

		const secret = new TextEncoder().encode(process.env.AUTH_SECRET_KEY);

		try {
			const locationsRepository = new LocationsRepository();
			const pendingLocationsRepository = new PendingLocationsRepository();

			await jose.jwtVerify(access_token, secret, {
				algorithms: ["HS256"],
			});

			await locationsRepository.createLocation(
				name,
				type,
				address,
				contact,
				coords,
			);

			await pendingLocationsRepository.deletePendingLocationById(id);
			res.status(201).json({ message: "Location successfully created!" });
		} catch (error) {
			res.status(500).json({
				message: "Error on trying creating a location",
				messageError: error,
			});
		}
	}

	async updateLocation(req: Request, res: Response) {
		const { field } = req.body;

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

			const locationsRepository = new LocationsRepository();

			await locationsRepository.updateLocation(field);

			res.status(200).json({
				message: "Location information successfully updated!",
			});
		} catch (error) {
			res.status(500).json({
				message: "Error on trying updating location data",
				messageError: error,
			});
		}
	}
}
