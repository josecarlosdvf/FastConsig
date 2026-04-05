"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "fastconsig.theme";

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

export function Providers({ children }: { children: React.ReactNode }): JSX.Element {
  const [theme, setTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    const root = document.documentElement;
    const next = resolveTheme(theme);
    root.classList.remove("light", "dark");
    root.classList.add(next);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (): void => {
      if (theme === "system") {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(resolveTheme("system"));
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    (window as Window & { __fastconsigSetTheme?: (mode: ThemeMode) => void }).__fastconsigSetTheme =
      (mode: ThemeMode) => setTheme(mode);
    return () => {
      delete (window as Window & { __fastconsigSetTheme?: (mode: ThemeMode) => void })
        .__fastconsigSetTheme;
      root.classList.remove("light", "dark");
    };
  }, []);

  return <>{children}</>;
}

