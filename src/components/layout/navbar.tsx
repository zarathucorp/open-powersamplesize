"use client";

import Link from "next/link";
import Image from "next/image";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Github, Linkedin, ExternalLink, Scale } from "lucide-react";

const isProd = process.env.NODE_ENV === "production";
const repo = "open-powersamplesize";
const basePath = isProd ? `/${repo}` : "";

export function Navbar() {
  return (
    <header className="border-b p-4 dark bg-background text-foreground">
      <div className="flex items-center justify-between">
        <Link href="/calculator" className="flex items-center gap-4 font-bold">
          Open <br className="md:hidden" /> Power Samplesize
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
              >
                <Link href="https://zarathu.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <div className="flex items-center justify-center rounded-full text-muted-foreground text-sm font-bold hidden md:inline">
                    Zarathu Corp.
                  </div>
                  <Image src={`${basePath}/logo.svg`} alt="Home" width={24} height={24} />
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
              >
                <Link href="https://openstat.ai/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <div className="flex items-center justify-center rounded-full text-muted-foreground text-sm font-bold hidden md:inline">
                    Openstat.ai
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground text-sm font-bold md:hidden">
                    Stat
                  </div>
                  {/* <ExternalLink className="w-4 h-4" /> */}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
              >
                <Link href="https://github.com/zarathucorp/open-powersamplesize" target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <Github className="w-6 h-6" />
                  {/* GitHub */}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
              >
                <Link href="https://www.linkedin.com/company/zarathu" target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <Linkedin className="w-6 h-6" />
                  {/* LinkedIn */}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}
