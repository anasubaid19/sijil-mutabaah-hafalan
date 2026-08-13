import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"flex field-sizing-content min-h-16 w-full resize-none rounded-xl border border-input bg-background px-3 py-3 text-base shadow-xs transition-[border-color,box-shadow,background-color,color] outline-none placeholder:text-muted-foreground hover:border-foreground/25 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 read-only:cursor-default read-only:border-border read-only:bg-muted/60 read-only:text-muted-foreground disabled:cursor-not-allowed disabled:border-border disabled:bg-muted/60 disabled:text-muted-foreground disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
