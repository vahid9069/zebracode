'use client';

import React, { useState, useMemo } from 'react';
import {
  Percent,
  Calculator,
  HelpCircle,
  Calendar,
  CreditCard,
  Receipt,
  Sparkles,
  Info
} from 'lucide-react';
import { NumericInput } from '@/components/ui/NumericInput';

interface GharzolhasanehLoanProps {
  locale?: string;
  dict?: any;
}

export function GharzolhasanehLoan({ locale = 'fa', dict }: GharzolhasanehLoanProps) {
  const isEn = locale === 'en';
  const [amount, setAmount] = useState<number>(50000000); // 50M Tomans
  const [months, setMonths] = useState<number>(24); // 24 months

  const calculation = useMemo(() => {
    const P = Number(amount) || 0;
    const n = Number(months) || 1;

    if (P <= 0 || n <= 0) return null;

    // Monthly principal repayment
    const monthlyPrincipal = Math.round(P / n);

    // Official 4% Gharzolhasaneh rules (Bank Mehr Iran & Resalat):
    // Bank charges 4% on remaining principal at the start of each year (Month 1, Month 13, Month 25, etc.)
    const years = Math.ceil(n / 12);
    let totalFee = 0;
    const yearlyFees: Array<{ year: number; monthIndex: number; fee: number; remainingPrincipal: number }> = [];

    for (let y = 0; y < years; y++) {
      const remainingPrincipal = Math.max(0, P - y * 12 * monthlyPrincipal);
      const fee = Math.round(remainingPrincipal * 0.04);
      yearlyFees.push({
        year: y + 1,
        monthIndex: y * 12 + 1,
        fee,
        remainingPrincipal,
      });
      totalFee += fee;
    }

    return {
      monthlyPrincipal,
      totalFee,
      totalRepayment: P + totalFee,
      yearlyFees,
      years,
    };
  }, [amount, months]);

  return (
    <div className="space-y-6">
      {/* Parameters Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Percent className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isEn
              ? '4% Gharzolhasaneh Loan Specs (Qard al-Hasan)'
              : 'مشخصات وام قرض‌الحسنه ۴٪ (بانک مهر ایران، رسالت و صندوق‌ها):'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              {isEn ? 'Loan Amount (Toman):' : 'مبلغ وام (تومان):'}
            </label>
            <NumericInput
              value={amount}
              onChange={(val) => setAmount(val)}
              unit={isEn ? 'Toman' : 'تومان'}
            />
            <span className="text-[11px] text-slate-400 mt-1 block font-mono">
              {isEn ? `${amount.toLocaleString()} Toman` : `${amount.toLocaleString('fa-IR')} تومان`}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              {isEn ? 'Repayment Period (Months):' : 'مدت بازپرداخت (ماه):'}
            </label>
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value={12}>{isEn ? '12 Months (1 Year)' : '۱۲ ماه (۱ ساله)'}</option>
              <option value={24}>{isEn ? '24 Months (2 Years)' : '۲۴ ماه (۲ ساله)'}</option>
              <option value={36}>{isEn ? '36 Months (3 Years)' : '۳۶ ماه (۳ ساله)'}</option>
              <option value={48}>{isEn ? '48 Months (4 Years)' : '۴۸ ماه (۴ ساله)'}</option>
              <option value={60}>{isEn ? '60 Months (5 Years)' : '۶۰ ماه (۵ ساله)'}</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {isEn ? 'Statutory Fixed 4% Annual Bank Fee' : 'کارمزد ثابت ۴٪ سالانه در ابتدای هر سال'}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {calculation && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Monthly Installment */}
            <div className="p-6 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-center shadow-sm">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold block mb-1">
                {isEn ? 'Regular Monthly Installment' : 'مبلغ قسط عادی ماهانه'}
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {isEn ? calculation.monthlyPrincipal.toLocaleString() : calculation.monthlyPrincipal.toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">{isEn ? ' Toman' : ' تومان'}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {isEn ? 'Monthly principal payment for other months' : 'قسط ماهانه بازپرداخت اصل وام'}
              </p>
            </div>

            {/* Total 4% Fee */}
            <div className="p-6 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-center shadow-sm">
              <span className="text-xs text-amber-700 dark:text-amber-400 font-bold block mb-1">
                {isEn ? 'Total 4% Commission Fees' : 'کل کارمزد کل دوره (۴٪ سالانه)'}
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {isEn ? calculation.totalFee.toLocaleString() : calculation.totalFee.toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">{isEn ? ' Toman' : ' تومان'}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {isEn ? 'Total bank fee paid over full duration' : 'مجموع کل کارمزد کسر شده در طول دوره وام'}
              </p>
            </div>

            {/* Total Repayment */}
            <div className="p-6 rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-center shadow-sm">
              <span className="text-xs text-blue-700 dark:text-blue-300 font-bold block mb-1">
                {isEn ? 'Total Repayment (Principal + Fee)' : 'مجموع بازپرداخت (اصل + کارمزد)'}
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {isEn ? calculation.totalRepayment.toLocaleString() : calculation.totalRepayment.toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">{isEn ? ' Toman' : ' تومان'}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {isEn ? 'Entire payment over loan life' : 'کل وجه واریزی به بانک تا تسویه کامل'}
              </p>
            </div>
          </div>

          {/* Yearly Fee Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-500" />
                <span>
                  {isEn
                    ? '4% Fee Payment Schedule (Due in Months 1, 13, 25...)'
                    : 'جدول و زمان‌بندی پرداخت کارمزد ۴٪ (در ماه‌های ۱، ۱۳، ۲۵ و...)'}
                </span>
              </h4>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {calculation.yearlyFees.map((item) => (
                <div key={item.year} className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 font-mono">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-sans">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-400">
                      {isEn ? item.year : item.year.toLocaleString('fa-IR')}
                    </span>
                    <span className="font-bold">
                      {isEn ? `Year ${item.year} (Month ${item.monthIndex})` : `سال ${item.year.toLocaleString('fa-IR')} (ماه ${item.monthIndex.toLocaleString('fa-IR')})`}
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className="text-slate-400 text-[11px]">
                      {isEn
                        ? `Remaining: ${item.remainingPrincipal.toLocaleString()} Toman`
                        : `مانده اصل: ${item.remainingPrincipal.toLocaleString('fa-IR')} تومان`}
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {isEn
                        ? `Fee: ${item.fee.toLocaleString()} Toman`
                        : `کارمزد: ${item.fee.toLocaleString('fa-IR')} تومان`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
            <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              {isEn
                ? 'Note on Gharzolhasaneh Loans: In Iranian Gharzolhasaneh banking (Bank Mehr Iran, Bank Resalat), the 4% commission is collected upfront in the first month of each year (Month 1, Month 13, Month 25, etc.) calculated on the remaining balance at that point, while normal monthly installments cover the loan principal.'
                : 'نکته مهم وام‌های قرض‌الحسنه: در سیستم بانکی ایران (مانند بانک مهر ایران و رسالت)، کارمزد ۴٪ در ماه اول هر سال (یعنی ماه اول، ماه سیزدهم، ماه بیست و پنجم و...) یک‌جا از مشتری کسر می‌شود و اقساط سایر ماه‌ها فقط شامل اصل وام است.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
