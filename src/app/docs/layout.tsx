import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { Sidebar } from "@/components/layout/sidebar";
import React from "react";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <div className="border-b p-4">
          <BreadcrumbNav />
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
