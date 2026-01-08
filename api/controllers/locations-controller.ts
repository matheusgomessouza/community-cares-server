import * as jose from "jose";
import { Request, Response } from "express";
import { LocationsRetrieveService } from "api/services/locations/retrieve.js";
import { LocationsCreateService } from "api/services/locations/create.js";
import { LocationsUpdateService } from "api/services/locations/update.js";

export class LocationsController {
	async getLocations(res: Response) {
		try {
			const locationsRetrieveService = new LocationsRetrieveService();
			const response =
				await locationsRetrieveService.retrieveAllLocations();

			res.status(200).json({
				message: response.message,
				payload: response.payload,
			});
		} catch (error) {
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
			await jose.jwtVerify(access_token, secret, {
				algorithms: ["HS256"],
			});

			const locationsCreateService = new LocationsCreateService();
			const response = await locationsCreateService.createLocation(
				id,
				name,
				type,
				address,
				contact,
				coords,
			);
			res.status(201).json({
				message: response.message,
				payload: response.payload,
			});
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

			const locationsUpdateService = new LocationsUpdateService();
			const response = await locationsUpdateService.updateLocation(field);

			res.status(200).json({
				message: response.message,
				payload: response.payload,
			});
		} catch (error) {
			res.status(500).json({
				message: "Error on trying updating location data",
				messageError: error,
			});
		}
	}
}
