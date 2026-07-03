"use client";

import {
  DollarSign,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/finance", label: "Financeiro", icon: DollarSign },
  { href: "/lists", label: "Listas", icon: ListTodo },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("dmapla_token");
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile hamburger button */}
      <button
        className="fixed top-3 left-3 z-50 flex h-9 w-9 items-center justify-center rounded-md bg-zinc-950 border border-zinc-800 text-slate-300 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform duration-200 md:static md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black text-sm font-bold">
            H
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-50">
            MyHomeHub
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-zinc-800 px-3 py-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-zinc-400 hover:bg-zinc-800/50 hover:text-red-400"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Sair</span>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
    </div>
  );
}
