import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  Building,
  CheckCircle2,
  Columns,
  Compass,
  Download,
  Edit,
  ExternalLink,
  Eye,
  Grid3X3,
  Image as ImageIcon,
  List,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  Upload,
  User,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isIrrigationRelatedContent } from "@/lib/irrigationContent";
import {
  buildCsvContent,
  inferIrrigationSystemType,
  parseAcreageFromText,
  parseImpactHighlights,
} from "@/lib/adminContactHelpers";
import { uploadAdminPublicImage } from "@/lib/adminMediaUpload";
import type { EngineeringReportSeed } from "@/lib/engineeringReportEngine";
import AISuccessStoryGenerator from "./AI/AISuccessStoryGenerator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface SuccessStory {
  id: string;
  title: string;
  description: string | null;
  client_name: string;
  client_company: string | null;
  image_url: string | null;
  before_image: string | null;
  after_image: string | null;
  results: string | null;
  featured: boolean | null;
  created_at: string;
}

interface StoryFormState {
  title: string;
  description: string;
  client_name: string;
  client_company: string;
  image_url: string;
  before_image: string;
  after_image: string;
  results: string;
  featured: boolean;
}

type StoryFilter = "all" | "featured" | "before_after" | "public_visible" | "needs_keyword";
type StorySort = "newest" | "title_asc" | "featured_first";

interface SuccessStoriesManagementProps {
  onStartEngineeringReport?: (seed: EngineeringReportSeed) => void;
}

const EMPTY_STORY: StoryFormState = {
  title: "",
  description: "",
  client_name: "",
  client_company: "",
  image_url: "",
  before_image: "",
  after_image: "",
  results: "",
  featured: false,
};

const QUICK_IMPACT_SNIPPETS = [
  "45% water consumption reduction",
  "35% crop yield increase per acre",
  "Full solar pumping zero-fuel operation",
  "Investment payback within 2 harvest seasons",
  "Uniform pressure across all sub-blocks",
];

const MEDIA_SLOTS: Array<{
  field: "image_url" | "before_image" | "after_image";
  label: string;
  hint: string;
}> = [
  {
    field: "image_url",
    label: "Primary Showcase Cover",
    hint: "Displayed on case study cards and social previews.",
  },
  {
    field: "before_image",
    label: "Before Installation Photo",
    hint: "Original site, dry field, or flood-irrigated baseline.",
  },
  {
    field: "after_image",
    label: "After Commissioning Photo",
    hint: "Installed drip/sprinkler/solar system & healthy crop stand.",
  },
];

