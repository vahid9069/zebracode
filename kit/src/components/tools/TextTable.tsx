'use client';

import React, { useState, useMemo } from 'react';
import {
  AlignJustify,
  Copy,
  Check,
  Sparkles,
  Download,
  Trash2
} from 'lucide-react';

interface TextTableProps {
  locale?: string;
  dict?: any;
}

type TableStyle = 'unicode' | 'mysql' | 'double' | 'simple' | 'markdown';

export function TextTable({ locale = 'fa' }: TextTableProps) {
  const isEn = locale === 'en';

  const defaultFaInput = `ردیف,نام دوره آموزشی,تعداد جلسات,شهریه (تومان),مدرس
1,جامع برنامه‌نویسی پایتون,20,4,500,000,مهندس رضایی
2,توسعه فول‌استک با Next.js,25,6,800,000,مهندس صادقی
3,طراحی رابط و تجربه کاربری (UI/UX),15,3,900,000,خانم احمدی
4,مهندسی DevOps و داکر,18,5,200,000,مهندس کریمی`;

  const defaultEnInput = `# ID,Course Name,Duration (Hours),Price ($),Instructor
1,Python Programming Masterclass,40,$199,David Miller
2,Full-Stack Next.js 15 & React,60,$299,Sarah Connor
3,UI/UX Product Design with Figma,30,$149,Emma Watson
4,DevOps & Docker Deployment,35,$249,Alex Morgan`;

  const [input, setInput] = useState(isEn ? defaultEnInput : defaultFaInput);
  const [style, setStyle] = useState<TableStyle>('unicode');
  const [copied, setCopied] = useState(false);

  // String width calculation accounting for wide Persian/Unicode characters
  const getCharWidth = (str: string) => {
    let width = 0;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      // High surrogate or CJK/full-width chars
      if (code >= 0x1100 && (
        code <= 0x115f ||
        code === 0x2329 ||
        code === 0x232a ||
        (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) ||
        (code >= 0xac00 && code <= 0xd7a3) ||
        (code >= 0xf900 && code <= 0xfaff) ||
        (code >= 0xfe10 && code <= 0xfe19) ||
        (code >= 0xfe30 && code <= 0xfe6f) ||
        (code >= 0xff00 && code <= 0xff60) ||
        (code >= 0xffe0 && code <= 0xffe6)
      )) {
        width += 2;
      } else {
        width += 1;
      }
    }
    return width;
  };

  const formattedAsciiTable = useMemo(() => {
    const lines = input.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) return '';

    const rows = lines.map((line) => line.split(',').map((c) => c.trim()));
    const colCount = Math.max(...rows.map((r) => r.length));

    // Calculate maximum width for each column
    const colWidths = Array(colCount).fill(0);
    for (const r of rows) {
      for (let c = 0; c < colCount; c++) {
        const val = r[c] || '';
        colWidths[c] = Math.max(colWidths[c], getCharWidth(val));
      }
    }

    const pad = (str: string, len: number) => {
      const strW = getCharWidth(str);
      const padLen = Math.max(0, len - strW);
      return str + ' '.repeat(padLen);
    };

    let result = '';

    if (style === 'unicode') {
      // ┌───┬───┐
      // │   │   │
      // ├───┼───┤
      // │   │   │
      // └───┴───┘
      const top = '┌' + colWidths.map((w) => '─'.repeat(w + 2)).join('┬') + '┐\n';
      const mid = '├' + colWidths.map((w) => '─'.repeat(w + 2)).join('┼') + '┤\n';
      const bot = '└' + colWidths.map((w) => '─'.repeat(w + 2)).join('┴') + '┘';

      result += top;
      rows.forEach((r, idx) => {
        const cells = colWidths.map((w, cIdx) => ` ${pad(r[cIdx] || '', w)} `);
        result += '│' + cells.join('│') + '│\n';
        if (idx === 0) {
          result += mid;
        }
      });
      result += bot;
    } else if (style === 'mysql') {
      // +---+---+
      // |   |   |
      // +---+---+
      const sep = '+' + colWidths.map((w) => '-'.repeat(w + 2)).join('+') + '+\n';
      result += sep;
      rows.forEach((r, idx) => {
        const cells = colWidths.map((w, cIdx) => ` ${pad(r[cIdx] || '', w)} `);
        result += '|' + cells.join('|') + '|\n';
        if (idx === 0) {
          result += sep;
        }
      });
      result += sep.trimEnd();
    } else if (style === 'double') {
      // ╔═══╦═══╗
      // ║   ║   ║
      // ╠═══╬═══╣
      // ╚═══╩═══╝
      const top = '╔' + colWidths.map((w) => '═'.repeat(w + 2)).join('╦') + '╗\n';
      const mid = '╠' + colWidths.map((w) => '═'.repeat(w + 2)).join('╬') + '╣\n';
      const bot = '╚' + colWidths.map((w) => '═'.repeat(w + 2)).join('╩') + '╝';

      result += top;
      rows.forEach((r, idx) => {
        const cells = colWidths.map((w, cIdx) => ` ${pad(r[cIdx] || '', w)} `);
        result += '║' + cells.join('║') + '║\n';
        if (idx === 0) {
          result += mid;
        }
      });
      result += bot;
    } else if (style === 'markdown') {
      // | col1 | col2 |
      // | :--- | :--- |
      result += '| ' + colWidths.map((w, cIdx) => pad(rows[0]?.[cIdx] || '', w)).join(' | ') + ' |\n';
      result += '| ' + colWidths.map((w) => ':' + '-'.repeat(Math.max(2, w - 1))).join(' | ') + ' |\n';
      rows.slice(1).forEach((r) => {
        result += '| ' + colWidths.map((w, cIdx) => pad(r[cIdx] || '', w)).join(' | ') + ' |\n';
      });
      result = result.trimEnd();
    } else if (style === 'simple') {
      rows.forEach((r, idx) => {
        const cells = colWidths.map((w, cIdx) => pad(r[cIdx] || '', w));
        result += cells.join('   ') + '\n';
        if (idx === 0) {
          result += colWidths.map((w) => '-'.repeat(w)).join('   ') + '\n';
        }
      });
      result = result.trimEnd();
    }

    return result;
  }, [input, style]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedAsciiTable);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = () => {
    const blob = new Blob([formattedAsciiTable], { type: 'text/plain;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ascii-table-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
            <AlignJustify className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isEn ? 'ASCII & Unicode Text Table Generator' : 'تولیدکننده جدول متنی (ASCII / Unicode)'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Generate beautiful monospaced ASCII and Unicode box tables for code, READMEs, and terminals'
                : 'تبدیل متن و CSV به جدول متنی یونیکد و کادربندی‌شده برای درج در فایل‌های README، ترمینال و کد'}
            </p>
          </div>
        </div>

        {/* Style Selector */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setStyle('unicode')}
            className={`px-3 py-1.5 rounded-xl border transition ${
              style === 'unicode'
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {isEn ? 'Unicode Box (┌─┐)' : 'کادر یونیکد (┌─┐)'}
          </button>

          <button
            onClick={() => setStyle('mysql')}
            className={`px-3 py-1.5 rounded-xl border transition ${
              style === 'mysql'
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {isEn ? 'MySQL (+--+)' : 'کلاسیک (+--+)'}
          </button>

          <button
            onClick={() => setStyle('double')}
            className={`px-3 py-1.5 rounded-xl border transition ${
              style === 'double'
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {isEn ? 'Double (╔═╗)' : 'دوبل (╔═╗)'}
          </button>

          <button
            onClick={() => setStyle('simple')}
            className={`px-3 py-1.5 rounded-xl border transition ${
              style === 'simple'
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {isEn ? 'Simple Space' : 'ساده فضا‌دار'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input Column */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>{isEn ? 'Input Data (Comma-separated values):' : 'داده‌های ورودی (با کاما , جدا کنید):'}</span>
            <button
              onClick={() => setInput('')}
              className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition text-[11px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isEn ? 'Clear' : 'پاک کردن'}</span>
            </button>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={12}
            className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-y"
          />
        </div>

        {/* Output Column */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>{isEn ? 'Formatted ASCII Table Preview:' : 'پیش‌نمایش جدول متنی آماده:'}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isEn ? 'Copied!' : 'کپی شد') : (isEn ? 'Copy' : 'کپی جدول')}</span>
              </button>

              <button
                onClick={downloadText}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
                title={isEn ? 'Download .txt' : 'دانلود به عنوان فایل متنی'}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <pre
            className="flex-1 w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 overflow-x-auto whitespace-pre selection:bg-emerald-800 selection:text-white"
            dir="ltr"
          >
            {formattedAsciiTable || (isEn ? '(Enter data to preview)' : '(داده‌ای وارد کنید)')}
          </pre>
        </div>
      </div>
    </div>
  );
}
