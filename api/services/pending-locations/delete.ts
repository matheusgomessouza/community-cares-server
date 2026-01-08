import { PendingLocationsRepository } from "api/repositories/pending-locations-repository.js";

export class PendingLocationsDeleteService {
	async deletePendingLocationById(id: number) {
		try {
			const pendingLocationsRepository = new PendingLocationsRepository();

			await pendingLocationsRepository.deletePendingLocationById(id);

			return {
				message: "Pending Location successfully deleted!",
				payload: null,
			};
		} catch (error) {
			return {
				message: error instanceof Error ? error.message : String(error),
				payload: null,
			};
		}
	}
}
