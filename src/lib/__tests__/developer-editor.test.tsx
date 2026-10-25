import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import CodeMirrorEditorComponent from '@/components/CodeMirrorEditorComponent';
import DeveloperCodeEditorPanel from '@/components/tools/shared/DeveloperCodeEditorPanel';
import {
    getCodeEditorStats, getDeveloperFieldFormat, getDeveloperFieldLanguage,
    getDeveloperOutputFormat, getDeveloperOutputLanguage,
} from '@/lib/developer-tools/editor-presentation';
import enUi from '@/dictionaries/en/developer-ui.json';
import faUi from '@/dictionaries/fa/developer-ui.json';

describe('developer editor presentation', () => {
    it.each([
        ['jsonpath-tester', 'input', {}, 'json', 'JSON'],
        ['json-schema-validator', 'schema', {}, 'json', 'JSON'],
        ['json-schema-validator', 'data', {}, 'json', 'JSON'],
        ['sql-formatter', 'input', {}, 'sql', 'SQL'],
        ['html-accessibility-checker', 'html', {}, 'html', 'HTML'],
        ['svg-optimizer', 'svg', {}, 'xml', 'SVG'],
        ['yaml-formatter', 'input', {}, 'text', 'YAML'],
        ['openapi-validator', 'document', { document: '{"openapi":"3.1.0"}' }, 'json', 'JSON'],
        ['openapi-validator', 'document', { document: 'openapi: 3.1.0' }, 'text', 'YAML'],
        ['env-parser', 'input', { mode: 'json-to-env' }, 'json', 'JSON'],
        ['env-parser', 'input', { mode: 'env-to-json' }, 'text', 'DOTENV'],
        ['query-string-parser', 'input', { mode: 'json-to-query' }, 'json', 'JSON'],
        ['jwt-encoder-verifier', 'payload', {}, 'json', 'JSON'],
        ['jwt-encoder-verifier', 'token', {}, 'text', 'JWT'],
        ['regex-tester', 'input', {}, 'text', 'TEXT'],
        ['unknown', 'input', {}, 'text', 'TEXT'],
    ])('selects a safe field mode for %s/%s', (slug, field, values, language, format) => {
        expect(getDeveloperFieldLanguage(slug, field, values)).toBe(language);
        expect(getDeveloperFieldFormat(slug, field, values)).toBe(format);
    });

    it.each([
        ['curl-to-fetch', {}, 'javascript', 'JAVASCRIPT'],
        ['env-parser', { mode: 'json-to-env' }, 'text', 'DOTENV'],
        ['env-parser', { mode: 'env-to-json' }, 'json', 'JSON'],
        ['query-string-parser', { mode: 'json-to-query' }, 'text', 'QUERY'],
        ['query-string-parser', { mode: 'query-to-json' }, 'json', 'JSON'],
        ['jwt-encoder-verifier', { mode: 'verify' }, 'json', 'JSON'],
        ['jwt-encoder-verifier', { mode: 'encode' }, 'text', 'JWT'],
        ['regex-tester', {}, 'json', 'JSON'],
        ['sql-formatter', {}, 'sql', 'SQL'],
        ['svg-optimizer', {}, 'xml', 'SVG'],
        ['yaml-formatter', {}, 'text', 'YAML'],
        ['hash-generator', {}, 'text', 'TEXT'],
    ])('selects a format-aware output mode for %s', (slug, values, language, format) => {
        expect(getDeveloperOutputLanguage(slug, values)).toBe(language);
        expect(getDeveloperOutputFormat(slug, values)).toBe(format);
    });

    it('counts real UTF-8 bytes, UTF-16 characters and all line-ending styles', () => {
        expect(getCodeEditorStats('')).toEqual({ lines: 0, characters: 0, bytes: 0 });
        expect(getCodeEditorStats('سلام')).toEqual({ lines: 1, characters: 4, bytes: 8 });
        expect(getCodeEditorStats('😀')).toEqual({ lines: 1, characters: 2, bytes: 4 });
        expect(getCodeEditorStats('a\r\nb\rc\n')).toEqual({ lines: 4, characters: 7, bytes: 7 });
    });

    for (const locale of ['en', 'fa'] as const) {
        it(`renders ${locale} panel chrome, counts and a read-only CodeMirror shell`, () => {
            const ui = locale === 'en' ? enUi : faUi;
            const html = renderToStaticMarkup(<DeveloperCodeEditorPanel id="sample-output" title={ui.output}
                language="json" format="JSON" value="سلام" readOnly locale={locale} ui={ui} describedBy="result-status" />);
            expect(html).toContain('aria-labelledby="sample-output-title"');
            expect(html).toContain('data-editor-id="sample-output"');
            expect(html).toContain('data-editor-language="json"');
            expect(html).toContain('data-editor-readonly="true"');
            expect(html).toContain(ui.bytes);
            expect(html).toContain(new Intl.NumberFormat(locale).format(8));
            expect(html).toContain('dir="ltr"');
            expect(html).not.toContain('<textarea');
            expect(html).not.toContain('Open file');
        });
    }

    it('preserves the original editor toolbar by default and can opt out of it', () => {
        const props = { theme: 'light', language: 'json' as const, value: '', onChange: () => {},
            toolbarConfig: { clear: true, open: true }, rightToolbarButtons: [] };
        expect(renderToStaticMarkup(<CodeMirrorEditorComponent {...props} />)).toContain('aria-label="Open"');
        const hidden = renderToStaticMarkup(<CodeMirrorEditorComponent {...props} showToolbar={false} allowFileDrop={false} />);
        expect(hidden).not.toContain('aria-label="Open"');
        expect(hidden).not.toContain('code-editor-url');
    });
});
