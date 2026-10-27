import { GoogleAuth } from "google-auth-library";

const PROJECT_ID = "secrets-manager-494502";
const PREFIX = "ccs-";
const SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];

/**
 * These secrets are read while other modules evaluate: `env.ts` parses them on
 * import, `services/auth-tokens.ts` builds its signing keys on import, and the
 * repositories call `new PrismaClient()` on import. They must be in
 * `process.env` before any of that runs, which is why this file is the first
 * import of `api/index.ts`.
 */
const SECRET_NAMES = [
	"AUTH_SECRET_KEY",
	"REFRESH_SECRET_KEY",
	"DATABASE_URL",
	"GITHUB_CLIENT_SECRET",
	"GITHUB_CLIENT_SECRET_WEB_PRD",
	"GOOGLE_SECRET",
] as const;

function buildAuth(): GoogleAuth {
	const inline = process.env.GCP_SA_KEY;

	if (inline) {
		return new GoogleAuth({ credentials: JSON.parse(inline), scopes: SCOPES });
	}

	// Render has no OIDC federation on the free plan, so the service account
	// key is mounted as a file and found through Application Default
	// Credentials. GCP-hosted runtimes would get here with a metadata token and
	// need no key at all.
	return new GoogleAuth({ scopes: SCOPES });
}

async function readSecret(name: string, token: string): Promise<string> {
	const url =
		`https://secretmanager.googleapis.com/v1/projects/${PROJECT_ID}` +
		`/secrets/${PREFIX}${name}/versions/latest:access`;

	const response = await fetch(url, {
		headers: { Authorization: `Bearer ${token}` },
	});

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

// Local runs read `.env.local` through `dotenv`, so only production pays for
// the Secret Manager round trip.
if (process.env.NODE_ENV === "production") {
	await loadSecrets();
}
