'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, Instagram, Twitter, Send, Linkedin } from 'lucide-react';

export function SocialCounter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const len = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const hashtags = (text.match(/#[a-zA-Z0-9_\u0600-\u06FF]+/g) || []).length;
  const mentions = (text.match(/@[a-zA-Z0-9_]+/g) || []).length;

  const platforms = [
    { name: 'بیو اینستاگرام (Bio)', max: 150, current: len },
    { name: 'کپشن اینستاگرام', max: 2200, current: len },
    { name: 'پست توییتر / ایکس (X)', max: 280, current: len },
    { name: 'پیام تلگرام', max: 4096, current: len },
    { name: 'پست لینکدین (LinkedIn)', max: 3000, current: len },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500">تعداد کاراکتر</span>
          <div className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">
            {len.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500">تعداد کلمات</span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {words.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500">هشتگ‌ها (#)</span>
          <div className="mt-1 text-2xl font-black text-purple-600 dark:text-purple-400">
            {hashtags.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500">منشن‌ها (@)</span>
          <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
            {mentions.toLocaleString('fa-IR')}
          </div>
        </div>
      </div>

      {/* تکست‌اریا برای تایپ کپشن یا متن */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <span>متن کپشن یا بیو را اینجا بنویسید:</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'کپی شد' : 'کپی متن'}</span>
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="متن خود را برای سنجش طول در شبکه‌های اجتماعی اینجا بنویسید..."
          className="w-full p-4 bg-transparent text-sm leading-relaxed focus:outline-none resize-none font-sans"
        />
      </div>

      {/* وضعیت شبکه‌ها */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          وضعیت ظرفیت کاراکتر در شبکه‌های اجتماعی:
        </h4>

        <div className="space-y-3">
          {platforms.map((p) => {
            const isOver = p.current > p.max;
            const percent = Math.min(100, Math.round((p.current / p.max) * 100));
            return (
              <div key={p.name} className="space-y-1 text-xs">
                <div className="flex justify-between items-center font-medium">
                  <span>{p.name}</span>
                  <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                    {p.current} / {p.max} کاراکتر {isOver && '(بیش از حد مجاز!)'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all ${isOver ? 'bg-rose-500' : percent > 85 ? 'bg-amber-500' : 'bg-blue-600'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
