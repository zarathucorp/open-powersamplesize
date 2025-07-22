"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Test1ProportionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/calculator/test-1-proportion/2-sided-equality");
  }, [router]);

  return null;
}
