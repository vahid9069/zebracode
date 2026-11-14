'use client';

import React, { useState } from 'react';
import {
  WrapText,
  Copy,
  Check,
  Clipboard,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
  ListOrdered,
  PlusCircle,
  Unlink
} from 'lucide-react';

interface CleanTextLinesProps {
  locale?: string;
  dict?: any;
}

const SAMPLE_FA = `این یک متن نمونه است
که از یک فایل PDF کپی شده
و دارای شکستگی‌های خطوط ناهماهنگ است.

   همچنین فاصله‌های   زیادی    بین کلمات    وجود دارد.   

و برخی خطوط کاملا خالی هستند.`;

const SAMPLE_EN = `This is a sample text
copied from a PDF document
with awkward line breaks.

   There are also   unneeded    multiple spaces.   

And some lines are completely blank.`;

export function CleanTextLines({ locale = 'fa', dict }: CleanTextLinesProps) {
  const isEn = locale === 'en';
  const [input, setInput] = useState<string>(isEn ? SAMPLE_EN : SAMPLE_FA);
  const [copied, setCopied] = useState<boolean>(false);
  const [prefixText, setPrefixText] = useState<string>('');
  const [suffixText, setSuffixText] = useState<string>('');
  const [joinDelimiter, setJoinDelimiter] = useState<string>(', ');

  const applyAction = (action: 'singleLine' | 'removeEmpty' | 'removeSpaces' | 'trim' | 'joinCustom' | 'addPrefixSuffix' | 'numberLines') => {
    let res = input;

    switch (action) {
      case 'singleLine':
        // Unwrap lines into single paragraph (PDF fixer)
        res = res.replace(/[\r\n]+/g, ' ').replace(/[ ]{2,}/g, ' ').trim();
        break;

      case 'removeEmpty':
        // Remove blank lines
        res = res.split('\n').filter((l) => l.trim().length > 0).join('\n');
        break;

      case 'removeSpaces':
        // Multiple spaces to single space
        res = res.replace(/[ ]{2,}/g, ' ');
        break;

      case 'trim':
        // Trim each line
        res = res.split('\n').map((l) => l.trim()).join('\n');
        break;

      case 'joinCustom':
        // Join non-empty lines with delimiter
        res = res
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .join(joinDelimiter);
        break;

      case 'addPrefixSuffix':
        // Add prefix and suffix to every line
        res = res
          .split('\n')
          .map((l) => `${prefixText}${l}${suffixText}`)
          .join('\n');
        break;

      case 'numberLines':
        // Number lines 1. 2. 3.
        res = res
          .split('\n')
          .map((l, idx) => `${isEn ? idx + 1 : (idx + 1).toLocaleString('fa-IR')}. ${l}`)
          .join('\n');
        break;
    }

    setInput(res);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      setInput(clip);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const blob = new Blob([input], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned-text-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setInput(isEn ? SAMPLE_EN : SAMPLE_FA);
  };

  const lineCount = input.split('\n').length;
  const wordCount = input.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Quick Action Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyAction('singleLine')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-xs sm:text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-500/20"
          >
            <WrapText className="w-4 h-4" />
            <span>{isEn ? 'Unwrap to Single Line (Fix PDF Copy)' : 'ادغام در یک خط (اصلاح کپی از PDF)'}</span>
          </button>

          <button
            type="button"
            onClick={() => applyAction('removeEmpty')}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold active:scale-95 transition-all"
          >
            {isEn ? 'Remove Empty Lines' : 'حذف خطوط خالی'}
          </button>

          <button
            type="button"
            onClick={() => applyAction('removeSpaces')}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold active:scale-95 transition-all"
          >
            {isEn ? 'Collapse Extra Spaces' : 'حذف فاصله‌های دوبل و اضافی'}
          </button>

          <button
            type="button"
            onClick={() => applyAction('trim')}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold active:scale-95 transition-all"
          >
            {isEn ? 'Trim Line Edges' : 'حذف فواصل سر و ته خطوط'}
          </button>

          <button
            type="button"
            onClick={() => applyAction('numberLines')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold active:scale-95 transition-all"
          >
            <ListOrdered className="w-4 h-4" />
            <span>{isEn ? 'Number Lines' : 'شماره‌گذاری خطوط'}</span>
          </button>
        </div>

        {/* Advanced Prefix/Suffix and Join Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          {/* Join with Delimiter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 whitespace-nowrap font-medium">{isEn ? 'Join lines with:' : 'ادغام با جداکننده:'}</span>
            <input
              type="text"
              value={joinDelimiter}
              onChange={(e) => setJoinDelimiter(e.target.value)}
              placeholder=", "
              className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono text-xs text-slate-800 dark:text-slate-200"
            />
            <button
              type="button"
              onClick={() => applyAction('joinCustom')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
            >
              {isEn ? 'Apply' : 'اعمال ادغام'}
            </button>
          </div>

          {/* Prefix / Suffix */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={prefixText}
              onChange={(e) => setPrefixText(e.target.value)}
              placeholder={isEn ? 'Prefix' : 'پیشوند'}
              className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
            />
            <input
              type="text"
              value={suffixText}
              onChange={(e) => setSuffixText(e.target.value)}
              placeholder={isEn ? 'Suffix' : 'پسوند'}
              className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
            />
            <button
              type="button"
              onClick={() => applyAction('addPrefixSuffix')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
            >
              {isEn ? 'Add' : 'افزودن به خطوط'}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Box */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mr-1">
              {isEn ? 'Text Content' : 'محتوای متنی'}
            </span>
          </div>

          <div className="flex items-center gap-2">
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
              onClick={handleDownload}
              disabled={!input}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isEn ? 'Download' : 'دانلود'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!input}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-40 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy' : 'کپی')}</span>
            </button>
            <button
              type="button"
              onClick={() => setInput('')}
              disabled={!input}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={14}
          placeholder={isEn ? 'Paste your broken text or lines here...' : 'متن کپی شده از فایل PDF یا وب که خطوط شکسته دارد را اینجا قرار دهید...'}
          className="w-full p-5 bg-transparent text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none font-vazir"
        />

        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>{isEn ? `${lineCount} lines` : `${lineCount.toLocaleString('fa-IR')} خط`}</span>
            <span>•</span>
            <span>{isEn ? `${wordCount} words` : `${wordCount.toLocaleString('fa-IR')} کلمه`}</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isEn ? 'Reset Sample' : 'متن نمونه'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
