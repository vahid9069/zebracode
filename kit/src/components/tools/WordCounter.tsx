'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Clipboard,
  Trash2,
  Clock,
  Volume2,
  Share2,
  Check,
  Copy,
  Hash,
  AlignLeft,
  PieChart
} from 'lucide-react';

interface WordCounterProps {
  locale?: string;
  dict?: any;
}

export function WordCounter({ locale = 'fa', dict }: WordCounterProps) {
  const isEn = locale === 'en';
  const [text, setText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const stats = useMemo(() => {
    const raw = text.trim();
    if (!raw) {
      return {
        words: 0,
        charsWithSpaces: 0,
        charsNoSpaces: 0,
        lines: 0,
        paragraphs: 0,
        sentences: 0,
        readingTimeMinutes: 0,
        readingTimeSeconds: 0,
        speakingTimeMinutes: 0,
        speakingTimeSeconds: 0,
        topWords: [] as [string, number][],
      };
    }

    const wordsArray = raw.split(/\s+/).filter(Boolean);
    const words = wordsArray.length;
    const charsWithSpaces = text.length;
    const charsNoSpaces = text.replace(/\s+/g, '').length;
    const lines = text.split('\n').length;
    const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0).length;
    // Sentences detection (. ! ? ؟ .)
    const sentences = (text.match(/[^.!?؟\n]+[.!?؟\n]+/g) || []).length || (raw.length > 0 ? 1 : 0);

    // Reading time (average 200 WPM)
    const totalReadingSeconds = Math.ceil((words / 200) * 60);
    const readingTimeMinutes = Math.floor(totalReadingSeconds / 60);
    const readingTimeSeconds = totalReadingSeconds % 60;

    // Speaking time (average 130 WPM)
    const totalSpeakingSeconds = Math.ceil((words / 130) * 60);
    const speakingTimeMinutes = Math.floor(totalSpeakingSeconds / 60);
    const speakingTimeSeconds = totalSpeakingSeconds % 60;

    // Word frequency
    const wordFreq: Record<string, number> = {};
    for (const w of wordsArray) {
      const cleanW = w.toLowerCase().replace(/^[.,،:؛!؟"»«()\[\]{}]+|[.,،:؛!؟"»«()\[\]{}]+$/g, '');
      if (cleanW.length >= 2) {
        wordFreq[cleanW] = (wordFreq[cleanW] || 0) + 1;
      }
    }
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      words,
      charsWithSpaces,
      charsNoSpaces,
      lines,
      paragraphs,
      sentences,
      readingTimeMinutes,
      readingTimeSeconds,
      speakingTimeMinutes,
      speakingTimeSeconds,
      topWords,
    };
  }, [text]);

  // Social limits
  const socialLimits = [
    { name: isEn ? 'X (Twitter)' : 'توییتر / X', limit: 280, current: stats.charsWithSpaces },
    { name: isEn ? 'Instagram Bio' : 'بیوگرافی اینستاگرام', limit: 150, current: stats.charsWithSpaces },
    { name: isEn ? 'LinkedIn Post' : 'پست لینکدین', limit: 3000, current: stats.charsWithSpaces },
    { name: isEn ? 'Standard SMS (FA)' : 'پیامک فارسی (تک پارت)', limit: 70, current: stats.charsWithSpaces },
  ];

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      setText(clip);
    } catch {
      // ignore
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <span className="text-xs font-semibold text-slate-500">{isEn ? 'Words' : 'تعداد کلمات'}</span>
          <div className="mt-1.5 text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {isEn ? stats.words : stats.words.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <span className="text-xs font-semibold text-slate-500">{isEn ? 'Chars (w/ space)' : 'حروف (با فاصله)'}</span>
          <div className="mt-1.5 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {isEn ? stats.charsWithSpaces : stats.charsWithSpaces.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <span className="text-xs font-semibold text-slate-500">{isEn ? 'Chars (no space)' : 'حروف (بدون فاصله)'}</span>
          <div className="mt-1.5 text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {isEn ? stats.charsNoSpaces : stats.charsNoSpaces.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <span className="text-xs font-semibold text-slate-500">{isEn ? 'Sentences' : 'جملات'}</span>
          <div className="mt-1.5 text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {isEn ? stats.sentences : stats.sentences.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <span className="text-xs font-semibold text-slate-500">{isEn ? 'Paragraphs' : 'پاراگراف‌ها'}</span>
          <div className="mt-1.5 text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {isEn ? stats.paragraphs : stats.paragraphs.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <span className="text-xs font-semibold text-slate-500">{isEn ? 'Lines' : 'خطوط'}</span>
          <div className="mt-1.5 text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {isEn ? stats.lines : stats.lines.toLocaleString('fa-IR')}
          </div>
        </div>
      </div>

      {/* Editor Panel */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mr-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              {isEn ? 'Text Content' : 'متن ورودی برای آنالیز زنده'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePaste}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>{isEn ? 'Paste' : 'پیست'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!text}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy' : 'کپی')}</span>
            </button>
            <button
              type="button"
              onClick={() => setText('')}
              disabled={!text}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 transition-colors"
              title={isEn ? 'Clear' : 'پاک کردن'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isEn ? 'Type or paste your text here to see real-time statistics...' : 'متن خود را اینجا تایپ یا پیست کنید تا آمار آن به صورت زنده و دقیق محاسبه شود...'}
          rows={10}
          className="w-full p-5 bg-transparent text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none font-vazir"
        />

        {/* Reading & Speaking Times */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{isEn ? 'Reading time: ' : 'زمان تخمینی مطالعه: '}</span>
              <strong className="text-slate-900 dark:text-white font-mono">
                {stats.readingTimeMinutes > 0
                  ? isEn
                    ? `${stats.readingTimeMinutes} min ${stats.readingTimeSeconds} sec`
                    : `${stats.readingTimeMinutes} دقیقه و ${stats.readingTimeSeconds} ثانیه`
                  : isEn
                  ? `${stats.readingTimeSeconds} sec`
                  : `${stats.readingTimeSeconds} ثانیه`}
              </strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>{isEn ? 'Speaking time: ' : 'زمان تخمینی خوانش صوتی: '}</span>
              <strong className="text-slate-900 dark:text-white font-mono">
                {stats.speakingTimeMinutes > 0
                  ? isEn
                    ? `${stats.speakingTimeMinutes} min ${stats.speakingTimeSeconds} sec`
                    : `${stats.speakingTimeMinutes} دقیقه و ${stats.speakingTimeSeconds} ثانیه`
                  : isEn
                  ? `${stats.speakingTimeSeconds} sec`
                  : `${stats.speakingTimeSeconds} ثانیه`}
              </strong>
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-normal">
            {isEn ? '100% In-browser analytics' : '۱۰۰٪ حریم خصوصی محفوظ در مرورگر'}
          </span>
        </div>
      </div>

      {/* Frequency & Social Media Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Keywords */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <PieChart className="w-4 h-4 text-purple-500" />
            <span>{isEn ? 'Top Frequent Words & Keywords' : 'پرتکرارترین کلمات و کلیدواژه‌ها'}</span>
          </div>

          {stats.topWords.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {stats.topWords.map(([w, cnt]) => {
                const percentage = Math.round((cnt / stats.words) * 100);
                return (
                  <div
                    key={w}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200">{w}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold text-[10px]">
                      {cnt}× ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3">
              {isEn ? 'No words detected yet.' : 'هنوز متنی برای تحلیل کلمات وارد نشده است.'}
            </p>
          )}
        </div>

        {/* Social Media Character Limits */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Share2 className="w-4 h-4 text-emerald-500" />
            <span>{isEn ? 'Social Media Limits' : 'محدودیت شبکه‌های اجتماعی'}</span>
          </div>

          <div className="space-y-3 pt-1">
            {socialLimits.map((item) => {
              const percentage = Math.min(100, Math.round((item.current / item.limit) * 100));
              const isOver = item.current > item.limit;

              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className={`font-mono text-[11px] ${isOver ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                      {item.current} / {item.limit} {isOver && `(${isEn ? 'Over by ' : 'مازاد '}${item.current - item.limit})`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isOver ? 'bg-rose-500' : percentage > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
