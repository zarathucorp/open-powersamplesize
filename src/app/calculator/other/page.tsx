"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OtherPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/calculator/other/1-sample-normal");
  }, [router]);

  return null;
}
