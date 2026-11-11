'use client';

import React, { useState } from 'react';
import { Dices, CircleDot, RefreshCw } from 'lucide-react';

export function CoinDice() {
  const [tab, setTab] = useState<'coin' | 'dice'>('coin');

  // شیر یا خط
  const [coinResult, setCoinResult] = useState<'شیر' | 'خط' | null>('شیر');
  const [headsCount, setHeadsCount] = useState<number>(1);
  const [tailsCount, setTailsCount] = useState<number>(0);
  const [isFlipping, setIsFlipping] = useState(false);

  // تاس
  const [diceCount, setDiceCount] = useState<1 | 2>(1);
  const [dice1, setDice1] = useState<number>(6);
  const [dice2, setDice2] = useState<number>(4);
  const [isRolling, setIsRolling] = useState(false);

  const flipCoin = () => {
    setIsFlipping(true);
    setTimeout(() => {
      const isHeads = Math.random() < 0.5;
      const res = isHeads ? 'شیر' : 'خط';
      setCoinResult(res);
      if (isHeads) setHeadsCount((c) => c + 1);
      else setTailsCount((c) => c + 1);
      setIsFlipping(false);
    }, 400);
  };

  const rollDice = () => {
    setIsRolling(true);
    setTimeout(() => {
      setDice1(Math.floor(Math.random() * 6) + 1);
      setDice2(Math.floor(Math.random() * 6) + 1);
      setIsRolling(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab('coin')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            tab === 'coin'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <CircleDot className="w-4 h-4" />
          شیر یا خط آنلاین
        </button>
        <button
          onClick={() => setTab('dice')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            tab === 'dice'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Dices className="w-4 h-4" />
          پرتاب تاس آنلاین
        </button>
      </div>

      {tab === 'coin' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm text-center space-y-6 max-w-md mx-auto">
          <div className="w-36 h-36 mx-auto rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 text-amber-950 flex items-center justify-center text-3xl font-black shadow-lg shadow-amber-500/20 border-4 border-amber-200">
            <span className={isFlipping ? 'animate-spin' : ''}>
              {coinResult || '؟'}
            </span>
          </div>

          <div>
            <button
              onClick={flipCoin}
              disabled={isFlipping}
              className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-all"
            >
              {isFlipping ? 'در حال پرتاب...' : 'پرتاب دوباره سکه'}
            </button>
          </div>

          <div className="flex justify-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>تعداد شیر: <strong className="text-slate-800 dark:text-slate-200">{headsCount}</strong></span>
            <span>•</span>
            <span>تعداد خط: <strong className="text-slate-800 dark:text-slate-200">{tailsCount}</strong></span>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm text-center space-y-6 max-w-md mx-auto">
          <div className="flex justify-center gap-2 text-xs font-semibold mb-2">
            <button
              onClick={() => setDiceCount(1)}
              className={`px-3 py-1 rounded-lg border ${diceCount === 1 ? 'border-blue-600 text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/60' : 'text-slate-500'}`}
            >
              ۱ عدد تاس
            </button>
            <button
              onClick={() => setDiceCount(2)}
              className={`px-3 py-1 rounded-lg border ${diceCount === 2 ? 'border-blue-600 text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/60' : 'text-slate-500'}`}
            >
              ۲ عدد تاس
            </button>
          </div>

          <div className="flex items-center justify-center gap-5">
            <div className={`w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-4xl font-black text-blue-600 dark:text-blue-400 shadow-md ${isRolling ? 'animate-bounce' : ''}`}>
              {dice1}
            </div>

            {diceCount === 2 && (
              <div className={`w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-4xl font-black text-emerald-600 dark:text-emerald-400 shadow-md ${isRolling ? 'animate-bounce' : ''}`}>
                {dice2}
              </div>
            )}
          </div>

          {diceCount === 2 && (
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              مجموع تاس‌ها: <span className="text-blue-600 font-black text-lg">{dice1 + dice2}</span>
            </div>
          )}

          <div>
            <button
              onClick={rollDice}
              disabled={isRolling}
              className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-all"
            >
              {isRolling ? 'در حال چرخش...' : 'پرتاب مجدد تاس'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
