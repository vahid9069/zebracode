<?php
namespace OmniAI\Providers;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Google Gemini Provider implementation with automatic API version & model fallback.
 */
class Gemini_Provider implements AI_Provider_Interface {
    private string $api_key;
    private string $default_model;

    public function __construct(string $api_key = '', string $default_model = 'gemini-2.5-flash') {
        $this->api_key = trim($api_key);
        $this->default_model = $default_model ?: 'gemini-2.5-flash';
    }

    public function get_id(): string {
        return 'gemini';
    }

    public function get_name(): string {
        return 'Google Gemini';
    }

    public function is_configured(): bool {
        return !empty($this->api_key);
    }

    public function get_supported_models(): array {
        return [
            'gemini-2.5-flash'          => 'Gemini 2.5 Flash (پایدار، بسیار سریع و ۱ میلیون توکن - پیشنهادی)',
            'gemini-2.5-pro'            => 'Gemini 2.5 Pro (استدلال تخصصی و مقاله‌نویسی جامع)',
            'gemini-2.5-flash-lite'     => 'Gemini 2.5 Flash-Lite (فوق سریع و سبک)',
            'gemini-flash-latest'       => 'Gemini Flash Latest (جدیدترین نسخه فلش)',
            'gemini-pro-latest'         => 'Gemini Pro Latest (جدیدترین نسخه پرو)',
            'gemini-flash-lite-latest'  => 'Gemini Flash-Lite Latest (جدیدترین نسخه فلش لایت)',
            'gemini-3.8-flash'          => 'Gemini 3.8 Flash (نسل ۳.۸ پرسرعت)',
            'gemini-3.7-flash'          => 'Gemini 3.7 Flash (نسل ۳.۷ فلش)',
            'gemini-3.6-flash'          => 'Gemini 3.6 Flash (نسل ۳.۶ فلش)',
            'gemini-3.5-flash'          => 'Gemini 3.5 Flash (نسل ۳.۵ فلش)',
            'gemini-3.5-flash-lite'     => 'Gemini 3.5 Flash Lite (سبک نسل ۳.۵)',
            'gemini-3-flash-preview'    => 'Gemini 3 Flash Preview (پیش‌نمایش نسل ۳)',
            'gemini-3.1-pro-preview'    => 'Gemini 3.1 Pro Preview (استدلال پیشرفته)',
            'gemini-3.1-flash-lite'     => 'Gemini 3.1 Flash Lite (پیش‌نمایش سبک ۳.۱)',
            'gemini-4-argon'            => 'Gemini 4 Argon (نسل ۴ پیشرفته)',
            'gemma-4-31b-it'            => 'Gemma 4 31B IT (مدل متنی باز گما)',
            'gemma-4-26b-a4b-it'        => 'Gemma 4 26B A4B IT (مدل سبک گما)',
        ];
    }

    public function fetch_live_models(): array {
        if (!$this->is_configured()) {
            return $this->get_supported_models();
        }

        $endpoints = [
            'v1beta' => "https://generativelanguage.googleapis.com/v1beta/models?key=" . rawurlencode($this->api_key),
            'v1'     => "https://generativelanguage.googleapis.com/v1/models?key=" . rawurlencode($this->api_key),
        ];

        $models = [];
        $known = $this->get_supported_models();

        foreach ($endpoints as $version => $url) {
            $raw_models = $this->fetch_models_from_url($url);
            foreach ($raw_models as $m) {
                $methods = $m['supportedGenerationMethods'] ?? [];
                if (!is_array($methods) || !in_array('generateContent', $methods, true)) {
                    continue;
                }

                $slug = str_replace('models/', '', $m['name']);

                // Only include Gemini and Gemma content/text generation models
                if (!str_starts_with($slug, 'gemini-') && !str_starts_with($slug, 'gemma-')) {
                    continue;
                }

                // Strictly filter out all image generation models (e.g. imagen, gemini-*-image, banana, etc.)
                $is_image = (
                    str_contains($slug, 'image') ||
                    str_contains($slug, 'imagen') ||
                    str_contains($slug, 'banana') ||
                    str_contains($slug, 'picture') ||
                    str_contains($slug, 'photo') ||
                    str_contains($slug, 'draw') ||
                    str_contains($slug, 'diffusion') ||
                    str_contains($slug, 'flux')
                );
                if ($is_image) {
                    continue;
                }

                // Strictly filter out audio, speech, TTS, video, embedding, and non-content models
                $is_non_content = (
                    str_contains($slug, 'embedding') ||
                    str_contains($slug, 'aqa') ||
                    str_contains($slug, 'audio') ||
                    str_contains($slug, 'speech') ||
                    str_contains($slug, 'tts') ||
                    str_contains($slug, 'transcribe') ||
                    str_contains($slug, 'whisper') ||
                    str_contains($slug, 'realtime') ||
                    str_contains($slug, 'lyria') ||
                    str_contains($slug, 'veo') ||
                    str_contains($slug, 'video') ||
                    str_contains($slug, 'robotics') ||
                    str_contains($slug, 'computer-use') ||
                    str_contains($slug, 'antigravity') ||
                    str_contains($slug, 'deep-research')
                );
                if ($is_non_content) {
                    continue;
                }

                // Filter out dated snapshot duplicates (like -001, -002, etc.) to keep clean list
                if (preg_match('/-\d{3}$/', $slug) || preg_match('/-\d{4}$/', $slug)) {
                    continue;
                }

                if (!isset($models[$slug])) {
                    if (isset($known[$slug])) {
                        $models[$slug] = $known[$slug];
                    } else {
                        $displayName = !empty($m['displayName']) ? $m['displayName'] : $slug;
                        if (str_contains($slug, 'exp') || str_contains($slug, 'preview')) {
                            $models[$slug] = "{$displayName} (پیش‌نمایش - {$version})";
                        } else {
                            $models[$slug] = "{$displayName} ({$version})";
                        }
                    }
                }
            }
        }

        // Ensure primary models are guaranteed available in the list
        if (!isset($models['gemini-2.5-flash'])) {
            $models = array_merge(['gemini-2.5-flash' => 'Gemini 2.5 Flash (پایدار، بسیار سریع و ۱ میلیون توکن - پیشنهادی)'], $models);
        }

        return !empty($models) ? $models : $this->get_supported_models();
    }

