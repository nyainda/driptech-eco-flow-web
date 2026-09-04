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

interface ImagePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  existingImages?: string[];
  onSaved?: () => void;
}

/**
 * Lets an admin search real product photos (via the product-image-search
 * edge function → SerpAPI) and pick the one that actually matches — nothing
 * is assigned automatically. "Skip" leaves the product with no image rather
 * than a guessed/mismatched one.
 */
const ImagePickerDialog = ({
  open,
  onOpenChange,
  productId,
  productName,
  existingImages,
  onSaved,
}: ImagePickerDialogProps) => {
  const [query, setQuery] = useState(productName);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setQuery(productName);
      setCandidates([]);
      setError(null);
      runSearch(productName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productName]);

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
        setError("No confident matches found — try a different search, or skip this product.");
      }
    } catch (e: any) {
      setError(e.message || "Image search failed");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const selectImage = async (url: string) => {
    setSaving(url);
    try {
      const nextImages = [url, ...(existingImages || []).filter((i) => i !== url)];
      const { error: updateError } = await supabase
        .from("products")
        .update({ images: nextImages })
        .eq("id", productId);
      if (updateError) throw updateError;
      toast({ title: "Image saved", description: "Photo assigned to this product." });
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Couldn't save image",
        description: e.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Find a real photo</DialogTitle>
          <DialogDescription>
            Results are real product images from the web. Pick the one that
            actually matches — if nothing fits, close this and leave it
            blank rather than guessing.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          className="flex gap-2"
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

        <div className="min-h-[220px]">
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {candidates.map((c) => (
                <button
                  key={c.original}
                  type="button"
                  onClick={() => selectImage(c.original)}
                  disabled={saving !== null}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted transition hover:border-primary disabled:opacity-50"
                  title={`${c.title} — ${c.source}`}
                >
                  <img
                    src={c.thumbnail}
                    alt={c.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex">
                    {saving === c.original ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <Check className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <span className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    {c.source}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            None of these — skip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePickerDialog;
