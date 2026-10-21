import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  X,
  Upload,
  Plus,
  Layers,
  CheckCircle2,
  XCircle,
  Tag,
  Palette,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AIProductGenerator from "../AI/AIProductGenerator";

interface ProductFormData {
  name: string;
  model_number: string;
  category: string;
  subcategory: string;
  description: string;
  price: string;
  in_stock: boolean;
  featured: boolean;
  images: string[];
  features: string[];
  applications: string[];
  specifications: { name: string; value: string; unit?: string }[];
  variants: { name: string; price: string; in_stock: boolean }[];
}

interface ProductFormProps {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  editingProduct: any;
  uploading: boolean;
}

const categories = [
  { value: "drip_irrigation", label: "Drip Irrigation" },
  { value: "sprinkler_systems", label: "Sprinkler Systems" },
  { value: "filtration_systems", label: "Filtration Systems" },
  { value: "control_systems", label: "Control Systems" },
  { value: "pumps_motors", label: "Pumps & Motors" },
  { value: "pipes_fittings", label: "Pipes & Fittings" },
  { value: "fertigation_systems", label: "Fertigation Systems" },
  { value: "greenhouse_systems", label: "Greenhouse Systems" },
  { value: "emitters_drippers", label: "Emitters & Drippers" },
  { value: "valves_regulators", label: "Valves & Regulators" },
  { value: "accessories", label: "Accessories" },
  { value: "filters_strainers", label: "Filters & Strainers" },
  { value: "controllers_timers", label: "Controllers & Timers" },
  { value: "borehole_equipment", label: "Borehole Equipment" },
];

