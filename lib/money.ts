export function centsToBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Converte um input em formato "50", "50,00" ou "50.00" para centavos inteiros. */
export function brlToCents(input: string): number {
  const normalized = input.replace(/\./g, "").replace(",", ".").trim();
  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}
