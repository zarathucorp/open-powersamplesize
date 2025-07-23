import React from "react";

import CommonLayout from "@/components/layout/CommonLayout";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CommonLayout>{children}</CommonLayout>;
}
