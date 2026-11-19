import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Compass,
  DollarSign,
  Droplets,
  Edit,
  ExternalLink,
  FileText,
  Grid3X3,
  Image as ImageIcon,
  Layers,
  List,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Ruler,
  Search,
  Settings,
  Star,
  Tag,
  Trash2,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/shared";
import { useToast } from "@/hooks/use-toast";
import {
  inferIrrigationSystemType,
} from "@/lib/adminContactHelpers";
import type { EngineeringReportSeed } from "@/lib/engineeringReportEngine";
import AIIrrigationKitGenerator from "@/components/Admin/AI/AIIrrigationKitGenerator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface PricingTier {
  name: string;
  price: number;
  description?: string;
}

interface ComponentsData {
  main_components?: string[];
  pricing_tiers?: PricingTier[];
  included_services?: string[];
}

interface IrrigationKit {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  target_crop?: string | null;
  recommended_crops?: string[] | null;
  coverage_area?: number | null;
  price?: number | null;
  in_stock?: boolean | null;
  featured?: boolean | null;
  maintenance_level?: "low" | "medium" | "high" | null;
  installation_complexity?: string | null;
  installation_time_hours?: number | null;
  water_efficiency_percentage?: number | null;
  warranty_months?: number | null;
  active?: boolean | null;
  kit_type?: string | null;
  components?: Json | ComponentsData | null;
  images?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface KitDocument {
  id: string;
  kit_id: string | null;
  document_type: string;
  title: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  version: string | null;
  description: string | null;
  download_count: number | null;
  requires_login: boolean | null;
  language: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface CustomerInstallation {
  id: string;
  kit_id: string | null;
  customer_id: string | null;
  quote_id: string | null;
  installation_date: string | null;
  installation_status: string | null;
  satisfaction_rating: number | null;
  site_area: number | null;
  site_location: string | null;
  soil_type: string | null;
  water_source: string | null;
  customer_feedback: string | null;
  technician_notes: string | null;
  special_requirements: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AIKitGeneratedData {
  name: string;
  description: string;
  category: string;
  target_crop: string;
  maintenance_level: "low" | "medium" | "high";
  kit_type: string;
  recommended_crops: string[];
  components: {
    main_components: string[];
    included_services: string[];
  };
}

interface IrrigationKitsManagementProps {
  onStartEngineeringReport?: (seed: EngineeringReportSeed) => void;
}

const KIT_TYPE_LABELS: Record<string, string> = {
  basic_drip: "Basic Drip System",
  advanced_drip: "Advanced Drip System",
  sprinkler_system: "Sprinkler System",
  greenhouse_kit: "Greenhouse Kit",
  hydroponic_kit: "Hydroponic Kit",
  smart_irrigation: "Smart Irrigation System",
};

const KIT_CATEGORIES = [
  "Drip Irrigation",
  "Sprinkler System",
  "Greenhouse",
  "Hydroponic",
  "general",
];

const EMPTY_COMPONENTS: ComponentsData = {
  main_components: [],
  pricing_tiers: [],
  included_services: [],
};

const createEmptyKitForm = (): Partial<IrrigationKit> => ({
  name: "",
  description: "",
  category: "Drip Irrigation",
  target_crop: "",
  recommended_crops: [],
  coverage_area: 1,
  price: 0,
  in_stock: true,
  featured: false,
  maintenance_level: "low",
  installation_complexity: "medium",
  installation_time_hours: 4,
  water_efficiency_percentage: 85,
  warranty_months: 12,
  active: true,
  kit_type: "basic_drip",
  components: { ...EMPTY_COMPONENTS },
  images: [],
});

const parseComponents = (raw?: Json | ComponentsData | null): ComponentsData => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY_COMPONENTS };
  }
  const obj = raw as Record<string, unknown>;
  return {
    main_components: Array.isArray(obj.main_components)
      ? (obj.main_components.filter((x): x is string => typeof x === "string"))
      : [],
    pricing_tiers: Array.isArray(obj.pricing_tiers)
      ? (obj.pricing_tiers as PricingTier[])
      : [],
    included_services: Array.isArray(obj.included_services)
      ? (obj.included_services.filter((x): x is string => typeof x === "string"))
      : [],
  };
};

const formatKes = (price?: number | null) =>
  price && price > 0 ? `KES ${price.toLocaleString("en-KE")}` : "Quote on request";

