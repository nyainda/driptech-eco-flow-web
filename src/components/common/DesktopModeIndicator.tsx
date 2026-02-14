import { useDesktopMode } from "@/hooks/use-desktop-mode";
import { Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DesktopModeIndicator() {
    const { isDesktopMode, toggleDesktopMode } = useDesktopMode();

    if (!isDesktopMode) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-primary text-white p-1 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleDesktopMode}
                    className="text-white hover:bg-white/20 rounded-xl px-3 py-2 h-auto flex items-center gap-2 font-bold text-xs"
                >
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile View</span>
                </Button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        // Just hide for this session if they really want it gone
                        const el = document.getElementById('desktop-mode-indicator');
                        if (el) el.style.display = 'none';
                    }}
                    className="text-white hover:bg-white/20 h-8 w-8 rounded-lg"
                    id="desktop-mode-indicator-close"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