const SuccessStoriesManagement: React.FC<SuccessStoriesManagementProps> = ({
  onStartEngineeringReport,
}) => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filter, setFilter] = useState<StoryFilter>("all");
  const [sortBy, setSortBy] = useState<StorySort>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [formTab, setFormTab] = useState<string>("narrative");
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const [formData, setFormData] = useState<StoryFormState>(EMPTY_STORY);

  const [previewStory, setPreviewStory] = useState<SuccessStory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SuccessStory | null>(null);

  const { toast } = useToast();

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("success_stories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStories((data || []) as SuccessStory[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load success stories";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const stats = useMemo(() => {
    let featured = 0;
    let beforeAfter = 0;
    let publicVisible = 0;

    for (const s of stories) {
      if (s.featured) featured += 1;
      if (s.before_image && s.after_image) beforeAfter += 1;
      if (isIrrigationRelatedContent(s.title, s.description, s.client_company)) {
        publicVisible += 1;
      }
    }

    return {
      total: stories.length,
      featured,
      beforeAfter,
      publicVisible,
      needsKeyword: stories.length - publicVisible,
    };
  }, [stories]);

  const filteredStories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = stories.filter((story) => {
      const visible = isIrrigationRelatedContent(
        story.title,
        story.description,
        story.client_company,
      );
      if (filter === "featured" && !story.featured) return false;
      if (filter === "before_after" && !(story.before_image && story.after_image)) {
        return false;
      }
      if (filter === "public_visible" && !visible) return false;
      if (filter === "needs_keyword" && visible) return false;

      if (!q) return true;
      return (
        story.title.toLowerCase().includes(q) ||
        story.client_name.toLowerCase().includes(q) ||
        (story.client_company || "").toLowerCase().includes(q) ||
        (story.description || "").toLowerCase().includes(q) ||
        (story.results || "").toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === "title_asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "featured_first") {
        const diff = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
        if (diff !== 0) return diff;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [stories, searchQuery, filter, sortBy]);

  const openCreateModal = () => {
    setEditingStory(null);
    setFormData(EMPTY_STORY);
    setFormTab("narrative");
    setFormOpen(true);
  };

  const openEditModal = (story: SuccessStory) => {
    setEditingStory(story);
    setFormData({
      title: story.title || "",
      description: story.description || "",
      client_name: story.client_name || "",
      client_company: story.client_company || "",
      image_url: story.image_url || "",
      before_image: story.before_image || "",
      after_image: story.after_image || "",
      results: story.results || "",
      featured: Boolean(story.featured),
    });
    setFormTab("narrative");
    setFormOpen(true);
  };

  const closeFormModal = () => {
    setFormOpen(false);
    setEditingStory(null);
    setFormData(EMPTY_STORY);
  };

  const handleAIGenerated = (data: {
    title: string;
    description: string;
    client_name: string;
    client_company: string;
    results: string;
  }) => {
    setEditingStory(null);
    setFormData({
      ...EMPTY_STORY,
      title: data.title || "",
      description: data.description || "",
      client_name: data.client_name || "",
      client_company: data.client_company || "",
      results: data.results || "",
    });
    setFormTab("narrative");
    setFormOpen(true);
    toast({
      title: "AI Case Study Drafted",
      description: "Review metrics and attach field photography before publishing.",
    });
  };

  const handleSlotUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: "image_url" | "before_image" | "after_image",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingSlot(field);
    try {
      const url = await uploadAdminPublicImage(file, `success-story-${field}`);
      setFormData((prev) => ({ ...prev, [field]: url }));
      toast({ title: "Image Uploaded", description: "Photo attached to case study." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Image upload failed";
      toast({ title: "Upload Failed", description: msg, variant: "destructive" });
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.client_name.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please provide both Story Title and Client Name.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        client_name: formData.client_name.trim(),
        client_company: formData.client_company.trim() || null,
        image_url: formData.image_url.trim() || null,
        before_image: formData.before_image.trim() || null,
        after_image: formData.after_image.trim() || null,
        results: formData.results.trim() || null,
        featured: formData.featured,
      };

      if (editingStory) {
        const { error } = await supabase
          .from("success_stories")
          .update(payload)
          .eq("id", editingStory.id);
        if (error) throw error;
        toast({ title: "Case Study Updated" });
      } else {
        const { error } = await supabase.from("success_stories").insert([payload]);
        if (error) throw error;
        toast({ title: "Case Study Published" });
      }

      closeFormModal();
      await fetchStories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save case study";
      toast({ title: "Save Failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeatured = async (story: SuccessStory, nextVal: boolean) => {
    setStories((prev) =>
      prev.map((s) => (s.id === story.id ? { ...s, featured: nextVal } : s)),
    );
    const { error } = await supabase
      .from("success_stories")
      .update({ featured: nextVal })
      .eq("id", story.id);

    if (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
      fetchStories();
      return;
    }
    toast({
      title: nextVal ? "Story Featured" : "Removed from Featured",
      description: story.title,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from("success_stories")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw error;
      toast({ title: "Case Study Deleted" });
      setDeleteTarget(null);
      await fetchStories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleLaunchEngReportFromStory = (story: SuccessStory) => {
    if (!onStartEngineeringReport) return;
    const combinedText = `${story.title} ${story.description || ""} ${story.results || ""}`;
    onStartEngineeringReport({
      clientName: story.client_name,
      companyFarmName: story.client_company || undefined,
      acres: parseAcreageFromText(combinedText),
      systemType: inferIrrigationSystemType(story.title, story.description),
      projectTitle: `${story.title} — Replica Engineering Proposal`,
      siteNotes: `Modeled on Verified Case Study: ${story.title}\nClient: ${story.client_name}${
        story.client_company ? ` (${story.client_company})` : ""
      }\nVerified Outcomes:\n${story.results || "N/A"}\n\n${story.description || ""}`,
      reportEdition: "client_proposal",
      sourceModule: "Success Stories",
    });
  };

  const handleExportCsv = () => {
    const csv = buildCsvContent(
      ["Title", "Client Name", "Farm / Company", "Featured", "Public Visible", "Results", "Created"],
      filteredStories.map((s) => [
        s.title,
        s.client_name,
        s.client_company,
        s.featured ? "Yes" : "No",
        isIrrigationRelatedContent(s.title, s.description, s.client_company) ? "Visible" : "Hidden",
        s.results,
        new Date(s.created_at).toISOString().split("T")[0],
      ]),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driptech-success-stories-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported Case Studies CSV" });
  };

  const draftIsPublicVisible = isIrrigationRelatedContent(
    formData.title,
    formData.description,
    formData.client_company,
  );

  if (loading) {
    return (
      <Card className="border-border/70">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading client success stories...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Success Stories Studio
              </h2>
              <Badge variant="outline" className="border-primary/30 text-primary">
                {stats.total} Case Studies
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Curate verified farm case studies, before/after transformations, and measurable ROI metrics synced to /success-stories.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/success-stories" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Live Page
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={fetchStories}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredStories.length === 0}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
          <AISuccessStoryGenerator onGenerate={handleAIGenerated} />
          <Button size="sm" onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Case Study
          </Button>
        </div>
      </div>

      {/* 4 Semantic KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Case Studies
            </CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Recorded client transformations</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Featured Highlights
            </CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.featured}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Pinned across showcases</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Before & After Proof
            </CardTitle>
            <Columns className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.beforeAfter}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Visual site photo pairs</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Public Feed Check
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.publicVisible} / {stats.total}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.needsKeyword > 0
                ? `${stats.needsKeyword} missing irrigation keyword`
                : "All stories eligible publicly"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-border/70">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search story title, client name, farm/company, or results..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as StorySort)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="featured_first">Featured First</SelectItem>
                  <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  className="h-8 px-2.5"
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  className="h-8 px-2.5"
                  onClick={() => setViewMode("table")}
                  title="Table view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { key: "all", label: "All", count: stats.total },
                { key: "featured", label: "Featured", count: stats.featured },
                { key: "before_after", label: "Before & After", count: stats.beforeAfter },
                { key: "public_visible", label: "Public Visible", count: stats.publicVisible },
                { key: "needs_keyword", label: "Needs Keyword", count: stats.needsKeyword },
              ] as Array<{ key: StoryFilter; label: string; count: number }>
            ).map((pill) => (
              <Button
                key={pill.key}
                type="button"
                size="sm"
                variant={filter === pill.key ? "default" : "outline"}
                onClick={() => setFilter(pill.key)}
                className="h-8 text-xs"
              >
                {pill.label}
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    filter === pill.key
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {pill.count}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Story List */}
      {filteredStories.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No matching case studies</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mb-4">
              {searchQuery || filter !== "all"
                ? "Try clearing your filters or search query."
                : "Create your first verified client transformation story or draft one with AI."}
            </p>
            {!searchQuery && filter === "all" && (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-1.5" />
                Create First Case Study
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStories.map((story) => {
            const hero = story.image_url || story.after_image || story.before_image;
            const hasPair = Boolean(story.before_image && story.after_image);
            const publicReady = isIrrigationRelatedContent(
              story.title,
              story.description,
              story.client_company,
            );
            const highlights = parseImpactHighlights(story.results);

            return (
              <Card
                key={story.id}
                className="border-border/80 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="relative h-44 w-full bg-muted/50 border-b border-border/60 overflow-hidden">
                    {hero ? (
                      <img
                        src={hero}
                        alt={story.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Trophy className="h-10 w-10 opacity-35" />
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      {story.featured && (
                        <Badge className="bg-amber-500 text-white text-[11px]">
                          Featured
                        </Badge>
                      )}
                      {hasPair && (
                        <Badge className="bg-background/90 text-foreground border border-border backdrop-blur-sm text-[11px] gap-1">
                          <Columns className="h-3 w-3 text-primary" />
                          Before & After
                        </Badge>
                      )}
                    </div>

                    <div className="absolute bottom-2.5 right-2.5">
                      <Badge
                        variant="outline"
                        className={
                          publicReady
                            ? "bg-emerald-500/90 text-white border-emerald-400 text-[10px]"
                            : "bg-amber-500/90 text-white border-amber-400 text-[10px]"
                        }
                      >
                        {publicReady ? "Public Ready" : "Add Irrigation Keyword"}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-base line-clamp-2 leading-snug">
                      {story.title}
                    </CardTitle>
                    <CardDescription className="text-xs flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-1 text-foreground font-medium">
                        <User className="h-3 w-3 text-primary" />
                        {story.client_name}
                      </span>
                      {story.client_company && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <Building className="h-3 w-3" />
                          {story.client_company}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {story.description || "No detailed project narrative added yet."}
                    </p>

                    {highlights.length > 0 && (
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 space-y-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Measured Farm Outcomes
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {highlights.slice(0, 3).map((item, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-[11px] font-normal border-emerald-500/25 bg-background/80 text-foreground"
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border/60 px-4 py-2.5 bg-muted/20">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                    <Switch
                      checked={Boolean(story.featured)}
                      onCheckedChange={(v) => handleToggleFeatured(story, v)}
                      aria-label={`Toggle featured for ${story.title}`}
                    />
                    <span>Featured</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => setPreviewStory(story)}
                      title="Preview & Before/After comparison"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {onStartEngineeringReport && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-primary"
                        onClick={() => handleLaunchEngReportFromStory(story)}
                        title="Create similar Engineering Report"
                      >
                        <Compass className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => openEditModal(story)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(story)}
                      title="Delete story"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border/70 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Case Study</TableHead>
                  <TableHead>Client / Farm</TableHead>
                  <TableHead>Proof Media</TableHead>
                  <TableHead>Public Check</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStories.map((story) => {
                  const hero = story.image_url || story.after_image || story.before_image;
                  const publicReady = isIrrigationRelatedContent(
                    story.title,
                    story.description,
                    story.client_company,
                  );

                  return (
                    <TableRow key={story.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-14 shrink-0 rounded-md border border-border bg-muted overflow-hidden flex items-center justify-center">
                            {hero ? (
                              <img src={hero} alt={story.title} className="h-full w-full object-cover" />
                            ) : (
                              <Trophy className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate max-w-[230px]">
                              {story.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[230px]">
                              {story.results || story.description || "No summary"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-foreground">{story.client_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {story.client_company || "Individual Grower"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {story.before_image && (
                            <Badge variant="outline" className="text-[10px]">
                              Before
                            </Badge>
                          )}
                          {story.after_image && (
                            <Badge variant="outline" className="text-[10px]">
                              After
                            </Badge>
                          )}
                          {!story.before_image && !story.after_image && (
                            <span className="text-xs text-muted-foreground">Cover only</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            publicReady
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px]"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px]"
                          }
                        >
                          {publicReady ? "Visible" : "Needs Keyword"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(story.featured)}
                          onCheckedChange={(v) => handleToggleFeatured(story, v)}
                          aria-label={`Toggle featured for ${story.title}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setPreviewStory(story)}
                            title="Preview comparison"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {onStartEngineeringReport && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-primary"
                              onClick={() => handleLaunchEngReportFromStory(story)}
                              title="Clone into Engineering Report"
                            >
                              <Compass className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditModal(story)}
                            title="Edit story"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(story)}
                            title="Delete story"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Create / Edit Case Study Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && closeFormModal()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {editingStory ? `Edit: ${editingStory.title}` : "Publish Verified Success Story"}
            </DialogTitle>
            <DialogDescription>
              Capture client farm outcomes, quantified ROI metrics, and before/after visual installation proof.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                draftIsPublicVisible
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              }`}
            >
              {draftIsPublicVisible ? (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    Public visibility passed — includes irrigation terminology and will appear on `/success-stories`.
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Include terms like `drip`, `sprinkler`, `pump`, `greenhouse`, or `irrigation` in the title or story so `/success-stories` displays it automatically.
                  </span>
                </>
              )}
            </div>

            <Tabs value={formTab} onValueChange={setFormTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="narrative">1. Client & Impact Story</TabsTrigger>
                <TabsTrigger value="media">2. Cover & Before/After Media</TabsTrigger>
              </TabsList>

              <TabsContent value="narrative" className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="story-title">Case Study Headline *</Label>
                  <Input
                    id="story-title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., 4-Acre Solar Drip Irrigation System in Naivasha"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="story-client">Client Name *</Label>
                    <Input
                      id="story-client"
                      required
                      value={formData.client_name}
                      onChange={(e) =>
                        setFormData({ ...formData, client_name: e.target.value })
                      }
                      placeholder="e.g., Grace Wanjiku"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="story-company">Farm / Estate / Company</Label>
                    <Input
                      id="story-company"
                      value={formData.client_company}
                      onChange={(e) =>
                        setFormData({ ...formData, client_company: e.target.value })
                      }
                      placeholder="e.g., Rift Valley Fresh Produce"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="story-description">Project Narrative (Challenge → System → Result)</Label>
                  <Textarea
                    id="story-description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe initial water stress or diesel pumping costs, the DripTech hydraulic setup installed, and crop performance after commissioning."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="story-results">Quantified Results & Achievements</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_IMPACT_SNIPPETS.map((snippet) => (
                      <Button
                        key={snippet}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            results: prev.results
                              ? `${prev.results.trim()}\n• ${snippet}`
                              : `• ${snippet}`,
                          }))
                        }
                      >
                        + {snippet}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    id="story-results"
                    rows={3}
                    value={formData.results}
                    onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                    placeholder="• 50% water savings&#10;• 35% onion yield increase&#10;• Zero diesel pumping costs"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3.5 py-2.5">
                  <div>
                    <Label htmlFor="story-featured" className="cursor-pointer font-medium">
                      Featured Case Study
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Highlight prominently on public showcase sliders and featured sections.
                    </p>
                  </div>
                  <Switch
                    id="story-featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, featured: checked })
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {MEDIA_SLOTS.map((slot) => {
                    const value = formData[slot.field];
                    const isUploading = uploadingSlot === slot.field;

                    return (
                      <Card key={slot.field} className="border-border/70">
                        <CardHeader className="p-3.5 pb-2">
                          <CardTitle className="text-sm">{slot.label}</CardTitle>
                          <CardDescription className="text-[11px]">{slot.hint}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 space-y-2.5">
                          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
                            {value ? (
                              <>
                                <img
                                  src={value}
                                  alt={slot.label}
                                  className="h-full w-full object-cover"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-1.5 right-1.5 h-6 w-6 p-0"
                                  onClick={() =>
                                    setFormData((prev) => ({ ...prev, [slot.field]: "" }))
                                  }
                                  title="Clear photo"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            ) : (
                              <ImageIcon className="h-7 w-7 text-muted-foreground/40" />
                            )}
                          </div>

                          <Input
                            value={value}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [slot.field]: e.target.value,
                              }))
                            }
                            placeholder="https://... or upload below"
                            className="h-8 text-xs"
                          />

                          <Label
                            htmlFor={`upload-${slot.field}`}
                            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-primary/40 bg-primary/5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5" />
                                Upload Photo
                              </>
                            )}
                            <input
                              id={`upload-${slot.field}`}
                              type="file"
                              accept="image/*"
                              disabled={Boolean(uploadingSlot)}
                              onChange={(e) => handleSlotUpload(e, slot.field)}
                              className="sr-only"
                            />
                          </Label>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={closeFormModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || Boolean(uploadingSlot)}>
                {saving ? "Saving..." : editingStory ? "Save Changes" : "Publish Case Study"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Visual Before/After & Narrative Preview Dialog */}
      <Dialog open={Boolean(previewStory)} onOpenChange={(open) => !open && setPreviewStory(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {previewStory && (
            <>
              <DialogHeader>
                <DialogTitle>{previewStory.title}</DialogTitle>
                <DialogDescription>
                  {previewStory.client_name}
                  {previewStory.client_company ? ` · ${previewStory.client_company}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {(previewStory.before_image || previewStory.after_image) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Badge variant="outline">Before Installation</Badge>
                      <div className="aspect-video overflow-hidden rounded-xl border border-border bg-muted flex items-center justify-center">
                        {previewStory.before_image ? (
                          <img
                            src={previewStory.before_image}
                            alt="Before installation"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">No Before Photo</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Badge className="bg-emerald-600 text-white">After Commissioning</Badge>
                      <div className="aspect-video overflow-hidden rounded-xl border border-border bg-muted flex items-center justify-center">
                        {previewStory.after_image || previewStory.image_url ? (
                          <img
                            src={previewStory.after_image || previewStory.image_url || ""}
                            alt="After commissioning"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">No After Photo</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : previewStory.image_url ? (
                  <div className="aspect-video overflow-hidden rounded-xl border border-border bg-muted">
                    <img
                      src={previewStory.image_url}
                      alt={previewStory.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}

                {previewStory.description && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {previewStory.description}
                  </div>
                )}

                {previewStory.results && (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Verified Impact Metrics
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {parseImpactHighlights(previewStory.results).map((metric, idx) => (
                        <Badge key={idx} variant="secondary" className="font-medium">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                {onStartEngineeringReport && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const target = previewStory;
                      setPreviewStory(null);
                      handleLaunchEngReportFromStory(target);
                    }}
                  >
                    <Compass className="h-4 w-4 mr-1.5" />
                    Replicate in Engineering Studio
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => {
                    const target = previewStory;
                    setPreviewStory(null);
                    openEditModal(target);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit Story
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Case Study</DialogTitle>
            <DialogDescription>
              Permanently remove <strong>{deleteTarget?.title}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              Delete Story
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuccessStoriesManagement;
