import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
	title: string;
	subtitle?: ReactNode;
	actions?: ReactNode;
	className?: string;
}

/**
 * iOS large-title page header: one h1 per page, optional supporting text and
 * trailing actions.
 */
export function PageHeader({
	title,
	subtitle,
	actions,
	className,
}: PageHeaderProps) {
	return (
		<header
			className={cn(
				"flex flex-wrap items-end justify-between gap-x-4 gap-y-2",
				className,
			)}
		>
			<div className="min-w-0 space-y-0.5">
				<h1 className="text-large-title">{title}</h1>
				{subtitle ? (
					<p className="text-[0.9375rem] leading-snug text-muted-foreground">
						{subtitle}
					</p>
				) : null}
			</div>
			{actions ? (
				<div className="flex flex-wrap items-center gap-2">{actions}</div>
			) : null}
		</header>
	);
}
