"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
	{
		title: "Documentation",
		items: [
			{ name: "Introduction", href: "/docs/introduction" },
			{ name: "Usage", href: "/docs/usage" },
			{ name: "References", href: "/docs/references" },
			{ name: "Validations", href: "/docs/validations" },
		],
	},
	{
		title: "Test 1 Mean",
		items: [
			{
				name: "1-Sample, 2-Sided Equality",
				href: "/calculator/test-1-mean/2-sided-equality",
			},
			{ name: "1-Sample, 1-Sided", href: "/calculator/test-1-mean/1-sided" },
			{
				name: "1-Sample Non-Inferiority or Superiority",
				href: "/calculator/test-1-mean/non-inferiority-superiority",
			},
			{ name: "1-Sample Equivalence", href: "/calculator/test-1-mean/equivalence" },
		],
	},
	{
		title: "Compare 2 Means",
		items: [
			{
				name: "2-Sample, 2-Sided Equality",
				href: "/calculator/compare-2-means/2-sided-equality",
			},
			{ name: "2-Sample, 1-Sided", href: "/calculator/compare-2-means/1-sided" },
			{
				name: "2-Sample Non-Inferiority or Superiority",
				href: "/calculator/compare-2-means/non-inferiority-superiority",
			},
			{ name: "2-Sample Equivalence", href: "/calculator/compare-2-means/equivalence" },
		],
	},
	{
		title: "Compare k Means",
		items: [
			{
				name: "1-Way ANOVA Pairwise, 2-Sided Equality",
				href: "/calculator/compare-k-means/1-way-anova-pairwise-2-sided",
			},
			{ name: "1-Way ANOVA Pairwise, 1-Sided", href: "/calculator/compare-k-means/1-way-anova-pairwise-1-sided" },
		],
	},
	{
		title: "Test 1 Proportion",
		items: [
			{
				name: "1-Sample, 2-Sided Equality",
				href: "/calculator/test-1-proportion/2-sided-equality",
			},
			{ name: "1-Sample, 1-Sided", href: "/calculator/test-1-proportion/1-sided" },
			{
				name: "1-Sample Non-Inferiority or Superiority",
				href: "/calculator/test-1-proportion/non-inferiority-superiority",
			},
			{ name: "1-Sample Equivalence", href: "/calculator/test-1-proportion/equivalence" },
		],
	},
	{
		title: "Compare 2 Proportions",
		items: [
			{
				name: "2-Sample, 2-Sided Equality",
				href: "/calculator/compare-2-proportions/2-sided-equality",
			},
			{ name: "2-Sample, 1-Sided", href: "/calculator/compare-2-proportions/1-sided" },
			{
				name: "2-Sample Non-Inferiority or Superiority",
				href: "/calculator/compare-2-proportions/non-inferiority-superiority",
			},
			{ name: "2-Sample Equivalence", href: "/calculator/compare-2-proportions/equivalence" },
		],
	},
	{
		title: "Compare Paired Proportions",
		items: [
			{
				name: "McNemar's Z-test, 2-Sided Equality",
				href: "/calculator/compare-paired-proportions/mcnemar-2-sided",
			},
			{ name: "McNemar's Z-test, 1-Sided", href: "/calculator/compare-paired-proportions/mcnemar-1-sided" },
		],
	},
	{
		title: "Compare k Proportions",
		items: [
			{
				name: "1-Way ANOVA Pairwise",
				href: "/calculator/compare-k-proportions/1-way-anova-pairwise",
			},
		],
	},
	{
		title: "Test Time-To-Event Data",
		items: [
			{
				name: "Cox PH, 2-Sided Equality",
				href: "/calculator/time-to-event/cox-ph-2-sided",
			},
			{
				name: "Cox PH 1-Sided, non-inferiority, or superiority",
				href: "/calculator/time-to-event/cox-ph-1-sided",
			},
			{ name: "Cox PH, Equivalence", href: "/calculator/time-to-event/cox-ph-equivalence" },
		],
	},
	{
		title: "Test Odds Ratio",
		items: [
			{ name: "Equality", href: "/calculator/odds-ratio/equality" },
			{
				name: "Non-Inferiority or Superiority",
				href: "/calculator/odds-ratio/non-inferiority-superiority",
			},
			{ name: "Equivalence", href: "/calculator/odds-ratio/equivalence" },
		],
	},
	{
		title: "Test Relative Incidence in Self Controlled Case Series Studies",
		items: [
			{ name: "SCCS, Alt-2", href: "/calculator/sccs/alt-2" },
		],
	},
	{
		title: "Other",
		items: [
			{ name: "1-Sample Normal", href: "/calculator/other/1-sample-normal" },
			{ name: "1-Sample Binomial", href: "/calculator/other/1-sample-binomial" },
		],
	},
];

export function Sidebar() {
	const pathname = usePathname();

	return (
        <aside className="w-64 border-r p-4 overflow-y-auto">
            {menuItems.map((section) => (
				<div key={section.title} className="mb-4">
					<h2 className="text-lg font-semibold mb-2">{section.title}</h2>
					<nav className="flex flex-col gap-1">
						{section.items.map((link) => (
							<Link
                                key={link.name}
                                href={link.href}
                                className={cn(
									"px-3 py-2 rounded-md text-sm font-medium",
									pathname === link.href
										? "bg-accent text-accent-foreground"
										: "text-muted-foreground hover:bg-accent/50"
								)}
								>
								{link.name}
							</Link>
						))}
					</nav>
				</div>
			))}
        </aside>
    );
}

