import { useEffect, useState, type ReactNode } from "react";
import { ThemeContext, type Theme } from "./ThemeContext";

const THEME_STORAGE_KEY = "dnd-ct:theme:v1";
const DEFAULT_THEME: Theme = "dark";

function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "forest") {
      return stored;
    }
  } catch {
    // If reading fails, return default
  }
  return DEFAULT_THEME;
}

function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(loadTheme);

  // Apply theme to document root on mount and when theme changes
  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove("dark", "light", "forest");
    // Add current theme class (light is the default :root, so no class needed)
    if (theme !== "light") {
      root.classList.add(theme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
  };

  const toggleTheme = () => {
    const themeOrder: Theme[] = ["dark", "light", "forest"];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
