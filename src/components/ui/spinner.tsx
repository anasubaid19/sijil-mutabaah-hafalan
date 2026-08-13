import { LoaderCircle } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import { cn } from "@/lib/utils";

type SpinnerProps = Omit<HugeiconsIconProps, "icon">;

function Spinner({ className, ...props }: SpinnerProps) {
	return (
		<HugeiconsIcon
			icon={LoaderCircle}
			data-slot="spinner"
			role="status"
			aria-label="Loading"
			className={cn("size-4 animate-spin", className)}
			{...props}
			strokeWidth={props.strokeWidth ?? 2}
		/>
	);
}

export { Spinner };
