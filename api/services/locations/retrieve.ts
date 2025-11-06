import { LocationsRepository } from "api/repositories/locations-repository.js";

export class LocationsRetrieveService {
	async retrieveAllLocations() {
		try {
			const locationsRepository = new LocationsRepository();

			const locations = await locationsRepository.getAllLocations();

			return {
				message: "Locations retrieved successfully",
				payload: locations,
			};
		} catch (error) {
			return {
				message: error instanceof Error ? error.message : String(error),
				payload: null,
			};
		}
	}
}
