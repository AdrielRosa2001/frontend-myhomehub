"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/bottom-nav";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Login page doesn't have bottom nav
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return <BottomNav>{children}</BottomNav>;
}
