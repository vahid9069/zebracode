'use client';

import React, { useState } from 'react';
import { Dices, CircleDot, RefreshCw, Volume2, VolumeX } from 'lucide-react';

export function CoinDice() {
  const [tab, setTab] = useState<'coin' | 'dice'>('coin');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // --- وضعیت سکه ---
  const [coinResult, setCoinResult] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinRotation, setCoinRotation] = useState(0);
  const [headsCount, setHeadsCount] = useState(0);
  const [tailsCount, setTailsCount] = useState(0);

  // --- وضعیت تاس ---
  const [diceCount, setDiceCount] = useState<1 | 2 | 3>(2);
  const [diceValues, setDiceValues] = useState<number[]>([6, 5]);
  const [isRolling, setIsRolling] = useState(false);

  // پخش صدای جلوه صوتی با Web Audio API بدون نیاز به فایل خارجی
  const playSound = (type: 'coin' | 'dice') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (type === 'coin') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else {
        // صدای تاس
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200 + Math.random() * 150, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.08);
          }, i * 90);
        }
      }
    } catch {
      // AudioContext ممکن است قبل از تعامل مسدود باشد
    }
  };

  // انداختن سکه با انیمیشن چرخش سه‌بعدی
  const flipCoin = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    playSound('coin');

    const isHeads = Math.random() < 0.5;
    const extraSpins = 6 * 360; // ۶ دور چرخش کامل
    const targetRotation = coinRotation + extraSpins + (isHeads ? 0 : 180);
    setCoinRotation(targetRotation);

    setTimeout(() => {
      setCoinResult(isHeads ? 'heads' : 'tails');
      if (isHeads) setHeadsCount((c) => c + 1);
      else setTailsCount((c) => c + 1);
      setIsFlipping(false);
    }, 1200);
  };

  // پرتاب تاس‌ها
  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    playSound('dice');

    setTimeout(() => {
      const newValues = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
      setDiceValues(newValues);
      setIsRolling(false);
    }, 700);
  };

  const totalDice = diceValues.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* تب‌های انتخاب شیر یا خط / تاس */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex">
          <button
            onClick={() => setTab('coin')}
            className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
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
            className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              tab === 'dice'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Dices className="w-4 h-4" />
            پرتاب تاس آنلاین
          </button>
        </div>

        {/* دکمه صدا */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          title={soundEnabled ? 'قطع صدا' : 'فعال‌سازی صدا'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {tab === 'coin' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm text-center space-y-8 max-w-lg mx-auto">
          {/* محفظه سه‌بعدی سکه با تصویر واقعی */}
          <div className="h-56 flex items-center justify-center [perspective:1000px]">
            <div
              onClick={flipCoin}
              className="relative w-48 h-48 cursor-pointer select-none transition-transform duration-1000 [transform-style:preserve-3d] hover:scale-105"
              style={{
                transform: `rotateY(${coinRotation}deg)`,
              }}
              title="برای انداختن سکه کلیک کنید"
            >
              {/* روی شیر (Heads) */}
              <div className="absolute inset-0 rounded-full [backface-visibility:hidden]">
                <img
                  src="/images/coin/heads.svg"
                  alt="روی شیر سکه"
                  className="w-full h-full object-contain pointer-events-none select-none drop-shadow-xl"
                />
              </div>

              {/* روی خط (Tails) */}
              <div className="absolute inset-0 rounded-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <img
                  src="/images/coin/tails.svg"
                  alt="روی خط سکه"
                  className="w-full h-full object-contain pointer-events-none select-none drop-shadow-xl"
                />
              </div>
            </div>
          </div>

          {/* نتیجه پرتاب */}
          <div className="space-y-2">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {isFlipping ? 'سکه در حال چرخیدن در هوا...' : 'نتیجه پرتاب:'}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {isFlipping ? '...' : coinResult === 'heads' ? '👑 شیر آمد!' : '🌿 خط آمد!'}
            </div>
          </div>

          {/* دکمه پرتاب */}
          <div>
            <button
              onClick={flipCoin}
              disabled={isFlipping}
              className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${isFlipping ? 'animate-spin' : ''}`} />
                {isFlipping ? 'در حال پرتاب...' : 'پرتاب مجدد سکه'}
              </span>
            </button>
          </div>

          {/* آمار پرتاب‌ها */}
          <div className="flex justify-center items-center gap-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <div>
              تعداد شیر: <strong className="text-amber-600 font-bold font-mono text-sm">{headsCount}</strong>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <div>
              تعداد خط: <strong className="text-amber-600 font-bold font-mono text-sm">{tailsCount}</strong>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <div>
              کل پرتاب‌ها: <strong className="text-slate-800 dark:text-slate-200 font-bold font-mono text-sm">{headsCount + tailsCount}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm text-center space-y-8 max-w-lg mx-auto">
          {/* انتخاب تعداد تاس‌ها */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-slate-500 font-medium">تعداد تاس:</span>
            {([1, 2, 3] as const).map((count) => (
              <button
                key={count}
                onClick={() => {
                  setDiceCount(count);
                  setDiceValues(Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1));
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  diceCount === count
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {count} تاس
              </button>
            ))}
          </div>

          {/* نمایش واقع‌گرایانه تصاویر تاس‌ها */}
          <div className="flex items-center justify-center gap-6 py-4">
            {diceValues.map((val, idx) => (
              <div
                key={idx}
                className={`w-28 h-28 sm:w-32 sm:h-32 transition-transform duration-500 ${
                  isRolling ? 'animate-spin scale-90' : 'hover:scale-105'
                }`}
              >
                <img
                  src={`/images/dice/dice-${val}.svg`}
                  alt={`تاس شماره ${val}`}
                  className="w-full h-full object-contain pointer-events-none select-none drop-shadow-xl"
                />
              </div>
            ))}
          </div>

          {/* مجموع امتیاز تاس‌ها */}
          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-medium">
              {diceCount > 1 ? 'مجموع شماره تاس‌ها:' : 'شماره تاس:'}
            </div>
            <div className="text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
              {isRolling ? '...' : totalDice}
            </div>
          </div>

          {/* دکمه پرتاب تاس */}
          <div>
            <button
              onClick={rollDice}
              disabled={isRolling}
              className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
                {isRolling ? 'در حال پرتاب...' : 'پرتاب تاس'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
