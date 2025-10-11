import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Package, 
  FileText, 
  Settings,
  Users,
  AlertCircle,
  CheckCircle,
  Star,
  Eye,
  Loader2,
  Upload,
  X,
  Image as ImageIcon
} from "lucide-react";

// Updated IrrigationKit interface to match database schema
interface IrrigationKit {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  coverage_area?: number | null;
  target_crop?: string | null;
  components?: ComponentsData | null;
  price?: number | null;
  in_stock?: boolean | null;
  featured?: boolean | null;
  maintenance_level?: 'low' | 'medium' | 'high' | null;
  created_at?: string | null;
  updated_at?: string | null;
  active?: boolean | null;
  images?: string[] | null;
  installation_complexity?: string | null;
  installation_time_hours?: number | null;
  kit_type?: string | null;
  recommended_crops?: string[] | null;
  warranty_months?: number | null;
  water_efficiency_percentage?: number | null;
}

interface KitDocument {
  id: string;
  kit_id?: string | null;
  document_type: string;
  title: string;
  file_url: string;
  file_type?: string | null;
  file_size?: number | null;
  description?: string | null;
  version?: string | null;
  language?: string | null;
  requires_login?: boolean | null;
  download_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface CustomerInstallation {
  id: string;
  customer_id?: string | null;
  kit_id?: string | null;
  installation_date?: string | null;
  installation_status?: string | null;
  site_location?: string | null;
  site_area?: number | null;
  satisfaction_rating?: number | null;
  customer_name?: string;
  kit_name?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ComponentsData {
  main_components?: string[];
  pricing_tiers?: Array<{ name: string; price: number; description: string }>;
  included_services?: string[];
}

const IrrigationKitsManagement = () => {
  const [activeTab, setActiveTab] = useState('kits');
  const [showForm, setShowForm] = useState(false);
  const [selectedKit, setSelectedKit] = useState<IrrigationKit | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Data states
  const [kits, setKits] = useState<IrrigationKit[]>([]);
  const [documents, setDocuments] = useState<KitDocument[]>([]);
  const [installations, setInstallations] = useState<CustomerInstallation[]>([]);

  // Form state
  const [formData, setFormData] = useState<Partial<IrrigationKit>>({
    name: '',
    description: '',
    category: 'general',
    coverage_area: 0,
    target_crop: '',
    price: 0,
    components: {
      main_components: [],
      pricing_tiers: [],
      included_services: []
    },
    in_stock: true,
    featured: false,
    maintenance_level: 'low',
    installation_complexity: 'medium',
    installation_time_hours: 4,
    water_efficiency_percentage: 70,
    warranty_months: 12,
    active: true,
    images: [],
    kit_type: '',
    recommended_crops: []
  });

  // Component management states
  const [newComponent, setNewComponent] = useState('');
  const [newPricingTier, setNewPricingTier] = useState({ name: '', price: 0, description: '' });
  const [newService, setNewService] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Load data from Supabase with pagination
  useEffect(() => {
    loadData(page);
  }, [page]);

  const loadData = async (currentPage: number) => {
    setDataLoading(true);
    setError(null);
    
    try {
      // Load irrigation kits with pagination
      const { data: kitsData, error: kitsError } = await supabase
        .from('irrigation_kits')
        .select('*')
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)
        .order('created_at', { ascending: false });

      if (kitsError) {
        console.error('Error loading kits:', kitsError);
        throw new Error(`Failed to load kits: ${kitsError.message}`);
      }

      setKits(
        (kitsData || []).map((kit: any) => ({
          ...kit,
          components:
            typeof kit.components === "string"
              ? JSON.parse(kit.components)
              : kit.components || { main_components: [], pricing_tiers: [], included_services: [] },
        }))
      );

      // Load kit documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('kit_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (documentsError) {
        console.error('Error loading documents:', documentsError);
        setDocuments([]);
      } else {
        setDocuments(documentsData || []);
      }

      // Load installations
      const { data: installationsData, error: installationsError } = await supabase
        .from('customer_kit_installations')
        .select('*')
        .order('created_at', { ascending: false });

      if (installationsError) {
        console.error('Error loading installations:', installationsError);
        setInstallations([]);
      } else {
        const transformedInstallations = installationsData?.map(installation => ({
          ...installation,
          customer_name: `Customer ${installation.customer_id?.slice(0, 8) || 'Unknown'}`,
          kit_name: `Kit ${installation.kit_id?.slice(0, 8) || 'Unknown'}`
        })) || [];

        setInstallations(transformedInstallations);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSaveKit = async () => {
    // Enhanced form validation
    if (!formData.name?.trim()) {
      setError('Kit name is required');
      return;
    }
    if (!formData.kit_type) {
      setError('Kit type is required');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setError('Valid price is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const kitData = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category || 'general',
        coverage_area: formData.coverage_area || null,
        target_crop: formData.target_crop || null,
        price: formData.price || null,
        components: formData.components ? JSON.stringify(formData.components) : null,
        in_stock: formData.in_stock !== false,
        featured: formData.featured || false,
        maintenance_level: formData.maintenance_level || 'low',
        active: formData.active !== false,
        images: formData.images || null,
        installation_complexity: formData.installation_complexity || null,
        installation_time_hours: formData.installation_time_hours || null,
        kit_type: formData.kit_type || null,
        recommended_crops: formData.recommended_crops || null,
        warranty_months: formData.warranty_months || null,
        water_efficiency_percentage: formData.water_efficiency_percentage || null,
      };

      if (selectedKit) {
        const { error } = await supabase
          .from('irrigation_kits')
          .update(kitData)
          .eq('id', selectedKit.id);

        if (error) throw new Error(`Failed to update kit: ${error.message}`);
      } else {
        const { error } = await supabase
          .from('irrigation_kits')
          .insert([kitData]);

        if (error) throw new Error(`Failed to create kit: ${error.message}`);
      }

      await loadData(page);
      
      setShowForm(false);
      setSelectedKit(null);
      resetForm();
      alert(selectedKit ? 'Kit updated successfully!' : 'Kit created successfully!');

    } catch (err) {
      console.error('Error saving kit:', err);
      setError(err instanceof Error ? err.message : 'Failed to save kit');
    } finally {
      setLoading(false);
    }
  };

  const handleEditKit = (kit: IrrigationKit) => {
    setSelectedKit(kit);
    setFormData({
      ...kit,
      components: kit.components || { main_components: [], pricing_tiers: [], included_services: [] }
    });
    setShowForm(true);
  };

  const handleDeleteKit = async (kitId: string) => {
    if (!confirm('Are you sure you want to delete this kit?')) return;

    try {
      const { error } = await supabase
        .from('irrigation_kits')
        .delete()
        .eq('id', kitId);

      if (error) throw new Error(`Failed to delete kit: ${error.message}`);

      await loadData(page);
      alert('Kit deleted successfully!');
    } catch (err) {
      console.error('Error deleting kit:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete kit');
    }
  };

  const handleNewKit = () => {
    setSelectedKit(null);
    resetForm();
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'general',
      coverage_area: 0,
      target_crop: '',
      price: 0,
      components: {
        main_components: [],
        pricing_tiers: [],
        included_services: []
      },
      in_stock: true,
      featured: false,
      maintenance_level: 'low',
      installation_complexity: 'medium',
      installation_time_hours: 4,
      water_efficiency_percentage: 70,
      warranty_months: 12,
      active: true,
      images: [],
      kit_type: '',
      recommended_crops: []
    });
    setNewComponent('');
    setNewPricingTier({ name: '', price: 0, description: '' });
    setNewService('');
  };

  const addComponent = () => {
    if (!newComponent.trim()) return;
    const components = formData.components as ComponentsData || { main_components: [], pricing_tiers: [], included_services: [] };
    const updatedComponents = {
      ...components,
      main_components: [...(components.main_components || []), newComponent.trim()]
    };
    setFormData({ ...formData, components: updatedComponents });
    setNewComponent('');
  };

  const removeComponent = (index: number) => {
    const components = formData.components as ComponentsData || { main_components: [], pricing_tiers: [], included_services: [] };
    const updatedComponents = {
      ...components,
      main_components: components.main_components?.filter((_, i) => i !== index) || []
    };
    setFormData({ ...formData, components: updatedComponents });
  };

  const addPricingTier = () => {
    if (!newPricingTier.name.trim() || newPricingTier.price <= 0) return;
    const components = formData.components as ComponentsData || { main_components: [], pricing_tiers: [], included_services: [] };
    const updatedComponents = {
      ...components,
      pricing_tiers: [...(components.pricing_tiers || []), { ...newPricingTier }]
    };
    setFormData({ ...formData, components: updatedComponents });
    setNewPricingTier({ name: '', price: 0, description: '' });
  };

  const removePricingTier = (index: number) => {
    const components = formData.components as ComponentsData || { main_components: [], pricing_tiers: [], included_services: [] };
    const updatedComponents = {
      ...components,
      pricing_tiers: components.pricing_tiers?.filter((_, i) => i !== index) || []
    };
    setFormData({ ...formData, components: updatedComponents });
  };

  const addService = () => {
    if (!newService.trim()) return;
    const components = formData.components as ComponentsData || { main_components: [], pricing_tiers: [], included_services: [] };
    const updatedComponents = {
      ...components,
      included_services: [...(components.included_services || []), newService.trim()]
    };
    setFormData({ ...formData, components: updatedComponents });
    setNewService('');
  };

  const removeService = (index: number) => {
    const components = formData.components as ComponentsData || { main_components: [], pricing_tiers: [], included_services: [] };
    const updatedComponents = {
      ...components,
      included_services: components.included_services?.filter((_, i) => i !== index) || []
    };
    setFormData({ ...formData, components: updatedComponents });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setImageError('No file selected');
      return;
    }

    setUploadingImage(true);
    setImageError(null);

    try {
      const file = files[0];

      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload a valid image file (e.g., PNG, JPEG)');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `irrigation-kits/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kit-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload Error Details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('kit-images')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to retrieve public URL for the image');
      }

