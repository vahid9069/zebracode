'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Copy,
  Check,
  Trash2,
  Sparkles,
  Type,
  Code2,
  FileText,
  Scissors,
  Layers,
  Wand2,
} from 'lucide-react';
import type { CaseResultItem, CaseStyleId } from '@/lib/case-converter/types';
import {
  calculateTextStatistics,
  convertToAllCases,
} from '@/lib/case-converter/converter';

interface CaseConverterProps {
  locale?: 'fa' | 'en';
  dict?: any;
}

export function CaseConverter({ locale = 'fa', dict }: CaseConverterProps) {
  const isEn = locale === 'en';

  const [input, setInput] = useState<string>(
    isEn ? 'userProfileAuthenticationToken and HTTP response' : 'خوش آمدید Welcome to ZebraCode Developer Tools'
  );
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'code' | 'text' | 'fun'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Compute stats and conversions
  const stats = useMemo(() => calculateTextStatistics(input), [input]);
  const allResults = useMemo(() => convertToAllCases(input), [input]);

  const filteredResults = useMemo(() => {
    if (selectedCategory === 'all') return allResults;
    return allResults.filter((r) => r.category === selectedCategory);
  }, [allResults, selectedCategory]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllAsJson = () => {
    const obj: Record<string, string> = {};
    allResults.forEach((r) => {
      obj[r.id] = r.value;
    });
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedId('all-json');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSample = (text: string) => {
    setInput(text);
  };

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Input Workspace */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Type className="w-4 h-4 text-blue-600" />
            <span>{isEn ? 'Enter Text or Variable Identifier:' : 'متن یا نام متغیر را اینجا وارد کنید:'}</span>
          </label>

          {/* Quick Samples */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 mx-1">{isEn ? 'Samples:' : 'نمونه‌ها:'}</span>
            <button
              type="button"
              onClick={() => handleSample('getHTTPResponseCode')}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[11px] font-mono text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
            >
              getHTTPResponseCode
            </button>
            <button
              type="button"
              onClick={() => handleSample('The quick brown fox jumps over the lazy dog')}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[11px] font-mono text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
            >
              quick brown fox
            </button>
            <button
              type="button"
              onClick={() => handleSample('database_connection_timeout_ms')}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[11px] font-mono text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
            >
              database_connection
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            placeholder={isEn ? 'Type or paste text to convert...' : 'متن دلخواه یا نام متغیر مورد نظرتان را تایپ یا پیست نمایید...'}
            className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all resize-y"
          />
          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              className={`absolute ${isEn ? 'right-3' : 'left-3'} bottom-4 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors`}
              title={isEn ? 'Clear' : 'پاک‌سازی'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Text Metrics Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4 font-mono">
            <span>
              {isEn ? 'Characters:' : 'کاراکتر:'} <strong className="text-slate-900 dark:text-white">{stats.characters}</strong>
            </span>
            <span>•</span>
            <span>
              {isEn ? 'Words:' : 'کلمات:'} <strong className="text-slate-900 dark:text-white">{stats.words}</strong>
            </span>
            <span>•</span>
            <span>
              {isEn ? 'Lines:' : 'خطوط:'} <strong className="text-slate-900 dark:text-white">{stats.lines}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAllAsJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-300 transition-colors"
            >
              {copiedId === 'all-json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'all-json' ? (isEn ? 'Copied All!' : 'همه کپی شد!') : (isEn ? 'Copy All as JSON' : 'کپی همه در قالب JSON')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'all', label: isEn ? 'All Standards' : 'تمام استانداردها', count: allResults.length },
          { id: 'code', label: isEn ? 'Programming (Code)' : 'کدنویسی و متغیرها', count: allResults.filter((r) => r.category === 'code').length },
          { id: 'text', label: isEn ? 'Natural Text' : 'متون عادی و مقالات', count: allResults.filter((r) => r.category === 'text').length },
          { id: 'fun', label: isEn ? 'Stylized / Creative' : 'خلاقانه و فان', count: allResults.filter((r) => r.category === 'fun').length },
        ].map((tab) => {
          const active = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* Grid of Converted Cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResults.map((item) => (
          <div
            key={item.id}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {isEn ? item.nameEn : item.nameFa}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {item.category}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 font-mono text-sm break-all select-all text-slate-800 dark:text-slate-200 min-h-[44px] flex items-center">
                {item.value || <span className="text-slate-400 text-xs italic">({isEn ? 'Empty' : 'خالی'})</span>}
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isEn ? item.descriptionEn : item.descriptionFa}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">{item.value.length} {isEn ? 'chars' : 'کاراکتر'}</span>
              <button
                type="button"
                onClick={() => handleCopy(item.value, item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  copiedId === item.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300'
                }`}
              >
                {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === item.id ? (isEn ? 'Copied!' : 'کپی شد!') : (isEn ? 'Copy' : 'کپی')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
