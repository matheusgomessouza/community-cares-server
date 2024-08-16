import { expect, test } from "vitest";

test("if the API is running", async () => {
	try {
		const response = await fetch("http://localhost:8080");
		expect(response.status).toBe(200);
	} catch (error) {
		throw new Error("Server is not running");
	}
});
