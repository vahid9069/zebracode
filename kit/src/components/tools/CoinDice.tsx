'use client';

import React, { useState } from 'react';
import {
  Dices,
  CircleDot,
  RefreshCw,
  Volume2,
  VolumeX,
  Sparkles,
  Trash2,
  Plus,
  Minus
} from 'lucide-react';

interface CoinDiceProps {
  locale?: string;
  dict?: any;
}

type CoinType = 'persian' | 'english' | 'yesno';
type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

const DIE_MAX: Record<DieType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

export function CoinDice({ locale = 'fa' }: CoinDiceProps) {
  const isEn = locale === 'en';

  const [tab, setTab] = useState<'coin' | 'dice'>('coin');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // --- Coin State ---
  const [coinType, setCoinType] = useState<CoinType>(isEn ? 'english' : 'persian');
  const [coinResult, setCoinResult] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinRotation, setCoinRotation] = useState(0);
  const [headsCount, setHeadsCount] = useState(0);
  const [tailsCount, setTailsCount] = useState(0);

  // --- Dice State ---
  const [dieType, setDieType] = useState<DieType>('d6');
  const [diceCount, setDiceCount] = useState<number>(2);
  const [modifier, setModifier] = useState<number>(0);
  const [diceValues, setDiceValues] = useState<number[]>([6, 5]);
  const [isRolling, setIsRolling] = useState(false);
  const [diceHistory, setDiceHistory] = useState<Array<{ date: string; type: DieType; values: number[]; total: number }>>([]);

  // Synthesize realistic sound effects with Web Audio API
  const playSound = (type: 'coin' | 'dice') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'coin') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Clattering dice bounces
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220 + Math.random() * 180, ctx.currentTime);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.07);
          }, i * 70);
        }
      }
    } catch {
      // AudioContext may be blocked
    }
  };

  // Cryptographically secure integer generator
  const getSecureRandomInt = (maxVal: number): number => {
    if (typeof window !== 'undefined' && window.crypto) {
      const buf = new Uint32Array(1);
      const maxUint32 = 0xffffffff;
      const bucketSize = Math.floor(maxUint32 / maxVal) * maxVal;
      let rand: number;
      do {
        window.crypto.getRandomValues(buf);
        rand = buf[0];
      } while (rand >= bucketSize);
      return (rand % maxVal) + 1;
    }
    return Math.floor(Math.random() * maxVal) + 1;
  };

  // Flip Coin
  const flipCoin = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    playSound('coin');

    const isHeads = getSecureRandomInt(2) === 1;
    const extraSpins = 6 * 360; // 6 full 360 rotations
    const targetRotation = coinRotation + extraSpins + (isHeads ? 0 : 180);
    setCoinRotation(targetRotation);

    setTimeout(() => {
      setCoinResult(isHeads ? 'heads' : 'tails');
      if (isHeads) {
        setHeadsCount((c) => c + 1);
      } else {
        setTailsCount((c) => c + 1);
      }
      setIsFlipping(false);
    }, 1000);
  };

  // Roll Dice
  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    playSound('dice');

    const maxFace = DIE_MAX[dieType];

    setTimeout(() => {
      const results: number[] = [];
      for (let i = 0; i < diceCount; i++) {
        results.push(getSecureRandomInt(maxFace));
      }
      setDiceValues(results);
      setIsRolling(false);

      const total = results.reduce((acc, curr) => acc + curr, 0) + modifier;
      const timeStr = new Date().toLocaleTimeString(isEn ? 'en-US' : 'fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setDiceHistory((prev) => [{ date: timeStr, type: dieType, values: results, total }, ...prev.slice(0, 9)]);
    }, 450);
  };

  // Render D6 Dots
  const renderD6Dots = (value: number) => {
    const dotsMap: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    const activeDots = dotsMap[value] || [4];

    return (
      <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-14 h-14 p-1.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {activeDots.includes(i) && (
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-slate-100 shadow-sm" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const getCoinLabels = () => {
    if (coinType === 'persian') {
      return { heads: 'شیر', tails: 'خط' };
    }
    if (coinType === 'yesno') {
      return { heads: isEn ? 'YES' : 'بله', tails: isEn ? 'NO' : 'خیر' };
    }
    return { heads: 'HEADS', tails: 'TAILS' };
  };

  const coinLabels = getCoinLabels();
  const diceTotal = diceValues.reduce((a, b) => a + b, 0) + modifier;

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setTab('coin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'coin'
                ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CircleDot className="w-4 h-4" />
            <span>{isEn ? 'Coin Flip' : 'شیر یا خط (پرتاب سکه)'}</span>
          </button>

          <button
            onClick={() => setTab('dice')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'dice'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>{isEn ? 'Dice Roller' : 'پرتاب انواع تاس (Dice)'}</span>
          </button>
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            soundEnabled
              ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4" />}
          <span>{soundEnabled ? (isEn ? 'Sound ON' : 'صدا فعال') : (isEn ? 'Muted' : 'بی‌صدا')}</span>
        </button>
      </div>

      {/* --- COIN FLIP TAB --- */}
      {tab === 'coin' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 shadow-sm text-center flex flex-col items-center justify-center space-y-8">
            {/* 3D Coin Graphic */}
            <div
              className="relative w-36 h-36 cursor-pointer select-none perspective-[1000px]"
              onClick={flipCoin}
            >
              <div
                className="w-full h-full rounded-full transition-transform duration-1000 transform-style-3d shadow-xl"
                style={{
                  transform: `rotateY(${coinRotation}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Heads Face */}
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 border-4 border-yellow-200 flex flex-col items-center justify-center text-slate-950 font-black shadow-inner"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-3xl font-extrabold">{coinLabels.heads}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-80">
                    {isEn ? 'Heads' : 'شیر'}
                  </span>
                </div>

                {/* Tails Face */}
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-slate-400 via-slate-300 to-slate-100 border-4 border-slate-200 flex flex-col items-center justify-center text-slate-900 font-black shadow-inner"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <span className="text-3xl font-extrabold">{coinLabels.tails}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-80">
                    {isEn ? 'Tails' : 'خط'}
                  </span>
                </div>
              </div>
            </div>

            {/* Result Text */}
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-400">
                {isFlipping
                  ? (isEn ? 'Flipping in the air...' : 'در حال چرخش در هوا...')
                  : (isEn ? 'Coin Landed On:' : 'نتیجه پرتاب:')}
              </div>
              <div className="text-3xl font-black text-amber-500">
                {isFlipping ? '...' : coinResult === 'heads' ? coinLabels.heads : coinLabels.tails}
              </div>
            </div>

            {/* Flip Button */}
            <button
              onClick={flipCoin}
              disabled={isFlipping}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm shadow-md shadow-amber-500/25 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isFlipping ? 'animate-spin' : ''}`} />
              <span>{isEn ? 'Flip Coin' : 'پرتاب دوباره سکه'}</span>
            </button>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
                <span className="text-slate-400 block mb-0.5">{coinLabels.heads} ({isEn ? 'Heads' : 'شیر'})</span>
                <span className="text-xl font-mono font-bold text-slate-800 dark:text-slate-100">{headsCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
                <span className="text-slate-400 block mb-0.5">{coinLabels.tails} ({isEn ? 'Tails' : 'خط'})</span>
                <span className="text-xl font-mono font-bold text-slate-800 dark:text-slate-100">{tailsCount}</span>
              </div>
            </div>

            {/* Coin Face Type Selector */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-400">{isEn ? 'Faces:' : 'نوع سکه:'}</span>
              <button
                onClick={() => setCoinType('persian')}
                className={`px-3 py-1 rounded-lg border transition ${
                  coinType === 'persian'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                شیر / خط
              </button>
              <button
                onClick={() => setCoinType('english')}
                className={`px-3 py-1 rounded-lg border transition ${
                  coinType === 'english'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                Heads / Tails
              </button>
              <button
                onClick={() => setCoinType('yesno')}
                className={`px-3 py-1 rounded-lg border transition ${
                  coinType === 'yesno'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                {isEn ? 'Yes / No' : 'بله / خیر'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DICE ROLLER TAB --- */}
      {tab === 'dice' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm text-center space-y-6">
            {/* Dice Render Area */}
            <div className="min-h-[120px] flex items-center justify-center">
              <div
                className={`flex flex-wrap items-center justify-center gap-4 transition-all duration-300 ${
                  isRolling ? 'scale-90 opacity-40 blur-sm' : 'scale-100 opacity-100'
                }`}
              >
                {diceValues.map((val, idx) => (
                  <div
                    key={idx}
                    className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center relative select-none"
                  >
                    {dieType === 'd6' ? (
                      renderD6Dots(val)
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-2xl font-black text-blue-600 dark:text-blue-400">
                          {val}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{dieType}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total Sum Display */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400">
                {isEn ? 'Total Roll (with modifier):' : 'مجموع امتیاز تاس‌ها (با احتساب ضریب):'}
              </span>
              <div className="text-5xl font-black font-mono text-blue-600 dark:text-blue-400">
                {diceTotal}
              </div>
              {modifier !== 0 && (
                <span className="text-xs text-slate-500 font-mono">
                  ({diceValues.reduce((a, b) => a + b, 0)} {modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`})
                </span>
              )}
            </div>

            {/* Roll Button */}
            <div>
              <button
                onClick={rollDice}
                disabled={isRolling}
                className="flex items-center gap-2 px-8 py-3.5 mx-auto rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 active:scale-95 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
                <span>{isEn ? 'Roll Dice' : 'پرتاب مجدد تاس'}</span>
              </button>
            </div>
          </div>

          {/* Dice Options Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Die Type Selection */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'Die Type (Faces):' : 'نوع تاس (تعداد وجه):'}
              </h4>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as DieType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setDieType(type);
                      setDiceValues(Array.from({ length: diceCount }, () => getSecureRandomInt(DIE_MAX[type])));
                    }}
                    className={`py-2 rounded-xl font-bold uppercase transition ${
                      dieType === type
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Dice Count */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'Number of Dice (1 to 6):' : 'تعداد تاس‌ها (۱ تا ۶):'}
              </h4>
              <div className="flex items-center justify-center gap-3 py-1">
                <button
                  onClick={() => {
                    const next = Math.max(1, diceCount - 1);
                    setDiceCount(next);
                    setDiceValues(diceValues.slice(0, next));
                  }}
                  disabled={diceCount <= 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono text-2xl font-black w-8 text-center">{diceCount}</span>
                <button
                  onClick={() => {
                    const next = Math.min(6, diceCount + 1);
                    setDiceCount(next);
                    setDiceValues([...diceValues, getSecureRandomInt(DIE_MAX[dieType])]);
                  }}
                  disabled={diceCount >= 6}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modifier (+ / -) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'Score Modifier (+ / -):' : 'ضریب یا امتیاز افزوده:'}
              </h4>
              <div className="flex items-center justify-center gap-3 py-1">
                <button
                  onClick={() => setModifier((m) => m - 1)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono text-2xl font-black w-12 text-center">
                  {modifier >= 0 ? `+${modifier}` : modifier}
                </span>
                <button
                  onClick={() => setModifier((m) => m + 1)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Dice Roll History */}
          {diceHistory.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>{isEn ? 'Recent Rolls History:' : 'تاریخچه پرتاب‌های اخیر تاس:'}</span>
                <button
                  onClick={() => setDiceHistory([])}
                  className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition text-[11px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Clear' : 'پاک کردن'}</span>
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {diceHistory.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-slate-400 text-[11px]">{h.date}</span>
                      <span className="font-bold text-slate-500 uppercase">{h.type}:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        [{h.values.join(', ')}]
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                      = {h.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
