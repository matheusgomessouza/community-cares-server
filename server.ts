import { loadSecrets } from "./bootstrap.js";

/**
 * A static import of the app cannot load the secrets first. `tsx` does not
 * implement async module semantics: while a top-level await in an imported
 * module is pending, the sibling imports still evaluate, so `env.ts`,
 * `auth-tokens.ts` and the Prisma clients would read an empty `process.env`.
 * The dynamic import below runs only after the secrets are in place.
 */
if (process.env.NODE_ENV === "production") {
	await loadSecrets();
}

await import("./api/index.js");
