import { evaluateRegex, type RegexRequest } from './regex-helper';
import { DeveloperToolError } from './types';

const scope = globalThis as unknown as {
    onmessage: ((event: MessageEvent<RegexRequest>) => void) | null;
    postMessage: (value: { output: string } | { error: string }) => void;
};

scope.onmessage = event => {
    try {
        scope.postMessage({ output: evaluateRegex(event.data) });
    } catch (error) {
        scope.postMessage({ error: error instanceof DeveloperToolError ? error.code : 'regexFailed' });
    }
};
