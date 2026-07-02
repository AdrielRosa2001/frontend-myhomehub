1|"use client";
2|
3|import { api } from "@/lib/api";
4|import type { List, ListItem } from "@/lib/types";
5|import { format } from "date-fns";
6|import { ptBR } from "date-fns/locale";
7|import {
8|  AlertTriangle,
9|  Archive,
10|  ArrowLeft,
11|  Check,
12|  Copy,
13|14|  ListTodo,
15|  Pencil,
16|  Plus,
17|  ShoppingCart,
18|  Trash2,
19|} from "lucide-react";
20|import { useParams, useRouter } from "next/navigation";
21|import { useCallback, useEffect, useRef, useState } from "react";
22|import { toast } from "sonner";
23|
24|import {
25|  AlertDialog,
26|  AlertDialogAction,
27|  AlertDialogCancel,
28|  AlertDialogContent,
29|  AlertDialogDescription,
30|  AlertDialogFooter,
31|  AlertDialogHeader,
32|  AlertDialogTitle,
33|} from "@/components/ui/alert-dialog";
34|import { Button } from "@/components/ui/button";
35|import { Card, CardContent } from "@/components/ui/card";
36|import {
37|  Dialog,
38|  DialogContent,
39|  DialogFooter,
40|  DialogHeader,
41|  DialogTitle,
42|} from "@/components/ui/dialog";
43|import { Input } from "@/components/ui/input";
44|import {
45|  Select,
46|  SelectContent,
47|  SelectItem,
48|  SelectTrigger,
49|  SelectValue,
50|} from "@/components/ui/select";
51|
52|const typeIcons: Record<string, { icon: React.ReactNode; label: string }> = {
53|  shopping: { icon: <ShoppingCart className="h-5 w-5" />, label: "Compras" },
54|  todo: { icon: <ListTodo className="h-5 w-5" />, label: "Tarefas" },
55|  bullet: { icon: <ListTodo className="h-5 w-5" />, label: "Simples" },
56|};
57|
58|export default function ListDetailPage() {
59|  const router = useRouter();
60|  const params = useParams();
61|  const listId = Number(params.id);
62|
63|  const [list, setList] = useState<List | null>(null);
64|  const [items, setItems] = useState<ListItem[]>([]);
65|  const [loading, setLoading] = useState(true);
66|
67|  // Input rápido
68|  const [newItemName, setNewItemName] = useState("");
69|  const inputRef = useRef<HTMLInputElement>(null);
70|
71|  // Modal editar item
72|  const [isItemEditOpen, setIsItemEditOpen] = useState(false);
73|  const [editingItem, setEditingItem] = useState<Partial<ListItem> | null>(null);
74|
75|  // Modal confirmar exclusão de item
76|  const [isDeleteItemOpen, setIsDeleteItemOpen] = useState(false);
77|  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
78|
79|  // Modal confirmar exclusão da lista
80|  const [isDeleteListOpen, setIsDeleteListOpen] = useState(false);
81|
82|  const fetchList = useCallback(async () => {
83|    try {
84|      const [listRes, itemsRes] = await Promise.all([
85|        api.get(`/lists/${listId}`),
86|        api.get(`/lists/${listId}/items`),
87|      ]);
88|      setList(listRes.data);
89|      setItems(itemsRes.data);
90|    // eslint-disable-next-line @typescript-eslint/no-explicit-any
91|    } catch {
92|      if (error.response?.status === 401) {
93|        toast.error("Sessão expirada. Faça login novamente.");
94|        router.push("/login");
95|      } else {
96|        toast.error("Erro ao carregar lista.");
97|      }
98|    } finally {
99|      setLoading(false);
100|    }
101|  }, [listId, router]);
102|
103|  useEffect(() => {
104|    const token = localStorage.getItem("dmapla_token");
105|    if (!token) {
106|      router.push("/login");
107|    } else {
108|      // eslint-disable-next-line react-hooks/set-state-in-effect
109|      fetchList();
110|    }
111|    // eslint-disable-next-line react-hooks/exhaustive-deps
112|  }, []);
113|
114|  // Foco no input ao carregar
115|  useEffect(() => {
116|    if (!loading && inputRef.current) {
117|      inputRef.current.focus();
118|    }
119|  }, [loading]);
120|
121|  // Adicionar item via Enter
122|  const handleAddItem = async (e: React.FormEvent) => {
123|    e.preventDefault();
124|    const name = newItemName.trim();
125|    if (!name) return;
126|
127|    try {
128|      await api.post(`/lists/${listId}/items`, { text: name });
129|      setNewItemName("");
130|      toast.success("Item adicionado!");
131|      fetchList();
132|    } catch (error) {
133|      toast.error("Erro ao adicionar item.");
134|    }
135|  };
136|
137|  // Filtro dinâmico de itens (enquanto digita no input de adicionar)
138|  const filteredItems = newItemName.trim()
139|    ? items.filter((item) =>
140|        item.text.toLowerCase().includes(newItemName.trim().toLowerCase()),
141|      )
142|    : items;
143|
144|  // Marcar/desmarcar conclusão
145|  const handleToggleItem = async (item: ListItem) => {
146|    try {
147|      await api.patch(`/lists/${listId}/items/${item.id}`, {
148|        is_completed: !item.is_completed,
149|      });
150|      fetchList();
151|    } catch (error) {
152|      toast.error("Erro ao atualizar item.");
153|    }
154|  };
155|
156|  // Abrir modal de edição de item
157|  const openEditItemModal = (item: ListItem) => {
158|    setEditingItem({
159|      id: item.id,
160|      text: item.text,
161|      quantity: item.quantity,
162|      unit: item.unit,
163|      category: item.category,
164|      priority: item.priority,
165|    });
166|    setIsItemEditOpen(true);
167|  };
168|
169|  // Salvar edição de item
170|  const handleSaveItem = async () => {
171|    if (!editingItem?.id || !editingItem?.text?.trim()) {
172|      toast.error("O nome do item é obrigatório.");
173|      return;
174|    }
175|    try {
176|      await api.patch(`/lists/${listId}/items/${editingItem.id}`, {
177|        text: editingItem.text,
178|        quantity: editingItem.quantity,
179|        unit: editingItem.unit,
180|        category: editingItem.category,
181|        priority: editingItem.priority,
182|      });
183|      toast.success("Item atualizado!");
184|      setIsItemEditOpen(false);
185|      setEditingItem(null);
186|      fetchList();
187|    } catch (error) {
188|      toast.error("Erro ao salvar item.");
189|    }
190|  };
191|
192|  // Excluir item
193|  const openDeleteItemModal = (id: number) => {
194|    setItemToDelete(id);
195|    setIsDeleteItemOpen(true);
196|  };
197|
198|  const handleDeleteItem = async () => {
199|    if (!itemToDelete) return;
200|    try {
201|      await api.delete(`/lists/${listId}/items/${itemToDelete}`);
202|      toast.success("Item excluído!");
203|      setIsDeleteItemOpen(false);
204|      setItemToDelete(null);
205|      fetchList();
206|    } catch (error) {
207|      toast.error("Erro ao excluir item.");
208|    }
209|  };
210|
211|  // Arquivar / Restaurar lista
212|  const handleArchive = async () => {
213|    if (!list) return;
214|    try {
215|      await api.post(`/lists/${listId}/archive`);
216|      toast.success("Lista atualizada!");
217|      router.push("/lists");
218|    } catch (error) {
219|      toast.error("Erro ao atualizar lista.");
220|    }
221|  };
222|
223|  // Duplicar lista
224|  const handleDuplicate = async () => {
225|    try {
226|      await api.post(`/lists/${listId}/duplicate`);
227|      toast.success("Lista duplicada!");
228|      router.push("/lists");
229|    } catch (error) {
230|      toast.error("Erro ao duplicar lista.");
231|    }
232|  };
233|
234|  // Excluir lista
235|  const handleDeleteList = async () => {
236|    try {
237|      await api.delete(`/lists/${listId}`);
238|      toast.success("Lista excluída!");
239|      router.push("/lists");
240|    } catch (error) {
241|      toast.error("Erro ao excluir lista.");
242|    }
243|  };
244|
245|  const completedCount = items.filter((i) => i.is_completed).length;
246|  const totalCount = items.length;
247|248|  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
249|  const typeInfo = list ? typeIcons[list.type] || typeIcons.bullet : typeIcons.bullet;
250|
251|  if (loading) {
252|    return (
253|      <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8 flex items-center justify-center">
254|        <p className="text-slate-400">Carregando lista...</p>
255|      </div>
256|    );
257|  }
258|
259|  if (!list) {
260|    return (
261|      <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8 flex flex-col items-center justify-center gap-4">
262|        <AlertTriangle className="h-12 w-12 text-amber-500" />
263|        <p className="text-slate-400">Lista não encontrada.</p>
264|        <Button
265|          variant="outline"
266|          className="bg-transparent border-zinc-800 text-white"
267|          onClick={() => router.push("/lists")}
268|        >
269|          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Listas
270|        </Button>
271|      </div>
272|    );
273|  }
274|
275|  return (
276|    <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8">
277|      {/* Header */}
278|      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
279|        <div className="flex items-center gap-3">
280|          <div>
281|            <div className="flex items-center gap-2">
282|              <span className="text-emerald-500">{typeInfo.icon}</span>
283|              <h1 className="text-xl md:text-2xl font-bold tracking-tight">{list.title}</h1>
284|              {list.status === "archived" && (
285|                <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-zinc-900 px-2 py-0.5 rounded-full">
286|                  Arquivada
287|                </span>
288|              )}
289|            </div>
290|            {list.description && (
291|              <p className="text-sm text-slate-500 mt-0.5">{list.description}</p>
292|            )}
293|            <p className="text-xs text-slate-600 mt-0.5">
294|              {typeInfo.label} · Criada em{" "}
295|              {format(new Date(list.created_at), "dd/MM/yyyy", { locale: ptBR })}
296|            </p>
297|          </div>
298|        </div>
299|        <div className="flex items-center gap-2">
300|          <Button
301|            variant="outline"
302|            size="sm"
303|            className="bg-black border-slate-700 hover:bg-slate-900"
304|            onClick={handleArchive}
305|          >
306|            <Archive className="mr-1 h-3.5 w-3.5" />
307|            {list.status === "archived" ? "Restaurar" : "Arquivar"}
308|          </Button>
309|          <Button
310|            variant="outline"
311|            size="sm"
312|            className="bg-black border-slate-700 hover:bg-slate-900"
313|            onClick={handleDuplicate}
314|          >
315|            <Copy className="mr-1 h-3.5 w-3.5" /> Duplicar
316|          </Button>
317|          <Button
318|            variant="ghost"
319|            size="icon-sm"
320|            onClick={() => setIsDeleteListOpen(true)}
321|            title="Excluir lista"
322|          >
323|            <Trash2 className="h-4 w-4 text-red-500/70" />
324|          </Button>
325|        </div>
326|      </header>
327|
328|      {/* Barra de Progresso */}
329|      {totalCount > 0 && (
330|        <Card className="bg-zinc-950 border-zinc-800 mb-6">
331|          <CardContent className="p-4">
332|            <div className="flex items-center justify-between text-sm mb-2">
333|              <span className="text-slate-400">Progresso</span>
334|              <span className="text-slate-300 font-medium">
335|                {completedCount}/{totalCount} concluídos ({progress}%)
336|              </span>
337|            </div>
338|            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
339|              <div
340|                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
341|                style={{ width: `${progress}%` }}
342|              />
343|            </div>
344|          </CardContent>
345|        </Card>
346|      )}
347|
348|      {/* Input rápido para adicionar item */}
349|      <form onSubmit={handleAddItem} className="mb-6">
350|        <div className="flex gap-2">
351|          <div className="relative flex-1">
352|            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
353|            <Input
354|              ref={inputRef}
355|              placeholder="Adicionar item e pressionar Enter..."
356|              value={newItemName}
357|              onChange={(e) => setNewItemName(e.target.value)}
358|              className="pl-9 bg-zinc-900 border-zinc-800 h-10 text-sm"
359|            />
360|          </div>
361|          <Button
362|            type="submit"
363|            className="bg-white text-black hover:bg-slate-200"
364|          >
365|            <Plus className="h-4 w-4" />
366|          </Button>
367|        </div>
368|      </form>
369|
370|      {/* Lista de Itens */}
371|      {filteredItems.length > 0 ? (
372|        <div className="space-y-2">
373|          {filteredItems
374|            .sort((a, b) => a.position - b.position)
375|            .map((item) => (
376|              <div
377|                key={item.id}
378|                className={`flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 md:p-4 transition-all ${
379|                  item.is_completed ? "opacity-50" : ""
380|                }`}
381|              >
382|                {/* Checkbox */}
383|                <button
384|                  onClick={() => handleToggleItem(item)}
385|                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
386|                    item.is_completed
387|                      ? "bg-emerald-500 border-emerald-500"
388|                      : "border-zinc-600 hover:border-emerald-500/50"
389|                  }`}
390|                >
391|                  {item.is_completed && <Check className="h-3 w-3 text-white" />}
392|                </button>
393|
394|                {/* Informações do item */}
395|                <div className="flex-1 min-w-0">
396|                  <p
397|                    className={`text-sm font-medium ${
398|                      item.is_completed ? "line-through text-slate-500" : "text-slate-50"
399|                    }`}
400|                  >
401|                    {item.text}
402|                  </p>
403|                  <div className="flex items-center gap-2 mt-0.5">
404|                    {/* Quantidade/Unidade (shopping) */}
405|                    {(item.quantity || item.unit) && (
406|                      <span className="text-[11px] text-slate-500 bg-zinc-900 px-1.5 py-0.5 rounded">
407|                        {item.quantity && `${item.quantity}`}
408|                        {item.unit && ` ${item.unit}`}
409|                      </span>
410|                    )}
411|                    {/* Categoria (shopping) */}
412|                    {item.category && (
413|                      <span className="text-[11px] text-slate-500 bg-zinc-900 px-1.5 py-0.5 rounded">
414|                        {item.category}
415|                      </span>
416|                    )}
417|                    {/* Prioridade (todo) */}
418|                    {item.priority && (
419|                      <span
420|                        className={`text-[11px] px-1.5 py-0.5 rounded ${
421|                          item.priority === "high"
422|                            ? "text-red-400 bg-red-500/10"
423|                            : item.priority === "medium"
424|                              ? "text-amber-400 bg-amber-500/10"
425|                              : "text-slate-500 bg-zinc-900"
426|                        }`}
427|                      >
428|                        {item.priority === "high"
429|                          ? "Alta"
430|                          : item.priority === "medium"
431|                            ? "Média"
432|                            : "Baixa"}
433|                      </span>
434|                    )}
435|                  </div>
436|                </div>
437|
438|                {/* Ações */}
439|                <div className="flex items-center gap-0.5 shrink-0">
440|                  <Button
441|                    variant="ghost"
442|                    size="icon-xs"
443|                    onClick={() => openEditItemModal(item)}
444|                    title="Editar"
445|                  >
446|                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
447|                  </Button>
448|                  <Button
449|                    variant="ghost"
450|                    size="icon-xs"
451|                    onClick={() => openDeleteItemModal(item.id)}
452|                    title="Excluir"
453|                  >
454|                    <Trash2 className="h-3.5 w-3.5 text-red-500/70" />
455|                  </Button>
456|                </div>
457|              </div>
458|            ))}
459|        </div>
460|      ) : (
461|        <div className="text-center py-16">
462|          <p className="text-slate-500">
463|            {newItemName.trim() ? "Nenhum item encontrado para esta busca." : "Nenhum item ainda. Adicione itens acima!"}
464|          </p>
465|        </div>
466|      )}
467|
468|      {/* Modal Editar Item */}
469|      <Dialog open={isItemEditOpen} onOpenChange={setIsItemEditOpen}>
470|        <DialogContent className="bg-zinc-950 border-zinc-800 text-slate-50 sm:max-w-md">
471|          <DialogHeader>
472|            <DialogTitle>Editar Item</DialogTitle>
473|          </DialogHeader>
474|          <div className="grid gap-4 py-4">
475|            <div className="grid gap-2">
476|              <label className="text-sm font-medium">Nome *</label>
477|              <Input
478|                className="bg-zinc-900 border-zinc-800"
479|                value={editingItem?.text || ""}
480|                onChange={(e) =>
481|                  setEditingItem((prev) => ({ ...prev, name: e.target.value }))
482|                }
483|              />
484|            </div>
485|
486|            {/* Campos específicos para tipo shopping */}
487|            {list.type === "shopping" && (
488|              <>
489|                <div className="grid grid-cols-2 gap-4">
490|                  <div className="grid gap-2">
491|                    <label className="text-sm font-medium">Quantidade</label>
492|                    <Input
493|                      type="number"
494|                      step="0.01"
495|                      min="0"
496|                      className="bg-zinc-900 border-zinc-800"
497|                      value={editingItem?.quantity ?? ""}
498|                      onChange={(e) =>
499|                        setEditingItem((prev) => ({
500|                          ...prev,
501|