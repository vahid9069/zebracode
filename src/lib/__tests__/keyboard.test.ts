import { describe, expect, it } from 'vitest';
import { isModKShortcut } from '@/lib/keyboard';

describe('keyboard shortcuts', () => {
    it('accepts Cmd+K on macOS', () => {
        expect(isModKShortcut({ key: 'k', metaKey: true, ctrlKey: false })).toBe(true);
    });

    it('accepts Ctrl+K on Windows and Linux', () => {
        expect(isModKShortcut({ key: 'K', metaKey: false, ctrlKey: true })).toBe(true);
    });

    it('rejects unrelated keys and unmodified K', () => {
        expect(isModKShortcut({ key: 'k', metaKey: false, ctrlKey: false })).toBe(false);
        expect(isModKShortcut({ key: 'j', metaKey: true, ctrlKey: false })).toBe(false);
    });
});
