import { exchangeCodeGithub } from "api/lib/github.js";
import { exchangeCodeGoogle } from "api/lib/google.js";
import { Request, Response } from "express";

export class UsersController {
	async authenticateWithGitHub(req: Request, res: Response) {
		const { code, env, code_verifier } = req.body;

		if (!code) {
			return res.status(400).json({ message: "Code is required" });
		}

		try {
			const response = await exchangeCodeGithub(code, code_verifier, env);
			res.status(200).json(response);
		} catch (error: unknown) {
			console.error("Error exchanging code for token:", error);
			res.status(500).json({
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async authenticateWithGoogle(req: Request, res: Response) {
		const { code } = req.body;

		try {
			const response = await exchangeCodeGoogle(code);
			res.status(200).json(response);
		} catch (error) {
			console.error("Error exchanging code for token:", error);
			res.status(500).json({ message: error });
		}
	}
}
