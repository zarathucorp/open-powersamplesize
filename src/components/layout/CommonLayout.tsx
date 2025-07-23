"use client";

import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react";
import React, { useState } from "react";

export default function CommonLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex bg-background min-h-screen">
            {/* Sidebar for desktop */}
            <aside className="hidden md:block w-64 border-r">
                <Sidebar />
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Header */}
                <header className="flex items-center border-b p-4">
                    {/* Mobile Menu Button */}
                    <div className="md:hidden mr-4">
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetTitle className="sr-only">
                                Menu
                            </SheetTitle>
                            <SheetContent side="left" className="p-0 w-64">
                                <Sidebar onLinkClick={() => setOpen(false)} />
                            </SheetContent>
                        </Sheet>
                    </div>
                    {/* Breadcrumbs for all screen sizes */}
                    <BreadcrumbNav />
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
