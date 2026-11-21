import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Breadcrumbs from "@/components/Layout/Breadcrumbs";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
import SEOHead from "@/components/common/SEOHead";
import QuoteModal from "@/components/Home/QuoteModal";
import { VideoCard } from "@/components/Video/VideoCard";
import { VideoPlayerModal } from "@/components/Video/VideoPlayerModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { dataService } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { SITE_COMPANY } from "@/config/company";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import {
  inferVideoTopic,
  VideoItem,
} from "@/lib/videoUtils";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Download,
  Droplets,
  Eye,
  Filter,
  Gauge,
  MessageCircle,
  Play,
  Ruler,
  Search,
  Settings,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";

interface GuideProduct {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  model_number?: string | null;
  installation_guide_url?: string | null;
  maintenance_manual_url?: string | null;
  video_url?: string | null;
}

const INSTALLATION_STEPS = [
  {
    step: "01",
    icon: Ruler,
    title: "Site & Water Audit",
    description:
      "Measure plot dimensions, elevation slope, crop spacing, and water yield before cutting pipes or digging trenches.",
  },
  {
    step: "02",
    icon: Filter,
    title: "Headworks & Filtration",
    description:
      "Mount disc/screen filters, bypass venturi fertigation, non-return valves, and isolation gate valves on a stable manifold.",
  },
  {
    step: "03",
    icon: Droplets,
    title: "Mainline & Lateral Layout",
    description:
      "Trench HDPE/PVC mainlines cleanly, punch 16mm grommets straight, unroll driplines emitter-up, and fit end caps.",
  },
  {
    step: "04",
    icon: ShieldCheck,
    title: "Flush & Pressure Test",
    description:
      "Flush mainline dirt out before sealing lateral ends, then verify uniform drip or rain gun pressure across each block.",
  },
] as const;

const SYSTEM_PLAYBOOKS = [
  {
    id: "drip",
    badge: "Drip Kits & Tape",
    title: "Drip Irrigation Field Setup Checklist",
    summary:
      "Follow this sequence when laying 15cm, 20cm, or 30cm driplines on raised vegetable or orchard beds.",
    steps: [
      "Raise compacted planting beds first so driplines sit straight along the wetted strip without sagging.",
      "Elevate your storage tank at least 1.5m–3m for gravity kits, or size a booster pump for 1.0–1.5 bar.",
      "Flush the HDPE mainline and sub-main before fitting 16mm end-caps so soil particles do not block emitters.",
      "Keep mini-valves per block so you can rotate irrigation zones evenly without dropping head pressure.",
    ],
  },
  {
    id: "dam-liner",
    badge: "HDPE Geomembranes",
    title: "Dam Liner & Water Pan Preparation",
    summary:
      "Excavation smoothness and anchor trench depth determine liner lifespan on Kenyan farms.",
    steps: [
      "Slant walls safely (1:1 or 1.5:1 depending on soil stability) and remove sharp rocks, roots, and hard clods.",
      "Dig a 30–50cm wide by 50cm deep perimeter anchor trench set back from the pan rim.",
      "For multi-sheet dams (0.5mm, 0.75mm, or 1.0mm HDPE), book certified hot-wedge welding rather than cold glue.",
      "Keep a minimum 15% water depth or cover floor with fine sand where livestock or sunlight exposure is severe.",
    ],
  },
  {
    id: "rainhose",
    badge: "32mm / 40mm Rainhose",
    title: "Rainhose & Mini-Sprinkler Line Setup",
    summary:
      "Fast overhead irrigation for nurseries, pasture, kales, and onions where uniform spray coverage is needed.",
    steps: [
      "Connect 32mm rainhose via a lock-type take-off connector and butterfly ball valve on a HDPE sub-main.",
      "Use adequate pumping pressure (typically 1.5–2.5 bar) so spray arcs reach 3m–4m cleanly per line.",
      "Keep laser-punched spray holes facing upward and anchor the tail with a folded clamp or end-plug.",
    ],
  },
  {
    id: "pumps",
    badge: "Borehole & Solar Pumps",
    title: "Pump & Filtration Protection Checks",
    summary:
      "Protect your impeller, drippers, and motors before first start-up.",
    steps: [
      "Install a 120-mesh disc or screen filter on the pump delivery side before entering drip sub-mains.",
      "Fit a foot valve and primer tee on surface centrifugal pumps so the suction line never runs dry.",
      "Install an air-release valve on high points and a pressure relief valve to protect thin-wall drip tape.",
    ],
  },
] as const;

