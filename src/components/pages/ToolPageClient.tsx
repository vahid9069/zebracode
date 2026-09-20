'use client';

import { getToolConfig } from "@/components/utils/tools/helper";
import Converter from '@/components/tools/converter';
import LoremGenerator from '@/components/tools/LoremGenerator';
import PasswordGenerator from '@/components/tools/PasswordGenerator';
import TimestampConverter from '@/components/tools/TimestampConverter';
import DateTimeSuite from '@/components/tools/DateTimeSuite';
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
        'lorem-generator': <LoremGenerator />,
        'password-generator': <PasswordGenerator />,
        'timestamp-converter': <TimestampConverter />,
        'date-diff': <DateTimeSuite />,
    }[toolType as 'lorem-generator' | 'password-generator' | 'timestamp-converter' | 'date-diff'];

    if (dedicatedTool) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                {dedicatedTool}
                <SeoContent
                    toolType={config.type}
                    subCategory={config.subCategory || 'others'}
                    description={config.extraContent?.description || config.description}
                    customFaq={config.extraContent?.faq}
                    locale={locale}
                />
            </div>
        );
    }
    
    // حالا Converter دیتای کاملا ترجمه‌شده (یا فال‌بک انگلیسی) را دریافت می‌کند
    return <Converter config={config} locale={locale} />;
}