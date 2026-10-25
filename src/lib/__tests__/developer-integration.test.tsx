import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { developerTools } from '@/lib/developer-tools';
import { DeveloperToolsList } from '@/lib/registry/developerToolsList';
import { AllToolsList } from '@/lib/registry/tools';
import { getToolDefinition } from '@/config/tools';
import { createHomeFilters, filterHomeTools, getHomeToolHref } from '@/lib/home-catalog';
import DeveloperUtilityWorkbench from '@/components/tools/DeveloperUtilityWorkbench';
import type { DeveloperToolCopies } from '@/lib/developer-tools/types';
import enOne from '@/dictionaries/en/developer-phase-one.json';
import enTwo from '@/dictionaries/en/developer-phase-two.json';
import enThree from '@/dictionaries/en/developer-phase-three.json';
import faOne from '@/dictionaries/fa/developer-phase-one.json';
import faTwo from '@/dictionaries/fa/developer-phase-two.json';
import faThree from '@/dictionaries/fa/developer-phase-three.json';
import enUi from '@/dictionaries/en/developer-ui.json';
import faUi from '@/dictionaries/fa/developer-ui.json';
import enCategories from '@/dictionaries/en/categories.json';
import faCategories from '@/dictionaries/fa/categories.json';

const copies: Record<'fa' | 'en', DeveloperToolCopies> = {
    en: { ...enOne, ...enTwo, ...enThree }, fa: { ...faOne, ...faTwo, ...faThree },
};

describe('developer utilities integration', () => {
    it('registers exactly 23 unique tools with no route collisions', () => {
        expect(developerTools).toHaveLength(23);
        expect(Object.keys(DeveloperToolsList)).toHaveLength(23);
        expect(new Set(Object.values(AllToolsList).map(tool => tool.href)).size).toBe(Object.keys(AllToolsList).length);
        for (const tool of developerTools) {
            expect(AllToolsList[tool.slug]).toBe(DeveloperToolsList[tool.slug]);
            expect(AllToolsList[tool.slug].title).toBe(copies.en[tool.slug].title);
            expect(getToolDefinition(tool.slug)).toBeUndefined();
            expect(() => AllToolsList[tool.slug].transformFunction('private input')).toThrow('unsupported');
            expect(getHomeToolHref(AllToolsList[tool.slug], 'en')).toBe(`/en/${tool.slug}/`);
            expect(getHomeToolHref(AllToolsList[tool.slug], 'fa')).toBe(`/${tool.slug}/`);
        }
        expect(getToolDefinition('json-format')).toBeDefined();
    });

    for (const locale of ['en', 'fa'] as const) {
        it(`has complete ${locale} metadata, field labels, options and categories`, () => {
            const categories: Record<string, string> = locale === 'en' ? enCategories : faCategories;
            for (const tool of developerTools) {
                const copy = copies[locale][tool.slug];
                expect(copy.title).toBeTruthy();
                expect(copy.note).toBeTruthy();
                expect(categories[tool.category]).toBeTruthy();
                expect(categories[tool.subCategory]).toBeTruthy();
                for (const field of tool.fields) {
                    expect(copy.fields[field.id]).toBeTruthy();
                    for (const option of field.options ?? []) {
                        expect(copy.options?.[`${field.id}.${option}`] || copy.options?.[option]).toBeTruthy();
                    }
                }
            }
        });

        it(`makes each ${locale} localized title discoverable through home search`, () => {
            const catalog = Object.values(AllToolsList);
            for (const tool of developerTools) {
                const matches = filterHomeTools(catalog, createHomeFilters(copies[locale][tool.slug].title),
                    meta => ({ ...meta, ...copies[locale][meta.type] }));
                expect(matches.some(match => match.type === tool.slug)).toBe(true);
            }
        });

        it(`server-renders all 23 ${locale} workbenches with safe labeled inputs`, () => {
            const ui = locale === 'en' ? enUi : faUi;
            for (const tool of developerTools) {
                const html = renderToStaticMarkup(<DeveloperUtilityWorkbench tool={tool} copy={copies[locale][tool.slug]} locale={locale} ui={ui} />);
                expect(html).toContain(`dir="${locale === 'fa' ? 'rtl' : 'ltr'}"`);
                expect(html).toContain('aria-live="polite"');
                expect(html).toContain('type="submit"');
                expect(html).toContain('data-editor-readonly="true"');
                expect(html).toContain('cm-editor-shell');
                expect(html).not.toContain('<textarea');
                expect(html).toContain(ui.utf8);
                for (const field of tool.fields) expect(html).toContain(`-${field.id}"`);
                // Do not automatically expose even the public example HMAC secret.
                expect(html).not.toContain('public-demo-key-not-for-production');
            }
        });
    }
});
