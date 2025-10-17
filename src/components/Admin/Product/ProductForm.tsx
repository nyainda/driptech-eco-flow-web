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
  { value: "accessories", label: "Accessories" },
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
  const [newVariant, setNewVariant] = useState({
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

  return (
    <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-2xl">
      <CardHeader className="p-4 sm:p-6 rounded-t-lg">
        <CardTitle className="text-xl sm:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-400 dark:to-gray-200">
          {editingProduct ? "Edit Product" : "Add New Product"}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-slate-600 dark:text-gray-400">
          {editingProduct
            ? "Update product information"
            : "Enter product details below"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label
                htmlFor="name"
                className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300"
              >
                Product Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter product name"
                required
                className="mt-2 h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700"
              />
            </div>
            <div>
              <Label
                htmlFor="model"
                className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300"
              >
                Model Number
              </Label>
              <Input
                id="model"
                value={formData.model_number}
                onChange={(e) =>
                  setFormData({ ...formData, model_number: e.target.value })
                }
                placeholder="Enter model number"
                className="mt-2 h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label
                htmlFor="category"
                className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300"
              >
                Category *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger className="mt-2 h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="subcategory"
                className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300"
              >
                Subcategory
              </Label>
              <Input
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) =>
                  setFormData({ ...formData, subcategory: e.target.value })
                }
                placeholder="Enter subcategory"
                className="mt-2 h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700"
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="description"
              className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter product description"
              rows={3}
              className="mt-2 text-sm sm:text-base resize-none border-slate-200 dark:border-gray-700"
            />
          </div>

          <div>
            <Label
              htmlFor="price"
              className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300"
            >
              Price (KSH)
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              placeholder="Enter price"
              className="mt-2 h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700"
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">
              Product Images
            </Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
                id="image-upload"
              />
              <Label htmlFor="image-upload" className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  asChild
                >
                  <div className="border-2 border-dashed border-blue-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-gray-500 bg-blue-50 dark:bg-gray-900/50 hover:bg-blue-100 dark:hover:bg-gray-800 transition-colors">
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload Images"}
                  </div>
                </Button>
              </Label>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-slate-200 dark:border-gray-700 shadow-sm group-hover:shadow-md transition-shadow"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <Label className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">
              Features
            </Label>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Enter feature"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addFeature())
                }
                className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700"
              />
              <Button
                type="button"
                onClick={addFeature}
                size="sm"
                className="h-10 sm:h-11 bg-blue-600 hover:bg-blue-700 dark:bg-gray-600 dark:hover:bg-gray-500"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
            {formData.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 text-xs sm:text-sm bg-blue-100 dark:bg-gray-700 text-blue-800 dark:text-gray-200 hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {feature}
                    <X
                      className="h-3 w-3 sm:h-4 sm:w-4 cursor-pointer hover:text-blue-600 dark:hover:text-gray-300"
                      onClick={() => removeFeature(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Applications Section */}
          <div className="space-y-4">
            <Label className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">
              Applications
            </Label>
            <div className="flex gap-2">
              <Input
                value={newApplication}
                onChange={(e) => setNewApplication(e.target.value)}
                placeholder="Enter application"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addApplication())
                }
                className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700"
              />
              <Button
                type="button"
                onClick={addApplication}
                size="sm"
                className="h-10 sm:h-11 bg-indigo-600 hover:bg-indigo-700 dark:bg-gray-600 dark:hover:bg-gray-500"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
            {formData.applications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.applications.map((application, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 text-xs sm:text-sm bg-indigo-100 dark:bg-gray-700 text-indigo-800 dark:text-gray-200 hover:bg-indigo-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {application}
                    <X
                      className="h-3 w-3 sm:h-4 sm:w-4 cursor-pointer hover:text-indigo-600 dark:hover:text-gray-300"
                      onClick={() => removeApplication(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Technical Specifications Section */}
          <div className="space-y-4">
            <Label className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">
              Technical Specifications
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              <Input
                value={newSpec.name}
                onChange={(e) =>
                  setNewSpec({ ...newSpec, name: e.target.value })
                }
                placeholder="Specification name"
                className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700"
              />
              <Input
                value={newSpec.value}
                onChange={(e) =>
                  setNewSpec({ ...newSpec, value: e.target.value })
                }
                placeholder="Value"
                className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700"
              />
              <Input
                value={newSpec.unit}
                onChange={(e) =>
                  setNewSpec({ ...newSpec, unit: e.target.value })
                }
                placeholder="Unit"
                className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700"
              />
              <Button
                type="button"
                onClick={addSpecification}
                size="sm"
                className="h-10 sm:h-11 bg-purple-600 hover:bg-purple-700 dark:bg-gray-600 dark:hover:bg-gray-500"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
            {formData.specifications.length > 0 && (
              <div className="space-y-2">
                {formData.specifications.map((spec, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border-2 border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-800 text-sm sm:text-base hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span>
                      <strong className="text-slate-700 dark:text-gray-300">
                        {spec.name}:
                      </strong>{" "}
                      <span className="text-slate-600 dark:text-gray-400">
                        {spec.value} {spec.unit}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      onClick={() => removeSpecification(index)}
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variants Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-600 dark:text-gray-400" />
              <Label className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">
                Product Variants
              </Label>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg border-2 border-purple-200 dark:border-gray-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-purple-700 dark:text-gray-300 font-medium">
                    Variant Name
                  </Label>
                  <Input
                    value={newVariant.name}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, name: e.target.value })
                    }
                    placeholder="e.g., Small, Medium, Large"
                    className="h-9 text-sm border-purple-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-purple-700 dark:text-gray-300 font-medium">
                    Price (KSH)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newVariant.price}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, price: e.target.value })
                    }
                    placeholder="0.00"
                    className="h-9 text-sm border-purple-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div className="flex items-center justify-center space-x-2 pt-6">
                  <Switch
                    id="variant_stock"
                    checked={newVariant.in_stock}
                    onCheckedChange={(checked) =>
                      setNewVariant({ ...newVariant, in_stock: checked })
                    }
                  />
                  <Label
                    htmlFor="variant_stock"
                    className="text-xs text-purple-700 dark:text-gray-300 font-medium"
                  >
                    In Stock
                  </Label>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={addVariant}
                    size="sm"
                    className="h-9 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-gray-600 dark:to-gray-500 dark:hover:from-gray-700 dark:hover:to-gray-600"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {formData.variants.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-slate-600 dark:text-gray-400">
                    {formData.variants.length} Variant
                    {formData.variants.length > 1 ? "s" : ""} Added
                  </span>
                </div>
                <div className="grid gap-3">
                  {formData.variants.map((variant, index) => (
                    <div
                      key={index}
                      className="group relative bg-white dark:bg-gray-800 rounded-lg border-2 border-slate-200 dark:border-gray-700 p-4 hover:border-purple-300 dark:hover:border-gray-500 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-gray-600 dark:to-gray-500 rounded-full flex items-center justify-center">
                              <Tag className="h-4 w-4 text-white dark:text-gray-200" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800 dark:text-gray-200">
                                {variant.name}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-gray-400">
                                KSH {parseFloat(variant.price).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {variant.in_stock ? (
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  In Stock
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                <XCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Out of Stock
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeVariant(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0 p-4 bg-slate-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                id="in_stock"
                checked={formData.in_stock}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, in_stock: checked })
                }
              />
              <Label
                htmlFor="in_stock"
                className="text-sm sm:text-base text-slate-700 dark:text-gray-300"
              >
                In Stock
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, featured: checked })
                }
              />
              <Label
                htmlFor="featured"
                className="text-sm sm:text-base text-slate-700 dark:text-gray-300"
              >
                Featured Product
              </Label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-6 border-t border-slate-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              size="sm"
              className="h-10 sm:h-11 px-6 sm:px-8 border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-10 sm:h-11 px-6 sm:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-gray-600 dark:to-gray-500 dark:hover:from-gray-700 dark:hover:to-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {editingProduct ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductForm;
