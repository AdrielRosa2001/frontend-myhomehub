"use client";

import { DollarSign, ListTodo, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const modules = [
  {
    title: "Módulo Financeiro",
    description: "Controle de gastos, receitas e relatórios financeiros",
    icon: DollarSign,
    href: "/finance",
  },
  {
    title: "Listas",
    description: "Listas de compras, tarefas e anotações",
    icon: ListTodo,
    href: "/lists",
  },
];

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("dmapla_token");
    if (!token) {
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("dmapla_token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8">
      {/* Header */}
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MyHomeHub</h1>
          <p className="text-slate-400 text-sm mt-1">
            Selecione um módulo para começar
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Sair do sistema"
        >
          <LogOut className="h-5 w-5 text-slate-400 hover:text-red-400" />
        </Button>
      </header>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card
              key={mod.href}
              className="bg-zinc-950 border-zinc-800 cursor-pointer transition-all hover:border-zinc-600 hover:ring-1 hover:ring-zinc-600/50"
              onClick={() => router.push(mod.href)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800">
                    <Icon className="h-6 w-6 text-emerald-500" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-50">
                    {mod.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-400 leading-relaxed">
                  {mod.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
