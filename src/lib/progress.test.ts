import { test, expect } from "bun:test";
import { nextAfter, nextPositionFromList } from "./progress";

test("nextAfter: plain surah, same-surah continuation and boundary rollover", () => {
	expect(nextAfter({ type: "Ziyadah", surah: 1, ayatAwal: 1, ayatAkhir: 6 })).toEqual({
		surah: 1,
		ayat: 7,
	});
	expect(nextAfter({ type: "Ziyadah", surah: 1, ayatAwal: 1, ayatAkhir: 7 })).toEqual({
		surah: 2,
		ayat: 1,
	});
});

test("nextAfter: lintas uses surahAkhir", () => {
	expect(
		nextAfter({
			type: "Ziyadah",
			surah: 1,
			surahAkhir: 1,
			lintas: true,
			ayatAwal: 1,
			ayatAkhir: 6,
		}),
	).toEqual({ surah: 1, ayat: 7 });
});

test("nextAfter: last surah of mushaf has no next", () => {
	expect(
		nextAfter({ type: "Ziyadah", surah: 114, ayatAwal: 6, ayatAkhir: 6 }),
	).toBeNull();
});

test("nextPositionFromList: picks newest of matching type only", () => {
	const list = [
		{ type: "Ziyadah", surah: 1, ayatAwal: 1, ayatAkhir: 7 },
		{ type: "Murajaah Fardi", surah: 2, ayatAwal: 1, ayatAkhir: 5 },
		{ type: "Ziyadah", surah: 2, ayatAwal: 1, ayatAkhir: 10 },
	];
	expect(nextPositionFromList(list, "Ziyadah")).toEqual({ surah: 2, ayat: 11 });
	expect(nextPositionFromList(list, "Murajaah"))
		.toEqual({ surah: 2, ayat: 6 });
});