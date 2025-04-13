'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ToggleSwitch({
  options,
  value,
  onChange,
  className,
}: ToggleSwitchProps) {
  return (
    <div
      className={cn(
        'flex rounded-full bg-slate-700 p-1 w-full max-w-md',
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 py-2 px-4 text-center rounded-full transition-all duration-200 ease-in-out',
            value === option.value
              ? 'bg-white text-slate-800 shadow-sm font-medium'
              : 'bg-transparent text-white hover:bg-slate-600'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
