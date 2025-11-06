import { PendingLocationsRepository } from "api/repositories/pending-locations-repository.js";

export class PendingLocationsRetrieveService {
	async retrieveAllPendingLocations() {
		try {
			const pendingLocationsRepository = new PendingLocationsRepository();

			const pendingLocations =
				await pendingLocationsRepository.getAllPendingLocations();

			return {
				message: "Pending locations retrieved successfully",
				payload: pendingLocations,
			};
		} catch (error) {
			return {
				message: error instanceof Error ? error.message : String(error),
				payload: null,
			};
		}
	}
}
