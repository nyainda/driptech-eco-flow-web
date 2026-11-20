import { lazy, Suspense, useEffect, useState } from "react";
import { Search } from "lucide-react";

const SearchManager = lazy(() => import("./SearchManager"));

/**
 * Lightweight search trigger for the Header. Defers loading cmdk / CommandDialog /
 * aiProductService until the user clicks Search or presses Ctrl/Cmd+K.
 */
export default function LazySearchManager() {
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (activated) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setActivated(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activated]);

  if (activated) {
    return (
      <Suspense
        fallback={
          <button
            type="button"
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 border border-border/50 mr-2"
            aria-label="Open search"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Search...</span>
          </button>
        }
      >
        <SearchManager initialOpen />
      </Suspense>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setActivated(true)}
        className="hidden md:flex items-center gap-2 group px-4 py-2 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all duration-300 mr-2"
      >
        <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
          Search...
        </span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 ml-4">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <button
        type="button"
        className="sr-only"
        id="search-trigger"
        onClick={() => setActivated(true)}
        aria-label="Toggle search"
      />
    </>
  );
}
