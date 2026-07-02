"use client";

import { api } from "@/lib/api";
import type { List, ListType } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Archive,
  ArchiveRestore,
  Copy,
  ListTodo,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const typeIcons: Record<ListType, { icon: React.ReactNode; label: string }> = {
  shopping: { icon: <ShoppingCart className="h-4 w-4" />, label: "Compras" },
  todo: { icon: <ListTodo className="h-4 w-4" />, label: "Tarefas" },
  bullet: { icon: <ListTodo className="h-4 w-4" />, label: "Simples" },
};

export default function ListsPage() {
  const router = useRouter();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal criar/editar
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingList, setEditingList] = useState<Partial<List> | null>(null);

  // Modal confirmar exclusão
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<number | null>(null);

  // Busca
  const [searchQuery, setSearchQuery] = useState("");
  // Alternar entre ativas e arquivadas
  const [showArchived, setShowArchived] = useState(false);

  const fetchLists = async (archived?: boolean) => {
    try {
      const statusParam = archived ? "archived" : "active";
      const res = await api.get(`/lists?status=${statusParam}`);
      setLists(res.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch {
      if (error.response?.status === 401) {
        toast.error("Sessão expirada. Faça login novamente.");
        router.push("/login");
      } else {
        toast.error("Erro ao carregar listas.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("dmapla_token");
    if (!token) {
      router.push("/login");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchLists(showArchived);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  const handleLogout = () => {
    localStorage.removeItem("dmapla_token");
    router.push("/login");
  };

  // Criar lista
  const openCreateModal = () => {
    setEditingList({ title: "", type: "bullet", description: "" });
    setIsCreateOpen(true);
  };

  const openEditModal = (list: List) => {
    setEditingList({ id: list.id, title: list.title, type: list.type, description: list.description });
    setIsCreateOpen(true);
  };

  const handleSaveList = async () => {
    if (!editingList?.title?.trim()) {
      toast.error("O título é obrigatório.");
      return;
    }
    try {
      if (editingList.id) {
        await api.patch(`/lists/${editingList.id}`, {
          title: editingList.title,
          type: editingList.type,
          description: editingList.description,
        });
        toast.success("Lista atualizada com sucesso!");
      } else {
        await api.post("/lists", {
          title: editingList.title,
          type: editingList.type,
          description: editingList.description,
        });
        toast.success("Lista criada com sucesso!");
      }
      setIsCreateOpen(false);
      setEditingList(null);
      fetchLists();
    } catch {
      toast.error("Erro ao salvar lista.");
    }
  };

  // Arquivar / Restaurar (toggle)
  const handleArchive = async (id: number) => {
    try {
      await api.post(`/lists/${id}/archive`);
      toast.success("Lista atualizada!");
      fetchLists(showArchived);
    } catch {
      toast.error("Erro ao atualizar lista.");
    }
  };

  // Duplicar
  const handleDuplicate = async (id: number) => {
    try {
      await api.post(`/lists/${id}/duplicate`);
      toast.success("Lista duplicada!");
      fetchLists(showArchived);
    } catch {
      toast.error("Erro ao duplicar lista.");
    }
  };

  // Excluir
  const openDeleteModal = (id: number) => {
    setListToDelete(id);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!listToDelete) return;
    try {
      await api.delete(`/lists/${listToDelete}`);
      toast.success("Lista excluída com sucesso!");
      setIsDeleteOpen(false);
      setListToDelete(null);
      fetchLists(showArchived);
    } catch {
      toast.error("Erro ao excluir lista.");
    }
  };

  // Filtro por busca
  const filteredLists = lists.filter((list) =>
    list.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Separar ativas e arquivadas
  const activeLists = filteredLists.filter((l) => l.status === "active");
  const archivedLists = filteredLists.filter((l) => l.status === "archived");

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8 flex items-center justify-center">
        <p className="text-slate-400">Carregando listas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listas</h1>
          <p className="text-slate-400 text-sm">Gerencie suas listas de compras, tarefas e mais</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={openCreateModal}
            className="bg-white text-black hover:bg-slate-200"
          >
            <Plus className="mr-2 h-4 w-4" /> Nova Lista
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sair do sistema"
          >
            <LogOut className="h-5 w-5 text-slate-400 hover:text-red-400" />
          </Button>
        </div>
      </header>

      {/* Busca */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Buscar listas por nome..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 h-9 text-sm"
        />
      </div>

      {/* Toggle Ativas / Arquivadas */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-sm font-medium ${!showArchived ? "text-slate-50" : "text-slate-500"}`}>
          Ativas
        </span>
        <Switch
          checked={showArchived}
          onCheckedChange={setShowArchived}
          className="data-[state=checked]:bg-zinc-700"
        />
        <span className={`text-sm font-medium ${showArchived ? "text-slate-50" : "text-slate-500"}`}>
          Arquivadas
        </span>
      </div>

      {/* Listas */}
      {(showArchived ? archivedLists : activeLists).length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-10">
          {(showArchived ? archivedLists : activeLists).map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onEdit={() => openEditModal(list)}
              onArchive={() => handleArchive(list.id)}
              onDuplicate={() => handleDuplicate(list.id)}
              onDelete={() => openDeleteModal(list.id)}
              onClick={() => router.push(`/lists/${list.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-slate-500 text-sm">
            {showArchived ? "Nenhuma lista arquivada." : "Nenhuma lista ativa."}
          </p>
        </div>
      )}

      {/* Estado vazio */}
      {filteredLists.length === 0 && !loading && (
        <div className="text-center py-16">
          <p className="text-slate-500 text-lg mb-2">
            {searchQuery ? "Nenhuma lista encontrada para esta busca." : "Nenhuma lista ainda."}
          </p>
          {!searchQuery && (
            <Button
              onClick={openCreateModal}
              className="bg-white text-black hover:bg-slate-200 mt-4"
            >
              <Plus className="mr-2 h-4 w-4" /> Criar primeira lista
            </Button>
          )}
        </div>
      )}

      {/* Modal Criar/Editar Lista */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-slate-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingList?.id ? "Editar Lista" : "Nova Lista"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Título *</label>
              <Input
                className="bg-zinc-900 border-zinc-800"
                placeholder="Ex: Compras do mês"
                value={editingList?.title || ""}
                onChange={(e) =>
                  setEditingList((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={editingList?.type || "bullet"}
                onValueChange={(val) =>
                  val && setEditingList((prev) => ({ ...prev, type: val as ListType }))
                }
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                  <SelectItem value="bullet">Simples</SelectItem>
                  <SelectItem value="todo">Tarefas</SelectItem>
                  <SelectItem value="shopping">Compras</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Input
                className="bg-zinc-900 border-zinc-800"
                placeholder="Descrição da lista..."
                value={editingList?.description || ""}
                onChange={(e) =>
                  setEditingList((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-transparent border-zinc-800 text-white"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingList(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-white text-black hover:bg-slate-200"
              onClick={handleSaveList}
            >
              {editingList?.id ? "Salvar" : "Criar"}
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
              Esta ação não pode ser desfeita. A lista será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-800 text-white hover:bg-zinc-900 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDelete}
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Componente de Card da Lista
function ListCard({
  list,
  onEdit,
  onArchive,
  onDuplicate,
  onDelete,
  onClick,
}: {
  list: List;
  onEdit: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const typeInfo = typeIcons[list.type];
  const completed = list.completed_count ?? 0;
  const total = list.item_count ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="bg-zinc-950 border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
      <div onClick={onClick}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-emerald-500">{typeInfo.icon}</span>
              <CardTitle className="text-sm font-medium text-slate-50">
                {list.title}
              </CardTitle>
            </div>
            {list.status === "archived" && (
              <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-zinc-900 px-2 py-0.5 rounded-full">
                Arquivada
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {list.description && (
            <p className="text-xs text-slate-500 mb-2 line-clamp-1">{list.description}</p>
          )}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="bg-zinc-900 px-2 py-0.5 rounded">{typeInfo.label}</span>
            {total > 0 && (
              <span>
                {completed}/{total} concluídos
              </span>
            )}
          </div>
          {total > 0 && (
            <div className="mt-2 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <p className="text-[10px] text-slate-600 mt-2">
            Atualizada em {format(new Date(list.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </CardContent>
      </div>
      {/* Ações - parando propagação do click */}
      <div className="px-6 pb-4 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onEdit}
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5 text-slate-400" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onArchive}
          title={list.status === "archived" ? "Restaurar" : "Arquivar"}
        >
          {list.status === "archived" ? (
            <ArchiveRestore className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Archive className="h-3.5 w-3.5 text-slate-400" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDuplicate}
          title="Duplicar"
        >
          <Copy className="h-3.5 w-3.5 text-slate-400" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDelete}
          title="Excluir"
