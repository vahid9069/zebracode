'use client';

import React, { useState } from 'react';
import { HeartPulse, CheckCircle2, XCircle, ShieldCheck, Info } from 'lucide-react';

type BloodGroup = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

interface Compatibility {
  canGiveTo: BloodGroup[];
  canReceiveFrom: BloodGroup[];
  plasmaGiveTo: BloodGroup[];
  plasmaReceiveFrom: BloodGroup[];
  isUniversalDonor?: boolean;
  isUniversalRecipient?: boolean;
}

const COMPATIBILITY: Record<BloodGroup, Compatibility> = {
  'O-': {
    canGiveTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-'],
    plasmaGiveTo: ['O-'],
    plasmaReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    isUniversalDonor: true,
  },
  'O+': {
    canGiveTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['O-', 'O+'],
    plasmaGiveTo: ['O-', 'O+'],
    plasmaReceiveFrom: ['O+', 'A+', 'B+', 'AB+'],
  },
  'A-': {
    canGiveTo: ['A-', 'A+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-', 'A-'],
    plasmaGiveTo: ['O-', 'A-'],
    plasmaReceiveFrom: ['A-', 'A+', 'AB-', 'AB+'],
  },
  'A+': {
    canGiveTo: ['A+', 'AB+'],
    canReceiveFrom: ['O-', 'O+', 'A-', 'A+'],
    plasmaGiveTo: ['A-', 'A+'],
    plasmaReceiveFrom: ['A+', 'AB+'],
  },
  'B-': {
    canGiveTo: ['B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-', 'B-'],
    plasmaGiveTo: ['O-', 'B-'],
    plasmaReceiveFrom: ['B-', 'B+', 'AB-', 'AB+'],
  },
  'B+': {
    canGiveTo: ['B+', 'AB+'],
    canReceiveFrom: ['O-', 'O+', 'B-', 'B+'],
    plasmaGiveTo: ['B-', 'B+'],
    plasmaReceiveFrom: ['B+', 'AB+'],
  },
  'AB-': {
    canGiveTo: ['AB-', 'AB+'],
    canReceiveFrom: ['O-', 'A-', 'B-', 'AB-'],
    plasmaGiveTo: ['O-', 'A-', 'B-', 'AB-'],
    plasmaReceiveFrom: ['AB-', 'AB+'],
  },
  'AB+': {
    canGiveTo: ['AB+'],
    canReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    plasmaGiveTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    plasmaReceiveFrom: ['AB+'],
    isUniversalRecipient: true,
  },
};

export function BloodType() {
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O+');
  const [showMatrix, setShowMatrix] = useState<boolean>(false);

  const info = COMPATIBILITY[selectedGroup];

  return (
    <div className="space-y-6">
      {/* انتخاب‌گر گروه خونی */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-center space-y-4">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
          گروه خونی خود را انتخاب کنید:
        </label>

        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-lg mx-auto">
          {BLOOD_GROUPS.map((grp) => {
            const isSelected = grp === selectedGroup;
            return (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={`w-14 h-14 rounded-2xl font-black text-base transition-all font-mono flex items-center justify-center ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30 scale-105 ring-4 ring-rose-100 dark:ring-rose-950/60'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {grp}
              </button>
            );
          })}
        </div>

        {/* نشان دهنده عمومی یا گیرنده عمومی */}
        {info.isUniversalDonor && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            دهنده عمومی گلبول قرمز (قابل اهدا به تمام انسان‌ها)
          </div>
        )}
        {info.isUniversalRecipient && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            گیرنده عمومی گلبول قرمز (می‌تواند از تمام گروه‌ها خون دریافت کند)
          </div>
        )}
      </div>

      {/* نتایج دو ستونه اهدا و دریافت */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* شما می‌توانید به این گروه‌ها خون بدهید */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
            <HeartPulse className="w-5 h-5" />
            <h3>شما می‌توانید به گروه‌های زیر خون بدهید:</h3>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {BLOOD_GROUPS.map((grp) => {
              const can = info.canGiveTo.includes(grp);
              return (
                <div
                  key={grp}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    can
                      ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/30 text-slate-300 dark:text-slate-600'
                  }`}
                >
                  <div className="font-mono text-base">{grp}</div>
                  <div className="text-[10px] mt-1 flex items-center justify-center gap-0.5">
                    {can ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{can ? 'سازگار' : 'ناسازگار'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* شما می‌توانید از این گروه‌ها خون دریافت کنید */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
            <HeartPulse className="w-5 h-5" />
            <h3>شما می‌توانید از گروه‌های زیر خون دریافت کنید:</h3>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {BLOOD_GROUPS.map((grp) => {
              const can = info.canReceiveFrom.includes(grp);
              return (
                <div
                  key={grp}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    can
                      ? 'border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-bold'
                      : 'border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/30 text-slate-300 dark:text-slate-600'
                  }`}
                >
                  <div className="font-mono text-base">{grp}</div>
                  <div className="text-[10px] mt-1 flex items-center justify-center gap-0.5">
                    {can ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{can ? 'سازگار' : 'ناسازگار'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* دکمه و جدول ماتریس کلی */}
      <div className="text-center">
        <button
          onClick={() => setShowMatrix(!showMatrix)}
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1.5 transition-colors"
        >
          <Info className="w-4 h-4" />
          {showMatrix ? 'بستن جدول ماتریس جامع' : 'مشاهده جدول ماتریس جامع سازگاری تمام ۸ گروه خونی'}
        </button>
      </div>

      {showMatrix && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm overflow-x-auto">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 text-center">
            ماتریس کامل اهداکننده و گیرنده خون
          </h4>
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <th className="p-2.5 border border-slate-200 dark:border-slate-700">گیرنده \ دهنده</th>
                {BLOOD_GROUPS.map((g) => (
                  <th key={g} className="p-2.5 font-mono border border-slate-200 dark:border-slate-700">{g}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOOD_GROUPS.map((recipient) => (
                <tr key={recipient} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-2.5 font-mono font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    {recipient}
                  </td>
                  {BLOOD_GROUPS.map((donor) => {
                    const compatible = COMPATIBILITY[recipient].canReceiveFrom.includes(donor);
                    return (
                      <td
                        key={donor}
                        className={`p-2.5 border border-slate-200 dark:border-slate-700 font-bold ${
                          compatible
                            ? 'text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      >
                        {compatible ? '✓' : '×'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
