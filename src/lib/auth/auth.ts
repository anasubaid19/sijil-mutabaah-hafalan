import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "../db";
import { userProfile } from "../db/schema";

export const auth = betterAuth({
	trustedOrigins: (request) => {
		if (!request?.headers) return [];
		const origin = request.headers.get("origin");
		if (origin?.startsWith("http://localhost:")) return [origin];
		const extra = process.env.TRUSTED_ORIGINS?.split(",") || [];
		if (origin && extra.includes(origin)) return [origin];
		return [];
	},
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	databaseHooks: {
		user: {
			create: {
				after: async (createdUser) => {
					await db.insert(userProfile).values({
						id: createdUser.id,
						nama: createdUser.name,
						role: "musyrif",
					});
				},
			},
		},
	},
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		username({
			minUsernameLength: 3,
			maxUsernameLength: 30,
		}),
	],
});
