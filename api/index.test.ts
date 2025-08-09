import request from "supertest";
import * as jose from "jose";
import type { JWTPayload } from "jose";
import type { Express } from "express";
import {
	expect,
	describe,
	it,
	vi,
	beforeAll,
	beforeEach,
	MockInstance,
	afterEach,
} from "vitest";

// Define types for Prisma queries
type AdminUserFindUniqueArgs = {
	where: {
		username: string;
	};
};

// Hoisted references so vi.mock can access them
const hoisted = vi.hoisted(() => ({
	mockLocations: [
		{
			id: 1,
			name: "Place A",
			type: "park",
			address: "123 St",
			contact: "555-0001",
			coords: { lat: 1, lng: 2 },
		},
		{
			id: 2,
			name: "Place B",
			type: "clinic",
			address: "456 Ave",
			contact: "555-0002",
			coords: { lat: 3, lng: 4 },
		},
	],
	mockPendingLocations: [
		{
			id: 10,
			name: "Pending A",
			type: "shelter",
			address: "789 Rd",
			contact: "555-0003",
			coords: { lat: 5, lng: 6 },
		},
		{
			id: 11,
			name: "Pending B",
			type: "food",
			address: "101 Blvd",
			contact: "555-0004",
			coords: { lat: 7, lng: 8 },
		},
	],
	pendingFindMany: vi.fn(),
	findUnique: vi.fn(),
	pendingDelete: vi.fn(),
}));

vi.mock("./lib/github.js", () => {
	return { exchangeCode: vi.fn() };
});
vi.mock("./lib/google.js", () => ({ exchangeCodeGoogle: vi.fn() }));

vi.mock("@prisma/client", () => {
	const {
		mockLocations,
		mockPendingLocations,
		pendingFindMany,
		findUnique,
		pendingDelete,
	} = hoisted;
	pendingFindMany.mockResolvedValue(mockPendingLocations);
	return {
		PrismaClient: class {
			locations = {
				findMany: vi.fn().mockResolvedValue(mockLocations),
			};
			adminUser = {
				findUnique,
			};
			pendingLocations = {
				findMany: pendingFindMany,
				delete: pendingDelete,
			};
		},
	};
});

// argon2 is a default export with .verify()
vi.mock("argon2", () => ({
	default: {
		verify: vi.fn(),
	},
}));

let app: Express;
let exchangeCode: (
	code: string,
	env: string,
) => Promise<{
	access_token: string;
	token_type: string;
	scope: string;
}>;
let exchangeCodeGoogle: (code: string) => Promise<
	| {
			access_token?: string | null | undefined;
			token_type?: string | null | undefined;
			scope?: string | undefined;
	  }
	| undefined
>;
let consoleErrorSpy: MockInstance<
	[message?: unknown, ...optionalParams: unknown[]],
	void
>;
let argon2: {
	verify: ReturnType<typeof vi.fn>;
};
let jwtVerifySpy: MockInstance<
	Parameters<typeof jose.jwtVerify>,
	ReturnType<typeof jose.jwtVerify>
>;

beforeAll(async () => {
	const module = await import("./index.js");
	app = module.app;

	const github = await import("./lib/github.js");
	exchangeCode = github.exchangeCode as (
		code: string,
		env: string,
	) => Promise<{
		access_token: string;
		token_type: string;
		scope: string;
	}>;

	const google = await import("./lib/google.js");
	exchangeCodeGoogle = google.exchangeCodeGoogle;

	argon2 = (await import("argon2")).default as unknown as {
		verify: ReturnType<typeof vi.fn>;
	};
});

beforeEach(() => {
	vi.clearAllMocks();
	process.env.AUTH_SECRET_KEY = "test-secret";
	consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	jwtVerifySpy = vi.spyOn(jose, "jwtVerify");
});

afterEach(() => {
	consoleErrorSpy.mockRestore();
	jwtVerifySpy.mockRestore();
});

describe("Health Check", () => {
	it("GET / returns 200", async () => {
		const res = await request(app).get("/");
		expect(res.status).toBe(200);
		expect(res.text).toBe("Server is running");
	});
});

describe("POST /authenticate", () => {
	it("returns 200 and the exchange response", async () => {
		(exchangeCode as unknown as MockInstance).mockResolvedValue({
			access_token: "token123",
			token_type: "bearer",
			scope: "read:user",
		});

		const res = await request(app)
			.post("/authenticate")
			.send({ code: "valid-code", env: "dev" });

		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			access_token: "token123",
			token_type: "bearer",
			scope: "read:user",
		});
		expect(exchangeCode).toHaveBeenCalledWith("valid-code", "dev");
	});

	it("returns 500 on exchange error", async () => {
		(exchangeCode as unknown as MockInstance).mockRejectedValue(
			new Error("boom"),
		);

		const res = await request(app)
			.post("/authenticate")
			.send({ code: "bad-code", env: "dev" });

		expect(res.status).toBe(500);
		expect(exchangeCode).toHaveBeenCalled();
	});
});

