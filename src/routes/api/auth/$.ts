import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/auth";
import { isMigrationMode, migrationBlockedResponse } from "@/lib/migration";

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				return auth.handler(request);
			},
			POST: async ({ request }) => {
				const path = new URL(request.url).pathname;
				if (path.includes("/sign-up/") && (await isMigrationMode())) {
					return migrationBlockedResponse();
				}
				return auth.handler(request);
			},
		},
	},
});
