'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, Bell, Coffee, Brain, Timer as TimerIcon } from 'lucide-react';

type Mode = 'stopwatch' | 'timer' | 'pomodoro';
type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';

export function TimerStopwatch() {
  const [activeTab, setActiveTab] = useState<Mode>('timer');

  // --- کرنومتر ---
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

  // --- تایمر معکوس ---
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
      // Audio context might be restricted before interaction
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

  // --- پومودورو ---
  const [pomoPhase, setPomoPhase] = useState<PomodoroPhase>('focus');
  const [pomoRemain, setPomoRemain] = useState<number>(25 * 60);
  const [pomoRunning, setPomoRunning] = useState<boolean>(false);
  const [pomoSessions, setPomoSessions] = useState<number>(0);
  const pomoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const POMO_CONFIG: Record<PomodoroPhase, { name: string; duration: number; icon: React.ReactNode; color: string }> = {
    focus: { name: 'تمرکز کاری (۲۵ دقیقه)', duration: 25 * 60, icon: <Brain className="w-4 h-4" />, color: 'blue' },
    shortBreak: { name: 'استراحت کوتاه (۵ دقیقه)', duration: 5 * 60, icon: <Coffee className="w-4 h-4" />, color: 'emerald' },
    longBreak: { name: 'استراحت طولانی (۱۵ دقیقه)', duration: 15 * 60, icon: <Coffee className="w-4 h-4" />, color: 'purple' },
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

  const pomoPercent = Math.round(((POMO_CONFIG[pomoPhase].duration - pomoRemain) / POMO_CONFIG[pomoPhase].duration) * 100);

  return (
    <div className="space-y-6">
      {/* تب‌های جابه‌جایی */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('timer')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'timer'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          شمارش معکوس
        </button>
        <button
          onClick={() => setActiveTab('stopwatch')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'stopwatch'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          کرنومتر
        </button>
        <button
          onClick={() => setActiveTab('pomodoro')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'pomodoro'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          پومودورو
        </button>
      </div>

      {/* تب ۱: تایمر شمارش معکوس */}
      {activeTab === 'timer' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm text-center max-w-xl mx-auto space-y-6">
          <div className="text-6xl sm:text-7xl font-mono font-black text-slate-800 dark:text-white tracking-widest" dir="ltr">
            {formatTimer(timerRemainSec)}
          </div>

          {/* نوار پیشرفت */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-500 rounded-full"
              style={{
                width: `${timerTotalSec > 0 ? ((timerTotalSec - timerRemainSec) / timerTotalSec) * 100 : 0}%`,
              }}
            />
          </div>

          {/* تنظیم زمان اولیه اگر متوقف است */}
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
                  className="w-16 h-12 text-center text-lg font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <span className="text-xs text-slate-400 mt-1">ساعت</span>
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
                  className="w-16 h-12 text-center text-lg font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <span className="text-xs text-slate-400 mt-1">دقیقه</span>
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
                  className="w-16 h-12 text-center text-lg font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <span className="text-xs text-slate-400 mt-1">ثانیه</span>
              </div>
            </div>
          )}

          {/* دکمه‌های کنترل */}
          <div className="flex items-center justify-center gap-4 pt-4">
            {!timerRunning ? (
              <button
                onClick={handleStartTimer}
                className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                شروع تایمر
              </button>
            ) : (
              <button
                onClick={() => setTimerRunning(false)}
                className="flex items-center gap-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all"
              >
                <Pause className="w-5 h-5" />
                توقف موقت
              </button>
            )}

            <button
              onClick={handleResetTimer}
              className="p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
              title="تنظیم مجدد"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* تب ۲: کرنومتر */}
      {activeTab === 'stopwatch' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm text-center max-w-xl mx-auto space-y-6">
          <div className="text-6xl sm:text-7xl font-mono font-black text-slate-800 dark:text-white tracking-widest" dir="ltr">
            {formatStopwatch(swTime)}
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            {!swRunning ? (
              <button
                onClick={() => setSwRunning(true)}
                className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                شروع
              </button>
            ) : (
              <button
                onClick={() => setSwRunning(false)}
                className="flex items-center gap-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all"
              >
                <Pause className="w-5 h-5" />
                توقف
              </button>
            )}

            <button
              onClick={handleSwLap}
              disabled={!swRunning}
              className="flex items-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold disabled:opacity-40 transition-all"
            >
              <Flag className="w-4 h-4" />
              ثبت دور (Lap)
            </button>

            <button
              onClick={handleSwReset}
              className="p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
              title="تنظیم مجدد"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* لیست دورها */}
          {laps.length > 0 && (
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-400 mb-3 text-right">رکوردهای ثبت شده ({laps.length})</h4>
              <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {laps.map((lap, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 text-sm">
                    <span className="text-slate-500">دور {laps.length - idx}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                      {formatStopwatch(lap)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* تب ۳: پومودورو */}
      {activeTab === 'pomodoro' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm text-center max-w-xl mx-auto space-y-6">
          <div className="flex justify-center gap-2">
            {(['focus', 'shortBreak', 'longBreak'] as PomodoroPhase[]).map((phase) => (
              <button
                key={phase}
                onClick={() => switchPomoPhase(phase)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pomoPhase === phase
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {POMO_CONFIG[phase].icon}
                {POMO_CONFIG[phase].name}
              </button>
            ))}
          </div>

          <div className="text-6xl sm:text-7xl font-mono font-black text-slate-800 dark:text-white tracking-widest" dir="ltr">
            {formatTimer(pomoRemain)}
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${pomoPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            {!pomoRunning ? (
              <button
                onClick={() => setPomoRunning(true)}
                className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                شروع پومودورو
              </button>
            ) : (
              <button
                onClick={() => setPomoRunning(false)}
                className="flex items-center gap-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all"
              >
                <Pause className="w-5 h-5" />
                توقف
              </button>
            )}

            <button
              onClick={() => {
                setPomoRunning(false);
                setPomoRemain(POMO_CONFIG[pomoPhase].duration);
              }}
              className="p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
              title="ریست"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <div className="pt-2 text-xs text-slate-500 flex items-center justify-center gap-2">
            <span>جلسات تکمیل شده:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">{pomoSessions}</span>
          </div>
        </div>
      )}
    </div>
  );
}
