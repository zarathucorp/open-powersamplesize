import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HowtoPage() {
	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">User Guide</h1>
			<p>
				This guide provides instructions for using the power and sample size
				calculators. While the tools are designed to be intuitive, the
				following points will help you get started.
			</p>

			<Card>
				<CardHeader>
					<CardTitle>Page Layout</CardTitle>
				</CardHeader>
				<CardContent>
					<p>
						The page for each calculator is organized into two primary
						sections. The top section contains the calculator interface and
						the corresponding output. The bottom section provides
						supplementary information and a navigation menu.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Using the Calculator</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="list-disc pl-5 space-y-2">
						<li>
							Upon opening a calculator, you will find the input fields
							pre-populated with example values. These can be replaced with
							your study&apos;s parameters. Please adhere to standard
							constraints, such as using only numeric values for numerical
							inputs, ensuring variances are positive, and keeping
							probabilities within the 0 to 1 range.
						</li>
						<li>
							All input fields must be completed to perform a calculation.
							The resulting sample size is shown at the top of the input
							form.
						</li>
						<li>
							Once you have entered your desired parameters, click the button
							at the bottom of the form. This will update the required
							sample size and regenerate the accompanying plot.
						</li>
						<li>
							The calculated sample size is always rounded up to the next
							integer. This rounding may result in a step-like appearance in
							the power curve plots.
						</li>
					</ul>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Interacting with the Plot</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="list-disc pl-5 space-y-2">
						<li>
							The plot serves as a visual tool to illustrate the sensitivity
							of the sample size calculation to changes in the input
							parameters.
						</li>
						<li>
							The vertical axis (y-axis) consistently represents the
							required sample size. The parameter plotted on the horizontal
							axis (x-axis) can be selected using the dropdown menu located
							beneath the plot.
						</li>
						<li>
							The range of the x-axis can be modified in two ways: by using
							the slider control or by manually entering minimum and maximum
							values into the corresponding input fields.
						</li>
						<li>
							The plot displays multiple curves, typically two or three, each
							corresponding to a different level of statistical power. The
							legend positioned above the plot clarifies the power level
							associated with each curve.
						</li>
						<li>
							Hovering the cursor over the plot will display the specific
							sample size and parameter value for the corresponding point on
							the curve in the legend area.
						</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
