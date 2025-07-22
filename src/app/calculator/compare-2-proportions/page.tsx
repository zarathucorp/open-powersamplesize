"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Compare2ProportionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/calculator/compare-2-proportions/2-sided-equality");
  }, [router]);

  return null;
}
