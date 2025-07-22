"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompareKMeansPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/calculator/compare-k-means/1-way-anova-pairwise-2-sided");
  }, [router]);

  return null;
}
