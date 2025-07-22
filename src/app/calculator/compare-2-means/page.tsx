"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Compare2MeansPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/calculator/compare-2-means/2-sided-equality");
  }, [router]);

  return null;
}
