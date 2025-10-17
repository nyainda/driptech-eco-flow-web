import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Gift,
  Eye,
  EyeOff,
  Calendar,
  Save,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface DiscountBanner {
  id: string;
  discount: string;
  title: string;
  description: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DiscountFormData {
  discount: string;
  title: string;
  description: string;
  valid_until: string;
  is_active: boolean;
}

const DiscountManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<DiscountBanner | null>(
    null,
  );

  const [formData, setFormData] = useState<DiscountFormData>({
    discount: "",
    title: "",
    description: "",
    valid_until: "",
    is_active: true,
  });

  // Fetch discount banners
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["discount-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_banners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DiscountBanner[];
    },
  });

  // Save banner mutation
  const saveBannerMutation = useMutation({
    mutationFn: async (banner: DiscountFormData) => {
      if (editingBanner) {
        // Update existing banner
        const { data, error } = await supabase
          .from("discount_banners")
          .update({
            discount: banner.discount,
            title: banner.title,
            description: banner.description,
            valid_until: banner.valid_until || null,
            is_active: banner.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingBanner.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new banner
        const { data, error } = await supabase
          .from("discount_banners")
          .insert({
            discount: banner.discount,
            title: banner.title,
            description: banner.description,
            valid_until: banner.valid_until || null,
            is_active: banner.is_active,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-banners"] });
      resetForm();
      toast({
        title: "Success",
        description: "Discount banner saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete banner mutation
  const deleteBannerMutation = useMutation({
    mutationFn: async (bannerId: string) => {
      const { error } = await supabase
        .from("discount_banners")
        .delete()
        .eq("id", bannerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-banners"] });
      toast({
        title: "Success",
        description: "Discount banner deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({
      bannerId,
      isActive,
    }: {
      bannerId: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from("discount_banners")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bannerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-banners"] });
      toast({
        title: "Success",
        description: "Banner status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      discount: "",
      title: "",
      description: "",
      valid_until: "",
      is_active: true,
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  const handleEdit = (banner: DiscountBanner) => {
    setFormData({
      discount: banner.discount,
      title: banner.title,
      description: banner.description,
      valid_until: banner.valid_until || "",
      is_active: banner.is_active,
    });
    setEditingBanner(banner);
    setShowForm(true);
  };

  const handleDelete = (banner: DiscountBanner) => {
    if (confirm("Are you sure you want to delete this discount banner?")) {
      deleteBannerMutation.mutate(banner.id);
    }
  };

  const handleToggleActive = (banner: DiscountBanner) => {
    toggleActiveMutation.mutate({
      bannerId: banner.id,
      isActive: !banner.is_active,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.discount || !formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    saveBannerMutation.mutate(formData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (validUntil?: string) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {editingBanner
                ? "Edit Discount Banner"
                : "Create Discount Banner"}
            </h2>
            <p className="text-muted-foreground">
              {editingBanner
                ? "Update banner details"
                : "Add a new promotional banner"}
            </p>
          </div>
          <Button variant="outline" onClick={resetForm}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Banner Details</CardTitle>
            <CardDescription>
              Configure the discount banner that will be displayed to visitors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount">Discount Amount *</Label>
                  <Input
                    id="discount"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({ ...formData, discount: e.target.value })
                    }
                    placeholder="e.g., 20%, $50, Buy 1 Get 1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="title">Banner Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Limited Time Offer!"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="e.g., Save on all irrigation systems this month"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_until">Valid Until (Optional)</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Active Banner</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveBannerMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingBanner ? "Update Banner" : "Create Banner"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Discount Banner Management</h2>
          <p className="text-muted-foreground">
            Create and manage promotional banners for your website
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Banner
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Banners</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banners.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Banners
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {banners.filter((b) => b.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expired Banners
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {banners.filter((b) => isExpired(b.valid_until)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Banners
            </CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {banners.filter((b) => !b.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banners List */}
      <Card>
        <CardHeader>
          <CardTitle>Discount Banners</CardTitle>
          <CardDescription>
            Manage your promotional banners and their visibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No discount banners yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first promotional banner to engage visitors
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Banner
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className={`border rounded-lg p-4 ${
                    !banner.is_active ? "opacity-60" : ""
                  } ${isExpired(banner.valid_until) ? "border-red-200 bg-red-50/50" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="font-bold">
                          {banner.discount} OFF
                        </Badge>
                        <Badge
                          variant={banner.is_active ? "default" : "secondary"}
                        >
                          {banner.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {isExpired(banner.valid_until) && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-1">
                        {banner.title}
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        {banner.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {formatDate(banner.created_at)}</span>
                        {banner.valid_until && (
                          <span>
                            Valid until: {formatDate(banner.valid_until)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(banner)}
                        disabled={toggleActiveMutation.isPending}
                      >
                        {banner.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(banner)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(banner)}
                        disabled={deleteBannerMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscountManagement;
