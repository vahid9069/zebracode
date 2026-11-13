'use client';

import React, { useState, useMemo } from 'react';
import {
  PiggyBank,
  Calculator,
  Calendar,
  Percent,
  TrendingUp,
  Sparkles,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { NumericInput } from '@/components/ui/NumericInput';

interface BankDepositInterestProps {
  locale?: string;
  dict?: any;
}

export function BankDepositInterest({ locale = 'fa', dict }: BankDepositInterestProps) {
  const isEn = locale === 'en';
  const [deposit, setDeposit] = useState<number>(100000000); // 100M Tomans
  const [rate, setRate] = useState<number>(22.5); // 22.5% standard central bank
  const [termMonths, setTermMonths] = useState<number>(12); // deposit term in months
  const [reinvestInterest, setReinvestInterest] = useState<boolean>(false); // compound interest

  const presets = [
    { label: isEn ? '20.5% Short-Term' : '۲۰.۵٪ کوتاه‌مدت ماه شمار', rate: 20.5, term: 1 },
    { label: isEn ? '21.5% 6-Month' : '۲۱.۵٪ میان‌مدت ۶ ماهه', rate: 21.5, term: 6 },
    { label: isEn ? '22.5% 1-Year' : '۲۲.۵٪ بلندمدت ۱ ساله', rate: 22.5, term: 12 },
    { label: isEn ? '23% 2-Year' : '۲۳٪ بلندمدت ۲ ساله', rate: 23, term: 24 },
  ];

  const calculation = useMemo(() => {
    const P = Number(deposit) || 0;
    const r = Number(rate) || 0;
    const months = Number(termMonths) || 1;

    if (P <= 0 || r <= 0) return null;

    // Daily interest formula by Central Bank of Iran: (P * r) / 36500
    const dailyInterest = Math.round((P * r) / 36500);

    // Monthly interest (standard 30 days): (P * r * 30) / 36500
    const monthlySimple = Math.round((P * r * 30) / 36500);

    // Total for given term (simple)
    const totalSimpleInterest = Math.round((P * r * (months * 30.416)) / 36500);

    // Compound interest calculation if monthly payouts are reinvested
    let compoundTotal = P;
    const monthlyCompoundRate = (r / 100) / 12;
    for (let m = 0; m < months; m++) {
      compoundTotal += compoundTotal * monthlyCompoundRate;
    }
    const compoundInterest = Math.round(compoundTotal - P);

    const effectiveTotalInterest = reinvestInterest ? compoundInterest : totalSimpleInterest;
    const finalAmount = P + effectiveTotalInterest;

    return {
      dailyInterest,
      monthlyInterest: monthlySimple,
      totalInterest: effectiveTotalInterest,
      finalAmount,
      compoundDifference: compoundInterest - totalSimpleInterest,
    };
  }, [deposit, rate, termMonths, reinvestInterest]);

  return (
    <div className="space-y-6">
      {/* Parameters Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isEn ? 'Deposit Parameters & Bank Interest Rates' : 'مشخصات سپرده و نرخ‌های سود بانکی:'}
            </h3>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setRate(p.rate);
                  setTermMonths(p.term);
                }}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Deposit Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              {isEn ? 'Deposit Principal (Toman):' : 'مبلغ اصل سپرده (تومان):'}
            </label>
            <NumericInput
              value={deposit}
              onChange={(val) => setDeposit(val)}
              unit={isEn ? 'Toman' : 'تومان'}
            />
            <span className="text-[11px] text-slate-400 mt-1 block font-mono">
              {isEn ? `${deposit.toLocaleString()} Toman` : `${deposit.toLocaleString('fa-IR')} تومان`}
            </span>
          </div>

          {/* Nominal Rate */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              {isEn ? 'Annual Nominal Rate (%):' : 'نرخ سود اسمی سالانه (%):'}
            </label>
            <div className="relative">
              <input
                type="number"
                step={0.5}
                min={1}
                max={50}
                value={rate}
                onChange={(e) => setRate(Math.max(0.1, Number(e.target.value)))}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {isEn ? 'Central Bank ceiling 20.5% - 23%' : 'مصوب شورای پول و اعتبار: ۲۰.۵٪ تا ۲۳٪'}
            </span>
          </div>

          {/* Term Months */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              {isEn ? 'Deposit Term (Months):' : 'مدت زمان سپرده‌گذاری (ماه):'}
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={termMonths}
              onChange={(e) => setTermMonths(Math.max(1, Math.min(60, Number(e.target.value))))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {isEn ? `${termMonths} months duration` : `${termMonths} ماه سرمایه‌گذاری`}
            </span>
          </div>
        </div>

        {/* Compound Interest Option */}
        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={reinvestInterest}
              onChange={(e) => setReinvestInterest(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-0"
            />
            <span>
              {isEn
                ? 'Calculate with Compound Interest (Monthly Profit Reinvestment)'
                : 'محاسبه سود مرکب (سرمایه‌گذاری مجدد سود ماهانه در سپرده)'}
            </span>
          </label>
        </div>
      </div>

      {/* Results */}
      {calculation && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Monthly */}
            <div className="p-6 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-center shadow-sm">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold block mb-1">
                {isEn ? 'Monthly Payout' : 'سود دریافتی هر ماه'}
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {isEn ? calculation.monthlyInterest.toLocaleString() : calculation.monthlyInterest.toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">{isEn ? ' Toman' : ' تومان'}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {isEn ? 'Standard 30-day monthly deposit profit' : 'واریز ماهانه طبق فرمول رسمی بانک مرکزی'}
              </p>
            </div>

            {/* Total Period Interest */}
            <div className="p-6 rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-center shadow-sm">
              <span className="text-xs text-blue-700 dark:text-blue-300 font-bold block mb-1">
                {isEn ? `Total Profit (${termMonths} Months)` : `مجموع سود کل دوره (${termMonths} ماه)`}
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {isEn ? calculation.totalInterest.toLocaleString() : calculation.totalInterest.toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">{isEn ? ' Toman' : ' تومان'}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {reinvestInterest
                  ? isEn
                    ? `Compound boost: +${calculation.compoundDifference.toLocaleString()} Toman`
                    : `افزایش ناشی از سود مرکب: +${calculation.compoundDifference.toLocaleString('fa-IR')} تومان`
                  : isEn
                  ? 'Total simple interest earnings'
                  : 'مجموع خالص سود پرداختی در پایان دوره'}
              </p>
            </div>

            {/* Final Capital */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-center shadow-lg shadow-emerald-600/20">
              <span className="text-xs text-emerald-100 font-bold block mb-1">
                {isEn ? 'Total Final Balance (Principal + Profit)' : 'مجموع کل سرمایه (اصل + سود)'}
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black font-mono">
                {isEn ? calculation.finalAmount.toLocaleString() : calculation.finalAmount.toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">{isEn ? ' Toman' : ' تومان'}</span>
              </div>
              <p className="text-[11px] text-emerald-100/80 mt-2">
                {isEn ? 'Total balance returned upon maturity' : 'ارزش نهایی دارایی شما در پایان مدت سپرده'}
              </p>
            </div>
          </div>

          {/* Daily Rate Info Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>{isEn ? 'Daily Interest Accrual: ' : 'سود معادل هر روز: '}</span>
              <strong className="text-slate-900 dark:text-white font-mono">
                {isEn ? `${calculation.dailyInterest.toLocaleString()} Toman` : `${calculation.dailyInterest.toLocaleString('fa-IR')} تومان`}
              </strong>
            </span>

            <span className="text-slate-400 font-mono text-[11px]">
              {isEn ? 'Formula: (Principal × Rate × Days) ÷ 36,500' : 'فرمول مصوب: (مبلغ × نرخ × روز) تقسیم بر ۳۶,۵۰۰'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
