'use client';

import React from 'react';

interface Props {
  value: number | string;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  dir?: 'ltr' | 'rtl';
}

// تبدیل اعداد فارسی و عربی به انگلیسی
export function toEnglishDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

// فرمت سه‌رقم سه‌رقم
export function formatCommas(val: number | string): string {
  if (val === '' || val === null || val === undefined || isNaN(Number(val))) return '';
  const clean = toEnglishDigits(String(val)).replace(/,/g, '').replace(/[^\d.]/g, '');
  if (!clean) return '';
  const parts = clean.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export function NumericInput({
  value,
  onChange,
  placeholder = '۰',
  className = '',
  unit,
  dir = 'ltr',
}: Props) {
  const displayVal = formatCommas(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnglishDigits(e.target.value).replace(/,/g, '').replace(/[^\d.]/g, '');
    const num = parseFloat(raw);
    onChange(isNaN(num) ? 0 : num);
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        dir={dir}
        value={displayVal}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold font-mono focus:outline-none focus:border-blue-500 transition-colors ${
          unit ? (dir === 'ltr' ? 'pr-12' : 'pl-12') : ''
        } ${className}`}
      />
      {unit && (
        <span
          className={`absolute text-xs font-sans text-slate-400 pointer-events-none ${
            dir === 'ltr' ? 'right-3' : 'left-3'
          }`}
        >
          {unit}
        </span>
      )}
    </div>
  );
}
