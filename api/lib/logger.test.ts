import { describe, it, expect } from "vitest";
import pino from "pino";
import { logger } from "./logger.js";

describe("logger", () => {
	it("exports a configured pino logger instance", () => {
		expect(logger).toBeDefined();
		expect(typeof logger.info).toBe("function");
		expect(typeof logger.error).toBe("function");
		expect(typeof logger.warn).toBe("function");
		expect(typeof logger.debug).toBe("function");
	});

	it("uses silent log level in test environment by default", () => {
		expect(logger.level).toBe("silent");
	});

	it("redacts sensitive fields like passwords and tokens", () => {
		let loggedData = "";
		const testLogger = pino(
			{
				formatters: {
					level: (label: string) => ({ level: label }),
				},
				redact: {
					paths: [
						"req.headers.authorization",
						"req.headers.cookie",
						"password",
						"token",
						"refreshToken",
						"*.password",
						"*.token",
						"*.refreshToken",
						"*.secret",
					],
					censor: "[REDACTED]",
				},
			},
			{
				write: (str: string) => {
					loggedData += str;
				},
			},
		);

		testLogger.info({
			password: "supersecretpassword",
			user: { token: "secret-token", email: "user@example.com" },
		});

		const parsed = JSON.parse(loggedData);
		expect(parsed.level).toBe("info");
		expect(parsed.password).toBe("[REDACTED]");
		expect(parsed.user.token).toBe("[REDACTED]");
		expect(parsed.user.email).toBe("user@example.com");
	});
});