const ProductForm: React.FC<ProductFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  editingProduct,
  uploading,
}) => {
  const { toast } = useToast();
  const [newFeature, setNewFeature] = useState("");
  const [newApplication, setNewApplication] = useState("");
  const [newSpec, setNewSpec] = useState({ name: "", value: "", unit: "" });

  const [bulkPaste, setBulkPaste] = useState("");
  const [bulkContentPaste, setBulkContentPaste] = useState("");

  const parseBulkSpecifications = (raw: string) => {
    const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const parsed: { name: string; value: string; unit: string }[] = [];
    for (const line of lines) {
      if (/^\|?\s*:?-{3,}/.test(line) || /^\s*\|?\s*name\s*\|/i.test(line)) continue;
      const cleaned = line.replace(/^\|/, "").replace(/\|$/, "").trim();
      let parts: string[] = [];
      if (cleaned.includes("|")) {
        parts = cleaned.split("|").map((part) => part.trim());
      } else if (cleaned.includes("\t")) {
        parts = cleaned.split("\t").map((part) => part.trim());
      } else if (/^[-*]\s+/.test(cleaned)) {
        const match = cleaned.replace(/^[-*]\s+/, "").match(/^([^:]+):\s*(.+)$/);
        if (match) {
          const label = match[1].trim();
          const valueUnit = match[2].trim().match(/^(.+?)\s+([a-zA-Z%°/]+(?:\s*[³²])?)$/);
          parsed.push({ name: label, value: valueUnit?.[1] || match[2].trim(), unit: valueUnit?.[2] || "" });
        }
        continue;
      } else {
        const match = cleaned.match(/^([^:=]+?)\s*[:=]\s*(.+)$/);
        if (match && !/^technical specifications$/i.test(match[1].trim())) {
          const valueUnit = match[2].trim().match(/^(.+?)\s+([a-zA-Z%°/]+(?:\s*[³²])?)$/);
          parsed.push({ name: match[1].trim(), value: valueUnit?.[1] || match[2].trim(), unit: valueUnit?.[2] || "" });
        }
        continue;
      }
      if (parts.length >= 2) {
        const name = parts[0].replace(/^\*+|\*+$/g, "").trim();
        const value = parts[1].replace(/^\*+|\*+$/g, "").trim();
        const unit = (parts[2] || "").replace(/^\*+|\*+$/g, "").trim();
        if (name && value && !/^unit$/i.test(name)) parsed.push({ name, value, unit });
      }
    }
    return parsed;
  };

  const applyBulkSpecifications = () => {
    const parsed = parseBulkSpecifications(bulkPaste);
    if (!parsed.length) {
      toast({
        title: "No specifications detected",
        description: "Paste a Name | Value | Unit table, tab-separated rows, or Name: Value lines.",
        variant: "destructive",
      });
      return;
    }
    const existingNames = new Set(formData.specifications.map((item) => item.name.trim().toLowerCase()));
    const additions = parsed.filter((item) => !existingNames.has(item.name.trim().toLowerCase()));
    setFormData((prev) => ({
      ...prev,
      specifications: [
        ...prev.specifications,
        ...additions,
      ],
    }));
    setBulkPaste("");
    toast({
      title: "Specifications imported",
      description: `${additions.length} specification(s) added. Existing rows with the same name were kept.`,
    });
  };

  const applyBulkContent = () => {
    const lines = bulkContentPaste.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return;
    const features: string[] = [];
    const applications: string[] = [];
    const descriptionLines: string[] = [];
    let section: "description" | "features" | "applications" = "description";
    for (const rawLine of lines) {
      const line = rawLine.replace(/^[-*•]\s+/, "").trim();
      if (/^(key\s+)?features?\s*:?$/i.test(line.replace(/[*#]/g, "").trim())) {
        section = "features";
        continue;
      }
      if (/^(common\s+)?applications?\s*:?$/i.test(line.replace(/[*#]/g, "").trim())) {
        section = "applications";
        continue;
      }
      if (/^description\s*:?$/i.test(line.replace(/[*#]/g, "").trim())) {
        section = "description";
        continue;
      }
      if (/^technical specifications$/i.test(line.replace(/[*#]/g, "").trim())) continue;
      if (section === "features") features.push(line);
      else if (section === "applications") applications.push(line);
      else descriptionLines.push(line);
    }
    setFormData((prev) => ({
      ...prev,
      description: descriptionLines.length ? descriptionLines.join("\n") : prev.description,
      features: [...prev.features, ...features.filter((value) => !prev.features.includes(value))],
      applications: [...prev.applications, ...applications.filter((value) => !prev.applications.includes(value))],
    }));
    setBulkContentPaste("");
    toast({
      title: "Content imported",
      description: `${descriptionLines.length ? "Description updated. " : ""}${features.length} feature(s) and ${applications.length} application(s) added.`,
    });
  };
\n  const [newVariant, setNewVariant] = useState({
    name: "",
    price: "",
    in_stock: true,
  });

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Authentication required");
      }

      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

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
        title: "Success",
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const addApplication = () => {
    if (newApplication.trim()) {
      setFormData((prev) => ({
        ...prev,
        applications: [...prev.applications, newApplication.trim()],
      }));
      setNewApplication("");
    }
  };

  const removeApplication = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      applications: prev.applications.filter((_, i) => i !== index),
    }));
  };

  const addSpecification = () => {
    if (newSpec.name.trim() && newSpec.value.trim()) {
      setFormData((prev) => ({
        ...prev,
        specifications: [...prev.specifications, { ...newSpec }],
      }));
      setNewSpec({ name: "", value: "", unit: "" });
    }
  };

  const removeSpecification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const addVariant = () => {
    if (newVariant.name.trim() && newVariant.price.trim()) {
      setFormData((prev) => ({
        ...prev,
        variants: [...prev.variants, { ...newVariant }],
      }));
      setNewVariant({ name: "", price: "", in_stock: true });
    }
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleAIGenerated = (data: any) => {
    setFormData((prev) => ({
      ...prev,
      name: data.name || prev.name,
      model_number: data.model_number || prev.model_number,
      subcategory: data.subcategory || prev.subcategory,
      description: data.description || prev.description,
      features: data.features ? [...prev.features, ...data.features] : prev.features,
      applications: data.applications ? [...prev.applications, ...data.applications] : prev.applications,
      specifications: data.specifications ? [...prev.specifications, ...data.specifications] : prev.specifications,
      variants: data.variants ? [...prev.variants, ...data.variants] : prev.variants,
    }));
  };

  return (
    <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-2xl">
      <CardHeader className="p-4 sm:p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-slate-600 dark:text-gray-400">
              {editingProduct
                ? "Update product information"
                : "Fill in the details to add a new product to your catalog"}
            </CardDescription>
          </div>
          <AIProductGenerator onGenerate={handleAIGenerated} />
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto gap-2 bg-muted/50 p-2 rounded-xl mb-6">
              <TabsTrigger value="basics" className="rounded-lg py-2 transition-all">General</TabsTrigger>
              <TabsTrigger value="content" className="rounded-lg py-2 transition-all">Content</TabsTrigger>
              <TabsTrigger value="details" className="rounded-lg py-2 transition-all">Details</TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-lg py-2 transition-all">Inventory</TabsTrigger>
              <TabsTrigger value="media" className="rounded-lg py-2 transition-all">Media</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="model" className="text-sm font-medium">Model Number</Label>
                  <Input
                    id="model"
                    value={formData.model_number}
                    onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                    placeholder="Enter model number"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="mt-2 capitalize">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} className="capitalize">
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subcategory" className="text-sm font-medium">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="Enter subcategory"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="price" className="text-sm font-medium">Base Price (KSH)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Enter base price"
                    className="mt-2"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0 p-4 bg-muted/30 rounded-lg h-full">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="in_stock"
                      checked={formData.in_stock}
                      onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                    />
                    <Label htmlFor="in_stock" className="text-sm font-medium">In Stock</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                    />
                    <Label htmlFor="featured" className="text-sm font-medium">Featured</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="space-y-1">
                  <Label htmlFor="bulk-product-content" className="text-sm font-semibold">Paste Description, Features & Applications</Label>
                  <p className="text-xs text-muted-foreground">Paste the description first, then optional sections labelled Features and Applications with one item per line. Existing content is preserved except the description, which is replaced when pasted.</p>
                </div>
                <Textarea
                  id="bulk-product-content"
                  value={bulkContentPaste}
                  onChange={(e) => setBulkContentPaste(e.target.value)}
                  placeholder={`The DripTech Eco-Flow pump is designed for...

Features
- Compact design
- Reliable water delivery

Applications
- Domestic water supply
- Small-scale irrigation`}
                  rows={6}
                  className="font-mono text-xs bg-background"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={applyBulkContent} disabled={!bulkContentPaste.trim()}>
                    <Layers className="h-4 w-4 mr-2" /> Import content
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setBulkContentPaste("")} disabled={!bulkContentPaste}>
                    Clear paste box
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={4}
                  className="mt-2 resize-none"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium">Key Features</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="e.g., UV resistant, Easy installation"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {feature}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeFeature(index)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium">Common Applications</Label>
                <div className="flex gap-2">
                  <Input
                    value={newApplication}
                    onChange={(e) => setNewApplication(e.target.value)}
                    placeholder="e.g., Greenhouse, Open field"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addApplication())}
                  />
                  <Button type="button" onClick={addApplication} className="bg-secondary hover:bg-secondary/90">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.applications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.applications.map((app, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1 border-primary/20 bg-primary/5 text-primary">
                        {app}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeApplication(index)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="space-y-1">
                  <Label htmlFor="bulk-product-specs" className="text-sm font-semibold">Paste Technical Specifications</Label>
                  <p className="text-xs text-muted-foreground">Paste a whole table at once. Supports <code>Name | Value | Unit</code>, tab-separated spreadsheet rows, Markdown tables, and simple <code>Name: Value</code> lines.</p>
                </div>
                <Textarea
                  id="bulk-product-specs"
                  value={bulkPaste}
                  onChange={(e) => setBulkPaste(e.target.value)}
                  placeholder={`Name | Value | Unit
Motor Power | 1 | HP
Rated Power | 750 | W
Voltage | 220–240 | V
Pump Type | Single-stage centrifugal | —`}
                  rows={6}
                  className="font-mono text-xs bg-background"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={applyBulkSpecifications} disabled={!bulkPaste.trim()}>
                    <Layers className="h-4 w-4 mr-2" /> Import all specifications
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setBulkPaste("")} disabled={!bulkPaste}>
                    Clear paste box
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium">Technical Specifications</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <Input
                    value={newSpec.name}
                    onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })}
                    placeholder="Name (e.g., Size)"
                  />
                  <Input
                    value={newSpec.value}
                    onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
                    placeholder="Value (e.g., 16)"
                  />
                  <Input
                    value={newSpec.unit}
                    onChange={(e) => setNewSpec({ ...newSpec, unit: e.target.value })}
                    placeholder="Unit (e.g., mm)"
                  />
                  <Button type="button" onClick={addSpecification} className="bg-muted hover:bg-muted/80 text-foreground">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                {formData.specifications.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.specifications.map((spec, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                        <div className="text-sm">
                          <strong className="text-foreground">{spec.name}:</strong>{" "}
                          <span className="text-muted-foreground">{spec.value} {spec.unit}</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSpecification(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <Label className="text-sm font-bold">Product Variants</Label>
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <Input
                        value={newVariant.name}
                        onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                        placeholder="e.g., Large"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Price</Label>
                      <Input
                        type="number"
                        value={newVariant.price}
                        onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex items-center justify-center pt-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newVariant.in_stock}
                          onCheckedChange={(checked) => setNewVariant({ ...newVariant, in_stock: checked })}
                        />
                        <span className="text-xs font-medium">In Stock</span>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button type="button" onClick={addVariant} className="w-full bg-primary/10 text-primary hover:bg-primary/20">
                        <Plus className="h-4 w-4 mr-1" /> Add Variant
                      </Button>
                    </div>
                  </div>
                </div>

                {formData.variants.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {formData.variants.map((v, i) => (
                      <div key={i} className="group relative bg-background rounded-xl border border-border p-4 hover:border-primary/50 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-bold">{v.name}</h4>
                            <p className="text-sm text-primary">KSH {parseFloat(v.price).toLocaleString()}</p>
                            <Badge variant={v.in_stock ? "outline" : "destructive"} className="text-[10px] h-4">
                              {v.in_stock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeVariant(i)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-4">
                <Label className="text-sm font-medium">Product Images</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="relative aspect-square">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-border rounded-2xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all gap-2"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Upload</span>
                    </Label>
                  </div>
                  {formData.images.map((url, i) => (
                    <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden border border-border">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <footer className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border">
            <Button type="button" variant="ghost" onClick={onCancel} className="font-bold border border-transparent hover:border-border">
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground font-bold px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
              {editingProduct ? "Update Product" : "Add Product"}
            </Button>
          </footer>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductForm;
