import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class AdminUsersRepository {
	async findByUsername(username: string) {
		return await prisma.adminUser.findUnique({
			where: {
				username: username,
			},
		});
	}

	async findManyByEmail(email: string, take = 2) {
		return await prisma.adminUser.findMany({
			where: {
				email: {
					equals: email,
					mode: "insensitive",
				},
			},
			take,
		});
	}

	async createAdminUser(
		username: string,
		name: string,
		email: string,
		hashedPassword: string,
	) {
		await prisma.adminUser.create({
			data: {
				name,
				username,
				email,
				password: hashedPassword,
			},
		});
	}
}
