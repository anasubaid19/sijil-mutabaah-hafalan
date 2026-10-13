import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

export function MigrationBanner() {
	const [state, setState] = useState<{
		enabled: boolean;
		message: string;
	} | null>(null);

	useEffect(() => {
		let active = true;
		fetch("/api/app-banner")
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (active && data) setState(data);
			})
			.catch(() => {});
		return () => {
			active = false;
		};
	}, []);

	if (!state?.enabled) return null;

	return (
		<div
			role="status"
			className="flex items-start gap-3 border-b border-amber-500/30 bg-amber-500/10 px-3 py-3 text-amber-900 md:px-6 dark:text-amber-200"
		>
			<HugeiconsIcon
				icon={Alert02Icon}
				strokeWidth={1.8}
				className="mt-0.5 size-5 shrink-0"
				aria-hidden
			/>
			<div className="min-w-0 space-y-0.5">
				<p className="text-sm font-semibold">Pemberitahuan Migrasi Server</p>
				<p className="text-sm">{state.message}</p>
			</div>
		</div>
	);
}
