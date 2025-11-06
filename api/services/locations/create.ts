import { LocationsRepository } from "api/repositories/locations-repository.js";
import { PendingLocationsRepository } from "api/repositories/pending-locations-repository.js";

export class LocationsCreateService {
	async createLocation(
		id: string,
		name: string,
		type: string,
		address: string,
		contact: string,
		coords: { latitude: number; longitude: number },
	) {
		try {
			const locationsRepository = new LocationsRepository();
			const pendingLocationsRepository = new PendingLocationsRepository();
			const location = await locationsRepository.createLocation(
				name,
				type,
				address,
				contact,
				coords,
			);

			await pendingLocationsRepository.deletePendingLocationById(
				Number(id),
			);

			return {
				message: "Location created successfully",
				payload: location,
			};
		} catch (error) {
			return {
				message: error instanceof Error ? error.message : String(error),
				payload: null,
			};
		}
	}
}
