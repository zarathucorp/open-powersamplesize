import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ValidationsPage() {
	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Validations</h1>

			<Card>
				<CardHeader>
					<CardTitle>Validation Against References</CardTitle>
				</CardHeader>
				<CardContent>
					<p>
						For validation purposes, each calculator is pre-populated with
						default values from an example in its primary cited reference. You
						can independently verify the results by executing the accompanying R
						code on each page, which utilizes the identical example data.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
