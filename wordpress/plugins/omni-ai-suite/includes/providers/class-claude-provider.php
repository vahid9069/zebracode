<?php
namespace OmniAI\Providers;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Anthropic Claude Provider implementation.
 */
class Claude_Provider implements AI_Provider_Interface {
    private string $api_key;
    private string $default_model;

    public function __construct(string $api_key = '', string $default_model = 'claude-3-5-sonnet-20241022') {
        $this->api_key = trim($api_key);
        $this->default_model = $default_model ?: 'claude-3-5-sonnet-20241022';
    }

    public function get_id(): string {
        return 'claude';
    }

    public function get_name(): string {
        return 'Anthropic Claude';
    }

    public function is_configured(): bool {
        return !empty($this->api_key);
    }

    public function get_supported_models(): array {
        return [
            'claude-3-5-sonnet-20241022' => 'Claude 3.5 Sonnet (State-of-the-Art Intelligence)',
            'claude-3-5-haiku-20241022'  => 'Claude 3.5 Haiku (Ultra-Fast Response)',
            'claude-3-opus-20240229'     => 'Claude 3 Opus (Deep Analysis)',
        ];
    }

    public function generate(string $prompt, array $options = []): array {
        if (!$this->is_configured()) {
            throw new \Exception(__('Claude API key is not configured.', 'omni-ai-suite'));
        }

        $model = $options['model'] ?? $this->default_model;
        $url = 'https://api.anthropic.com/v1/messages';

        $payload = [
            'model'      => $model,
            'max_tokens' => intval($options['max_tokens'] ?? 2048),
            'messages'   => [
                ['role' => 'user', 'content' => $prompt],
            ],
        ];

        if (!empty($options['system_prompt'])) {
            $payload['system'] = $options['system_prompt'];
        }

        $response = wp_remote_post($url, [
            'headers' => [
                'Content-Type'      => 'application/json',
                'x-api-key'         => $this->api_key,
                'anthropic-version' => '2023-06-01',
            ],
            'body'    => wp_json_encode($payload),
            'timeout' => 45,
        ]);

        if (is_wp_error($response)) {
            throw new \Exception($response->get_error_message());
        }

        $code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($code !== 200) {
            $msg = $body['error']['message'] ?? __('Failed to generate content from Claude API.', 'omni-ai-suite');
            throw new \Exception("Claude API Error ($code): $msg");
        }

        $text = '';
        if (!empty($body['content']) && is_array($body['content'])) {
            foreach ($body['content'] as $block) {
                if (($block['type'] ?? '') === 'text') {
                    $text .= $block['text'] ?? '';
                }
            }
        }

        $tokens = ($body['usage']['input_tokens'] ?? 0) + ($body['usage']['output_tokens'] ?? 0);

        return [
            'text'     => $text,
            'tokens'   => $tokens,
            'model'    => $model,
            'provider' => $this->get_id(),
        ];
    }

    public function stream(string $prompt, array $options = [], ?callable $chunk_callback = null): void {
        if (!$this->is_configured()) {
            throw new \Exception(__('Claude API key is not configured.', 'omni-ai-suite'));
        }

        $model = $options['model'] ?? $this->default_model;
        $url = 'https://api.anthropic.com/v1/messages';

        $payload = [
            'model'      => $model,
            'max_tokens' => intval($options['max_tokens'] ?? 2048),
            'messages'   => [
                ['role' => 'user', 'content' => $prompt],
            ],
            'stream'     => true,
        ];

        if (!empty($options['system_prompt'])) {
            $payload['system'] = $options['system_prompt'];
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, wp_json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'x-api-key: ' . $this->api_key,
            'anthropic-version: 2023-06-01',
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 120);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $buffer = '';
        curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $data) use (&$buffer, $chunk_callback) {
            $buffer .= $data;
            while (($pos = strpos($buffer, "\n")) !== false) {
                $line = trim(substr($buffer, 0, $pos));
                $buffer = substr($buffer, $pos + 1);

                if (str_starts_with($line, 'data:')) {
                    $json_str = trim(substr($line, 5));
                    if (!empty($json_str)) {
                        $parsed = json_decode($json_str, true);
                        // Claude sends event 'content_block_delta'
                        if (($parsed['type'] ?? '') === 'content_block_delta') {
                            $chunk_text = $parsed['delta']['text'] ?? '';
                            if ($chunk_text !== '') {
                                if ($chunk_callback) {
                                    call_user_func($chunk_callback, $chunk_text);
                                } else {
                                    echo "data: " . wp_json_encode(['text' => $chunk_text, 'done' => false]) . "\n\n";
                                    if (ob_get_level() > 0) {
                                        ob_flush();
                                    }
                                    flush();
                                }
                            }
                        }
                    }
                }
            }
            return strlen($data);
        });

        $success = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if (!$success || $http_code >= 400) {
            $err_msg = $error ? $error : "HTTP status $http_code";
            throw new \Exception("Claude streaming failed: $err_msg");
        }
    }
}