const INTERACTIVE_ENGINEERING_GUIDES = [
  {
    title: "1-Acre Drip Irrigation Layout & BOM Guide",
    desc: "Complete mainline, sub-main, filtration, and dripline layout for 1-acre vegetable and fruit farms.",
    to: "/one-acre-drip-irrigation-system-kenya",
  },
  {
    title: "How to Choose Dripline Emitter Spacing",
    desc: "Selecting 15cm, 20cm, or 30cm emitter spacing and wall thickness for onions, tomatoes, and orchards.",
    to: "/how-to-choose-dripline-spacing-kenya",
  },
  {
    title: "Pump & Solar PV Sizing Calculator (Interactive)",
    desc: "Size borehole or surface pumps, Hazen-Williams pipe friction loss, TDH, DC cable mm², and solar PV panel strings with live pump matches.",
    to: "/pump-solar-calculator-kenya",
  },
  {
    title: "How to Read Pump Curves & 70–120% BEP (Interactive)",
    desc: "Plot Shutoff Head, BEP Preferred Operating Range, System Resistance intersections, and 3-point OEM curves to stop burnout.",
    to: "/how-to-read-pump-curves-kenya",
  },
  {
    title: "Pump & Motor Installation, Megger & Fault Guide",
    desc: "25 ft check-valve rules, cooling shrouds, 500V DC Megger MΩ thresholds, NEMA phase balance, grounding & solar controller faults.",
    to: "/pump-motor-installation-maintenance-kenya",
  },
  {
    title: "Irrigation Pump Sizing & Total Dynamic Head",
    desc: "Calculating flow rate (m³/hr) and total dynamic head (TDH) for boreholes, rivers, and raised tanks.",
    to: "/irrigation-pump-sizing-kenya",
  },
  {
    title: "Greenhouse Drip & Misting Setup Guide",
    desc: "Fertigation venturi installation, manifold zoning, and micro-climate misting for Kenyan greenhouses.",
    to: "/greenhouse-drip-irrigation-kenya",
  },
  {
    title: "Solar Irrigation Pumping Systems Guide",
    desc: "Sizing PV arrays, MPPT controllers, and submersible/surface solar pumps for off-grid farms.",
    to: "/solar-irrigation-pumps-kenya",
  },
  {
    title: "Pre-Installation Quotation & Site Checklist",
    desc: "Water quality, slope, soil type, and source measurements to prepare before ordering equipment.",
    to: "/irrigation-quotation-checklist-kenya",
  },
] as const;

