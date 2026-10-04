import { describe, expect, it } from 'vitest';
import { buildDiffRows } from '@/lib/text-diff';

describe('text diff workbench engine', () => {
    it('aligns unchanged lines around an insertion', () => {
        const rows = buildDiffRows('alpha\nomega', 'alpha\nmiddle\nomega', 'line', false, true);

        expect(rows.map(row => row.type)).toEqual(['unchanged', 'added', 'unchanged']);
        expect(rows[1]).toMatchObject({ newText: 'middle', newLine: 2 });
        expect(rows[2]).toMatchObject({ oldLine: 2, newLine: 3 });
    });

    it('pairs a replacement and preserves each side in inline word highlighting', () => {
        const [row] = buildDiffRows('const count = 1;', 'const count = 2;', 'word', false, true);

        expect(row).toMatchObject({ type: 'modified', oldText: 'const count = 1;', newText: 'const count = 2;' });
        expect(row.oldParts?.map(part => part.value).join('')).toBe('const count = 1;');
        expect(row.newParts?.map(part => part.value).join('')).toBe('const count = 2;');
        expect(row.oldParts?.some(part => part.type === 'removed')).toBe(true);
        expect(row.newParts?.some(part => part.type === 'added')).toBe(true);
    });

    it('uses whitespace and case comparison settings without changing displayed source', () => {
        const [ignoredDifference] = buildDiffRows('const value = 1;', 'CONST  value=1;', 'line', true, false);
        const [caseSensitiveDifference] = buildDiffRows('name', 'Name', 'line', false, true);

        expect(ignoredDifference.type).toBe('unchanged');
        expect(ignoredDifference.newText).toBe('CONST  value=1;');
        expect(caseSensitiveDifference.type).toBe('modified');
    });

    it('supports character-level inline changes', () => {
        const [row] = buildDiffRows('color: blue', 'color: navy', 'char', false, true);

        expect(row.type).toBe('modified');
        expect(row.oldParts?.map(part => part.value).join('')).toBe('color: blue');
        expect(row.newParts?.map(part => part.value).join('')).toBe('color: navy');
    });
});
