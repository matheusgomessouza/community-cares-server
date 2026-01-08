import { LocationsRepository } from "api/repositories/locations-repository.js";

export class LocationsUpdateService {
	async updateLocation(field: { id: number; type: string; info: string }) {
		try {
			const locationsRepository = new LocationsRepository();

			const location = await locationsRepository.updateLocation(field);

			return {
				message: "Location information successfully updated!",
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
