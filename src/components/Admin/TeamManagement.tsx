import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  Briefcase,
  Compass,
  Crown,
  Download,
  Edit,
  ExternalLink,
  Grid3X3,
  Linkedin,
  List,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";
import {
  buildCsvContent,
  buildWhatsAppChatUrl,
  inferTeamDepartment,
  type TeamDepartment,
} from "@/lib/adminContactHelpers";
import { uploadAdminPublicImage } from "@/lib/adminMediaUpload";
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
import { Textarea } from "@/components/ui/textarea";

interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio: string | null;
  image_url: string | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  featured: boolean | null;
  created_at: string;
}

interface TeamFormState {
  name: string;
  position: string;
  bio: string;
  image_url: string;
  linkedin_url: string;
  email: string;
  phone: string;
  featured: boolean;
}

type TeamFilter = "all" | "featured" | TeamDepartment;
type TeamSort = "featured_first" | "newest" | "name_asc";

const EMPTY_MEMBER: TeamFormState = {
  name: "",
  position: "",
  bio: "",
  image_url: "",
  linkedin_url: "",
  email: "",
  phone: "",
  featured: false,
};

const ROLE_PRESETS = [
  "Chief Irrigation Engineer",
  "Senior Hydraulic Engineer",
  "Agronomist & Drip Specialist",
  "Field Installation Technician",
  "Solar Pumping Specialist",
  "Sales & Systems Advisor",
];

const DEPARTMENT_META: Record<
  TeamDepartment,
  { label: string; className: string }
