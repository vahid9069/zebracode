'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Flag,
  Bell,
  Coffee,
  Brain,
  Timer as TimerIcon,
  Sparkles,
  Volume2
} from 'lucide-react';

interface TimerStopwatchProps {
  locale?: string;
  dict?: any;
}

type Mode = 'stopwatch' | 'timer' | 'pomodoro';
type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';

export function TimerStopwatch({ locale = 'fa', dict }: TimerStopwatchProps) {
  const isEn = locale === 'en';
  const [activeTab, setActiveTab] = useState<Mode>('timer');

  // --- Stopwatch ---
  const [swTime, setSwTime] = useState<number>(0);
  const [swRunning, setSwRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<number[]>([]);
  const swIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (swRunning) {
      swIntervalRef.current = setInterval(() => {
        setSwTime((prev) => prev + 10);
      }, 10);
    } else if (swIntervalRef.current) {
      clearInterval(swIntervalRef.current);
    }
    return () => {
      if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    };
  }, [swRunning]);

  const handleSwReset = () => {
    setSwRunning(false);
    setSwTime(0);
    setLaps([]);
  };

  const handleSwLap = () => {
    setLaps((prev) => [swTime, ...prev]);
  };

  const formatStopwatch = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  };

  // --- Timer ---
  const [timerInputH, setTimerInputH] = useState<number>(0);
  const [timerInputM, setTimerInputM] = useState<number>(5);
  const [timerInputS, setTimerInputS] = useState<number>(0);
  const [timerTotalSec, setTimerTotalSec] = useState<number>(300);
  const [timerRemainSec, setTimerRemainSec] = useState<number>(300);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1);
    } catch {
      // Audio context may require prior interaction
    }
  };

  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemainSec((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  const handleStartTimer = () => {
    if (timerRemainSec === 0) {
      const total = timerInputH * 3600 + timerInputM * 60 + timerInputS;
      if (total <= 0) return;
      setTimerTotalSec(total);
      setTimerRemainSec(total);
    }
    setTimerRunning(true);
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    const total = timerInputH * 3600 + timerInputM * 60 + timerInputS;
    setTimerTotalSec(total > 0 ? total : 300);
    setTimerRemainSec(total > 0 ? total : 300);
  };

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // --- Pomodoro ---
  const [pomoPhase, setPomoPhase] = useState<PomodoroPhase>('focus');
  const [pomoRemain, setPomoRemain] = useState<number>(25 * 60);
  const [pomoRunning, setPomoRunning] = useState<boolean>(false);
  const [pomoSessions, setPomoSessions] = useState<number>(0);
  const pomoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const POMO_CONFIG: Record<
    PomodoroPhase,
    { nameFa: string; nameEn: string; duration: number; icon: React.ReactNode }
  > = {
    focus: {
      nameFa: 'تمرکز کاری (۲۵ دقیقه)',
      nameEn: 'Deep Work Focus (25m)',
      duration: 25 * 60,
      icon: <Brain className="w-4 h-4" />,
    },
    shortBreak: {
      nameFa: 'استراحت کوتاه (۵ دقیقه)',
      nameEn: 'Short Break (5m)',
      duration: 5 * 60,
      icon: <Coffee className="w-4 h-4" />,
    },
    longBreak: {
      nameFa: 'استراحت طولانی (۱۵ دقیقه)',
      nameEn: 'Long Break (15m)',
      duration: 15 * 60,
      icon: <Coffee className="w-4 h-4" />,
    },
  };

  const switchPomoPhase = (phase: PomodoroPhase) => {
    setPomoRunning(false);
    setPomoPhase(phase);
    setPomoRemain(POMO_CONFIG[phase].duration);
  };

  useEffect(() => {
    if (pomoRunning) {
      pomoIntervalRef.current = setInterval(() => {
        setPomoRemain((prev) => {
          if (prev <= 1) {
            setPomoRunning(false);
            playBeep();
            if (pomoPhase === 'focus') {
              const nextCount = pomoSessions + 1;
              setPomoSessions(nextCount);
              if (nextCount % 4 === 0) {
                switchPomoPhase('longBreak');
              } else {
                switchPomoPhase('shortBreak');
              }
            } else {
              switchPomoPhase('focus');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (pomoIntervalRef.current) {
      clearInterval(pomoIntervalRef.current);
    }
    return () => {
      if (pomoIntervalRef.current) clearInterval(pomoIntervalRef.current);
    };
  }, [pomoRunning, pomoPhase, pomoSessions]);

  const pomoPercent = Math.round(
    ((POMO_CONFIG[pomoPhase].duration - pomoRemain) / POMO_CONFIG[pomoPhase].duration) * 100
  );

  return (
    <div className="space-y-6">
      {/* Mode Navigation */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('timer')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'timer'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isEn ? 'Countdown Timer' : 'شمارش معکوس'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stopwatch')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'stopwatch'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isEn ? 'Stopwatch' : 'کرنومتر دقیق'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pomodoro')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'pomodoro'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isEn ? 'Pomodoro' : 'تایمر پومودورو'}
        </button>
      </div>

      {/* Tab 1: Countdown Timer */}
      {activeTab === 'timer' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm text-center max-w-xl mx-auto space-y-6">
          <div className="text-6xl sm:text-7xl font-mono font-black text-slate-800 dark:text-white tracking-widest" dir="ltr">
            {formatTimer(timerRemainSec)}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-500 rounded-full"
              style={{
                width: `${timerTotalSec > 0 ? ((timerTotalSec - timerRemainSec) / timerTotalSec) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Preset Inputs when stopped */}
          {!timerRunning && timerRemainSec === timerTotalSec && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={timerInputH}
                  onChange={(e) => {
                    const h = Math.max(0, parseInt(e.target.value) || 0);
                    setTimerInputH(h);
                    const total = h * 3600 + timerInputM * 60 + timerInputS;
                    setTimerTotalSec(total);
                    setTimerRemainSec(total);
                  }}
                  className="w-16 h-12 text-center text-lg font-bold font-mono rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
                <span className="text-xs text-slate-400 mt-1">{isEn ? 'Hours' : 'ساعت'}</span>
              </div>
              <span className="text-2xl font-bold text-slate-300">:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={timerInputM}
                  onChange={(e) => {
                    const m = Math.max(0, parseInt(e.target.value) || 0);
                    setTimerInputM(m);
                    const total = timerInputH * 3600 + m * 60 + timerInputS;
                    setTimerTotalSec(total);
                    setTimerRemainSec(total);
                  }}
                  className="w-16 h-12 text-center text-lg font-bold font-mono rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
                <span className="text-xs text-slate-400 mt-1">{isEn ? 'Minutes' : 'دقیقه'}</span>
              </div>
              <span className="text-2xl font-bold text-slate-300">:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={timerInputS}
                  onChange={(e) => {
                    const s = Math.max(0, parseInt(e.target.value) || 0);
                    setTimerInputS(s);
                    const total = timerInputH * 3600 + timerInputM * 60 + s;
                    setTimerTotalSec(total);
                    setTimerRemainSec(total);
                  }}
                  className="w-16 h-12 text-center text-lg font-bold font-mono rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
                <span className="text-xs text-slate-400 mt-1">{isEn ? 'Seconds' : 'ثانیه'}</span>
              </div>
            </div>
          )}

          {/* Quick presets */}
          {!timerRunning && timerRemainSec === timerTotalSec && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
              {[1, 3, 5, 10, 15, 25, 45].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setTimerInputH(0);
                    setTimerInputM(m);
                    setTimerInputS(0);
                    setTimerTotalSec(m * 60);
                    setTimerRemainSec(m * 60);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {isEn ? `${m}m` : `${m} دقیقه`}
                </button>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 pt-4">
            {!timerRunning ? (
              <button
                type="button"
                onClick={handleStartTimer}
                className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{isEn ? 'Start Timer' : 'شروع تایمر'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTimerRunning(false)}
                className="flex items-center gap-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Pause className="w-5 h-5" />
                <span>{isEn ? 'Pause' : 'توقف موقت'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetTimer}
              className="p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl active:scale-95 transition-all"
              title={isEn ? 'Reset' : 'تنظیم مجدد'}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Stopwatch */}
      {activeTab === 'stopwatch' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm text-center max-w-xl mx-auto space-y-6">
          <div className="text-6xl sm:text-7xl font-mono font-black text-slate-800 dark:text-white tracking-widest" dir="ltr">
            {formatStopwatch(swTime)}
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            {!swRunning ? (
              <button
                type="button"
                onClick={() => setSwRunning(true)}
                className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{isEn ? 'Start' : 'شروع'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSwRunning(false)}
                className="flex items-center gap-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Pause className="w-5 h-5" />
                <span>{isEn ? 'Pause' : 'توقف'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSwLap}
              disabled={!swRunning}
              className="flex items-center gap-2 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold disabled:opacity-40 active:scale-95 transition-all"
            >
              <Flag className="w-4 h-4" />
              <span>{isEn ? 'Lap' : 'ثبت دور (Lap)'}</span>
            </button>

            <button
              type="button"
              onClick={handleSwReset}
              className="p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl active:scale-95 transition-all"
              title={isEn ? 'Reset' : 'تنظیم مجدد'}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Laps List */}
          {laps.length > 0 && (
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
              <h4 className="font-bold text-slate-400 mb-3 text-right">
                {isEn ? `Recorded Laps (${laps.length})` : `رکوردهای ثبت‌شده (${laps.length.toLocaleString('fa-IR')})`}
              </h4>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {laps.map((lap, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2.5">
                    <span className="text-slate-500 font-semibold">
                      {isEn ? `Lap ${laps.length - idx}` : `دور ${(laps.length - idx).toLocaleString('fa-IR')}`}
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm" dir="ltr">
                      {formatStopwatch(lap)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Pomodoro */}
      {activeTab === 'pomodoro' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm text-center max-w-xl mx-auto space-y-6">
          <div className="flex flex-wrap justify-center gap-2">
            {(['focus', 'shortBreak', 'longBreak'] as PomodoroPhase[]).map((phase) => (
              <button
                key={phase}
                type="button"
                onClick={() => switchPomoPhase(phase)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  pomoPhase === phase
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {POMO_CONFIG[phase].icon}
                <span>{isEn ? POMO_CONFIG[phase].nameEn : POMO_CONFIG[phase].nameFa}</span>
              </button>
            ))}
          </div>

          <div className="text-6xl sm:text-7xl font-mono font-black text-slate-800 dark:text-white tracking-widest" dir="ltr">
            {formatTimer(pomoRemain)}
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${pomoPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            {!pomoRunning ? (
              <button
                type="button"
                onClick={() => setPomoRunning(true)}
                className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{isEn ? 'Start Pomodoro' : 'شروع تمرکز'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPomoRunning(false)}
                className="flex items-center gap-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Pause className="w-5 h-5" />
                <span>{isEn ? 'Pause' : 'توقف'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setPomoRunning(false);
                setPomoRemain(POMO_CONFIG[pomoPhase].duration);
              }}
              className="p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl active:scale-95 transition-all"
              title={isEn ? 'Reset' : 'ریست'}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <div className="pt-2 text-xs text-slate-500 flex items-center justify-center gap-2">
            <span>{isEn ? 'Completed Focus Sessions:' : 'جلسات تمرکز تکمیل‌شده:'}</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-base">
              {isEn ? pomoSessions : pomoSessions.toLocaleString('fa-IR')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
