<?php
namespace OmniAI\Api;

use OmniAI\Database\Log_Repository;
use OmniAI\Modules\Module_Manager;
use OmniAI\Providers\Provider_Factory;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * REST API Controller for Omni AI Suite.
 */
class Rest_Controller {
    public const NAMESPACE = 'omni-ai/v1';

    public function register_routes(): void {
        // SSE Stream endpoint
        register_rest_route(self::NAMESPACE, '/stream-ai', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [Stream_Handler::class, 'handle_stream'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        // Synchronous generation
        register_rest_route(self::NAMESPACE, '/ask', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_ask'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
            'args'                => [
                'prompt' => [
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_textarea_field',
                ],
            ],
        ]);

        // Save generation log (Phase 3: post-stream saving into custom table)
        register_rest_route(self::NAMESPACE, '/save-log', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_save_log'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        // Create draft post directly from Studio
        register_rest_route(self::NAMESPACE, '/create-draft', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_create_draft'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        // Get logs & statistics
        register_rest_route(self::NAMESPACE, '/logs', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'handle_get_logs'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        // Delete single log
        register_rest_route(self::NAMESPACE, '/logs/(?P<id>\d+)', [
            'methods'             => \WP_REST_Server::DELETABLE,
            'callback'            => [$this, 'handle_delete_log'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        // Clear all logs
        register_rest_route(self::NAMESPACE, '/logs/clear', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_clear_logs'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        // Settings endpoint
        register_rest_route(self::NAMESPACE, '/settings', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_settings'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_update_settings'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
        ]);

        // Modules endpoint
        register_rest_route(self::NAMESPACE, '/modules', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_modules'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_update_modules'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
        ]);

        // Bulk generation queue endpoint
        register_rest_route(self::NAMESPACE, '/bulk', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_bulk_queue'],
            'permission_callback' => function () {
                return current_user_can('publish_posts');
            },
        ]);
    }

    public function handle_ask(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $prompt = sanitize_textarea_field($params['prompt'] ?? '');
        $provider_id = sanitize_text_field($params['provider'] ?? '');
        $model = sanitize_text_field($params['model'] ?? '');
        $system_prompt = sanitize_textarea_field($params['system_prompt'] ?? '');
        $temperature = floatval($params['temperature'] ?? 0.7);
        $max_tokens = intval($params['max_tokens'] ?? 2048);

        try {
            $provider = Provider_Factory::get_provider($provider_id);
            $result = $provider->generate($prompt, [
                'model'         => $model,
                'system_prompt' => $system_prompt,
                'temperature'   => $temperature,
                'max_tokens'    => $max_tokens,
            ]);

            // Save to custom table
            Log_Repository::insert_log(
                get_current_user_id(),
                $prompt,
                $result['text'],
                $result['model'],
                $result['provider'],
                $result['tokens']
            );

            return new \WP_REST_Response([
                'success' => true,
                'data'    => $result,
            ], 200);
        } catch (\Throwable $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function handle_save_log(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $prompt = sanitize_textarea_field($params['prompt'] ?? '');
        $response = wp_kses_post($params['response'] ?? '');
        $model = sanitize_text_field($params['model'] ?? '');
        $provider = sanitize_text_field($params['provider'] ?? '');
        $tokens = intval($params['tokens'] ?? 0);

        if (empty($prompt) || empty($response)) {
            return new \WP_REST_Response(['message' => 'Missing prompt or response content'], 400);
        }

        $log_id = Log_Repository::insert_log(
            get_current_user_id(),
            $prompt,
            $response,
            $model,
            $provider,
            $tokens
        );

        return new \WP_REST_Response([
            'success' => (bool) $log_id,
            'log_id'  => $log_id,
        ], 200);
    }

    public function handle_create_draft(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $content = $params['content'] ?? '';
        $raw_title = sanitize_text_field($params['title'] ?? '');
        $status = sanitize_text_field($params['status'] ?? 'draft');
        $post_type = sanitize_text_field($params['post_type'] ?? 'post');
        $scheduled_date = sanitize_text_field($params['scheduled_date'] ?? '');
        $generate_image = !empty($params['generate_image']);
        $settings = Provider_Factory::get_settings();
        $image_provider = sanitize_text_field($params['image_provider'] ?? $settings['default_image_provider'] ?? 'pollinations');

        if (empty(trim((string) $content))) {
            return new \WP_REST_Response(['success' => false, 'message' => __('Content is empty.', 'omni-ai-suite')], 400);
        }

        // Smart Title Extraction: If user didn't enter custom title, extract from first heading in content
        $title = $raw_title;
        if (empty($title) || (!empty($params['prompt']) && str_starts_with($params['prompt'], $title))) {
            if (preg_match('/^#\s+(.+)$/m', $content, $matches)) {
                $title = trim($matches[1]);
                $content = preg_replace('/^#\s+.+$/m', '', $content, 1);
            } elseif (preg_match('/^\*\*عنوان[:\s]*\*\*\s*(.+)$/mu', $content, $matches)) {
                $title = trim($matches[1]);
                $content = preg_replace('/^\*\*عنوان[:\s]*\*\*\s*.+$/mu', '', $content, 1);
            } elseif (!empty($params['prompt'])) {
                $title = wp_trim_words(sanitize_text_field($params['prompt']), 8, '');
            } else {
                $title = __('AI Generated Article', 'omni-ai-suite');
            }
        }
        $title = sanitize_text_field(trim($title, " \t\n\r\0\x0B*#\"'"));

        $post_args = [
            'post_title'   => $title,
            'post_content' => wp_kses_post(trim($content)),
            'post_status'  => in_array($status, ['draft', 'publish', 'future', 'pending'], true) ? $status : 'draft',
            'post_type'    => $post_type,
            'post_author'  => get_current_user_id(),
        ];

        // Handle Scheduling (future status)
        if ($status === 'future' && !empty($scheduled_date)) {
            $timestamp = strtotime($scheduled_date);
            if ($timestamp && $timestamp > time()) {
                $post_args['post_date'] = date('Y-m-d H:i:s', $timestamp);
                $post_args['post_date_gmt'] = get_gmt_from_date($post_args['post_date']);
                $post_args['edit_date'] = true;
            } else {
                $post_args['post_status'] = 'draft';
            }
        }

        $post_id = wp_insert_post($post_args);

        if (is_wp_error($post_id) || !$post_id) {
            $err_msg = is_wp_error($post_id) ? $post_id->get_error_message() : __('Failed to insert post.', 'omni-ai-suite');
            return new \WP_REST_Response(['success' => false, 'message' => $err_msg], 500);
        }

        // Tag post with AI meta for tracking & failover recovery
        update_post_meta($post_id, '_omni_ai_generated', 1);

        // Save into generation logs IMMEDIATELY so dashboard & history are never empty
        $prompt_log = sanitize_textarea_field($params['prompt'] ?? $title);
        $model_log = sanitize_text_field($params['model'] ?? '');
        $provider_log = sanitize_text_field($params['provider'] ?? '');
        $tokens_log = intval($params['tokens'] ?? 0);
        Log_Repository::insert_log(
            get_current_user_id(),
            $prompt_log,
            $content,
            $model_log,
            $provider_log,
            $tokens_log
        );

        // Generate & attach featured image if requested
        $image_attached = false;
        $image_notice = '';
        if ($generate_image) {
            $img_style = sanitize_text_field($params['image_style'] ?? 'isometric_3d');
            $img_custom = sanitize_text_field($params['image_prompt_custom'] ?? '');
            $img_res = $this->attach_featured_image($post_id, $title, $image_provider, $img_style, $img_custom);
            $image_attached = $img_res['success'];
            if ($image_attached) {
                $image_notice = ' ' . sprintf(__('([%s] Featured image attached: %s)', 'omni-ai-suite'), strtoupper($img_res['format'] ?? 'webp'), $img_res['filename'] ?? '');
            } else {
                $image_notice = ' ' . sprintf(__('([Notice] Image generation error: %s)', 'omni-ai-suite'), $img_res['error'] ?? __('Unknown error', 'omni-ai-suite'));
            }
        }

        $edit_url = get_edit_post_link($post_id, 'raw');

        $status_labels = [
            'draft'   => __('Draft', 'omni-ai-suite'),
            'publish' => __('Published', 'omni-ai-suite'),
            'future'  => __('Scheduled', 'omni-ai-suite'),
            'pending' => __('Pending Review', 'omni-ai-suite'),
        ];
        $status_label = $status_labels[$post_args['post_status']] ?? $post_args['post_status'];

        return new \WP_REST_Response([
            'success'        => true,
            'post_id'        => $post_id,
            'title'          => $title,
            'status'         => $post_args['post_status'],
            'image_attached' => $image_attached,
            'edit_url'       => $edit_url ?: admin_url('post.php?action=edit&post=' . $post_id),
            'message'        => sprintf(__('Post #%d created as [%s] with title "%s"!%s', 'omni-ai-suite'), $post_id, $status_label, $title, $image_notice),
        ], 200);
    }

    private function attach_featured_image(int $post_id, string $title, string $provider = 'pollinations', string $style = 'isometric_3d', string $custom_prompt = ''): array {
        @set_time_limit(120);

        if (!function_exists('download_url')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        if (!function_exists('media_handle_sideload')) {
            require_once ABSPATH . 'wp-admin/includes/media.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';
        }

        // Build high-clarity visual English prompt to prevent abstract/gibberish outputs
        $final_prompt = $this->build_visual_image_prompt($title, $style, $custom_prompt);
        $image_url = '';

        if ($provider === 'dall-e') {
            $settings = Provider_Factory::get_settings();
            $openai_key_data = Provider_Factory::resolve_api_key('openai', $settings['openai_api_key'] ?? '');
            if (!empty($openai_key_data['key'])) {
                $response = wp_remote_post('https://api.openai.com/v1/images/generations', [
                    'headers' => [
                        'Content-Type'  => 'application/json',
                        'Authorization' => 'Bearer ' . $openai_key_data['key'],
                    ],
                    'body'    => wp_json_encode([
                        'model'           => 'dall-e-3',
                        'prompt'          => $final_prompt,
                        'n'               => 1,
                        'size'            => '1024x1024',
                        'response_format' => 'url',
                    ]),
                    'timeout' => 60,
                ]);
                if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
                    $body = json_decode(wp_remote_retrieve_body($response), true);
                    if (!empty($body['data'][0]['url'])) {
                        $image_url = $body['data'][0]['url'];
                    }
                }
            }
        }

        // Default or resilient fallback to Pollinations Flux without watermarks
        if (empty($image_url)) {
            $encoded_prompt = rawurlencode($final_prompt);
            $seed = mt_rand(10000, 999999);
            // nologo=true & private=true & enhance=false removes logos and watermarks completely
            $image_url = "https://image.pollinations.ai/prompt/{$encoded_prompt}?width=1200&height=630&nologo=true&private=true&enhance=false&model=flux&seed={$seed}";
        }

        // 1. Download image to temporary file
        $tmp_file = download_url($image_url, 45);
        if (is_wp_error($tmp_file)) {
            // Secondary fallback if timeout
            $fallback_prompt = rawurlencode("modern 3D isometric technology digital illustration, clean minimalism, soft studio lighting, 8k resolution, no watermark, no text");
            $retry_url = "https://image.pollinations.ai/prompt/{$fallback_prompt}?width=1200&height=630&nologo=true&private=true&enhance=false&model=flux";
            $tmp_file = download_url($retry_url, 30);
        }

        if (is_wp_error($tmp_file)) {
            return ['success' => false, 'error' => $tmp_file->get_error_message()];
        }

        // 2. Convert to WebP format if WordPress image editor is available
        $is_webp = false;
        if (function_exists('wp_get_image_editor')) {
            $editor = wp_get_image_editor($tmp_file);
            if (!is_wp_error($editor)) {
                $editor->set_quality(88);
                $webp_path = preg_replace('/\.[^.]+$/', '.webp', $tmp_file);
                if ($webp_path === $tmp_file) {
                    $webp_path .= '.webp';
                }
                $saved = $editor->save($webp_path, 'image/webp');
                if (!is_wp_error($saved) && file_exists($saved['path'])) {
                    @unlink($tmp_file);
                    $tmp_file = $saved['path'];
                    $is_webp = true;
                }
            }
        }

        // 3. Build pure English filename and attachment slug
        $english_slug = $this->build_english_slug($title, $post_id);
        $file_ext = $is_webp ? 'webp' : 'jpg';
        $filename = "{$english_slug}.{$file_ext}";

        $file_array = [
            'name'     => $filename,
            'tmp_name' => $tmp_file,
        ];

        // 4. Register image in WordPress Media Library with English title and slug
        $attach_id = media_handle_sideload($file_array, $post_id, sanitize_text_field($title), [
            'post_name'      => $english_slug,
            'post_title'     => ucwords(str_replace('-', ' ', $english_slug)),
            'post_mime_type' => $is_webp ? 'image/webp' : 'image/jpeg',
        ]);

        if (is_wp_error($attach_id)) {
            @unlink($tmp_file);
            return ['success' => false, 'error' => $attach_id->get_error_message()];
        }

        // 5. Assign as Post Thumbnail (Featured Image)
        $set_thumb = set_post_thumbnail($post_id, $attach_id);

        return [
            'success'   => (bool) $set_thumb,
            'attach_id' => $attach_id,
            'format'    => $file_ext,
            'filename'  => $filename,
            'slug'      => $english_slug,
        ];
    }

    /**
     * Builds a structured, high-clarity English visual prompt from article title & style.
     */
    private function build_visual_image_prompt(string $title, string $style = 'isometric_3d', string $custom_prompt = ''): string {
        if (!empty($custom_prompt) && strlen(trim($custom_prompt)) > 5) {
            return trim($custom_prompt) . ", 8k resolution, professional graphic design, no text, no watermark, no logo";
        }

        // Extract key English tech words if present in the Persian title (e.g. JSON, Python, React, AI, CSS, API)
        preg_match_all('/[a-zA-Z0-9#\+\.\-]+/', $title, $matches);
        $keywords = !empty($matches[0]) ? implode(' ', array_slice($matches[0], 0, 4)) : '';

        if (!empty($keywords)) {
            $subject = "Modern technology conceptual illustration of {$keywords}";
        } else {
            $subject = "Modern software technology and programming concept";
        }

        $style_map = [
            'isometric_3d' => 'modern 3D isometric render, clean geometric shapes, soft ambient studio lighting, vibrant gradient colors, 8k resolution, minimalist Octane render aesthetic',
            'flat_vector'  => 'modern flat vector art, clean sharp lines, beautiful corporate color palette, elegant tech illustration, minimal aesthetic',
            'photoreal'    => 'award winning photorealistic editorial photograph, shallow depth of field, natural soft lighting, hyper-detailed 8k, Hasselblad medium format photography',
            'cyber_tech'   => 'futuristic cyberpunk cyber-tech digital art, glowing holographic data interfaces, deep neon cyan and purple accents, high dynamic range',
            'corporate'    => 'clean corporate business minimalism, elegant tech background, soft lighting, professional creative agency aesthetic',
        ];

        $style_desc = $style_map[$style] ?? $style_map['isometric_3d'];

        return "{$subject}, {$style_desc}, masterpiece, clean composition, trending on ArtStation, no text, no typography, no watermark, no logos, no blur, high definition";
    }

    /**
     * Generates a clean English slug & filename for the image.
     */
    private function build_english_slug(string $title, int $post_id): string {
        preg_match_all('/[a-zA-Z0-9]+/', $title, $matches);
        $english_words = !empty($matches[0]) ? array_map('strtolower', $matches[0]) : [];

        if (!empty($english_words)) {
            $slug_base = implode('-', array_slice($english_words, 0, 3));
        } else {
            $slug_base = 'article-banner';
        }

        $clean = sanitize_title("{$slug_base}-featured-{$post_id}");
        return $clean ?: "post-featured-{$post_id}";
    }

    public function handle_get_logs(\WP_REST_Request $request): \WP_REST_Response {
        if (!headers_sent()) {
            header('Cache-Control: no-cache, no-store, must-revalidate');
            header('Pragma: no-cache');
            header('Expires: 0');
        }
        $limit = max(1, min(100, intval($request->get_param('limit') ?: 20)));
        $page = max(1, intval($request->get_param('page') ?: 1));
        $offset = ($page - 1) * $limit;
        $search = sanitize_text_field($request->get_param('search') ?: '');
        $provider = sanitize_text_field($request->get_param('provider') ?: '');

        $filters = array_filter(['search' => $search, 'provider' => $provider]);
        $logs = Log_Repository::get_logs($limit, $offset, $filters);
        $total = Log_Repository::get_total_count($filters);
        $stats = Log_Repository::get_stats();

        return new \WP_REST_Response([
            'logs'        => $logs,
            'total'       => $total,
            'page'        => $page,
            'total_pages' => ceil($total / $limit),
            'stats'       => $stats,
        ], 200);
    }

    public function handle_delete_log(\WP_REST_Request $request): \WP_REST_Response {
        $id = intval($request->get_param('id'));
        $deleted = Log_Repository::delete_log($id);

        return new \WP_REST_Response(['success' => $deleted], 200);
    }

    public function handle_clear_logs(): \WP_REST_Response {
        Log_Repository::clear_all_logs();
        return new \WP_REST_Response(['success' => true], 200);
    }

    public function handle_get_settings(): \WP_REST_Response {
        $settings = Provider_Factory::get_settings();
        $providers = Provider_Factory::get_all_providers();

        $provider_details = [];
        foreach ($providers as $id => $p) {
            $provider_details[$id] = [
                'name'             => $p->get_name(),
                'configured'       => $p->is_configured(),
                'supported_models' => $p->get_supported_models(),
            ];
        }

        // Mask API keys for safe display in UI
        $safe_settings = $settings;
        foreach (['gemini', 'openai', 'claude'] as $p) {
            $k = $p . '_api_key';
            $source = $settings[$p . '_key_source'] ?? 'none';
            if (!empty($safe_settings[$k])) {
                $len = strlen($safe_settings[$k]);
                $safe_settings[$k . '_masked'] = str_repeat('•', max(0, $len - 4)) . substr($safe_settings[$k], -4);
                $safe_settings[$k . '_configured'] = true;
                $safe_settings[$p . '_source'] = $source;
            } else {
                $safe_settings[$k . '_masked'] = '';
                $safe_settings[$k . '_configured'] = false;
                $safe_settings[$p . '_source'] = 'none';
            }
            // Do not send raw API keys to frontend
            unset($safe_settings[$k]);
        }

        return new \WP_REST_Response([
            'settings'  => $safe_settings,
            'providers' => $provider_details,
        ], 200);
    }

    public function handle_update_settings(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $current = get_option('omni_ai_settings', []);

        $updated = [
            'default_provider'       => sanitize_text_field($params['default_provider'] ?? $current['default_provider'] ?? 'gemini'),
            'fallback_provider'      => sanitize_text_field($params['fallback_provider'] ?? $current['fallback_provider'] ?? 'none'),
            'default_image_provider' => sanitize_text_field($params['default_image_provider'] ?? $current['default_image_provider'] ?? 'pollinations'),
            'gemini_model'           => sanitize_text_field($params['gemini_model'] ?? $current['gemini_model'] ?? 'gemini-1.5-flash'),
            'openai_model'           => sanitize_text_field($params['openai_model'] ?? $current['openai_model'] ?? 'gpt-4o-mini'),
            'claude_model'           => sanitize_text_field($params['claude_model'] ?? $current['claude_model'] ?? 'claude-3-5-sonnet-20241022'),
            'temperature'            => floatval($params['temperature'] ?? $current['temperature'] ?? 0.7),
            'max_tokens'             => intval($params['max_tokens'] ?? $current['max_tokens'] ?? 2000),
        ];

        // Only update API keys if non-empty and not masked bullet string
        foreach (['gemini_api_key', 'openai_api_key', 'claude_api_key'] as $key) {
            if (isset($params[$key]) && trim($params[$key]) !== '' && !str_contains($params[$key], '•••')) {
                $updated[$key] = trim(sanitize_text_field($params[$key]));
            } else {
                $updated[$key] = $current[$key] ?? '';
            }
        }

        update_option('omni_ai_settings', $updated);
        Provider_Factory::reset();

        return new \WP_REST_Response([
            'success' => true,
            'message' => __('Settings saved successfully.', 'omni-ai-suite'),
        ], 200);
    }

    public function handle_get_modules(): \WP_REST_Response {
        return new \WP_REST_Response([
            'modules' => Module_Manager::get_module_statuses(),
        ], 200);
    }

    public function handle_update_modules(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $module_id = sanitize_text_field($params['module_id'] ?? '');
        $active = (bool) ($params['active'] ?? false);

        if (empty($module_id)) {
            return new \WP_REST_Response(['message' => 'Missing module ID'], 400);
        }

        Module_Manager::set_module_state($module_id, $active);

        return new \WP_REST_Response([
            'success' => true,
            'modules' => Module_Manager::get_module_statuses(),
        ], 200);
    }

    public function handle_bulk_queue(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $prompts = (array) ($params['prompts'] ?? []);
        $options = [
            'provider'      => sanitize_text_field($params['provider'] ?? ''),
            'model'         => sanitize_text_field($params['model'] ?? ''),
            'system_prompt' => sanitize_textarea_field($params['system_prompt'] ?? ''),
            'post_status'   => sanitize_text_field($params['post_status'] ?? 'draft'),
            'post_type'     => sanitize_text_field($params['post_type'] ?? 'post'),
        ];

        if (empty($prompts)) {
            return new \WP_REST_Response(['message' => 'No prompts provided for bulk generation'], 400);
        }

        $enqueued_count = 0;
        $user_id = get_current_user_id();

        foreach ($prompts as $prompt_item) {
            $prompt_text = is_array($prompt_item) ? ($prompt_item['prompt'] ?? '') : (string) $prompt_item;
            $prompt_title = is_array($prompt_item) ? ($prompt_item['title'] ?? '') : '';
            if (empty(trim($prompt_text))) {
                continue;
            }

            // Phase 5 requirement: Action Scheduler integration
            if (function_exists('as_enqueue_async_action')) {
                as_enqueue_async_action('omni_ai_process_bulk_item', [
                    'prompt'  => sanitize_textarea_field($prompt_text),
                    'title'   => sanitize_text_field($prompt_title),
                    'options' => $options,
                    'user_id' => $user_id,
                ]);
                $enqueued_count++;
            } else {
                // Graceful fallback: schedule with WP-Cron
                wp_schedule_single_event(time() + ($enqueued_count * 2), 'omni_ai_process_bulk_item', [
                    [
                        'prompt'  => sanitize_textarea_field($prompt_text),
                        'title'   => sanitize_text_field($prompt_title),
                        'options' => $options,
                        'user_id' => $user_id,
                    ],
                ]);
                $enqueued_count++;
            }
        }

        return new \WP_REST_Response([
            'success'        => true,
            'enqueued_count' => $enqueued_count,
            'message'        => sprintf(__('Enqueued %d tasks for background generation.', 'omni-ai-suite'), $enqueued_count),
        ], 200);
    }
}
