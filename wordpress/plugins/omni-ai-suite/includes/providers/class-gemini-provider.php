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

    public function __construct(string $api_key = '', string $default_model = 'gemini-1.5-flash') {
        $this->api_key = trim($api_key);
        $this->default_model = $default_model ?: 'gemini-1.5-flash';
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
            'gemini-1.5-flash'        => 'Gemini 1.5 Flash (Recommended - Fast)',
            'gemini-1.5-flash-latest' => 'Gemini 1.5 Flash Latest',
            'gemini-flash-latest'     => 'Gemini Flash Latest',
            'gemini-1.5-pro'          => 'Gemini 1.5 Pro (Complex Reasoning)',
            'gemini-1.5-pro-latest'   => 'Gemini 1.5 Pro Latest',
            'gemini-2.0-flash'        => 'Gemini 2.0 Flash (Next-Gen)',
            'gemini-2.0-flash-exp'    => 'Gemini 2.0 Flash Experimental',
        ];
    }

    private function get_clean_model(string $model): string {
        $model = preg_replace('/^models\//', '', trim($model));
        return $model ?: $this->default_model;
    }

    /**
     * Build list of candidate API versions and model names to prevent 404 version mismatch.
     */
    private function get_request_candidates(string $model): array {
        $clean = $this->get_clean_model($model);
        $candidates = [];

        // For Gemini 2.0 or experimental models, v1beta is the primary endpoint
        if (str_contains($clean, '2.0') || str_contains($clean, 'exp')) {
            $candidates[] = ['version' => 'v1beta', 'model' => $clean];
        } elseif (str_contains($clean, 'pro')) {
            $candidates[] = ['version' => 'v1beta', 'model' => 'gemini-1.5-pro-latest'];
            $candidates[] = ['version' => 'v1beta', 'model' => 'gemini-1.5-pro'];
        } else {
            // v1beta with -latest aliases are the tested working endpoints for Gemini 1.5 Flash
            $candidates[] = ['version' => 'v1beta', 'model' => 'gemini-1.5-flash-latest'];
            $candidates[] = ['version' => 'v1beta', 'model' => 'gemini-flash-latest'];
            $candidates[] = ['version' => 'v1beta', 'model' => str_ends_with($clean, '-latest') ? $clean : $clean . '-latest'];
            $candidates[] = ['version' => 'v1beta', 'model' => $clean];
        }

        // Deduplicate
        $unique = [];
        $result = [];
        foreach ($candidates as $c) {
            $key = $c['version'] . '/' . $c['model'];
            if (!isset($unique[$key])) {
                $unique[$key] = true;
                $result[] = $c;
            }
        }

        return $result;
    }

    public function generate(string $prompt, array $options = []): array {
        if (!$this->is_configured()) {
            throw new \Exception(__('Gemini API key is not configured. Please add it in settings or options-connectors.php.', 'omni-ai-suite'));
        }

        $input_model = $options['model'] ?? $this->default_model;
        $candidates = $this->get_request_candidates($input_model);

        $payload = [
            'contents' => [
                [
                    'role'  => 'user',
                    'parts' => [['text' => $prompt]],
                ],
            ],
            'generationConfig' => [
                'temperature'     => floatval($options['temperature'] ?? 0.7),
                'maxOutputTokens' => intval($options['max_tokens'] ?? 2048),
            ],
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
            $url = "https://generativelanguage.googleapis.com/{$ver}/models/{$mod}:generateContent?key=" . urlencode($this->api_key);

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

            if ($code === 200 && !empty($body['candidates'][0]['content']['parts'][0]['text'])) {
                $text = $body['candidates'][0]['content']['parts'][0]['text'];
                $tokens = $body['usageMetadata']['totalTokenCount'] ?? 0;

                return [
                    'text'     => $text,
                    'tokens'   => $tokens,
                    'model'    => $mod,
                    'provider' => $this->get_id(),
                ];
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
        $candidates = $this->get_request_candidates($input_model);

        $payload = [
            'contents' => [
                [
                    'role'  => 'user',
                    'parts' => [['text' => $prompt]],
                ],
            ],
            'generationConfig' => [
                'temperature'     => floatval($options['temperature'] ?? 0.7),
                'maxOutputTokens' => intval($options['max_tokens'] ?? 4096),
            ],
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
            $url = "https://generativelanguage.googleapis.com/{$ver}/models/{$mod}:streamGenerateContent?alt=sse&key=" . urlencode($this->api_key);

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, wp_json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'X-goog-api-key: ' . $this->api_key,
                'Accept: application/json',
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
            $raw_error = '';
            $has_chunks = false;

            curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $data) use (&$buffer, &$raw_error, &$has_chunks, $chunk_callback) {
                $buffer .= $data;
                $raw_error .= $data;

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
                            throw new \RuntimeException($parsed['error']['message']);
                        }
                        $chunk_text = $parsed['candidates'][0]['content']['parts'][0]['text'] ?? '';
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

            if ($has_chunks) {
                // Successfully streamed content to client!
                return;
            }

            if (!empty($raw_error)) {
                $decoded = json_decode($raw_error, true);
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
