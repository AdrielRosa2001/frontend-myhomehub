"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Login page doesn't have sidebar
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return <Sidebar>{children}</Sidebar>;
}
