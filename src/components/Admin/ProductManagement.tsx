import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  EyeOff,
  ImageOff,
  Layers,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProductSeeder from "./ProductSeeder";
import ProductImporter from "./Product/ProductImporter";
import ProductForm from "./Product/ProductForm";
import ProductList from "./Product/ProductList";
import ProductSearch from "./Product/ProductSearch";
import ProductPagination from "./Product/ProductPagination";
import AIMarketResearch from "./AI/AIMarketResearch";
import {
  Product,
  ProductFormData,
  ProductSortOption,
  ProductStatusFilter,
  ProductViewMode,
  PRODUCT_CATEGORIES,
  getProductCategoryLabel,
} from "@/types/Product";
import { getProductPath } from "@/lib/productUrl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EMPTY_FORM_DATA: ProductFormData = {
  name: "",
  model_number: "",
  category: "drip_irrigation",
  subcategory: "",
  description: "",
  price: "",
  in_stock: true,
  featured: false,
  images: [],
  features: [],
  applications: [],
  specifications: [],
  variants: [],
};

function getEffectivePrice(product: Product): number {
  if (product.variants && product.variants.length > 0) {
    const prices = product.variants
      .map((v) => Number(v.price))
      .filter((p) => Number.isFinite(p) && p > 0);
    if (prices.length > 0) return Math.min(...prices);
  }
  const base = Number(product.price);
  return Number.isFinite(base) && base > 0 ? base : 0;
}

