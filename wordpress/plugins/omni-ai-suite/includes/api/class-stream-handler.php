<?php
namespace OmniAI\Api;

use OmniAI\Database\Log_Repository;
use OmniAI\Providers\Provider_Factory;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * High-performance Server-Sent Events (SSE) streaming handler using cURL
 * with automatic resilient fallback to synchronous generation if streaming is buffered.
 */
class Stream_Handler {
    /**
     * Handle incoming streaming request.
     */
    public static function handle_stream(\WP_REST_Request $request): void {
        @set_time_limit(300);
        @ini_set('max_execution_time', '300');

        // Authenticate permissions
        if (!current_user_can('edit_posts') && !current_user_can('manage_options')) {
            status_header(403);
            echo "data: " . wp_json_encode(['error' => __('Permission denied.', 'omni-ai-suite'), 'done' => true]) . "\n\n";
            exit;
        }

        $params = $request->get_json_params() ?: $request->get_params();
        $prompt = sanitize_textarea_field($params['prompt'] ?? '');
        $provider_id = sanitize_text_field($params['provider'] ?? '');
        $model = sanitize_text_field($params['model'] ?? '');

        $settings = Provider_Factory::get_settings();
        if (empty($provider_id)) {
            $provider_id = $settings['default_provider'] ?? 'gemini';
        }
        if (empty($model)) {
            if ($provider_id === 'gemini') {
                $model = $settings['gemini_model'] ?? 'gemini-2.5-flash';
            } elseif ($provider_id === 'openai') {
                $model = $settings['openai_model'] ?? 'gpt-4o-mini';
            } elseif ($provider_id === 'claude') {
                $model = $settings['claude_model'] ?? 'claude-3-5-sonnet-20241022';
            } else {
                $model = 'default';
            }
        }
        $system_prompt = sanitize_textarea_field($params['system_prompt'] ?? '');
        $temperature = floatval($params['temperature'] ?? 0.7);
        $req_tokens = intval($params['max_tokens'] ?? 8192);
        // Default to 8192 output tokens for full rich articles without truncation
        $max_tokens = ($req_tokens >= 2048) ? $req_tokens : 8192;

        if (empty($prompt)) {
            status_header(400);
            echo "data: " . wp_json_encode(['error' => __('Prompt cannot be empty.', 'omni-ai-suite'), 'done' => true]) . "\n\n";
            exit;
        }

        // Set streaming headers
        if (!headers_sent()) {
            header('Content-Type: text/event-stream; charset=UTF-8');
            header('Cache-Control: no-cache, no-transform');
            header('Connection: keep-alive');
            header('X-Accel-Buffering: no'); // For NGINX proxies to disable buffering
        }

        // Clean any active output buffers to allow immediate chunk transmission
        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        // Send initial heartbeat
        echo "data: " . wp_json_encode(['start' => true]) . "\n\n";
        flush();

        $provider = null;
        $options = [
            'model'         => $model,
            'system_prompt' => $system_prompt,
            'temperature'   => $temperature,
            'max_tokens'    => $max_tokens,
        ];

        try {
            $provider = Provider_Factory::get_provider($provider_id);
            if (!$provider->is_configured()) {
                throw new \Exception(__('AI Provider is not configured. Please check your API key in Settings or options-connectors.php.', 'omni-ai-suite'));
            }

            // Attempt real-time SSE stream with server-side text accumulation
            $accumulated_text = '';
            $provider->stream($prompt, $options, function ($chunk) use (&$accumulated_text) {
                $accumulated_text .= $chunk;
                echo "data: " . wp_json_encode(['text' => $chunk, 'done' => false]) . "\n\n";
                if (ob_get_level() > 0) {
                    @ob_flush();
                }
                @flush();
            });

            // Signal stream completion
            echo "data: " . wp_json_encode(['text' => '', 'done' => true]) . "\n\n";
            if (ob_get_level() > 0) {
                @ob_flush();
            }
            @flush();

            // Infallible Server-Side Logging on Stream Completion
            if (!empty(trim($accumulated_text))) {
                $tokens = (int) round(count(preg_split('/\s+/u', $accumulated_text)) * 1.3);
                Log_Repository::insert_log(
                    get_current_user_id(),
                    $prompt,
                    $accumulated_text,
                    $model,
                    $provider_id,
                    $tokens
                );
            }
        } catch (\Throwable $stream_error) {
            error_log('[Omni AI Stream Error]: ' . $stream_error->getMessage());

            // Resilient Fallback 1: If streaming failed (e.g. proxy buffering or cURL sse issue),
            // attempt direct synchronous generation with same provider so user still gets their content!
            $recovered = false;
            try {
                if ($provider && $provider->is_configured()) {
                    $fallback_res = $provider->generate($prompt, $options);
                    $full_text = $fallback_res['text'] ?? '';
                    if (!empty($full_text)) {
                        echo "data: " . wp_json_encode(['text' => $full_text, 'done' => false]) . "\n\n";
                        echo "data: " . wp_json_encode(['text' => '', 'done' => true]) . "\n\n";
                        if (ob_get_level() > 0) {
                            @ob_flush();
                        }
                        @flush();
                        $recovered = true;

                        // Log Fallback 1 recovery
                        $tokens = $fallback_res['tokens'] ?? (int) round(count(preg_split('/\s+/u', $full_text)) * 1.3);
                        Log_Repository::insert_log(
                            get_current_user_id(),
                            $prompt,
                            $full_text,
                            $model,
                            $provider_id,
                            $tokens
                        );
                        exit;
                    }
                }
            } catch (\Throwable $fallback_error) {
                error_log('[Omni AI Same-Provider Fallback Error]: ' . $fallback_error->getMessage());
            }

            // Resilient Fallback 2: Check if a secondary fallback provider is configured (Multi-Provider Failover)
            if (!$recovered) {
                try {
                    $settings = Provider_Factory::get_settings();
                    $alt_id = $settings['fallback_provider'] ?? 'none';
                    if (!empty($alt_id) && $alt_id !== 'none' && $alt_id !== $provider_id) {
                        $alt_provider = Provider_Factory::get_provider($alt_id);
                        if ($alt_provider && $alt_provider->is_configured()) {
                            $alt_res = $alt_provider->generate($prompt, [
                                'model'         => '',
                                'system_prompt' => $system_prompt,
                                'temperature'   => $temperature,
                                'max_tokens'    => $max_tokens,
                            ]);
                            $alt_text = $alt_res['text'] ?? '';
                            if (!empty($alt_text)) {
                                echo "data: " . wp_json_encode(['text' => $alt_text, 'done' => false, 'failover' => $alt_id]) . "\n\n";
                                echo "data: " . wp_json_encode(['text' => '', 'done' => true]) . "\n\n";
                                if (ob_get_level() > 0) {
                                    @ob_flush();
                                }
                                @flush();

                                // Log Fallback 2 recovery
                                $tokens = $alt_res['tokens'] ?? (int) round(count(preg_split('/\s+/u', $alt_text)) * 1.3);
                                Log_Repository::insert_log(
                                    get_current_user_id(),
                                    $prompt,
                                    $alt_text,
                                    $alt_id,
                                    $alt_id,
                                    $tokens
                                );
                                exit;
                            }
                        }
                    }
                } catch (\Throwable $failover_error) {
                    error_log('[Omni AI Failover Provider Error]: ' . $failover_error->getMessage());
                }
            }

            // Log failure to database custom table
            $error_message = $stream_error->getMessage();
            Log_Repository::insert_log(
                get_current_user_id(),
                $prompt,
                "ERROR: " . $error_message,
                $model,
                $provider_id,
                0
            );

            echo "data: " . wp_json_encode(['error' => $error_message, 'done' => true]) . "\n\n";
            flush();
        }

        exit;
    }
}
