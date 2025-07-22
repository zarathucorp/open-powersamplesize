"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SccsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/calculator/sccs/alt-2");
  }, [router]);

  return null;
}
