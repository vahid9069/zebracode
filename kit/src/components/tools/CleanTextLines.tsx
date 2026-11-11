'use client';

import React, { useState } from 'react';
import { WrapText, Copy, Check, Clipboard, Trash2, ArrowRight } from 'lucide-react';

export function CleanTextLines() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const cleanLines = (action: 'singleLine' | 'removeEmpty' | 'removeSpaces' | 'trim') => {
    let res = input;
    switch (action) {
      case 'singleLine':
        // تبدیل شکستگی‌های خطوط به فاصله
        res = res.replace(/[\r\n]+/g, ' ').replace(/[ ]+/g, ' ').trim();
        break;
      case 'removeEmpty':
        // حذف خطوط خالی
        res = res.split('\n').filter((l) => l.trim().length > 0).join('\n');
        break;
      case 'removeSpaces':
        // تبدیل چند فاصله به یک فاصله
        res = res.replace(/[ ]{2,}/g, ' ');
        break;
      case 'trim':
        // تریم هر خط
        res = res.split('\n').map((l) => l.trim()).join('\n');
        break;
    }
    setInput(res);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* دکمه‌های اکشن سریع */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <button
          onClick={() => cleanLines('singleLine')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <WrapText className="w-4 h-4" />
          تبدیل به یک خط ممتد (اصلاح متن کپی از PDF)
        </button>

        <button
          onClick={() => cleanLines('removeEmpty')}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
        >
          حذف خطوط خالی
        </button>

        <button
          onClick={() => cleanLines('removeSpaces')}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
        >
          حذف فاصله‌های اضافی (فاصله دوبل)
        </button>

        <button
          onClick={() => cleanLines('trim')}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
        >
          حذف فاصله‌های سر و ته خطوط
        </button>
      </div>

      {/* باکس متن */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <span>متن خود را وارد و سپس یکی از گزینه‌های بالا را انتخاب کنید:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInput('')}
              className="text-rose-600 hover:underline px-2 py-1 text-xs"
            >
              پاک‌سازی
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کپی شد' : 'کپی متن'}</span>
            </button>
          </div>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={14}
          placeholder="متن کپی شده از فایل PDF یا وب که خطوط شکسته دارد را اینجا قرار دهید..."
          className="w-full p-4 bg-transparent text-sm leading-relaxed focus:outline-none resize-none font-sans"
        />
      </div>
    </div>
  );
}