> = {
  leadership: {
    label: "Leadership",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  engineering: {
    label: "Engineering & Field",
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  sales: {
    label: "Sales & Advisory",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  operations: {
    label: "Operations",
    className: "border-border bg-muted text-muted-foreground",
  },
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("") || "DT";

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filter, setFilter] = useState<TeamFilter>("all");
  const [sortBy, setSortBy] = useState<TeamSort>("featured_first");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<TeamFormState>(EMPTY_MEMBER);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  const { toast } = useToast();

  const fetchTeamMembers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("team")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeamMembers((data || []) as TeamMember[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load team directory";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const stats = useMemo(() => {
    let featured = 0;
    let engineering = 0;
    let contactReady = 0;
    let linkedInCount = 0;

    for (const m of teamMembers) {
      if (m.featured) featured += 1;
      if (inferTeamDepartment(m.position) === "engineering") engineering += 1;
      if (m.phone?.trim() || m.email?.trim()) contactReady += 1;
      if (m.linkedin_url?.trim()) linkedInCount += 1;
    }

    return {
      total: teamMembers.length,
      featured,
      engineering,
      contactReady,
      linkedInCount,
    };
  }, [teamMembers]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = teamMembers.filter((m) => {
      const dept = inferTeamDepartment(m.position);
      if (filter === "featured" && !m.featured) return false;
      if (filter !== "all" && filter !== "featured" && dept !== filter) return false;

      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.position.toLowerCase().includes(q) ||
        (m.bio || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q) ||
        (m.phone || "").toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === "featured_first") {
        const diff = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [teamMembers, searchQuery, filter, sortBy]);

  const openCreateModal = () => {
    setEditingMember(null);
    setFormData(EMPTY_MEMBER);
    setFormOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name || "",
      position: member.position || "",
      bio: member.bio || "",
      image_url: member.image_url || "",
      linkedin_url: member.linkedin_url || "",
      email: member.email || "",
      phone: member.phone || "",
      featured: Boolean(member.featured),
    });
    setFormOpen(true);
  };

  const closeFormModal = () => {
    setFormOpen(false);
    setEditingMember(null);
    setFormData(EMPTY_MEMBER);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadAdminPublicImage(file, "team");
      setFormData((prev) => ({ ...prev, image_url: url }));
      toast({ title: "Portrait Uploaded" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload Failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.position.trim()) {
      toast({
        title: "Missing Required Details",
        description: "Name and Role / Position are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        position: formData.position.trim(),
        bio: formData.bio.trim() || null,
        image_url: formData.image_url.trim() || null,
        linkedin_url: formData.linkedin_url.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        featured: formData.featured,
      };

      if (editingMember) {
        const { error } = await supabase
          .from("team")
          .update(payload)
          .eq("id", editingMember.id);
        if (error) throw error;
        toast({ title: "Profile Updated", description: `${payload.name} updated.` });
      } else {
        const { error } = await supabase.from("team").insert([payload]);
        if (error) throw error;
        toast({ title: "Team Member Added", description: `${payload.name} added.` });
      }

      closeFormModal();
      await fetchTeamMembers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save member";
      toast({ title: "Save Failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeatured = async (member: TeamMember, nextVal: boolean) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, featured: nextVal } : m)),
    );
    const { error } = await supabase
      .from("team")
      .update({ featured: nextVal })
      .eq("id", member.id);

    if (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
      fetchTeamMembers();
      return;
    }
    toast({
      title: nextVal ? "Added to Featured Leadership" : "Removed from Featured",
      description: member.name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from("team")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw error;
      toast({ title: "Member Removed", description: `${deleteTarget.name} removed.` });
      setDeleteTarget(null);
      await fetchTeamMembers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleWhatsAppMember = (member: TeamMember) => {
    const waUrl = buildWhatsAppChatUrl(
      member.phone,
      `Hi ${member.name.split(" ")[0] || member.name}, connecting with you from DripTech HQ.`,
    );
    if (!waUrl) return;
    openTrackedWhatsApp(waUrl, "admin_team_directory");
  };

  const handleExportCsv = () => {
    const csv = buildCsvContent(
      ["Name", "Position", "Department", "Email", "Phone", "LinkedIn", "Featured"],
      filteredMembers.map((m) => [
        m.name,
        m.position,
        DEPARTMENT_META[inferTeamDepartment(m.position)].label,
        m.email,
        m.phone,
        m.linkedin_url,
        m.featured ? "Yes" : "No",
      ]),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driptech-team-directory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported Team Directory CSV" });
  };

  if (loading) {
    return (
      <Card className="border-border/70">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading team directory...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Team Directory Studio
              </h2>
              <Badge variant="outline" className="border-primary/30 text-primary">
                {stats.total} Profiles
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Organize leadership, irrigation engineers, field technicians, and direct client contacts powering /team.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/team" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Live /team Page
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={fetchTeamMembers}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredMembers.length === 0}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
          <Button size="sm" onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Team Member
          </Button>
        </div>
      </div>

      {/* 4 Live KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Profiles
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Published & internal staff</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Featured Leadership
            </CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.featured}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Highlighted on About & /team</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Engineering & Field
            </CardTitle>
            <Compass className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.engineering}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Engineers, agronomists & techs</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Direct Contact Ready
            </CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.contactReady}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.linkedInCount} LinkedIn profile(s) linked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-border/70">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, role, bio, phone, or email..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as TeamSort)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured_first">Featured First</SelectItem>
                  <SelectItem value="newest">Newest Added</SelectItem>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  className="h-8 px-2.5"
                  onClick={() => setViewMode("grid")}
                  title="Card Grid view"
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
                { key: "all", label: "All Team" },
                { key: "featured", label: "Featured" },
                { key: "leadership", label: "Leadership" },
                { key: "engineering", label: "Engineering & Field" },
                { key: "sales", label: "Sales & Advisory" },
                { key: "operations", label: "Operations" },
              ] as Array<{ key: TeamFilter; label: string }>
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
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Directory Content */}
      {filteredMembers.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No matching team profiles</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mb-4">
              {searchQuery || filter !== "all"
                ? "Try clearing your search or department filter."
                : "Add engineers, agronomists, technicians, and sales leads to populate /team."}
            </p>
            {!searchQuery && filter === "all" && (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add First Team Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const dept = inferTeamDepartment(member.position);
            const deptStyle = DEPARTMENT_META[dept];
            const hasPhone = Boolean(buildWhatsAppChatUrl(member.phone));

            return (
              <Card
                key={member.id}
                className="border-border/80 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        {member.image_url ? (
                          <img
                            src={member.image_url}
                            alt={member.name}
                            className="h-14 w-14 rounded-2xl object-cover border border-border"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-base border border-primary/20">
                            {getInitials(member.name)}
                          </div>
                        )}
                        {member.featured && (
                          <span
                            title="Featured leadership member"
                            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm"
                          >
                            <Star className="h-3 w-3 fill-current" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{member.name}</CardTitle>
                        <CardDescription className="text-xs font-medium text-foreground/80 mt-0.5 truncate">
                          {member.position}
                        </CardDescription>
                        <Badge
                          variant="outline"
                          className={`mt-1.5 text-[10px] ${deptStyle.className}`}
                        >
                          {deptStyle.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-3 min-h-[2.75rem] leading-relaxed">
                    {member.bio || "No team bio provided yet — click Edit to add irrigation specialties and certifications."}
                  </p>

                  {/* Contact Summary + Direct Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {hasPhone && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px] border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() => handleWhatsAppMember(member)}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        WhatsApp
                      </Button>
                    )}
                    {member.phone && (
                      <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-[11px]" asChild>
                        <a href={`tel:${member.phone}`}>
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </a>
                      </Button>
                    )}
                    {member.email && (
                      <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-[11px]" asChild>
                        <a href={`mailto:${member.email}`}>
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </a>
                      </Button>
                    )}
                    {member.linkedin_url && (
                      <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-[11px]" asChild>
                        <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-3 w-3 mr-1" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>

                <div className="flex items-center justify-between gap-2 border-t border-border/60 px-4 py-2.5 bg-muted/20">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                    <Switch
                      checked={Boolean(member.featured)}
                      onCheckedChange={(v) => handleToggleFeatured(member, v)}
                      aria-label={`Toggle featured for ${member.name}`}
                    />
                    <span>Featured</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => openEditModal(member)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(member)}
                      title="Delete member"
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
                  <TableHead>Member</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>LinkedIn</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  const deptStyle = DEPARTMENT_META[inferTeamDepartment(member.position)];
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {member.image_url ? (
                            <img
                              src={member.image_url}
                              alt={member.name}
                              className="h-9 w-9 rounded-lg object-cover border border-border"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                              {getInitials(member.name)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-foreground">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.position}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[11px] ${deptStyle.className}`}>
                          {deptStyle.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{member.email || "—"}</div>
                        <div className="text-muted-foreground">{member.phone || ""}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {member.linkedin_url ? (
                          <a
                            href={member.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <Linkedin className="h-3.5 w-3.5" />
                            Profile
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(member.featured)}
                          onCheckedChange={(v) => handleToggleFeatured(member, v)}
                          aria-label={`Toggle featured for ${member.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditModal(member)}
                            title="Edit member"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(member)}
                            title="Delete member"
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

      {/* Add / Edit Team Member Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && closeFormModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              {editingMember ? `Edit Profile: ${editingMember.name}` : "Add Team Member"}
            </DialogTitle>
            <DialogDescription>
              Manage public profile portrait, irrigation engineering credentials, and contact channels.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Avatar Upload + URL Strip */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-border bg-muted/25 p-3.5">
              <div className="relative shrink-0">
                {formData.image_url ? (
                  <>
                    <img
                      src={formData.image_url}
                      alt="Profile preview"
                      className="h-20 w-20 rounded-2xl object-cover border border-border"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={() => setFormData((p) => ({ ...p, image_url: "" }))}
                      title="Remove portrait"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-lg border border-dashed border-primary/30">
                    {formData.name ? getInitials(formData.name) : "DT"}
                  </div>
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Label
                    htmlFor="team-photo-upload"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        Upload Portrait
                      </>
                    )}
                    <input
                      id="team-photo-upload"
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </Label>
                  <span className="text-[11px] text-muted-foreground">PNG, JPG or WebP up to 5MB</span>
                </div>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="Or paste direct image URL (https://...)"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="team-name">Full Name *</Label>
                <Input
                  id="team-name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Eng. Samuel Mwangi"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="team-position">Position / Title *</Label>
                <Input
                  id="team-position"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Senior Hydraulic Engineer"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ROLE_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => setFormData((p) => ({ ...p, position: preset }))}
                >
                  {preset}
                </Button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="team-bio">Professional Bio & Specialties</Label>
              <Textarea
                id="team-bio"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Summarize solar borehole sizing expertise, years in Kenyan horticulture, EBK/agronomy qualifications..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="team-email">Work Email</Label>
                <Input
                  id="team-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@driptech.co.ke"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="team-phone">Phone / WhatsApp</Label>
                <Input
                  id="team-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+254 7XX XXX XXX"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="team-linkedin">LinkedIn Profile URL</Label>
              <Input
                id="team-linkedin"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) =>
                  setFormData({ ...formData, linkedin_url: e.target.value })
                }
                placeholder="https://www.linkedin.com/in/..."
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3.5 py-2.5">
              <div>
                <Label htmlFor="team-featured" className="cursor-pointer font-medium">
                  Featured Leadership Member
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display prominently in leadership spotlight blocks across public pages.
                </p>
              </div>
              <Switch
                id="team-featured"
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, featured: checked })
                }
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={closeFormModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {saving ? "Saving..." : editingMember ? "Update Profile" : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Delete <strong>{deleteTarget?.name}</strong> from the directory? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              Delete Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;
