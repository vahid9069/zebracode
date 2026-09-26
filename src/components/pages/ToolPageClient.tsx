'use client';

import { getToolConfig } from "@/components/utils/tools/helper";
import Converter from '@/components/tools/converter';
import LoremGenerator from '@/components/tools/LoremGenerator';
import PasswordGenerator from '@/components/tools/PasswordGenerator';
import TimestampConverter from '@/components/tools/TimestampConverter';
import DateTimeSuite from '@/components/tools/DateTimeSuite';
import TextDiff from '@/components/tools/TextDiff';
import UniversalConverterWorkbench from '@/components/tools/UniversalConverterWorkbench';
import { getToolDefinition } from '@/config/tools';
import SeoContent from '@/components/pages/SeoContent';
import React from 'react';

interface ToolPageClientProps {
    toolType: string;
    locale?: 'fa' | 'en';
    dict?: any;
}

export default function ToolPageClient({ toolType, locale = 'fa', dict }: ToolPageClientProps) {
    // ۱. گرفتن تنظیمات پایه (انگلیسی) از رجیستری
    const baseConfig = getToolConfig(toolType);
    
    if (!baseConfig) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-xl font-semibold text-gray-600 dark:text-gray-300">
                {locale === 'en' ? 'Tool not found' : 'ابزار پیدا نشد'}
            </div>
        );
    }

    // ۲. استخراج ترجمه این ابزار خاص از فایل JSON
    const toolTranslation = dict?.tools?.[toolType];

    // ۳. ترکیب (Override) متون ترجمه شده با دیتای اصلی
    const config = {
        ...baseConfig,
        title: toolTranslation?.title || baseConfig.title,
        shortDescription: toolTranslation?.shortDescription || baseConfig.shortDescription,
        description: toolTranslation?.description || baseConfig.description,
    };

    const dedicatedTool = {
        'lorem-generator': <LoremGenerator locale={locale} dict={dict?.tools} />,
        'password-generator': <PasswordGenerator />,
        'timestamp-converter': <TimestampConverter />,
        'date-diff': <DateTimeSuite />,
        'text-diff': <TextDiff
            locale={locale}
            title={locale === 'fa' ? 'مقایسه‌گر متن و سورس کد (Text Diff)' : 'Text and Source Code Diff Checker'}
            description={locale === 'fa'
                ? 'مقایسهٔ زنده و دقیق دو متن یا سورس‌کد با تفکیک تغییرات خط‌به‌خط، کلمه‌ای و کاراکتری. کاملاً در مرورگر و بدون ارسال داده به سرور.'
                : 'Compare two texts or source files live with line, word, and character-level changes. Runs entirely in your browser; no data is sent to a server.'}
        />,
    }[toolType as 'lorem-generator' | 'password-generator' | 'timestamp-converter' | 'date-diff' | 'text-diff'];

    if (dedicatedTool) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                {dedicatedTool}
                {!['lorem-generator', 'password-generator', 'timestamp-converter', 'date-diff', 'text-diff'].includes(toolType) && (
                    <SeoContent
                        toolType={config.type}
                        subCategory={config.subCategory || 'others'}
                        description={config.extraContent?.description || config.description}
                        customFaq={config.extraContent?.faq}
                        locale={locale}
                    />
                )}
            </div>
        );
    }

    const slug = config.href.split('/').filter(Boolean).pop() || toolType;
    const toolDefinition = getToolDefinition(slug);
    if (toolDefinition) {
        return <UniversalConverterWorkbench
            tool={toolDefinition}
            locale={locale}
            title={config.title}
            description={config.description}
            category={dict?.categories?.[toolDefinition.category] || toolDefinition.category}
        />;
    }
    
    // حالا Converter دیتای کاملا ترجمه‌شده (یا فال‌بک انگلیسی) را دریافت می‌کند
    return <Converter config={config} locale={locale} />;
}