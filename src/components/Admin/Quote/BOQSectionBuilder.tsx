import React, { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  Package,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface BOQSection {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
}

export interface BOQItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  section_id?: string | null;
  section_name?: string;
  sort_order?: number;
  product_id?: string | null;
}

export interface CatalogueProduct {
  id: string;
  name: string;
  model_number?: string | null;
  category?: string | null;
  subcategory?: string | null;
  description?: string | null;
  price?: number | null;
  in_stock?: boolean | null;
}

interface BOQSectionBuilderProps {
  sections: BOQSection[];
  items: BOQItem[];
  products: CatalogueProduct[];
  productsLoading?: boolean;
  onSectionsChange: (sections: BOQSection[]) => void;
  onItemsChange: (items: BOQItem[]) => void;
}

const makeId = () => crypto.randomUUID();

const formatKES = (value: number) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const categoryLabel = (value: string) =>
  value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// Keep BOQ actions legible against both warm light surfaces and dark surfaces.
const primaryActionClass =
  "border border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover hover:text-primary-foreground disabled:opacity-80";
const outlineActionClass =
  "border border-border bg-background text-foreground shadow-sm hover:border-primary/60 hover:bg-muted hover:text-foreground disabled:opacity-80";
const dangerActionClass =
  "border border-border bg-background text-destructive shadow-sm hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive disabled:opacity-80";

