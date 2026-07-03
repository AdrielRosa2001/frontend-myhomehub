"use client";

import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronLeft,
  Plus,
  Shield,
  ShieldOff,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function parseModules(modulesStr: string): string[] {
  try {
    const parsed = JSON.parse(modulesStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const moduleLabels: Record<string, string> = {
  finance: "Financeiro",
  lists: "Listas",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperuser, setIsSuperuser] = useState(false);

  // Modal criar
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Modal excluir
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("dmapla_token");
    const su = localStorage.getItem("user_is_superuser");
    if (!token) {
      router.push("/login");
      return;
    }
    if (su !== "true") {
      toast.error("Acesso restrito a administradores.");
      router.push("/");
      return;
    }
    setIsSuperuser(true);
  }, [router]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 401) {
        toast.error("Sessão expirada. Faça login novamente.");
        router.push("/login");
      } else if (error.response?.status === 403) {
        toast.error("Acesso restrito a administradores.");
        router.push("/");
      } else {
        toast.error("Erro ao carregar usuários.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isSuperuser) {
      fetchUsers();
    }
  }, [isSuperuser, fetchUsers]);

  const handleCreateUser = async () => {
    if (!newEmail.trim() || !newPassword.trim()) {
      toast.error("Email e senha são obrigatórios.");
      return;
    }
    try {
      await api.post("/users", {
        email: newEmail.trim(),
        password: newPassword,
      });
      toast.success("Usuário criado com sucesso!");
      setIsCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
      fetchUsers();
    } catch {
      toast.error("Erro ao criar usuário.");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success("Usuário excluído!");
      setIsDeleteOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch {
      toast.error("Erro ao excluir usuário.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8 flex items-center justify-center">
        <p className="text-slate-400">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="text-slate-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Gerenciar Usuários</h1>
          </div>
          <p className="text-slate-400 text-sm ml-10">
            Administração de contas e permissões
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-white text-black hover:bg-slate-200"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </header>

      {/* Tabela */}
      {users.length > 0 ? (
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-slate-400 font-medium px-4 py-3">ID</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Email</th>
                    <th className="text-center text-slate-400 font-medium px-4 py-3">Ativo</th>
                    <th className="text-center text-slate-400 font-medium px-4 py-3">Admin</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Módulos</th>
                    <th className="text-right text-slate-400 font-medium px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const mods = parseModules(user.modules);
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-400 text-xs">{user.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-50">{user.email}</td>
                        <td className="px-4 py-3 text-center">
                          {user.is_active ? (
                            <UserCheck className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <UserX className="h-4 w-4 text-red-500 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {user.is_superuser ? (
                            <Shield className="h-4 w-4 text-amber-500 mx-auto" />
                          ) : (
                            <ShieldOff className="h-4 w-4 text-slate-600 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {mods.length > 0
                              ? mods.map((m) => (
                                  <span
                                    key={m}
                                    className="text-[10px] uppercase tracking-wider text-slate-400 bg-zinc-900 px-1.5 py-0.5 rounded"
                                  >
                                    {moduleLabels[m] || m}
                                  </span>
                                ))
                              : <span className="text-[10px] text-slate-600">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                              title="Editar"
                            >
                              <Users className="h-3.5 w-3.5 text-slate-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => {
                                setUserToDelete(user);
                                setIsDeleteOpen(true);
                              }}
                              title="Excluir"
                              disabled={user.is_superuser}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500/70" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum usuário encontrado.</p>
        </div>
      )}

      {/* Modal Criar Usuário */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-slate-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                className="bg-zinc-900 border-zinc-800"
                placeholder="email@exemplo.com"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Senha *</label>
              <Input
                className="bg-zinc-900 border-zinc-800"
                placeholder="••••••••"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-transparent border-zinc-800 text-white"
              onClick={() => {
                setIsCreateOpen(false);
                setNewEmail("");
                setNewPassword("");
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-white text-black hover:bg-slate-200"
              onClick={handleCreateUser}
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-slate-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              O usuário <strong className="text-slate-50">{userToDelete?.email}</strong>{" "}
              será permanentemente removido. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-800 text-white hover:bg-zinc-900 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDeleteUser}
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
