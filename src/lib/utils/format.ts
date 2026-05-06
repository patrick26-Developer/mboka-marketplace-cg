// src/lib/utils/format.ts

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-CG", {
    style:                 "currency",
    currency:              "XAF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateOrderNumber(): string {
  const d      = new Date();
  const year   = d.getFullYear();
  const month  = String(d.getMonth() + 1).padStart(2, "0");
  const day    = String(d.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
  return `MCG-${year}${month}${day}-${random}`;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function calculateDiscount(
  price:        number,
  comparePrice: number | null
): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}