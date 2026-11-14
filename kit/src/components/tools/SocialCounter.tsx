'use client';

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Instagram,
  Twitter,
  Send,
  Linkedin,
  MessageSquare,
  Sparkles,
  Hash,
  AtSign,
  Trash2,
  Clipboard
} from 'lucide-react';

interface SocialCounterProps {
  locale?: string;
  dict?: any;
}

export function SocialCounter({ locale = 'fa', dict }: SocialCounterProps) {
  const isEn = locale === 'en';
  const [text, setText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const len = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const hashtags = (text.match(/#[a-zA-Z0-9_\u0600-\u06FF]+/g) || []).length;
  const mentions = (text.match(/@[a-zA-Z0-9_]+/g) || []).length;
  const lines = text ? text.split('\n').length : 0;

  const platforms = [
    {
      name: isEn ? 'X / Twitter Post' : 'پست توییتر / ایکس (X)',
      max: 280,
      current: len,
      icon: Twitter,
    },
    {
      name: isEn ? 'Instagram Bio' : 'بیوگرافی اینستاگرام (Bio)',
      max: 150,
      current: len,
      icon: Instagram,
    },
    {
      name: isEn ? 'Instagram Caption' : 'کپشن پست اینستاگرام',
      max: 2200,
      current: len,
      icon: Instagram,
    },
    {
      name: isEn ? 'LinkedIn Post' : 'پست لینکدین (LinkedIn)',
      max: 3000,
      current: len,
      icon: Linkedin,
    },
    {
      name: isEn ? 'Telegram Message' : 'پیام تلگرام (Telegram)',
      max: 4096,
      current: len,
      icon: Send,
    },
    {
      name: isEn ? 'SMS Single Part (Persian 70 / Latin 160)' : 'پیامک تک پارت (فارسی ۷۰ / انگلیسی ۱۶۰)',
      max: 70,
      current: len,
      icon: MessageSquare,
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      {/* Metric Cards Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">{isEn ? 'Characters' : 'تعداد کاراکتر'}</span>
          <div className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {isEn ? len : len.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">{isEn ? 'Words' : 'تعداد کلمات'}</span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {isEn ? words : words.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1">
            <Hash className="w-3.5 h-3.5 text-purple-500" />
            {isEn ? 'Hashtags' : 'هشتگ‌ها (#)'}
          </span>
          <div className="mt-1 text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {isEn ? hashtags : hashtags.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1">
            <AtSign className="w-3.5 h-3.5 text-amber-500" />
            {isEn ? 'Mentions' : 'منشن‌ها (@)'}
          </span>
          <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {isEn ? mentions : mentions.toLocaleString('fa-IR')}
          </div>
        </div>
      </div>

      {/* Editor Box */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {isEn ? 'Type your caption, tweet, or social media post:' : 'متن کپشن، توییت یا پست خود را اینجا بنویسید:'}
          </span>

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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-sm disabled:opacity-40 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy' : 'کپی متن')}</span>
            </button>
            <button
              type="button"
              onClick={() => setText('')}
              disabled={!text}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={isEn ? 'Write or paste your social post content here...' : 'متن خود را برای سنجش طول در شبکه‌های اجتماعی اینجا بنویسید...'}
          className="w-full p-5 bg-transparent text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none font-vazir"
        />
      </div>

      {/* Social Platforms Status Bars */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Share2 className="w-4 h-4 text-blue-500" />
          <span>{isEn ? 'Platform Character Limit Breakdown' : 'وضعیت ظرفیت کاراکتر در شبکه‌های اجتماعی مختلف:'}</span>
        </h4>

        <div className="space-y-4">
          {platforms.map((p) => {
            const isOver = p.current > p.max;
            const percent = Math.min(100, Math.round((p.current / p.max) * 100));
            const Icon = p.icon;

            return (
              <div key={p.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{p.name}</span>
                  </span>
                  <span className={`font-mono text-[11px] ${isOver ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                    {p.current} / {p.max} {isEn ? 'chars' : 'کاراکتر'} {isOver && (isEn ? '(Exceeded!)' : '(بیش از حد مجاز!)')}
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isOver ? 'bg-rose-500' : percent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
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
