/**
 * Multi-project invoice helpers.
 * Project title is encoded in item.description as [[PROJECT:Title]]
 * so we don't need a DB migration. Down payment is encoded in notes.
 */

export const PROJECT_RE = /^\[\[PROJECT:([\s\S]*?)\]\]\s*/i;
export const DOWN_PAYMENT_RE = /\[\[DOWN_PAYMENT:([0-9]+(?:\.[0-9]+)?)\]\]/;

export function encodeProjectDescription(
  projectTitle: string | undefined | null,
  description: string | undefined | null,
): string | null {
  const desc = (description || "").replace(PROJECT_RE, "").trim();
  const title = (projectTitle || "").trim();
  if (!title) return desc || null;
  return `[[PROJECT:${title}]]${desc ? ` ${desc}` : ""}`;
}

export function decodeProjectFromDescription(description: string | null | undefined): {
  projectTitle: string;
  description: string;
} {
  const raw = description || "";
  const m = raw.match(PROJECT_RE);
  if (!m) return { projectTitle: "", description: raw };
  return {
    projectTitle: m[1].trim(),
    description: raw.replace(PROJECT_RE, "").trim(),
  };
}

export function encodeNotesWithDownPayment(
  notes: string | undefined | null,
  downPayment: number,
): string | null {
  const cleaned = (notes || "").replace(DOWN_PAYMENT_RE, "").trim();
  if (!downPayment || downPayment <= 0) return cleaned || null;
  return `[[DOWN_PAYMENT:${downPayment}]]${cleaned ? `\n${cleaned}` : ""}`;
}

export function decodeDownPaymentFromNotes(notes: string | null | undefined): {
  downPayment: number;
  notes: string;
} {
  const raw = notes || "";
  const m = raw.match(DOWN_PAYMENT_RE);
  const amount = m ? parseFloat(m[1]) : 0;
  return {
    downPayment: Number.isFinite(amount) ? amount : 0,
    notes: raw.replace(DOWN_PAYMENT_RE, "").trim(),
  };
}

export type ProjectGroup<T extends { description?: string | null; total?: number }> = {
  title: string;
  items: T[];
  subtotal: number;
};

/** Group items by encoded project title (preserves order). Empty title = "General". */
export function groupItemsByProject<
  T extends { description?: string | null; total?: number },
>(items: T[] | null | undefined): ProjectGroup<T>[] {
  if (!items?.length) return [];

  const groups: ProjectGroup<T>[] = [];
  let currentTitle = "";
  let currentItems: T[] = [];

  const flush = () => {
    if (!currentItems.length) return;
    const subtotal = currentItems.reduce((s, it) => s + (Number(it.total) || 0), 0);
    groups.push({
      title: currentTitle || "General",
      items: currentItems,
      subtotal,
    });
    currentItems = [];
  };

  for (const item of items) {
    const { projectTitle } = decodeProjectFromDescription(item.description);
    const title = projectTitle || "General";
    if (currentItems.length && title !== currentTitle) {
      flush();
    }
    currentTitle = title;
    currentItems.push(item);
  }
  flush();
  return groups;
}

export function ordinalProjectLabel(index: number, title: string): string {
  const ordinals = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];
  const prefix = ordinals[index] || `Project ${index + 1}`;
  if (!title || title === "General") return `${prefix} Project`;
  return `${prefix} Project — ${title}`;
}

export const DEFAULT_INVOICE_TERMS = `1. A deposit / down payment is required before works commence as stated on this invoice.
2. Balance is due on completion or as per the payment schedule agreed with the client.
3. Prices are in Kenya Shillings (KES) and include materials/services listed only.
4. Any variation or extra work will be quoted and invoiced separately.
5. Goods remain the property of DripTech Eco Flow until full payment is received.
6. Installation timelines depend on site readiness, weather, and payment of deposit.`;