function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? "");
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("all");
  const [sortBy, setSortBy] = useState<ProductSortOption>("newest");
  const [viewMode, setViewMode] = useState<ProductViewMode>("table");
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showImporterModal, setShowImporterModal] = useState(false);
  const [showSeederModal, setShowSeederModal] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<ProductFormData>(EMPTY_FORM_DATA);
  const editingProductIdRef = useRef<string | null>(null);
  editingProductIdRef.current = editingProduct?.id ?? null;

  const { toast } = useToast();

  const fetchProducts = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        const rows = (data || []) as Product[];
        setProducts(rows);

        const activeEditingId = editingProductIdRef.current;
        if (activeEditingId) {
          const updated = rows.find((item) => item.id === activeEditingId);
          if (updated) {
            setEditingProduct(updated);
            setFormData((prev) => ({
              ...prev,
              images: updated.images || [],
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error",
          description: "Failed to load products catalog.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchProducts(false);
  }, [fetchProducts]);

  // Reset pagination whenever filters, search, sorting or page size changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, statusFilter, sortBy, itemsPerPage]);

  const statusCounts = useMemo(() => {
    let inStock = 0;
    let outOfStock = 0;
    let missingPhotos = 0;
    let featured = 0;
    let withVariants = 0;
    let unpriced = 0;
    let totalVariants = 0;
    const categoryCounts: Record<string, number> = {};

    for (const p of products) {
      if (p.in_stock) inStock++;
      else outOfStock++;
      if (!p.images || p.images.length === 0) missingPhotos++;
      if (p.featured) featured++;
      if (p.variants && p.variants.length > 0) {
        withVariants++;
        totalVariants += p.variants.length;
      }
      if (getEffectivePrice(p) <= 0) unpriced++;
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }

    return {
      all: products.length,
      in_stock: inStock,
      out_of_stock: outOfStock,
      missing_photos: missingPhotos,
      featured,
      with_variants: withVariants,
      unpriced,
      totalVariants,
      categoryCounts,
    };
  }, [products]);

  const pendingReview = useMemo(
    () => products.filter((p) => !p.in_stock),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = products.filter((product) => {
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false;
      }

      if (statusFilter === "in_stock" && !product.in_stock) return false;
      if (statusFilter === "out_of_stock" && product.in_stock) return false;
      if (statusFilter === "missing_photos" && (product.images?.length || 0) > 0) {
        return false;
      }
      if (statusFilter === "featured" && !product.featured) return false;
      if (statusFilter === "with_variants" && !(product.variants && product.variants.length > 0)) {
        return false;
      }
      if (statusFilter === "unpriced" && getEffectivePrice(product) > 0) {
        return false;
      }

      if (!query) return true;

      const haystack = [
        product.name,
        product.model_number,
        product.subcategory,
        product.description,
        getProductCategoryLabel(product.category),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    const sorted = [...filtered];
    if (sortBy === "name_asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "price_asc") {
      sorted.sort((a, b) => {
        const pa = getEffectivePrice(a);
        const pb = getEffectivePrice(b);
        if (pa === 0 && pb === 0) return 0;
        if (pa === 0) return 1;
        if (pb === 0) return -1;
        return pa - pb;
      });
    } else if (sortBy === "price_desc") {
      sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sortBy === "missing_photos") {
      sorted.sort((a, b) => (a.images?.length || 0) - (b.images?.length || 0));
    }
    return sorted;
  }, [products, searchTerm, selectedCategory, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const setProductBusy = (id: string, busy: boolean) => {
    setTogglingIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const runChunkedUpdate = async (
    ids: string[],
    patch: Record<string, unknown>,
  ) => {
    const chunkSize = 40;
    let updated = 0;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const { error } = await supabase
        .from("products")
        .update(patch as never)
        .in("id", chunk);
      if (error) throw error;
      updated += chunk.length;
    }
    return updated;
  };

  const runChunkedDelete = async (ids: string[]) => {
    const chunkSize = 40;
    let deleted = 0;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const { error } = await supabase.from("products").delete().in("id", chunk);
      if (error) throw error;
      deleted += chunk.length;
    }
    return deleted;
  };

  const approvePendingProducts = async () => {
    if (!pendingReview.length) return;
    if (
      !confirm(
        `Approve ${pendingReview.length} pending product(s) and publish them to the website?`,
      )
    ) {
      return;
    }
    setBulkBusy(true);
    try {
      const approved = await runChunkedUpdate(
        pendingReview.map((p) => p.id),
        { in_stock: true },
      );
      toast({
        title: "Approved",
        description: `${approved} product(s) are now live on the website.`,
      });
      await fetchProducts(true);
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to approve pending products",
        variant: "destructive",
      });
    } finally {
      setBulkBusy(false);
    }
  };

  const rejectPendingProducts = async () => {
    if (!pendingReview.length) return;
    if (
      !confirm(
        `Reject and permanently delete ${pendingReview.length} pending product(s)? This cannot be undone. In-stock products are not affected.`,
      )
    ) {
      return;
    }
    setBulkBusy(true);
    try {
      const ids = pendingReview.map((p) => p.id);
      const deleted = await runChunkedDelete(ids);
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      toast({
        title: "Rejected",
        description: `${deleted} pending product(s) removed.`,
      });
      await fetchProducts(true);
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to reject pending products",
        variant: "destructive",
      });
    } finally {
      setBulkBusy(false);
    }
  };

  const approveOne = async (id: string) => {
    setProductBusy(id, true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ in_stock: true })
        .eq("id", id);
      if (error) throw error;
      setProducts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, in_stock: true } : item)),
      );
      toast({ title: "Approved", description: "Product is now live on the storefront." });
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to approve",
        variant: "destructive",
      });
    } finally {
      setProductBusy(id, false);
    }
  };

  const rejectOne = async (id: string) => {
    if (!confirm("Reject and delete this pending product?")) return;
    setProductBusy(id, true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => prev.filter((sel) => sel !== id));
      toast({ title: "Rejected", description: "Pending product deleted." });
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to reject",
        variant: "destructive",
      });
    } finally {
      setProductBusy(id, false);
    }
  };

  const handleToggleStock = async (product: Product) => {
    const nextStock = !product.in_stock;
    setProductBusy(product.id, true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ in_stock: nextStock })
        .eq("id", product.id);
      if (error) throw error;
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, in_stock: nextStock } : item,
        ),
      );
      toast({
        title: nextStock ? "Published (In Stock)" : "Set to Hidden",
        description: `${product.name} is now ${nextStock ? "visible on the website" : "hidden from the storefront"}.`,
      });
    } catch (e: unknown) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Could not change stock status",
        variant: "destructive",
      });
    } finally {
      setProductBusy(product.id, false);
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    const nextFeatured = !product.featured;
    setProductBusy(product.id, true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ featured: nextFeatured })
        .eq("id", product.id);
      if (error) throw error;
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, featured: nextFeatured } : item,
        ),
      );
      toast({
        title: nextFeatured ? "Marked as Featured" : "Removed from Featured",
        description: product.name,
      });
    } catch (e: unknown) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Could not change featured state",
        variant: "destructive",
      });
    } finally {
      setProductBusy(product.id, false);
    }
  };

  const handleBulkAction = async (
    action: "in_stock" | "out_of_stock" | "feature" | "delete",
  ) => {
    if (selectedIds.length === 0) return;

    if (
      action === "delete" &&
      !confirm(
        `Permanently delete ${selectedIds.length} selected product(s)? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBulkBusy(true);
    try {
      if (action === "delete") {
        const count = await runChunkedDelete(selectedIds);
        toast({
          title: "Products deleted",
          description: `${count} product(s) removed.`,
        });
      } else if (action === "in_stock" || action === "out_of_stock") {
        const count = await runChunkedUpdate(selectedIds, {
          in_stock: action === "in_stock",
        });
        toast({
          title: "Stock updated",
          description: `${count} product(s) marked as ${action === "in_stock" ? "In Stock" : "Hidden / Out of Stock"}.`,
        });
      } else if (action === "feature") {
        const count = await runChunkedUpdate(selectedIds, { featured: true });
        toast({
          title: "Featured updated",
          description: `${count} product(s) marked as featured.`,
        });
      }
      setSelectedIds([]);
      await fetchProducts(true);
    } catch (e: unknown) {
      toast({
        title: "Bulk action failed",
        description: e instanceof Error ? e.message : "Could not complete bulk action",
        variant: "destructive",
      });
    } finally {
      setBulkBusy(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(`Authentication error: ${userError.message}`);
      if (!user) throw new Error("You must be logged in to upload images");

      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));

      toast({
        title: "Uploaded",
        description: `${uploadedUrls.length} image(s) uploaded successfully.`,
      });
    } catch (error: unknown) {
      console.error("Error uploading images:", error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM_DATA);
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const buildFormStateFromProduct = (
    product: Product,
    asCopy = false,
  ): ProductFormData => {
    const specs = product.technical_specs
      ? Object.entries(product.technical_specs).map(([name, spec]) => ({
          name,
          value:
            spec && typeof spec === "object" && "value" in spec
              ? String(spec.value ?? "")
              : String(spec ?? ""),
          unit:
            spec && typeof spec === "object" && "unit" in spec
              ? String(spec.unit ?? "")
              : "",
        }))
      : [];

    return {
      name: asCopy ? `${product.name} (Copy)` : product.name,
      model_number: asCopy
        ? product.model_number
          ? `${product.model_number}-COPY`
          : ""
        : product.model_number || "",
      category: product.category,
      subcategory: product.subcategory || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      in_stock: asCopy ? false : product.in_stock,
      featured: asCopy ? false : product.featured,
      images: product.images || [],
      features: product.features || [],
      applications: product.applications || [],
      specifications: specs,
      variants:
        product.variants?.map((v) => ({
          name: v.name,
          price: String(v.price ?? ""),
          in_stock: v.in_stock,
        })) || [],
    };
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(buildFormStateFromProduct(product, false));
    setShowAddForm(true);
  };

  const handleDuplicate = (product: Product) => {
    setEditingProduct(null);
    setFormData(buildFormStateFromProduct(product, true));
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const parsedBase = formData.price ? parseFloat(formData.price) : NaN;
      let priceToSave: number | null = Number.isFinite(parsedBase) ? parsedBase : null;

      const variantsToSave = formData.variants
        .map((v) => ({
          name: v.name.trim(),
          price: parseFloat(v.price),
          in_stock: v.in_stock,
        }))
        .filter((v) => v.name && Number.isFinite(v.price));

      let inStockToSave = formData.in_stock;

      if (variantsToSave.length > 0) {
        priceToSave = Math.min(...variantsToSave.map((v) => v.price));
        inStockToSave = variantsToSave.some((v) => v.in_stock);
      }

      const productData = {
        name: formData.name.trim(),
        model_number: formData.model_number.trim() || null,
        category: formData.category as never,
        subcategory: formData.subcategory.trim() || null,
        description: formData.description.trim() || null,
        price: priceToSave,
        in_stock: inStockToSave,
        featured: formData.featured,
        images: formData.images,
        features: formData.features,
        applications: formData.applications,
        specifications: formData.specifications.reduce<Record<string, string>>(
          (acc, spec) => {
            if (spec.name && spec.value) {
              acc[spec.name] = spec.unit ? `${spec.value} ${spec.unit}` : spec.value;
            }
            return acc;
          },
          {},
        ),
        technical_specs: formData.specifications.reduce<
          Record<string, { value: string; unit: string }>
        >((acc, spec) => {
          if (spec.name && spec.value) {
            acc[spec.name] = {
              value: spec.value,
              unit: spec.unit || "",
            };
          }
          return acc;
        }, {}),
        variants: variantsToSave.length > 0 ? variantsToSave : null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);
        if (error) throw error;
        toast({ title: "Saved", description: "Product updated successfully." });
      } else {
        const { error } = await supabase.from("products").insert([productData]);
        if (error) throw error;
        toast({ title: "Created", description: "Product added to catalog." });
      }

      resetForm();
      await fetchProducts(true);
    } catch (error: unknown) {
      console.error("Error saving product:", error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setProductBusy(id, true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => prev.filter((sel) => sel !== id));
      toast({ title: "Deleted", description: "Product removed from catalog." });
    } catch (error: unknown) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setProductBusy(id, false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleToggleSelectAllPage = (pageIds: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = pageIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !pageIds.includes(id));
      }
      return Array.from(new Set([...prev, ...pageIds]));
    });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setStatusFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    const headers = [
      "Name",
      "Model / SKU",
      "Category",
      "Subcategory",
      "Price (KES)",
      "Variants",
      "Status",
      "Featured",
      "Photos",
      "Storefront URL",
    ];
    const rows = filteredProducts.map((p) =>
      [
        p.name,
        p.model_number || "",
        getProductCategoryLabel(p.category),
        p.subcategory || "",
        getEffectivePrice(p) || "",
        p.variants?.length || 0,
        p.in_stock ? "In Stock" : "Hidden / Pending",
        p.featured ? "Yes" : "No",
        p.images?.length || 0,
        `https://www.dripstech.co.ke${getProductPath(p)}`,
      ]
        .map(escapeCsvCell)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `driptech-products-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedCategory !== "all" ||
    statusFilter !== "all" ||
    sortBy !== "newest";

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-56 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-80 rounded-lg bg-muted animate-pulse" />
          </div>
          <div className="h-9 w-36 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
        <div className="h-28 rounded-2xl border border-border bg-card animate-pulse" />
        <div className="h-96 rounded-2xl border border-border bg-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header & Compact Tool Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
              <Package className="h-6 w-6 text-emerald-600" />
              Product Catalog
            </h2>
            <Badge variant="secondary" className="font-semibold">
              {products.length} SKUs
            </Badge>
            {pendingReview.length > 0 && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30">
                {pendingReview.length} pending review
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage irrigation products, prices, variants, storefront visibility, and verified photos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowImporterModal(true)}
          >
            <UploadCloud className="mr-1.5 h-4 w-4" />
            Import JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSeederModal(true)}
          >
            <Database className="mr-1.5 h-4 w-4" />
            Catalog Seeder
          </Button>
          <AIMarketResearch
            onGenerate={(generated) => {
              toast({
                title: "AI suggestions created",
                description: `${generated.length} product suggestion(s) sent to AI Product Research.`,
              });
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredProducts.length === 0}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchProducts(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-1.5 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Clickable KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className="text-left focus:outline-none"
        >
          <Card
            className={`rounded-2xl border bg-card transition-all hover:border-emerald-500/40 ${
              statusFilter === "all" ? "border-emerald-500 ring-1 ring-emerald-500/30" : "border-border/80"
            }`}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Catalog</p>
                <p className="text-xl font-bold">{statusCounts.all}</p>
                <p className="text-[11px] text-muted-foreground">
                  {statusCounts.totalVariants} variants
                </p>
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("in_stock")}
          className="text-left focus:outline-none"
        >
          <Card
            className={`rounded-2xl border bg-card transition-all hover:border-emerald-500/40 ${
              statusFilter === "in_stock" ? "border-emerald-500 ring-1 ring-emerald-500/30" : "border-border/80"
            }`}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Stock (Live)</p>
                <p className="text-xl font-bold">{statusCounts.in_stock}</p>
                <p className="text-[11px] text-muted-foreground">Visible online</p>
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("out_of_stock")}
          className="text-left focus:outline-none"
        >
          <Card
            className={`rounded-2xl border bg-card transition-all hover:border-amber-500/40 ${
              statusFilter === "out_of_stock" ? "border-amber-500 ring-1 ring-amber-500/30" : "border-border/80"
            }`}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
                <EyeOff className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending / Hidden</p>
                <p className="text-xl font-bold">{statusCounts.out_of_stock}</p>
                <p className="text-[11px] text-muted-foreground">Needs review</p>
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("missing_photos")}
          className="text-left focus:outline-none"
        >
          <Card
            className={`rounded-2xl border bg-card transition-all hover:border-rose-500/40 ${
              statusFilter === "missing_photos" ? "border-rose-500 ring-1 ring-rose-500/30" : "border-border/80"
            }`}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={`rounded-xl p-2.5 ${
                  statusCounts.missing_photos > 0
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <ImageOff className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Missing Photos</p>
                <p className="text-xl font-bold">{statusCounts.missing_photos}</p>
                <p className="text-[11px] text-muted-foreground">Click to filter</p>
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("featured")}
          className="text-left focus:outline-none col-span-2 sm:col-span-1"
        >
          <Card
            className={`rounded-2xl border bg-card transition-all hover:border-amber-400/50 ${
              statusFilter === "featured" ? "border-amber-500 ring-1 ring-amber-500/30" : "border-border/80"
            }`}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Featured</p>
                <p className="text-xl font-bold">{statusCounts.featured}</p>
                <p className="text-[11px] text-muted-foreground">Homepage picks</p>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Pending Review Notice Banner */}
      {pendingReview.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>{pendingReview.length}</strong> product
              {pendingReview.length === 1 ? " is" : "s are"} currently hidden / pending review and not visible on the storefront.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {statusFilter !== "out_of_stock" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter("out_of_stock")}
                className="h-8 text-xs"
              >
                Review Pending
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={bulkBusy}
              onClick={approvePendingProducts}
              className="h-8 bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
            >
              {bulkBusy && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
              Approve All ({pendingReview.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={bulkBusy}
              onClick={rejectPendingProducts}
              className="h-8 text-xs"
            >
              Reject All
            </Button>
          </div>
        </div>
      )}

      {/* Search, Category, Sort, Quick Chips & View Switcher */}
      <ProductSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={PRODUCT_CATEGORIES}
        categoryCounts={statusCounts.categoryCounts}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusCounts={statusCounts}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        matchingCount={filteredProducts.length}
        onResetFilters={handleResetFilters}
      />

      {/* Contextual Bulk Selection Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.06] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
              {selectedIds.length} selected
            </Badge>
            {selectedIds.length < filteredProducts.length && (
              <button
                type="button"
                onClick={() => setSelectedIds(filteredProducts.map((p) => p.id))}
                className="text-xs font-medium text-emerald-700 dark:text-emerald-300 underline-offset-2 hover:underline"
              >
                Select all {filteredProducts.length} matching
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear selection
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={bulkBusy}
              onClick={() => handleBulkAction("in_stock")}
              className="h-8 text-xs"
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
              Mark In Stock
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={bulkBusy}
              onClick={() => handleBulkAction("out_of_stock")}
              className="h-8 text-xs"
            >
              <EyeOff className="mr-1 h-3.5 w-3.5 text-amber-600" />
              Hide / Out of Stock
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={bulkBusy}
              onClick={() => handleBulkAction("feature")}
              className="h-8 text-xs"
            >
              <Star className="mr-1 h-3.5 w-3.5 text-amber-500" />
              Feature
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={bulkBusy}
              onClick={() => handleBulkAction("delete")}
              className="h-8 text-xs"
            >
              {bulkBusy ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="mr-1 h-3.5 w-3.5" />
              )}
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Catalog Listing (Table or Grid) */}
      <ProductList
        products={filteredProducts}
        categories={PRODUCT_CATEGORIES}
        viewMode={viewMode}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAllPage={handleToggleSelectAllPage}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onApprove={approveOne}
        onReject={rejectOne}
        onToggleStock={handleToggleStock}
        onToggleFeatured={handleToggleFeatured}
        onImagesUpdated={() => fetchProducts(true)}
        togglingIds={togglingIds}
        currentPage={currentPage}
        productsPerPage={itemsPerPage}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleResetFilters}
        onAddProduct={() => {
          resetForm();
          setShowAddForm(true);
        }}
      />

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <ProductPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredProducts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={paginate}
          onNextPage={() => currentPage < totalPages && paginate(currentPage + 1)}
          onPrevPage={() => currentPage > 1 && paginate(currentPage - 1)}
        />
      )}

      {/* Add / Edit Product Dialog */}
      <Dialog
        open={showAddForm}
        onOpenChange={(open) => {
          if (!open) resetForm();
          else setShowAddForm(true);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              Fill in the product details below.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeImage}
            onImagesUpdated={() => fetchProducts(true)}
            editingProduct={editingProduct}
            uploading={uploading}
            saving={saving}
          />
        </DialogContent>
      </Dialog>

      {/* JSON Importer Dialog */}
      <Dialog open={showImporterModal} onOpenChange={setShowImporterModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Import products from JSON</DialogTitle>
            <DialogDescription>
              Upload a JSON array of products to insert non-duplicate SKUs.
            </DialogDescription>
          </DialogHeader>
          <ProductImporter
            embedded
            onImported={() => {
              fetchProducts(true);
              setShowImporterModal(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Reference Catalog Seeder Dialog */}
      <Dialog open={showSeederModal} onOpenChange={setShowSeederModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Irrigation Product Seeder</DialogTitle>
            <DialogDescription>
              Import or clean up reference irrigation products safely.
            </DialogDescription>
          </DialogHeader>
          <ProductSeeder
            embedded
            onSeeded={() => {
              fetchProducts(true);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
