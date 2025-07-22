"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompareKProportionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/calculator/compare-k-proportions/1-way-anova-pairwise");
  }, [router]);

  return null;
}
