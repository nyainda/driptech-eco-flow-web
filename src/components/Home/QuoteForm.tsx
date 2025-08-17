import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Calculator, FileText } from "lucide-react";

interface QuoteFormProps {
  onSuccess?: () => void;
}

const QuoteForm = ({ onSuccess }: QuoteFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    project_type: "",
    area_size: "",
    crop_type: "",
    water_source: "",
    terrain_info: "",
    notes: ""
  });

  const generateQuoteNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `QT-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First create customer
      const customerData = {
        company_name: formData.company_name,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        user_role: 'customer' as "admin" | "manager" | "sales" | "customer"
      };

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (customerError) throw customerError;

      // Then create quote
      const quoteData = {
        quote_number: generateQuoteNumber(),
        customer_id: customer.id,
        project_type: formData.project_type,
        area_size: formData.area_size ? parseFloat(formData.area_size) : null,
        crop_type: formData.crop_type,
        water_source: formData.water_source,
        terrain_info: formData.terrain_info,
        notes: formData.notes,
        status: 'draft' as "draft" | "sent" | "accepted" | "rejected" | "expired"
      };

      const { error: quoteError } = await supabase
        .from('quotes')
        .insert([quoteData]);

      if (quoteError) throw quoteError;

      toast({
        title: "Quote Request Submitted!",
        description: "We'll review your requirements and get back to you within 24 hours.",
      });

      // Reset form
      setFormData({
        company_name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        project_type: "",
        area_size: "",
        crop_type: "",
        water_source: "",
        terrain_info: "",
        notes: ""
      });

      // Call onSuccess callback if provided
      onSuccess?.();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_person">Contact Person *</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Project Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Project Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project_type">Project Type</Label>
                    <Select value={formData.project_type} onValueChange={(value) => setFormData({ ...formData, project_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drip_irrigation">Drip Irrigation</SelectItem>
                        <SelectItem value="sprinkler_system">Sprinkler System</SelectItem>
                        <SelectItem value="greenhouse">Greenhouse</SelectItem>
                        <SelectItem value="field_crops">Field Crops</SelectItem>
                        <SelectItem value="landscaping">Landscaping</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="area_size">Area Size (acres/hectares)</Label>
                    <Input
                      id="area_size"
                      type="number"
                      step="0.1"
                      value={formData.area_size}
                      onChange={(e) => setFormData({ ...formData, area_size: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="crop_type">Crop Type</Label>
                    <Input
                      id="crop_type"
                      value={formData.crop_type}
                      onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                      placeholder="e.g., Tomatoes, Corn, Grass, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="water_source">Water Source</Label>
                    <Select value={formData.water_source} onValueChange={(value) => setFormData({ ...formData, water_source: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select water source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="well">Well Water</SelectItem>
                        <SelectItem value="municipal">Municipal Water</SelectItem>
                        <SelectItem value="river">River/Stream</SelectItem>
                        <SelectItem value="pond">Pond/Lake</SelectItem>
                        <SelectItem value="rainwater">Rainwater Harvesting</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="terrain_info">Terrain Information</Label>
                  <Textarea
                    id="terrain_info"
                    value={formData.terrain_info}
                    onChange={(e) => setFormData({ ...formData, terrain_info: e.target.value })}
                    placeholder="Describe the terrain (flat, sloped, soil type, etc.)"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional requirements or questions?"
                    rows={3}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 text-lg py-6"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Submit Quote Request
                  </div>
                )}
              </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuoteForm;