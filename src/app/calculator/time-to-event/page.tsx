"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TimeToEventPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/calculator/time-to-event/cox-ph-2-sided");
  }, [router]);

  return null;
}
