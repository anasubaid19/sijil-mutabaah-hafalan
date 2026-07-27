import {
	boolean,
	date,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	username: text("username").notNull().unique(),
	displayUsername: text("display_username"),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	token: text("token").notNull().unique(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	idToken: text("id_token"),
	password: text("password"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userProfile = pgTable("user_profile", {
	id: text("id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	nama: varchar("nama", { length: 100 }).notNull(),
	role: varchar("role", { length: 20 }).notNull().default("musyrif"),
	halaqahName: varchar("halaqah_name", { length: 100 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const siswa = pgTable("siswa", {
	id: uuid("id").primaryKey().defaultRandom(),
	musyrifId: text("musyrif_id")
		.notNull()
		.references(() => userProfile.id),
	nama: varchar("nama", { length: 100 }).notNull(),
	studentId: text("student_id").unique(),
	parentPassword: text("parent_password"),
	umur: integer("umur"),
	hafalan: integer("hafalan").notNull().default(0),
	target: integer("target").notNull().default(0),
	mulaiHafalan: varchar("mulai_hafalan", { length: 50 }),
	metodeProgress: varchar("metode_progress", { length: 10 })
		.notNull()
		.default("juz"),
	ziyadah: integer("ziyadah").notNull().default(1),
	murajaah: integer("murajaah").notNull().default(1),
	terakhirIjazah: date("terakhir_ijazah"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const setoran = pgTable("setoran", {
	id: uuid("id").primaryKey().defaultRandom(),
	siswaId: uuid("siswa_id")
		.notNull()
		.references(() => siswa.id),
	type: varchar("type", { length: 20 }).notNull(),
	tanggal: date("tanggal").notNull(),
	surah: integer("surah").notNull(),
	ayatAwal: integer("ayat_awal").notNull(),
	ayatAkhir: integer("ayat_akhir").notNull(),
	juz: varchar("juz", { length: 10 }),
	isMutqin: boolean("is_mutqin").notNull().default(false),
	status: varchar("status", { length: 20 }).notNull().default("Tidak Lancar"),
	catatan: text("catatan"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const waliLink = pgTable("wali_link", {
	id: uuid("id").primaryKey().defaultRandom(),
	waliId: text("wali_id")
		.notNull()
		.references(() => userProfile.id),
	siswaId: uuid("siswa_id")
		.notNull()
		.references(() => siswa.id),
	hubungan: varchar("hubungan", { length: 30 }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const presensi = pgTable("presensi", {
	id: uuid("id").primaryKey().defaultRandom(),
	siswaId: uuid("siswa_id")
		.notNull()
		.references(() => siswa.id),
	tanggal: date("tanggal").notNull(),
	status: varchar("status", { length: 20 }).notNull().default("Hadir"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appConfig = pgTable("app_config", {
	key: varchar("key", { length: 50 }).primaryKey(),
	value: text("value"),
});
