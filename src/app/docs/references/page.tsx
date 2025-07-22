

export default function ReferencesPage() {
	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">
				References
			</h1>
			<div className="p-4 border-l-4 rounded-md bg-muted space-y-2 mb-4" key={0}>
				<p key={0} className="italic">Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series.</p>
			</div>
			<div className="p-4 border-l-4 rounded-md bg-muted space-y-2 mb-4" key={1}>
				<p key={1} className="italic">Connor R. J. 1987. Sample size for testing differences in proportions for the paired-sample design. Biometrics 43(1):207-211.</p>
			</div>
			<div className="p-4 border-l-4 rounded-md bg-muted space-y-2 mb-4" key={2}>
				<p key={2} className="italic">Farrington CP. 1995. Relative incidence estimation from case series for vaccine safety evaluation. Biometrics 51:228-235.</p>
			</div>
			<div className="p-4 border-l-4 rounded-md bg-muted space-y-2 mb-4" key={3}>
				<p key={3} className="italic">Musonda, P, CP Farrington, HJ Whitaker. 2006. Sample sizes for self-controlled case series studies. Statistics in Medicine 25:2618-2631.</p>
			</div>
			<div className="p-4 border-l-4 rounded-md bg-muted space-y-2 mb-4" key={4}>
				<p key={4} className="italic">Rosner B. 2010. Fundamentals of Biostatistics. 7th Ed. Brooks/Cole.</p>
			</div>
		</div>
	);
}
