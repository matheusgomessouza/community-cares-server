import argon2 from "argon2";
import { AdminUsersRepository } from "api/repositories/admin-users-repository.js";

export class AdminUsersCreateService {
	async createAdminUser(
		name: string,
		username: string,
		email: string,
		password: string,
	) {
		try {
			const adminUsersRepository = new AdminUsersRepository();
			const hashedPassword = await argon2.hash(password);

			const user = await adminUsersRepository.createAdminUser(
				username,
				name,
				email,
				hashedPassword,
			);

			return {
				payload: user,
				message: "Admin user created successfully.",
			};
		} catch (error) {
			return {
				message:
					"Error[AdminUsersCreateService]: Unable to create admin user, please try again.",
				payload: undefined,
			};
		}
	}
}
