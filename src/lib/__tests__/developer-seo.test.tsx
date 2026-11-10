import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { developerTools } from '@/lib/developer-tools';
import { developerContent, getDeveloperToolContent } from '@/lib/developer-tools/content';
import { AllToolsList } from '@/lib/registry/tools';
import { generateToolMetadata, getLocalizedUrl } from '@/lib/seo';
import DeveloperToolGuide from '@/components/pages/DeveloperToolGuide';
import ToolStructuredData from '@/components/pages/ToolStructuredData';
import enOne from '@/dictionaries/en/developer-phase-one.json';
import enTwo from '@/dictionaries/en/developer-phase-two.json';
import enThree from '@/dictionaries/en/developer-phase-three.json';
import faOne from '@/dictionaries/fa/developer-phase-one.json';
import faTwo from '@/dictionaries/fa/developer-phase-two.json';
import faThree from '@/dictionaries/fa/developer-phase-three.json';

const titles = { en: { ...enOne, ...enTwo, ...enThree }, fa: { ...faOne, ...faTwo, ...faThree } };
const escapeText = (text: string) => renderToStaticMarkup(<span>{text}</span>).slice(6, -7);
function graphFrom(html: string): Record<string, any>[] {
    const match = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (!match) throw new Error('Missing JSON-LD script');
    return JSON.parse(match[1])['@graph'];
}

