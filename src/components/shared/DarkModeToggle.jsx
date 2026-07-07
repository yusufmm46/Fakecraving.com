import { Moon, Sun } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function DarkModeToggle({ className = "" }) {
  const { darkMode, toggleDarkMode } = useApp();

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label="Toggle dark mode"
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full border border-aubergine/15 dark:border-ivory/20 text-aubergine dark:text-ivory hover:bg-aubergine/5 dark:hover:bg-ivory/10 transition-colors ${className}`}
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
