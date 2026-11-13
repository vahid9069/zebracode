import { describe, expect, it } from 'vitest';
import {
    calculateTextStatistics,
    convertToAllCases,
    extractWords,
    toAlternatingCase,
    toCamelCase,
    toConstantCase,
    toDotCase,
    toInvertedCase,
    toKebabCase,
    toPascalCase,
    toPathCase,
    toSentenceCase,
    toSnakeCase,
    toTitleCase,
    toTrainCase,
} from '@/lib/case-converter/converter';

describe('Case Converter utilities', () => {
    describe('extractWords', () => {
        it('parses camelCase into individual words', () => {
            expect(extractWords('userProfileData')).toEqual(['user', 'Profile', 'Data']);
        });

        it('parses PascalCase into individual words', () => {
            expect(extractWords('UserProfileComponent')).toEqual(['User', 'Profile', 'Component']);
        });

        it('parses acronyms correctly', () => {
            expect(extractWords('HTTPResponseCode')).toEqual(['HTTP', 'Response', 'Code']);
            expect(extractWords('parseJSONString')).toEqual(['parse', 'JSON', 'String']);
        });

        it('parses mixed delimiters (hyphens, underscores, dots, slashes)', () => {
            expect(extractWords('hello_world-test.data/sample')).toEqual(['hello', 'world', 'test', 'data', 'sample']);
        });
    });

    describe('Naming Case Conversions', () => {
        const words = ['user', 'profile', 'token'];

        it('converts to camelCase', () => {
            expect(toCamelCase(words)).toBe('userProfileToken');
        });

        it('converts to PascalCase', () => {
            expect(toPascalCase(words)).toBe('UserProfileToken');
        });

        it('converts to snake_case', () => {
            expect(toSnakeCase(words)).toBe('user_profile_token');
        });

        it('converts to kebab-case', () => {
            expect(toKebabCase(words)).toBe('user-profile-token');
        });

        it('converts to CONSTANT_CASE', () => {
            expect(toConstantCase(words)).toBe('USER_PROFILE_TOKEN');
        });

        it('converts to Title Case', () => {
            expect(toTitleCase('user profile token', words)).toBe('User Profile Token');
        });

        it('converts to Sentence case', () => {
            expect(toSentenceCase('hello world. how are you? fine!')).toBe('Hello world. How are you? Fine!');
        });

        it('converts to dot.case', () => {
            expect(toDotCase(words)).toBe('user.profile.token');
        });

        it('converts to path/case', () => {
            expect(toPathCase(words)).toBe('user/profile/token');
        });

        it('converts to Train-Case', () => {
            expect(toTrainCase(words)).toBe('User-Profile-Token');
        });

        it('converts to alternating case', () => {
            expect(toAlternatingCase('hello')).toBe('hElLo');
        });

        it('converts to inverted case', () => {
            expect(toInvertedCase('Hello World')).toBe('hELLO wORLD');
        });
    });

    describe('calculateTextStatistics', () => {
        it('calculates characters, words, lines and reading time accurately', () => {
            const sample = 'First paragraph with some words.\n\nSecond line here.';
            const stats = calculateTextStatistics(sample);

            expect(stats.words).toBe(8);
            expect(stats.lines).toBe(3);
            expect(stats.paragraphs).toBe(2);
            expect(stats.charactersWithSpaces).toBe(sample.length);
            expect(stats.readingTimeSeconds).toBeGreaterThan(0);
        });
    });

    describe('convertToAllCases', () => {
        it('returns all 14 case styles simultaneously', () => {
            const list = convertToAllCases('user_name');
            expect(list.length).toBe(14);

            const map = Object.fromEntries(list.map((item) => [item.id, item.value]));
            expect(map.camel).toBe('userName');
            expect(map.pascal).toBe('UserName');
            expect(map.snake).toBe('user_name');
            expect(map.kebab).toBe('user-name');
            expect(map.constant).toBe('USER_NAME');
            expect(map.dot).toBe('user.name');
        });
    });
});
