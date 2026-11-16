<?php
namespace OmniAI\Providers;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * OpenAI Provider implementation (GPT-4o, GPT-4o-mini, etc.).
 */
class OpenAI_Provider implements AI_Provider_Interface {
    private string $api_key;
    private string $default_model;

    public function __construct(string $api_key = '', string $default_model = 'gpt-4o-mini') {
        $this->api_key = trim($api_key);
        $this->default_model = $default_model ?: 'gpt-4o-mini';
    }

    public function get_id(): string {
        return 'openai';
    }

    public function get_name(): string {
        return 'OpenAI';
    }

    public function is_configured(): bool {
        return !empty($this->api_key);
    }

    public function get_supported_models(): array {
        return [
            'gpt-4o-mini'       => 'GPT-4o Mini (سریع، مقرون‌به‌صرفه و هوشمند - پیشنهادی)',
            'gpt-4o'            => 'GPT-4o (پرچمدار هوشمند همه‌منظوره)',
            'gpt-4o-2024-11-20' => 'GPT-4o (آخرین نسخه پایدار نوامبر)',
            'chatgpt-4o-latest' => 'ChatGPT-4o (نسخه داینامیک چت‌جی‌پی‌تی)',
            'o3-mini'           => 'o3-mini (جدیدترین مدل استدلال تخصصی و کدنویسی)',
            'o1-mini'           => 'o1-mini (مدل استدلال ریاضی و سریع)',
            'o1-preview'        => 'o1-preview (مدل استدلال و تحلیل عمیق)',
            'gpt-4-turbo'       => 'GPT-4 Turbo (مدل ۱۲۸ هزار توکن)',
            'gpt-4'             => 'GPT-4 (نسخه استاندارد ۴)',
            'gpt-3.5-turbo'     => 'GPT-3.5 Turbo (مدل اقتصادی قدیمی)',
        ];
    }

    public function fetch_live_models(): array {
        if (!$this->is_configured()) {
            return $this->get_supported_models();
        }

        $response = wp_remote_get('https://api.openai.com/v1/models', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->api_key,
            ],
            'timeout' => 15,
        ]);

        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            return $this->get_supported_models();
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        if (empty($body['data']) || !is_array($body['data'])) {
            return $this->get_supported_models();
        }

        $models = [];
        $known_labels = $this->get_supported_models();

        foreach ($body['data'] as $m) {
            $id = $m['id'] ?? '';
            // Only text/content generation models - strictly exclude image (dall-e), audio, and embedding models
            if (
                preg_match('/^(gpt-4|gpt-3\.5|o1|o3|chatgpt)/i', $id) &&
                !str_contains($id, 'audio') &&
                !str_contains($id, 'realtime') &&
                !str_contains($id, 'image') &&
                !str_contains($id, 'dall-e') &&
                !str_contains($id, 'transcribe') &&
                !str_contains($id, 'embedding')
            ) {
                $label = $known_labels[$id] ?? "OpenAI {$id}";
                $models[$id] = $label;
            }
        }

        uksort($models, function ($a, $b) {
            return strcmp($b, $a);
        });

        return !empty($models) ? $models : $this->get_supported_models();
    }

    public function generate(string $prompt, array $options = []): array {
        if (!$this->is_configured()) {
            throw new \Exception(__('OpenAI API key is not configured.', 'omni-ai-suite'));
        }

        $model = $options['model'] ?? $this->default_model;
        $url = 'https://api.openai.com/v1/chat/completions';

        $messages = [];
        if (!empty($options['system_prompt'])) {
            $messages[] = ['role' => 'system', 'content' => $options['system_prompt']];
        }
        $messages[] = ['role' => 'user', 'content' => $prompt];

        $payload = [
            'model'       => $model,
            'messages'    => $messages,
            'temperature' => floatval($options['temperature'] ?? 0.7),
            'max_tokens'  => intval($options['max_tokens'] ?? 2048),
        ];

        $response = wp_remote_post($url, [
            'headers' => [
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $this->api_key,
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
            $msg = $body['error']['message'] ?? __('Failed to generate content from OpenAI API.', 'omni-ai-suite');
            throw new \Exception("OpenAI API Error ($code): $msg");
        }

        $text = $body['choices'][0]['message']['content'] ?? '';
        $tokens = $body['usage']['total_tokens'] ?? 0;

        return [
            'text'     => $text,
            'tokens'   => $tokens,
            'model'    => $model,
            'provider' => $this->get_id(),
        ];
    }

    public function stream(string $prompt, array $options = [], ?callable $chunk_callback = null): void {
        if (!$this->is_configured()) {
            throw new \Exception(__('OpenAI API key is not configured.', 'omni-ai-suite'));
        }

        $model = $options['model'] ?? $this->default_model;
        $url = 'https://api.openai.com/v1/chat/completions';

        $messages = [];
        if (!empty($options['system_prompt'])) {
            $messages[] = ['role' => 'system', 'content' => $options['system_prompt']];
        }
        $messages[] = ['role' => 'user', 'content' => $prompt];

        $payload = [
            'model'       => $model,
            'messages'    => $messages,
            'temperature' => floatval($options['temperature'] ?? 0.7),
            'max_tokens'  => intval($options['max_tokens'] ?? 2048),
            'stream'      => true,
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, wp_json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->api_key,
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
                    if ($json_str === '[DONE]') {
                        continue;
                    }
                    if (!empty($json_str)) {
                        $parsed = json_decode($json_str, true);
                        $chunk_text = $parsed['choices'][0]['delta']['content'] ?? '';
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
            return strlen($data);
        });

        $success = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if (!$success || $http_code >= 400) {
            $err_msg = $error ? $error : "HTTP status $http_code";
            throw new \Exception("OpenAI streaming failed: $err_msg");
        }
    }
}
