import { useState, useCallback, useEffect } from "react";
import { SETTINGS_STORAGE_KEY } from "../constants";
import type { CombatantIdentifierType } from "../types";

export type Settings = {
  combatantIdentifierType: CombatantIdentifierType;
};

const DEFAULT_SETTINGS: Settings = {
  combatantIdentifierType: "letters",
};

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // If parsing fails, return defaults
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  // Load settings on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...patch };
      saveSettings(updated);
      return updated;
    });
  }, []);

  return {
    settings,
    updateSettings,
  };
}

// Export a standalone function to get settings without React hooks
// This is useful for use in useCombatState where we need synchronous access
export function getSettings(): Settings {
  return loadSettings();
}
