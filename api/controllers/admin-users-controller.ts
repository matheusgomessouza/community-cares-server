import { Request, Response } from "express";
import { AdminUsersRepository } from "api/repositories/admin-users-repository.js";
import { AdminUsersAuthenticateService } from "../services/admin-users/authenticate.js";

export class AdminUsersController {
	async authenticate(req: Request, res: Response) {
		const { username, password } = req.body;

		if (!username || !password) {
			return res
				.status(400)
				.json({ message: "Username and password are required" });
		}

		const adminUsersAuthenticateService =
			new AdminUsersAuthenticateService();

		try {
			const response = await adminUsersAuthenticateService.authenticate(
				username,
				password,
			);

			if (typeof response === "string" && response.startsWith("Error:")) {
				return res.status(401).json({ message: response });
			} else {
				res.status(200).json({
					message: "Authentication successfully done.",
					token: response,
				});
			}
		} catch (error) {
			// const adminUsersAuthenticateService =
			// new AdminUsersAuthenticateService();
			// const errorMessage = await admin
			// res.status(500).json({
			//   message: "Unable to authenticate, please try again.",
			// });
		}
	}

	async createAdminUser(req: Request, res: Response) {
		const { name, username, email, password } = req.body;

		try {
			const adminUsersRepository = new AdminUsersRepository();
			const hashedPassword = await argon2.hash(password);

			await adminUsersRepository.createAdminUser(
				username,
				name,
				email,
				hashedPassword,
			);
			res.status(201).json({
				message: "AdminUser successfully created!",
			});
		} catch (error) {
			console.error("Unable to register new admin user", error);
			res.status(500).json({
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}
}
