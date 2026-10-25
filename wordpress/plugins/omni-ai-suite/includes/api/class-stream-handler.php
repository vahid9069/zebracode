<?php
namespace OmniAI\Api;

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
        if (!current_user_can('edit_posts')) {
            status_header(403);
            echo "data: " . wp_json_encode(['error' => __('Permission denied.', 'omni-ai-suite'), 'done' => true]) . "\n\n";
            exit;
        }

        $params = $request->get_json_params() ?: $request->get_params();
        $prompt = sanitize_textarea_field($params['prompt'] ?? '');
        $provider_id = sanitize_text_field($params['provider'] ?? '');
        $model = sanitize_text_field($params['model'] ?? '');
        $system_prompt = sanitize_textarea_field($params['system_prompt'] ?? '');
        $temperature = floatval($params['temperature'] ?? 0.7);
        $max_tokens = intval($params['max_tokens'] ?? 2048);

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

            // Attempt real-time SSE stream
            $provider->stream($prompt, $options);

            // Signal stream completion
            echo "data: " . wp_json_encode(['text' => '', 'done' => true]) . "\n\n";
            flush();
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
                        flush();
                        $recovered = true;
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
                                flush();
                                exit;
                            }
                        }
                    }
                } catch (\Throwable $failover_error) {
                    error_log('[Omni AI Failover Provider Error]: ' . $failover_error->getMessage());
                }
            }

            echo "data: " . wp_json_encode(['error' => $stream_error->getMessage(), 'done' => true]) . "\n\n";
            flush();
        }

        exit;
    }
}
