import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "../db";

export const auth = betterAuth({
	trustedOrigins: (request) => {
		if (!request?.headers) return [];
		const origin = request.headers.get("origin");
		if (origin?.startsWith("http://localhost:")) return [origin];
		return [];
	},
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
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
