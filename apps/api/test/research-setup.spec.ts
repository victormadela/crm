import { describe, expect, it } from "bun:test";
import type { Db } from "@crm/db";
import { BadRequestException } from "@nestjs/common";
import type { ResearchKeyService } from "../src/agent/research-key.service";
import type { BackfillService } from "../src/backfill/backfill.service";
import type { ModelCatalogService } from "../src/settings/model-catalog.service";
import { SettingsService } from "../src/settings/settings.service";

function setup(invalid = false) {
	let row = {
		contextDevApiKey: null as string | null,
		researchSetupSkipped: false,
	};
	let verificationCalls = 0;
	let backfillCalls = 0;
	const db = {
		appSetting: {
			findUnique: async () => row,
			upsert: async ({ update }: { update: Partial<typeof row> }) => {
				row = { ...row, ...update };
				return row;
			},
		},
	} as unknown as Db;
	const research = {
		verify: async () => {
			verificationCalls += 1;
			return invalid
				? { outcome: "invalid", reason: "Invalid key" }
				: { outcome: "valid" };
		},
	} as unknown as ResearchKeyService;
	const backfill = {
		run: async () => {
			backfillCalls += 1;
			return { queued: 0, remaining: 0 };
		},
	} as unknown as BackfillService;
	const service = new SettingsService(
		db,
		{} as ModelCatalogService,
		research,
		backfill,
	);
	return { service, counts: () => ({ verificationCalls, backfillCalls }) };
}

describe("research onboarding choice", () => {
	it("skips without verifying a key or starting research", async () => {
		const { service, counts } = setup();
		expect(await service.skipResearchSetup()).toEqual({
			configured: false,
			skipped: true,
			hint: null,
		});
		expect(await service.researchKey()).toEqual({
			configured: false,
			skipped: true,
			hint: null,
		});
		expect(counts()).toEqual({ verificationCalls: 0, backfillCalls: 0 });
	});

	it("accepts a key later and queues waiting research", async () => {
		const { service, counts } = setup();
		await service.skipResearchSetup();
		expect(await service.setResearchKey("context-test-9876")).toEqual({
			configured: true,
			skipped: false,
			hint: "••••9876",
		});
		expect(counts()).toEqual({ verificationCalls: 1, backfillCalls: 1 });
	});

	it("preserves the skipped choice when a later key is invalid", async () => {
		const { service, counts } = setup(true);
		await service.skipResearchSetup();
		await expect(
			service.setResearchKey("invalid-test-key"),
		).rejects.toBeInstanceOf(BadRequestException);
		expect(await service.researchKey()).toEqual({
			configured: false,
			skipped: true,
			hint: null,
		});
		expect(counts()).toEqual({ verificationCalls: 1, backfillCalls: 0 });
	});
});
