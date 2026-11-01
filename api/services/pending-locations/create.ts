import { PendingLocationsRepository } from "api/repositories/pending-locations-repository.js";

export class PendingLocationsCreateService {
	async createLocation(
		name: string,
		type: string,
		address: string,
		contact: string,
		coords: { latitude: number; longitude: number },
		image_url?: string,
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
					image_url,
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
