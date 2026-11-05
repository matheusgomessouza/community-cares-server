export type PasswordResetMail = {
	to: string;
	subject: string;
	text: string;
	html: string;
};

export type MailTransport = (mail: PasswordResetMail) => Promise<void>;

let transport: MailTransport | null = null;

export function setMailTransport(next: MailTransport | null) {
	transport = next;
}

function buildPasswordResetMail(
	to: string,
	resetUrl: string,
	expiresInMinutes: number,
): PasswordResetMail {
	return {
		to,
		subject: "Reset your Community Cares admin password",
		text: [
			"We received a request to reset the password for your Community Cares admin account.",
			"",
			`Open this link to set a new password: ${resetUrl}`,
			"",
			`The link expires in ${expiresInMinutes} minutes and can be used once.`,
			"If you did not request this, ignore this email.",
		].join("\n"),
		html: [
			"<p>We received a request to reset the password for your Community Cares admin account.</p>",
			`<p><a href="${resetUrl}">Set a new password</a></p>`,
			`<p>The link expires in ${expiresInMinutes} minutes and can be used once.</p>`,
			"<p>If you did not request this, ignore this email.</p>",
		].join("\n"),
	};
}

export async function sendPasswordResetEmail(
	to: string,
	resetUrl: string,
	expiresInMinutes = 30,
): Promise<void> {
	const mail = buildPasswordResetMail(to, resetUrl, expiresInMinutes);

	if (transport) {
		await transport(mail);
		return;
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error("No mail transport configured");
	}

	console.info(`[password-reset] ${to}: ${resetUrl}`);
}
