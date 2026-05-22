// src/components/DonationSection.tsx
"use client";

import { useState } from "react";

interface DonationSectionProps {
  address: string;
}

export default function DonationSection({ address }: DonationSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortenAddress = (hex: string) =>
    hex.length > 20 ? `${hex.slice(0, 6)}...${hex.slice(-4)}` : hex;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-left space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl">☕</span>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Support This Project
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            If this tool saved you time, consider sending a tip. Every bit helps
            keep it free and independent.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
        <span className="text-sm font-mono text-gray-700 dark:text-gray-200 break-all">
          {address}
        </span>
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          {copied ? "✅ Copied!" : "📋 Copy"}
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Base network only. No smart contract – this is a simple wallet address.
      </p>
    </div>
  );
}