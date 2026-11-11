'use client';

import React, { useState } from 'react';
import { Languages, Copy, Check, ArrowRightLeft, Sparkles } from 'lucide-react';

const FINGLISH_MAP: Array<[RegExp, string]> = [
  [/kh/gi, 'خ'],
  [/ch/gi, 'چ'],
  [/sh/gi, 'ش'],
  [/zh/gi, 'ژ'],
  [/gh/gi, 'ق'],
  [/th/gi, 'ث'],
  [/aa/gi, 'آ'],
  [/ee/gi, 'ی'],
  [/oo/gi, 'او'],
  [/ou/gi, 'او'],
  [/a/gi, 'ا'],
  [/b/gi, 'ب'],
  [/p/gi, 'پ'],
  [/t/gi, 'ت'],
  [/j/gi, 'ج'],
  [/h/gi, 'ه'],
  [/d/gi, 'د'],
  [/r/gi, 'ر'],
  [/z/gi, 'ز'],
  [/s/gi, 'س'],
  [/f/gi, 'ف'],
  [/k/gi, 'ک'],
  [/g/gi, 'گ'],
  [/l/gi, 'ل'],
  [/m/gi, 'م'],
  [/n/gi, 'ن'],
  [/v/gi, 'و'],
  [/w/gi, 'و'],
  [/y/gi, 'ی'],
  [/i/gi, 'ی'],
  [/u/gi, 'یو'],
  [/o/gi, 'و'],
  [/e/gi, 'ه'],
  [/c/gi, 'ک'],
  [/q/gi, 'ق'],
  [/x/gi, 'کس'],
];

function convertFinglishToPersian(input: string): string {
  let res = input;
  for (const [pattern, replacement] of FINGLISH_MAP) {
    res = res.replace(pattern, replacement);
  }
  return res;
}

export function FinglishConverter() {
  const [input, setInput] = useState('salam, haletan chetor ast?');
  const [copied, setCopied] = useState(false);

  const converted = convertFinglishToPersian(input);

  const handleCopy = () => {
    navigator.clipboard.writeText(converted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ورودی فینگلیش */}
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            متن فینگلیش (Finglish):
          </div>
          <textarea
            dir="ltr"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type finglish here (e.g. salam chetori)..."
            rows={10}
            className="w-full p-4 bg-transparent text-sm leading-relaxed focus:outline-none resize-none font-sans"
          />
        </div>

        {/* خروجی خط فارسی */}
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-blue-600 dark:text-blue-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              متن تبدیل‌شده به خط فارسی:
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کپی شد' : 'کپی متن'}</span>
            </button>
          </div>
          <textarea
            readOnly
            value={converted}
            placeholder="متن فارسی اینجا نمایش داده می‌شود..."
            rows={10}
            className="w-full p-4 bg-slate-50/50 dark:bg-slate-900/50 text-sm leading-relaxed focus:outline-none resize-none font-sans text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>
    </div>
  );
}
