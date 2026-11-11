'use client';

import React, { useState } from 'react';
import { Shuffle, Trophy, Sparkles, RefreshCw } from 'lucide-react';

export function RandomPicker() {
  const [itemsText, setItemsText] = useState('علی محمدی\nسارا احمدی\nرضا صادقی\nمهدی کاظمی\nمریم رضایی\nحسین حسینی\nنیلوفر افشار');
  const [winnerCount, setWinnerCount] = useState<number>(1);
  const [winners, setWinners] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);

  const pickWinners = () => {
    const list = itemsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (list.length === 0) return;

    setIsSpinning(true);
    setWinners([]);

    setTimeout(() => {
      const shuffled = [...list].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(winnerCount, shuffled.length));
      setWinners(selected);
      setIsSpinning(false);
    }, 600);
  };

  const participantsCount = itemsText
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* لیست اسامی شرکت‌کنندگان */}
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              لیست شرکت‌کنندگان (هر نفر در یک خط):
            </span>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg">
              {participantsCount} نفر
            </span>
          </div>

          <textarea
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
            rows={10}
            placeholder="اسامی یا شماره‌ها را اینجا قرار دهید..."
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none resize-none font-sans"
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span>تعداد برندگان:</span>
              <input
                type="number"
                min={1}
                max={participantsCount || 1}
                value={winnerCount}
                onChange={(e) => setWinnerCount(Math.max(1, Number(e.target.value)))}
                className="w-16 px-2 py-1 border rounded-lg text-center font-bold"
              />
            </div>

            <button
              onClick={pickWinners}
              disabled={isSpinning || participantsCount === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all"
            >
              <Trophy className="w-4 h-4" />
              {isSpinning ? 'در حال قرعه‌کشی...' : 'شروع قرعه‌کشی'}
            </button>
          </div>
        </div>

        {/* جعبه نمایش برندگان */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-8 text-center min-h-[300px]">
          {winners.length > 0 ? (
            <div className="space-y-4 w-full">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400">
                تبریک به برندگان قرعه‌کشی 🎉
              </h3>
              <div className="space-y-2 max-w-sm mx-auto">
                {winners.map((winner, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-300 dark:border-amber-700/60 font-bold text-base text-slate-900 dark:text-white flex items-center justify-between"
                  >
                    <span className="text-xs text-amber-600 font-normal">نفر {idx + 1}:</span>
                    <span>{winner}</span>
                    <span>🏆</span>
                  </div>
                ))}
              </div>
              <button
                onClick={pickWinners}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center justify-center gap-1 mx-auto pt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                قرعه‌کشی مجدد
              </button>
            </div>
          ) : (
            <div className="text-slate-400 space-y-3">
              <Shuffle className="w-12 h-12 mx-auto stroke-1" />
              <p className="text-xs">اسامی را وارد کرده و دکمه شروع قرعه‌کشی را بزنید.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
