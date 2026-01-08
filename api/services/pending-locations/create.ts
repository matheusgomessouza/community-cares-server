import { PendingLocationsRepository } from "api/repositories/pending-locations-repository.js";

export class PendingLocationsCreateService {
	async createLocation(
		name: string,
		type: string,
		address: string,
		contact: string,
		coords: { latitude: number; longitude: number },
	) {
		try {
			const pendingLocationsRepository = new PendingLocationsRepository();

			const pendingLocation =
				await pendingLocationsRepository.createPendingLocation(
					name,
					type,
					address,
					contact,
					coords,
				);

			return {
				message: "Pending Location successfully created!",
				payload: pendingLocation,
			};
		} catch (error) {
			return {
				message: "Error: Could not create pending location.",
				payload: error,
			};
		}
	}
}
