import { afterEach, describe, expect, it, vi } from 'vitest';
import { runIsolated, UTILITY_TIMEOUT_MS } from '@/lib/developer-tools/isolation';
import { UTILITY_INPUT_LIMIT, UTILITY_OUTPUT_LIMIT, validateUtilityValues } from '@/lib/developer-tools/limits';
import { getDeveloperTool } from '@/lib/developer-tools';

class FakeWorker {
    static latest: FakeWorker;
    onmessage: ((event: { data: unknown }) => void) | null = null;
    onerror: (() => void) | null = null;
    onmessageerror: (() => void) | null = null;
    terminate = vi.fn();
    postMessage = vi.fn();
    constructor() { FakeWorker.latest = this; }
}

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('isolated utility runner', () => {
    it('terminates a completed worker and returns plain text', async () => {
        vi.stubGlobal('Worker', FakeWorker);
        const pending = runIsolated('json-schema-validator', { schema: '{}', data: '{}' });
        expect(FakeWorker.latest.postMessage).toHaveBeenCalledWith({ slug: 'json-schema-validator', values: { schema: '{}', data: '{}' } });
        FakeWorker.latest.onmessage?.({ data: { output: '{"valid":true}' } });
        expect(await pending).toBe('{"valid":true}');
        expect(FakeWorker.latest.terminate).toHaveBeenCalledOnce();
    });

    it('terminates on cancellation and ignores later results', async () => {
        vi.stubGlobal('Worker', FakeWorker);
        const controller = new AbortController();
        const pending = runIsolated('json-schema-validator', {}, controller.signal);
        const assertion = expect(pending).rejects.toMatchObject({ code: 'aborted' });
        controller.abort();
        FakeWorker.latest.onmessage?.({ data: { output: 'late' } });
        await assertion;
        expect(FakeWorker.latest.terminate).toHaveBeenCalledOnce();
    });

    it('fails closed without workers or with an already cancelled operation', async () => {
        vi.stubGlobal('Worker', undefined);
        await expect(runIsolated('json-schema-validator', {})).rejects.toMatchObject({ code: 'workerUnavailable' });
        const controller = new AbortController(); controller.abort();
        await expect(runIsolated('json-schema-validator', {}, controller.signal)).rejects.toMatchObject({ code: 'aborted' });
    });

    it('stops pathological jobs after a fixed deadline', async () => {
        vi.useFakeTimers(); vi.stubGlobal('Worker', FakeWorker);
        const pending = runIsolated('json-schema-validator', {});
        const assertion = expect(pending).rejects.toMatchObject({ code: 'operationTimeout' });
        await vi.advanceTimersByTimeAsync(UTILITY_TIMEOUT_MS);
        await assertion;
        expect(FakeWorker.latest.terminate).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('handles error messages, worker failures and excessive outputs safely', async () => {
        vi.stubGlobal('Worker', FakeWorker);
        const pending = runIsolated('sql-formatter', {});
        FakeWorker.latest.onmessage?.({ data: { error: 'sqlInvalid' } });
        await expect(pending).rejects.toMatchObject({ code: 'sqlInvalid' });
        const failed = runIsolated('sql-formatter', {});
        FakeWorker.latest.onerror?.();
        await expect(failed).rejects.toMatchObject({ code: 'unexpected' });
        const large = runIsolated('sql-formatter', {});
        FakeWorker.latest.onmessage?.({ data: { output: 'x'.repeat(UTILITY_OUTPUT_LIMIT + 1) } });
        await expect(large).rejects.toMatchObject({ code: 'outputLimit' });
    });

    it('limits every registered tool field before processing', () => {
        const values = { input: 'x'.repeat(UTILITY_INPUT_LIMIT + 1) };
        expect(() => validateUtilityValues(values)).toThrow('inputLimit');
        expect(() => getDeveloperTool('hash-generator')!.run(values)).toThrow('inputLimit');
    });
});
