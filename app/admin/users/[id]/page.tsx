"use client";

import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

function parseModules(modulesStr: string): string[] {
  try {
    const parsed = JSON.parse(modulesStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const moduleOptions = [
  { key: "finance", label: "Financeiro" },
  { key: "lists", label: "Listas" },
];

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = Number(params.id);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/users");
      const users: User[] = res.data;
      const found = users.find((u) => u.id === userId);
      if (!found) {
        toast.error("Usuário não encontrado.");
        router.push("/admin/users");
        return;
      }
      setUser(found);
      setEmail(found.email);
      setIsActive(found.is_active);
      setIsSuperuser(found.is_superuser);
      setSelectedModules(parseModules(found.modules));
    } catch {
      toast.error("Erro ao carregar usuário.");
      router.push("/admin/users");
    } finally {
      setLoading(false);
    }
  }, [userId, router]);

  useEffect(() => {
    const token = localStorage.getItem("dmapla_token");
    const su = localStorage.getItem("user_is_superuser");
    if (!token || su !== "true") {
      router.push("/login");
      return;
    }
    fetchUser();
  }, [fetchUser, router]);

  const toggleModule = (key: string) => {
    setSelectedModules((prev) =>
      prev.includes(key)
        ? prev.filter((m) => m !== key)
        : [...prev, key],
    );
  };

  const handleSave = async () => {
    if (!email.trim()) {
      toast.error("Email é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/users/${userId}`, {
        email: email.trim(),
        is_active: isActive,
        is_superuser: isSuperuser,
        modules: JSON.stringify(selectedModules),
      });
      toast.success("Usuário atualizado com sucesso!");
      router.push("/admin/users");
    } catch {
      toast.error("Erro ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8 flex items-center justify-center">
        <p className="text-slate-400">Carregando usuário...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400">Usuário não encontrado.</p>
        <Button
          variant="outline"
          className="bg-transparent border-zinc-800 text-white"
          onClick={() => router.push("/admin/users")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/users")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Editar Usuário</h1>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>
      </header>

      <Card className="bg-zinc-950 border-zinc-800 max-w-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Informações da Conta</CardTitle>
          <CardDescription className="text-slate-400">
            Altere os dados e permissões do usuário
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {/* Email */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              className="bg-zinc-900 border-zinc-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Ativo */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Ativo</p>
              <p className="text-xs text-slate-500">Usuário pode acessar o sistema</p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>

          {/* Superuser */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Administrador</p>
              <p className="text-xs text-slate-500">Acesso total ao painel admin</p>
            </div>
            <Switch
              checked={isSuperuser}
              onCheckedChange={setIsSuperuser}
              className="data-[state=checked]:bg-amber-600"
            />
          </div>

          {/* Módulos */}
          <div className="grid gap-3">
            <div>
              <p className="text-sm font-medium">Módulos Disponíveis</p>
              <p className="text-xs text-slate-500">
                Selecione os módulos que este usuário pode acessar
              </p>
            </div>
            {moduleOptions.map((mod) => (
              <div
                key={mod.key}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
              >
                <span className="text-sm">{mod.label}</span>
                <Switch
                  checked={selectedModules.includes(mod.key)}
                  onCheckedChange={() => toggleModule(mod.key)}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="mt-6 flex items-center gap-3 max-w-lg">
        <Button
          variant="outline"
          className="bg-transparent border-zinc-800 text-white hover:bg-zinc-900"
          onClick={() => router.push("/admin/users")}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          className="bg-white text-black hover:bg-slate-200"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            "Salvar"
          )}
        </Button>
      </div>
    </div>
  );
}
