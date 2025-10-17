import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProductSeeder from "./ProductSeeder";
import ProductForm from "./Product/ProductForm";
import ProductList from "./Product/ProductList";
import ProductSearch from "./Product/ProductSearch";
import ProductPagination from "./Product/ProductPagination";
import { Product, ProductFormData, PRODUCT_CATEGORIES } from "@/types/Product";

const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(9);

  const [formData, setFormData] = useState<ProductFormData>({
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
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`);
      }

      if (!user) {
        throw new Error("You must be logged in to upload images");
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

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

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
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let priceToSave = formData.price ? parseFloat(formData.price) : null;
      const variantsToSave = formData.variants.map((v) => ({
        name: v.name,
        price: parseFloat(v.price),
        in_stock: v.in_stock,
      }));
      let inStockToSave = formData.in_stock;

      if (variantsToSave.length > 0) {
        const variantPrices = variantsToSave.map((v) => v.price);
        priceToSave = Math.min(...variantPrices);
        inStockToSave = variantsToSave.some((v) => v.in_stock);
      }

      const productData = {
        name: formData.name,
        model_number: formData.model_number,
        category: formData.category as Product["category"],
        subcategory: formData.subcategory,
        description: formData.description,
        price: priceToSave,
        in_stock: inStockToSave,
        featured: formData.featured,
        images: formData.images,
        features: formData.features,
        applications: formData.applications,
        specifications: formData.specifications.reduce((acc, spec) => {
          if (spec.name && spec.value) {
            acc[spec.name] = spec.unit
              ? `${spec.value} ${spec.unit}`
              : spec.value;
          }
          return acc;
        }, {} as any),
        technical_specs: formData.specifications.reduce((acc, spec) => {
          if (spec.name && spec.value) {
            acc[spec.name] = {
              value: spec.value,
              unit: spec.unit || "",
            };
          }
          return acc;
        }, {} as any),
        variants: variantsToSave.length > 0 ? variantsToSave : null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        const { error } = await supabase.from("products").insert([productData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Product added successfully",
        });
      }

      resetForm();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const specs = product.technical_specs
      ? Object.entries(product.technical_specs).map(
          ([name, spec]: [string, any]) => ({
            name,
            value: spec.value || spec,
            unit: spec.unit || "",
          }),
        )
      : [];

    setFormData({
      name: product.name,
      model_number: product.model_number || "",
      category: product.category,
      subcategory: product.subcategory || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      in_stock: product.in_stock,
      featured: product.featured,
      images: product.images || [],
      features: (product as any).features || [],
      applications: (product as any).applications || [],
      specifications: specs,
      variants:
        product.variants?.map((v) => ({
          name: v.name,
          price: v.price.toString(),
          in_stock: v.in_stock,
        })) || [],
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
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
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-48 sm:w-64 animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-32 sm:w-48 animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl animate-pulse rounded-lg p-6"
              >
                <div className="space-y-4">
                  <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded w-3/4"></div>
                  <div className="h-32 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded"></div>
                  <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded w-full"></div>
                  <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-400 dark:to-gray-200">
              Product Management
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400">
              Manage your irrigation product catalog with style
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-gray-600 dark:to-gray-500 dark:hover:from-gray-700 dark:hover:to-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Product Seeder Component */}
        <ProductSeeder />

        {/* Add/Edit Form */}
        {showAddForm && (
          <ProductForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeImage}
            editingProduct={editingProduct}
            uploading={uploading}
          />
        )}

        {/* Search and Filter */}
        <ProductSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={PRODUCT_CATEGORIES}
        />

        {/* Product List */}
        <ProductList
          products={filteredProducts}
          categories={PRODUCT_CATEGORIES}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentPage={currentPage}
          productsPerPage={productsPerPage}
        />

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <ProductPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            itemsPerPage={productsPerPage}
            onPageChange={paginate}
            onNextPage={nextPage}
            onPrevPage={prevPage}
          />
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl rounded-lg">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 dark:text-gray-400"
              >
                <path d="M16.888 3.469a9.542 9.542 0 0 0-1.414-.777a1.704 1.704 0 0 0-1.717.121L12 5.834 9.303 2.813a1.704 1.704 0 0 0-1.717-.121 9.542 9.542 0 0 0-1.414.777C4.423 6.535 2 12.053 2 17.5s2.423 11 5.772 14.531c.526.474 1.227.79 1.984.922.653.113 1.363.178 2.052.178.689 0 1.399-.065 2.052-.178.757-.132 1.458-.448 1.984-.922C17.577 28.5 20 23.978 20 17.5s-2.423-11-5.772-14.531Z" />
                <path d="M12 11.5v6.5M15 14.5h-6" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-gray-200 dark:to-gray-400">
              {searchTerm || selectedCategory !== "all"
                ? "No products found"
                : "No products yet"}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400 text-center mb-4 sm:mb-6 max-w-md leading-relaxed">
              {searchTerm || selectedCategory !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by adding your first product"}
            </p>
            {!searchTerm && selectedCategory === "all" && (
              <Button
                onClick={() => setShowAddForm(true)}
                size="sm"
                className="h-10 sm:h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-gray-600 dark:to-gray-500 dark:hover:from-gray-700 dark:hover:to-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Add Your First Product
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
