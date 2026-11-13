'use client';

import { getToolConfig } from "@/components/utils/tools/helper";
import Converter from '@/components/tools/converter';
import LoremGenerator from '@/components/tools/LoremGenerator';
import PasswordGenerator from '@/components/tools/PasswordGenerator';
import TimestampConverter from '@/components/tools/TimestampConverter';
import DateTimeSuite from '@/components/tools/DateTimeSuite';
import TextDiff from '@/components/tools/TextDiff';
import ImageCompressor from '@/components/tools/ImageCompressor';
import ImageConverter from '@/components/tools/ImageConverter';
import UuidGenerator from '@/components/tools/UuidGenerator';
import HashGenerator from '@/components/tools/HashGenerator';
import CaseConverter from '@/components/tools/CaseConverter';
import SlugGenerator from '@/components/tools/SlugGenerator';
import UniversalConverterWorkbench from '@/components/tools/UniversalConverterWorkbench';
import DeveloperUtilityWorkbench from '@/components/tools/DeveloperUtilityWorkbench';
import { getDeveloperTool } from '@/lib/developer-tools';
import { getToolDefinition } from '@/config/tools';
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
            <div className="flex min-h-[50vh] items-center justify-center text-xl font-semibold text-text-muted">
                {dict?.common?.toolNotFound || (locale === 'en' ? 'Tool not found' : 'ابزار پیدا نشد')}
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
        'timestamp-converter': <DateTimeSuite />,
        'date-diff': <TimestampConverter />,
        'text-diff': <TextDiff
            locale={locale}
            title={locale === 'fa' ? 'مقایسه‌گر متن و سورس کد (Text Diff)' : 'Text and Source Code Diff Checker'}
            description={locale === 'fa'
                ? 'مقایسهٔ زنده و دقیق دو متن یا سورس‌کد با تفکیک تغییرات خط‌به‌خط، کلمه‌ای و کاراکتری. کاملاً در مرورگر و بدون ارسال داده به سرور.'
                : 'Compare two texts or source files live with line, word, and character-level changes. Runs entirely in your browser; no data is sent to a server.'}
        />,
        'image-compressor': <ImageCompressor locale={locale} dict={dict} />,
        'image-converter': <ImageConverter locale={locale} dict={dict} />,
        'uuid-generator': <UuidGenerator locale={locale} dict={dict} />,
        'hash-generator': <HashGenerator locale={locale} dict={dict} />,
        'case-converter': <CaseConverter locale={locale} dict={dict} />,
        'slug-generator': <SlugGenerator locale={locale} dict={dict} />,
    }[toolType as 'lorem-generator' | 'password-generator' | 'timestamp-converter' | 'date-diff' | 'text-diff' | 'image-compressor' | 'image-converter' | 'uuid-generator' | 'hash-generator' | 'case-converter' | 'slug-generator'];

    if (dedicatedTool) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                {dedicatedTool}
            </div>
        );
    }

    const developerTool = getDeveloperTool(toolType);
    if (developerTool && dict?.developerTools?.[toolType] && dict?.developerUi) {
        return <DeveloperUtilityWorkbench
            tool={developerTool}
            copy={dict.developerTools[toolType]}
            locale={locale}
            ui={dict.developerUi}
        />;
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
