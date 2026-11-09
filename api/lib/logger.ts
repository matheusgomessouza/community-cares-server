import pino from "pino";
import type { LoggerOptions } from "pino";

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

const defaultLogLevel = isTest ? "silent" : isProduction ? "info" : "debug";

export const loggerOptions: LoggerOptions = {
	formatters: {
		level: (label: string) => ({ level: label }),
	},
	timestamp: pino.stdTimeFunctions.isoTime,
	serializers: {
		err: pino.stdSerializers.err,
	},
	redact: {
		paths: [
			"req.headers.authorization",
			"req.headers.cookie",
			"password",
			"token",
			"refreshToken",
			"access_token",
			"refresh_token",
			"id_token",
			"*.password",
			"*.token",
			"*.refreshToken",
			"*.secret",
		],
		censor: "[REDACTED]",
	},
};

/**
 * Create the logger. The level is read at import time. The import order in
 * api/index.ts runs env.ts (which loads the .env file) before this module, so
 * process.env is already populated when the level is read.
 */
export function createLogger(): pino.Logger {
	return pino({
		...loggerOptions,
		level: process.env.LOG_LEVEL || defaultLogLevel,
		transport:
			!isProduction && !isTest
				? {
						target: "pino-pretty",
						options: {
							colorize: true,
							translateTime: "SYS:standard",
							ignore: "pid,hostname",
						},
					}
				: undefined,
	});
}

export const logger = createLogger();
