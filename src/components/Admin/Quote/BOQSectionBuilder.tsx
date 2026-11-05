import React, { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Package,
  Plus,
  Search,
  Trash2,
  Wrench,
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
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        category === "all" || product.category === category;
      const searchable = [
        product.name,
        product.model_number,
        product.category,
        product.subcategory,
        product.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesCategory && (!term || searchable.includes(term));
    });
  }, [products, search, category]);

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

  const addSection = () => {
    const nextSection: BOQSection = {
      id: makeId(),
      name: `Section ${sections.length + 1}`,
      description: "",
      sort_order: sections.length,
    };
    onSectionsChange([...sections, nextSection]);
  };

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
    const description =
      [product.model_number, product.description || product.subcategory]
        .filter(Boolean)
        .join(" — ") || product.category || "";
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
    setCatalogueOpen(true);
  };

  const openManual = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setManualOpen(true);
  };

  const grandSubtotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card className="overflow-hidden border-border bg-background shadow-lg">
      <CardHeader className="border-b border-border bg-muted/30">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-foreground">
              Bill of Quantities
            </CardTitle>
            <CardDescription className="mt-1">
              Build the BOQ in sections. Select saved products or add a custom
              line when it is not in the catalogue.
            </CardDescription>
          </div>
          <Button type="button" onClick={addSection}>
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
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
                      className="h-9 max-w-xl border-transparent bg-transparent px-2 text-base font-semibold shadow-none focus-visible:border-input focus-visible:bg-background"
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
                      className="h-8 max-w-xl border-transparent bg-transparent px-2 text-sm text-muted-foreground shadow-none focus-visible:border-input focus-visible:bg-background"
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
                    variant="ghost"
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
                    variant="ghost"
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
                    variant="ghost"
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
                        <TableHead className="min-w-[180px]">Item</TableHead>
                        <TableHead className="min-w-[220px]">Description / specification</TableHead>
                        <TableHead className="w-24">Qty</TableHead>
                        <TableHead className="w-24">Unit</TableHead>
                        <TableHead className="min-w-[135px]">Unit price (KES)</TableHead>
                        <TableHead className="min-w-[135px] text-right">Line total</TableHead>
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
                                className="min-w-[160px]"
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
                            <Textarea
                              value={item.description}
                              aria-label="BOQ item description"
                              onChange={(event) =>
                                updateItem(item.id, {
                                  description: event.target.value,
                                })
                              }
                              rows={2}
                              className="min-w-[210px] resize-y text-sm"
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
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.unit}
                              aria-label="Unit"
                              onChange={(event) =>
                                updateItem(item.id, { unit: event.target.value })
                              }
                              className="w-20"
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
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatKES(item.total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
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
                    onClick={() => openCatalogue(section.id)}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Add from Catalogue
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
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
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add a product from the catalogue</DialogTitle>
            <DialogDescription>
              Search DripTech products. The saved product name, model and current
              catalogue price will be copied into this quote.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, model or specification"
                className="pl-9"
                autoFocus
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {entry.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
            {productsLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading product catalogue…
              </p>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-foreground">No matching products</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add this item manually when it is not in the product catalogue.
                </p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product)}
                  className="flex w-full flex-col gap-2 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">
                      {product.name}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {[product.model_number, product.category, product.subcategory]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    {product.description && (
                      <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">
                        {product.description}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {product.price == null ? (
                      <Badge variant="outline">Price not set</Badge>
                    ) : (
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatKES(Number(product.price))}
                      </span>
                    )}
                    <Plus className="h-4 w-4 text-primary" />
                  </span>
                </button>
              ))
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Product catalogue prices are starting values. Confirm supplier pricing
            and update the unit price for this specific quotation before saving.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add a manual BOQ item</DialogTitle>
            <DialogDescription>
              Use this for site-specific works, custom fittings, services or
              products that are not currently in the catalogue.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={addManualItem}>
            <div className="space-y-2">
              <Label htmlFor="manual-item-name">Item name</Label>
              <Input
                id="manual-item-name"
                required
                value={manualItem.name}
                onChange={(event) =>
                  setManualItem((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Site installation and commissioning"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-item-description">
                Description / specification
              </Label>
              <Textarea
                id="manual-item-description"
                rows={3}
                value={manualItem.description}
                onChange={(event) =>
                  setManualItem((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Enter the required size, rating, scope or specification"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-2">
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
                />
              </div>
              <div className="space-y-2">
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
                  placeholder="e.g. m, roll, set"
                />
              </div>
              <div className="col-span-2 space-y-2 sm:col-span-1">
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
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setManualOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BOQSectionBuilder;
