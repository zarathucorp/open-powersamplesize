import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Welcome to Open Power Samplesize
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Your open-source tool for statistical power and sample size calculations.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild size="lg">
            <Link href="/calculator">Get Started</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
