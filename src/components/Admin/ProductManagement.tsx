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
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProductSeeder from "./ProductSeeder";

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
    specifications: [] as { name: string; value: string; unit?: string }[]
  });

  const [newFeature, setNewFeature] = useState("");
  const [newApplication, setNewApplication] = useState("");
  const [newSpec, setNewSpec] = useState({ name: "", value: "", unit: "" });

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
      const productData = {
        name: formData.name,
        model_number: formData.model_number,
        category: formData.category as "drip_irrigation" | "sprinkler_systems" | "filtration_systems" | "control_systems" | "accessories",
        subcategory: formData.subcategory,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : null,
        in_stock: formData.in_stock,
        featured: formData.featured,
        images: formData.images,
        features: formData.features,
        applications: formData.applications,
        specifications: formData.specifications.reduce((acc, spec) => {
          if (spec.name && spec.value) {
            acc[spec.name] = spec.unit ? `KSH{spec.value} KSH{spec.unit}` : spec.value;
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
        }, {} as any)
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
      specifications: specs
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
      specifications: []
    });
    setNewFeature("");
    setNewApplication("");
    setNewSpec({ name: "", value: "", unit: "" });
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
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-48 sm:w-64 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-32 sm:w-48 animate-pulse"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-0 bg-card shadow-lg animate-pulse">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                    <div className="h-4 w-4 bg-muted rounded-full"></div>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <div className="h-5 bg-muted rounded w-20"></div>
                    <div className="h-5 bg-muted rounded w-24"></div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-32 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              Product Management
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your irrigation product catalog
            </p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Product Seeder Component */}
        <ProductSeeder />

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="border-0 bg-card shadow-lg">
            <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-xl sm:text-2xl">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {editingProduct ? "Update product information" : "Enter product details below"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="name" className="text-sm sm:text-base font-medium">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                      required
                      className="mt-2 h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model" className="text-sm sm:text-base font-medium">Model Number</Label>
                    <Input
                      id="model"
                      value={formData.model_number}
                      onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                      placeholder="Enter model number"
                      className="mt-2 h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="category" className="text-sm sm:text-base font-medium">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className="mt-2 h-10 sm:h-11 text-sm sm:text-base">
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
                    <Label htmlFor="subcategory" className="text-sm sm:text-base font-medium">Subcategory</Label>
                    <Input
                      id="subcategory"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      placeholder="Enter subcategory"
                      className="mt-2 h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm sm:text-base font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={3}
                    className="mt-2 text-sm sm:text-base resize-none"
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="text-sm sm:text-base font-medium">Price (KSH)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Enter price"
                    className="mt-2 h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-4">
                <Label>Product Images</Label>
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
                      <div>
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
                          alt={`Product image KSH{index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  <Label className="text-sm sm:text-base font-medium">Features</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Enter feature"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      className="h-10 sm:h-11 text-sm sm:text-base"
                    />
                    <Button type="button" onClick={addFeature} size="sm" className="h-10 sm:h-11">
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                  {formData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm">
                          {feature}
                          <X 
                            className="h-3 w-3 sm:h-4 sm:w-4 cursor-pointer" 
                            onClick={() => removeFeature(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-sm sm:text-base font-medium">Applications</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newApplication}
                      onChange={(e) => setNewApplication(e.target.value)}
                      placeholder="Enter application"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addApplication())}
                      className="h-10 sm:h-11 text-sm sm:text-base"
                    />
                    <Button type="button" onClick={addApplication} size="sm" className="h-10 sm:h-11">
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                  {formData.applications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.applications.map((application, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm">
                          {application}
                          <X 
                            className="h-3 w-3 sm:h-4 sm:w-4 cursor-pointer" 
                            onClick={() => removeApplication(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-sm sm:text-base font-medium">Technical Specifications</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                    <Input
                      value={newSpec.name}
                      onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })}
                      placeholder="Specification name (e.g., Flow Rate)"
                      className="h-10 sm:h-11 text-sm sm:text-base"
                    />
                    <Input
                      value={newSpec.value}
                      onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
                      placeholder="Value (e.g., 2-4)"
                      className="h-10 sm:h-11 text-sm sm:text-base"
                    />
                    <Input
                      value={newSpec.unit}
                      onChange={(e) => setNewSpec({ ...newSpec, unit: e.target.value })}
                      placeholder="Unit (e.g., L/h)"
                      className="h-10 sm:h-11 text-sm sm:text-base"
                    />
                    <Button type="button" onClick={addSpecification} size="sm" className="h-10 sm:h-11">
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                  {formData.specifications.length > 0 && (
                    <div className="space-y-2">
                      {formData.specifications.map((spec, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded text-sm sm:text-base">
                          <span>
                            <strong>{spec.name}:</strong> {spec.value} {spec.unit}
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

                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="in_stock"
                      checked={formData.in_stock}
                      onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                    />
                    <Label htmlFor="in_stock" className="text-sm sm:text-base">In Stock</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                    />
                    <Label htmlFor="featured" className="text-sm sm:text-base">Featured Product</Label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
                  <Button type="button" variant="outline" onClick={resetForm} size="sm" className="h-10 sm:h-11 px-6 sm:px-8">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-10 sm:h-11 px-6 sm:px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300">
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base w-full sm:w-[200px]">
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
          {currentProducts.map((product, index) => (
            <Card 
              key={product.id} 
              className="hover:shadow-xl transition-all duration-300 border-0 bg-card shadow-lg"
              style={{ animationDelay: `KSH{index * 100}ms` }}
            >
              <CardHeader className="p-4 sm:p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg lg:text-xl line-clamp-2">{product.name}</CardTitle>
                    {product.model_number && (
                      <CardDescription className="text-xs sm:text-sm">Model: {product.model_number}</CardDescription>
                    )}
                  </div>
                  {product.featured && (
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {categories.find(c => c.value === product.category)?.label}
                  </Badge>
                  <Badge 
                    variant={product.in_stock ? "default" : "destructive"}
                    className="text-xs sm:text-sm"
                  >
                    {product.in_stock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {product.images && product.images.length > 0 && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3 sm:mb-4">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-3">
                  {product.description || "No description available"}
                </p>
                
                {product.price && (
                  <p className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">KSH{product.price}</p>
                )}

                <div className="flex justify-end gap-1 sm:gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
          <Card className="border-0 bg-card shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <Package className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
              </div>
              <h3 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-3">
                {searchTerm || selectedCategory !== "all" ? "No products found" : "No products yet"}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 sm:mb-6 max-w-md leading-relaxed">
                {searchTerm || selectedCategory !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "Get started by adding your first product"}
              </p>
              {!searchTerm && selectedCategory === "all" && (
                <Button 
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  className="h-10 sm:h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
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