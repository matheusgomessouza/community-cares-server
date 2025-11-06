import { Request, Response } from "express";
import { AdminUsersAuthenticateService } from "../services/admin-users/authenticate.js";
import { AdminUsersCreateService } from "api/services/admin-users/create.js";

export class AdminUsersController {
	async authenticate(req: Request, res: Response) {
		const { username, password } = req.body;

		if (!username || !password) {
			return res
				.status(400)
				.json({ message: "Error: Username and password are required" });
		}

		const adminUsersAuthenticateService =
			new AdminUsersAuthenticateService();

		try {
			const response = await adminUsersAuthenticateService.authenticate(
				username,
				password,
			);

			if (typeof response === "object" && response.message) {
				return res.status(401).json({ message: response.message });
			} else {
				res.status(200).json({
					message: "Authentication successfully done.",
					token: response,
				});
			}
		} catch (error) {
			res.status(500).json({
				message: "Error: Unable to authenticate, please try again.",
			});
		}
	}

	async createAdminUser(req: Request, res: Response) {
		const { name, username, email, password } = req.body;

		try {
			const adminUsersCreateService = new AdminUsersCreateService();
			const response = await adminUsersCreateService.createAdminUser(
				name,
				username,
				email,
				password,
			);

			res.status(201).json({
				message: response.message,
				payload: response.payload,
			});
		} catch (error) {
			res.status(500).json({
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}
}
