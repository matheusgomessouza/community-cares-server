import argon2 from "argon2";
import * as jose from "jose";
import { AdminUsersRepository } from "api/repositories/admin-users-repository.js";

export class AdminUsersAuthenticateService {
	async authenticate(username: string, password: string) {
		try {
			const adminUsersRepository = new AdminUsersRepository();
			const user = await adminUsersRepository.findByUsername(username);

			const passwordMatch =
				user && (await argon2.verify(user?.password, password));

			if (passwordMatch) {
				const secret = new TextEncoder().encode(
					process.env.AUTH_SECRET_KEY,
				);
				const jwtConfig = new jose.SignJWT()
					.setProtectedHeader({
						alg: "HS256",
					})
					.setExpirationTime("2h")
					.sign(secret);

				const jwtToken = (await jwtConfig).toString();

				return jwtToken;
			} else {
				return;
				res.status(401).json({ message: "Incorrect password." });
			}
		} catch (error) {
			return error;
		}
	}
}