    private function fetch_models_from_url(string $url): array {
        $body_str = '';
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, apply_filters('https_ssl_verify', true));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Accept: application/json',
            ]);
            $body_str = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($http_code !== 200 || empty($body_str)) {
                $body_str = '';
            }
        }

        if (empty($body_str)) {
            $response = wp_remote_get($url, [
                'timeout'   => 15,
                'sslverify' => apply_filters('https_ssl_verify', true),
                'headers'   => [
                    'Accept' => 'application/json',
                ],
            ]);
            if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
                $body_str = wp_remote_retrieve_body($response);
            }
        }

        if (empty($body_str)) {
            return [];
        }

        $decoded = json_decode($body_str, true);
        return (!empty($decoded['models']) && is_array($decoded['models'])) ? $decoded['models'] : [];
    }

    private function get_clean_model(string $model): string {
        $model = preg_replace('/^models\//', '', trim($model));
        return $model ?: $this->default_model;
    }

    /**
     * Build list of candidate API versions (v1beta, v1) for the requested model with resilient fallback.
     */
    private function get_request_candidates(string $model): array {
        $clean = $this->get_clean_model($model);
        $candidates = [];

        // Primary candidate on v1beta
        $candidates[] = ['version' => 'v1beta', 'model' => $clean];

        // If gemini-3.7-flash (deprecated in favor of 3.8-flash by Google) or 3.8-flash,
        // provide intelligent fallback to avoid halting user requests with 400
        if ($clean === 'gemini-3.7-flash') {
            $candidates[] = ['version' => 'v1beta', 'model' => 'gemini-3.8-flash'];
            $candidates[] = ['version' => 'v1beta', 'model' => 'gemini-3.6-flash'];
        } elseif ($clean === 'gemini-3.8-flash') {
            $candidates[] = ['version' => 'v1beta', 'model' => 'gemini-3.6-flash'];
        }

        // Also try v1 for standard release models
        $candidates[] = ['version' => 'v1', 'model' => $clean];

        return $candidates;
    }

    public function generate(string $prompt, array $options = []): array {
        if (!$this->is_configured()) {
            throw new \Exception(__('Gemini API key is not configured. Please add it in settings or options-connectors.php.', 'omni-ai-suite'));
        }

        $input_model = $options['model'] ?? $this->default_model;
        $clean = $this->get_clean_model($input_model);
        $candidates = $this->get_request_candidates($input_model);

        $gen_config = [
            'temperature'     => floatval($options['temperature'] ?? 0.7),
            'maxOutputTokens' => !empty($options['max_tokens']) ? max(intval($options['max_tokens']), 4096) : 8192,
        ];

        // Configure thinking level for Gemini 3.x / 4.x reasoning models
        if (str_contains($clean, '3.') || str_contains($clean, '3-') || str_contains($clean, '4-')) {
            $gen_config['thinkingConfig'] = [
                'thinkingLevel' => 'LOW',
            ];
        }

        $payload = [
            'contents' => [
                [
                    'role'  => 'user',
                    'parts' => [['text' => $prompt]],
                ],
            ],
            'generationConfig' => $gen_config,
        ];

        if (!empty($options['system_prompt'])) {
            $payload['systemInstruction'] = [
                'parts' => [['text' => $options['system_prompt']]],
            ];
        }

        $ssl_verify = apply_filters('https_ssl_verify', true);
        $last_error = '';

        foreach ($candidates as $cand) {
            $ver = $cand['version'];
            $mod = $cand['model'];
            $mod_clean = preg_replace('/^models\//', '', $mod);
            $url = "https://generativelanguage.googleapis.com/{$ver}/models/{$mod_clean}:generateContent?key=" . urlencode($this->api_key);

            $response = wp_remote_post($url, [
                'headers' => [
                    'Content-Type'   => 'application/json',
                    'X-goog-api-key' => $this->api_key,
                    'Accept'         => 'application/json',
                ],
                'body'      => wp_json_encode($payload),
                'timeout'   => 45,
                'sslverify' => $ssl_verify,
            ]);

            if (is_wp_error($response)) {
                $last_error = $response->get_error_message();
                continue;
            }

            $code = wp_remote_retrieve_response_code($response);
            $raw_body = wp_remote_retrieve_body($response);
            $body = json_decode($raw_body, true);

            if ($code === 200 && !empty($body['candidates'][0]['content']['parts']) && is_array($body['candidates'][0]['content']['parts'])) {
                $text = '';
                foreach ($body['candidates'][0]['content']['parts'] as $part) {
                    if (empty($part['thought']) && isset($part['text'])) {
                        $text .= $part['text'];
                    }
                }
                if ($text === '') {
                    foreach ($body['candidates'][0]['content']['parts'] as $part) {
                        if (isset($part['text'])) {
                            $text .= $part['text'];
                        }
                    }
                }

                if ($text !== '') {
                    $tokens = $body['usageMetadata']['totalTokenCount'] ?? 0;
                    return [
                        'text'     => $text,
                        'tokens'   => $tokens,
                        'model'    => $mod,
                        'provider' => $this->get_id(),
                    ];
                }
            }

            // If error, continue to next candidate unless invalid key (401/403)
            $last_error = $body['error']['message'] ?? "HTTP $code: " . substr(strip_tags($raw_body), 0, 200);
            if ($code === 401 || $code === 403) {
                break;
            }
        }

        throw new \Exception("Gemini API Error: " . $last_error);
    }

    public function stream(string $prompt, array $options = [], ?callable $chunk_callback = null): void {
        @set_time_limit(300);
        @ini_set('max_execution_time', '300');

        if (!$this->is_configured()) {
            throw new \Exception(__('Gemini API key is not configured. Please add it in settings or options-connectors.php.', 'omni-ai-suite'));
        }

        $input_model = $options['model'] ?? $this->default_model;
        $clean = $this->get_clean_model($input_model);
        $candidates = $this->get_request_candidates($input_model);

        $gen_config = [
            'temperature'     => floatval($options['temperature'] ?? 0.7),
            'maxOutputTokens' => !empty($options['max_tokens']) ? max(intval($options['max_tokens']), 4096) : 8192,
        ];

        // Configure thinking level for Gemini 3.x / 4.x reasoning models
        if (str_contains($clean, '3.') || str_contains($clean, '3-') || str_contains($clean, '4-')) {
            $gen_config['thinkingConfig'] = [
                'thinkingLevel' => 'LOW',
            ];
        }

        $payload = [
            'contents' => [
                [
                    'role'  => 'user',
                    'parts' => [['text' => $prompt]],
                ],
            ],
            'generationConfig' => $gen_config,
        ];

        if (!empty($options['system_prompt'])) {
            $payload['systemInstruction'] = [
                'parts' => [['text' => $options['system_prompt']]],
            ];
        }

        $ssl_verify = apply_filters('https_ssl_verify', true);
        $last_stream_err = '';

        foreach ($candidates as $cand) {
            $ver = $cand['version'];
            $mod = $cand['model'];
            $mod_clean = preg_replace('/^models\//', '', $mod);
            $url = "https://generativelanguage.googleapis.com/{$ver}/models/{$mod_clean}:streamGenerateContent?alt=sse&key=" . urlencode($this->api_key);

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, wp_json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'X-goog-api-key: ' . $this->api_key,
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
            curl_setopt($ch, CURLOPT_TIMEOUT, 180);

            if (defined('CURLOPT_IPRESOLVE') && defined('CURL_IPRESOLVE_V4')) {
                curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
            }

            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $ssl_verify);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, $ssl_verify ? 2 : 0);

            if (defined('WP_PROXY_HOST')) {
                curl_setopt($ch, CURLOPT_PROXY, WP_PROXY_HOST);
                if (defined('WP_PROXY_PORT')) {
                    curl_setopt($ch, CURLOPT_PROXYPORT, WP_PROXY_PORT);
                }
                if (defined('WP_PROXY_USERNAME') && defined('WP_PROXY_PASSWORD')) {
                    curl_setopt($ch, CURLOPT_PROXYUSERPWD, WP_PROXY_USERNAME . ':' . WP_PROXY_PASSWORD);
                }
            }

            $buffer = '';
            $raw_response = '';
            $has_chunks = false;

            curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $data) use (&$buffer, &$raw_response, &$has_chunks, $chunk_callback) {
                $raw_response .= $data;
                $buffer .= $data;

                while (($pos = strpos($buffer, "\n")) !== false) {
                    $line = trim(substr($buffer, 0, $pos));
                    $buffer = substr($buffer, $pos + 1);

                    if ($line === '' || $line === '[' || $line === ']' || $line === ',') {
                        continue;
                    }

                    $json_str = '';
                    if (str_starts_with($line, 'data:')) {
                        $json_str = trim(substr($line, 5));
                    } elseif (str_starts_with($line, '{')) {
                        $json_str = rtrim($line, ',');
                    }

                    if (!empty($json_str)) {
                        $parsed = json_decode($json_str, true);
                        if (!empty($parsed['error']['message'])) {
                            return strlen($data);
                        }

                        $chunk_text = '';
                        if (!empty($parsed['candidates'][0]['content']['parts']) && is_array($parsed['candidates'][0]['content']['parts'])) {
                            foreach ($parsed['candidates'][0]['content']['parts'] as $part) {
                                // Mark connection as active even when reasoning
                                if (!empty($part['thought'])) {
                                    $has_chunks = true;
                                    continue;
                                }
                                if (isset($part['text']) && $part['text'] !== '') {
                                    $chunk_text .= $part['text'];
                                }
                            }
                        }

                        if ($chunk_text !== '') {
                            $has_chunks = true;
                            if ($chunk_callback) {
                                call_user_func($chunk_callback, $chunk_text);
                            } else {
                                echo "data: " . wp_json_encode(['text' => $chunk_text, 'done' => false]) . "\n\n";
                                if (ob_get_level() > 0) {
                                    @ob_flush();
                                }
                                @flush();
                            }
                        }
                    }
                }
                return strlen($data);
            });

            $success = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curl_err = curl_error($ch);
            curl_close($ch);

            // Flush any remaining trailing buffer chunk
            if (!empty($buffer)) {
                $line = trim($buffer);
                $json_str = '';
                if (str_starts_with($line, 'data:')) {
                    $json_str = trim(substr($line, 5));
                } elseif (str_starts_with($line, '{')) {
                    $json_str = rtrim($line, ',');
                }
                if (!empty($json_str)) {
                    $parsed = json_decode($json_str, true);
                    $chunk_text = '';
                    if (!empty($parsed['candidates'][0]['content']['parts']) && is_array($parsed['candidates'][0]['content']['parts'])) {
                        foreach ($parsed['candidates'][0]['content']['parts'] as $part) {
                            if (!empty($part['thought'])) {
                                $has_chunks = true;
                                continue;
                            }
                            if (isset($part['text']) && $part['text'] !== '') {
                                $chunk_text .= $part['text'];
                            }
                        }
                    }
                    if ($chunk_text !== '') {
                        $has_chunks = true;
                        if ($chunk_callback) {
                            call_user_func($chunk_callback, $chunk_text);
                        } else {
                            echo "data: " . wp_json_encode(['text' => $chunk_text, 'done' => false]) . "\n\n";
                            if (ob_get_level() > 0) {
                                @ob_flush();
                            }
                            @flush();
                        }
                    }
                }
            }

            if ($has_chunks) {
                // Successfully streamed content to client!
                return;
            }

            if (!empty($raw_response)) {
                $decoded = json_decode($raw_response, true);
                if (!empty($decoded['error']['message'])) {
                    $last_stream_err = $decoded['error']['message'];
                }
            }
            if (empty($last_stream_err)) {
                $last_stream_err = $curl_err ?: "HTTP $http_code";
            }

            // Only abort early on authorization or forbidden errors
            if ($http_code === 401 || $http_code === 403) {
                break;
            }
        }

        throw new \Exception("Gemini API Error: " . $last_stream_err);
    }
}
