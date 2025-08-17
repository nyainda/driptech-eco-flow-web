import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings,
  Building,
  Mail,
  Globe,
  Search,
  Palette,
  Shield,
  Database,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
}

const SystemSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    tagline: "",
    description: "",
    founded: "",
    employees: ""
  });

  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    postal_code: ""
  });

  const [socialMedia, setSocialMedia] = useState({
    facebook: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    instagram: ""
  });

  const [seoSettings, setSeoSettings] = useState({
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    google_analytics: "",
    google_tag_manager: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;

      const settingsMap: Record<string, any> = {};
      data?.forEach((setting: SystemSetting) => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });

      setSettings(settingsMap);
      
      // Populate form data
      if (settingsMap.company_info) {
        setCompanyInfo({ ...companyInfo, ...settingsMap.company_info });
      }
      if (settingsMap.contact_info) {
        setContactInfo({ ...contactInfo, ...settingsMap.contact_info });
      }
      if (settingsMap.social_media) {
        setSocialMedia({ ...socialMedia, ...settingsMap.social_media });
      }
      if (settingsMap.seo_settings) {
        setSeoSettings({ ...seoSettings, ...settingsMap.seo_settings });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

 const updateSetting = async (key: string, value: any) => {
  try {
    // First, check if the setting exists
    const { data: existing, error: fetchError } = await supabase
      .from('system_settings')
      .select('id')
      .eq('setting_key', key)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
      throw fetchError;
    }

    if (existing) {
      // Update existing setting
      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: value,
          description: getSettingDescription(key)
        })
        .eq('setting_key', key);

      if (error) throw error;
    } else {
      // Insert new setting
      const { error } = await supabase
        .from('system_settings')
        .insert({
          setting_key: key,
          setting_value: value,
          description: getSettingDescription(key)
        });

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error updating setting:', error);
    throw error;
  }
};

  const getSettingDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      company_info: "Basic company information",
      contact_info: "Contact information",
      social_media: "Social media links",
      seo_settings: "SEO configuration"
    };
    return descriptions[key] || "";
  };

  const handleSaveCompanyInfo = async () => {
    setSaving(true);
    try {
      await updateSetting('company_info', companyInfo);
      toast({
        title: "Success",
        description: "Company information updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company information",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContactInfo = async () => {
    setSaving(true);
    try {
      await updateSetting('contact_info', contactInfo);
      toast({
        title: "Success",
        description: "Contact information updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contact information",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocialMedia = async () => {
    setSaving(true);
    try {
      await updateSetting('social_media', socialMedia);
      toast({
        title: "Success",
        description: "Social media links updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update social media links",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSeoSettings = async () => {
    setSaving(true);
    try {
      await updateSetting('seo_settings', seoSettings);
      toast({
        title: "Success",
        description: "SEO settings updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update SEO settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">System Settings</h2>
        <p className="text-muted-foreground">
          Configure your system preferences and website settings
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Social
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Basic information about your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    placeholder="DripTech"
                  />
                </div>
                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={companyInfo.tagline}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, tagline: e.target.value })}
                    placeholder="Advanced Irrigation Solutions"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  value={companyInfo.description}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, description: e.target.value })}
                  placeholder="Brief description of your company"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="founded">Founded Year</Label>
                  <Input
                    id="founded"
                    value={companyInfo.founded}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, founded: e.target.value })}
                    placeholder="2020"
                  />
                </div>
                <div>
                  <Label htmlFor="employees">Number of Employees</Label>
                  <Input
                    id="employees"
                    value={companyInfo.employees}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, employees: e.target.value })}
                    placeholder="50+"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveCompanyInfo} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Company Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                How customers can reach you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    placeholder="info@driptech.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    placeholder="+1-555-0123"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={contactInfo.address}
                  onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                  placeholder="123 Innovation Drive"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={contactInfo.city}
                    onChange={(e) => setContactInfo({ ...contactInfo, city: e.target.value })}
                    placeholder="Tech City"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={contactInfo.country}
                    onChange={(e) => setContactInfo({ ...contactInfo, country: e.target.value })}
                    placeholder="United States"
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={contactInfo.postal_code}
                    onChange={(e) => setContactInfo({ ...contactInfo, postal_code: e.target.value })}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveContactInfo} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Contact Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Social Media Links
              </CardTitle>
              <CardDescription>
                Connect your social media profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={socialMedia.facebook}
                    onChange={(e) => setSocialMedia({ ...socialMedia, facebook: e.target.value })}
                    placeholder="https://facebook.com/driptech"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={socialMedia.twitter}
                    onChange={(e) => setSocialMedia({ ...socialMedia, twitter: e.target.value })}
                    placeholder="https://twitter.com/driptech"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={socialMedia.linkedin}
                    onChange={(e) => setSocialMedia({ ...socialMedia, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/company/driptech"
                  />
                </div>
                <div>
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    value={socialMedia.youtube}
                    onChange={(e) => setSocialMedia({ ...socialMedia, youtube: e.target.value })}
                    placeholder="https://youtube.com/driptech"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={socialMedia.instagram}
                  onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                  placeholder="https://instagram.com/driptech"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSocialMedia} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Social Media
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO Settings
              </CardTitle>
              <CardDescription>
                Search engine optimization configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={seoSettings.meta_title}
                  onChange={(e) => setSeoSettings({ ...seoSettings, meta_title: e.target.value })}
                  placeholder="DripTech - Advanced Irrigation Solutions"
                />
              </div>

              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={seoSettings.meta_description}
                  onChange={(e) => setSeoSettings({ ...seoSettings, meta_description: e.target.value })}
                  placeholder="Leading provider of smart irrigation systems for modern agriculture"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="meta_keywords">Meta Keywords</Label>
                <Input
                  id="meta_keywords"
                  value={seoSettings.meta_keywords}
                  onChange={(e) => setSeoSettings({ ...seoSettings, meta_keywords: e.target.value })}
                  placeholder="irrigation, drip irrigation, smart farming, agriculture"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="google_analytics">Google Analytics ID</Label>
                  <Input
                    id="google_analytics"
                    value={seoSettings.google_analytics}
                    onChange={(e) => setSeoSettings({ ...seoSettings, google_analytics: e.target.value })}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="google_tag_manager">Google Tag Manager ID</Label>
                  <Input
                    id="google_tag_manager"
                    value={seoSettings.google_tag_manager}
                    onChange={(e) => setSeoSettings({ ...seoSettings, google_tag_manager: e.target.value })}
                    placeholder="GTM-XXXXXXX"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSeoSettings} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save SEO Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;