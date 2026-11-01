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
		coords: { latitude: number; longitude: number },
		image_url?: string,
	) {
		return await prisma.locations.create({
			data: {
				name,
				type,
				address,
				contact,
				coords,
				image_url,
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
