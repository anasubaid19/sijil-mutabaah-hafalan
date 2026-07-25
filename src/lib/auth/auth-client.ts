import { createAuthClient } from "better-auth/client";
import { usernameClient } from "better-auth/client/plugins";

// ponytail: empty baseURL = same origin, works on any port
export const authClient = createAuthClient({
	baseURL: "",
	plugins: [usernameClient()],
});
