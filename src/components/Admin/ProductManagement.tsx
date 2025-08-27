import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  Upload,
  X,
  Star,
  ArrowLeft,
  ArrowRight,
  Layers,
  CheckCircle2,
  XCircle,
  Tag,
  Palette
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProductSeeder from "./ProductSeeder";

interface Variant {
  name: string;
  price: number;
  in_stock: boolean;
}

interface Product {
  id: string;
  name: string;
  model_number: string;
  category: string;
  subcategory: string;
  description: string;
  technical_specs: any;
  price: number;
  images: string[];
  in_stock: boolean;
  featured: boolean;
  created_at: string;
  variants?: Variant[];
}

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

  const [formData, setFormData] = useState({
    name: "",
    model_number: "",
    category: "drip_irrigation",
    subcategory: "",
    description: "",
    price: "",
    in_stock: true,
    featured: false,
    images: [] as string[],
    features: [] as string[],
    applications: [] as string[],
    specifications: [] as { name: string; value: string; unit?: string }[],
    variants: [] as { name: string; price: string; in_stock: boolean }[]
  });

  const [newFeature, setNewFeature] = useState("");
  const [newApplication, setNewApplication] = useState("");
  const [newSpec, setNewSpec] = useState({ name: "", value: "", unit: "" });
  const [newVariant, setNewVariant] = useState({ name: "", price: "", in_stock: true });

  const categories = [
    { value: "drip_irrigation", label: "Drip Irrigation" },
    { value: "sprinkler_systems", label: "Sprinkler Systems" },
    { value: "filtration_systems", label: "Filtration Systems" },
    { value: "control_systems", label: "Control Systems" },
    { value: "accessories", label: "Accessories" }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  console.log('=== IMAGE UPLOAD DEBUG START ===');
  setUploading(true);
  const uploadedUrls: string[] = [];

  try {
    // 1. Check authentication status
    console.log('1. Checking authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User data:', user);
    console.log('User error:', userError);
    
    if (userError) {
      console.error('Authentication error:', userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    if (!user) {
      console.error('No user found');
      throw new Error('You must be logged in to upload images');
    }

    console.log('✓ User authenticated:', user.id);

    // 2. Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session data:', session);
    console.log('Session error:', sessionError);

    // 3. Test bucket access first
    console.log('2. Testing bucket access...');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      console.log('Available buckets:', buckets);
      console.log('Buckets error:', bucketsError);
    } catch (bucketError) {
      console.error('Bucket access error:', bucketError);
    }

    // 4. Try to list files in the images bucket
    console.log('3. Testing images bucket access...');
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('images')
        .list('products', { limit: 1 });
      console.log('Bucket list result:', files);
      console.log('Bucket list error:', listError);
    } catch (listError) {
      console.error('Bucket list error:', listError);
    }

    // 5. Process file upload
    for (const file of Array.from(files)) {
      console.log('4. Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;
      
      console.log('Upload path:', filePath);

      // Try the upload
      console.log('5. Attempting upload...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      console.log('Upload response data:', uploadData);
      console.log('Upload response error:', uploadError);

      if (uploadError) {
        console.error('Upload failed:', uploadError);
        console.error('Full error object:', JSON.stringify(uploadError, null, 2));
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('✓ Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', urlData.publicUrl);
      uploadedUrls.push(urlData.publicUrl);
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls]
    }));

    console.log('✓ All uploads successful');
    toast({
      title: "Success",
      description: `${uploadedUrls.length} image(s) uploaded successfully`
    });

  } catch (error) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    console.error('Error stack:', error.stack);
    
    toast({
      title: "Upload Error",
      description: error.message || "Failed to upload images",
      variant: "destructive"
    });
  } finally {
    console.log('=== IMAGE UPLOAD DEBUG END ===');
    setUploading(false);
  }
};

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let priceToSave = formData.price ? parseFloat(formData.price) : null;
      const variantsToSave = formData.variants.map(v => ({
        name: v.name,
        price: parseFloat(v.price),
        in_stock: v.in_stock
      }));
      let inStockToSave = formData.in_stock;

      if (variantsToSave.length > 0) {
        const variantPrices = variantsToSave.map(v => v.price);
        priceToSave = Math.min(...variantPrices);
        inStockToSave = variantsToSave.some(v => v.in_stock);
      }

      const productData = {
        name: formData.name,
        model_number: formData.model_number,
        category: formData.category as "drip_irrigation" | "sprinkler_systems" | "filtration_systems" | "control_systems" | "accessories",
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
            acc[spec.name] = spec.unit ? `${spec.value} ${spec.unit}` : spec.value;
          }
          return acc;
        }, {} as any),
        technical_specs: formData.specifications.reduce((acc, spec) => {
          if (spec.name && spec.value) {
            acc[spec.name] = {
              value: spec.value,
              unit: spec.unit || ""
            };
          }
          return acc;
        }, {} as any),
        variants: variantsToSave.length > 0 ? variantsToSave : null
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Product updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Product added successfully"
        });
      }

      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully"
      });
      
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const specs = product.technical_specs ? Object.entries(product.technical_specs).map(([name, spec]: [string, any]) => ({
      name,
      value: spec.value || spec,
      unit: spec.unit || ""
    })) : [];
    
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
      variants: product.variants?.map(v => ({ name: v.name, price: v.price.toString(), in_stock: v.in_stock })) || []
    });
    setShowAddForm(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addApplication = () => {
    if (newApplication.trim()) {
      setFormData(prev => ({
        ...prev,
        applications: [...prev.applications, newApplication.trim()]
      }));
      setNewApplication("");
    }
  };

  const removeApplication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      applications: prev.applications.filter((_, i) => i !== index)
    }));
  };

  const addSpecification = () => {
    if (newSpec.name.trim() && newSpec.value.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: [...prev.specifications, { ...newSpec }]
      }));
      setNewSpec({ name: "", value: "", unit: "" });
    }
  };

  const removeSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const addVariant = () => {
    if (newVariant.name.trim() && newVariant.price.trim()) {
      setFormData(prev => ({
        ...prev,
        variants: [...prev.variants, { ...newVariant }]
      }));
      setNewVariant({ name: "", price: "", in_stock: true });
    }
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
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
      variants: []
    });
    setNewFeature("");
    setNewApplication("");
    setNewSpec({ name: "", value: "", unit: "" });
    setNewVariant({ name: "", price: "", in_stock: true });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.model_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination Logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const MobilePagination = () => (
    <div className="flex flex-col items-center gap-4 mt-6">
      <div className="text-sm text-muted-foreground text-center">
        Showing {indexOfFirstProduct + 1} to {Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={currentPage === 1}
          className="disabled:opacity-50 h-8"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="hidden xs:inline">Previous</span>
        </Button>
        
        <div className="flex items-center gap-1 max-w-xs overflow-x-auto">
          {totalPages > 1 && (
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => paginate(1)}
              className="w-8 h-8 flex-shrink-0"
            >
              1
            </Button>
          )}
          
          {currentPage > 3 && totalPages > 5 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
          
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => {
              if (totalPages <= 5) return page > 1 && page < totalPages;
              return page > 1 && page < totalPages && Math.abs(page - currentPage) <= 1;
            })
            .map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => paginate(page)}
                className="w-8 h-8 flex-shrink-0"
              >
                {page}
              </Button>
            ))}
          
          {currentPage < totalPages - 2 && totalPages > 5 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
          
          {totalPages > 1 && (
            <Button
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => paginate(totalPages)}
              className="w-8 h-8 flex-shrink-0"
            >
              {totalPages}
            </Button>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="disabled:opacity-50 h-8"
        >
          <span className="hidden xs:inline">Next</span>
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );

  const DesktopPagination = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        Showing {indexOfFirstProduct + 1} to {Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={currentPage === 1}
          className="disabled:opacity-50 h-9"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNumber;
            if (totalPages <= 7) {
              pageNumber = i + 1;
            } else if (currentPage <= 4) {
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 3) {
              pageNumber = totalPages - 6 + i;
            } else {
              pageNumber = currentPage - 3 + i;
            }
            
            return (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => paginate(pageNumber)}
                className="w-9 h-9"
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="disabled:opacity-50 h-9"
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

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
              <Card key={i} className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl animate-pulse">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded w-3/4"></div>
                      <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 w-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded-full"></div>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded w-20"></div>
                    <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded w-24"></div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-32 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded mb-4"></div>
                  <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded w-3/4 mb-4"></div>
                  <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4 sm:p-6">
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
          <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-2xl">
            <CardHeader className="p-4 sm:p-6 rounded-t-lg">
              <CardTitle className="text-xl sm:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-400 dark:to-gray-200">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-slate-600 dark:text-gray-400">
                {editingProduct ? "Update product information" : "Enter product details below"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="name" className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                      required
                      className="mt-2 h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model" className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">Model Number</Label>
                    <Input
                      id="model"
                      value={formData.model_number}
                      onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                      placeholder="Enter model number"
                      className="mt-2 h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="category" className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className="mt-2 h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400">
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
                    <Label htmlFor="subcategory" className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">Subcategory</Label>
                    <Input
                      id="subcategory"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      placeholder="Enter subcategory"
                      className="mt-2 h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={3}
                    className="mt-2 text-sm sm:text-base resize-none border-slate-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">Price (KSH)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Enter price"
                    className="mt-2 h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400"
                  />
                </div>

                <div className="space-y-4">
                <Label className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">Product Images</Label>
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
                    <Button type="button" variant="outline" disabled={uploading} asChild>
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

                <div className="space-y-4">
                  <Label className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">Features</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Enter feature"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400"
                    />
                    <Button type="button" onClick={addFeature} size="sm" className="h-10 sm:h-11 bg-blue-600 hover:bg-blue-700 dark:bg-gray-600 dark:hover:bg-gray-500">
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                  {formData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm bg-blue-100 dark:bg-gray-700 text-blue-800 dark:text-gray-200 hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors">
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

                <div className="space-y-4">
                  <Label className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">Applications</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newApplication}
                      onChange={(e) => setNewApplication(e.target.value)}
                      placeholder="Enter application"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addApplication())}
                      className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400"
                    />
                    <Button type="button" onClick={addApplication} size="sm" className="h-10 sm:h-11 bg-indigo-600 hover:bg-indigo-700 dark:bg-gray-600 dark:hover:bg-gray-500">
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                  {formData.applications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.applications.map((application, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm bg-indigo-100 dark:bg-gray-700 text-indigo-800 dark:text-gray-200 hover:bg-indigo-200 dark:hover:bg-gray-600 transition-colors">
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

                <div className="space-y-4">
                  <Label className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">Technical Specifications</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                    <Input
                      value={newSpec.name}
                      onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })}
                      placeholder="Specification name (e.g., Flow Rate)"
                      className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400"
                    />
                    <Input
                      value={newSpec.value}
                      onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
                      placeholder="Value (e.g., 2-4)"
                      className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400"
                    />
                    <Input
                      value={newSpec.unit}
                      onChange={(e) => setNewSpec({ ...newSpec, unit: e.target.value })}
                      placeholder="Unit (e.g., L/h)"
                      className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400"
                    />
                    <Button type="button" onClick={addSpecification} size="sm" className="h-10 sm:h-11 bg-purple-600 hover:bg-purple-700 dark:bg-gray-600 dark:hover:bg-gray-500">
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                  {formData.specifications.length > 0 && (
                    <div className="space-y-2">
                      {formData.specifications.map((spec, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border-2 border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-800 text-sm sm:text-base hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors">
                          <span>
                            <strong className="text-slate-700 dark:text-gray-300">{spec.name}:</strong> <span className="text-slate-600 dark:text-gray-400">{spec.value} {spec.unit}</span>
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

                {/* Enhanced Variants Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-purple-600 dark:text-gray-400" />
                    <Label className="text-sm sm:text-base font-medium text-slate-700 dark:text-gray-300">Product Variants</Label>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg border-2 border-purple-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-purple-700 dark:text-gray-300 font-medium">Variant Name</Label>
                        <Input
                          value={newVariant.name}
                          onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                          placeholder="e.g., Small, Medium, Large"
                          className="h-9 text-sm border-purple-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 dark:focus:border-gray-400 dark:focus:ring-gray-400 bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-purple-700 dark:text-gray-300 font-medium">Price (KSH)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newVariant.price}
                          onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                          placeholder="0.00"
                          className="h-9 text-sm border-purple-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 dark:focus:border-gray-400 dark:focus:ring-gray-400 bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div className="flex items-center justify-center space-x-2 pt-6">
                        <Switch
                          id="variant_stock"
                          checked={newVariant.in_stock}
                          onCheckedChange={(checked) => setNewVariant({ ...newVariant, in_stock: checked })}
                        />
                        <Label htmlFor="variant_stock" className="text-xs text-purple-700 dark:text-gray-300 font-medium">In Stock</Label>
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
                          {formData.variants.length} Variant{formData.variants.length > 1 ? 's' : ''} Added
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
                                    <h4 className="font-semibold text-slate-800 dark:text-gray-200">{variant.name}</h4>
                                    <p className="text-sm text-slate-600 dark:text-gray-400">KSH {parseFloat(variant.price).toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {variant.in_stock ? (
                                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                      <CheckCircle2 className="h-4 w-4" />
                                      <span className="text-sm font-medium">In Stock</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                      <XCircle className="h-4 w-4" />
                                      <span className="text-sm font-medium">Out of Stock</span>
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
                      onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                    />
                    <Label htmlFor="in_stock" className="text-sm sm:text-base text-slate-700 dark:text-gray-300">In Stock</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                    />
                    <Label htmlFor="featured" className="text-sm sm:text-base text-slate-700 dark:text-gray-300">Featured Product</Label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-6 border-t border-slate-200 dark:border-gray-700">
                  <Button type="button" variant="outline" onClick={resetForm} size="sm" className="h-10 sm:h-11 px-6 sm:px-8 border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-800">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-10 sm:h-11 px-6 sm:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-gray-600 dark:to-gray-500 dark:hover:from-gray-700 dark:hover:to-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    {editingProduct ? "Update Product" : "Add Product"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500 h-4 w-4 sm:h-5 sm:w-5" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 sm:h-11 text-sm sm:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-slate-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Search className="h-4 w-4 text-slate-400 dark:text-gray-500" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base w-full sm:w-[200px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-slate-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-gray-400 dark:focus:ring-gray-400 shadow-sm">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {currentProducts.map((product, index) => {
            let displayPrice = '';
            if (product.variants?.length > 0) {
              const prices = product.variants.map(v => v.price);
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              displayPrice = min === max ? `KSH ${min.toLocaleString()}` : `KSH ${min.toLocaleString()} - ${max.toLocaleString()}`;
            } else if (product.price) {
              displayPrice = `KSH ${product.price.toLocaleString()}`;
            }

            return (
              <Card 
                key={product.id} 
                className="hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg group transform hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-base sm:text-lg lg:text-xl line-clamp-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-gray-200 dark:to-gray-400">
                        {product.name}
                      </CardTitle>
                      {product.model_number && (
                        <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                          Model: {product.model_number}
                        </CardDescription>
                      )}
                    </div>
                    {product.featured && (
                      <div className="relative">
                        <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 dark:text-yellow-400 fill-current animate-pulse" />
                        <div className="absolute -inset-1 bg-yellow-400 dark:bg-yellow-800 rounded-full opacity-20 animate-ping"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs sm:text-sm bg-blue-100 dark:bg-gray-700 text-blue-800 dark:text-gray-200 hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors">
                      {categories.find(c => c.value === product.category)?.label}
                    </Badge>
                    <Badge 
                      variant={product.in_stock ? "default" : "destructive"}
                      className={`text-xs sm:text-sm ${
                        product.in_stock 
                          ? 'bg-green-100 dark:bg-gray-700 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-gray-600' 
                          : 'bg-red-100 dark:bg-gray-700 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-gray-600'
                      } transition-colors`}
                    >
                      {product.in_stock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {product.images && product.images.length > 0 && (
                    <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-700 rounded-xl overflow-hidden mb-3 sm:mb-4 shadow-inner">
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-3">
                    {product.description || "No description available"}
                  </p>
                  
                  {displayPrice && (
                    <div className="mb-3 sm:mb-4">
                      <p className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
                        {displayPrice}
                      </p>
                    </div>
                  )}

                  {/* Enhanced Variants Display */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="h-3 w-3 text-slate-500 dark:text-gray-400" />
                        <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                          {product.variants.length} Variant{product.variants.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {product.variants.slice(0, 3).map((variant, vIndex) => (
                          <div 
                            key={vIndex}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                              variant.in_stock 
                                ? 'bg-emerald-100 dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-gray-600' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            <Tag className="h-2 w-2" />
                            <span>{variant.name}</span>
                            <span className="text-xs opacity-75">
                              KSH {variant.price.toLocaleString()}
                            </span>
                          </div>
                        ))}
                        {product.variants.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.variants.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-1 sm:gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 border-blue-300 dark:border-gray-600 text-blue-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-800 hover:border-blue-500 dark:hover:border-gray-500 transition-colors"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 border-red-300 dark:border-gray-600 text-red-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-gray-800 hover:border-red-500 dark:hover:border-gray-500 transition-colors"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {currentProducts.length > 0 && (
          <div>
            <div className="block sm:hidden">
              <MobilePagination />
            </div>
            <div className="hidden sm:block">
              <DesktopPagination />
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
                <Package className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 dark:text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-gray-200 dark:to-gray-400">
                {searchTerm || selectedCategory !== "all" ? "No products found" : "No products yet"}
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;