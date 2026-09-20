// src/components/SeoContent.tsx
'use client';

import React from 'react';
import {getDefaultFaq} from "@/lib/seo";
import {useOptionalI18n} from "@/i18n/I18nProvider";
import { Card } from "@/components/ui/card";

interface FAQ {
    question: string;
    answer: string;
}

interface SeoSection {
    title: string;
    content: string;
}

interface SeoCopy {
    title: string;
    intro: string;
    sections: SeoSection[];
}

interface Props {
    toolType: string;
    subCategory: string;
    description?: string; // توضیحات متنی (HTML ساده)
    customFaq?: FAQ[];
    locale?: 'fa' | 'en';
}

export default function SeoContent({ toolType, subCategory, description, customFaq, locale = 'en' }: Props) {
    const i18n = useOptionalI18n();
    const faqTranslations = i18n?.dict.common.faqByTool as Record<string, FAQ[]> | undefined;
    const seoTranslations = i18n?.dict.common.seoByTool as Record<string, SeoCopy> | undefined;
    const seoCopy = seoTranslations?.[toolType];
    const translatedFaq: FAQ[] | undefined = locale === 'fa'
        ? faqTranslations?.[toolType] || i18n?.dict.common.faq[subCategory as keyof typeof i18n.dict.common.faq]
        : undefined;
    const faq: FAQ[] = locale === 'fa' && translatedFaq && translatedFaq.length > 0
        ? translatedFaq
        : customFaq && customFaq.length > 0
            ? customFaq
            : getDefaultFaq(subCategory, locale);

    if (!description && !seoCopy && faq.length === 0) return null;

    return (
        <>
            <div className="mt-16 max-w-4xl mx-auto space-y-12 px-4">
                {/* توضیحات */}
                {(description || seoCopy) && (
                    <Card className="prose dark:prose-invert max-w-none p-8">
                        <h2 className="text-2xl font-bold mb-4">
                            {seoCopy?.title || (locale === 'fa' ? 'راهنمای این ابزار' : 'About this tool')}
                        </h2>
                        {seoCopy ? (
                            <>
                                <p>{seoCopy.intro}</p>
                                {seoCopy.sections.map((section) => (
                                    <section key={section.title}>
                                        <h3>{section.title}</h3>
                                        <p>{section.content}</p>
                                    </section>
                                ))}
                            </>
                        ) : (
                            <div dangerouslySetInnerHTML={{ __html: description || '' }} />
                        )}
                    </Card>
                )}

                {/* FAQ */}
                {faq.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">
                            {i18n?.dict.common.faqTitle || (locale === 'fa' ? 'سوالات متداول' : 'Frequently Asked Questions')}
                        </h2>
                        <div className="space-y-4">
                            {faq.map((item, idx) => (
                                <details key={idx} className="group rounded-xl border bg-card p-6 shadow-sm transition-colors open:border-primary/40">
                                    <summary className="text-lg font-semibold list-none flex justify-between items-center">
                                        {item.question}
                                        <svg className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <p className="mt-4 text-muted-foreground leading-relaxed">{item.answer}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}