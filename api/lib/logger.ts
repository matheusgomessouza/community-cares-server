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
			"*.password",
			"*.token",
			"*.refreshToken",
			"*.secret",
		],
		censor: "[REDACTED]",
	},
};

/**
 * Create the logger. The level is resolved lazily so that env.ts (which loads
 * .env.local) runs before the level is read from process.env.
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
