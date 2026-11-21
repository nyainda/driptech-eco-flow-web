import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SITE_COMPANY } from "@/config/company";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import {
  Building2,
  CheckCircle2,
  Droplets,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  RotateCcw,
  Ruler,
  Send,
  Wrench,
} from "lucide-react";

interface InquiryTopic {
  id: string;
  label: string;
  description: string;
  projectType: string;
  defaultSubject: string;
  messagePlaceholder: string;
  channel: "sales" | "engineering";
  icon: typeof Droplets;
}

const INQUIRY_TOPICS: InquiryTopic[] = [
  {
    id: "kits-supply",
    label: "Products & Drip Kits",
    description: "Pricing, rolls, sprinklers & delivery",
    projectType: "drip_kits_supply",
    defaultSubject: "Drip Kit & Equipment Quote",
    messagePlaceholder:
      "Tell us which kits, dripline spacing (15/20/30cm), sprinklers, or pumps you need and your delivery town...",
    channel: "sales",
    icon: Droplets,
  },
  {
    id: "design-boq",
    label: "System Design & BOQ",
    description: "Custom farm layout & official quotation",
    projectType: "system_design_boq",
    defaultSubject: "Custom Irrigation Layout & BOQ Request",
    messagePlaceholder:
      "Share your field dimensions, crop spacing, water source flow/elevation, and whether you need a proforma for bank/LPO...",
    channel: "engineering",
    icon: Ruler,
  },
  {
    id: "install-liners",
    label: "Install & Dam Liners",
    description: "Field install, welding & greenhouses",
    projectType: "installation_dam_liners",
    defaultSubject: "Install / Dam Liner Assessment",
    messagePlaceholder:
      "Share your site location, installation scope, or dam dimensions (length × width × depth) for technician scheduling...",
    channel: "engineering",
    icon: Wrench,
  },
  {
    id: "support",
    label: "Technical Support",
    description: "Pump sizing, repairs & spares",
    projectType: "pumps_technical_support",
    defaultSubject: "Technical & System Support Inquiry",
    messagePlaceholder:
      "Describe your pump/system setup, pressure issue, filtration question, or replacement parts needed...",
    channel: "engineering",
    icon: FileText,
  },
  {
    id: "corporate",
    label: "Corporate / NGO LPO",
    description: "Tenders, bulk supply & partnerships",
    projectType: "corporate_general",
    defaultSubject: "Corporate / Institutional Supply Inquiry",
    messagePlaceholder:
      "Share tender timelines, county delivery destinations, quantities, or procurement requirements...",
    channel: "sales",
    icon: Building2,
  },
];

const QUICK_AREA_PRESETS = [
  "Kitchen / ⅛ Acre",
  "¼ Acre",
  "½ Acre",
  "1 Acre",
  "2–5 Acres",
  "5+ Acres",
] as const;

const REPLY_PREFERENCES = [
  { id: "WhatsApp", label: "WhatsApp", icon: MessageCircle },
  { id: "Phone Call", label: "Phone Call", icon: Phone },
  { id: "Email", label: "Email", icon: Mail },
] as const;

interface SubmittedReceipt {
  name: string;
  email: string;
  topicLabel: string;
  preferredReply: string;
  whatsappText: string;
  channel: "sales" | "engineering";
}

interface SimpleContactFormProps {
  selectedTopicId?: string;
  onTopicChange?: (topicId: string) => void;
}

