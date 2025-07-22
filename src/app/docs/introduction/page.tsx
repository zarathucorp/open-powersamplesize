import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function IntroductionPage() {
	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">
				Introduction to Open Power Samplesize
			</h1>

			<Card>
				<CardHeader>
					<CardTitle>What is Power and Sample Size?</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<p>
						<strong>Statistical power</strong> is the probability that a study
						will detect an effect when there is an effect to be detected. If
						statistical power is high, the probability of making a Type II
						error, or concluding there is no effect when, in fact, there is
						one, goes down.
					</p>
					<p>
						<strong>Sample size</strong> is the number of individual samples
						measured or observations used in a survey or experiment. A larger
						sample size provides more accurate results, but can be costly and
						time-consuming.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Why is it Important?</CardTitle>
				</CardHeader>
				<CardContent>
					<p>
						Calculating power and sample size is a critical step in the design
						of many research studies. An underpowered study is unlikely to
						find a true effect, making it a waste of time and resources. An
						overpowered study uses more participants than necessary, which can
						be unethical and wasteful.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>About This Application</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<p>
						<i>Open Power Samplesize</i> is a free, open-source web application
						designed to help researchers and students perform power and sample
						size calculations for various statistical tests. Our goal is to
						provide an intuitive and accessible tool for study design.
					</p>
					<p>
						This tool supports a wide range of scenarios, including tests for
						means, proportions, time-to-event data, and more.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Getting Started</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<p>
						To start, head over to the{" "}
						<Link
							href="/calculator/test-1-mean"
							className="text-sky-600 hover:underline"
						>
							Calculator
						</Link>{" "}
						and select the statistical test that matches your research design.
						Each calculator provides fields for the necessary parameters and
						will generate results and plots to help you understand the
						relationship between sample size, power, and effect size.
					</p>
					<p>
						For more detailed instructions, please
						visit our{" "}
						<Link
							href="/docs/howto"
							className="text-sky-600 hover:underline"
						>
							Usage
						</Link>{" "}
						and{" "}
						<Link
							href="/docs/references"
							className="text-sky-600 hover:underline"
						>
							References
						</Link>{" "}
						sections.
					</p>
					<p>
						For more detailed statistical background, please
						visit our{" "}
						<Link
							href="https://blog.zarathu.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sky-600 hover:underline"
						>
							Blog
						</Link>
						.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
