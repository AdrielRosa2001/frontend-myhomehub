import { describe, expect, it } from "vitest";
import {
  applyToggle,
  sortItemsByCompletion,
  sortTransactionsByDate,
} from "../sort";
import type { ListItem, Transaction } from "../types";

function makeItem(overrides: Partial<ListItem> & { id: number }): ListItem {
  return {
    list_id: 1,
    text: `Item ${overrides.id}`,
    is_completed: false,
    position: 0,
    created_at: "2026-08-16T00:00:00",
    updated_at: "2026-08-16T00:00:00",
    ...overrides,
  };
}

function makeTx(overrides: Partial<Transaction> & { id: number }): Transaction {
  return {
    description: `Tx ${overrides.id}`,
    amount: 100,
    type: "despesa",
    category: "Geral",
    date: "2026-08-01",
    is_paid: false,
    ...overrides,
  };
}

describe("sortItemsByCompletion", () => {
  it("coloca itens não-marcados no topo e marcados no final", () => {
    const items = [
      makeItem({ id: 1, is_completed: true, position: 0 }),
      makeItem({ id: 2, is_completed: false, position: 1 }),
      makeItem({ id: 3, is_completed: true, position: 2 }),
      makeItem({ id: 4, is_completed: false, position: 3 }),
    ];

    const sorted = sortItemsByCompletion(items);

    expect(sorted.map((i) => i.id)).toEqual([2, 4, 1, 3]);
  });

  it("mantém a ordem por position dentro de cada grupo", () => {
    const items = [
      makeItem({ id: 1, is_completed: false, position: 3 }),
      makeItem({ id: 2, is_completed: false, position: 1 }),
      makeItem({ id: 3, is_completed: false, position: 2 }),
    ];

    const sorted = sortItemsByCompletion(items);

    expect(sorted.map((i) => i.id)).toEqual([2, 3, 1]);
  });

  it("não muta o array original", () => {
    const items = [
      makeItem({ id: 1, is_completed: true, position: 0 }),
      makeItem({ id: 2, is_completed: false, position: 1 }),
    ];
    const before = items.map((i) => i.id);

    sortItemsByCompletion(items);

    expect(items.map((i) => i.id)).toEqual(before);
  });

  it("retorna lista vazia para entrada vazia", () => {
    expect(sortItemsByCompletion([])).toEqual([]);
  });
});

describe("applyToggle", () => {
  it("marca um item como concluído", () => {
    const items = [makeItem({ id: 1, is_completed: false })];

    const updated = applyToggle(items, 1, true);

    expect(updated[0].is_completed).toBe(true);
  });

  it("desmarca um item (rollback)", () => {
    const items = [makeItem({ id: 1, is_completed: true })];

    const updated = applyToggle(items, 1, false);

    expect(updated[0].is_completed).toBe(false);
  });

  it("não altera outros itens", () => {
    const items = [
      makeItem({ id: 1, is_completed: false }),
      makeItem({ id: 2, is_completed: false }),
    ];

    const updated = applyToggle(items, 1, true);

    expect(updated[0].is_completed).toBe(true);
    expect(updated[1].is_completed).toBe(false);
  });

  it("não muta o array original", () => {
    const items = [makeItem({ id: 1, is_completed: false })];

    applyToggle(items, 1, true);

    expect(items[0].is_completed).toBe(false);
  });
});

describe("sortTransactionsByDate", () => {
  it("ordena por data crescente por padrão (mais antiga primeiro)", () => {
    const txs = [
      makeTx({ id: 1, date: "2026-08-01" }),
      makeTx({ id: 2, date: "2026-08-15" }),
      makeTx({ id: 3, date: "2026-07-20" }),
    ];

    const sorted = sortTransactionsByDate(txs);

    expect(sorted.map((t) => t.id)).toEqual([3, 1, 2]);
  });

  it("ordena por data decrescente quando direction=desc", () => {
    const txs = [
      makeTx({ id: 1, date: "2026-08-01" }),
      makeTx({ id: 2, date: "2026-08-15" }),
      makeTx({ id: 3, date: "2026-07-20" }),
    ];

    const sorted = sortTransactionsByDate(txs, "desc");

    expect(sorted.map((t) => t.id)).toEqual([2, 1, 3]);
  });

  it("não muta o array original", () => {
    const txs = [
      makeTx({ id: 1, date: "2026-08-15" }),
      makeTx({ id: 2, date: "2026-08-01" }),
    ];
    const before = txs.map((t) => t.id);

    sortTransactionsByDate(txs);

    expect(txs.map((t) => t.id)).toEqual(before);
  });
});
