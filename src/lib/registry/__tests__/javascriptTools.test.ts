// src/lib/registry/__tests__/javascriptTools.test.ts
import { describe, it, expect } from 'vitest';
import { JavascriptToolsList } from '@/lib/registry';
import { samples } from '@/lib/registry';

// ------------------------------------------------------------
// تابع کمکی برای استخراج رشته از خروجی (string یا object)
// ------------------------------------------------------------
function extractString(output: any): string {
    if (typeof output === 'string') return output;
    if (output && typeof output === 'object') {
        // ممکن است پرامیس، یا شیء دارای result/output باشد
        if (output.result) return extractString(output.result);
        if (output.output) return extractString(output.output);
        return JSON.stringify(output);
    }
    return '';
}

// ------------------------------------------------------------
// 1. تست‌های اعتبارسنجی خروجی (بررسی صحت تبدیل) با نمونهٔ ساده
// ------------------------------------------------------------
describe('JavaScript Converters – output correctness (simple sample)', () => {
    it('es5-to-es6: should convert var to const/let and use arrow functions', async () => {
        const result = JavascriptToolsList['es5-to-es6'].transformFunction(samples.javascript.simple);
        const output = result instanceof Promise ? await result : result;
        const text = extractString(output);
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
        expect(text).toMatch(/(const|let|=>|`)/);
    });

    it('es6-to-es5: should remove arrow functions and use var/function', async () => {
        const result = JavascriptToolsList['es6-to-es5'].transformFunction(samples.javascript.simple);
        const output = result instanceof Promise ? await result : result;
        const text = extractString(output);
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
        expect(text).not.toMatch(/=>/);
        expect(text).toMatch(/(var |function )/);
    });

    it('js-to-json: should output valid JSON from a JS object literal', async () => {
        // استفاده از یک شیء جاوااسکریپت ساده (نه تابع)
        const jsObject = `{ name: "Ali", age: 28 }`;
        const result = JavascriptToolsList['js-to-json'].transformFunction(jsObject);
        const output = result instanceof Promise ? await result : result;
        const text = extractString(output);
        // باید یک JSON معتبر باشد
        expect(() => JSON.parse(text)).not.toThrow();
        const parsed = JSON.parse(text);
        expect(parsed).toHaveProperty('name', 'Ali');
        expect(parsed).toHaveProperty('age', 28);
    });

    it('js-to-typescript: should produce TypeScript code with type annotations', async () => {
        const result = JavascriptToolsList['js-to-typescript'].transformFunction(samples.javascript.simple);
        const output = result instanceof Promise ? await result : result;
        const text = extractString(output);
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
        // باید حداقل یک type annotation (مانند : any, : string, : number) یا interface/type داشته باشد
        expect(text).toMatch(/(interface |type |: )/);
    });
});

// ------------------------------------------------------------
// 2. تست‌های پایداری (عدم کرش) با نمونهٔ پیچیده
// ------------------------------------------------------------
describe('JavaScript Converters – stability (complex sample)', () => {
    Object.entries(JavascriptToolsList).forEach(([type, tool]) => {
        if (type === 'js-to-json' || type === 'jsToJson') return;
        it(`${type}: should not crash with complex input`, () => {
            expect(() => {
                tool.transformFunction(samples.javascript.complex);
            }).not.toThrow();
        });
    });
});