const BOQSectionBuilder: React.FC<BOQSectionBuilderProps> = ({
  sections,
  items,
  products,
  productsLoading = false,
  onSectionsChange,
  onItemsChange,
}) => {
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [productPage, setProductPage] = useState(1);
  const productPageSize = 8;
  const [manualItem, setManualItem] = useState({
    name: "",
    description: "",
    quantity: "1",
    unit: "unit",
    unit_price: "",
  });

  const orderedSections = useMemo(
    () => [...sections].sort((a, b) => a.sort_order - b.sort_order),
    [sections],
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((product) => product.category).filter(Boolean)),
      ).sort() as string[],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const term = normalizeSearchText(search);
    const terms = term.split(/\s+/).filter(Boolean);

    return products
      .map((product) => {
        const name = normalizeSearchText(product.name);
        const model = normalizeSearchText(product.model_number || "");
        const categoryText = normalizeSearchText(product.category || "");
        const searchable = normalizeSearchText(
          [
            product.name,
            product.model_number,
            product.category,
            product.subcategory,
            product.description,
          ]
            .filter(Boolean)
            .join(" "),
        );
        const matchesEveryTerm = terms.every((token) =>
          searchable.includes(token),
        );

        let score = 0;
        if (term && name === term) score += 100;
        else if (term && name.startsWith(term)) score += 70;
        else if (term && name.includes(term)) score += 50;
        if (term && model === term) score += 45;
        else if (term && model.includes(term)) score += 30;
        if (term && categoryText.includes(term)) score += 10;

        return { product, matchesEveryTerm, score };
      })
      .filter(
        ({ product, matchesEveryTerm }) =>
          (category === "all" || product.category === category) &&
          matchesEveryTerm,
      )
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.product.name.localeCompare(b.product.name),
      )
      .map(({ product }) => product);
  }, [products, search, category]);

  const productPageCount = Math.max(
    1,
    Math.ceil(filteredProducts.length / productPageSize),
  );
  const visibleProducts = filteredProducts.slice(
    (productPage - 1) * productPageSize,
    productPage * productPageSize,
  );

  const changeSearch = (value: string) => {
    setSearch(value);
    setProductPage(1);
  };

  const changeCategory = (value: string) => {
    setCategory(value);
    setProductPage(1);
  };

  const itemsForSection = (sectionId: string) =>
    items.filter((item) => item.section_id === sectionId);

  const updateSection = (sectionId: string, patch: Partial<BOQSection>) => {
    const nextSections = sections.map((section) =>
      section.id === sectionId ? { ...section, ...patch } : section,
    );
    onSectionsChange(nextSections);

    if (patch.name !== undefined) {
      onItemsChange(
        items.map((item) =>
          item.section_id === sectionId
            ? { ...item, section_name: patch.name }
            : item,
        ),
      );
    }
  };

  const addSection = (presetName?: string, presetDesc?: string) => {
    const nextSection: BOQSection = {
      id: makeId(),
      name: presetName || `Section ${sections.length + 1}`,
      description: presetDesc || "",
      sort_order: sections.length,
    };
    onSectionsChange([...sections, nextSection]);
  };

  const SECTION_PRESETS = [
    { name: "Headworks & Filtration Unit", desc: "Screen/disc filters, fertigation venturi, pressure gauges, and control valves" },
    { name: "Mainline & Sub-Main Pipework", desc: "HDPE/PVC supply pipes, elbows, tees, reducers, and saddle clamps" },
    { name: "In-Field Drip Laterals & Fittings", desc: "Dripline rolls, start connectors, offtake grommets, couplings, and end caps" },
    { name: "Solar Pumping & Control System", desc: "Submersible/surface pump, solar PV array, controller, and mounting structure" },
    { name: "Civil Works, Trenching & Commissioning", desc: "Site layout, trenching, installation labor, pressure testing, and agronomic handover" },
  ];

  const removeSection = (section: BOQSection) => {
    if (sections.length <= 1) return;
    const sectionItems = itemsForSection(section.id);
    if (
      sectionItems.length > 0 &&
      !window.confirm(
        `Delete "${section.name}" and its ${sectionItems.length} BOQ item(s)?`,
      )
    ) {
      return;
    }
    onSectionsChange(
      sections
        .filter((entry) => entry.id !== section.id)
        .map((entry, index) => ({ ...entry, sort_order: index })),
    );
    onItemsChange(items.filter((item) => item.section_id !== section.id));
  };

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    const ordered = [...orderedSections];
    const currentIndex = ordered.findIndex((section) => section.id === sectionId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;
    [ordered[currentIndex], ordered[nextIndex]] = [
      ordered[nextIndex],
      ordered[currentIndex],
    ];
    onSectionsChange(
      ordered.map((section, index) => ({ ...section, sort_order: index })),
    );
  };

  const addProduct = (product: CatalogueProduct) => {
    const section = sections.find((entry) => entry.id === activeSectionId);
    if (!section) return;
    const unitPrice = Number(product.price ?? 0);
    // Keep each quote line compact. Full catalogue descriptions remain searchable
    // but are not copied into the BOQ by default.
    const description = [product.model_number, product.subcategory || product.category]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 160);
    const newItem: BOQItem = {
      id: makeId(),
      product_id: product.id,
      section_id: section.id,
      section_name: section.name,
      name: product.name,
      description,
      quantity: 1,
      unit: "unit",
      unit_price: unitPrice,
      total: unitPrice,
    };
    onItemsChange([...items, newItem]);
    setCatalogueOpen(false);
    setSearch("");
    setCategory("all");
    setProductPage(1);
  };

  const addManualItem = (event: React.FormEvent) => {
    event.preventDefault();
    const section = sections.find((entry) => entry.id === activeSectionId);
    if (!section || !manualItem.name.trim()) return;
    const quantity = Math.max(0, Number(manualItem.quantity) || 0);
    const unitPrice = Math.max(0, Number(manualItem.unit_price) || 0);
    onItemsChange([
      ...items,
      {
        id: makeId(),
        product_id: null,
        section_id: section.id,
        section_name: section.name,
        name: manualItem.name.trim(),
        description: manualItem.description.trim(),
        quantity,
        unit: manualItem.unit.trim() || "unit",
        unit_price: unitPrice,
        total: quantity * unitPrice,
      },
    ]);
    setManualItem({
      name: "",
      description: "",
      quantity: "1",
      unit: "unit",
      unit_price: "",
    });
    setManualOpen(false);
  };

  const updateItem = (itemId: string, patch: Partial<BOQItem>) => {
    onItemsChange(
      items.map((item) => {
        if (item.id !== itemId) return item;
        const updated = { ...item, ...patch };
        updated.total =
          Math.max(0, Number(updated.quantity) || 0) *
          Math.max(0, Number(updated.unit_price) || 0);
        return updated;
      }),
    );
  };

  const removeItem = (itemId: string) => {
    onItemsChange(items.filter((item) => item.id !== itemId));
  };

  const openCatalogue = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setProductPage(1);
    setCatalogueOpen(true);
  };

  const openManual = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setManualItem({
      name: "",
      description: "",
      quantity: "1",
      unit: "unit",
      unit_price: "",
    });
    setManualOpen(true);
  };

  const grandSubtotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card className="overflow-hidden border-border bg-background shadow-lg">
      <CardHeader className="border-b border-border bg-muted/30 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-foreground">
              Engineering Bill of Quantities (BOQ)
            </CardTitle>
            <CardDescription className="mt-1">
              Structure the quotation into engineering work packages. Pick saved catalogue SKUs or add custom site works.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            className={primaryActionClass}
            onClick={() => addSection()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Section
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
            Quick Add Package:
          </span>
          {SECTION_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addSection(preset.name, preset.desc)}
              className="h-7 rounded-full px-2.5 text-[11px] font-medium border-border/80 bg-background hover:border-primary/50 hover:bg-primary/5"
            >
              + {preset.name}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-4 sm:p-6">
        {orderedSections.map((section, index) => {
          const sectionItems = itemsForSection(section.id);
          const sectionSubtotal = sectionItems.reduce(
            (sum, item) => sum + item.total,
            0,
          );

          return (
            <section
              key={section.id}
              className="overflow-hidden rounded-xl border border-border"
            >
              <div className="flex flex-col gap-3 border-b border-border bg-muted/30 p-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Input
                      aria-label={`Section ${index + 1} name`}
                      value={section.name}
                      onChange={(event) =>
                        updateSection(section.id, { name: event.target.value })
                      }
                      className="h-9 max-w-xl border-transparent bg-transparent px-2 text-base font-semibold text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-input focus-visible:bg-background"
                    />
                    <Input
                      aria-label={`Section ${index + 1} description`}
                      value={section.description || ""}
                      onChange={(event) =>
                        updateSection(section.id, {
                          description: event.target.value,
                        })
                      }
                      placeholder="Optional section description"
                      className="h-8 max-w-xl border-transparent bg-transparent px-2 text-sm text-muted-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-input focus-visible:bg-background"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Badge variant="secondary">
                    {sectionItems.length} {sectionItems.length === 1 ? "item" : "items"}
                  </Badge>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatKES(sectionSubtotal)}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className={outlineActionClass}
                    aria-label="Move section up"
                    title="Move section up"
                    disabled={index === 0}
                    onClick={() => moveSection(section.id, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className={outlineActionClass}
                    aria-label="Move section down"
                    title="Move section down"
                    disabled={index === orderedSections.length - 1}
                    onClick={() => moveSection(section.id, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className={dangerActionClass}
                    aria-label={`Delete ${section.name}`}
                    title="Delete section"
                    disabled={sections.length <= 1}
                    onClick={() => removeSection(section)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {sectionItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No items in this section yet. Add products from the catalogue
                  or enter a custom BOQ item.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px] font-semibold text-foreground">Item</TableHead>
                        <TableHead className="min-w-[220px] font-semibold text-foreground">Description / specification</TableHead>
                        <TableHead className="w-24 font-semibold text-foreground">Qty</TableHead>
                        <TableHead className="w-24 font-semibold text-foreground">Unit</TableHead>
                        <TableHead className="min-w-[135px] font-semibold text-foreground">Unit price (KES)</TableHead>
                        <TableHead className="min-w-[135px] text-right font-semibold text-foreground">Line total</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sectionItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <Input
                                value={item.name}
                                aria-label="BOQ item name"
                                onChange={(event) =>
                                  updateItem(item.id, { name: event.target.value })
                                }
                                className="min-w-[160px] text-foreground placeholder:text-muted-foreground"
                              />
                              <Badge
                                variant="outline"
                                className="w-fit text-[10px]"
                              >
                                {item.product_id ? "Catalogue product" : "Manual item"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.description}
                              aria-label="BOQ item description"
                              title={item.description}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  description: event.target.value,
                                })
                              }
                              className="min-w-[190px] max-w-[260px] text-xs text-foreground placeholder:text-muted-foreground"
                              placeholder="Optional specification"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={item.quantity}
                              aria-label="Quantity"
                              onChange={(event) =>
                                updateItem(item.id, {
                                  quantity: Number(event.target.value),
                                })
                              }
                              className="w-20 text-foreground placeholder:text-muted-foreground"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.unit}
                              aria-label="Unit"
                              onChange={(event) =>
                                updateItem(item.id, { unit: event.target.value })
                              }
                              className="w-20 text-foreground placeholder:text-muted-foreground"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              aria-label="Unit price"
                              onChange={(event) =>
                                updateItem(item.id, {
                                  unit_price: Number(event.target.value),
                                })
                              }
                              className="w-32 text-foreground placeholder:text-muted-foreground"
                            />
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatKES(item.total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className={dangerActionClass}
                              aria-label={`Remove ${item.name}`}
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className={primaryActionClass}
                    onClick={() => openCatalogue(section.id)}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Add from Catalogue
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={outlineActionClass}
                    onClick={() => openManual(section.id)}
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    Add Manual Item
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Section subtotal:{" "}
                  <span className="font-semibold text-foreground">
                    {formatKES(sectionSubtotal)}
                  </span>
                </div>
              </div>
            </section>
          );
        })}

        <div className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              BOQ subtotal before VAT
            </p>
            <p className="text-xs text-muted-foreground">
              Includes all items across {sections.length} section
              {sections.length === 1 ? "" : "s"}.
            </p>
          </div>
          <p className="text-xl font-bold tabular-nums text-foreground">
            {formatKES(grandSubtotal)}
          </p>
        </div>
      </CardContent>

      <Dialog open={catalogueOpen} onOpenChange={setCatalogueOpen}>
        <DialogContent className="flex max-h-[88vh] max-w-5xl flex-col overflow-hidden bg-background p-0 text-foreground">
          <DialogHeader className="border-b border-border px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg">Product catalogue</DialogTitle>
                <DialogDescription className="mt-1">
                  Find a saved product and add it to this BOQ section.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => changeSearch(event.target.value)}
                  placeholder="Search product name, model, SKU, category or specification…"
                  className="h-11 pl-9 pr-10 text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
                {search && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 border border-border bg-background text-foreground shadow-sm hover:bg-muted hover:text-foreground disabled:opacity-80"
                    aria-label="Clear product search"
                    onClick={() => changeSearch("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 lg:w-[250px]">
                <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Select value={category} onValueChange={changeCategory}>
                  <SelectTrigger className="h-11 border-border bg-background text-foreground">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {categoryLabel(entry)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={category === "all" ? primaryActionClass : outlineActionClass}
                onClick={() => changeCategory("all")}
              >
                All products
              </Button>
              {categories.slice(0, 5).map((entry) => (
                <Button
                  key={entry}
                  type="button"
                  size="sm"
                  variant="outline"
                  className={category === entry ? primaryActionClass : outlineActionClass}
                  onClick={() => changeCategory(entry)}
                >
                  {categoryLabel(entry)}
                </Button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <p className="text-sm font-medium text-foreground">
                {productsLoading
                  ? "Loading catalogue…"
                  : filteredProducts.length.toLocaleString("en-KE") + " matching products"}
              </p>
              <p className="text-xs text-muted-foreground">
                Search checks product names, models and specifications
              </p>
            </div>

            {productsLoading ? (
              <div className="grid min-h-48 place-items-center">
                <p className="text-sm text-muted-foreground">
                  Loading product catalogue…
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
                <Package className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
                <p className="font-semibold text-foreground">No products found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try another name, model number or category, or add a manual BOQ item.
                </p>
                <Button
                  type="button"
                  className={`mt-4 ${outlineActionClass}`}
                  variant="outline"
                  onClick={() => {
                    changeSearch("");
                    changeCategory("all");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {visibleProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/20"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground" title={product.name}>
                          {product.name}
                        </p>
                        {product.in_stock === false && (
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            Out of stock
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[product.model_number, product.category, product.subcategory]
                          .filter(Boolean)
                          .join(" · ") || "Catalogue item"}
                      </p>
                      {product.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground" title={product.description}>
                          {product.description}
                        </p>
                      )}
                      <div className="mt-1.5">
                        {product.price == null ? (
                          <Badge variant="outline" className="text-[10px]">
                            Price not set
                          </Badge>
                        ) : (
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {formatKES(Number(product.price))}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className={`shrink-0 ${primaryActionClass}`}
                      onClick={() => addProduct(product)}
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {!productsLoading && filteredProducts.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {(productPage - 1) * productPageSize + 1}–
                  {Math.min(productPage * productPageSize, filteredProducts.length)} of{" "}
                  {filteredProducts.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={outlineActionClass}
                    size="sm"
                    disabled={productPage <= 1}
                    onClick={() => setProductPage((page) => Math.max(1, page - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <span className="min-w-20 text-center text-xs tabular-nums text-muted-foreground">
                    Page {productPage} of {productPageCount}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className={outlineActionClass}
                    size="sm"
                    disabled={productPage >= productPageCount}
                    onClick={() => setProductPage((page) => Math.min(productPageCount, page + 1))}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Long catalogue descriptions are kept out of the BOQ by default. Confirm the project specification and adjust the quoted unit price before saving.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-w-2xl bg-background text-foreground">
          <DialogHeader>
            <DialogTitle>Add manual BOQ item</DialogTitle>
            <DialogDescription>
              Add a custom product, fitting, labour or installation cost.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
            <span className="text-xs text-muted-foreground">Adding to section</span>
            <Badge variant="secondary">
              {sections.find((entry) => entry.id === activeSectionId)?.name || "BOQ section"}
            </Badge>
          </div>

          <form className="space-y-4" onSubmit={addManualItem}>
            <div className="space-y-1.5">
              <Label htmlFor="manual-item-name">Item name</Label>
              <Input
                id="manual-item-name"
                required
                autoFocus
                value={manualItem.name}
                onChange={(event) =>
                  setManualItem((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Installation and commissioning"
                className="h-10 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="manual-item-description">
                Specification <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="manual-item-description"
                rows={2}
                value={manualItem.description}
                onChange={(event) =>
                  setManualItem((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Size, capacity, scope or other short details"
                className="resize-y text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="manual-item-quantity">Quantity</Label>
                <Input
                  id="manual-item-quantity"
                  type="number"
                  min="0"
                  step="any"
                  value={manualItem.quantity}
                  onChange={(event) =>
                    setManualItem((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  className="text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manual-item-unit">Unit</Label>
                <Input
                  id="manual-item-unit"
                  value={manualItem.unit}
                  onChange={(event) =>
                    setManualItem((current) => ({
                      ...current,
                      unit: event.target.value,
                    }))
                  }
                  placeholder="pcs, m, roll, set"
                  className="text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="col-span-2 space-y-1.5 sm:col-span-1">
                <Label htmlFor="manual-item-price">Unit price (KES)</Label>
                <Input
                  id="manual-item-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualItem.unit_price}
                  onChange={(event) =>
                    setManualItem((current) => ({
                      ...current,
                      unit_price: event.target.value,
                    }))
                  }
                  placeholder="0.00"
                  className="text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <span className="text-sm text-muted-foreground">Estimated line total</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatKES(
                  Math.max(0, Number(manualItem.quantity) || 0) *
                    Math.max(0, Number(manualItem.unit_price) || 0),
                )}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className={outlineActionClass}
                onClick={() => setManualOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
                className={primaryActionClass}
                disabled={!manualItem.name.trim()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to BOQ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </Card>
  );
};

export default BOQSectionBuilder;