const IrrigationKitsManagement: React.FC<IrrigationKitsManagementProps> = ({
  onStartEngineeringReport,
}) => {
  const { toast } = useToast();

  const [kits, setKits] = useState<IrrigationKit[]>([]);
  const [documents, setDocuments] = useState<KitDocument[]>([]);
  const [installations, setInstallations] = useState<CustomerInstallation[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("kits");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [kitTypeFilter, setKitTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState<number>(1);
  const pageSize = 9;

  // Editor state
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editorTab, setEditorTab] = useState<string>("basics");
  const [selectedKit, setSelectedKit] = useState<IrrigationKit | null>(null);
  const [formData, setFormData] = useState<Partial<IrrigationKit>>(createEmptyKitForm);

  // Component/Tier/Service draft inputs
  const [newComponent, setNewComponent] = useState<string>("");
  const [newService, setNewService] = useState<string>("");
  const [newPricingTier, setNewPricingTier] = useState<PricingTier>({
    name: "",
    price: 0,
    description: "",
  });

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Delete & Document edit dialogs
  const [deleteTarget, setDeleteTarget] = useState<IrrigationKit | null>(null);
  const [editingDoc, setEditingDoc] = useState<KitDocument | null>(null);
  const [docDraft, setDocDraft] = useState<{
    title: string;
    document_type: string;
    version: string;
    requires_login: boolean;
  }>({
    title: "",
    document_type: "manual",
    version: "1.0",
    requires_login: false,
  });

  const loadData = useCallback(async () => {
    setDataLoading(true);
    setLoadError(null);
    try {
      const [kitsRes, docsRes, instRes] = await Promise.all([
        supabase
          .from("irrigation_kits")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("kit_documents")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("customer_kit_installations")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (kitsRes.error) throw new Error(kitsRes.error.message);
      if (docsRes.error) throw new Error(docsRes.error.message);
      if (instRes.error) throw new Error(instRes.error.message);

      setKits((kitsRes.data || []) as IrrigationKit[]);
      setDocuments((docsRes.data || []) as KitDocument[]);
      setInstallations((instRes.data || []) as CustomerInstallation[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load irrigation kits data";
      setLoadError(msg);
      toast({
        title: "Error Loading Kits",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryFilter, kitTypeFilter, statusFilter]);

  const kitStats = useMemo(() => {
    const activeKits = kits.filter((k) => k.active !== false).length;
    const inStockKits = kits.filter((k) => k.in_stock !== false).length;
    const featuredKits = kits.filter((k) => k.featured).length;
    const totalDownloads = documents.reduce((sum, d) => sum + (d.download_count || 0), 0);
    const ratedInstalls = installations.filter(
      (i) => i.satisfaction_rating && i.satisfaction_rating > 0,
    );
    const avgSatisfaction =
      ratedInstalls.length > 0
        ? Number(
            (
              ratedInstalls.reduce((s, i) => s + (i.satisfaction_rating || 0), 0) /
              ratedInstalls.length
            ).toFixed(1),
          )
        : 0;

    return {
      totalKits: kits.length,
      activeKits,
      inStockKits,
      featuredKits,
      totalDocs: documents.length,
      totalDownloads,
      totalInstallations: installations.length,
      avgSatisfaction,
    };
  }, [kits, documents, installations]);

  const filteredKits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return kits.filter((kit) => {
      if (categoryFilter !== "all" && (kit.category || "general") !== categoryFilter) {
        return false;
      }
      if (kitTypeFilter !== "all" && kit.kit_type !== kitTypeFilter) {
        return false;
      }
      if (statusFilter === "active" && kit.active === false) return false;
      if (statusFilter === "inactive" && kit.active !== false) return false;
      if (statusFilter === "in_stock" && kit.in_stock === false) return false;
      if (statusFilter === "featured" && !kit.featured) return false;

      if (!q) return true;
      return (
        kit.name.toLowerCase().includes(q) ||
        (kit.description || "").toLowerCase().includes(q) ||
        (kit.target_crop || "").toLowerCase().includes(q) ||
        (kit.category || "").toLowerCase().includes(q) ||
        (kit.recommended_crops || []).some((crop) => crop.toLowerCase().includes(q))
      );
    });
  }, [kits, searchQuery, categoryFilter, kitTypeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredKits.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedKits = filteredKits.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleNewKit = () => {
    setSelectedKit(null);
    setFormData(createEmptyKitForm());
    setFormError(null);
    setImageError(null);
    setEditorTab("basics");
    setShowForm(true);
  };

  const handleEditKit = (kit: IrrigationKit) => {
    setSelectedKit(kit);
    setFormData({
      ...kit,
      components: parseComponents(kit.components),
      recommended_crops: kit.recommended_crops || [],
      images: kit.images || [],
    });
    setFormError(null);
    setImageError(null);
    setEditorTab("basics");
    setShowForm(true);
  };

  const handleAIGenerated = (data: AIKitGeneratedData) => {
    setSelectedKit(null);
    setFormData({
      ...createEmptyKitForm(),
      name: data.name || "",
      description: data.description || "",
      category: data.category || "Drip Irrigation",
      target_crop: data.target_crop || "",
      recommended_crops: data.recommended_crops || [],
      maintenance_level: data.maintenance_level || "low",
      kit_type: data.kit_type || "basic_drip",
      components: {
        main_components: data.components?.main_components || [],
        pricing_tiers: [],
        included_services: data.components?.included_services || [],
      },
    });
    setFormError(null);
    setEditorTab("basics");
    setShowForm(true);
    toast({
      title: "AI Kit Draft Ready",
      description: "Review pricing tiers, coverage area, and images before saving.",
    });
  };

  const handleSaveKit = async () => {
    setFormError(null);

    if (!formData.name?.trim()) {
      setFormError("Kit Name is required.");
      setEditorTab("basics");
      return;
    }
    if (!formData.kit_type) {
      setFormError("Kit Type is required.");
      setEditorTab("basics");
      return;
    }
    if (formData.price === undefined || formData.price === null || formData.price < 0) {
      setFormError("Base Price (KES) must be zero or greater.");
      setEditorTab("specs");
      return;
    }
    if (formData.description && formData.description.trim().length > 0 && formData.description.trim().length < 40) {
      setFormError("Description must be at least 40 characters (or leave empty).");
      setEditorTab("basics");
      return;
    }

    setSaving(true);
    try {
      const normalizedComponents = parseComponents(formData.components);
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        category: formData.category || "Drip Irrigation",
        target_crop: formData.target_crop?.trim() || null,
        recommended_crops: formData.recommended_crops || [],
        coverage_area: formData.coverage_area || null,
        price: formData.price || null,
        in_stock: formData.in_stock !== false,
        featured: Boolean(formData.featured),
        maintenance_level: formData.maintenance_level || "low",
        installation_complexity: formData.installation_complexity || "medium",
        installation_time_hours: formData.installation_time_hours || null,
        water_efficiency_percentage: formData.water_efficiency_percentage || null,
        warranty_months: formData.warranty_months || null,
        active: formData.active !== false,
        kit_type: formData.kit_type || null,
        components: normalizedComponents as unknown as Json,
        images: formData.images || [],
      };

      if (selectedKit) {
        const { error } = await supabase
          .from("irrigation_kits")
          .update(payload)
          .eq("id", selectedKit.id);
        if (error) throw error;
        toast({ title: "Kit Updated", description: `${payload.name} saved cleanly.` });
      } else {
        const { error } = await supabase
          .from("irrigation_kits")
          .insert([payload]);
        if (error) throw error;
        toast({ title: "Kit Created", description: `${payload.name} added to catalog.` });
      }

      setShowForm(false);
      setSelectedKit(null);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save irrigation kit";
      setFormError(msg);
      toast({
        title: "Save Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleKitFlag = async (
    kit: IrrigationKit,
    field: "active" | "in_stock" | "featured",
    nextVal: boolean,
  ) => {
    setKits((prev) =>
      prev.map((k) => (k.id === kit.id ? { ...k, [field]: nextVal } : k)),
    );

    const { error } = await supabase
      .from("irrigation_kits")
      .update({ [field]: nextVal } as Record<string, boolean>)
      .eq("id", kit.id);

    if (error) {
      toast({
        title: "Toggle Update Failed",
        description: error.message,
        variant: "destructive",
      });
      loadData();
      return;
    }

    const label =
      field === "active" ? "Visibility" : field === "in_stock" ? "Stock Status" : "Featured Flag";
    toast({
      title: `${label} Updated`,
      description: `${kit.name} marked ${nextVal ? "ON" : "OFF"}.`,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from("irrigation_kits")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw error;
      toast({
        title: "Kit Deleted",
        description: `${deleteTarget.name} removed from catalog.`,
      });
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete kit";
      toast({
        title: "Delete Failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size must be 5MB or smaller.");
      return;
    }

    setUploadingImage(true);
    setImageError(null);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `kit-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("kit-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("kit-images").getPublicUrl(filePath);

      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), publicUrl],
      }));
      toast({ title: "Image Uploaded", description: "Added to kit media gallery." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      setImageError(msg);
      toast({ title: "Upload Failed", description: msg, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = async (imageUrl: string, index: number) => {
    const nextImages = (formData.images || []).filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, images: nextImages }));

    try {
      const pathPart = imageUrl.split("/kit-images/")[1];
      if (pathPart) {
        await supabase.storage.from("kit-images").remove([pathPart]);
      }
    } catch (err) {
      console.warn("Storage cleanup skipped:", err);
    }
  };

  const addComponent = () => {
    const trimmed = newComponent.trim();
    if (!trimmed) return;
    const current = parseComponents(formData.components);
    setFormData((prev) => ({
      ...prev,
      components: {
        ...current,
        main_components: [...(current.main_components || []), trimmed],
      },
    }));
    setNewComponent("");
  };

  const removeComponent = (idx: number) => {
    const current = parseComponents(formData.components);
    setFormData((prev) => ({
      ...prev,
      components: {
        ...current,
        main_components: (current.main_components || []).filter((_, i) => i !== idx),
      },
    }));
  };

  const addService = () => {
    const trimmed = newService.trim();
    if (!trimmed) return;
    const current = parseComponents(formData.components);
    setFormData((prev) => ({
      ...prev,
      components: {
        ...current,
        included_services: [...(current.included_services || []), trimmed],
      },
    }));
    setNewService("");
  };

  const removeService = (idx: number) => {
    const current = parseComponents(formData.components);
    setFormData((prev) => ({
      ...prev,
      components: {
        ...current,
        included_services: (current.included_services || []).filter((_, i) => i !== idx),
      },
    }));
  };

  const addPricingTier = () => {
    if (!newPricingTier.name.trim() || newPricingTier.price <= 0) {
      toast({
        title: "Invalid Tier",
        description: "Enter a tier name and a price greater than 0 KES.",
        variant: "destructive",
      });
      return;
    }
    const current = parseComponents(formData.components);
    setFormData((prev) => ({
      ...prev,
      components: {
        ...current,
        pricing_tiers: [
          ...(current.pricing_tiers || []),
          {
            name: newPricingTier.name.trim(),
            price: newPricingTier.price,
            description: newPricingTier.description?.trim() || undefined,
          },
        ],
      },
    }));
    setNewPricingTier({ name: "", price: 0, description: "" });
  };

  const removePricingTier = (idx: number) => {
    const current = parseComponents(formData.components);
    setFormData((prev) => ({
      ...prev,
      components: {
        ...current,
        pricing_tiers: (current.pricing_tiers || []).filter((_, i) => i !== idx),
      },
    }));
  };

  const handleLaunchEngReportForKit = (kit: IrrigationKit) => {
    if (!onStartEngineeringReport) return;
    const primaryCrop =
      kit.target_crop?.trim() ||
      (kit.recommended_crops && kit.recommended_crops[0]) ||
      "Horticulture / Open Field";
    const systemType = inferIrrigationSystemType(kit.kit_type, kit.category, kit.name);
    onStartEngineeringReport({
      acres: kit.coverage_area && kit.coverage_area > 0 ? kit.coverage_area : undefined,
      cropName: primaryCrop,
      systemType: systemType || "drip",
      projectTitle: `${kit.name} — Custom Engineering & BOQ Proposal`,
      siteNotes: `Seeded from Irrigation Kit: ${kit.name}\nCoverage Area: ${
        kit.coverage_area ? `${kit.coverage_area} acres` : "Custom"
      }\nCatalog Base Price: ${formatKes(kit.price)}\nKit Type: ${
        KIT_TYPE_LABELS[kit.kit_type || ""] || kit.kit_type || "Standard"
      }${kit.description ? `\n\n${kit.description}` : ""}`,
      reportEdition: "client_proposal",
      sourceModule: "Irrigation Kits",
    });
  };

  const openDocumentEditor = (doc: KitDocument) => {
    setEditingDoc(doc);
    setDocDraft({
      title: doc.title,
      document_type: doc.document_type,
      version: doc.version || "1.0",
      requires_login: Boolean(doc.requires_login),
    });
  };

  const handleSaveDocMetadata = async () => {
    if (!editingDoc || !docDraft.title.trim()) return;
    const { error } = await supabase
      .from("kit_documents")
      .update({
        title: docDraft.title.trim(),
        document_type: docDraft.document_type.trim() || "manual",
        version: docDraft.version.trim() || "1.0",
        requires_login: docDraft.requires_login,
      })
      .eq("id", editingDoc.id);

    if (error) {
      toast({
        title: "Document Update Failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Document Updated" });
    setEditingDoc(null);
    loadData();
  };

  // Loading & error views (clean, inside Admin container without nested min-h-screen)
  if (dataLoading) {
    return (
      <Card className="border-border/70">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading irrigation kits studio...</p>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="border-border/70">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-medium text-destructive">{loadError}</p>
          <Button variant="outline" onClick={loadData}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Kit Form Editor View
  if (showForm) {
    const components = parseComponents(formData.components);
    const descLen = (formData.description || "").trim().length;

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Back to Kits
            </Button>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {selectedKit ? `Edit: ${selectedKit.name}` : "Create New Irrigation Kit"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Configure components, tiered pricing, agronomic targets, and showcase photography.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AIIrrigationKitGenerator onGenerate={handleAIGenerated} />
            <Button onClick={handleSaveKit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Kit"
              )}
            </Button>
          </div>
        </div>

        {formError && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <Tabs value={editorTab} onValueChange={setEditorTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="basics">1. Basic Info & Media</TabsTrigger>
            <TabsTrigger value="components">
              2. Components ({components.main_components?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="specs">
              3. Pricing & Specs ({components.pricing_tiers?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Info & Media */}
          <TabsContent value="basics" className="space-y-4">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base">Kit Identity & Agronomic Fit</CardTitle>
                <CardDescription>
                  Core catalog classification shown on public kit showcase pages and Engineering Studio presets.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="kit-name">Kit Name *</Label>
                    <Input
                      id="kit-name"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Pro-Yield 1-Acre Open Field Drip Kit"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="kit-type">Kit Type *</Label>
                    <Select
                      value={formData.kit_type || ""}
                      onValueChange={(v) => setFormData({ ...formData, kit_type: v })}
                    >
                      <SelectTrigger id="kit-type">
                        <SelectValue placeholder="Select kit type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(KIT_TYPE_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="kit-category">Category</Label>
                    <Select
                      value={formData.category || "Drip Irrigation"}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger id="kit-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KIT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="kit-target-crop">Primary Target Crop</Label>
                    <Input
                      id="kit-target-crop"
                      value={formData.target_crop || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, target_crop: e.target.value })
                      }
                      placeholder="e.g., Onions, Tomatoes, Hass Avocado"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="kit-crops">Recommended Crops (comma-separated)</Label>
                    <Input
                      id="kit-crops"
                      value={(formData.recommended_crops || []).join(", ")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recommended_crops: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Onions, Cabbage, Capsicum"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="kit-description">Description</Label>
                    <span className="text-xs text-muted-foreground">
                      {descLen} chars {descLen > 0 && descLen < 40 ? "(min 40 required)" : ""}
                    </span>
                  </div>
                  <Textarea
                    id="kit-description"
                    rows={4}
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Detailed hydraulic overview, emitter spacing, filtration included, and farmer benefits (at least 40 characters when filled)."
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-muted/30 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <Switch
                      id="kit-active"
                      checked={formData.active !== false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, active: checked })
                      }
                    />
                    <Label htmlFor="kit-active" className="cursor-pointer">
                      Active on Storefront
                    </Label>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Switch
                      id="kit-stock"
                      checked={formData.in_stock !== false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, in_stock: checked })
                      }
                    />
                    <Label htmlFor="kit-stock" className="cursor-pointer">
                      In Stock
                    </Label>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Switch
                      id="kit-featured"
                      checked={Boolean(formData.featured)}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, featured: checked })
                      }
                    />
                    <Label htmlFor="kit-featured" className="cursor-pointer">
                      Featured Kit
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kit Images */}
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  Kit Media Gallery
                </CardTitle>
                <CardDescription>
                  Upload high-resolution photos stored in the `kit-images` bucket (max 5MB per photo).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Label
                    htmlFor="kit-image-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Kit Image
                      </>
                    )}
                    <input
                      id="kit-image-upload"
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </Label>
                </div>

                {imageError && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {imageError}
                  </p>
                )}

                {formData.images && formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {formData.images.map((url, idx) => (
                      <div key={url + idx} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                        <img
                          src={url}
                          alt={`Kit preview ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(url, idx)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Components & Services */}
          <TabsContent value="components" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  Main Kit Components
                </CardTitle>
                <CardDescription>
                  Pipes, drip laterals, filters, start connectors, grommets, valves & fittings included.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newComponent}
                    onChange={(e) => setNewComponent(e.target.value)}
                    placeholder="e.g., 1,000m Drip Tape 16mm @ 30cm spacing"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addComponent();
                      }
                    }}
                  />
                  <Button type="button" onClick={addComponent}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {components.main_components?.map((comp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                        {comp}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => removeComponent(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {(!components.main_components || components.main_components.length === 0) && (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No components added yet. Add hardware line items above.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  Included Services & Support
                </CardTitle>
                <CardDescription>
                  Training, agronomy walkthroughs, pressure testing, or commissioning deliverables.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    placeholder="e.g., On-farm installation & technician training"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addService();
                      }
                    }}
                  />
                  <Button type="button" onClick={addService}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {components.included_services?.map((srv, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {srv}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => removeService(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {(!components.included_services || components.included_services.length === 0) && (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No included services listed yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Pricing Tiers & Specs */}
          <TabsContent value="specs" className="space-y-4">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Pricing Tiers & Acreage Variants
                </CardTitle>
                <CardDescription>
                  Define optional tiers (e.g., 1/8 Acre, 1/4 Acre, 1/2 Acre, 1 Acre) alongside the base price.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                  <Input
                    value={newPricingTier.name}
                    onChange={(e) =>
                      setNewPricingTier({ ...newPricingTier, name: e.target.value })
                    }
                    placeholder="Tier name (e.g., 1/4 Acre)"
                  />
                  <Input
                    type="number"
                    value={newPricingTier.price || ""}
                    onChange={(e) =>
                      setNewPricingTier({
                        ...newPricingTier,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Price (KES)"
                  />
                  <Input
                    value={newPricingTier.description || ""}
                    onChange={(e) =>
                      setNewPricingTier({ ...newPricingTier, description: e.target.value })
                    }
                    placeholder="Notes (e.g., 2 lines per bed)"
                  />
                  <Button type="button" onClick={addPricingTier}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Tier
                  </Button>
                </div>

                <div className="space-y-2">
                  {components.pricing_tiers?.map((tier, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-foreground">{tier.name}</span>
                          <span className="text-base font-bold text-primary">
                            KES {tier.price.toLocaleString("en-KE")}
                          </span>
                        </div>
                        {tier.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{tier.description}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => removePricingTier(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base">Engineering & Commercial Parameters</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="kit-price">Base Price (KES) *</Label>
                  <Input
                    id="kit-price"
                    type="number"
                    value={formData.price ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: e.target.value === "" ? null : parseFloat(e.target.value),
                      })
                    }
                    placeholder="45000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kit-coverage">Coverage Area (acres)</Label>
                  <Input
                    id="kit-coverage"
                    type="number"
                    step="0.125"
                    value={formData.coverage_area ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coverage_area:
                          e.target.value === "" ? null : parseFloat(e.target.value),
                      })
                    }
                    placeholder="1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kit-efficiency">Water Efficiency (%)</Label>
                  <Input
                    id="kit-efficiency"
                    type="number"
                    value={formData.water_efficiency_percentage ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        water_efficiency_percentage:
                          e.target.value === "" ? null : parseInt(e.target.value, 10),
                      })
                    }
                    placeholder="90"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kit-install-time">Installation Time (hours)</Label>
                  <Input
                    id="kit-install-time"
                    type="number"
                    value={formData.installation_time_hours ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        installation_time_hours:
                          e.target.value === "" ? null : parseInt(e.target.value, 10),
                      })
                    }
                    placeholder="4"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kit-complexity">Installation Complexity</Label>
                  <Select
                    value={formData.installation_complexity || "medium"}
                    onValueChange={(v) =>
                      setFormData({ ...formData, installation_complexity: v })
                    }
                  >
                    <SelectTrigger id="kit-complexity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kit-maintenance">Maintenance Level</Label>
                  <Select
                    value={formData.maintenance_level || "low"}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        maintenance_level: v as "low" | "medium" | "high",
                      })
                    }
                  >
                    <SelectTrigger id="kit-maintenance">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kit-warranty">Warranty (months)</Label>
                  <Input
                    id="kit-warranty"
                    type="number"
                    value={formData.warranty_months ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warranty_months:
                          e.target.value === "" ? null : parseInt(e.target.value, 10),
                      })
                    }
                    placeholder="12"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Irrigation Kits Studio
              </h2>
              <Badge variant="outline" className="border-primary/30 text-primary">
                {kitStats.totalKits} Kits
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Curate turnkey drip, sprinkler & greenhouse kits, toggle availability live, and seed custom Client Engineering Reports.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <AIIrrigationKitGenerator onGenerate={handleAIGenerated} />
          <Button size="sm" onClick={handleNewKit}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Kit
          </Button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Catalog Kits
            </CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kitStats.totalKits}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {kitStats.activeKits} active on storefront
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              In Stock & Featured
            </CardTitle>
            <Droplets className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {kitStats.inStockKits}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {kitStats.featuredKits} featured showcases
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Technical Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kitStats.totalDocs}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {kitStats.totalDownloads.toLocaleString("en-KE")} client downloads
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Field Installations
            </CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {kitStats.totalInstallations}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {kitStats.avgSatisfaction > 0 ? `${kitStats.avgSatisfaction} / 5 avg rating` : "No ratings yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sub-module Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="kits">Irrigation Kits ({kits.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="installations">Installations ({installations.length})</TabsTrigger>
        </TabsList>

        {/* TAB 1: KITS */}
        <TabsContent value="kits" className="space-y-4">
          {/* Search & Filters */}
          <Card className="border-border/70">
            <CardContent className="p-4 flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search kit name, target crop, description, or category..."
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {KIT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={kitTypeFilter} onValueChange={setKitTypeFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Kit Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Kit Types</SelectItem>
                    {Object.entries(KIT_TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="inactive">Inactive / Draft</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    className="h-8 px-2.5"
                    onClick={() => setViewMode("grid")}
                    title="Card Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    className="h-8 px-2.5"
                    onClick={() => setViewMode("table")}
                    title="Table view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {paginatedKits.length === 0 ? (
            <Card className="border-border/70">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No matching irrigation kits</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mb-4">
                  Adjust your filters or create a new irrigation package for your growers.
                </p>
                <Button onClick={handleNewKit}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create New Kit
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedKits.map((kit) => {
                const parsed = parseComponents(kit.components);
                const heroImg = kit.images && kit.images.length > 0 ? kit.images[0] : null;
                const typeLabel =
                  KIT_TYPE_LABELS[kit.kit_type || ""] || kit.kit_type || "Irrigation Kit";

                return (
                  <Card
                    key={kit.id}
                    className="border-border/80 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      {/* Thumbnail Header */}
                      <div className="relative h-40 w-full bg-muted/50 border-b border-border/60 overflow-hidden">
                        {heroImg ? (
                          <img
                            src={heroImg}
                            alt={kit.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Package className="h-10 w-10 opacity-40" />
                          </div>
                        )}
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                          <Badge className="bg-background/90 text-foreground border border-border/80 backdrop-blur-sm text-[11px]">
                            {typeLabel}
                          </Badge>
                          {kit.featured && (
                            <Badge className="bg-amber-500 text-white text-[11px]">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="absolute bottom-2.5 right-2.5">
                          <Badge className="bg-primary text-primary-foreground font-bold shadow-sm">
                            {formatKes(kit.price)}
                          </Badge>
                        </div>
                      </div>

                      <CardHeader className="pb-2">
                        <CardTitle className="text-base line-clamp-1">{kit.name}</CardTitle>
                        <CardDescription className="text-xs line-clamp-2 min-h-[2rem]">
                          {kit.description || "Ready-to-deploy turnkey irrigation kit."}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-0">
                        {/* Technical Specs Strip */}
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {kit.coverage_area ? (
                            <Badge variant="secondary" className="font-normal gap-1">
                              <Ruler className="h-3 w-3" />
                              {kit.coverage_area} ac
                            </Badge>
                          ) : null}
                          {kit.target_crop && (
                            <Badge variant="secondary" className="font-normal gap-1">
                              <Tag className="h-3 w-3" />
                              {kit.target_crop}
                            </Badge>
                          )}
                          <Badge variant="outline" className="font-normal">
                            {parsed.main_components?.length || 0} components
                          </Badge>
                          {(parsed.pricing_tiers?.length || 0) > 0 && (
                            <Badge variant="outline" className="font-normal">
                              {parsed.pricing_tiers?.length} tiers
                            </Badge>
                          )}
                        </div>

                        {/* Inline Live Switches */}
                        <div className="grid grid-cols-3 gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2 text-[11px]">
                          <label className="flex items-center justify-between gap-1 cursor-pointer">
                            <span className="text-muted-foreground font-medium">Active</span>
                            <Switch
                              checked={kit.active !== false}
                              onCheckedChange={(v) => handleToggleKitFlag(kit, "active", v)}
                              aria-label={`Toggle active for ${kit.name}`}
                            />
                          </label>
                          <label className="flex items-center justify-between gap-1 cursor-pointer">
                            <span className="text-muted-foreground font-medium">Stock</span>
                            <Switch
                              checked={kit.in_stock !== false}
                              onCheckedChange={(v) => handleToggleKitFlag(kit, "in_stock", v)}
                              aria-label={`Toggle stock for ${kit.name}`}
                            />
                          </label>
                          <label className="flex items-center justify-between gap-1 cursor-pointer">
                            <span className="text-muted-foreground font-medium">Feat.</span>
                            <Switch
                              checked={Boolean(kit.featured)}
                              onCheckedChange={(v) => handleToggleKitFlag(kit, "featured", v)}
                              aria-label={`Toggle featured for ${kit.name}`}
                            />
                          </label>
                        </div>
                      </CardContent>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-border/60 px-4 py-3 bg-muted/20">
                      {onStartEngineeringReport ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => handleLaunchEngReportForKit(kit)}
                        >
                          <Compass className="h-3.5 w-3.5 mr-1" />
                          Eng. Report
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {kit.category || "General"}
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-xs"
                          onClick={() => handleEditKit(kit)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(kit)}
                          title="Delete kit"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <Card className="border-border/70 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Kit Name</TableHead>
                      <TableHead>Type & Category</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>In Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedKits.map((kit) => {
                      const heroImg = kit.images && kit.images.length > 0 ? kit.images[0] : null;
                      const parsed = parseComponents(kit.components);

                      return (
                        <TableRow key={kit.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center">
                                {heroImg ? (
                                  <img
                                    src={heroImg}
                                    alt={kit.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-foreground truncate max-w-[220px]">
                                  {kit.name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                                  {kit.target_crop || `${parsed.main_components?.length || 0} components`}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="w-fit text-[11px]">
                                {KIT_TYPE_LABELS[kit.kit_type || ""] || kit.kit_type || "Standard"}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                {kit.category || "General"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-foreground">
                            {kit.coverage_area ? `${kit.coverage_area} ac` : "—"}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {formatKes(kit.price)}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={kit.active !== false}
                              onCheckedChange={(v) => handleToggleKitFlag(kit, "active", v)}
                              aria-label={`Toggle active for ${kit.name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={kit.in_stock !== false}
                              onCheckedChange={(v) => handleToggleKitFlag(kit, "in_stock", v)}
                              aria-label={`Toggle stock for ${kit.name}`}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {onStartEngineeringReport && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-primary"
                                  onClick={() => handleLaunchEngReportForKit(kit)}
                                  title="Open in Engineering Studio"
                                >
                                  <Compass className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditKit(kit)}
                                title="Edit kit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(kit)}
                                title="Delete kit"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                Showing {(safePage - 1) * pageSize + 1}–
                {Math.min(safePage * pageSize, filteredKits.length)} of {filteredKits.length} kits
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: DOCUMENTS */}
        <TabsContent value="documents">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Kit Manuals & Technical Documents</CardTitle>
              <CardDescription>
                Open attached PDFs/datasheets or update document titles, types, and version metadata.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>File Size</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium text-foreground">{doc.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.document_type.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.version || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {doc.download_count || 0}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.file_size
                            ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs"
                              disabled={!doc.file_url}
                              onClick={() =>
                                window.open(doc.file_url, "_blank", "noopener,noreferrer")
                              }
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              Open
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => openDocumentEditor(doc)}
                              title="Edit document metadata"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {documents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          No kit documents uploaded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: INSTALLATIONS */}
        <TabsContent value="installations">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Customer Kit Installations</CardTitle>
              <CardDescription>
                Field deployment tracking, site acreage, status, and post-commissioning ratings.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Customer</TableHead>
                      <TableHead>Kit ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Install Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installations.map((inst) => (
                      <TableRow key={inst.id}>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {inst.customer_id || "—"}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {inst.kit_id || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {inst.site_location || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {inst.site_area ? `${inst.site_area} ac` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {inst.installation_status || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {inst.satisfaction_rating ? (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < (inst.satisfaction_rating || 0)
                                      ? "text-amber-500 fill-amber-500"
                                      : "text-muted-foreground/40"
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-muted-foreground ml-1">
                                ({inst.satisfaction_rating})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No rating</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {inst.installation_date
                            ? new Date(inst.installation_date).toLocaleDateString("en-KE")
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {installations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          No field kit installations logged yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Kit Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Irrigation Kit</DialogTitle>
            <DialogDescription>
              Permanently delete <strong>{deleteTarget?.name}</strong> from the catalog? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              Delete Kit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Metadata Dialog */}
      <Dialog open={Boolean(editingDoc)} onOpenChange={(open) => !open && setEditingDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Kit Document</DialogTitle>
            <DialogDescription>
              Update display title, classification, and version tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-title">Document Title</Label>
              <Input
                id="doc-title"
                value={docDraft.title}
                onChange={(e) => setDocDraft((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="doc-type">Document Type</Label>
                <Input
                  id="doc-type"
                  value={docDraft.document_type}
                  onChange={(e) =>
                    setDocDraft((p) => ({ ...p, document_type: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-version">Version</Label>
                <Input
                  id="doc-version"
                  value={docDraft.version}
                  onChange={(e) => setDocDraft((p) => ({ ...p, version: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Switch
                id="doc-requires-login"
                checked={docDraft.requires_login}
                onCheckedChange={(checked) =>
                  setDocDraft((p) => ({ ...p, requires_login: checked }))
                }
              />
              <Label htmlFor="doc-requires-login" className="cursor-pointer">
                Require Customer Login Before Download
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingDoc(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveDocMetadata}>
              Save Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IrrigationKitsManagement;
