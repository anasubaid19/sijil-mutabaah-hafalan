import { eq } from "drizzle-orm";
import { auth } from "../src/lib/auth/auth";
import { db } from "../src/lib/db";
import {
	appConfig,
	presensi,
	setoran,
	siswa,
	user,
	userProfile,
	waliLink,
} from "../src/lib/db/schema";

if (!process.env.DATABASE_URL?.endsWith("/sijil_qa")) {
	throw new Error("Refusing to seed: DATABASE_URL must point to sijil_qa");
}

const QA_PASSWORD = "SijilQA!2026";

const QA_USERS = [
	{
		username: "anasubaid19",
		email: "admin.qa@sijil.test",
		name: "Admin QA",
		role: "admin",
		halaqahName: "Koordinator QA",
	},
	{
		username: "musyrifqa",
		email: "musyrif.qa@sijil.test",
		name: "Ustadz Musyrif QA",
		role: "musyrif",
		halaqahName: "Halaqah Al-Fatih",
	},
] as const;

const NAMES = [
	"Ahmad Fikri",
	"Bilal Ramadhan",
	"Cahya Maulana",
	"Daffa Alfarizi",
	"Ehsan Pratama",
	"Fauzan Akbar",
	"Ghazi Abdullah",
	"Hanif Zaidan",
	"Ibrahim Naufal",
	"Jauhar Hakim",
	"Khalid Mubarok",
	"Luthfi Rahman",
	"Muhammad Raihan",
	"Nabil Azhar",
	"Omar Faruq",
	"Pasha Hilmi",
	"Qaid Ziyad",
	"Rafi Hidayat",
	"Salman Firdaus",
	"Taufiq Husein",
	"Umar Syamil",
	"Vino Alamsyah",
	"Wildan Arsyad",
	"Yusuf Kamil",
] as const;

function uuid(namespace: number, index: number) {
	return `${namespace.toString(16).padStart(8, "0")}-0000-4000-8000-${index
		.toString(16)
		.padStart(12, "0")}`;
}

function isoDate(daysAgo: number) {
	const value = new Date();
	value.setHours(12, 0, 0, 0);
	value.setDate(value.getDate() - daysAgo);
	return value.toISOString().slice(0, 10);
}

async function ensureUser(config: (typeof QA_USERS)[number]) {
	let [existing] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.username, config.username))
		.limit(1);

	if (!existing) {
		await auth.api.signUpEmail({
			body: {
				name: config.name,
				email: config.email,
				password: QA_PASSWORD,
				username: config.username,
				displayUsername: config.username,
			},
		});
		[existing] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.username, config.username))
			.limit(1);
	}

	if (!existing) throw new Error(`Failed to create QA user ${config.username}`);

	await db
		.insert(userProfile)
		.values({
			id: existing.id,
			nama: config.name,
			role: config.role,
			halaqahName: config.halaqahName,
		})
		.onConflictDoUpdate({
			target: userProfile.id,
			set: {
				nama: config.name,
				role: config.role,
				halaqahName: config.halaqahName,
				updatedAt: new Date(),
			},
		});

	return existing.id;
}

await ensureUser(QA_USERS[0]);
const musyrifId = await ensureUser(QA_USERS[1]);

const students = NAMES.map((nama, index) => ({
	id: uuid(1, index + 1),
	musyrifId,
	nama,
	studentId: `QA-${String(index + 1).padStart(3, "0")}`,
	parentPassword: "qa-only",
	umur: 9 + (index % 8),
	hafalan: 2 + (index % 12),
	target: 8 + (index % 12),
	mulaiHafalan: "Al-Baqarah",
	metodeProgress: index % 3 === 0 ? "surah" : "juz",
	ziyadah: 1 + (index % 6),
	murajaah: 1 + (index % 8),
}));

for (const student of students) {
	await db
		.insert(siswa)
		.values(student)
		.onConflictDoUpdate({
			target: siswa.id,
			set: { ...student, updatedAt: new Date() },
		});
}

const grades = ["Jayyid", "Jayyid Jiddan", "Mumtaz", "Mutqin"] as const;
for (const [index, student] of students.entries()) {
	const baseSurah = 2 + (index % 25);
	const submissions = [
		{
			id: uuid(2, index * 3 + 1),
			siswaId: student.id,
			type: "Ziyadah",
			tanggal: isoDate(index % 11),
			surah: baseSurah,
			surahAkhir: index % 5 === 0 ? baseSurah + 1 : null,
			lintas: index % 5 === 0,
			ayatAwal: 1,
			ayatAkhir: 10 + (index % 15),
			juz: String(1 + (index % 30)),
			isMutqin: index % 7 === 0,
			status: grades[index % grades.length],
			catatan: index % 4 === 0 ? "Perhatikan panjang pendek bacaan." : null,
		},
		{
			id: uuid(2, index * 3 + 2),
			siswaId: student.id,
			type: "Murajaah",
			tanggal: isoDate(2 + (index % 8)),
			surah: Math.max(1, baseSurah - 1),
			surahAkhir: null,
			lintas: false,
			ayatAwal: 1,
			ayatAkhir: 15 + (index % 12),
			juz: String(1 + (index % 30)),
			isMutqin: index % 6 === 0,
			status: grades[(index + 2) % grades.length],
			catatan: null,
		},
	];

	if (index < 6) {
		submissions.push({
			id: uuid(2, index * 3 + 3),
			siswaId: student.id,
			type: "Ziyadah",
			tanggal: isoDate(1),
			surah: baseSurah,
			surahAkhir: null,
			lintas: false,
			ayatAwal: 11,
			ayatAkhir: 20,
			juz: String(1 + (index % 30)),
			isMutqin: false,
			status: index < 3 ? "Jayyid" : "Mumtaz",
			catatan: index < 3 ? "Kelancaran menurun dari setoran sebelumnya." : null,
		});
	}

	for (const submission of submissions) {
		await db
			.insert(setoran)
			.values(submission)
			.onConflictDoUpdate({ target: setoran.id, set: submission });
	}

	for (let day = 0; day < 7; day += 1) {
		const status = ["Hadir", "Hadir", "Izin", "Sakit", "Alpha"][
			(index + day) % 5
		];
		const attendance = {
			id: uuid(3, index * 7 + day + 1),
			siswaId: student.id,
			tanggal: isoDate(day),
			status,
		};
		await db
			.insert(presensi)
			.values(attendance)
			.onConflictDoUpdate({ target: presensi.id, set: attendance });
	}
}

await db
	.insert(waliLink)
	.values({
		id: uuid(4, 1),
		waliId: musyrifId,
		siswaId: students[0].id,
		hubungan: "Wali QA",
	})
	.onConflictDoUpdate({
		target: waliLink.id,
		set: { siswaId: students[0].id, hubungan: "Wali QA" },
	});

for (const config of [
	{ key: "school_name", value: "Pesantren QA Sijil" },
	{ key: "school_address", value: "Lingkungan pengujian lokal" },
	{ key: "academic_year", value: "2026/2027" },
]) {
	await db
		.insert(appConfig)
		.values(config)
		.onConflictDoUpdate({ target: appConfig.key, set: { value: config.value } });
}

console.log(
	`QA seed complete: ${QA_USERS.length} users, ${students.length} students, deterministic multi-day activity.`,
);
console.log("QA login: anasubaid19 or musyrifqa / SijilQA!2026");
console.log("Parent login: QA-001");
