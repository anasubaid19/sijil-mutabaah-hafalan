import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export const GRADES = ["Jayyid", "Jayyid Jiddan", "Mumtaz", "Mutqin"] as const;

const GRADE_DESCRIPTIONS: Record<(typeof GRADES)[number], string> = {
	Jayyid: "Baik, tetapi masih memerlukan beberapa koreksi.",
	"Jayyid Jiddan": "Sangat baik dengan koreksi ringan.",
	Mumtaz: "Istimewa, lancar, dan tepat.",
	Mutqin: "Sangat kokoh dan hafalan terjaga.",
};

interface GradeSelectorProps {
	id: string;
	value: string;
	onChange: (grade: string) => void;
}

export function GradeSelector({ id, value, onChange }: GradeSelectorProps) {
	return (
		<div className="space-y-2">
			<p id={`${id}-label`} className="text-sm font-medium">
				Penilaian
			</p>
			<TooltipProvider delay={350}>
				<div
					role="group"
					aria-labelledby={`${id}-label`}
					className="grid grid-cols-2 gap-2 sm:inline-flex"
				>
					{GRADES.map((grade) => {
						const selected = value === grade;
						return (
							<Tooltip key={grade}>
								<TooltipTrigger
									render={
										<button
											type="button"
											aria-pressed={selected}
											onClick={() => onChange(grade)}
											className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-[border-color,background-color,color,box-shadow] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-primary/15 ${
												selected
													? "border-primary bg-primary/10 text-primary shadow-xs"
													: "border-input bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
											}`}
										/>
									}
								>
									{selected && (
										<HugeiconsIcon
											icon={CheckmarkCircle02Icon}
											className="size-4"
											aria-hidden
										/>
									)}
									{grade}
								</TooltipTrigger>
								<TooltipContent>{GRADE_DESCRIPTIONS[grade]}</TooltipContent>
							</Tooltip>
						);
					})}
				</div>
			</TooltipProvider>
		</div>
	);
}
