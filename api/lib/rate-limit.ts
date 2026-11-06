import rateLimit from "express-rate-limit";

export function createRateLimiter(options: {
	windowMs: number;
	limit: number;
	skip?: () => boolean;
}) {
	return rateLimit({
		windowMs: options.windowMs,
		limit: options.limit,
		standardHeaders: true,
		legacyHeaders: false,
		skip: options.skip,
		message: { message: "Too many requests. Try again later." },
	});
}
