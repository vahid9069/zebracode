'use client';

import { getToolConfig } from "@/components/utils/tools/helper";
import Converter from '@/components/tools/converter';

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
    
    // حالا Converter دیتای کاملا ترجمه‌شده (یا فال‌بک انگلیسی) را دریافت می‌کند
    return <Converter config={config} />;
}