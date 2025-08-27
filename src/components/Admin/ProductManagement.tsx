import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit2, Trash2, Package, Upload, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product, Variant } from '@/types/Product';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Product) => void;
  editingProduct: Product | null;
}

const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose, onSubmit, editingProduct }) => {
  const [name, setName] = useState(editingProduct?.name || '');
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [category, setCategory] = useState<Product['category']>(editingProduct?.category || 'drip_irrigation');
  const [subcategory, setSubcategory] = useState(editingProduct?.subcategory || '');
  const [modelNumber, setModelNumber] = useState(editingProduct?.model_number || '');
  const [price, setPrice] = useState(editingProduct?.price || 0);
  const [images, setImages] = useState(editingProduct?.images || []);
  const [features, setFeatures] = useState(editingProduct?.features || []);
  const [applications, setApplications] = useState(editingProduct?.applications || []);
  const [inStock, setInStock] = useState(editingProduct?.in_stock || true);
  const [featured, setFeatured] = useState(editingProduct?.featured || false);
  const [brochureUrl, setBrochureUrl] = useState(editingProduct?.brochure_url || '');
  const [installationGuideUrl, setInstallationGuideUrl] = useState(editingProduct?.installation_guide_url || '');
  const [maintenanceManualUrl, setMaintenanceManualUrl] = useState(editingProduct?.maintenance_manual_url || '');
  const [videoUrl, setVideoUrl] = useState(editingProduct?.video_url || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const product: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name,
      description,
      category,
      subcategory,
      model_number: modelNumber,
      price,
      images,
      features,
      applications,
      specifications: {},
      technical_specs: {},
      variants: [],
      in_stock: inStock,
      featured,
      brochure_url: brochureUrl,
      installation_guide_url: installationGuideUrl,
      maintenance_manual_url: maintenanceManualUrl,
      video_url: videoUrl,
      created_at: editingProduct?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSubmit(product);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <Card className="max-w-2xl w-full p-6 space-y-4">
        <CardHeader>
          <CardTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as Product['category'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drip_irrigation">Drip Irrigation</SelectItem>
                  <SelectItem value="sprinkler_systems">Sprinkler Systems</SelectItem>
                  <SelectItem value="filtration_systems">Filtration Systems</SelectItem>
                  <SelectItem value="control_systems">Control Systems</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="modelNumber">Model Number</Label>
              <Input
                id="modelNumber"
                type="text"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="price">Price (KES)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="inStock">In Stock</Label>
              <Switch id="inStock" checked={inStock} onCheckedChange={setInStock} />
            </div>
            <div>
              <Label htmlFor="featured">Featured</Label>
              <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
            </div>
            <div>
              <Label htmlFor="brochureUrl">Brochure URL</Label>
              <Input
                id="brochureUrl"
                type="url"
                value={brochureUrl}
                onChange={(e) => setBrochureUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="installationGuideUrl">Installation Guide URL</Label>
              <Input
                id="installationGuideUrl"
                type="url"
                value={installationGuideUrl}
                onChange={(e) => setInstallationGuideUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maintenanceManualUrl">Maintenance Manual URL</Label>
              <Input
                id="maintenanceManualUrl"
                type="url"
                value={maintenanceManualUrl}
                onChange={(e) => setMaintenanceManualUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{editingProduct ? 'Update Product' : 'Add Product'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our Product interface
      const transformedProducts: Product[] = (data || []).map(item => ({
        ...item,
        variants: Array.isArray(item.variants) ? item.variants as Variant[] : []
      }));

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (product: Product) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select();

      if (error) throw error;

      setProducts([...products, product]);
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', product.id)
        .select();

      if (error) throw error;

      setProducts(products.map(p => (p.id === product.id ? product : p)));
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(product => product.id !== productId));
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Product Management</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <Badge variant={product.featured ? "default" : "secondary"}>
                    {product.category}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingProduct(product);
                      setIsModalOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {product.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">
                  {product.price ? `KES ${product.price.toLocaleString()}` : 'Contact for Price'}
                </span>
                <Badge variant={product.in_stock ? "default" : "destructive"}>
                  {product.in_stock ? 'In Stock' : 'Out of Stock'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProductForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={(product) => {
          if (editingProduct) {
            handleUpdateProduct(product);
          } else {
            handleAddProduct(product);
          }
          setEditingProduct(null);
        }}
        editingProduct={editingProduct}
      />
    </div>
  );
};

export default ProductManagement;
