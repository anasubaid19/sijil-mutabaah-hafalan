import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[0.875rem] border border-transparent font-semibold outline-none transition-[background-color,color,box-shadow,transform,opacity] duration-[var(--duration-fast)] ease-[var(--ease-default)] select-none touch-manipulation active:scale-[0.97] focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5",
	{
		defaultVariants: {
			size: "default",
			variant: "default",
		},
		variants: {
			size: {
				default: "h-11 px-5 text-[1.0625rem] sm:h-9 sm:px-4 sm:text-[0.9375rem]",
				icon: "size-11 sm:size-9",
				"icon-lg": "size-12 sm:size-10",
				"icon-sm": "size-9 sm:size-8",
				"icon-xl":
					"size-13 sm:size-11 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
				"icon-xs":
					"size-8 rounded-[0.625rem] sm:size-7 not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-4 sm:not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-12 px-6 text-[1.0625rem] sm:h-10",
				sm: "h-9 gap-1.5 px-3.5 text-[0.9375rem] sm:h-8",
				xl: "h-13 px-7 text-[1.125rem] sm:h-11 sm:text-[1.0625rem] [&_svg:not([class*='size-'])]:size-5",
				xs: "h-8 gap-1 rounded-[0.625rem] px-3 text-[0.8125rem] sm:h-7",
			},
			variant: {
				default:
					"bg-primary text-primary-foreground hover:bg-primary/90 data-pressed:bg-primary/80",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90 data-pressed:bg-destructive/80",
				"destructive-outline":
					"border-destructive/25 bg-card text-destructive hover:bg-destructive/10 data-pressed:bg-destructive/15",
				ghost:
					"text-foreground hover:bg-accent data-pressed:bg-accent",
				link: "text-primary underline-offset-4 hover:underline data-pressed:underline",
				outline:
					"border-border bg-card text-foreground hover:bg-accent data-pressed:bg-accent/80",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80 data-pressed:bg-secondary/70",
			},
		},
	},
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants> & {
		isLoading?: boolean;
		loadingText?: React.ReactNode;
		nativeButton?: boolean;
		render?: React.ReactElement;
	};

function hasTextContent(node: React.ReactNode): boolean {
	return React.Children.toArray(node).some((child) => {
		if (typeof child === "string") {
			return child.trim().length > 0;
		}

		if (typeof child === "number") {
			return true;
		}

		if (!React.isValidElement<{ children?: React.ReactNode }>(child)) {
			return false;
		}

		return hasTextContent(child.props.children);
	});
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			children,
			className,
			disabled,
			isLoading = false,
			loadingText,
			nativeButton: _nativeButton,
			render,
			size,
			type,
			variant,
			...props
		},
		ref,
	) => {
		const childNodes = React.Children.toArray(children).filter(
			(child) => child !== null && child !== undefined,
		);
		const hasTextChild = hasTextContent(children);
		const isIconOnly = !hasTextChild && childNodes.length <= 1;

		let content = children;
		if (isLoading) {
			if (loadingText !== undefined) {
				content = (
					<>
						<Spinner className="size-4" />
						<span data-slot="button-content">{loadingText}</span>
					</>
				);
			} else if (isIconOnly) {
				content = <Spinner className="size-4" />;
			} else {
				content = (
					<>
						<Spinner className="size-4" />
						<span data-slot="button-content">{children}</span>
					</>
				);
			}
		}

		return useRender({
			defaultTagName: "button",
			props: {
				"aria-busy": isLoading || undefined,
				"data-loading": isLoading || undefined,
				"data-slot": "button",
				className: cn(buttonVariants({ className, size, variant })),
				disabled: disabled || isLoading,
				type: type ?? "button",
				...props,
				children: content,
			},
			ref,
			render,
		});
	},
);

Button.displayName = "Button";

export { Button, buttonVariants };
