// src/components/PasswordGenerator.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
    Copy,
    RefreshCw,
    Check,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Eye,
    EyeOff,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'zebracode_password_history';

export default function PasswordGenerator() {
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [includeLower, setIncludeLower] = useState(true);
    const [includeUpper, setIncludeUpper] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [history, setHistory] = useState<string[]>([]);

    // بازیابی تاریخچه از localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setHistory(JSON.parse(saved));
        } catch {}
    }, []);

    // تولید رمز
    const generatePassword = useCallback(() => {
        let chars = '';
        if (includeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (includeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeNumbers) chars += '0123456789';
        if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (!chars) {
            setPassword('Select at least one option');
            return;
        }

        let result = '';
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            result += chars[array[i] % chars.length];
        }

        setPassword(result);
        setCopied(false);
    }, [length, includeLower, includeUpper, includeNumbers, includeSymbols]);

    // تولید اولیه
    useEffect(() => {
        generatePassword();
    }, []);

    // ذخیره در تاریخچه (حداکثر ۵ مورد)
    const saveToHistory = (pwd: string) => {
        const updated = [pwd, ...history.filter((h) => h !== pwd)].slice(0, 5);
        setHistory(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    // کپی در کلیپ‌بورد
    const handleCopy = async () => {
        if (!password) return;
        await navigator.clipboard.writeText(password);
        setCopied(true);
        saveToHistory(password);
        setTimeout(() => setCopied(false), 2000);
    };

    // محاسبه قدرت رمز
    const getStrength = (): {
        label: string;
        color: string;
        icon: React.ReactNode;
    } => {
        let score = 0;
        if (length >= 12) score++;
        if (includeLower && includeUpper) score++;
        if (includeNumbers) score++;
        if (includeSymbols) score++;
        if (length >= 20) score++;

        if (score >= 4)
            return {
                label: 'Strong',
                color: 'text-green-500',
                icon: <ShieldCheck size={18} />,
            };
        if (score >= 2)
            return {
                label: 'Medium',
                color: 'text-yellow-500',
                icon: <ShieldAlert size={18} />,
            };
        return {
            label: 'Weak',
            color: 'text-red-500',
            icon: <Shield size={18} />,
        };
    };

    const strength = getStrength();

    return (
        <div className="min-h-screen bg-background text-foreground max-w-2xl mx-auto px-4 py-12">
            {/* کارت اصلی */}
            <Card className="rounded-2xl shadow-xl p-8 space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Password Generator
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Generate strong, random passwords instantly.
                    </p>
                </div>

                {/* نمایش رمز */}
                <div className="relative">
                    <div className="flex items-start bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <textarea
                value={password}
                readOnly
                rows={3}
                className="flex-1 bg-transparent px-4 py-3 text-base font-mono text-gray-900 dark:text-white outline-none resize-none"
                style={{ minHeight: '4.5rem' }}
            />
                        <div className="flex flex-col pr-2 py-2 gap-1">
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                            <button
                                onClick={handleCopy}
                                className={`p-2 rounded-lg transition-colors ${
                                    copied
                                        ? 'bg-green-100 dark:bg-green-900 text-green-600'
                                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* نشانگر قدرت */}
                    <div className={`flex items-center gap-1 mt-2 ml-2 ${strength.color}`}>
                        {strength.icon}
                        <span className="text-xs font-medium">{strength.label}</span>
                    </div>
                </div>

                {/* تنظیمات */}
                <div className="space-y-5">
                    {/* اسلایدر طول با نشانگر پیشرفت رنگی */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Length: {length}
                            </label>
                            <span className="text-xs text-gray-400">8–64</span>
                        </div>
                        <div className="relative w-full h-7 flex items-center">
                            {/* پس‌زمینهٔ کل مسیر */}
                            <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg -translate-y-1/2" />

                            {/* نوار پیشرفت رنگی */}
                            <div
                                className="absolute top-1/2 left-0 h-2 rounded-lg -translate-y-1/2 pointer-events-none transition-all duration-150"
                                style={{
                                    width: `${((length - 8) / (64 - 8)) * 100}%`,
                                    backgroundColor:
                                        length < 12
                                            ? '#ef4444'       // red
                                            : length < 20
                                                ? '#eab308'     // yellow
                                                : length < 32
                                                    ? '#3b82f6'   // blue
                                                    : '#10b981',  // green
                                }}
                            />

                            {/* اسلایدر واقعی */}
                            <input
                                type="range"
                                min={8}
                                max={64}
                                value={length}
                                onChange={(e) => setLength(Number(e.target.value))}
                                className="relative w-full h-full appearance-none cursor-pointer bg-transparent z-10
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:dark:bg-gray-200
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-blue-600
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-all
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-webkit-slider-thumb]:mt-[-2px]
                  [&::-moz-range-thumb]:appearance-none
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:dark:bg-gray-200
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:shadow-md
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-blue-600
                  [&::-moz-range-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:transition-all
                  [&::-moz-range-thumb]:hover:scale-110"
                            />
                        </div>
                    </div>

                    {/* چک‌باکس‌ها */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            {
                                label: 'Lowercase (a-z)',
                                value: includeLower,
                                setter: setIncludeLower,
                            },
                            {
                                label: 'Uppercase (A-Z)',
                                value: includeUpper,
                                setter: setIncludeUpper,
                            },
                            {
                                label: 'Numbers (0-9)',
                                value: includeNumbers,
                                setter: setIncludeNumbers,
                            },
                            {
                                label: 'Symbols (!@#...)',
                                value: includeSymbols,
                                setter: setIncludeSymbols,
                            },
                        ].map(({ label, value, setter }) => (
                            <label
                                key={label}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={(e) => setter(e.target.checked)}
                                    className="w-4 h-4 rounded accent-blue-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {label}
                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* دکمهٔ تولید مجدد */}
                <Button
                    type="button"
                    onClick={generatePassword}
                    className="w-full"
                >
                    <RefreshCw size={20} />
                    Generate New Password
                </Button>
            </Card>

            {/* تاریخچه */}
            {history.length > 0 && (
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Recent Passwords
                    </h3>
                    <ul className="space-y-2">
                        {history.map((pwd, idx) => (
                            <li
                                key={idx}
                                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2"
                            >
                <span className="font-mono text-sm text-gray-800 dark:text-gray-200 truncate">
                  {pwd}
                </span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(pwd);
                                        setPassword(pwd);
                                    }}
                                    className="text-gray-400 hover:text-blue-500 transition-colors ml-2"
                                >
                                    <Copy size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}