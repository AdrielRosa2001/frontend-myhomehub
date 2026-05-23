"use client";

import { api } from "@/lib/api";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DollarSign,
  Filter,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Componentes Shadcn
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Tipagens
interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: "receita" | "despesa";
  category: string;
  date: string;
}

interface Summary {
  total_receitas: number;
  total_despesas: number;
  saldo: number;
}

export default function DashboardPage() {
  const router = useRouter();

  // Configuração inicial de datas para os filtros
  const today = new Date();
  const nextMonth = addMonths(today, 1);

  // Estados de Dados
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_receitas: 0,
    total_despesas: 0,
    saldo: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  // Estados de Filtros
  const [filterStartDate, setFilterStartDate] = useState(
    format(startOfMonth(nextMonth), "yyyy-MM-dd"),
  );
  const [filterEndDate, setFilterEndDate] = useState(
    format(endOfMonth(nextMonth), "yyyy-MM-dd"),
  );
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");

  // Estados de UI (Modais)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentTx, setCurrentTx] = useState<Partial<Transaction> | null>(null);
  const [txToDelete, setTxToDelete] = useState<number | null>(null);

  // Formatar Moeda
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("dmapla_token");
    router.push("/login");
  };

  // Busca os dados da API (Agora com Filtros)
  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStartDate) params.append("start_date", filterStartDate);
      if (filterEndDate) params.append("end_date", filterEndDate);
      if (filterType !== "all") params.append("type", filterType);
      if (filterCategory !== "all") params.append("category", filterCategory);
      if (filterMinAmount) params.append("min_amount", filterMinAmount);
      if (filterMaxAmount) params.append("max_amount", filterMaxAmount);

      const queryString = params.toString();
      const txUrl = queryString
        ? `/transactions/?${queryString}`
        : `/transactions/`;

      // AJUSTE AQUI: Adicionando os parâmetros de data obrigatórios para as rotas de métricas
      const metricsParams = `?start_date=${filterStartDate}&end_date=${filterEndDate}`;

      const [txRes, sumRes, chartRes] = await Promise.all([
        api.get(txUrl),
        api.get(`/metrics/summary${metricsParams}`),
        api.get(`/metrics/chart-data${metricsParams}`),
      ]);

      setTransactions(txRes.data);
      setSummary(sumRes.data);
      setChartData(chartRes.data.data);
      setIsFilterOpen(false); // Fecha o modal de filtro ao aplicar
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error("Sessão expirada. Faça login novamente.");
        router.push("/login");
      } else {
        toast.error("Erro ao carregar os dados do servidor.");
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("dmapla_token");
    if (!token) {
      router.push("/login");
    } else {
      fetchData();
    }
  }, []);

  // Handlers para os Modais de Adição e Edição
  const openAddModal = () => {
    // Agora usa apenas date (YYYY-MM-DD)
    setCurrentTx({
      type: "despesa",
      date: format(new Date(), "yyyy-MM-dd"),
      category: "Geral",
      amount: 0,
      description: "",
    });
    setIsAddEditOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setCurrentTx({ ...tx, date: tx.date });
    setIsAddEditOpen(true);
  };

  const openDeleteModal = (id: number) => {
    setTxToDelete(id);
    setIsDeleteOpen(true);
  };

  // Ações CRUD
  const handleSave = async () => {
    try {
      if (currentTx?.id) {
        await api.put(`/transactions/${currentTx.id}`, currentTx);
        toast.success("Transação atualizada com sucesso!");
      } else {
        await api.post("/transactions/", currentTx);
        toast.success("Transação adicionada com sucesso!");
      }
      setIsAddEditOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar transação.");
    }
  };

  const handleDelete = async () => {
    if (!txToDelete) return;
    try {
      await api.delete(`/transactions/${txToDelete}`);
      toast.success("Transação excluída com sucesso!");
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Erro ao excluir transação.");
    }
  };

  // Configuração do Gráfico
  const chartSeries = [
    { name: "Receitas", data: chartData.map((d) => d.receitas) },
    { name: "Despesas", data: chartData.map((d) => d.despesas) },
  ];

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      background: "transparent",
      foreColor: "#a1a1aa",
    },
    colors: ["#10b981", "#ef4444"],
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    xaxis: {
      categories: chartData.map((d) =>
        format(new Date(d.date), "dd/MM", { locale: ptBR }),
      ),
    },
    theme: { mode: "dark" },
    grid: { borderColor: "#27272a", strokeDashArray: 4 },
  };

  return (
    <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8">
      {/* Header com Título e Botões (Filtro, Novo, Logout) */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MyFinance</h1>
          <p className="text-slate-400 text-sm">Resumo financeiro atualizado</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Popover de Filtros */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-black border-slate-700 hover:bg-slate-900"
              >
                <Filter className="mr-2 h-4 w-4" /> Filtros
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 bg-zinc-950 border-zinc-800 text-slate-50 p-4"
              align="end"
            >
              <div className="grid gap-4">
                <h4 className="font-medium leading-none">Filtrar Transações</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      Data Inicial
                    </label>
                    <Input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 h-8 text-sm dark:[color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Data Final</label>
                    <Input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 h-8 text-sm dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      Valor Mínimo
                    </label>
                    <Input
                      type="number"
                      placeholder="R$ 0,00"
                      value={filterMinAmount}
                      onChange={(e) => setFilterMinAmount(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      Valor Máximo
                    </label>
                    <Input
                      type="number"
                      placeholder="R$ 1000,00"
                      value={filterMaxAmount}
                      onChange={(e) => setFilterMaxAmount(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Tipo</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-8 bg-zinc-900 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-white text-black mt-2"
                  onClick={fetchData}
                >
                  Aplicar Filtros
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            onClick={openAddModal}
            className="bg-white text-black hover:bg-slate-200"
          >
            <Plus className="mr-2 h-4 w-4" /> Nova
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

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Receitas Totais
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-50">
              {formatCurrency(summary.total_receitas)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Despesas Totais
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-50">
              {formatCurrency(summary.total_despesas)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Saldo Atual
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${summary.saldo >= 0 ? "text-emerald-500" : "text-red-500"}`}
            >
              {formatCurrency(summary.saldo)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card className="bg-zinc-950 border-zinc-800 mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-slate-50">
            Fluxo Diário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <Chart
              options={chartOptions}
              series={chartSeries}
              type="area"
              width="100%"
              height="100%"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Transações */}
      <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-slate-50">
            Histórico de Transações
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Data</TableHead>
                <TableHead className="text-slate-400">Descrição</TableHead>
                <TableHead className="text-slate-400">Categoria</TableHead>
                <TableHead className="text-slate-400 text-right">
                  Valor
                </TableHead>
                <TableHead className="text-slate-400 text-center">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="border-zinc-800 hover:bg-zinc-900/50"
                >
                  <TableCell>
                    {format(new Date(tx.date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {tx.description}
                  </TableCell>
                  <TableCell>
                    <span className="bg-zinc-800 text-xs px-2 py-1 rounded-md">
                      {tx.category}
                    </span>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${tx.type === "receita" ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {tx.type === "receita" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(tx)}
                      >
                        <Pencil className="h-4 w-4 text-slate-400 hover:text-white" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteModal(tx.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-slate-500 py-8"
                  >
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal Adicionar/Editar */}
      <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-slate-50 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentTx?.id ? "Editar Transação" : "Nova Transação"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                className="bg-zinc-900 border-zinc-800"
                value={currentTx?.description || ""}
                onChange={(e) =>
                  setCurrentTx({ ...currentTx, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  className="bg-zinc-900 border-zinc-800"
                  value={currentTx?.amount || ""}
                  onChange={(e) =>
                    setCurrentTx({
                      ...currentTx,
                      amount: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={currentTx?.type}
                  onValueChange={(val: "receita" | "despesa") =>
                    setCurrentTx({ ...currentTx, type: val })
                  }
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Categoria</label>
              <Input
                className="bg-zinc-900 border-zinc-800"
                value={currentTx?.category || ""}
                onChange={(e) =>
                  setCurrentTx({ ...currentTx, category: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                className="bg-zinc-900 border-zinc-800 dark:[color-scheme:dark]"
                value={currentTx?.date || ""}
                onChange={(e) =>
                  setCurrentTx({ ...currentTx, date: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-transparent border-zinc-800 text-white"
              onClick={() => setIsAddEditOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-white text-black hover:bg-slate-200"
              onClick={handleSave}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Excluir */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-slate-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a
              transação dos seus registros financeiros.
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
