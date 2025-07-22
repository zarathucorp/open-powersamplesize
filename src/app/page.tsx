import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandingPagePlot } from "@/components/calculator/LandingPagePlot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-16">

          <div className="flex justify-center mb-8">
            <LandingPagePlot />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Welcome to Open Power Samplesize
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Your open-source tool for statistical power and sample size calculations.
          </p>
        </div>

        <div className="text-center mb-16">
          <Button asChild size="lg">
            <Link href="/calculator">Get Started</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Power and Sample Size</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-between">
              <p className="text-muted-foreground">
                Learn the fundamentals of statistical power and sample size, crucial for research design. The formulas our calculators use come from a wide range of scientific disciplines—including clinical trials, epidemiology, psychology, and more—to ensure reliable and efficient study results.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/docs/introduction">Learn More</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Built with R & JStat</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-between">
              <p className="text-muted-foreground">
                Our calculations are based on trusted R code and the jStat library, and we validate our output against published results. For full transparency, our code is open-source, with mathematical formulas and R code provided for each calculator.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/docs/references">See References</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Beyond Data, Creating Worlds.</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-between">
              <p className="text-muted-foreground">
                Zarathu goes beyond data analysis, partnering with researchers to create a more beautiful world. We provide custom data analysis applications, comprehensive research consulting from study design to publication, and R education, treating research as an art and researchers as fellow artists.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="https://www.zarathu.com/about">About Zarathu</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