      const currentImages = formData.images || [];
      setFormData({
        ...formData,
        images: [...currentImages, publicUrl],
      });
    } catch (err) {
      console.error('Error uploading image:', err);
      setImageError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const removeImage = async (imageUrl: string, index: number) => {
    try {
      const urlParts = imageUrl.split('/kit-images/');
      if (urlParts.length > 1) {
        const filePath = `irrigation-kits/${urlParts[1]}`;
        const { error: deleteError } = await supabase.storage
          .from('kit-images')
          .remove([filePath]);
        if (deleteError) {
          throw new Error(`Failed to delete image: ${deleteError.message}`);
        }
      }
      const updatedImages = formData.images?.filter((_, i) => i !== index) || [];
      setFormData({ ...formData, images: updatedImages });
    } catch (err) {
      console.error('Error removing image:', err);
      setImageError(err instanceof Error ? err.message : 'Failed to remove image');
      const updatedImages = formData.images?.filter((_, i) => i !== index) || [];
      setFormData({ ...formData, images: updatedImages });
    }
  };

  const kitStats = {
    totalKits: kits.length,
    activeKits: kits.filter(k => k.active).length,
    featuredKits: kits.filter(k => k.featured).length,
    totalInstallations: installations.length,
    avgRating: installations.length > 0 
      ? Number((installations.reduce((sum, inst) => sum + (inst.satisfaction_rating || 0), 0) / installations.filter(inst => inst.satisfaction_rating && inst.satisfaction_rating > 0).length || 0).toFixed(1))
      : 0,
    pendingInstallations: installations.filter(inst => inst.installation_status === 'planned').length
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="bg-background border-border p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-foreground">Loading irrigation kits data...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="bg-background border-border p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button onClick={() => loadData(page)} variant="outline" className="border-border text-muted-foreground hover:bg-muted">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (showForm) {
    const components = formData.components as ComponentsData || { main_components: [], pricing_tiers: [], included_services: [] };
    
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-border text-muted-foreground hover:bg-muted">
              ← Back to Kits
            </Button>
            <h2 className="text-2xl font-bold text-foreground">{selectedKit ? 'Edit Kit' : 'New Irrigation Kit'}</h2>
          </div>

          <Card className="bg-background border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Kit Details</CardTitle>
              <CardDescription className="text-muted-foreground">Configure your irrigation kit specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-foreground">Kit Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter kit name"
                    className="bg-background border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="kit_type" className="text-foreground">Kit Type *</Label>
                  <Select value={formData.kit_type || ''} onValueChange={(value) => setFormData({ ...formData, kit_type: value })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select kit type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border text-foreground">
                      <SelectItem value="basic_drip">Basic Drip System</SelectItem>
                      <SelectItem value="advanced_drip">Advanced Drip System</SelectItem>
                      <SelectItem value="sprinkler_system">Sprinkler System</SelectItem>
                      <SelectItem value="greenhouse_kit">Greenhouse Kit</SelectItem>
                      <SelectItem value="hydroponic_kit">Hydroponic Kit</SelectItem>
                      <SelectItem value="smart_irrigation">Smart Irrigation System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-foreground">Category</Label>
                  <Input
                    id="category"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Enter category"
                    className="bg-background border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="maintenance_level" className="text-foreground">Maintenance Level</Label>
                  <Select value={formData.maintenance_level || 'low'} onValueChange={(value) => setFormData({ ...formData, maintenance_level: value as 'low' | 'medium' | 'high' })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border text-foreground">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-foreground">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the irrigation kit"
                  className="bg-background border-border text-foreground placeholder-muted-foreground"
                />
              </div>

              <Card className="border-border">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <Package className="h-5 w-5 text-primary" />
                    Main Components
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Add the main components included in this kit</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex gap-2">
                    <Input
                      value={newComponent}
                      onChange={(e) => setNewComponent(e.target.value)}
                      placeholder="e.g., HDPE Main pipe & Sub-main pipe"
                      onKeyPress={(e) => e.key === 'Enter' && addComponent()}
                      className="bg-background border-border text-foreground placeholder-muted-foreground"
                    />
                    <Button onClick={addComponent} type="button" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {components.main_components?.map((component, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border">
                        <span className="flex items-center gap-2 text-foreground">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          {component}
                        </span>
                        <Button
                          onClick={() => removeComponent(index)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <span className="text-xl">💰</span>
                    Pricing Tiers
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Define different pricing options (e.g., by number of lines/beds)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input
                      value={newPricingTier.name}
                      onChange={(e) => setNewPricingTier({ ...newPricingTier, name: e.target.value })}
                      placeholder="e.g., 1 Line / Bed"
                      className="bg-background border-border text-foreground placeholder-muted-foreground"
                    />
                    <Input
                      type="number"
                      value={newPricingTier.price || ''}
                      onChange={(e) => setNewPricingTier({ ...newPricingTier, price: parseFloat(e.target.value) || 0 })}
                      placeholder="Price (KES)"
                      className="bg-background border-border text-foreground placeholder-muted-foreground"
                    />
                    <Input
                      value={newPricingTier.description}
                      onChange={(e) => setNewPricingTier({ ...newPricingTier, description: e.target.value })}
                      placeholder="Description (optional)"
                      className="bg-background border-border text-foreground placeholder-muted-foreground"
                    />
                    <Button onClick={addPricingTier} type="button" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tier
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {components.pricing_tiers?.map((tier, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border border-border">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{tier.name}</span>
                            <span className="text-xl font-bold text-primary">KES {tier.price.toLocaleString()}</span>
                          </div>
                          {tier.description && (
                            <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => removePricingTier(index)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/80 ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <Settings className="h-5 w-5 text-primary" />
                    Included Services
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Services included with this kit (training, installation, etc.)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex gap-2">
                    <Input
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      placeholder="e.g., Training & installation"
                      onKeyPress={(e) => e.key === 'Enter' && addService()}
                      className="bg-background border-border text-foreground placeholder-muted-foreground"
                    />
                    <Button onClick={addService} type="button" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {components.included_services?.map((service, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border">
                        <span className="flex items-center gap-2 text-foreground">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          {service}
                        </span>
                        <Button
                          onClick={() => removeService(index)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="coverage_area" className="text-foreground">Coverage Area (acres)</Label>
                  <Input
                    type="number"
                    id="coverage_area"
                    value={formData.coverage_area || ''}
                    onChange={(e) => setFormData({ ...formData, coverage_area: parseFloat(e.target.value) || null })}
                    placeholder="0"
                    className="bg-background border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="price" className="text-foreground">Base Price (KES) *</Label>
                  <Input
                    type="number"
                    id="price"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || null })}
                    placeholder="0"
                    className="bg-background border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="installation_time" className="text-foreground">Installation Time (hours)</Label>
                  <Input
                    type="number"
                    id="installation_time"
                    value={formData.installation_time_hours || ''}
                    onChange={(e) => setFormData({ ...formData, installation_time_hours: parseInt(e.target.value) || null })}
                    placeholder="4"
                    className="bg-background border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="complexity" className="text-foreground">Installation Complexity</Label>
                  <Select value={formData.installation_complexity || 'medium'} onValueChange={(value) => setFormData({ ...formData, installation_complexity: value })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border text-foreground">
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="efficiency" className="text-foreground">Water Efficiency (%)</Label>
                  <Input
                    type="number"
                    id="efficiency"
                    value={formData.water_efficiency_percentage || ''}
                    onChange={(e) => setFormData({ ...formData, water_efficiency_percentage: parseInt(e.target.value) || null })}
                    placeholder="70"
                    className="bg-background border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="warranty" className="text-foreground">Warranty (months)</Label>
                  <Input
                    type="number"
                    id="warranty"
                    value={formData.warranty_months || ''}
                    onChange={(e) => setFormData({ ...formData, warranty_months: parseInt(e.target.value) || null })}
                    placeholder="12"
                    className="bg-background border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_crop" className="text-foreground">Target Crop</Label>
                  <Input
                    id="target_crop"
                    value={formData.target_crop || ''}
                    onChange={(e) => setFormData({ ...formData, target_crop: e.target.value })}
                    placeholder="e.g., Tomatoes"
                    className="bg-background border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="crops" className="text-foreground">Recommended Crops (comma-separated)</Label>
                  <Input
                    id="crops"
                    value={formData.recommended_crops?.join(', ') || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      recommended_crops: e.target.value.split(',').map(crop => crop.trim()).filter(crop => crop) 
                    })}
                    placeholder="Tomatoes, Peppers, Lettuce"
                    className="bg-background border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
              </div>

              <Card className="border-border">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Kit Images
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Upload images of your irrigation kit (max 5MB per image)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center gap-4">
                    <Label 
                      htmlFor="image-upload" 
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload Image
                        </>
                      )}
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.images?.length || 0} image(s) uploaded
                    </span>
                  </div>

                  {imageError && (
                    <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{imageError}</span>
                    </div>
                  )}

                  {formData.images && formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {formData.images.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg border-2 border-border overflow-hidden bg-muted">
                            <img 
                              src={imageUrl} 
                              alt={`Kit image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            onClick={() => removeImage(imageUrl, index)}
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={formData.featured || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, featured: checked as boolean })}
                  />
                  <Label htmlFor="featured" className="text-foreground">Featured Kit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={formData.active !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked as boolean })}
                  />
                  <Label htmlFor="active" className="text-foreground">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="in_stock"
                    checked={formData.in_stock !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked as boolean })}
                  />
                  <Label htmlFor="in_stock" className="text-foreground">In Stock</Label>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="border-border text-muted-foreground hover:bg-muted">
                  Cancel
                </Button>
                <Button onClick={handleSaveKit} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Kit'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-muted/30 border border-border p-8 shadow-lg">
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center text-3xl font-black border border-border shadow-lg">
                  🧰
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Irrigation Kits Management</h1>
                  <p className="text-muted-foreground text-lg font-medium">Manage irrigation kits, documents, and installations</p>
                  <div className="flex items-center gap-4 mt-3 text-muted-foreground">
                    <span className="text-sm">📦 Total Kits: {kitStats.totalKits}</span>
                    <span className="text-sm">⭐ Featured: {kitStats.featuredKits}</span>
                    <span className="text-sm">🔧 Installations: {kitStats.totalInstallations}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleNewKit}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  Create New Kit
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-background border-border shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Kits</p>
                  <p className="text-3xl font-bold text-foreground">{kitStats.totalKits}</p>
                </div>
                <Package className="h-12 w-12 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background border-border shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Active Kits</p>
                  <p className="text-3xl font-bold text-foreground">{kitStats.activeKits}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background border-border shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Featured Kits</p>
                  <p className="text-3xl font-bold text-foreground">{kitStats.featuredKits}</p>
                </div>
                <Star className="h-12 w-12 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background border-border shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Installations</p>
                  <p className="text-3xl font-bold text-foreground">{kitStats.totalInstallations}</p>
                </div>
                <Users className="h-12 w-12 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3 bg-muted/30 border-border">
            <TabsTrigger value="kits" className="flex items-center gap-2 text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="h-4 w-4" />
              Irrigation Kits
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2 text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="installations" className="flex items-center gap-2 text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4" />
              Installations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kits" className="space-y-6">
            <Card className="bg-background border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Irrigation Kits</CardTitle>
                <CardDescription className="text-muted-foreground">Manage your irrigation kit catalog</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-foreground">Name</TableHead>
                        <TableHead className="text-foreground">Type</TableHead>
                        <TableHead className="text-foreground">Category</TableHead>
                        <TableHead className="text-foreground">Pricing</TableHead>
                        <TableHead className="text-foreground">Coverage</TableHead>
                        <TableHead className="text-foreground">Status</TableHead>
                        <TableHead className="text-right text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kits.map((kit) => {
                        const components = kit.components as ComponentsData;
                        return (
                          <TableRow key={kit.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium text-foreground">{kit.name}</TableCell>
                            <TableCell>
                              <Badge variant={kit.kit_type === 'smart_irrigation' ? 'default' : 'outline'} className="border-border text-muted-foreground">
                                {kit.kit_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-foreground">{kit.category || 'General'}</TableCell>
                            <TableCell>
                              {components?.pricing_tiers?.length > 0 ? (
                                <div className="space-y-1">
                                  {components.pricing_tiers.map((tier, index) => (
                                    <div key={index} className="text-sm text-foreground">
                                      <span className="font-medium">{tier.name}:</span> KES {tier.price.toLocaleString()}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-foreground">KES {kit.price?.toLocaleString() || '0'}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-foreground">{kit.coverage_area || 0} acres</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant={kit.active ? 'default' : 'outline'} className="border-border text-muted-foreground">
                                  {kit.active ? 'Active' : 'Inactive'}
                                </Badge>
                                {kit.featured && <Badge variant="outline" className="border-border text-primary">Featured</Badge>}
                                {kit.in_stock && <Badge variant="outline" className="border-border text-primary">In Stock</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  onClick={() => handleEditKit(kit)} 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8 w-8 p-0 border-border text-muted-foreground hover:bg-muted"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  onClick={() => handleDeleteKit(kit.id)} 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8 w-8 p-0 border-border text-destructive hover:text-destructive/80"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {kits.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No irrigation kits found. Create your first kit to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between mt-4">
                  <Button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage(p => p + 1)}
                    disabled={kits.length < pageSize}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card className="bg-background border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Kit Documents</CardTitle>
                <CardDescription className="text-muted-foreground">Installation guides, manuals, and other documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-foreground">Title</TableHead>
                        <TableHead className="text-foreground">Type</TableHead>
                        <TableHead className="text-foreground">Version</TableHead>
                        <TableHead className="text-foreground">Downloads</TableHead>
                        <TableHead className="text-foreground">File Size</TableHead>
                        <TableHead className="text-right text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-foreground">{doc.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-border text-muted-foreground">{doc.document_type.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell className="text-foreground">{doc.version || 'N/A'}</TableCell>
                          <TableCell className="text-foreground">{doc.download_count || 0}</TableCell>
                          <TableCell className="text-foreground">{doc.file_size ? (doc.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border text-muted-foreground hover:bg-muted">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border text-muted-foreground hover:bg-muted">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {documents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No documents found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="installations" className="space-y-6">
            <Card className="bg-background border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Customer Installations</CardTitle>
                <CardDescription className="text-muted-foreground">Track kit installations and customer satisfaction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-foreground">Customer</TableHead>
                        <TableHead className="text-foreground">Kit</TableHead>
                        <TableHead className="text-foreground">Location</TableHead>
                        <TableHead className="text-foreground">Area</TableHead>
                        <TableHead className="text-foreground">Status</TableHead>
                        <TableHead className="text-foreground">Rating</TableHead>
                        <TableHead className="text-foreground">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installations.map((installation) => (
                        <TableRow key={installation.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-foreground">{installation.customer_name || 'Unknown'}</TableCell>
                          <TableCell className="text-foreground">{installation.kit_name || 'Unknown'}</TableCell>
                          <TableCell className="text-foreground">{installation.site_location || 'N/A'}</TableCell>
                          <TableCell className="text-foreground">{installation.site_area || 0} acres</TableCell>
                          <TableCell>
                            <Badge variant={installation.installation_status === 'completed' ? 'default' : 
                                           installation.installation_status === 'planned' ? 'outline' : 'outline'} 
                                   className="border-border text-muted-foreground">
                              {installation.installation_status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {installation.satisfaction_rating ? (
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${
                                      i < installation.satisfaction_rating! 
                                        ? 'text-primary fill-current' 
                                        : 'text-muted-foreground'
                                    }`} 
                                  />
                                ))}
                                <span className="text-sm text-muted-foreground ml-1">
                                  ({installation.satisfaction_rating})
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No rating</span>
                            )}
                          </TableCell>
                          <TableCell className="text-foreground">{installation.installation_date ? new Date(installation.installation_date).toLocaleDateString() : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                      {installations.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No installations found.
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
      </div>
    </div>
  );
};

export default IrrigationKitsManagement;