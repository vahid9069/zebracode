// src/components/LoremGenerator.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Copy, Check, RefreshCw, Languages, AlignLeft, Type } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ---------- بانک کلمات برای هر زبان ----------
const wordBanks: Record<string, string[]> = {
    english: [
        'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
        'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
        'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
        'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
        'consequat', 'duis', 'aute', 'irure', 'dolor', 'reprehenderit', 'voluptate',
        'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla', 'pariatur',
        'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt',
        'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
    ],
    persian: [
        'لورم', 'ایپسوم', 'متن', 'ساختگی', 'با', 'تولید', 'سادگی', 'نامفهوم',
        'از', 'صنعت', 'چاپ', 'و', 'با', 'استفاده', 'از', 'طراحان', 'گرافیک',
        'است', 'چاپگرها', 'و', 'متون', 'بلکه', 'روزنامه', 'و', 'مجله',
        'در', 'ستون', 'و', 'سطر', 'آنچنان', 'که', 'لازم', 'است',
        'برای', 'شرایط', 'فعلی', 'تکنولوژی', 'مورد', 'نیاز', 'و', 'کاربردهای',
        'متنوع', 'با', 'هدف', 'بهبود', 'ابزارهای', 'کاربردی', 'می‌باشد',
        'کتابهای', 'زیادی', 'در', 'شصت', 'سه', 'درصد', 'گذشته', 'حال', 'آینده',
    ],
    arabic: [
        'لوريم', 'إيبسوم', 'دولور', 'سيت', 'أميت', 'كونسيكتيتور', 'أديبيسكينغ', 'إيليت',
        'سيد', 'دو', 'إيوسمود', 'تيمبور', 'إنسيديدونت', 'يوت', 'لابوري', 'إت', 'دولوري',
        'ماغنا', 'أليكوا', 'إينيم', 'أد', 'مينيم', 'فينيام', 'كيس', 'نوسترود',
        'إكسيركيتاشن', 'يولامكو', 'لابوريس', 'نيسي', 'أليكيب', 'إكس', 'إي', 'كومودو',
        'كونسيكوات', 'دويس', 'أوتي', 'إيروري', 'دولور', 'ريبرهينديريت', 'فوليبتاتي',
        'فيلت', 'إيسي', 'سيليوم', 'دولوري', 'إيو', 'فوغيات', 'نولا', 'بارياتور',
    ],
    spanish: [
        'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
        'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
        'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
        'ejercicio', 'trabajo', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'comodo',
        'consecuencia', 'duis', 'aute', 'irure', 'dolor', 'reprehenderit', 'voluptate',
        'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla', 'pariatur',
    ],
    french: [
        'lorem', 'ipsum', 'douleur', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
        'sed', 'faire', 'eiusmod', 'temporel', 'incididunt', 'ut', 'labore', 'et', 'douleur',
        'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
        'exercice', 'travail', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commode',
        'conséquence', 'duis', 'aute', 'irure', 'douleur', 'reprehenderit', 'voluptate',
        'velit', 'esse', 'cillum', 'douleur', 'eu', 'fugiat', 'nulla', 'pariatur',
    ],
    german: [
        'lorem', 'ipsum', 'schmerz', 'sitzen', 'amet', 'consectetur', 'adipiscing', 'elit',
        'sed', 'tun', 'eiusmod', 'zeitlich', 'incididunt', 'ut', 'arbeit', 'et', 'schmerz',
        'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
        'übung', 'arbeit', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
        'folge', 'duis', 'aute', 'irure', 'schmerz', 'reprehenderit', 'voluptate',
        'velit', 'esse', 'cillum', 'schmerz', 'eu', 'flucht', 'nulla', 'pariatur',
    ],
};

const languageNames: Record<string, string> = {
    english: 'English',
    persian: 'فارسی',
    arabic: 'العربية',
    spanish: 'Español',
    french: 'Français',
    german: 'Deutsch',
};

// زبان‌های راست‌به‌چپ
const RTL_LANGUAGES = ['persian', 'arabic'];

type OutputMode = 'paragraphs' | 'sentences' | 'words';

