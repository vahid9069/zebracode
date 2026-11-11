'use client';

import React, { useState } from 'react';
import { Copy, Check, Trash2, ArrowDownUp } from 'lucide-react';

export function CaseConverter() {
  const [text, setText] = useState<string>('Hello World! Welcome to ZebraCode Developer Tools.');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // الگوریتم‌های تبدیل
  const toUpper = (s: string) => s.toUpperCase();
  const toLower = (s: string) => s.toLowerCase();

  const toSentence = (s: string) => {
    return s.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
  };

  const toTitle = (s: string) => {
    return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const toCamel = (s: string) => {
    return s
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^([A-Z])/, (_, chr) => chr.toLowerCase());
  };

  const toPascal = (s: string) => {
    const camel = toCamel(s);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  };

  const toSnake = (s: string) => {
    return s
      .trim()
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s\W-]+/g, '_')
      .toLowerCase();
  };

  const toKebab = (s: string) => {
    return s
      .trim()
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s\W_]+/g, '-')
      .toLowerCase();
  };

  const toAlternating = (s: string) => {
    return s
      .split('')
      .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
      .join('');
  };

  const formats = [
    { key: 'upper', title: 'UPPERCASE (تمام حروف بزرگ)', value: toUpper(text) },
    { key: 'lower', title: 'lowercase (تمام حروف کوچک)', value: toLower(text) },
    { key: 'title', title: 'Title Case (حرف اول هر کلمه بزرگ)', value: toTitle(text) },
    { key: 'sentence', title: 'Sentence case (حرف اول هر جمله بزرگ)', value: toSentence(text) },
    { key: 'camel', title: 'camelCase (مخصوص متغیرهای برنامه‌نویسی)', value: toCamel(text) },
    { key: 'pascal', title: 'PascalCase (مخصوص نام کلاس‌ها)', value: toPascal(text) },
    { key: 'snake', title: 'snake_case (با خط فاصله پایین _)', value: toSnake(text) },
    { key: 'kebab', title: 'kebab-case (با خط تیره -)', value: toKebab(text) },
    { key: 'alt', title: 'aLtErNaTiNg cAsE (حروف یکی‌درمیان)', value: toAlternating(text) },
  ];

  return (
    <div className="space-y-6">
      {/* باکس ورودی اصلی */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <label className="font-bold text-slate-700 dark:text-slate-300">متن انگلیسی ورودی را وارد کنید:</label>
          <div className="flex items-center gap-2">
            <span>کاراکترها: <strong className="font-mono text-slate-800 dark:text-slate-200">{text.length}</strong></span>
            {text && (
              <button
                onClick={() => setText('')}
                className="p-1 text-rose-500 hover:text-rose-600 rounded transition-colors"
                title="پاک کردن متن"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste English text here..."
          rows={3}
          dir="ltr"
          className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-mono text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* لیست خروجی‌های تبدیل شده با قابلیت کپی سریع */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formats.map((fmt) => (
          <div
            key={fmt.key}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2 hover:border-blue-300 dark:hover:border-blue-900 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{fmt.title}</span>
              <button
                onClick={() => handleCopy(fmt.value, fmt.key)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {copiedKey === fmt.key ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی</span>
                  </>
                )}
              </button>
            </div>

            <div
              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all min-h-[44px] flex items-center"
              dir="ltr"
            >
              {fmt.value || <span className="text-slate-400 italic font-sans text-xs">خالی</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
