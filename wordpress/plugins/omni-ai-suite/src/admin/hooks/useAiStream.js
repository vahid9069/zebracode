import { useState, useCallback, useRef } from '@wordpress/element';
import { buildApiUrl, apiFetch } from '../utils/api';

/**
 * Custom React hook for real-time Server-Sent Events (SSE) AI streaming.
 * Adheres to Phase 2 & Phase 3 specifications:
 * - Uses POST fetch with X-WP-Nonce
 * - Reads chunks with response.body.getReader() & TextDecoder
 * - Incremental DOM updates
 * - Automatically triggers secondary REST API call upon completion to save to custom table
 */
export function useAiStream() {
  const [streaming, setStreaming] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const startStream = useCallback(async ({
    prompt,
    provider,
    model,
    systemPrompt = '',
    temperature = 0.7,
    maxTokens = 2048,
    onFinish = null,
  }) => {
    if (!prompt || !prompt.trim()) {
      setError('Prompt is required.');
      return;
    }

    setStreaming(true);
    setOutput('');
    setError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const nonce = window.omniAiData?.nonce || '';
    let accumulatedText = '';

    try {
      const streamBody = JSON.stringify({
        prompt,
        provider,
        model,
        system_prompt: systemPrompt,
        temperature,
        max_tokens: maxTokens,
      });

      let streamUrl = buildApiUrl('stream-ai');
      let response = await fetch(streamUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: streamBody,
        signal: abortController.signal,
      });

      // Retry with plain route if 404
      if (response.status === 404 && !streamUrl.includes('rest_route=')) {
        streamUrl = buildApiUrl('stream-ai', {}, true);
        response = await fetch(streamUrl, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': nonce,
          },
          body: streamBody,
          signal: abortController.signal,
        });
      }

      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData && (errData.message || errData.error)) {
            errorMessage = errData.message || errData.error;
          }
        } catch (_) {
          // If response is not JSON or stream text, fallback to status text
        }
        setError(errorMessage);
        setStreaming(false);
        abortControllerRef.current = null;

        // Log connection/HTTP failure
        try {
          await apiFetch('save-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt,
              response: `ERROR: ${errorMessage}`,
              model: model || 'default',
              provider: provider || 'default',
              tokens: 0,
            }),
          });
        } catch (_) {}

        return;
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let hasError = false;
      let streamErrorMessage = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep unfinished line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (!dataStr) continue;

            let parsed = null;
            try {
              parsed = JSON.parse(dataStr);
            } catch (err) {
              continue;
            }

            if (parsed.error) {
              streamErrorMessage = parsed.error;
              setError(parsed.error);
              hasError = true;
              break;
            }
            if (parsed.text) {
              accumulatedText += parsed.text;
              setOutput((prev) => prev + parsed.text);
            }
            if (parsed.done) {
              break;
            }
          }
        }
        if (hasError) break;
      }

      // Phase 3: Post-stream saving to custom table (zero CPT/meta bloat)
      if (hasError) {
        try {
          await apiFetch('save-log', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt,
              response: `ERROR: ${streamErrorMessage || 'Unknown streaming error'}`,
              model: model || 'default',
              provider: provider || 'default',
              tokens: 0,
            }),
          });
        } catch (_) {}
      } else if (accumulatedText.trim().length > 0) {
        try {
          await apiFetch('save-log', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt,
              response: accumulatedText,
              model: model || 'default',
              provider: provider || 'default',
              tokens: Math.round(accumulatedText.split(/\s+/).length * 1.3),
            }),
          });
        } catch (saveErr) {
          console.warn('[Omni AI Suite] Log save failed:', saveErr);
        }
      }

      if (typeof onFinish === 'function') {
        onFinish(accumulatedText);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        const errMsg = err.message || 'Stream connection error occurred.';
        setError(errMsg);
        try {
          await apiFetch('save-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt,
              response: `ERROR: ${errMsg}`,
              model: model || 'default',
              provider: provider || 'default',
              tokens: 0,
            }),
          });
        } catch (_) {}
      }
    } finally {
      setStreaming(false);
      abortControllerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStreaming(false);
    }
  }, []);

  return {
    streaming,
    output,
    setOutput,
    error,
    startStream,
    stopStream,
  };
}
