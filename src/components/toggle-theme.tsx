"use client";

import { Dark, Day } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import React from "react";
import { Button } from "@/components/ui/button";

export function ToggleTheme() {
	const { theme, setTheme } = useTheme();
	const [isMounted, setIsMounted] = React.useState(false);

	React.useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return <div className="size-8" />;
	}

	const isDark = theme === "dark";

	return (
		<Button
			variant="ghost"
			size="icon-sm"
			onClick={() => setTheme(isDark ? "light" : "dark")}
			tooltip={isDark ? "Mode Terang" : "Mode Gelap"}
		>
			<HugeiconsIcon
				icon={isDark ? Day : Dark}
				className="size-4 transition-transform duration-300 rotate-0"
				strokeWidth={1.8}
			/>
		</Button>
	);
}
