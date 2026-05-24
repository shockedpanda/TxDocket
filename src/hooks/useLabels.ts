// src/hooks/useLabels.ts
"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "txdocket-labels";

export function useLabels() {
  const [labels, setLabels] = useState<Record<string, string>>({});

  // Load labels from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLabels(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Save labels to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
  }, [labels]);

  const saveLabel = (address: string, label: string) => {
    if (!label.trim()) {
      // If empty label, remove it
      setLabels((prev) => {
        const next = { ...prev };
        delete next[address.toLowerCase()];
        return next;
      });
    } else {
      setLabels((prev) => ({
        ...prev,
        [address.toLowerCase()]: label.trim(),
      }));
    }
  };

  const removeLabel = (address: string) => {
    setLabels((prev) => {
      const next = { ...prev };
      delete next[address.toLowerCase()];
      return next;
    });
  };

  return { labels, saveLabel, removeLabel };
}