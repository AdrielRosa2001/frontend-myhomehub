// Tipos compartilhados para os módulos de Listas e Financeiro
// Mapeados conforme o backend (Peewee + FastAPI)

export type ListType = "shopping" | "todo" | "bullet";
export type ListStatus = "active" | "archived" | "deleted";

export interface List {
  id: number;
  owner_id: number;
  title: string;
  type: ListType;
  description?: string | null;
  icon?: string | null;
  status: ListStatus;
  position: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  items?: ListItem[];
}

export interface ListItem {
  id: number;
  list_id: number;
  text: string;
  is_completed: boolean;
  position: number;
  priority?: "low" | "medium" | "high" | null;
  due_date?: string | null;
  quantity?: number | null;
  unit?: string | null;
  category?: string | null;
  price?: number | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: "receita" | "despesa";
  category: string;
  date: string;
  is_paid: boolean;
}

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  modules: string; // JSON string: '["finance","lists"]'
}
