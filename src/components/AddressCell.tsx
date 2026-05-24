// src/components/AddressCell.tsx
"use client";
import { useState, useRef, useEffect } from "react";

interface AddressCellProps {
  address: string;
  label?: string;
  onLabelSave: (address: string, label: string) => void;
}

export default function AddressCell({ address, label, onLabelSave }: AddressCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label || "");
  const containerRef = useRef<HTMLDivElement>(null);

  // Cancel editing when clicking outside
  useEffect(() => {
    if (!editing) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        cancelEdit();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editing, label]);

  const shortened = address.length > 20
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address;

  const cancelEdit = () => {
    setEditing(false);
    setDraft(label || "");
  };

  const handleSave = () => {
    onLabelSave(address, draft);
    setEditing(false);
  };

  return (
    <div ref={containerRef} className="flex items-center gap-1 min-w-0">
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") cancelEdit();
            }}
            className="w-20 px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="text-xs text-green-600 hover:underline"
            title="Save label"
          >
            ✓
          </button>
          <button
            onClick={cancelEdit}
            className="text-xs text-red-500 hover:underline"
            title="Cancel"
          >
            ✕
          </button>
        </div>
      ) : label ? (
        <div className="flex items-center gap-1">
          <span
            className="text-xs font-mono text-blue-700 dark:text-blue-300 truncate max-w-[100px]"
            title={address}
          >
            {label}
          </span>
          <button
            onClick={() => {
              setDraft(label);
              setEditing(true);
            }}
            className="text-xs text-gray-400 hover:text-blue-500"
            title="Edit label"
          >
            ✏️
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono truncate max-w-[100px]" title={address}>
            {shortened}
          </span>
          <button
            onClick={() => {
              setDraft("");
              setEditing(true);
            }}
            className="text-xs text-gray-400 hover:text-blue-500"
            title="Add label"
          >
            🏷️
          </button>
        </div>
      )}
    </div>
  );
}