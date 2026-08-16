import { describe, expect, it } from "vitest";
import { formatCurrencyBRL } from "../utils";

// Intl.NumberFormat usa espaço não separável (U+00A0) entre "R$" e o valor.
// Normalizamos para comparar com espaço comum de forma estável entre versões do Node.
const normalize = (s: string) => s.replace(/\u00A0/g, " ");

describe("formatCurrencyBRL", () => {
  it("formata valores em BRL", () => {
    expect(normalize(formatCurrencyBRL(1234.56))).toBe("R$ 1.234,56");
  });

  it("arredonda floats de alta precisão para 2 casas decimais", () => {
    expect(normalize(formatCurrencyBRL(1234.5600000000001))).toBe("R$ 1.234,56");
  });

  it("formata zero", () => {
    expect(normalize(formatCurrencyBRL(0))).toBe("R$ 0,00");
  });

  it("trata null/undefined como zero", () => {
    expect(normalize(formatCurrencyBRL(null))).toBe("R$ 0,00");
    expect(normalize(formatCurrencyBRL(undefined))).toBe("R$ 0,00");
  });

  it("trata NaN como zero", () => {
    expect(normalize(formatCurrencyBRL(NaN))).toBe("R$ 0,00");
  });
});
