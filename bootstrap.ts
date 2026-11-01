import { GoogleAuth } from "google-auth-library";

const PROJECT_ID = "secrets-manager-494502";
const PREFIX = "ccs-";
const SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];
const TIMEOUT_MS = 8000;

/** Secrets the app reads on import. See `server.ts` for the load order. */
const SECRET_NAMES = [
	"AUTH_SECRET_KEY",
	"REFRESH_SECRET_KEY",
	"DATABASE_URL",
	"GITHUB_CLIENT_SECRET",
	"GITHUB_CLIENT_SECRET_WEB_PRD",
	"GOOGLE_SECRET",
	"AWS_ACCESS_KEY_ID",
	"AWS_SECRET_ACCESS_KEY",
] as const;

function buildAuth(): GoogleAuth {
	const inline = process.env.GCP_SA_KEY;

	if (inline) {
		let credentials: Record<string, unknown>;

		try {
			credentials = JSON.parse(inline) as Record<string, unknown>;
		} catch {
			// A SyntaxError message quotes the input back. The input here is a
			// private key, so the message would put key material in the log.
			throw new Error("GCP_SA_KEY is not valid JSON");
		}

		return new GoogleAuth({ credentials, scopes: SCOPES });
	}

	// Render has no OIDC federation on the free plan, so the service account
	// key is mounted as a file and found through Application Default
	// Credentials. A GCP-hosted runtime gets here with a metadata token and
	// needs no key at all.
	return new GoogleAuth({ scopes: SCOPES });
}

async function readSecret(name: string, token: string): Promise<string> {
	const url =
		`https://secretmanager.googleapis.com/v1/projects/${PROJECT_ID}` +
		`/secrets/${PREFIX}${name}/versions/latest:access`;

	let response: Response;

	try {
		response = await fetch(url, {
			headers: { Authorization: `Bearer ${token}` },
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});
	} catch {
		// Without the timeout a stalled connection hangs the boot forever and
		// writes nothing to the log.
		throw new Error(
			`Secret Manager did not answer within ${TIMEOUT_MS} ms for ${PREFIX}${name}`,
		);
	}

	if (!response.ok) {
		throw new Error(
			`Secret Manager returned HTTP ${response.status} for ${PREFIX}${name}`,
		);
	}

	const body = (await response.json()) as { payload?: { data?: string } };
	const encoded = body.payload?.data;

	if (!encoded) {
		throw new Error(`Secret ${PREFIX}${name} has no payload`);
	}

	return Buffer.from(encoded, "base64").toString("utf8");
}

export async function loadSecrets(): Promise<void> {
	const client = await buildAuth().getClient();
	const { token } = await client.getAccessToken();

	if (!token) {
		throw new Error("Could not obtain a Google Cloud access token");
	}

	const entries = await Promise.all(
		SECRET_NAMES.map(
			async (name) => [name, await readSecret(name, token)] as const,
		),
	);

	for (const [name, value] of entries) {
		if (!value || value === "__unset__") {
			throw new Error(
				`Secret ${PREFIX}${name} is empty or still a placeholder`,
			);
		}

		process.env[name] = value;
	}
}
