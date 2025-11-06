import argon2 from "argon2";
import * as jose from "jose";
import { AdminUsersRepository } from "api/repositories/admin-users-repository.js";

export class AdminUsersAuthenticateService {
	async authenticate(username: string, password: string) {
		try {
			const adminUsersRepository = new AdminUsersRepository();
			const user = await adminUsersRepository.findByUsername(username);

			if (!user) {
				return {
					payload: undefined,
					message: "Error: Username must be valid.",
				};
			}

			const passwordMatch = await argon2.verify(user.password, password);

			if (passwordMatch) {
				const secret = new TextEncoder().encode(
					process.env.AUTH_SECRET_KEY,
				);
				const jwtToken = await new jose.SignJWT({})
					.setProtectedHeader({
						alg: "HS256",
					})
					.setIssuedAt()
					.setExpirationTime("2h")
					.sign(secret);

				return jwtToken;
			}

			return {
				payload: undefined,
				message: "Error: Invalid username or password.",
			};
		} catch (error) {
			console.error("Authentication error:", error);
			return {
				payload: undefined,
				message:
					"Error[AdminUsersAuthenticateService]: Unable to authenticate, please try again.",
			};
		}
	}
}
