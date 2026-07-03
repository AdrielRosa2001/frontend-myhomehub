// Tipos compartilhados para o módulo de Listas
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

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  modules: string;  // JSON string: '["finance","lists"]'
}
