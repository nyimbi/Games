'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ScholarCodeCardProps {
  code: string;
  variant?: 'full' | 'compact';
}

export function ScholarCodeCard({ code, variant = 'full' }: ScholarCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-2 py-1 bg-cream-100 hover:bg-cream-200 rounded-lg transition-colors"
        title="Copy Scholar Code"
      >
        <span className="font-mono text-sm font-medium text-ink-700">{code}</span>
        {copied ? (
          <Check className="w-3.5 h-3.5 text-sage-600" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-ink-400" />
        )}
      </button>
    );
  }

  return (
    <div className="p-6 bg-cream-50 border-2 border-dashed border-gold-300 rounded-2xl text-center">
      <p className="text-sm text-ink-500 mb-2 font-medium">Your Scholar Code</p>
      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="font-mono text-3xl font-bold text-ink-800 tracking-wider">
          {code}
        </span>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-5 h-5 text-sage-600" />
          ) : (
            <Copy className="w-5 h-5 text-ink-400" />
          )}
        </button>
      </div>
      <p className="text-sm text-gold-700 font-medium">
        Write this down! Use it to recover your account on any device.
      </p>
    </div>
  );
}
