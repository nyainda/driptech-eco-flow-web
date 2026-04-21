import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0 relative overflow-hidden"
      type="button"
      aria-label={`Switch to ${darkMode ? 'light' : 'dark'} theme`}
    >
      <Sun
        className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 dark:-rotate-90 dark:scale-0"
        aria-hidden="true"
      />
      <Moon
        className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
