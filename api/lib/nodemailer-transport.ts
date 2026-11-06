import nodemailer from "nodemailer";

import { envs } from "env.js";

import type { MailTransport } from "api/lib/mailer.js";

export type SmtpConfig = {
	host?: string;
	port?: number;
	secure?: boolean;
	user?: string;
	pass?: string;
	from?: string;
};

function configFromEnv(): SmtpConfig {
	return {
		host: envs.SMTP_HOST,
		port: envs.SMTP_PORT,
		secure: envs.SMTP_SECURE,
		user: envs.SMTP_USER,
		pass: envs.SMTP_PASS,
		from: envs.SMTP_FROM,
	};
}

/**
 * Build the SMTP transport once and reuse it. Returns null when no SMTP
 * setting is present, so development keeps the console fallback.
 */
export function createNodemailerTransport(
	config: SmtpConfig = configFromEnv(),
): MailTransport | null {
	const hasAnySetting = Object.values(config).some(
		(value) => value !== undefined,
	);

	if (!hasAnySetting) return null;

	if (!config.host) {
		throw new Error(
			"SMTP_HOST is required when any SMTP setting is present.",
		);
	}

	if (!config.from) {
		throw new Error("SMTP_FROM is required when SMTP_HOST is set.");
	}

	if (Boolean(config.user) !== Boolean(config.pass)) {
		throw new Error("SMTP_USER and SMTP_PASS must be set together.");
	}

	const port = config.port ?? 587;
	const secure = config.secure ?? port === 465;
	const auth =
		config.user && config.pass
			? { user: config.user, pass: config.pass }
			: undefined;

	const transporter = nodemailer.createTransport({
		host: config.host,
		port,
		secure,
		auth,
	});

	return async (mail) => {
		await transporter.sendMail({
			from: config.from,
			to: mail.to,
			subject: mail.subject,
			text: mail.text,
			html: mail.html,
		});
	};
}
