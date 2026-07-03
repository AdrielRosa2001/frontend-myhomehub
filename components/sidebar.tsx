"use client";

import {
  DollarSign,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Shield,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

function parseModules(modulesStr: string | null): string[] {
  if (!modulesStr) return [];
  try {
    const parsed = JSON.parse(modulesStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [modules, setModules] = useState<string[]>([]);

  useEffect(() => {
    const su = localStorage.getItem("user_is_superuser");
    const mods = localStorage.getItem("user_modules");
    if (su !== null) setIsSuperuser(su === "true");
    if (mods !== null) {
      setModules(parseModules(mods));
    } else {
      setModules(["finance", "lists"]);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("dmapla_token");
    localStorage.removeItem("user_is_superuser");
    localStorage.removeItem("user_modules");
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navLinks = [
    { href: "/", label: "Home", icon: LayoutDashboard, show: true },
    { href: "/finance", label: "Financeiro", icon: DollarSign, show: modules.includes("finance") },
    { href: "/lists", label: "Listas", icon: ListTodo, show: modules.includes("lists") },
    { href: "/admin/users", label: "Admin", icon: Shield, show: isSuperuser },
  ].filter((link) => link.show);

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
        className={`fixed top-3 left-3 z-50 flex h-9 w-9 items-center justify-center rounded-md bg-zinc-950 border border-zinc-800 text-slate-300 md:hidden ${
          isMobileOpen ? "hidden" : ""
        }`}
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