describe('localized developer utility SEO and answer content', () => {
    for (const locale of ['fa', 'en'] as const) {
        it(`covers all 23 ${locale} utilities without unrelated keys or generic FAQ fallbacks`, () => {
            const slugs = developerTools.map(tool => tool.slug).sort();
            expect(Object.keys(developerContent[locale]).sort()).toEqual(slugs);
            expect(getDeveloperToolContent('json-format', locale)).toBeUndefined();
            expect(getDeveloperToolContent('missing', locale)).toBeUndefined();
            const descriptions = new Set<string>();
            for (const tool of developerTools) {
                const content = developerContent[locale][tool.slug];
                expect(content.seoTitle.length).toBeGreaterThan(8);
                expect(content.metaDescription.length).toBeGreaterThanOrEqual(100);
                expect(content.metaDescription.length).toBeLessThanOrEqual(175);
                descriptions.add(content.metaDescription);
                expect(content.answer.length).toBeGreaterThan(100);
                expect(content.steps.length).toBeGreaterThanOrEqual(3);
                expect(content.useCases.length).toBeGreaterThanOrEqual(2);
                expect(content.limitations.length).toBeGreaterThanOrEqual(2);
                expect(content.example.input).toBeTruthy();
                expect(content.example.output).toBeTruthy();
                expect(content.faq).toHaveLength(4);
                expect(new Set(content.faq.map(item => item.question)).size).toBe(4);
                for (const item of content.faq) {
                    expect(item.question.length).toBeGreaterThan(12);
                    expect(item.answer.length).toBeGreaterThan(40);
                }
                expect(content.relatedSlugs.length).toBeGreaterThanOrEqual(2);
                for (const slug of content.relatedSlugs) {
                    expect(AllToolsList[slug]).toBeDefined();
                    expect(slug).not.toBe(tool.slug);
                }
                for (const reference of content.references ?? []) {
                    expect(new URL(reference.url).protocol).toBe('https:');
                    expect(reference.label).toBeTruthy();
                }
            }
            expect(descriptions.size).toBe(23);
        });

        it(`renders all ${locale} FAQs, examples and limits into static HTML matching JSON-LD`, () => {
            for (const tool of developerTools) {
                const content = developerContent[locale][tool.slug];
                const copy = titles[locale][tool.slug as keyof typeof titles[typeof locale]];
                const html = renderToStaticMarkup(<DeveloperToolGuide slug={tool.slug} title={copy.title}
                    locale={locale} content={content} toolTitles={titles[locale]} />);
                expect(html).toContain(`<article id="${tool.slug}-guide"`);
                expect(html).not.toContain('<h1');
                expect(html.match(/<details[\s>]/g)).toHaveLength(4);
                expect(html).toContain(escapeText(content.answer));
                expect(html).toContain(escapeText(content.example.output));
                for (const limit of content.limitations) expect(html).toContain(escapeText(limit));
                for (const related of content.relatedSlugs) {
                    // Next's Link normalizes trailing slashes differently outside its build runtime.
                    expect(html).toMatch(new RegExp(`href="${locale === 'en' ? '/en' : ''}/${related}/?"`));
                }
                const graph = graphFrom(renderToStaticMarkup(<ToolStructuredData toolType={tool.slug}
                    locale={locale} title={copy.title} description={content.metaDescription} content={content} />));
                const faqs = graph.filter(node => node['@type'] === 'FAQPage');
                expect(faqs).toHaveLength(1);
                expect(faqs[0].inLanguage).toBe(locale === 'fa' ? 'fa-IR' : 'en-US');
                expect(faqs[0].mainEntity).toEqual(content.faq.map(item => ({
                    '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer },
                })));
                for (const item of content.faq) {
                    expect(html).toContain(escapeText(item.question));
                    expect(html).toContain(escapeText(item.answer));
                }
                expect(graph.some(node => node.aggregateRating || node.review)).toBe(false);
                expect(graph.find(node => node['@type'] === 'WebPage')?.abstract).toBe(content.answer);
            }
        });

        it(`uses specific ${locale} metadata while preserving canonical and hreflang routes`, () => {
            for (const tool of developerTools) {
                const content = developerContent[locale][tool.slug];
                const metadata = generateToolMetadata(tool.slug, locale, content);
                const canonical = getLocalizedUrl(`${locale === 'en' ? '/en' : ''}/${tool.slug}`);
                expect(metadata.title).toContain(content.seoTitle);
                expect(metadata.description).toBe(content.metaDescription);
                expect(metadata.alternates?.canonical).toBe(canonical);
                expect(metadata.alternates?.languages).toEqual({
                    'fa-IR': getLocalizedUrl(`/${tool.slug}`),
                    en: getLocalizedUrl(`/en/${tool.slug}`),
                    'x-default': getLocalizedUrl(`/${tool.slug}`),
                });
                expect(metadata.openGraph).toMatchObject({ description: content.metaDescription, url: canonical });
                expect(metadata.twitter).toMatchObject({ description: content.metaDescription });
            }
        });
    }

    it('does not add hidden generic FAQs to old tools and preserves their metadata fallback', () => {
        const graph = graphFrom(renderToStaticMarkup(<ToolStructuredData toolType="formatJSON" locale="en" />));
        expect(graph.some(node => node['@type'] === 'FAQPage')).toBe(false);
        expect(generateToolMetadata('formatJSON', 'en').description).toBe(AllToolsList['formatJSON'].shortDescription);
    });

    it('escapes script terminators in JSON-LD and renders untrusted example markup as text', () => {
        const payload = '</script><script>alert("not executed")</script>';
        const base = developerContent.en['svg-optimizer'];
        const content = { ...base, answer: payload, example: { input: '<svg onload="alert(1)"/>', output: payload },
            faq: [{ question: payload, answer: payload }] };
        const script = renderToStaticMarkup(<ToolStructuredData toolType="svg-optimizer" locale="en" content={content} />);
        expect(script.match(/<script[\s>]/g)).toHaveLength(1);
        expect(script.match(/<\/script>/g)).toHaveLength(1);
        expect(graphFrom(script).find(node => node['@type'] === 'FAQPage')?.mainEntity[0].acceptedAnswer.text).toBe(payload);
        const html = renderToStaticMarkup(<DeveloperToolGuide slug="svg-optimizer" title="SVG" locale="en" content={content} toolTitles={titles.en} />);
        expect(html).not.toContain('<svg');
        expect(html).not.toContain('<script');
        expect(html).toContain('&lt;svg');
    });
});
