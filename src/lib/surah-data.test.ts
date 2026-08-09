import { test, expect } from "bun:test";
import { getJuzForAyat, juzLabel } from "./surah-data";

test("juz boundaries (Hafs)", () => {
	expect(getJuzForAyat(1, 7)).toBe(1);
	expect(getJuzForAyat(2, 141)).toBe(1);
	expect(getJuzForAyat(2, 142)).toBe(2);
	expect(getJuzForAyat(2, 252)).toBe(2);
	expect(getJuzForAyat(2, 253)).toBe(3);
	expect(getJuzForAyat(3, 92)).toBe(3);
	expect(getJuzForAyat(3, 93)).toBe(4);
	expect(getJuzForAyat(9, 92)).toBe(10);
	expect(getJuzForAyat(9, 93)).toBe(11);
	expect(getJuzForAyat(18, 74)).toBe(15);
	expect(getJuzForAyat(18, 75)).toBe(16);
	expect(getJuzForAyat(57, 29)).toBe(27);
	expect(getJuzForAyat(58, 1)).toBe(28);
	expect(getJuzForAyat(77, 50)).toBe(29);
	expect(getJuzForAyat(78, 1)).toBe(30);
	expect(getJuzForAyat(114, 6)).toBe(30);
});

test("juzLabel: single juz and ranges", () => {
	expect(juzLabel(2, 135, 2, 145)).toBe("1-2");
	expect(juzLabel(2, 1, 2, 5)).toBe("1");
	expect(juzLabel(18, 1, 18, 110)).toBe("15-16");
	expect(juzLabel(67, 1, 67, 12)).toBe("29");
	expect(juzLabel(999, 1)).toBeNull();
});