import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

const defaultLogLevel = isTest ? "silent" : isProduction ? "info" : "debug";

export const logger = pino({
	level: process.env.LOG_LEVEL || defaultLogLevel,
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
