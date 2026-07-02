"use client";

import { api } from "@/lib/api";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import {
  CheckCircle2,
  Circle,
  DollarSign,
  Filter,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Copy,
  Download,
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
  DialogTrigger,
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
  is_paid: boolean;
}

interface Summary {
  total_receitas: number;
  total_despesas: number;
  saldo: number;
}

export default function FinanceiroPage() {
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
  const [chartData, setChartData] = useState<Record<string, number>[]>([]);

  // Estados de Filtros
  const [filterStartDate, setFilterStartDate] = useState(
    format(startOfMonth(nextMonth), "yyyy-MM-dd"),
  );
  const [filterEndDate, setFilterEndDate] = useState(
    format(endOfMonth(nextMonth), "yyyy-MM-dd"),
  );
  const [filterType, setFilterType] = useState("all");
  const [filterCategory] = useState("all");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  
  // Adicionado: Estados de Filtro de Mês/Ano Específico
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>(today.getFullYear().toString());

  // Estados de UI (Modais)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentTx, setCurrentTx] = useState<Partial<Transaction> | null>(null);
  const [txToDelete, setTxToDelete] = useState<number | null>(null);

  // Adicionado: Estados de UI para Bulk Actions
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isBulkDuplicateOpen, setIsBulkDuplicateOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const [bulkEditData, setBulkEditData] = useState({
    type: "despesa" as "receita" | "despesa",
    date: format(new Date(), "yyyy-MM-dd"),
    category: "Geral",
    is_paid: false,
  });

  const [bulkDuplicateData, setBulkDuplicateData] = useState({
    type: "despesa" as "receita" | "despesa",
    date: format(new Date(), "yyyy-MM-dd"),
    category: "Geral",
    is_paid: false,
  });

  // Adicionado: Estados para Seleção de Itens (Ações em Massa)
  const [selectedTxIds, setSelectedTxIds] = useState<number[]>([]);

  // Adicionado: Estados de Ordenação e Busca
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

      // Gráfico "Relatório Anual": buscamos de Janeiro a Dezembro do ano correspondente ao filtro ativo
      let currentYear = new Date().getFullYear();
      if (filterStartDate) {
        // Garantir tratamento correto de data local para não pegar fuso errado
        const parts = filterStartDate.split("-");
        if (parts.length > 0) {
          const parsedYear = parseInt(parts[0]);
          if (!isNaN(parsedYear)) {
            currentYear = parsedYear;
          }
        }
      }
      const annualParams = `?start_date=${currentYear}-01-01&end_date=${currentYear}-12-31`;

      const [txRes, sumRes, chartRes] = await Promise.all([
        api.get(txUrl),
        api.get(`/metrics/summary${metricsParams}`),
        api.get(`/metrics/chart-data${annualParams}`),
      ]);

      setTransactions(txRes.data);
      setSummary(sumRes.data);
      setChartData(chartRes.data?.data || chartRes.data || []);
      setSelectedTxIds([]); // Limpa seleções ao carregar os dados
      setIsFilterOpen(false); // Fecha o modal de filtro ao aplicar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error("Sessão expirada. Faça login novamente.");
        router.push("/login");
      } else {
        toast.error("Erro ao carregar os dados do servidor.");
      }
    }
  };

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("dmapla_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // Data fetch
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      is_paid: false,
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
    } catch {
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
    } catch {
      toast.error("Erro ao excluir transação.");
    }
  };

  // Adicionado: Manipulação de Filtro por Mês/Ano Específico
  const handleMonthYearChange = (month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);

    if (month !== "all") {
      const monthInt = parseInt(month) - 1; // 0-11
      const yearInt = parseInt(year);
      const firstDay = new Date(yearInt, monthInt, 1);
      const lastDay = endOfMonth(firstDay);
      setFilterStartDate(format(firstDay, "yyyy-MM-dd"));
      setFilterEndDate(format(lastDay, "yyyy-MM-dd"));
    }
  };

  // Adicionado: Métodos de Seleção de Transações
  const handleSelectRow = (id: number) => {
    setSelectedTxIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const visibleIds = processedTransactions.map((tx) => tx.id);
      setSelectedTxIds(visibleIds);
    } else {
      setSelectedTxIds([]);
    }
  };

  // Adicionado: Abertura dos Modais de Bulk Actions
  const openBulkEditModal = () => {
    if (selectedTxIds.length === 0) return;
    const firstTx = transactions.find((t) => t.id === selectedTxIds[0]);
    setBulkEditData({
      type: firstTx?.type || "despesa",
      date: firstTx?.date || format(new Date(), "yyyy-MM-dd"),
      category: firstTx?.category || "Geral",
      is_paid: firstTx?.is_paid || false,
    });
    setIsBulkEditOpen(true);
  };

  const openBulkDuplicateModal = () => {
    if (selectedTxIds.length === 0) return;
    const firstTx = transactions.find((t) => t.id === selectedTxIds[0]);
    setBulkDuplicateData({
      type: firstTx?.type || "despesa",
      date: firstTx?.date || format(new Date(), "yyyy-MM-dd"),
      category: firstTx?.category || "Geral",
      is_paid: firstTx?.is_paid || false,
    });
    setIsBulkDuplicateOpen(true);
  };

  // Adicionado: Execução de Ações em Massa (API Parallel requests)
  const handleBulkEditSave = async () => {
    try {
      toast.info("Atualizando transações...");
      await api.patch("/transactions/bulk-update", {
        ids: selectedTxIds,
        fields: {
          type: bulkEditData.type,
          date: bulkEditData.date,
          category: bulkEditData.category,
          is_paid: bulkEditData.is_paid,
        },
      });
      toast.success("Transações atualizadas com sucesso!");
      setIsBulkEditOpen(false);
      setSelectedTxIds([]);
      fetchData();
    } catch {
      toast.error("Erro ao atualizar transações em lote.");
    }
  };

  const handleBulkDelete = async () => {
    try {
      toast.info("Excluindo transações...");
      await api.post("/transactions/bulk-delete", {
        ids: selectedTxIds,
      });
      toast.success("Transações excluídas com sucesso!");
      setIsBulkDeleteOpen(false);
      setSelectedTxIds([]);
      fetchData();
    } catch {
      toast.error("Erro ao excluir transações em lote.");
    }
  };

  const handleBulkDuplicateSave = async () => {
    try {
      toast.info("Duplicando transações...");
      await api.post("/transactions/bulk-duplicate", {
        ids: selectedTxIds,
        overrides: {
          type: bulkDuplicateData.type,
          date: bulkDuplicateData.date,
          category: bulkDuplicateData.category,
          is_paid: bulkDuplicateData.is_paid,
        },
      });
      toast.success("Transações duplicadas com sucesso!");
      setIsBulkDuplicateOpen(false);
      setSelectedTxIds([]);
      fetchData();
    } catch {
      toast.error("Erro ao duplicar transações em lote.");
    }
  };

  const handleBulkExportCSV = () => {
    if (selectedTxIds.length === 0) return;

    const selectedTxs = transactions.filter((t) => selectedTxIds.includes(t.id));
    const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Status"];

    const rows = selectedTxs.map((t) => [
      format(new Date(t.date), "dd/MM/yyyy"),
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      t.type === "receita" ? "Receita" : "Despesa",
      t.amount.toString(),
      t.is_paid ? "Pago" : "Pendente",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `myhomehub_export_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exportado com sucesso!");
  };

  // Adicionado: Ordenação das Colunas
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-500" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-emerald-500" />
    ) : (
      <ArrowDown className="h-3 w-3 text-emerald-500" />
    );
  };

  // Adicionado: Filtragem e ordenação local das transações
  const processedTransactions = (() => {
    let list = transactions;

    // 1. Busca textual (Descrição ou Categoria)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (tx) =>
          tx.description.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q)
      );
    }

    // 2. Ordenação
    if (sortField) {
      list = [...list].sort((a, b) => {
        if (sortField === "date") {
          const aTime = new Date(a.date).getTime();
          const bTime = new Date(b.date).getTime();
          return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
        }

        if (sortField === "amount") {
          const aVal = a.type === "receita" ? a.amount : -a.amount;
          const bVal = b.type === "receita" ? b.amount : -b.amount;
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        const aVal = a[sortField as keyof Transaction];
        const bVal = b[sortField as keyof Transaction];

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === "boolean" && typeof bVal === "boolean") {
          return sortDirection === "asc"
            ? Number(aVal) - Number(bVal)
            : Number(bVal) - Number(aVal);
        }

        return 0;
      });
    }

    return list;
  })();

  // Configuração do Gráfico (Relatório Anual consolidado)
  const monthlyChartData = (() => {
    const months = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];
    
    // Inicializa os 12 meses com valor zero
    const aggregated = months.map((m) => ({
      month: m,
      receitas: 0,
      despesas: 0,
    }));

    chartData.forEach((item) => {
      if (item.date) {
        const d = new Date(item.date);
        if (!isNaN(d.getTime())) {
          const mIndex = d.getMonth(); // 0 a 11
          if (mIndex >= 0 && mIndex < 12) {
            aggregated[mIndex].receitas += item.receitas || 0;
            aggregated[mIndex].despesas += item.despesas || 0;
          }
        }
      }
    });

    return aggregated;
  })();

  const chartSeries = [
    { name: "Receitas", data: monthlyChartData.map((d) => d.receitas) },
    { name: "Despesas", data: monthlyChartData.map((d) => d.despesas) },
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
      categories: monthlyChartData.map((d) => d.month),
    },
    theme: { mode: "dark" },
    grid: { borderColor: "#27272a", strokeDashArray: 4 },
  };

  return (
    <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8">
      {/* Header com Título e Botões (Filtro, Novo, Logout) */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Módulo Financeiro</h1>
          <p className="text-slate-400 text-sm">Controle de gastos, receitas e relatórios financeiros</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Modal de Filtros */}
          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger>
              <Button
                variant="outline"
                className="bg-black border-slate-700 hover:bg-slate-900"
              >
                <Filter className="mr-2 h-4 w-4" /> Filtros
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-slate-50 sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Filtrar Transações</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                {/* Seleção Rápida por Mês/Ano */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Filtrar por Mês</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={filterMonth}
                      onValueChange={(val) => val && handleMonthYearChange(val, filterYear)}
                    >
                      <SelectTrigger className="h-8 bg-zinc-900 border-zinc-800">
                        <SelectValue placeholder="Mês" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                        <SelectItem value="all">Personalizado</SelectItem>
                        <SelectItem value="1">Janeiro</SelectItem>
                        <SelectItem value="2">Fevereiro</SelectItem>
                        <SelectItem value="3">Março</SelectItem>
                        <SelectItem value="4">Abril</SelectItem>
                        <SelectItem value="5">Maio</SelectItem>
                        <SelectItem value="6">Junho</SelectItem>
                        <SelectItem value="7">Julho</SelectItem>
                        <SelectItem value="8">Agosto</SelectItem>
                        <SelectItem value="9">Setembro</SelectItem>
                        <SelectItem value="10">Outubro</SelectItem>
                        <SelectItem value="11">Novembro</SelectItem>
                        <SelectItem value="12">Dezembro</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filterYear}
                      onValueChange={(val) => val && handleMonthYearChange(filterMonth, val)}
                      disabled={filterMonth === "all"}
                    >
                      <SelectTrigger className="h-8 bg-zinc-900 border-zinc-800">
                        <SelectValue placeholder="Ano" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                        <SelectItem value="2027">2027</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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

                  <Select value={filterType} onValueChange={(val) => val && setFilterType(val)}>
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
                <DialogFooter>
                  <Button
                    className="w-full bg-white text-black"
                    onClick={fetchData}
                  >
                    Aplicar Filtros
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

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
              className={`text-2xl font-bold ${
                summary.saldo >= 0 ? "text-emerald-500" : "text-red-500"
              }`}
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
            Relatório anual
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

        {/* Adicionado: Campo de Busca e Barra de Ações em Massa */}
        <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar por descrição ou categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 h-9 text-sm"
            />
          </div>

          {selectedTxIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
              <span className="text-xs font-medium text-slate-300">
                {selectedTxIds.length} {selectedTxIds.length === 1 ? "selecionado" : "selecionados"}
              </span>
              <div className="h-4 w-[1px] bg-zinc-800 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-slate-300 hover:text-white"
                onClick={openBulkEditModal}
              >
                <Pencil className="h-3 w-3 mr-1" /> Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-slate-300 hover:text-white"
                onClick={openBulkDuplicateModal}
              >
                <Copy className="h-3 w-3 mr-1" /> Duplicar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-slate-300 hover:text-white"
                onClick={handleBulkExportCSV}
              >
                <Download className="h-3 w-3 mr-1" /> Exportar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-red-400 hover:text-red-300"
                onClick={() => setIsBulkDeleteOpen(true)}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Excluir
              </Button>
            </div>
          )}
        </div>

        {/* Mobile: Cartões de transações */}
        <div className="grid gap-3 p-4 md:hidden">
          {processedTransactions.map((tx) => (
            <div
              key={tx.id}
              className={`rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 transition-all ${
                !tx.is_paid ? "opacity-50" : ""
              } ${
                selectedTxIds.includes(tx.id)
                  ? "ring-1 ring-emerald-500/50 border-emerald-500/30"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-zinc-800 bg-zinc-900 accent-emerald-500 h-4 w-4 cursor-pointer shrink-0"
                    checked={selectedTxIds.includes(tx.id)}
                    onChange={() => handleSelectRow(tx.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {format(new Date(tx.date), "dd/MM/yyyy")}
                      <span className="mx-1.5">·</span>
                      <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-[11px]">
                        {tx.category}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEditModal(tx)}
                  >
                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openDeleteModal(tx.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500/70" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pl-7">
                <span
                  className={`text-sm font-semibold ${
                    tx.type === "receita"
                      ? "text-emerald-500"
                      : "text-red-500"
                  }`}
                >
                  {tx.type === "receita" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
                {tx.is_paid ? (
                  <span className="inline-flex items-center text-[11px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Pago
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[11px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <Circle className="w-2.5 h-2.5 mr-1" /> Pendente
                  </span>
                )}
              </div>
            </div>
          ))}
          {processedTransactions.length === 0 && (
            <p className="text-center text-slate-500 py-8 text-sm">
              Nenhuma transação encontrada.
            </p>
          )}
        </div>

        {/* Desktop: Tabela tradicional */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-800 bg-zinc-900 text-white focus:ring-emerald-500 h-4 w-4 accent-emerald-500 cursor-pointer"
                    checked={
                      processedTransactions.length > 0 &&
                      processedTransactions.every((tx) =>
                        selectedTxIds.includes(tx.id)
                      )
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead
                  className="text-slate-400 cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-1">
                    Data {renderSortIcon("date")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-slate-400 cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => handleSort("description")}
                >
                  <div className="flex items-center gap-1">
                    Descrição {renderSortIcon("description")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-slate-400 cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center gap-1">
                    Categoria {renderSortIcon("category")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-slate-400 cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => handleSort("is_paid")}
                >
                  <div className="flex items-center gap-1">
                    Status {renderSortIcon("is_paid")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-slate-400 text-right cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Valor {renderSortIcon("amount")}
                  </div>
                </TableHead>
                <TableHead className="text-slate-400 text-center">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedTransactions.map((tx) => (
                <TableRow
                  key={tx.id}
                  className={`border-zinc-800 hover:bg-zinc-900/50 transition-opacity ${!tx.is_paid ? "opacity-50" : ""} ${selectedTxIds.includes(tx.id) ? "bg-zinc-900/30" : ""}`}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-zinc-800 bg-zinc-900 text-white focus:ring-emerald-500 h-4 w-4 accent-emerald-500 cursor-pointer"
                      checked={selectedTxIds.includes(tx.id)}
                      onChange={() => handleSelectRow(tx.id)}
                    />
                  </TableCell>
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

                  {/* Status Cell */}
                  <TableCell>
                    {tx.is_paid ? (
                      <span className="flex items-center text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full w-fit">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Pago
                      </span>
                    ) : (
                      <span className="flex items-center text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full w-fit">
                        <Circle className="w-3 h-3 mr-1" /> Pendente
                      </span>
                    )}
                  </TableCell>

                  <TableCell
                    className={`text-right font-medium ${
                      tx.type === "receita"
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}
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

              {processedTransactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
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
                  onValueChange={(val) =>
                    val && setCurrentTx({ ...currentTx, type: val as "receita" | "despesa" })
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

            <div className="grid grid-cols-2 gap-4">
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

            {/* Componente do Switch de Pago/Pendente */}
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 mt-2">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-slate-50">
                  Transação Efetivada?
                </label>
                <p className="text-xs text-slate-400">
                  Marque caso o valor já tenha sido pago/recebido.
                </p>
              </div>
              <Switch
                checked={currentTx?.is_paid || false}
                onCheckedChange={(checked) =>
                  setCurrentTx({ ...currentTx, is_paid: checked })
                }
                className="data-[state=checked]:bg-emerald-500"
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

      {/* Modal Bulk Edit */}
      <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-slate-50 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Editar {selectedTxIds.length}{" "}
              {selectedTxIds.length === 1 ? "transação" : "transações"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={bulkEditData.type}
                  onValueChange={(val) =>
                    val && setBulkEditData({ ...bulkEditData, type: val as "receita" | "despesa" })
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
              <div className="grid gap-2">
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  className="bg-zinc-900 border-zinc-800 dark:[color-scheme:dark]"
                  value={bulkEditData.date}
                  onChange={(e) =>
                    setBulkEditData({ ...bulkEditData, date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Categoria</label>
              <Input
                className="bg-zinc-900 border-zinc-800"
                value={bulkEditData.category}
                onChange={(e) =>
                  setBulkEditData({ ...bulkEditData, category: e.target.value })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 mt-2">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-slate-50">
                  Transação Efetivada?
                </label>
                <p className="text-xs text-slate-400">
                  Marque caso o valor já tenha sido pago/recebido.
                </p>
              </div>
              <Switch
                checked={bulkEditData.is_paid}
                onCheckedChange={(checked) =>
                  setBulkEditData({ ...bulkEditData, is_paid: checked })
                }
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-transparent border-zinc-800 text-white"
              onClick={() => setIsBulkEditOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-white text-black hover:bg-slate-200"
              onClick={handleBulkEditSave}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Bulk Delete */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-slate-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação não pode ser desfeita. Isso excluirá permanentemente{" "}
              {selectedTxIds.length}{" "}
              {selectedTxIds.length === 1 ? "transação" : "transações"}{" "}
              dos seus registros financeiros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-800 text-white hover:bg-zinc-900 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleBulkDelete}
            >
              Sim, excluir tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Bulk Duplicar */}
      <Dialog open={isBulkDuplicateOpen} onOpenChange={setIsBulkDuplicateOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-slate-50 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Duplicar {selectedTxIds.length}{" "}
              {selectedTxIds.length === 1 ? "transação" : "transações"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={bulkDuplicateData.type}
                  onValueChange={(val) =>
                    val && setBulkDuplicateData({ ...bulkDuplicateData, type: val as "receita" | "despesa" })
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
              <div className="grid gap-2">
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  className="bg-zinc-900 border-zinc-800 dark:[color-scheme:dark]"
                  value={bulkDuplicateData.date}
                  onChange={(e) =>
                    setBulkDuplicateData({
                      ...bulkDuplicateData,
                      date: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Categoria</label>
              <Input
                className="bg-zinc-900 border-zinc-800"
                value={bulkDuplicateData.category}
                onChange={(e) =>
                  setBulkDuplicateData({
                    ...bulkDuplicateData,
                    category: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 mt-2">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-slate-50">
                  Transação Efetivada?
                </label>
                <p className="text-xs text-slate-400">
                  Marque caso o valor já tenha sido pago/recebido.
                </p>
              </div>
              <Switch
                checked={bulkDuplicateData.is_paid}
                onCheckedChange={(checked) =>
                  setBulkDuplicateData({ ...bulkDuplicateData, is_paid: checked })
                }
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-transparent border-zinc-800 text-white"
              onClick={() => setIsBulkDuplicateOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-white text-black hover:bg-slate-200"
              onClick={handleBulkDuplicateSave}
            >
              Duplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
