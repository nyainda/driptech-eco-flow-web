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
  Save,
  KeyRound,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SettingsTab = "company" | "contact" | "social" | "seo" | "api";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
}

interface SystemSettingsProps {
  initialTab?: SettingsTab;
}

const SystemSettings = ({ initialTab = "company" }: SystemSettingsProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    tagline: "",
    description: "",
    founded: "",
    employees: "",
  });

  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    postal_code: "",
  });

  const [socialMedia, setSocialMedia] = useState({
    facebook: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    instagram: "",
  });

  const [seoSettings, setSeoSettings] = useState({
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    google_analytics: "",
    google_tag_manager: "",
  });

  const [apiKeys, setApiKeys] = useState({
    gemini_api_key: "",
    serpapi_key: "",
    serper_api_key: "",
    searchapi_key: "",
  });

  const [secureSecrets, setSecureSecrets] = useState({
    xai_api_key: "",
    resend_api_key: "",
    outreach_from_email: "",
    xai_grok_model: "grok-4.7",
  });
  const [loadedOutreachMeta, setLoadedOutreachMeta] = useState({
    outreach_from_email: "",
    xai_grok_model: "grok-4.7",
  });
  const [secretStatus, setSecretStatus] = useState({
    available: false,
    xaiConfigured: false,
    xaiPreview: "",
    resendConfigured: false,
    resendPreview: "",
  });

  const fetchSecureSecretStatus = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.functions.invoke("b2b-lead-outreach", {
        body: { action: "api_key_status" },
      });
      if (error || !data || data.error) return;
      const fromEmail = String(data.outreachFromEmail || "");
      const grokModel = String(data.xaiGrokModel || "grok-4.7");
      setSecretStatus({
        available: true,
        xaiConfigured: !!data.xaiConfigured,
        xaiPreview: String(data.xaiPreview || ""),
        resendConfigured: !!data.resendConfigured,
        resendPreview: String(data.resendPreview || ""),
      });
      setLoadedOutreachMeta({
        outreach_from_email: fromEmail,
        xai_grok_model: grokModel,
      });
      setSecureSecrets((prev) => ({
        ...prev,
        outreach_from_email: fromEmail,
        xai_grok_model: grokModel,
      }));
    } catch {
      // Non-fatal: Edge Function may not be deployed yet.
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchSecureSecretStatus();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*");

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
      setApiKeys({
        gemini_api_key: settingsMap.gemini_api_key || "",
        serpapi_key: settingsMap.serpapi_key || "",
        serper_api_key: settingsMap.serper_api_key || "",
        searchapi_key: settingsMap.searchapi_key || "",
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch system settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      // First, check if the setting exists
      const { data: existing, error: fetchError } = await supabase
        .from("system_settings")
        .select("id")
        .eq("setting_key", key)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (existing) {
        // Update existing setting
        const { error } = await supabase
          .from("system_settings")
          .update({
            setting_value: value,
            description: getSettingDescription(key),
            updated_at: new Date().toISOString(),
          })
          .eq("setting_key", key);

        if (error) throw error;
      } else {
        // Insert new setting
        const { error } = await supabase.from("system_settings").insert({
          setting_key: key,
          setting_value: value,
          description: getSettingDescription(key),
        });

        if (error) throw error;
      }

      // Update local state
      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error("Error updating setting:", error);
      throw error;
    }
  };

  const getSettingDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      company_info: "Basic company information",
      contact_info: "Contact information",
      social_media: "Social media links",
      seo_settings: "SEO configuration",
      gemini_api_key: "Gemini API Key for AI features",
      serpapi_key: "SerpAPI key for product image search (primary)",
      serper_api_key: "Serper API key for product image search (fallback)",
      searchapi_key: "SearchApi.io key for product image search (fallback)",
    };
    return descriptions[key] || "";
  };

  const handleSaveCompanyInfo = async () => {
    setSaving(true);
    try {
      await updateSetting("company_info", companyInfo);
      toast({
        title: "Success",
        description: "Company information updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContactInfo = async () => {
    setSaving(true);
    try {
      await updateSetting("contact_info", contactInfo);
      toast({
        title: "Success",
        description: "Contact information updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contact information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocialMedia = async () => {
    setSaving(true);
    try {
      await updateSetting("social_media", socialMedia);
      toast({
        title: "Success",
        description: "Social media links updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update social media links",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSeoSettings = async () => {
    setSaving(true);
    try {
      await updateSetting("seo_settings", seoSettings);
      toast({
        title: "Success",
        description: "SEO settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update SEO settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApiKeys = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting("gemini_api_key", apiKeys.gemini_api_key),
        updateSetting("serpapi_key", apiKeys.serpapi_key),
        updateSetting("serper_api_key", apiKeys.serper_api_key),
        updateSetting("searchapi_key", apiKeys.searchapi_key),
      ]);

      const hasSecureSecretChanges =
        !!secureSecrets.xai_api_key.trim() ||
        !!secureSecrets.resend_api_key.trim() ||
        secureSecrets.outreach_from_email.trim() !== loadedOutreachMeta.outreach_from_email ||
        secureSecrets.xai_grok_model.trim() !== loadedOutreachMeta.xai_grok_model;

      if (hasSecureSecretChanges) {
        if (!isSupabaseConfigured) {
          throw new Error("Connect Supabase before saving Grok / Resend server keys.");
        }
        const { data, error } = await supabase.functions.invoke("b2b-lead-outreach", {
          body: {
            action: "save_api_keys",
            ...(secureSecrets.xai_api_key.trim() ? { xai_api_key: secureSecrets.xai_api_key.trim() } : {}),
            ...(secureSecrets.resend_api_key.trim()
              ? { resend_api_key: secureSecrets.resend_api_key.trim() }
              : {}),
            outreach_from_email: secureSecrets.outreach_from_email.trim(),
            xai_grok_model: secureSecrets.xai_grok_model.trim() || "grok-4.7",
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        const nextFrom = String(data?.outreachFromEmail || "");
        const nextModel = String(data?.xaiGrokModel || "grok-4.7");
        setSecretStatus({
          available: true,
          xaiConfigured: !!data?.xaiConfigured,
          xaiPreview: String(data?.xaiPreview || ""),
          resendConfigured: !!data?.resendConfigured,
          resendPreview: String(data?.resendPreview || ""),
        });
        setLoadedOutreachMeta({ outreach_from_email: nextFrom, xai_grok_model: nextModel });
        setSecureSecrets({
          xai_api_key: "",
          resend_api_key: "",
          outreach_from_email: nextFrom,
          xai_grok_model: nextModel,
        });
      }

      toast({
        title: "Success",
        description: hasSecureSecretChanges
          ? "API keys and Grok / Resend server secrets saved successfully"
          : "API keys saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearSecureSecret = async (target: "xai" | "resend") => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("b2b-lead-outreach", {
        body: {
          action: "save_api_keys",
          ...(target === "xai" ? { clear_xai_api_key: true } : { clear_resend_api_key: true }),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSecretStatus((prev) => ({
        ...prev,
        xaiConfigured: !!data?.xaiConfigured,
        xaiPreview: String(data?.xaiPreview || ""),
        resendConfigured: !!data?.resendConfigured,
        resendPreview: String(data?.resendPreview || ""),
      }));
      toast({
        title: "Key Removed",
        description: target === "xai" ? "Cleared stored Grok API key." : "Cleared stored Resend API key.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not clear key",
        variant: "destructive",
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
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          System Settings
        </h2>
        <p className="text-muted-foreground">
          Configure your system preferences and website settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SettingsTab)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
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
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, name: e.target.value })
                    }
                    placeholder="DripTech"
                  />
                </div>
                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={companyInfo.tagline}
                    onChange={(e) =>
                      setCompanyInfo({
                        ...companyInfo,
                        tagline: e.target.value,
                      })
                    }
                    placeholder="Advanced Irrigation Solutions"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  value={companyInfo.description}
                  onChange={(e) =>
                    setCompanyInfo({
                      ...companyInfo,
                      description: e.target.value,
                    })
                  }
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
                    onChange={(e) =>
                      setCompanyInfo({
                        ...companyInfo,
                        founded: e.target.value,
                      })
                    }
                    placeholder="2020"
                  />
                </div>
                <div>
                  <Label htmlFor="employees">Number of Employees</Label>
                  <Input
                    id="employees"
                    value={companyInfo.employees}
                    onChange={(e) =>
                      setCompanyInfo({
                        ...companyInfo,
                        employees: e.target.value,
                      })
                    }
                    placeholder="50+"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveCompanyInfo}
                  disabled={saving}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Company Info"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contact Information
              </CardTitle>
              <CardDescription>How customers can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, email: e.target.value })
                    }
                    placeholder="info@driptech.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={contactInfo.phone}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, phone: e.target.value })
                    }
                    placeholder="+1-555-0123"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={contactInfo.address}
                  onChange={(e) =>
                    setContactInfo({ ...contactInfo, address: e.target.value })
                  }
                  placeholder="123 Innovation Drive"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={contactInfo.city}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, city: e.target.value })
                    }
                    placeholder="Tech City"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={contactInfo.country}
                    onChange={(e) =>
                      setContactInfo({
                        ...contactInfo,
                        country: e.target.value,
                      })
                    }
                    placeholder="United States"
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={contactInfo.postal_code}
                    onChange={(e) =>
                      setContactInfo({
                        ...contactInfo,
                        postal_code: e.target.value,
                      })
                    }
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveContactInfo}
                  disabled={saving}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Contact Info"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
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
                    onChange={(e) =>
                      setSocialMedia({
                        ...socialMedia,
                        facebook: e.target.value,
                      })
                    }
                    placeholder="https://facebook.com/driptech"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={socialMedia.twitter}
                    onChange={(e) =>
                      setSocialMedia({
                        ...socialMedia,
                        twitter: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setSocialMedia({
                        ...socialMedia,
                        linkedin: e.target.value,
                      })
                    }
                    placeholder="https://linkedin.com/company/driptech"
                  />
                </div>
                <div>
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    value={socialMedia.youtube}
                    onChange={(e) =>
                      setSocialMedia({
                        ...socialMedia,
                        youtube: e.target.value,
                      })
                    }
                    placeholder="https://youtube.com/driptech"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={socialMedia.instagram}
                  onChange={(e) =>
                    setSocialMedia({
                      ...socialMedia,
                      instagram: e.target.value,
                    })
                  }
                  placeholder="https://instagram.com/driptech"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSocialMedia}
                  disabled={saving}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Social Media"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
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
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      meta_title: e.target.value,
                    })
                  }
                  placeholder="DripTech - Advanced Irrigation Solutions"
                />
              </div>

              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={seoSettings.meta_description}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      meta_description: e.target.value,
                    })
                  }
                  placeholder="Leading provider of smart irrigation systems for modern agriculture"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="meta_keywords">Meta Keywords</Label>
                <Input
                  id="meta_keywords"
                  value={seoSettings.meta_keywords}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      meta_keywords: e.target.value,
                    })
                  }
                  placeholder="irrigation, drip irrigation, smart farming, agriculture"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="google_analytics">Google Analytics ID</Label>
                  <Input
                    id="google_analytics"
                    value={seoSettings.google_analytics}
                    onChange={(e) =>
                      setSeoSettings({
                        ...seoSettings,
                        google_analytics: e.target.value,
                      })
                    }
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="google_tag_manager">
                    Google Tag Manager ID
                  </Label>
                  <Input
                    id="google_tag_manager"
                    value={seoSettings.google_tag_manager}
                    onChange={(e) =>
                      setSeoSettings({
                        ...seoSettings,
                        google_tag_manager: e.target.value,
                      })
                    }
                    placeholder="GTM-XXXXXXX"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSeoSettings}
                  disabled={saving}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save SEO Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                API Keys
              </CardTitle>
              <CardDescription>
                Configure API keys for external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gemini_api_key">Gemini API Key</Label>
                <Input
                  id="gemini_api_key"
                  type="password"
                  value={apiKeys.gemini_api_key}
                  onChange={(e) =>
                    setApiKeys({
                      ...apiKeys,
                      gemini_api_key: e.target.value,
                    })
                  }
                  placeholder="Enter your Gemini API Key"
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Get your API key from{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-1">Product image search</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Used by the product image picker to pull candidate photos. Configure at least
                  one — if the primary key hits its quota or errors out, the system automatically
                  falls back to the next one you've filled in.
                </p>
              </div>

              <div>
                <Label htmlFor="serpapi_key">SerpAPI Key (primary)</Label>
                <Input
                  id="serpapi_key"
                  type="password"
                  value={apiKeys.serpapi_key}
                  onChange={(e) =>
                    setApiKeys({
                      ...apiKeys,
                      serpapi_key: e.target.value,
                    })
                  }
                  placeholder="Enter your SerpAPI key"
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Get your API key from{" "}
                  <a
                    href="https://serpapi.com/manage-api-key"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    SerpAPI dashboard
                  </a>
                  . If this key is compromised, paste a new one here and save — no redeploy
                  needed.
                </p>
              </div>

              <div>
                <Label htmlFor="serper_api_key">Serper API Key (fallback)</Label>
                <Input
                  id="serper_api_key"
                  type="password"
                  value={apiKeys.serper_api_key}
                  onChange={(e) =>
                    setApiKeys({
                      ...apiKeys,
                      serper_api_key: e.target.value,
                    })
                  }
                  placeholder="Optional — used if SerpAPI is exhausted or errors"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="searchapi_key">SearchApi.io Key (fallback)</Label>
                <Input
                  id="searchapi_key"
                  type="password"
                  value={apiKeys.searchapi_key}
                  onChange={(e) =>
                    setApiKeys({
                      ...apiKeys,
                      searchapi_key: e.target.value,
                    })
                  }
                  placeholder="Optional — used if SerpAPI and Serper are both exhausted"
                  className="mt-2"
                />
              </div>

              <div className="border-t pt-5 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-1">
                    <KeyRound className="h-4 w-4 text-emerald-600" />
                    Grok AI &amp; B2B Outreach Keys (Server-Side Only)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Powers <strong>Grok Client Finder</strong>, <strong>SEO Intelligence</strong>, and <strong>Irrigation Market Intelligence</strong>. Keys saved here are stored in a locked service-role table and never returned to public browsers.
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor="xai_api_key">xAI Grok API Key</Label>
                    <div className="flex items-center gap-2">
                      {secretStatus.xaiConfigured ? (
                        <>
                          <Badge variant="secondary" className="text-xs font-mono text-emerald-700 dark:text-emerald-300">
                            Configured ({secretStatus.xaiPreview || "saved"})
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-rose-600 hover:text-rose-700"
                            onClick={() => handleClearSecureSecret("xai")}
                            disabled={saving}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Clear
                          </Button>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-xs">Not set</Badge>
                      )}
                    </div>
                  </div>
                  <Input
                    id="xai_api_key"
                    type="password"
                    value={secureSecrets.xai_api_key}
                    onChange={(e) =>
                      setSecureSecrets({
                        ...secureSecrets,
                        xai_api_key: e.target.value,
                      })
                    }
                    placeholder={
                      secretStatus.xaiConfigured
                        ? "Saved on server — paste a new key only to replace"
                        : "Paste your xAI Grok API Key (xai-...)"
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Get your key from{" "}
                    <a
                      href="https://console.x.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      xAI Console
                    </a>
                    . Replaces manual Supabase Edge Function secret setup.
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor="resend_api_key">Resend Email API Key (for B2B Outreach)</Label>
                    <div className="flex items-center gap-2">
                      {secretStatus.resendConfigured ? (
                        <>
                          <Badge variant="secondary" className="text-xs font-mono text-emerald-700 dark:text-emerald-300">
                            Configured ({secretStatus.resendPreview || "saved"})
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-rose-600 hover:text-rose-700"
                            onClick={() => handleClearSecureSecret("resend")}
                            disabled={saving}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Clear
                          </Button>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-xs">Not set</Badge>
                      )}
                    </div>
                  </div>
                  <Input
                    id="resend_api_key"
                    type="password"
                    value={secureSecrets.resend_api_key}
                    onChange={(e) =>
                      setSecureSecrets({
                        ...secureSecrets,
                        resend_api_key: e.target.value,
                      })
                    }
                    placeholder={
                      secretStatus.resendConfigured
                        ? "Saved on server — paste a new key only to replace"
                        : "Paste your Resend API Key (re_...)"
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Get your key from{" "}
                    <a
                      href="https://resend.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Resend Dashboard
                    </a>
                    .
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="outreach_from_email">Outreach Sender Address (Optional)</Label>
                    <Input
                      id="outreach_from_email"
                      value={secureSecrets.outreach_from_email}
                      onChange={(e) =>
                        setSecureSecrets({
                          ...secureSecrets,
                          outreach_from_email: e.target.value,
                        })
                      }
                      placeholder="DripTech Sales <sales@mail.dripstech.co.ke>"
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave blank to use <code className="font-mono">info@dripstech.co.ke</code>. Using a verified subdomain is best for deliverability.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="xai_grok_model">Grok Model</Label>
                    <Input
                      id="xai_grok_model"
                      value={secureSecrets.xai_grok_model}
                      onChange={(e) =>
                        setSecureSecrets({
                          ...secureSecrets,
                          xai_grok_model: e.target.value,
                        })
                      }
                      placeholder="grok-4.7"
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Defaults to <code className="font-mono">grok-4.7</code> (low-reasoning fast search) or enter <code className="font-mono">grok-4-fast</code> for ultra-fast prospect scans.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveApiKeys}
                  disabled={saving}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save API Keys"}
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