export default function LoremGenerator() {
    const [language, setLanguage] = useState('english');
    const [mode, setMode] = useState<OutputMode>('paragraphs');
    const [count, setCount] = useState(3);
    const [output, setOutput] = useState('');
    const [copied, setCopied] = useState(false);

    // تعیین حداکثر بر اساس حالت
    const maxCount = mode === 'paragraphs' ? 20 : mode === 'sentences' ? 50 : 200;

    // آیا زبان فعلی راست‌به‌چپ است؟
    const isRTL = RTL_LANGUAGES.includes(language);

    const generateLorem = useCallback(() => {
        const words = wordBanks[language] || wordBanks.english;
        let result = '';

        if (mode === 'paragraphs') {
            for (let p = 0; p < count; p++) {
                const sentenceCount = Math.floor(Math.random() * 4) + 3;
                const sentences: string[] = [];
                for (let s = 0; s < sentenceCount; s++) {
                    const wordCount = Math.floor(Math.random() * 10) + 5;
                    const sentenceWords: string[] = [];
                    for (let w = 0; w < wordCount; w++) {
                        sentenceWords.push(words[Math.floor(Math.random() * words.length)]);
                    }
                    let sentence = sentenceWords.join(' ');
                    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
                    sentences.push(sentence);
                }
                result += sentences.join(' ') + '\n\n';
            }
        } else if (mode === 'sentences') {
            for (let s = 0; s < count; s++) {
                const wordCount = Math.floor(Math.random() * 10) + 5;
                const sentenceWords: string[] = [];
                for (let w = 0; w < wordCount; w++) {
                    sentenceWords.push(words[Math.floor(Math.random() * words.length)]);
                }
                let sentence = sentenceWords.join(' ');
                sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
                result += sentence + ' ';
            }
        } else if (mode === 'words') {
            const selectedWords: string[] = [];
            for (let w = 0; w < count; w++) {
                selectedWords.push(words[Math.floor(Math.random() * words.length)]);
            }
            result = selectedWords.join(' ');
        }

        setOutput(result.trim());
        setCopied(false);
    }, [language, mode, count]);

    // تولید اولیه
    useEffect(() => {
        generateLorem();
    }, []);

    const handleCopy = async () => {
        if (!output) return;
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-background text-foreground max-w-6xl mx-auto px-4 py-12">
            {/* کارت اصلی */}
            <Card className="rounded-2xl shadow-xl p-8 space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-3">
                        <Languages size={32} className="text-blue-500" />
                        Lorem Ipsum Generator
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Generate dummy text for your designs in multiple languages
                    </p>
                </div>

                {/* تنظیمات */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* انتخاب زبان */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Language
                        </label>
                        <div className="relative">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                {Object.entries(languageNames).map(([key, name]) => (
                                    <option key={key} value={key}>{name}</option>
                                ))}
                            </select>
                            <Languages size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* حالت خروجی */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Output Type
                        </label>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                            {([
                                ['paragraphs', AlignLeft, 'Paragraphs'],
                                ['sentences', Type, 'Sentences'],
                                ['words', Type, 'Words'],
                            ] as [OutputMode, any, string][]).map(([m, Icon, label]) => (
                                <button
                                    key={m}
                                    onClick={() => {
                                        setMode(m);
                                        if (m === 'paragraphs') setCount(Math.min(count, 20));
                                        else if (m === 'sentences') setCount(Math.min(count, 50));
                                        else setCount(Math.min(count, 200));
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                                        mode === m
                                            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500'
                                    }`}
                                >
                                    <Icon size={16} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* تعداد */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Count: {count}
                        </label>
                        <input
                            type="range"
                            min={mode === 'words' ? 10 : 1}
                            max={maxCount}
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                </div>

                {/* دکمهٔ تولید */}
                <Button
                    type="button"
                    onClick={generateLorem}
                    className="w-full"
                >
                    <RefreshCw size={20} />
                    Generate Text
                </Button>

                {/* خروجی */}
                {output && (
                    <div className="relative">
                        <div className="flex items-start bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
              <textarea
                  value={output}
                  readOnly
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className={`flex-1 bg-transparent px-4 py-3 text-base text-gray-900 dark:text-white outline-none resize-none ${
                      isRTL ? 'text-right' : 'text-left'
                  }`}
                  style={{ minHeight: '12rem' }}
                  rows={10}
              />
                            <div className="flex flex-col pr-2 py-2 gap-1">
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
                    </div>
                )}
            </Card>
        </div>
    );
}