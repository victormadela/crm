import { describe, expect, it } from "bun:test";
import type { Db } from "../src/client";
import {
	readContextDevKey,
	readResearchSetupSkipped,
	skipResearchSetup,
	writeContextDevKey,
} from "../src/settings";

describe("research setup", () => {
	it("persists skipping without fabricating credentials and accepts a key later", async () => {
		let row = {
			contextDevApiKey: null as string | null,
			researchSetupSkipped: false,
		};
		const db = {
			appSetting: {
				findUnique: async () => row,
				upsert: async ({ update }: { update: Partial<typeof row> }) => {
					row = { ...row, ...update };
					return row;
				},
			},
		} as unknown as Db;

		expect(await readResearchSetupSkipped(db)).toBe(false);
		await skipResearchSetup(db);
		expect(await readResearchSetupSkipped(db)).toBe(true);
		expect(await readContextDevKey(db)).toBeNull();
		await writeContextDevKey(db, "real-key-for-test");
		expect(await readResearchSetupSkipped(db)).toBe(false);
		expect(await readContextDevKey(db)).toBe("real-key-for-test");
	});

	it("asks for setup again after the database state is reset", async () => {
		const db = {
			appSetting: { findUnique: async () => null },
		} as unknown as Db;
		expect(await readResearchSetupSkipped(db)).toBe(false);
	});
});
