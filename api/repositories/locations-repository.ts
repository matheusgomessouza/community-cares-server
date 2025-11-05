import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class LocationsRepository {
	async getAllLocations() {
		return await prisma.locations.findMany();
	}

	async createLocation(
		name: string,
		type: string,
		address: string,
		contact: string,
		coords: string,
	) {
		return await prisma.locations.create({
			data: {
				name,
				type,
				address,
				contact,
				coords,
			},
		});
	}

	async updateLocation(field: { id: number; type: string; info: string }) {
		await prisma.locations.update({
			where: {
				id: Number(field.id),
			},
			data: {
				[field.type]: field.info,
			},
		});
	}
}
