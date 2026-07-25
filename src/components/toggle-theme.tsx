"use client";

import { Computer, Dark, Day } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import React from "react";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
	{
		icon: <HugeiconsIcon icon={Computer} strokeWidth={2} />,
		value: "system",
	},
	{
		icon: <HugeiconsIcon icon={Day} strokeWidth={2} />,
		value: "light",
	},
	{
		icon: <HugeiconsIcon icon={Dark} strokeWidth={2} />,
		value: "dark",
	},
];

export function ToggleTheme() {
	const { theme, setTheme } = useTheme();
	const [isMounted, setIsMounted] = React.useState(false);

	React.useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return <div className="flex h-8 w-24" />;
	}

	return (
		<div className="inline-flex items-center overflow-hidden" role="radiogroup">
			{THEME_OPTIONS.map((option) => (
				<button
					aria-label={`Switch to ${option.value} theme`}
					className={cn(
						"relative flex size-7 cursor-pointer items-center justify-center rounded-md",
						"[&>svg]:size-3.5",
						theme === option.value
							? "text-foreground"
							: "text-muted-foreground hover:text-foreground",
					)}
					key={option.value}
					onClick={() => setTheme(option.value)}
					type="button"
				>
					{theme === option.value && (
						<div className="absolute inset-0 rounded-md border border-muted-foreground/50" />
					)}
					{option.icon}
				</button>
			))}
		</div>
	);
}
