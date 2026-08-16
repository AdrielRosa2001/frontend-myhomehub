import type { ListItem, Transaction } from "./types";

/**
 * Ordena transações pelo atributo `date`.
 * `direction` "asc" coloca a transação mais antiga primeiro (padrão do app).
 */
export function sortTransactionsByDate(
  transactions: Transaction[],
  direction: "asc" | "desc" = "asc",
): Transaction[] {
  return [...transactions].sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    return direction === "asc" ? aTime - bTime : bTime - aTime;
  });
}

/**
 * Ordena itens de lista dinamicamente:
 * 1. Itens NÃO marcados (is_completed=false) primeiro.
 * 2. Itens marcados (is_completed=true) por último.
 * 3. Dentro de cada grupo, mantém a ordem por `position`.
 *
 * Retorna um novo array (não muta o original).
 */
export function sortItemsByCompletion(items: ListItem[]): ListItem[] {
  return [...items].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    return a.position - b.position;
  });
}

/**
 * Aplica o toggle de conclusão a um item específico, retornando um novo array.
 * Usado para update otimista (marcar/desmarcar) e rollback em caso de erro.
 */
export function applyToggle(
  items: ListItem[],
  itemId: number,
  isCompleted: boolean,
): ListItem[] {
  return items.map((item) =>
    item.id === itemId ? { ...item, is_completed: isCompleted } : item,
  );
}
