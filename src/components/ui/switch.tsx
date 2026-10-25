import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

function Switch({
	className,
	size = "default",
	...props
}: SwitchPrimitive.Root.Props & {
	size?: "sm" | "default";
}) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			data-size={size}
			className={cn(
				"peer group/switch relative inline-flex shrink-0 items-center rounded-full border-0 transition-[background-color,box-shadow] duration-[var(--duration-normal)] ease-[var(--ease-default)] outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-4 focus-visible:ring-primary/25 aria-invalid:ring-4 aria-invalid:ring-destructive/20 data-[size=default]:h-[31px] data-[size=default]:w-[51px] data-[size=sm]:h-6 data-[size=sm]:w-10 data-checked:bg-system-green data-unchecked:bg-[rgb(120_120_128/0.32)] data-disabled:cursor-not-allowed data-disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className="pointer-events-none block rounded-full bg-white shadow-[0_2px_5px_rgb(0_0_0/0.18),0_0_1px_rgb(0_0_0/0.24)] ring-0 transition-transform duration-[var(--duration-normal)] ease-[var(--motion-ease-spring)] group-data-[size=default]/switch:h-[27px] group-data-[size=default]/switch:w-[27px] group-data-[size=sm]/switch:h-5 group-data-[size=sm]/switch:w-5 data-checked:translate-x-[calc(100%-0.3125rem)] data-unchecked:translate-x-0.5"
			/>
		</SwitchPrimitive.Root>
	);
}

export { Switch };
