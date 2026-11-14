'use client';

import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Calculator,
  ChevronDown,
  ChevronUp,
  PieChart,
  FileSpreadsheet,
  Download,
  Calendar,
  Percent,
  Coins
} from 'lucide-react';
import { NumericInput } from '@/components/ui/NumericInput';

interface LoanCalculatorProps {
  locale?: string;
  dict?: any;
}

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export function LoanCalculator({ locale = 'fa', dict }: LoanCalculatorProps) {
  const isEn = locale === 'en';
  const [amount, setAmount] = useState<number>(100000000); // 100M Tomans
  const [rate, setRate] = useState<number>(23); // 23% central bank
  const [months, setMonths] = useState<number>(36); // 36 months
  const [showAmortization, setShowAmortization] = useState<boolean>(false);

  const presets = [
    { label: isEn ? '23% Commercial Bank' : '۲۳٪ بانکی تجاری', rate: 23, months: 36 },
    { label: isEn ? '18% Housing Loan' : '۱۸٪ وام مسکن', rate: 18, months: 120 },
    { label: isEn ? '4% Gharzolhasaneh' : '۴٪ قرض‌الحسنه', rate: 4, months: 36 },
    { label: isEn ? '21% Auto Loan' : '۲۱٪ وام خودرو', rate: 21, months: 48 },
  ];

  const { result, schedule } = useMemo(() => {
    const P = Number(amount);
    const r = (Number(rate) / 100) / 12;
    const n = Number(months);

    if (P <= 0 || n <= 0) return { result: null, schedule: [] };

    let monthlyInstallment = 0;
    let totalPayment = 0;
    let totalInterest = 0;
    const schedule: AmortizationRow[] = [];

    if (r === 0) {
      monthlyInstallment = Math.round(P / n);
      totalPayment = P;
      totalInterest = 0;
      let balance = P;
      for (let m = 1; m <= n; m++) {
        balance -= monthlyInstallment;
        schedule.push({
          month: m,
          payment: monthlyInstallment,
          principal: monthlyInstallment,
          interest: 0,
          remainingBalance: Math.max(0, balance),
        });
      }
    } else {
      // Standard Central Bank of Iran annuity formula
      monthlyInstallment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      totalPayment = monthlyInstallment * n;
      totalInterest = totalPayment - P;

      let balance = P;
      for (let m = 1; m <= n; m++) {
        const interestM = balance * r;
        const principalM = monthlyInstallment - interestM;
        balance -= principalM;
        schedule.push({
          month: m,
          payment: Math.round(monthlyInstallment),
          principal: Math.round(principalM),
          interest: Math.round(interestM),
          remainingBalance: Math.max(0, Math.round(balance)),
        });
      }
    }

    return {
      result: {
        monthlyInstallment: Math.round(monthlyInstallment),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment),
        principalRatio: Math.round((P / totalPayment) * 100),
        interestRatio: Math.round((totalInterest / totalPayment) * 100),
      },
      schedule,
    };
  }, [amount, rate, months]);

  const handleExportCSV = () => {
    if (!schedule.length) return;
    const headers = isEn
      ? ['Month', 'Monthly Payment', 'Principal', 'Interest', 'Remaining Balance']
      : ['ماه', 'مبلغ قسط', 'سهم اصل وام', 'سهم سود', 'مانده بدهی'];

    const rows = schedule.map((r) => [
      r.month,
      r.payment,
      r.principal,
      r.interest,
      r.remainingBalance,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan-amortization-${amount}-${months}m.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Inputs Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isEn ? 'Loan Parameters' : 'مشخصات وام و تسهیلات'}
            </h3>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setRate(p.rate);
                  setMonths(p.months);
                }}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Loan Amount (Toman):' : 'مبلغ وام (تومان):'}
            </label>
            <NumericInput
              value={amount}
              onChange={(val) => setAmount(val)}
              unit={isEn ? 'Toman' : 'تومان'}
            />
            <span className="text-[11px] text-slate-400 mt-1.5 block font-mono">
              {isEn ? `${amount.toLocaleString()} Toman` : `${amount.toLocaleString('fa-IR')} تومان`}
            </span>
          </div>

          {/* Annual Interest Rate */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Annual Interest Rate (%):' : 'نرخ سود سالانه (درصد):'}
            </label>
            <div className="relative">
              <input
                type="number"
                step={0.5}
                min={0}
                max={100}
                value={rate}
                onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1.5 block">
              {isEn ? 'Central bank approved rate (23% or 4%)' : 'مصوب بانک مرکزی (۲۳٪ یا قرض‌الحسنه ۴٪)'}
            </span>
          </div>

          {/* Repayment Period */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Repayment Period (Months):' : 'مدت بازپرداخت (ماه):'}
            </label>
            <input
              type="number"
              min={1}
              max={360}
              value={months}
              onChange={(e) => setMonths(Math.max(1, Math.min(360, Number(e.target.value))))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-[11px] text-slate-400 mt-1.5 block">
              {isEn
                ? `${Math.floor(months / 12)} years ${months % 12 > 0 ? `and ${months % 12} months` : ''}`
                : `معادل ${Math.floor(months / 12)} سال ${months % 12 > 0 ? `و ${months % 12} ماه` : ''}`}
            </span>
          </div>
        </div>
      </div>

      {/* Result Metrics */}
      {result && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-800 border border-blue-200/60 dark:border-slate-700 rounded-3xl p-6 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                {isEn ? 'Monthly Installment' : 'مبلغ هر قسط ماهانه'}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {isEn ? result.monthlyInstallment.toLocaleString() : result.monthlyInstallment.toLocaleString('fa-IR')}
              </span>
              <span className="text-xs text-slate-400 block mt-1">{isEn ? 'Toman' : 'تومان'}</span>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-900 dark:to-slate-800 border border-amber-200/60 dark:border-slate-700 rounded-3xl p-6 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                {isEn ? 'Total Interest' : 'کل سود پرداختی به بانک'}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {isEn ? result.totalInterest.toLocaleString() : result.totalInterest.toLocaleString('fa-IR')}
              </span>
              <span className="text-xs text-slate-400 block mt-1">{isEn ? 'Toman' : 'تومان'}</span>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-slate-900 dark:to-slate-800 border border-emerald-200/60 dark:border-slate-700 rounded-3xl p-6 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                {isEn ? 'Total Payment (Principal + Interest)' : 'مجموع بازپرداخت (اصل + سود)'}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {isEn ? result.totalPayment.toLocaleString() : result.totalPayment.toLocaleString('fa-IR')}
              </span>
              <span className="text-xs text-slate-400 block mt-1">{isEn ? 'Toman' : 'تومان'}</span>
            </div>
          </div>

          {/* Breakdown Progress Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-600 dark:text-emerald-400">
                {isEn ? `Principal: ${result.principalRatio}%` : `اصل وام: ${result.principalRatio}%`}
              </span>
              <span className="text-amber-600 dark:text-amber-400">
                {isEn ? `Bank Interest: ${result.interestRatio}%` : `سود بانک: ${result.interestRatio}%`}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${result.principalRatio}%` }} />
              <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${result.interestRatio}%` }} />
            </div>
          </div>

          {/* Toggle Amortization Schedule Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowAmortization(!showAmortization)}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 transition-colors"
              >
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>
                  {isEn
                    ? 'Month-by-Month Amortization Schedule'
                    : 'مشاهده جدول کامل استهلاک و اقساط ماه به ماه'}
                </span>
                {showAmortization ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isEn ? 'Export CSV' : 'خروجی اکسل (CSV)'}</span>
              </button>
            </div>

            {showAmortization && (
              <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800 max-h-96">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 font-bold text-slate-600 dark:text-slate-400">
                        {isEn ? 'Month' : 'ماه'}
                      </th>
                      <th className="p-3 font-bold text-slate-600 dark:text-slate-400">
                        {isEn ? 'Payment (Toman)' : 'قسط ماهانه (تومان)'}
                      </th>
                      <th className="p-3 font-bold text-slate-600 dark:text-slate-400">
                        {isEn ? 'Principal Portion' : 'سهم اصل وام'}
                      </th>
                      <th className="p-3 font-bold text-slate-600 dark:text-slate-400">
                        {isEn ? 'Interest Portion' : 'سهم سود بانک'}
                      </th>
                      <th className="p-3 font-bold text-slate-600 dark:text-slate-400">
                        {isEn ? 'Remaining Debt' : 'مانده بدهی'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {schedule.map((row) => (
                      <tr key={row.month} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 text-slate-500 font-bold">
                          {isEn ? row.month : row.month.toLocaleString('fa-IR')}
                        </td>
                        <td className="p-3 text-slate-800 dark:text-slate-200 font-semibold">
                          {isEn ? row.payment.toLocaleString() : row.payment.toLocaleString('fa-IR')}
                        </td>
                        <td className="p-3 text-emerald-600 dark:text-emerald-400">
                          {isEn ? row.principal.toLocaleString() : row.principal.toLocaleString('fa-IR')}
                        </td>
                        <td className="p-3 text-amber-600 dark:text-amber-400">
                          {isEn ? row.interest.toLocaleString() : row.interest.toLocaleString('fa-IR')}
                        </td>
                        <td className="p-3 text-slate-500">
                          {isEn ? row.remainingBalance.toLocaleString() : row.remainingBalance.toLocaleString('fa-IR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
