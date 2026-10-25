import { useState, useCallback, useRef } from '@wordpress/element';

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

    const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
    const nonce = window.omniAiData?.nonce || '';

    let accumulatedText = '';

    try {
      const response = await fetch(`${restUrl}stream-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: JSON.stringify({
          prompt,
          provider,
          model,
          system_prompt: systemPrompt,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let hasError = false;

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
      if (!hasError && accumulatedText.trim().length > 0) {
        try {
          await fetch(`${restUrl}save-log`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-WP-Nonce': nonce,
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
        setError(err.message || 'Stream connection error occurred.');
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
