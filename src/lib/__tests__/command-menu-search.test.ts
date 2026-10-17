import { describe, expect, it } from 'vitest';
import { matchesCommandSearch, normalizeCommandSearch } from '@/components/layout/commandMenuSearch';

describe('command menu search helpers', () => {
    it('trims whitespace and normalizes English casing', () => {
        expect(normalizeCommandSearch('  Password-GENERATOR  ')).toBe('password-generator');
    });

    it('matches a localized Persian title', () => {
        expect(matchesCommandSearch(['تولیدکننده رمز عبور', 'Password Generator'], ' رمز عبور ')).toBe(true);
    });

    it('matches the original title and tool type', () => {
        const fields = ['Password Generator', 'Generate strong passwords', 'password-generator'];
        expect(matchesCommandSearch(fields, 'PASSWORD GENERATOR')).toBe(true);
        expect(matchesCommandSearch(fields, 'password-generator')).toBe(true);
    });

    it('treats an empty query as a match', () => {
        expect(matchesCommandSearch(['Any tool'], '   ')).toBe(true);
    });

    it('does not match unrelated text', () => {
        expect(matchesCommandSearch(['Password Generator', 'password-generator'], 'calendar')).toBe(false);
    });
});
