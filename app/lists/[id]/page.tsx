"use client";

import { api } from "@/lib/api";
import type { List, ListItem } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Check,
  Copy,
  ListTodo,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
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

const typeIcons: Record<string, { icon: React.ReactNode; label: string }> = {
  shopping: { icon: <ShoppingCart className="h-5 w-5" />, label: "Compras" },
  todo: { icon: <ListTodo className="h-5 w-5" />, label: "Tarefas" },
  bullet: { icon: <ListTodo className="h-5 w-5" />, label: "Simples" },
};

export default function ListDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listId = Number(params.id);

  const [list, setList] = useState<List | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Input rápido
  const [newItemName, setNewItemName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Modal editar item
  const [isItemEditOpen, setIsItemEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ListItem> | null>(null);

  // Modal confirmar exclusão de item
  const [isDeleteItemOpen, setIsDeleteItemOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Modal confirmar exclusão da lista
  const [isDeleteListOpen, setIsDeleteListOpen] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const [listRes, itemsRes] = await Promise.all([
        api.get(`/lists/${listId}`),
        api.get(`/lists/${listId}/items`),
      ]);
      setList(listRes.data);
      setItems(itemsRes.data);
    } catch {
      if (error.response?.status === 401) {
        toast.error("Sessão expirada. Faça login novamente.");
        router.push("/login");
      } else {
        toast.error("Erro ao carregar lista.");
      }
    } finally {
      setLoading(false);
    }
  }, [listId, router]);

  useEffect(() => {
    const token = localStorage.getItem("dmapla_token");
    if (!token) {
      router.push("/login");
    } else {
      fetchList();
    }
  }, [fetchList, router]);

  // Foco no input ao carregar
  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  // Adicionar item via Enter
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newItemName.trim();
    if (!name) return;

    try {
      await api.post(`/lists/${listId}/items`, { text: name });
      setNewItemName("");
      toast.success("Item adicionado!");
      fetchList();
    } catch {
      toast.error("Erro ao adicionar item.");
    }
  };

  // Filtro dinâmico de itens (enquanto digita no input de adicionar)
  const filteredItems = newItemName.trim()
    ? items.filter((item) =>
        item.text.toLowerCase().includes(newItemName.trim().toLowerCase()),
      )
    : items;

  // Marcar/desmarcar conclusão
  const handleToggleItem = async (item: ListItem) => {
    try {
      await api.patch(`/lists/${listId}/items/${item.id}`, {
        is_completed: !item.is_completed,
      });
      fetchList();
    } catch {
      toast.error("Erro ao atualizar item.");
    }
  };

  // Abrir modal de edição de item
  const openEditItemModal = (item: ListItem) => {
    setEditingItem({
      id: item.id,
      text: item.text,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      priority: item.priority,
    });
    setIsItemEditOpen(true);
  };

  // Salvar edição de item
  const handleSaveItem = async () => {
    if (!editingItem?.id || !editingItem?.text?.trim()) {
      toast.error("O nome do item é obrigatório.");
      return;
    }
    try {
      await api.patch(`/lists/${listId}/items/${editingItem.id}`, {
        text: editingItem.text,
        quantity: editingItem.quantity,
        unit: editingItem.unit,
        category: editingItem.category,
        priority: editingItem.priority,
      });
      toast.success("Item atualizado!");
      setIsItemEditOpen(false);
      setEditingItem(null);
      fetchList();
    } catch {
      toast.error("Erro ao salvar item.");
    }
  };

  // Excluir item
  const openDeleteItemModal = (id: number) => {
    setItemToDelete(id);
    setIsDeleteItemOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/lists/${listId}/items/${itemToDelete}`);
      toast.success("Item excluído!");
      setIsDeleteItemOpen(false);
      setItemToDelete(null);
      fetchList();
    } catch {
      toast.error("Erro ao excluir item.");
    }
  };

  // Arquivar / Restaurar lista
  const handleArchive = async () => {
    if (!list) return;
    try {
      await api.post(`/lists/${listId}/archive`);
      toast.success("Lista atualizada!");
      router.push("/lists");
    } catch {
      toast.error("Erro ao atualizar lista.");
    }
  };

  // Duplicar lista
  const handleDuplicate = async () => {
    try {
      await api.post(`/lists/${listId}/duplicate`);
      toast.success("Lista duplicada!");
      router.push("/lists");
    } catch {
      toast.error("Erro ao duplicar lista.");
    }
  };

  // Excluir lista
  const handleDeleteList = async () => {
    try {
      await api.delete(`/lists/${listId}`);
      toast.success("Lista excluída!");
      router.push("/lists");
    } catch {
      toast.error("Erro ao excluir lista.");
    }
  };

  const completedCount = items.filter((i) => i.is_completed).length;
  const totalCount = items.length;
  const filteredCount = filteredItems.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const typeInfo = list ? typeIcons[list.type] || typeIcons.bullet : typeIcons.bullet;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8 flex items-center justify-center">
        <p className="text-slate-400">Carregando lista...</p>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8 flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <p className="text-slate-400">Lista não encontrada.</p>
        <Button
          variant="outline"
          className="bg-transparent border-zinc-800 text-white"
          onClick={() => router.push("/lists")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Listas
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8">
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500">{typeInfo.icon}</span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">{list.title}</h1>
              {list.status === "archived" && (
                <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-zinc-900 px-2 py-0.5 rounded-full">
                  Arquivada
                </span>
              )}
            </div>
            {list.description && (
              <p className="text-sm text-slate-500 mt-0.5">{list.description}</p>
            )}
            <p className="text-xs text-slate-600 mt-0.5">
              {typeInfo.label} · Criada em{" "}
              {format(new Date(list.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-black border-slate-700 hover:bg-slate-900"
            onClick={handleArchive}
          >
            <Archive className="mr-1 h-3.5 w-3.5" />
            {list.status === "archived" ? "Restaurar" : "Arquivar"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-black border-slate-700 hover:bg-slate-900"
            onClick={handleDuplicate}
          >
            <Copy className="mr-1 h-3.5 w-3.5" /> Duplicar
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsDeleteListOpen(true)}
            title="Excluir lista"
          >
            <Trash2 className="h-4 w-4 text-red-500/70" />
          </Button>
        </div>
      </header>

      {/* Barra de Progresso */}
      {totalCount > 0 && (
        <Card className="bg-zinc-950 border-zinc-800 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">Progresso</span>
              <span className="text-slate-300 font-medium">
                {completedCount}/{totalCount} concluídos ({progress}%)
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input rápido para adicionar item */}
      <form onSubmit={handleAddItem} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              ref={inputRef}
              placeholder="Adicionar item e pressionar Enter..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 h-10 text-sm"
            />
          </div>
          <Button
            type="submit"
            className="bg-white text-black hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Lista de Itens */}
      {filteredItems.length > 0 ? (
        <div className="space-y-2">
          {filteredItems
            .sort((a, b) => a.position - b.position)
            .map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 md:p-4 transition-all ${
                  item.is_completed ? "opacity-50" : ""
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleItem(item)}
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    item.is_completed
                      ? "bg-emerald-500 border-emerald-500"
                      : "border-zinc-600 hover:border-emerald-500/50"
                  }`}
                >
                  {item.is_completed && <Check className="h-3 w-3 text-white" />}
                </button>

                {/* Informações do item */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      item.is_completed ? "line-through text-slate-500" : "text-slate-50"
                    }`}
                  >
                    {item.text}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Quantidade/Unidade (shopping) */}
                    {(item.quantity || item.unit) && (
                      <span className="text-[11px] text-slate-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                        {item.quantity && `${item.quantity}`}
                        {item.unit && ` ${item.unit}`}
                      </span>
                    )}
                    {/* Categoria (shopping) */}
                    {item.category && (
                      <span className="text-[11px] text-slate-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                        {item.category}
                      </span>
                    )}
                    {/* Prioridade (todo) */}
                    {item.priority && (
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded ${
                          item.priority === "high"
                            ? "text-red-400 bg-red-500/10"
                            : item.priority === "medium"
                              ? "text-amber-400 bg-amber-500/10"
                              : "text-slate-500 bg-zinc-900"
                        }`}
                      >
                        {item.priority === "high"
                          ? "Alta"
                          : item.priority === "medium"
                            ? "Média"
                            : "Baixa"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEditItemModal(item)}
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openDeleteItemModal(item.id)}
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500/70" />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-slate-500">
            {newItemName.trim() ? "Nenhum item encontrado para esta busca." : "Nenhum item ainda. Adicione itens acima!"}
          </p>
        </div>
      )}

      {/* Modal Editar Item */}
      <Dialog open={isItemEditOpen} onOpenChange={setIsItemEditOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-slate-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input
                className="bg-zinc-900 border-zinc-800"
                value={editingItem?.text || ""}
                onChange={(e) =>
                  setEditingItem((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Campos específicos para tipo shopping */}
            {list.type === "shopping" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Quantidade</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="bg-zinc-900 border-zinc-800"
                      value={editingItem?.quantity ?? ""}
                      onChange={(e) =>
                        setEditingItem((prev) => ({
                          ...prev,
                          quantity: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Unidade</label>
                    <Input
                      className="bg-zinc-900 border-zinc-800"
                      placeholder="kg, L, un, cx..."
                      value={editingItem?.unit || ""}
                      onChange={(e) =>
                        setEditingItem((prev) => ({ ...prev, unit: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Input
                    className="bg-zinc-900 border-zinc-800"
                    placeholder="Ex: Hortifrúti, Limpeza..."
                    value={editingItem?.category || ""}
                    onChange={(e) =>
                      setEditingItem((prev) => ({ ...prev, category: e.target.value }))
                    }
                  />
                </div>
              </>
            )}

            {/* Campos específicos para tipo todo */}
            {list.type === "todo" && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Prioridade</label>
                <Select
                  value={editingItem?.priority || "medium"}
                  onValueChange={(val) =>
                    val && setEditingItem((prev) => ({ ...prev, priority: val as "low" | "medium" | "high" }))
                  }
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-transparent border-zinc-800 text-white"
              onClick={() => {
                setIsItemEditOpen(false);
                setEditingItem(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-white text-black hover:bg-slate-200"
              onClick={handleSaveItem}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão de Item */}
      <AlertDialog open={isDeleteItemOpen} onOpenChange={setIsDeleteItemOpen}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-slate-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Este item será permanentemente excluído da lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-800 text-white hover:bg-zinc-900 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDeleteItem}
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Confirmar Exclusão da Lista */}
      <AlertDialog open={isDeleteListOpen} onOpenChange={setIsDeleteListOpen}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-slate-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação não pode ser desfeita. A lista e todos os seus itens serão
              permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-800 text-white hover:bg-zinc-900 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDeleteList}
            >
              Sim, excluir tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
