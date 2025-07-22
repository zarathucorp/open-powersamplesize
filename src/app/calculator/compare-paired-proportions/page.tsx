"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ComparePairedProportionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/calculator/compare-paired-proportions/mcnemar-2-sided");
  }, [router]);

  return null;
}
