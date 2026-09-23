"use client";

import { ChevronRight, LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MenuPage() {
  const router = useRouter();
  const [isSuperuser, setIsSuperuser] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("dmapla_token");
    const su = localStorage.getItem("user_is_superuser");
    if (!token) {
      router.push("/login");
      return;
    }
    setIsSuperuser(su === "true");
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("dmapla_token");
    localStorage.removeItem("user_is_superuser");
    localStorage.removeItem("user_modules");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
        <p className="text-slate-400 text-sm mt-1">
          Opções e configurações da sua conta
        </p>
      </header>

      <div className="mx-auto max-w-md space-y-2">
        {/* Admin / Gerenciamento de usuários — apenas para superusuários */}
        {isSuperuser && (
          <button
            onClick={() => router.push("/admin/users")}
            className="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-50">Administração</p>
              <p className="text-xs text-slate-500">
                Gerenciar usuários e permissões
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        )}

        {/* Sair / Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-left transition-colors hover:border-red-900/50 hover:bg-zinc-900"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
            <LogOut className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-400">Sair</p>
            <p className="text-xs text-slate-500">
              Encerrar sessão e voltar ao login
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-600" />
        </button>
      </div>
    </div>
  );
}
