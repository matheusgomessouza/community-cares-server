import * as jose from "jose";
import { Response } from "express";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "30d";

const accessSecret = new TextEncoder().encode(process.env.AUTH_SECRET_KEY);
const refreshSecret = new TextEncoder().encode(
	process.env.REFRESH_SECRET_KEY ||
		process.env.AUTH_SECRET_KEY ||
		"fallback_secret",
);

export async function createAccessToken(payload: jose.JWTPayload = {}) {
	return await new jose.SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(ACCESS_EXPIRES_IN)
		.sign(accessSecret);
}

export async function createRefreshToken(payload: jose.JWTPayload = {}) {
	return await new jose.SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(REFRESH_EXPIRES_IN)
		.sign(refreshSecret);
}

export async function verifyRefreshToken(token: string) {
	try {
		const { payload } = await jose.jwtVerify(token, refreshSecret);
		return payload;
	} catch (err) {
		return null;
	}
}

export function setRefreshCookie(res: Response, token: string) {
	const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
	res.cookie("refresh", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		path: "/",
		maxAge,
	});
}

export function clearRefreshCookie(res: Response) {
	res.clearCookie("refresh", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		path: "/",
	});
}