describe("POST /authenticate-admin", () => {
	it("returns 200 with a JWT when password matches", async () => {
		hoisted.findUnique.mockResolvedValue({
			id: 1,
			username: "alice",
			password: "hashed",
		});
		argon2.verify.mockResolvedValue(true);

		const res = await request(app)
			.post("/authenticate-admin")
			.send({ username: "alice", password: "secret" });

		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			message: "Authentication successfully done.",
			token: expect.any(String),
		});
		expect(hoisted.findUnique).toHaveBeenCalledWith({
			where: { username: "alice" },
		} as AdminUserFindUniqueArgs);
	});

	it("returns 401 when password is incorrect", async () => {
		hoisted.findUnique.mockResolvedValue({
			id: 1,
			username: "alice",
			password: "hashed",
		});
		argon2.verify.mockResolvedValue(false);

		const res = await request(app)
			.post("/authenticate-admin")
			.send({ username: "alice", password: "wrong" });

		expect(res.status).toBe(401);
		expect(res.body).toEqual({ message: "Incorrect password." });
	});

	it("returns 500 when a server error occurs", async () => {
		hoisted.findUnique.mockRejectedValue(new Error("db error"));

		const res = await request(app)
			.post("/authenticate-admin")
			.send({ username: "alice", password: "secret" });

		expect(res.status).toBe(500);
		expect(consoleErrorSpy).toHaveBeenCalled();
	});
});

describe("POST /authenticate-google", () => {
	it("returns 200 and the exchange response", async () => {
		(exchangeCodeGoogle as unknown as MockInstance).mockResolvedValue({
			access_token: "g-token",
			token_type: "Bearer",
			scope: "profile email",
		});

		const res = await request(app)
			.post("/authenticate-google")
			.send({ code: "valid-code" });

		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			access_token: "g-token",
			token_type: "Bearer",
			scope: "profile email",
		});
		expect(exchangeCodeGoogle).toHaveBeenCalledWith("valid-code");
	});

	it("returns 500 on exchange error", async () => {
		(exchangeCodeGoogle as unknown as MockInstance).mockRejectedValue(
			new Error("boom"),
		);

		const res = await request(app)
			.post("/authenticate-google")
			.send({ code: "bad-code" });

		expect(res.status).toBe(500);
		expect(consoleErrorSpy).toHaveBeenCalled();
	});
});

describe("GET /locations", () => {
	it("returns 200 and a list of locations", async () => {
		const res = await request(app).get("/locations");
		expect(res.status).toBe(200);
		expect(res.body).toEqual(hoisted.mockLocations);
	});
});

describe("GET /pending-locations", () => {
	it("returns 200 and a list of pending locations", async () => {
		const res = await request(app).get("/pending-locations");
		expect(res.status).toBe(200);
		expect(res.body).toEqual(hoisted.mockPendingLocations);
	});

	it("returns 500 on error", async () => {
		hoisted.pendingFindMany.mockRejectedValueOnce(new Error("db error"));
		const res = await request(app).get("/pending-locations");
		expect(res.status).toBe(500);
		expect(consoleErrorSpy).toHaveBeenCalled();
	});
});

describe("DELETE /pending-location/:id", () => {
	it("returns 401 when Authorization header is missing", async () => {
		const res = await request(app).delete("/pending-location/10");
		expect(res.status).toBe(401);
		expect(res.body).toEqual({ message: "Unauthorized" });
	});

	it("returns 200 and deletes the pending location when JWT is valid", async () => {
		jwtVerifySpy.mockResolvedValue({
			payload: {},
			protectedHeader: { alg: "HS256" },
			key: new Uint8Array(),
		});
		hoisted.pendingDelete.mockResolvedValue({});

		const res = await request(app)
			.delete("/pending-location/10")
			.set("Authorization", "Bearer valid-token");

		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			message: "Pending Location successfully deleted!",
		});
		expect(hoisted.pendingDelete).toHaveBeenCalledWith({
			where: { id: 10 },
		});
	});
	it("returns 500 when JWT is expired", async () => {
		jwtVerifySpy.mockRejectedValue(
			new jose.errors.JWTExpired("expired", {} as JWTPayload),
		);

		const res = await request(app)
			.delete("/pending-location/10")
			.set("Authorization", "Bearer expired-token");

		expect(res.status).toBe(500);
		expect(consoleErrorSpy).toHaveBeenCalled();
	});

	it("returns 500 when JWT verification fails with other error", async () => {
		jwtVerifySpy.mockRejectedValue(new Error("bad token"));

		const res = await request(app)
			.delete("/pending-location/10")
			.set("Authorization", "Bearer bad-token");

		expect(res.status).toBe(500);
	});
	it("returns 500 when delete throws", async () => {
		jwtVerifySpy.mockResolvedValue({
			payload: {},
			protectedHeader: { alg: "HS256" },
			key: new Uint8Array(),
		});
		hoisted.pendingDelete.mockRejectedValue(new Error("db error"));

		const res = await request(app)
			.delete("/pending-location/10")
			.set("Authorization", "Bearer valid-token");

		expect(res.status).toBe(500);
		expect(consoleErrorSpy).toHaveBeenCalled();
	});
});
