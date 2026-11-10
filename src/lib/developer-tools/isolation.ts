import { DeveloperToolError } from './types';
import { UTILITY_OUTPUT_LIMIT } from './limits';
import { validateUtilityValues } from './limits';
export { validateUtilityValues } from './limits';

export const UTILITY_TIMEOUT_MS = 5_000;
/** No main-thread fallback: schema regexes and recursive parser work may be untrusted. */
export function runIsolated(slug: string, values: Record<string, string>, signal?: AbortSignal): Promise<string> {
    validateUtilityValues(values);
    if (signal?.aborted) return Promise.reject(new DeveloperToolError('aborted'));
    if (typeof Worker === 'undefined') return Promise.reject(new DeveloperToolError('workerUnavailable'));
    return new Promise((resolve, reject) => {
        let worker: Worker;
        try { worker = new Worker(new URL('./utility.worker.ts', import.meta.url), { type: 'module' }); }
        catch { reject(new DeveloperToolError('workerUnavailable')); return; }
        let done = false;
        const finish = (output?: string, code?: string) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            signal?.removeEventListener('abort', abort);
            worker.terminate();
            if (code) reject(new DeveloperToolError(code));
            else resolve(output ?? '');
        };
        const abort = () => finish(undefined, 'aborted');
        const timer = setTimeout(() => finish(undefined, 'operationTimeout'), UTILITY_TIMEOUT_MS);
        signal?.addEventListener('abort', abort, { once: true });
        worker.onmessage = (event: MessageEvent<{ output?: string; error?: string }>) => {
            if (typeof event.data?.output === 'string') {
                if (event.data.output.length > UTILITY_OUTPUT_LIMIT) finish(undefined, 'outputLimit');
                else finish(event.data.output);
            } else finish(undefined, typeof event.data?.error === 'string' ? event.data.error : 'unexpected');
        };
        worker.onerror = () => finish(undefined, 'unexpected');
        worker.onmessageerror = () => finish(undefined, 'unexpected');
        try { worker.postMessage({ slug, values }); }
        catch { finish(undefined, 'unexpected'); }
    });
}
