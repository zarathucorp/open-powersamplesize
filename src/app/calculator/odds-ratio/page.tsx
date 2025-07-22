"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OddsRatioPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/calculator/odds-ratio/equality");
  }, [router]);

  return null;
}
