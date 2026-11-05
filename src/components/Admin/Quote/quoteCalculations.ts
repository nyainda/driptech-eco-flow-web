import type { Quote, QuoteItem } from "./types";

export interface QuoteTotals {
  subtotal: number;
  vat: number;
  total: number;
  vatRate: number;
}

/**
 * Keep the preview, printed quotation and downloaded PDF on one calculation path.
 * VAT can be configured per BOQ line; otherwise the quotation-level VAT setting applies.
 */
export const calculateQuoteTotals = (
  quote: Pick<Quote, "include_vat" | "vat_rate">,
  items: QuoteItem[],
): QuoteTotals => {
  const subtotal = items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
    0,
  );

  const vat = items.reduce((sum, item) => {
    const hasItemVat =
      item.include_vat !== undefined &&
      item.include_vat &&
      item.vat_rate !== undefined &&
      item.vat_rate > 0;
    const rate = hasItemVat
      ? item.vat_rate || 0
      : quote.include_vat && quote.vat_rate > 0
        ? quote.vat_rate
        : 0;
    return (
      sum +
      Number(item.quantity || 0) *
        Number(item.unit_price || 0) *
        (rate / 100)
    );
  }, 0);

  const itemWithVat = items.find(
    (item) =>
      item.include_vat && item.vat_rate !== undefined && item.vat_rate > 0,
  );
  const vatRate = itemWithVat
    ? itemWithVat.vat_rate || 0
    : quote.include_vat && quote.vat_rate > 0
      ? quote.vat_rate
      : 0;

  return { subtotal, vat, total: subtotal + vat, vatRate };
};
