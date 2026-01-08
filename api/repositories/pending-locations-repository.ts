import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class PendingLocationsRepository {
	async deletePendingLocationById(id: number) {
		await prisma.pendingLocations.delete({
			where: { id },
		});
	}

	async getAllPendingLocations() {
		return await prisma.pendingLocations.findMany();
	}

	async createPendingLocation(
		name: string,
		type: string,
		address: string,
		contact: string,
		coords: {
			latitude: number;
			longitude: number;
		},
	) {
		await prisma.pendingLocations.create({
			data: {
				name,
				type,
				address,
				contact,
				coords,
			},
		});
	}
}
