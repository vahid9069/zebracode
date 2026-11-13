'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Shuffle,
  Trophy,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Trash2,
  Users,
  Download,
  Award,
  Play
} from 'lucide-react';

interface RandomPickerProps {
  locale?: string;
  dict?: any;
}

export function RandomPicker({ locale = 'fa' }: RandomPickerProps) {
  const isEn = locale === 'en';

  const defaultFaList = `علی محمدی
سارا احمدی
رضا صادقی
مهدی کاظمی
مریم رضایی
حسین حسینی
نیلوفر افشار
امیرحسین مرادی
زهرا کریمی
بابک راد`;

  const defaultEnList = `Alex Morgan
Sarah Connor
Michael Scott
David Miller
Emma Watson
James Wilson
Olivia Davis
Daniel Brown
Sophia Taylor
Lucas Martin`;

  const [itemsText, setItemsText] = useState(isEn ? defaultEnList : defaultFaList);
  const [winnerCount, setWinnerCount] = useState<number>(1);
  const [removeWinnersOnPick, setRemoveWinnersOnPick] = useState(false);
  const [winners, setWinners] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayCandidate, setDisplayCandidate] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [history, setHistory] = useState<Array<{ date: string; winners: string[] }>>([]);

  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play synthetic Web Audio tick sound
  const playSound = (type: 'tick' | 'win') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'tick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else {
        // Fanfare chord
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
          }, idx * 80);
        });
      }
    } catch {
      // AudioContext might be blocked before first user gesture
    }
  };

  const getCleanList = () => {
    return itemsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const cleanList = getCleanList();
  const participantsCount = cleanList.length;

  // Cryptographically secure random item picker
  const pickRandomIndices = (total: number, pickCount: number): number[] => {
    const indices = Array.from({ length: total }, (_, i) => i);
    const result: number[] = [];
    const array = new Uint32Array(total * 2);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    }

    let arrayIdx = 0;
    while (result.length < pickCount && indices.length > 0) {
      const randVal = arrayIdx < array.length ? array[arrayIdx++] : Math.floor(Math.random() * 1000000);
      const chosenSlot = randVal % indices.length;
      result.push(indices[chosenSlot]);
      indices.splice(chosenSlot, 1);
    }
    return result;
  };

  const startDraw = () => {
    if (participantsCount === 0 || isSpinning) return;

    const countToPick = Math.min(winnerCount, participantsCount);
    setIsSpinning(true);
    setWinners([]);

    let step = 0;
    const maxSteps = 24;

    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);

    spinIntervalRef.current = setInterval(() => {
      step++;
      const randomCandidate = cleanList[Math.floor(Math.random() * cleanList.length)];
      setDisplayCandidate(randomCandidate);
      playSound('tick');

      if (step >= maxSteps) {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);

        const pickedIndices = pickRandomIndices(participantsCount, countToPick);
        const selectedWinners = pickedIndices.map((idx) => cleanList[idx]);

        setWinners(selectedWinners);
        setDisplayCandidate(selectedWinners[0] || '');
        setIsSpinning(false);
        playSound('win');

        // Record history
        const nowStr = new Date().toLocaleTimeString(isEn ? 'en-US' : 'fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setHistory((prev) => [{ date: nowStr, winners: selectedWinners }, ...prev.slice(0, 9)]);

        // Remove from list if option is enabled
        if (removeWinnersOnPick) {
          const winnerSet = new Set(selectedWinners);
          const remaining = cleanList.filter((item) => !winnerSet.has(item));
          setItemsText(remaining.join('\n'));
        }
      }
    }, 75);
  };

  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, []);

  const handleCopyWinners = () => {
    if (winners.length === 0) return;
    const text = winners.map((w, i) => `${i + 1}. ${w}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWinners = () => {
    if (winners.length === 0) return;
    const title = isEn ? 'ZebraCode Giveaway Winners' : 'برندگان قرعه‌کشی زبراکد';
    const dateStr = new Date().toLocaleString(isEn ? 'en-US' : 'fa-IR');
    let content = `=== ${title} ===\n${isEn ? 'Date' : 'تاریخ'}: ${dateStr}\n\n`;
    winners.forEach((w, idx) => {
      content += `${idx + 1}. ${w}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `winners-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const loadPreset = (type: 'numbers' | 'names' | 'teams') => {
    if (type === 'numbers') {
      const arr = Array.from({ length: 50 }, (_, i) => `${isEn ? 'Ticket' : 'شماره'} #${i + 1}`);
      setItemsText(arr.join('\n'));
    } else if (type === 'teams') {
      if (isEn) {
        setItemsText(['Real Madrid', 'Barcelona', 'Manchester City', 'Bayern Munich', 'Arsenal', 'Liverpool', 'PSG', 'Inter Milan'].join('\n'));
      } else {
        setItemsText(['پرسپولیس', 'استقلال', 'سپاهان', 'تراکتور', 'فولاد', 'گل‌گهر', 'ملوان', 'مس رفسنجان'].join('\n'));
      }
    } else {
      setItemsText(isEn ? defaultEnList : defaultFaList);
    }
  };

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Action Header / Sound Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isEn ? 'Random Name Picker & Lottery Wheel' : 'قرعه‌کشی و انتخاب تصادفی اسامی'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn ? 'CSPRNG cryptographic fairness for giveaways & team picking' : 'الگوریتم تصادفی کامپیوتری رمزنگاری‌شده (CSPRNG) کاملاً عادلانه'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            soundEnabled
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{soundEnabled ? (isEn ? 'Sound ON' : 'صدا فعال') : (isEn ? 'Sound Muted' : 'بی‌صدا')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Users className="w-4 h-4 text-blue-500" />
              <span>{isEn ? 'Participants List (One per line):' : 'لیست شرکت‌کنندگان (هر خط یک مورد):'}</span>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg">
              {participantsCount} {isEn ? 'entries' : 'نفر'}
            </span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">{isEn ? 'Presets:' : 'پیش‌فرض‌ها:'}</span>
            <button
              onClick={() => loadPreset('names')}
              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {isEn ? 'Names' : 'اسامی'}
            </button>
            <button
              onClick={() => loadPreset('numbers')}
              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {isEn ? '1-50 Tickets' : '۱ تا ۵۰ بلیط'}
            </button>
            <button
              onClick={() => loadPreset('teams')}
              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {isEn ? 'Teams' : 'تیم‌ها'}
            </button>
            <button
              onClick={() => setItemsText('')}
              className="px-2 py-0.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition ms-auto"
            >
              {isEn ? 'Clear' : 'پاک کردن'}
            </button>
          </div>

          <textarea
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
            rows={11}
            placeholder={isEn ? 'Paste names or items here...' : 'اسامی یا گزینه‌ها را اینجا خط به خط بنویسید یا کپی کنید...'}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none resize-none font-sans focus:ring-2 focus:ring-blue-500/20"
          />

          {/* Options */}
          <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">
                {isEn ? 'Number of Winners:' : 'تعداد برندگان:'}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={participantsCount || 1}
                  value={winnerCount}
                  onChange={(e) => setWinnerCount(Math.max(1, Number(e.target.value)))}
                  className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
              <input
                type="checkbox"
                checked={removeWinnersOnPick}
                onChange={(e) => setRemoveWinnersOnPick(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 rounded border-slate-300 dark:border-slate-700"
              />
              <span>{isEn ? 'Remove winner(s) from list after picking' : 'حذف نام برنده(ها) از لیست پس از انتخاب'}</span>
            </label>
          </div>
        </div>

        {/* Display / Winner Stage (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Main Stage */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-10 shadow-lg text-center flex flex-col items-center justify-center min-h-[300px]">
            {/* Background sparkle effects */}
            <div className="absolute top-4 left-4 text-amber-400/20">
              <Sparkles className="w-16 h-16 animate-pulse" />
            </div>
            <div className="absolute bottom-4 right-4 text-blue-400/20">
              <Sparkles className="w-12 h-12 animate-pulse" />
            </div>

            {/* Candidate / Winner Display */}
            {isSpinning ? (
              <div className="space-y-4 py-8">
                <div className="inline-block p-4 bg-white/10 backdrop-blur rounded-2xl animate-bounce">
                  <Shuffle className="w-10 h-10 text-amber-400 animate-spin" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-amber-300 tracking-wide font-sans animate-pulse">
                  {displayCandidate || '...'}
                </div>
                <p className="text-xs text-slate-300">
                  {isEn ? 'Selecting fairly at random...' : 'در حال اجرای قرعه‌کشی با بالاترین دقت...'}
                </p>
              </div>
            ) : winners.length > 0 ? (
              <div className="space-y-4 py-4 w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-300 text-xs font-bold">
                  <Award className="w-4 h-4" />
                  <span>{isEn ? 'Winner(s) Selected!' : 'برنده(های) خوش‌شانس قرعه‌کشی!'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto px-2">
                  {winners.map((winner, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-right"
                      dir={isEn ? 'ltr' : 'rtl'}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-900'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-900'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </div>
                      <div className="truncate font-bold text-sm sm:text-base text-white">
                        {winner}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handleCopyWinners}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (isEn ? 'Copied!' : 'کپی شد') : (isEn ? 'Copy Winners' : 'کپی برندگان')}</span>
                  </button>

                  <button
                    onClick={handleDownloadWinners}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Download .txt' : 'دانلود لیست متنی'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-8">
                <div className="inline-block p-4 bg-white/5 rounded-2xl border border-white/10">
                  <Sparkles className="w-10 h-10 text-amber-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {isEn ? 'Ready for Giveaway' : 'آماده برای قرعه‌کشی'}
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {isEn
                    ? 'Enter participants on the left, set the number of winners, and click start.'
                    : 'اسامی شرکت‌کنندگان را در پنل سمت چپ وارد کرده و دکمه شروع قرعه‌کشی را بزنید.'}
                </p>
              </div>
            )}

            {/* Launch Button */}
            <div className="mt-6 w-full max-w-sm">
              <button
                onClick={startDraw}
                disabled={isSpinning || participantsCount === 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-base shadow-lg shadow-amber-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
              >
                {isSpinning ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{isEn ? 'Drawing Winner...' : 'در حال قرعه‌کشی...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>{isEn ? 'Start Giveaway Now' : 'شروع قرعه‌کشی'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Past Draws History */}
          {history.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>{isEn ? 'Recent Draws History:' : 'تاریخچه قرعه‌کشی‌های اخیر:'}</span>
                <button
                  onClick={() => setHistory([])}
                  className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition text-[11px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Clear' : 'پاک کردن'}</span>
                </button>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-slate-400 text-[11px]">{h.date}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {h.winners.join(', ')}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold shrink-0">
                      {h.winners.length} {isEn ? 'winner(s)' : 'برنده'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
