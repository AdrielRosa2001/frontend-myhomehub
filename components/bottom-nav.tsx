"use client";

import { DollarSign, LayoutDashboard, ListTodo, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function parseModules(modulesStr: string | null): string[] {
  if (!modulesStr) return [];
  try {
    const parsed = JSON.parse(modulesStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function BottomNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [modules, setModules] = useState<string[]>([]);

  useEffect(() => {
    const mods = localStorage.getItem("user_modules");
    if (mods !== null) {
      setModules(parseModules(mods));
    } else {
      setModules(["finance", "lists"]);
    }
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/menu") return pathname.startsWith("/menu");
    return pathname.startsWith(href);
  };

  // Botões fixos: Home, Financeiro, Listas e Menu (hambúrguer).
  // O gerenciamento de usuários fica apenas dentro da tela de Menu.
  const navLinks = [
    { href: "/", label: "Home", icon: LayoutDashboard, show: true },
    {
      href: "/finance",
      label: "Financeiro",
      icon: DollarSign,
      show: modules.includes("finance"),
    },
    {
      href: "/lists",
      label: "Listas",
      icon: ListTodo,
      show: modules.includes("lists"),
    },
    { href: "/menu", label: "Menu", icon: Menu, show: true },
  ].filter((link) => link.show);

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Conteúdo das páginas */}
      <main className="flex-1 pb-28">{children}</main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div
          className="mx-auto grid h-16 w-full max-w-lg"
          style={{
            gridTemplateColumns: `repeat(${navLinks.length}, minmax(0, 1fr))`,
          }}
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {active && (
                  <span className="absolute top-0 h-0.5 w-10 rounded-full bg-white" />
                )}
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 2} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
        {/* Safe area para iPhone (home indicator) */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
