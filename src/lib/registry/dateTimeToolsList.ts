// src/contants/toolsList/converters/dateTimeToolsList.ts
import {CalendarRange, Clock, Timer} from 'lucide-react';
import { ToolMeta } from '@/types/types';

export const DateTimeToolsList: Record<string, ToolMeta> = {
    'timestamp-converter': {
        type: 'timestamp-converter',
        category: 'converters',
        subCategory: 'date-time',
        title: 'Unix Timestamp Converter',
        shortDescription: 'Convert Unix timestamp to Persian (Shamsi) and Gregorian date',
        description:
            'Free online Unix timestamp converter with full Persian (Jalali/Shamsi) calendar support. Convert timestamps to human‑readable dates, convert dates back to timestamps, and view the current timestamp in real‑time. All processing is done in your browser — no sign‑up required.',
        icon: Clock,
        href: '/timestamp',
        inputLanguage: 'text',
        outputLanguage: 'text',
        transformFunction: (input: string) => input,
        gradientClasses: 'from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "What is a Unix timestamp?", answer: "A Unix timestamp represents the number of seconds that have elapsed since January 1, 1970 (UTC), often used in programming for time representation." },
                { question: "Does this tool support Persian (Shamsi) dates?", answer: "Yes, you can easily convert Unix timestamps to both Gregorian and Persian (Jalali/Shamsi) calendar formats." },
                { question: "Is the conversion accurate?", answer: "Yes, the tool uses standard JavaScript date libraries to ensure high precision in time conversions across different calendar systems." }
            ]
        }
    },
    'date-diff': {
        type: 'date-diff',
        category: 'converters',
        subCategory: 'date-time',
        title: 'Date & Time Toolbox',
        shortDescription: 'Timestamp converter, date difference calculator and date add/subtract',
        description:
            'A complete set of free online date and time utilities: convert Unix timestamps to Persian or Gregorian dates, calculate differences between two dates, and add/subtract days, hours, minutes or seconds from any date. All processing is done in your browser — no sign‑up required.',
        icon: Timer,
        href: '/date-diff',
        inputLanguage: 'text',
        outputLanguage: 'text',
        transformFunction: () => '',
        gradientClasses: 'from-indigo-50 to-violet-50 dark:from-gray-900 dark:to-gray-800',
        extraContent: {
            faq: [
                { question: "Can I calculate the difference between two dates in days?", answer: "Yes, you can easily input two dates to find the exact number of days, hours, and minutes between them." },
                { question: "Does it support adding time to a date?", answer: "Yes, the tool allows you to add or subtract years, months, days, and time units from a specific date." },
                { question: "Is this tool offline-capable?", answer: "Yes, like all our tools, it runs completely in your browser, meaning it works even without an internet connection once loaded." }
            ]
        }
    },
};