import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ImageOff, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CandidateImage {
  thumbnail: string;
  original: string;
  title: string;
  source: string;
}

interface ProjectImagePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  existingImages?: string[];
  onSaved?: () => void;
}

// Cap how many photos an admin can attach from one search — keeps the
// project's project_images[] array sane and avoids accidental
// mass-selection.
const MAX_SELECTABLE = 6;

/**
 * Lets an admin search real reference photos (via the same
 * product-image-search edge function → SerpAPI/Serper/SearchApi used
 * for products) and pick one or more that actually match — nothing is
 * assigned automatically. Selected photos are only written to the
 * project once the admin confirms with "Save selected".
 *
 * NOTE: this is for finding generic/reference photos (e.g. illustrating
 * a fitting or crop type). For a project's own real site photos, use
 * the normal "Upload Images" button instead — those are documentation
 * of actual work, not stock/reference images.
 */
const ProjectImagePickerDialog = ({
  open,
  onOpenChange,
  projectId,
  projectName,
  existingImages,
  onSaved,
}: ProjectImagePickerDialogProps) => {
  const [query, setQuery] = useState(projectName);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<CandidateImage[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setQuery(projectName);
      setCandidates([]);
      setSelected([]);
      setError(null);
      runSearch(projectName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectName]);

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "product-image-search",
        { body: { query: q } },
      );
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setCandidates(data?.candidates || []);
      if (!data?.candidates?.length) {
        setError("No confident matches found — try a different search, or skip and upload real photos instead.");
      }
    } catch (e: any) {
      setError(e.message || "Image search failed");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelected = (url: string) => {
    setSelected((prev) => {
      if (prev.includes(url)) {
        return prev.filter((u) => u !== url);
      }
      if (prev.length >= MAX_SELECTABLE) {
        toast({
          title: `You can select up to ${MAX_SELECTABLE} photos`,
          description: "Deselect one first to swap it out.",
        });
        return prev;
      }
      return [...prev, url];
    });
  };

  const saveSelected = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      // Re-host every selected image on our own storage before saving it --
      // never write the original external URL directly onto the project.
      const rehostedUrls: string[] = [];
      for (const originalUrl of selected) {
        const { data, error: rehostError } = await supabase.functions.invoke(
          "product-image-rehost",
          { body: { url: originalUrl, filename_hint: projectName } },
        );
        if (rehostError || data?.error) {
          throw new Error(data?.error || rehostError?.message || "Re-hosting failed");
        }
        rehostedUrls.push(data.url);
      }

      const nextImages = [
        ...rehostedUrls,
        ...(existingImages || []).filter((i) => !rehostedUrls.includes(i)),
      ];
      const { error: updateError } = await supabase
        .from("projects")
        .update({ project_images: nextImages })
        .eq("id", projectId);
      if (updateError) throw updateError;
      toast({
        title: selected.length === 1 ? "Image saved" : `${selected.length} images saved`,
        description: "Photo(s) downloaded and hosted on our own storage, then assigned to this project.",
      });
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Couldn't save images",
        description: e.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-4 overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Find reference photos</DialogTitle>
          <DialogDescription>
            Results are photos from the web, useful for generic/reference
            imagery (e.g. illustrating a crop or system type) — not a
            substitute for your own real site photos. Select one or more
            that actually fit (up to {MAX_SELECTABLE}), or close this and
            use "Upload Images" for real documentation instead.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          className="flex gap-2 px-6"
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Adjust search terms…"
            className="flex-1"
          />
          <Button type="submit" size="icon" variant="outline" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        <div className="min-h-[220px] flex-1 overflow-y-auto px-6">
          {loading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Searching…
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
              <ImageOff className="h-8 w-8" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && candidates.length > 0 && (
            <div className="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3">
              {candidates.map((c) => {
                const isSelected = selected.includes(c.original);
                return (
                  <button
                    key={c.original}
                    type="button"
                    onClick={() => toggleSelected(c.original)}
                    disabled={saving}
                    className={`group relative aspect-square overflow-hidden rounded-lg border-2 bg-muted transition disabled:opacity-50 ${
                      isSelected
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-border hover:border-primary"
                    }`}
                    title={`${c.title} — ${c.source}`}
                  >
                    <img
                      src={c.thumbnail}
                      alt={c.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div
                      className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <span className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                      {c.source}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-background px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            None of these — skip
          </Button>
          <Button onClick={saveSelected} disabled={selected.length === 0 || saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save selected{selected.length > 0 ? ` (${selected.length})` : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectImagePickerDialog;
