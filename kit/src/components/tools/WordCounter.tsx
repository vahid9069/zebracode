'use client';

import React, { useState, useMemo } from 'react';
import { FileText, Clipboard, Trash2, Clock, Volume2 } from 'lucide-react';

export function WordCounter() {
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const raw = text.trim();
    if (!raw) {
      return {
        words: 0,
        charsWithSpaces: 0,
        charsNoSpaces: 0,
        lines: 0,
        paragraphs: 0,
        readingTimeMinutes: 0,
        speakingTimeMinutes: 0,
        topWords: [],
      };
    }

    const wordsArray = raw.split(/\s+/).filter(Boolean);
    const words = wordsArray.length;
    const charsWithSpaces = text.length;
    const charsNoSpaces = text.replace(/\s+/g, '').length;
    const lines = text.split('\n').length;
    const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0).length;

    // زمان مطالعه (میانگین ۲۰۰ کلمه در دقیقه) و سخنرانی (۱۳۰ کلمه در دقیقه)
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
    const speakingTimeMinutes = Math.max(1, Math.ceil(words / 130));

    // کلمات پرتکرار
    const wordFreq: Record<string, number> = {};
    for (const w of wordsArray) {
      const cleanW = w.toLowerCase().replace(/^[.,،:؛!؟"»«()]+|[.,،:؛!؟"»«()]+$/g, '');
      if (cleanW.length > 2) {
        wordFreq[cleanW] = (wordFreq[cleanW] || 0) + 1;
      }
    }
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      words,
      charsWithSpaces,
      charsNoSpaces,
      lines,
      paragraphs,
      readingTimeMinutes,
      speakingTimeMinutes,
      topWords,
    };
  }, [text]);

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      setText(clip);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* آمار کارت‌های بالایی */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <span className="text-xs text-slate-500">تعداد کلمات</span>
          <div className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">
            {stats.words.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <span className="text-xs text-slate-500">حروف (با فاصله)</span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.charsWithSpaces.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <span className="text-xs text-slate-500">حروف (بدون فاصله)</span>
          <div className="mt-1 text-2xl font-black text-purple-600 dark:text-purple-400">
            {stats.charsNoSpaces.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <span className="text-xs text-slate-500">پاراگراف‌ها / خطوط</span>
          <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.paragraphs} / {stats.lines}
          </div>
        </div>
      </div>

      {/* پنل ادیتور متن */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* هدر ادیتور */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mr-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              متن مورد نظر برای آنالیز
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePaste}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>پیست</span>
            </button>
            <button
              onClick={() => setText('')}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* تکست اریا */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="متن خود را اینجا تایپ یا پیست کنید تا آمار آن به صورت زنده محاسبه شود..."
          rows={10}
          className="w-full p-4 bg-transparent text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none font-sans"
        />

        {/* فوتر زمان مطالعه و کلمات پرتکرار */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              زمان مطالعه: ~{stats.readingTimeMinutes} دقیقه
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              زمان خوانش صوتی: ~{stats.speakingTimeMinutes} دقیقه
            </span>
          </div>

          {stats.topWords.length > 0 && (
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400">کلمات پرتکرار:</span>
              {stats.topWords.map(([w, cnt]) => (
                <span key={w} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {w} ({cnt})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
