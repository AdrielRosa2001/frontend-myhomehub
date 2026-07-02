1|"use client";
2|
3|import { api } from "@/lib/api";
4|import type { List, ListType } from "@/lib/types";
5|import { format } from "date-fns";
6|import { ptBR } from "date-fns/locale";
7|import {
8|  Archive,
9|  ArchiveRestore,
10|  Copy,
11|  ListTodo,
12|  LogOut,
13|  Pencil,
14|  Plus,
15|  Search,
16|  ShoppingCart,
17|  Trash2,
18|} from "lucide-react";
19|import { useRouter } from "next/navigation";
20|import { useEffect, useState } from "react";
21|import { toast } from "sonner";
22|
23|import {
24|  AlertDialog,
25|  AlertDialogAction,
26|  AlertDialogCancel,
27|  AlertDialogContent,
28|  AlertDialogDescription,
29|  AlertDialogFooter,
30|  AlertDialogHeader,
31|  AlertDialogTitle,
32|} from "@/components/ui/alert-dialog";
33|import { Button } from "@/components/ui/button";
34|import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
35|import {
36|  Dialog,
37|  DialogContent,
38|  DialogFooter,
39|  DialogHeader,
40|  DialogTitle,
41|42|} from "@/components/ui/dialog";
43|import { Input } from "@/components/ui/input";
44|import {
45|  Select,
46|  SelectContent,
47|  SelectItem,
48|  SelectTrigger,
49|  SelectValue,
50|} from "@/components/ui/select";
51|import { Switch } from "@/components/ui/switch";
52|
53|const typeIcons: Record<ListType, { icon: React.ReactNode; label: string }> = {
54|  shopping: { icon: <ShoppingCart className="h-4 w-4" />, label: "Compras" },
55|  todo: { icon: <ListTodo className="h-4 w-4" />, label: "Tarefas" },
56|  bullet: { icon: <ListTodo className="h-4 w-4" />, label: "Simples" },
57|};
58|
59|const typeLabels: Record<ListType, string> = {
60|  shopping: "Compras",
61|  todo: "Tarefas",
62|  bullet: "Simples",
63|};
64|
65|export default function ListsPage() {
66|  const router = useRouter();
67|  const [lists, setLists] = useState<List[]>([]);
68|  const [loading, setLoading] = useState(true);
69|
70|  // Modal criar/editar
71|  const [isCreateOpen, setIsCreateOpen] = useState(false);
72|  const [editingList, setEditingList] = useState<Partial<List> | null>(null);
73|
74|  // Modal confirmar exclusão
75|  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
76|  const [listToDelete, setListToDelete] = useState<number | null>(null);
77|
78|  // Busca
79|  const [searchQuery, setSearchQuery] = useState("");
80|  // Alternar entre ativas e arquivadas
81|  const [showArchived, setShowArchived] = useState(false);
82|
83|  const fetchLists = async (archived?: boolean) => {
84|    try {
85|      const statusParam = archived ? "archived" : "active";
86|      const res = await api.get(`/lists?status=${statusParam}`);
87|      setLists(res.data);
88|    // eslint-disable-next-line @typescript-eslint/no-explicit-any
89|    } catch {
90|      if (error.response?.status === 401) {
91|        toast.error("Sessão expirada. Faça login novamente.");
92|        router.push("/login");
93|      } else {
94|        toast.error("Erro ao carregar listas.");
95|      }
96|    } finally {
97|      setLoading(false);
98|    }
99|  };
100|
101|  useEffect(() => {
102|    const token = localStorage.getItem("dmapla_token");
103|    if (!token) {
104|      router.push("/login");
105|    } else {
106|      // eslint-disable-next-line react-hooks/set-state-in-effect
107|      fetchLists(showArchived);
108|    }
109|    // eslint-disable-next-line react-hooks/exhaustive-deps
110|  }, [showArchived]);
111|
112|  const handleLogout = () => {
113|    localStorage.removeItem("dmapla_token");
114|    router.push("/login");
115|  };
116|
117|  // Criar lista
118|  const openCreateModal = () => {
119|    setEditingList({ title: "", type: "bullet", description: "" });
120|    setIsCreateOpen(true);
121|  };
122|
123|  const openEditModal = (list: List) => {
124|    setEditingList({ id: list.id, title: list.title, type: list.type, description: list.description });
125|    setIsCreateOpen(true);
126|  };
127|
128|  const handleSaveList = async () => {
129|    if (!editingList?.title?.trim()) {
130|      toast.error("O título é obrigatório.");
131|      return;
132|    }
133|    try {
134|      if (editingList.id) {
135|        await api.patch(`/lists/${editingList.id}`, {
136|          title: editingList.title,
137|          type: editingList.type,
138|          description: editingList.description,
139|        });
140|        toast.success("Lista atualizada com sucesso!");
141|      } else {
142|        await api.post("/lists", {
143|          title: editingList.title,
144|          type: editingList.type,
145|          description: editingList.description,
146|        });
147|        toast.success("Lista criada com sucesso!");
148|      }
149|      setIsCreateOpen(false);
150|      setEditingList(null);
151|      fetchLists();
152|    } catch (error) {
153|      toast.error("Erro ao salvar lista.");
154|    }
155|  };
156|
157|  // Arquivar / Restaurar (toggle)
158|  const handleArchive = async (id: number) => {
159|    try {
160|      await api.post(`/lists/${id}/archive`);
161|      toast.success("Lista atualizada!");
162|      fetchLists(showArchived);
163|    } catch (error) {
164|      toast.error("Erro ao atualizar lista.");
165|    }
166|  };
167|
168|  // Duplicar
169|  const handleDuplicate = async (id: number) => {
170|    try {
171|      await api.post(`/lists/${id}/duplicate`);
172|      toast.success("Lista duplicada!");
173|      fetchLists(showArchived);
174|    } catch (error) {
175|      toast.error("Erro ao duplicar lista.");
176|    }
177|  };
178|
179|  // Excluir
180|  const openDeleteModal = (id: number) => {
181|    setListToDelete(id);
182|    setIsDeleteOpen(true);
183|  };
184|
185|  const handleDelete = async () => {
186|    if (!listToDelete) return;
187|    try {
188|      await api.delete(`/lists/${listToDelete}`);
189|      toast.success("Lista excluída com sucesso!");
190|      setIsDeleteOpen(false);
191|      setListToDelete(null);
192|      fetchLists(showArchived);
193|    } catch (error) {
194|      toast.error("Erro ao excluir lista.");
195|    }
196|  };
197|
198|  // Filtro por busca
199|  const filteredLists = lists.filter((list) =>
200|    list.title.toLowerCase().includes(searchQuery.toLowerCase()),
201|  );
202|
203|  // Separar ativas e arquivadas
204|  const activeLists = filteredLists.filter((l) => l.status === "active");
205|  const archivedLists = filteredLists.filter((l) => l.status === "archived");
206|
207|  if (loading) {
208|    return (
209|      <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8 flex items-center justify-center">
210|        <p className="text-slate-400">Carregando listas...</p>
211|      </div>
212|    );
213|  }
214|
215|  return (
216|    <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8">
217|      {/* Header */}
218|      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
219|        <div>
220|          <h1 className="text-2xl font-bold tracking-tight">Listas</h1>
221|          <p className="text-slate-400 text-sm">Gerencie suas listas de compras, tarefas e mais</p>
222|        </div>
223|        <div className="flex items-center gap-2">
224|          <Button
225|            onClick={openCreateModal}
226|            className="bg-white text-black hover:bg-slate-200"
227|          >
228|            <Plus className="mr-2 h-4 w-4" /> Nova Lista
229|          </Button>
230|          <Button
231|            variant="ghost"
232|            size="icon"
233|            onClick={handleLogout}
234|            title="Sair do sistema"
235|          >
236|            <LogOut className="h-5 w-5 text-slate-400 hover:text-red-400" />
237|          </Button>
238|        </div>
239|      </header>
240|
241|      {/* Busca */}
242|      <div className="relative max-w-sm mb-6">
243|        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
244|        <Input
245|          placeholder="Buscar listas por nome..."
246|          value={searchQuery}
247|          onChange={(e) => setSearchQuery(e.target.value)}
248|          className="pl-9 bg-zinc-900 border-zinc-800 h-9 text-sm"
249|        />
250|      </div>
251|
252|      {/* Toggle Ativas / Arquivadas */}
253|      <div className="flex items-center gap-3 mb-4">
254|        <span className={`text-sm font-medium ${!showArchived ? "text-slate-50" : "text-slate-500"}`}>
255|          Ativas
256|        </span>
257|        <Switch
258|          checked={showArchived}
259|          onCheckedChange={setShowArchived}
260|          className="data-[state=checked]:bg-zinc-700"
261|        />
262|        <span className={`text-sm font-medium ${showArchived ? "text-slate-50" : "text-slate-500"}`}>
263|          Arquivadas
264|        </span>
265|      </div>
266|
267|      {/* Listas */}
268|      {(showArchived ? archivedLists : activeLists).length > 0 ? (
269|        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-10">
270|          {(showArchived ? archivedLists : activeLists).map((list) => (
271|            <ListCard
272|              key={list.id}
273|              list={list}
274|              onEdit={() => openEditModal(list)}
275|              onArchive={() => handleArchive(list.id)}
276|              onDuplicate={() => handleDuplicate(list.id)}
277|              onDelete={() => openDeleteModal(list.id)}
278|              onClick={() => router.push(`/lists/${list.id}`)}
279|            />
280|          ))}
281|        </div>
282|      ) : (
283|        <div className="text-center py-10">
284|          <p className="text-slate-500 text-sm">
285|            {showArchived ? "Nenhuma lista arquivada." : "Nenhuma lista ativa."}
286|          </p>
287|        </div>
288|      )}
289|
290|      {/* Estado vazio */}
291|      {filteredLists.length === 0 && !loading && (
292|        <div className="text-center py-16">
293|          <p className="text-slate-500 text-lg mb-2">
294|            {searchQuery ? "Nenhuma lista encontrada para esta busca." : "Nenhuma lista ainda."}
295|          </p>
296|          {!searchQuery && (
297|            <Button
298|              onClick={openCreateModal}
299|              className="bg-white text-black hover:bg-slate-200 mt-4"
300|            >
301|              <Plus className="mr-2 h-4 w-4" /> Criar primeira lista
302|            </Button>
303|          )}
304|        </div>
305|      )}
306|
307|      {/* Modal Criar/Editar Lista */}
308|      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
309|        <DialogContent className="bg-zinc-950 border-zinc-800 text-slate-50 sm:max-w-md">
310|          <DialogHeader>
311|            <DialogTitle>{editingList?.id ? "Editar Lista" : "Nova Lista"}</DialogTitle>
312|          </DialogHeader>
313|          <div className="grid gap-4 py-4">
314|            <div className="grid gap-2">
315|              <label className="text-sm font-medium">Título *</label>
316|              <Input
317|                className="bg-zinc-900 border-zinc-800"
318|                placeholder="Ex: Compras do mês"
319|                value={editingList?.title || ""}
320|                onChange={(e) =>
321|                  setEditingList((prev) => ({ ...prev, title: e.target.value }))
322|                }
323|              />
324|            </div>
325|            <div className="grid gap-2">
326|              <label className="text-sm font-medium">Tipo</label>
327|              <Select
328|                value={editingList?.type || "bullet"}
329|                onValueChange={(val) =>
330|                  val && setEditingList((prev) => ({ ...prev, type: val as ListType }))
331|                }
332|              >
333|                <SelectTrigger className="bg-zinc-900 border-zinc-800">
334|                  <SelectValue />
335|                </SelectTrigger>
336|                <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
337|                  <SelectItem value="bullet">Simples</SelectItem>
338|                  <SelectItem value="todo">Tarefas</SelectItem>
339|                  <SelectItem value="shopping">Compras</SelectItem>
340|                </SelectContent>
341|              </Select>
342|            </div>
343|            <div className="grid gap-2">
344|              <label className="text-sm font-medium">Descrição (opcional)</label>
345|              <Input
346|                className="bg-zinc-900 border-zinc-800"
347|                placeholder="Descrição da lista..."
348|                value={editingList?.description || ""}
349|                onChange={(e) =>
350|                  setEditingList((prev) => ({ ...prev, description: e.target.value }))
351|                }
352|              />
353|            </div>
354|          </div>
355|          <DialogFooter>
356|            <Button
357|              variant="outline"
358|              className="bg-transparent border-zinc-800 text-white"
359|              onClick={() => {
360|                setIsCreateOpen(false);
361|                setEditingList(null);
362|              }}
363|            >
364|              Cancelar
365|            </Button>
366|            <Button
367|              className="bg-white text-black hover:bg-slate-200"
368|              onClick={handleSaveList}
369|            >
370|              {editingList?.id ? "Salvar" : "Criar"}
371|            </Button>
372|          </DialogFooter>
373|        </DialogContent>
374|      </Dialog>
375|
376|      {/* Modal Confirmar Exclusão */}
377|      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
378|        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-slate-50">
379|          <AlertDialogHeader>
380|            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
381|            <AlertDialogDescription className="text-slate-400">
382|              Esta ação não pode ser desfeita. A lista será permanentemente excluída.
383|            </AlertDialogDescription>
384|          </AlertDialogHeader>
385|          <AlertDialogFooter>
386|            <AlertDialogCancel className="bg-transparent border-zinc-800 text-white hover:bg-zinc-900 hover:text-white">
387|              Cancelar
388|            </AlertDialogCancel>
389|            <AlertDialogAction
390|              className="bg-red-600 text-white hover:bg-red-700"
391|              onClick={handleDelete}
392|            >
393|              Sim, excluir
394|            </AlertDialogAction>
395|          </AlertDialogFooter>
396|        </AlertDialogContent>
397|      </AlertDialog>
398|    </div>
399|  );
400|}
401|
402|// Componente de Card da Lista
403|function ListCard({
404|  list,
405|  onEdit,
406|  onArchive,
407|  onDuplicate,
408|  onDelete,
409|  onClick,
410|}: {
411|  list: List;
412|  onEdit: () => void;
413|  onArchive: () => void;
414|  onDuplicate: () => void;
415|  onDelete: () => void;
416|  onClick: () => void;
417|}) {
418|  const typeInfo = typeIcons[list.type];
419|  const completed = list.completed_count ?? 0;
420|  const total = list.item_count ?? 0;
421|  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
422|
423|  return (
424|    <Card className="bg-zinc-950 border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
425|      <div onClick={onClick}>
426|        <CardHeader>
427|          <div className="flex items-center justify-between">
428|            <div className="flex items-center gap-2">
429|              <span className="text-emerald-500">{typeInfo.icon}</span>
430|              <CardTitle className="text-sm font-medium text-slate-50">
431|                {list.title}
432|              </CardTitle>
433|            </div>
434|            {list.status === "archived" && (
435|              <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-zinc-900 px-2 py-0.5 rounded-full">
436|                Arquivada
437|              </span>
438|            )}
439|          </div>
440|        </CardHeader>
441|        <CardContent>
442|          {list.description && (
443|            <p className="text-xs text-slate-500 mb-2 line-clamp-1">{list.description}</p>
444|          )}
445|          <div className="flex items-center justify-between text-xs text-slate-400">
446|            <span className="bg-zinc-900 px-2 py-0.5 rounded">{typeInfo.label}</span>
447|            {total > 0 && (
448|              <span>
449|                {completed}/{total} concluídos
450|              </span>
451|            )}
452|          </div>
453|          {total > 0 && (
454|            <div className="mt-2 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
455|              <div
456|                className="h-full bg-emerald-500 rounded-full transition-all"
457|                style={{ width: `${progress}%` }}
458|              />
459|            </div>
460|          )}
461|          <p className="text-[10px] text-slate-600 mt-2">
462|            Atualizada em {format(new Date(list.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
463|          </p>
464|        </CardContent>
465|      </div>
466|      {/* Ações - parando propagação do click */}
467|      <div className="px-6 pb-4 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
468|        <Button
469|          variant="ghost"
470|          size="icon-xs"
471|          onClick={onEdit}
472|          title="Editar"
473|        >
474|          <Pencil className="h-3.5 w-3.5 text-slate-400" />
475|        </Button>
476|        <Button
477|          variant="ghost"
478|          size="icon-xs"
479|          onClick={onArchive}
480|          title={list.status === "archived" ? "Restaurar" : "Arquivar"}
481|        >
482|          {list.status === "archived" ? (
483|            <ArchiveRestore className="h-3.5 w-3.5 text-amber-400" />
484|          ) : (
485|            <Archive className="h-3.5 w-3.5 text-slate-400" />
486|          )}
487|        </Button>
488|        <Button
489|          variant="ghost"
490|          size="icon-xs"
491|          onClick={onDuplicate}
492|          title="Duplicar"
493|        >
494|          <Copy className="h-3.5 w-3.5 text-slate-400" />
495|        </Button>
496|        <Button
497|          variant="ghost"
498|          size="icon-xs"
499|          onClick={onDelete}
500|          title="Excluir"
501|