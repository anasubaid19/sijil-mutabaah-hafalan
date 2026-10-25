import { expect, test } from "bun:test";
import {
	RELEASES,
	type ReleaseNote,
	selectUnseenRelease,
} from "./release-notes";

const FIXTURE: ReleaseNote[] = [
	{
		id: "v3",
		date: "2026-10-25",
		title: "Rilis terbaru",
		items: [
			{ kind: "Perbaikan", text: "Poin tiga A" },
			{ kind: "Catatan", text: "Poin tiga B" },
			{ kind: "Fitur baru", text: "Poin tiga C" },
		],
	},
	{
		id: "v2",
		date: "2026-10-20",
		title: "Rilis sebelumnya",
		items: [{ kind: "Perbaikan", text: "Poin dua" }],
	},
	{
		id: "v1",
		date: "2026-10-10",
		title: "Rilis lama",
		items: [{ kind: "Fitur baru", text: "Poin satu" }],
	},
];

test("shipped release notes have unique ids and non-empty copy", () => {
	expect(RELEASES.length).toBeGreaterThan(0);
	const ids = new Set(RELEASES.map((r) => r.id));
	expect(ids.size).toBe(RELEASES.length);
	for (const release of RELEASES) {
		expect(release.title.length).toBeGreaterThan(0);
		expect(release.items.length).toBeGreaterThan(0);
		for (const item of release.items) {
			expect(item.text.trim().length).toBeGreaterThan(20);
		}
	}
});

test("selectUnseenRelease: nothing to show after the newest release is acknowledged", () => {
	expect(selectUnseenRelease(FIXTURE, "v3")).toBeNull();
});

test("selectUnseenRelease: first-time users see the newest release only", () => {
	const unseen = selectUnseenRelease(FIXTURE, null);
	expect(unseen?.acknowledgeId).toBe("v3");
	expect(unseen?.title).toBe("Rilis terbaru");
	expect(unseen?.items.map((i) => i.text)).toEqual([
		"Poin tiga A",
		"Poin tiga B",
		"Poin tiga C",
	]);
	expect(unseen?.hiddenCount).toBe(0);
});

test("selectUnseenRelease: shows every release newer than the acknowledged one", () => {
	const unseen = selectUnseenRelease(FIXTURE, "v1");
	expect(unseen?.acknowledgeId).toBe("v3");
	expect(unseen?.items.map((i) => i.text)).toEqual([
		"Poin tiga A",
		"Poin tiga B",
		"Poin tiga C",
		"Poin dua",
	]);
});

test("selectUnseenRelease: caps the banner and counts the rest", () => {
	const unseen = selectUnseenRelease(FIXTURE, "v1", 2);
	expect(unseen?.items.map((i) => i.text)).toEqual([
		"Poin tiga A",
		"Poin tiga B",
	]);
	expect(unseen?.hiddenCount).toBe(2);
});

test("selectUnseenRelease: falls back to the newest release for an unknown id", () => {
	const unseen = selectUnseenRelease(FIXTURE, "sudah-dihapus");
	expect(unseen?.acknowledgeId).toBe("v3");
	expect(unseen?.items.map((i) => i.text)).toEqual([
		"Poin tiga A",
		"Poin tiga B",
		"Poin tiga C",
	]);
});

test("selectUnseenRelease: quiet when there is no release yet", () => {
	expect(selectUnseenRelease([], null)).toBeNull();
});
