"use client";

import Link from "next/link";
import Image from "next/image";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Github, Linkedin, ExternalLink } from "lucide-react";

const isProd = process.env.NODE_ENV === "production";
const repo = "open-powersamplesize";
const basePath = isProd ? `/${repo}` : "";

export function Navbar() {
  return (
    <header className="border-b p-4 dark bg-background text-foreground">
      <div className="flex items-center justify-between">
        <Link href="/calculator" className="flex items-center gap-4 font-bold">
          Open Power Samplesize
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
              >
                <Link href="https://zarathu.com" target="_blank" rel="noopener noreferrer"  className="flex items-center">
                  Zarathu
                  <Image src={`${basePath}/logo.svg`} alt="Home" width={24} height={24} />
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
              >
                <Link href="https://openstat.ai/" target="_blank" rel="noopener noreferrer" className="flex items-center">
                  Openstat.ai
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
              >
                <Link href="https://github.com/zarathucorp" target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <Github className="w-4 h-4" />
                  {/* GitHub */}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
              >
                <Link href="https://www.linkedin.com/company/zarathu" target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <Linkedin className="w-4 h-4" />
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
