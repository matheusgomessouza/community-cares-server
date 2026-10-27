import { spawnSync } from "node:child_process";
import { loadSecrets } from "./bootstrap.js";

/**
 * `prisma migrate deploy` reads DATABASE_URL when it starts. In production that
 * value comes from Secret Manager, and the Render environment holds a
 * placeholder only for the build. The load must finish before the spawn, and
 * the child process inherits the filled `process.env`.
 */
if (process.env.NODE_ENV === "production") {
	await loadSecrets();
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
	stdio: "inherit",
	env: process.env,
});

if (result.error) {
	throw result.error;
}

if (result.status !== 0) {
	throw new Error(`prisma migrate deploy exited with code ${result.status}`);
}