const InstallationGuides = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<GuideProduct[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activePlaybookId, setActivePlaybookId] = useState<string>("drip");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideoTopic, setSelectedVideoTopic] = useState("all");

  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const [pdfModal, setPdfModal] = useState({
    isOpen: false,
    url: "",
    title: "",
  });
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    url: "",
    title: "",
  });

  useEffect(() => {
    const fetchInstallationResources = async () => {
      try {
        const [productsData, videosData] = await Promise.all([
          dataService.getProducts({}).catch(() => []),
          dataService.getVideos({ sortBy: "featured" }).catch(() => []),
        ]);

        const productsWithGuides = (Array.isArray(productsData) ? productsData : []).filter(
          (p: GuideProduct) =>
            p.installation_guide_url || p.video_url || p.maintenance_manual_url,
        );

        const cleanVideos = (Array.isArray(videosData) ? videosData : []) as VideoItem[];

        setProducts(productsWithGuides);
        setVideos(cleanVideos);
      } catch (error) {
        console.error("Error fetching installation resources:", error);
        toast({
          title: "Error",
          description: "Unable to load some installation guides right now.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchInstallationResources();
  }, [toast]);

  const activePlaybook =
    SYSTEM_PLAYBOOKS.find((p) => p.id === activePlaybookId) || SYSTEM_PLAYBOOKS[0];

  const filteredVideos = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return videos.filter((video) => {
      const matchesTopic =
        selectedVideoTopic === "all" || inferVideoTopic(video) === selectedVideoTopic;
      if (!matchesTopic) return false;
      if (!q) return true;
      const hay = [
        video.title,
        video.description || "",
        ...(Array.isArray(video.tags) ? video.tags : []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [videos, searchTerm, selectedVideoTopic]);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.model_number || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q),
    );
  }, [products, searchTerm]);

  const filteredInteractiveGuides = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return INTERACTIVE_ENGINEERING_GUIDES;
    return INTERACTIVE_ENGINEERING_GUIDES.filter(
      (g) => g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q),
    );
  }, [searchTerm]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "drip_irrigation":
        return Droplets;
      case "sprinkler_systems":
        return Gauge;
      case "filtration_systems":
        return Filter;
      case "control_systems":
        return Settings;
      default:
        return Wrench;
    }
  };

  const handleWatchFieldVideo = (video: VideoItem) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);

    void supabase
      .from("videos")
      .update({ views: (video.views || 0) + 1 })
      .eq("id", video.id);
  };

  const handleDownloadDocument = async (
    url: string,
    filename: string,
  ) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleViewDocument = (url: string, title: string, fileType?: string | null) => {
    const ext = (fileType || "").toLowerCase();
    if (["mp4", "avi", "mov", "webm"].includes(ext)) {
      handleWatchFieldVideo({
        id: `doc-${title}`,
        title,
        video_url: url,
      });
      return;
    }
    if (ext === "pdf") {
      setPdfModal({ isOpen: true, url, title });
      return;
    }
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      setImageModal({ isOpen: true, url, title });
      return;
    }
    void handleDownloadDocument(url, title);
  };

  const hasAnySearchOrFilter =
    Boolean(searchTerm.trim()) ||
    selectedVideoTopic !== "all";

  const hasZeroResultsAcrossAll =
    !loading &&
    filteredVideos.length === 0 &&
    filteredProducts.length === 0 &&
    filteredInteractiveGuides.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead
        title={`Drip Irrigation Installation Guides & Field Videos | ${SITE_COMPANY.name}`}
        description="Watch real field installation videos, follow step-by-step drip and dam liner setup checklists, and explore engineering sizing guides for Kenyan farms."
        url={`${SITE_COMPANY.url}/installation-guides`}
        schema={[
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How to Install a Drip Irrigation System",
            description:
              "Practical step-by-step workflow for planning, setting up filtration headworks, laying driplines, and pressure testing farm irrigation in Kenya.",
            step: INSTALLATION_STEPS.map((s, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: s.title,
              text: s.description,
            })),
          },
        ]}
      />
      <Header />

      <div className="dt-container">
        <Breadcrumbs />
      </div>

      <main id="main-content" tabIndex={-1} className="flex-1 pb-16">
        {/* Editorial Hero */}
        <section className="pb-10 pt-2 sm:pb-12">
          <div className="dt-container">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Field Setup &amp; Technical Manuals</span>
                  </div>

                  <h1 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                    Irrigation{" "}
                    <span className="text-primary">Installation Guides</span>
                  </h1>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Watch real field setup videos, review practical pipe and dam liner
                    checklists, and read engineering sizing guides designed for Kenyan
                    growing conditions.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/videos"
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Watch Field Videos ({videos.length})
                  </Link>
                  <Link
                    to="/pump-solar-calculator-kenya"
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                  >
                    <Calculator className="h-4 w-4" />
                    Pump &amp; Solar Calculator
                  </Link>
                  <Link
                    to="/technician-services"
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    <Wrench className="h-4 w-4 text-primary" />
                    Book Technician
                  </Link>
                </div>
              </div>

              {/* 4-Step Overview Bar */}
              <div className="mt-8 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
                {INSTALLATION_STEPS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.step}
                      className="rounded-xl border border-border/80 bg-background/70 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="font-mono text-sm font-extrabold text-primary/45">
                          {item.step}
                        </span>
                      </div>
                      <h2 className="mt-3 font-heading text-sm font-bold text-foreground sm:text-base">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Search & Quick Filter Bar */}
        <section className="border-y border-border bg-muted/25 py-6">
          <div className="dt-container">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search guides, videos, dam liners, pumps, or dripline spacing..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-card pl-9 pr-9"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search query"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Select
                value={selectedVideoTopic}
                onValueChange={setSelectedVideoTopic}
              >
                <SelectTrigger className="w-full bg-card md:w-48">
                  <SelectValue placeholder="System Video Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All System Videos</SelectItem>
                  <SelectItem value="drip-emitters">Driplines &amp; Emitters</SelectItem>
                  <SelectItem value="rainhose">Rainhose</SelectItem>
                  <SelectItem value="dam-liners">HDPE Dam Liners</SelectItem>
                  <SelectItem value="sprinklers">Rain Guns &amp; Sprinklers</SelectItem>
                  <SelectItem value="foggers-greenhouse">Foggers &amp; Misting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <div className="dt-container space-y-12 pt-10">
          {/* 1. Real Field Installation Videos (from Video Library / CF D1) */}
          {(loading || filteredVideos.length > 0) && (
            <section aria-labelledby="install-videos-heading">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="dt-section-label mb-1">Video Walkthroughs</p>
                  <h2 id="install-videos-heading" className="dt-section-title">
                    Field Installation &amp; Demo Videos
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Watch actual Kenyan installations for driplines, dam liners, rainhose, and sprinklers.
                  </p>
                </div>
                <Link
                  to="/videos"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline sm:text-sm"
                >
                  Open Full Video Library ({videos.length})
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="animate-pulse border-border bg-card">
                      <div className="aspect-video bg-muted" />
                      <CardContent className="space-y-2.5 p-4">
                        <div className="h-4 w-3/4 rounded bg-muted" />
                        <div className="h-8 rounded bg-muted" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredVideos.slice(0, 8).map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      compact
                      onWatch={handleWatchFieldVideo}
                      whatsappSource="installation guides video"
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 2. Practical System Installation Playbooks */}
          <section aria-labelledby="playbooks-heading">
            <Card className="border-border bg-card">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="dt-section-label mb-1">On-Farm Reference</p>
                    <h2 id="playbooks-heading" className="dt-section-title">
                      Kenyan System Setup Checklists
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Select an irrigation type below for essential site and commissioning steps.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {SYSTEM_PLAYBOOKS.map((playbook) => {
                      const active = playbook.id === activePlaybook.id;
                      return (
                        <button
                          key={playbook.id}
                          type="button"
                          onClick={() => setActivePlaybookId(playbook.id)}
                          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground hover:bg-muted"
                          }`}
                        >
                          {playbook.badge}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-5">
                    <span className="dt-badge-primary">{activePlaybook.badge}</span>
                    <h3 className="mt-3 font-heading text-xl font-bold text-foreground sm:text-2xl">
                      {activePlaybook.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {activePlaybook.summary}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <QuoteModal>
                        <Button
                          type="button"
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Request BOQ for This System
                        </Button>
                      </QuoteModal>
                      <button
                        type="button"
                        onClick={() =>
                          openTrackedWhatsApp(
                            `https://wa.me/${SITE_COMPANY.phonePrimary.replace(/\D/g, "")}?text=${encodeURIComponent(
                              `Hi DripTech! I'm reviewing the ${activePlaybook.title} guide and need assistance with my farm setup.`,
                            )}`,
                            "installation playbook WhatsApp",
                          )
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[hsl(var(--dt-whatsapp)/0.45)] px-3 text-xs font-semibold text-foreground transition-colors hover:bg-[hsl(var(--dt-whatsapp)/0.08)]"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-[hsl(var(--dt-whatsapp))]" />
                        Ask Engineering on WhatsApp
                      </button>
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
                    {activePlaybook.steps.map((step, index) => (
                      <li
                        key={step}
                        className="flex items-start gap-3 rounded-xl border border-border bg-muted/25 p-4"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                            Step 0{index + 1}
                          </span>
                          <p className="mt-1 text-xs leading-relaxed text-foreground sm:text-sm">
                            {step}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 3. Interactive Engineering Manuals */}
          {filteredInteractiveGuides.length > 0 && (
            <section aria-labelledby="engineering-guides-heading">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="dt-section-label mb-1">Written Sizing Manuals</p>
                  <h2 id="engineering-guides-heading" className="dt-section-title">
                    Kenyan Irrigation Design &amp; Installation Manuals
                  </h2>
                </div>
                <Link
                  to="/technical-support"
                  className="text-xs font-bold text-primary hover:underline sm:text-sm"
                >
                  Visit Technical Support →
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredInteractiveGuides.map((guide) => (
                  <Link
                    key={guide.to}
                    to={guide.to}
                    className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <div>
                      <h3 className="font-heading text-base font-bold text-foreground transition-colors group-hover:text-primary sm:text-lg">
                        {guide.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {guide.desc}
                      </p>
                    </div>
                    <span className="mt-4 inline-flex items-center text-xs font-bold text-primary">
                      Read Full Guide
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 4. Product-Specific Manuals (when attached on products) */}
          {!loading && filteredProducts.length > 0 && (
            <section aria-labelledby="product-manuals-heading">
              <h2 id="product-manuals-heading" className="dt-section-title mb-6">
                Product-Specific Guides
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => {
                  const Icon = getCategoryIcon(product.category);
                  return (
                    <Card key={product.id} className="border-border bg-card">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                            <Icon className="h-3.5 w-3.5" />
                            {product.category.replace(/_/g, " ")}
                          </span>
                          {product.model_number && (
                            <Badge variant="outline" className="text-xs">
                              {product.model_number}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="font-heading text-base font-bold">
                          {product.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {product.installation_guide_url && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() =>
                              handleViewDocument(
                                product.installation_guide_url!,
                                `${product.name} Guide`,
                                "pdf",
                              )
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Installation Guide
                          </Button>
                        )}
                        {product.video_url && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() =>
                              handleWatchFieldVideo({
                                id: product.id,
                                title: `${product.name} Setup`,
                                video_url: product.video_url!,
                              })
                            }
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Watch Setup Video
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Filtered Empty Search Notice (only when user actively searched/filtered out everything) */}
          {hasAnySearchOrFilter && hasZeroResultsAcrossAll && (
            <Card className="border-border bg-card p-10 text-center">
              <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="font-heading text-xl font-bold text-foreground">
                No Matching Installation Guides Found
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Clear your search or filters to view all field videos, checklists,
                and engineering guides — or reach our engineers directly.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedVideoTopic("all");
                  }}
                >
                  Clear All Filters
                </Button>
                <Link
                  to="/contact?topic=support"
                  className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                >
                  Contact Technical Support
                </Link>
              </div>
            </Card>
          )}

          {/* CTA Section */}
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-start justify-between gap-6 p-6 sm:p-10 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <p className="dt-section-label mb-1">On-Site &amp; Remote Support</p>
                <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                  Need Certified Technician Support on Your Farm?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Book our technicians for field piping, HDPE dam liner hot-wedge
                  welding, greenhouse installations, or trouble-shooting across Kenya.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/technician-services"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                >
                  <Wrench className="h-4 w-4" />
                  Request Installation Service
                </Link>
                <Link
                  to="/contact?topic=support"
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  Contact Technical Support
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <IrrigationKeywords />
      <Footer />

      {/* Shared Field Video Modal */}
      <VideoPlayerModal
        video={selectedVideo}
        open={isVideoModalOpen}
        onOpenChange={(open) => {
          setIsVideoModalOpen(open);
          if (!open) setSelectedVideo(null);
        }}
        relatedVideos={
          selectedVideo
            ? videos.filter((v) => v.id !== selectedVideo.id).slice(0, 3)
            : []
        }
        onSelectVideo={handleWatchFieldVideo}
        whatsappSource="installation guides video modal"
      />

      {/* PDF Modal */}
      {pdfModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4">
          <div className="flex h-full max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="truncate pr-4 font-heading text-base font-bold text-foreground sm:text-lg">
                {pdfModal.title}
              </h3>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDownloadDocument(pdfModal.url, pdfModal.title)
                  }
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  Download
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPdfModal({ isOpen: false, url: "", title: "" })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <iframe
                src={`${pdfModal.url}#view=FitH`}
                className="h-full w-full border-0"
                title={pdfModal.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4">
          <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="truncate pr-4 font-heading text-base font-bold text-foreground sm:text-lg">
                {imageModal.title}
              </h3>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDownloadDocument(imageModal.url, imageModal.title)
                  }
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  Download
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageModal({ isOpen: false, url: "", title: "" })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
              <img
                src={imageModal.url}
                alt={imageModal.title}
                className="max-h-full max-w-full rounded object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallationGuides;
