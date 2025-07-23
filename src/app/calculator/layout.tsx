import React from "react";

import CommonLayout from "@/components/layout/CommonLayout";

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CommonLayout>{children}</CommonLayout>;
}
