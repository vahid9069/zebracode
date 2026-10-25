(function (wp) {
    'use strict';
    if (!wp || !wp.element) return;

    var el = wp.element.createElement;
    var useState = wp.element.useState;
    var config = window.ZebraCodeBlogAIStudio || {};

    function Studio() {
        var state = useState('');
        var prompt = state[0];
        var setPrompt = state[1];
        var outputState = useState('');
        var output = outputState[0];
        var setOutput = outputState[1];
        var statusState = useState('idle');
        var status = statusState[0];
        var setStatus = statusState[1];

        function run() {
            if (!prompt.trim()) return;
            setOutput('');
            setStatus('streaming');
            fetch(config.restUrl + '/stream-ai', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.restNonce },
                body: JSON.stringify({ prompt: prompt })
            }).then(function (response) {
                if (!response.ok || !response.body) throw new Error('The streaming endpoint is unavailable.');
                var reader = response.body.getReader();
                var decoder = new TextDecoder('utf-8');
                var buffer = '';
                var fullText = '';

                function read() {
                    return reader.read().then(function (part) {
                        if (part.done) {
                            setStatus('saving');
                            return fetch(config.restUrl + '/logs', {
                                method: 'POST',
                                credentials: 'same-origin',
                                headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.restNonce },
                                body: JSON.stringify({ prompt: prompt, response: fullText, source: 'studio' })
                            }).then(function () {
                                setStatus('complete');
                            });
                        }

                        buffer += decoder.decode(part.value, { stream: true });
                        var lines = buffer.split('\n');
                        buffer = lines.pop() || '';
                        lines.forEach(function (line) {
                            if (line.indexOf('data:') !== 0) return;
                            try {
                                var payload = JSON.parse(line.slice(5).trim());
                                if (payload.error) throw new Error(payload.error);
                                if (payload.text) {
                                    fullText += payload.text;
                                    setOutput(fullText);
                                }
                            } catch (error) {
                                setStatus('error');
                                throw error;
                            }
                        });
                        return read();
                    });
                }

                return read();
            }).catch(function (error) {
                setOutput(function (current) { return current || error.message; });
                setStatus('error');
            });
        }

        return el('div', { className: 'zc-studio-grid' },
            el('div', null,
                el('h2', null, 'Secure streaming studio'),
                el('p', null, 'The browser receives text chunks only. API keys stay on the WordPress server.'),
                el('textarea', { value: prompt, onChange: function (event) { setPrompt(event.target.value); }, rows: 8, placeholder: 'Write a brief or ask a question…' }),
                el('button', { type: 'button', className: 'button button-primary', onClick: run, disabled: status === 'streaming' || status === 'saving' }, status === 'streaming' ? 'Streaming…' : 'Generate response')
            ),
            el('div', null,
                el('h2', null, 'Response'),
                el('p', null, status === 'complete' ? 'Saved to generation history.' : status === 'error' ? 'The request failed.' : 'Waiting for a prompt.'),
                el('pre', { style: { whiteSpace: 'pre-wrap', minHeight: '220px' } }, output)
            )
        );
    }

    var root = document.querySelector('[data-zebracode-studio]');
    if (root) wp.element.render(el(Studio), root);
}(window.wp));