const SimpleContactForm = ({
  selectedTopicId,
  onTopicChange,
}: SimpleContactFormProps) => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<string>("kits-supply");
  const [submittedReceipt, setSubmittedReceipt] =
    useState<SubmittedReceipt | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    county: "",
    areaSize: "",
    cropAndWater: "",
    preferredReply: "WhatsApp",
    subject: "",
    message: "",
  });

  useEffect(() => {
    const paramTopic =
      selectedTopicId ||
      searchParams.get("topic") ||
      searchParams.get("type") ||
      "";
    const paramSubject = searchParams.get("subject") || "";
    const paramArea = searchParams.get("area") || "";

    if (paramTopic) {
      const matched = INQUIRY_TOPICS.find(
        (t) =>
          t.id === paramTopic ||
          t.projectType.toLowerCase() === paramTopic.toLowerCase(),
      );
      if (matched) {
        setActiveTopicId(matched.id);
      }
    }

    if (paramSubject || paramArea) {
      setFormData((prev) => ({
        ...prev,
        subject: paramSubject || prev.subject,
        areaSize: paramArea || prev.areaSize,
      }));
    }
  }, [selectedTopicId, searchParams]);

  const activeTopic =
    INQUIRY_TOPICS.find((t) => t.id === activeTopicId) || INQUIRY_TOPICS[0];

  const handleTopicSelect = (topic: InquiryTopic) => {
    setActiveTopicId(topic.id);
    onTopicChange?.(topic.id);
    setSubmittedReceipt(null);
    setFormData((prev) => {
      const wasDefaultSubject =
        !prev.subject.trim() ||
        INQUIRY_TOPICS.some((item) => item.defaultSubject === prev.subject);
      return {
        ...prev,
        subject: wasDefaultSubject ? topic.defaultSubject : prev.subject,
      };
    });
  };

  const buildStructuredMessage = () => {
    const resolvedSubject =
      formData.subject.trim() || activeTopic.defaultSubject;
    const headerLines = [
      `Inquiry Category: ${activeTopic.label}`,
      `Subject: ${resolvedSubject}`,
      `Preferred Reply: ${formData.preferredReply}`,
    ];

    if (formData.county.trim()) {
      headerLines.push(`County / Town: ${formData.county.trim()}`);
    }
    if (formData.areaSize.trim()) {
      headerLines.push(`Farm / Plot Size: ${formData.areaSize.trim()}`);
    }
    if (formData.cropAndWater.trim()) {
      headerLines.push(`Crop & Water Source: ${formData.cropAndWater.trim()}`);
    }

    return `${headerLines.join("\n")}\n\n${formData.message.trim()}`;
  };

  const buildWhatsAppSummary = () => {
    const resolvedSubject =
      formData.subject.trim() || activeTopic.defaultSubject;
    const parts = [
      `Hi DripTech Eco Flow (${activeTopic.label}),`,
      formData.name.trim() ? `Name: ${formData.name.trim()}` : null,
      formData.county.trim() ? `Location: ${formData.county.trim()}` : null,
      formData.areaSize.trim() ? `Plot Size: ${formData.areaSize.trim()}` : null,
      formData.cropAndWater.trim()
        ? `Crop / Water: ${formData.cropAndWater.trim()}`
        : null,
      `Subject: ${resolvedSubject}`,
      formData.message.trim() ? `Details: ${formData.message.trim()}` : null,
    ].filter(Boolean);

    return parts.join("\n");
  };

  const openDirectWhatsApp = (
    text: string,
    channel: "sales" | "engineering",
    sourceLabel: string,
  ) => {
    const targetNumber =
      channel === "engineering"
        ? SITE_COMPANY.phoneSecondary.replace(/\D/g, "")
        : SITE_COMPANY.phonePrimary.replace(/\D/g, "");
    const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`;
    openTrackedWhatsApp(url, sourceLabel);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();
    const cleanMessage = formData.message.trim();

    if (!cleanName || !cleanEmail || !cleanMessage) {
      toast({
        title: "Missing Required Details",
        description: "Please fill in your name, email, and project message.",
        variant: "destructive",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast({
        title: "Invalid Email Address",
        description: "Please check your email format before sending.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const whatsappSummary = buildWhatsAppSummary();
      const contactData = {
        name: cleanName,
        email: cleanEmail,
        phone: formData.phone.trim() || null,
        company: formData.company.trim() || null,
        project_type: activeTopic.projectType,
        area_size: formData.areaSize.trim() || null,
        message: buildStructuredMessage(),
        status: "new",
        read: false,
      };

      const { error } = await supabase
        .from("contact_submissions")
        .insert([contactData]);

      if (error) throw error;

      toast({
        title: "Inquiry Received",
        description:
          "Thank you for contacting DripTech. Our team will respond within 1 business day.",
      });

      setSubmittedReceipt({
        name: cleanName,
        email: cleanEmail,
        topicLabel: activeTopic.label,
        preferredReply: formData.preferredReply,
        whatsappText: whatsappSummary,
        channel: activeTopic.channel,
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        county: "",
        areaSize: "",
        cropAndWater: "",
        preferredReply: "WhatsApp",
        subject: "",
        message: "",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send message. Please try again.";
      toast({
        title: "Unable to Send Inquiry",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedReceipt) {
    return (
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div>
              <span className="dt-badge-primary">Inquiry Logged</span>
              <h3 className="mt-2 font-heading text-2xl font-bold text-foreground">
                Thank you, {submittedReceipt.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Your <strong>{submittedReceipt.topicLabel}</strong> request has
                been received. We will reach out via{" "}
                <strong>{submittedReceipt.preferredReply}</strong> or{" "}
                <span className="font-medium text-foreground">
                  {submittedReceipt.email}
                </span>{" "}
                during East Africa Time business hours.
              </p>
            </div>

            <div className="w-full rounded-xl border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
              Need faster turnaround on pricing or sizing right now? Send this
              exact brief directly to our team on WhatsApp without retyping.
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() =>
                  openDirectWhatsApp(
                    submittedReceipt.whatsappText,
                    submittedReceipt.channel,
                    "contact confirmation WhatsApp handoff",
                  )
                }
                className="flex-1 bg-[hsl(var(--dt-whatsapp))] text-white hover:bg-[hsl(var(--dt-whatsapp)/0.9)]"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Send Copy on WhatsApp
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSubmittedReceipt(null)}
                className="sm:w-auto"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                New Inquiry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border/80 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 font-heading text-xl sm:text-2xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Send className="h-4 w-4" />
            </span>
            Send an Irrigation Inquiry
          </CardTitle>
          <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
            Routes to {activeTopic.channel === "engineering" ? "Engineering" : "Sales"} Team
          </span>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pick a topic below and include your county or farm size for a tailored quote or BOQ.
        </p>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Step 1: Inquiry Topic */}
          <div className="space-y-2.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. What can we help you with?
            </Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {INQUIRY_TOPICS.map((topic) => {
                const Icon = topic.icon;
                const isSelected = topic.id === activeTopic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleTopicSelect(topic)}
                    aria-pressed={isSelected}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-foreground">
                        {topic.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {topic.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Contact Details */}
          <div className="space-y-4">
            <Label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. Your Contact Details
            </Label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  autoComplete="name"
                  placeholder="e.g., Jane Wanjiku"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-phone">Phone / WhatsApp Number</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  autoComplete="tel"
                  placeholder="e.g., 0723 407 849"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-company">Farm / Organization</Label>
                <Input
                  id="contact-company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  autoComplete="organization"
                  placeholder="Optional farm or company name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Preferred way to reply
              </Label>
              <div className="flex flex-wrap gap-2">
                {REPLY_PREFERENCES.map(({ id, label, icon: Icon }) => {
                  const active = formData.preferredReply === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, preferredReply: id })
                      }
                      aria-pressed={active}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 3: Farm / Location Context (Optional, speeds up quotes) */}
          <div className="space-y-4 rounded-xl border border-border/80 bg-muted/25 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                3. Farm & Project Context (Optional)
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Helps us prepare pricing faster
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-area" className="text-xs">
                Plot / Farm Size
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_AREA_PRESETS.map((preset) => {
                  const active = formData.areaSize === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          areaSize: active ? "" : preset,
                        })
                      }
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary/10 font-semibold text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
              <Input
                id="contact-area"
                value={formData.areaSize}
                onChange={(e) =>
                  setFormData({ ...formData, areaSize: e.target.value })
                }
                placeholder="e.g., 3 acres or 8×24m greenhouse"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-county" className="text-xs">
                  County / Nearest Town
                </Label>
                <Input
                  id="contact-county"
                  value={formData.county}
                  onChange={(e) =>
                    setFormData({ ...formData, county: e.target.value })
                  }
                  placeholder="e.g., Nakuru, Kiambu, Meru"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-crop-water" className="text-xs">
                  Crop & Water Source
                </Label>
                <Input
                  id="contact-crop-water"
                  value={formData.cropAndWater}
                  onChange={(e) =>
                    setFormData({ ...formData, cropAndWater: e.target.value })
                  }
                  placeholder="e.g., Tomatoes, tank / borehole"
                />
              </div>
            </div>
          </div>

          {/* Step 4: Subject & Message */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-subject">Subject</Label>
              <Input
                id="contact-subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder={activeTopic.defaultSubject}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-message">
                Message / Project Requirements{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="contact-message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                required
                placeholder={activeTopic.messagePlaceholder}
                rows={4}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button
              type="submit"
              className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold sm:flex-1"
              disabled={isSubmitting}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Sending Inquiry..." : "Submit Inquiry"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                openDirectWhatsApp(
                  buildWhatsAppSummary(),
                  activeTopic.channel,
                  "contact form instant WhatsApp button",
                )
              }
              className="h-12 w-full border-[hsl(var(--dt-whatsapp)/0.45)] text-foreground hover:border-[hsl(var(--dt-whatsapp))] hover:bg-[hsl(var(--dt-whatsapp)/0.08)] hover:text-foreground sm:w-auto sm:px-6"
            >
              <MessageCircle className="mr-2 h-4 w-4 text-[hsl(var(--dt-whatsapp))]" />
              Send via WhatsApp
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleContactForm;
