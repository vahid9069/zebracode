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
                return current_user_can('edit_posts') || current_user_can('manage_options');
            },
        ]);

        // Create draft post directly from Studio
        register_rest_route(self::NAMESPACE, '/create-draft', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_create_draft'],
            'permission_callback' => function () {
                return current_user_can('edit_posts') || current_user_can('manage_options');
            },
        ]);

        // Get logs & statistics
        register_rest_route(self::NAMESPACE, '/logs', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'handle_get_logs'],
            'permission_callback' => function () {
                return current_user_can('edit_posts') || current_user_can('manage_options');
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

        // Models list endpoint
        register_rest_route(self::NAMESPACE, '/models', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'handle_get_models'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        // Refresh live models from APIs
        register_rest_route(self::NAMESPACE, '/models/refresh', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_refresh_models'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        // Custom prompt templates endpoint
        register_rest_route(self::NAMESPACE, '/prompts', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_prompts'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_save_prompts'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
        ]);

        // Categories endpoint (public for Next.js blog and Gutenberg/Studio)
        register_rest_route(self::NAMESPACE, '/categories', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'handle_get_categories'],
            'permission_callback' => '__return_true',
        ]);

        // Import manual AI article from JSON endpoint
        register_rest_route(self::NAMESPACE, '/import-article', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_import_article'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        // Security Settings & Routes management endpoints
        register_rest_route(self::NAMESPACE, '/security/settings', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_security_settings'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_save_security_settings'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/security/routes', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'handle_get_security_routes'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        // Public Blog Posts for Next.js Frontend
        register_rest_route(self::NAMESPACE, '/posts', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'handle_get_posts'],
            'permission_callback' => '__return_true',
            'args'                => [
                'per_page' => [
                    'default'           => 100,
                    'sanitize_callback' => 'absint',
                ],
                'page'     => [
                    'default'           => 1,
                    'sanitize_callback' => 'absint',
                ],
                'category' => [
                    'default'           => '',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'search'   => [
                    'default'           => '',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'slug'     => [
                    'default'           => '',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/posts/(?P<slug>[a-zA-Z0-9_\x{0600}-\x{06FF}\-]+)', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'handle_get_single_post'],
            'permission_callback' => '__return_true',
            'args'                => [
                'slug' => [
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);

        // SEO Endpoints for Single Post (Get & Update)
        register_rest_route(self::NAMESPACE, '/posts/(?P<id>\d+)/seo', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_post_seo'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_update_post_seo'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
        ]);

        // AI Snippet Generator Endpoint
        register_rest_route(self::NAMESPACE, '/seo/generate-snippet', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_generate_seo_snippet'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);
    }

    public function handle_ask(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $prompt = sanitize_textarea_field($params['prompt'] ?? '');
        $provider_id = sanitize_text_field($params['provider'] ?? '');
        $model = sanitize_text_field($params['model'] ?? '');
        if ($provider_id === 'gemini' && empty($model)) {
            $settings = Provider_Factory::get_settings();
            $model = $settings['gemini_model'] ?? 'gemini-2.5-flash';
        }
        $system_prompt = sanitize_textarea_field($params['system_prompt'] ?? '');
        $temperature = floatval($params['temperature'] ?? 0.7);
        $max_tokens = intval($params['max_tokens'] ?? 8192);
        if ($max_tokens < 4000) {
            $max_tokens = 8192;
        }

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
            $error_message = $e->getMessage();
            Log_Repository::insert_log(
                get_current_user_id(),
                $prompt,
                "ERROR: " . $error_message,
                $model,
                $provider_id,
                0
            );

            return new \WP_REST_Response([
                'success' => false,
                'message' => $error_message,
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

        error_log('OMNI DEBUG - handle_save_log hit. User: ' . get_current_user_id() . ' | Provider: ' . $provider . ' | Model: ' . $model . ' | Prompt: ' . substr($prompt, 0, 50));

        if (empty($prompt) || empty($response)) {
            error_log('OMNI DEBUG - handle_save_log: Missing prompt or response content.');
            return new \WP_REST_Response(['message' => 'Missing prompt or response content'], 400);
        }

        // Prevent duplicate log if already saved by stream handler within the last 60 seconds
        global $wpdb;
        $table_name = $wpdb->prefix . OMNI_AI_LOGS_TABLE;
        $since = date('Y-m-d H:i:s', current_time('timestamp') - 60);
        if ($wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name)) === $table_name) {
            $existing_id = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM `{$table_name}` WHERE user_id = %d AND prompt = %s AND created_at >= %s LIMIT 1",
                get_current_user_id(),
                $prompt,
                $since
            ));
            if ($existing_id) {
                return new \WP_REST_Response([
                    'success'   => true,
                    'log_id'    => (int) $existing_id,
                    'duplicate' => true,
                ], 200);
            }
        }

        $log_id = Log_Repository::insert_log(
            get_current_user_id(),
            $prompt,
            $response,
            $model,
            $provider,
            $tokens
        );

        error_log('OMNI DEBUG - handle_save_log: Insert result Log ID: ' . var_export($log_id, true));

        return new \WP_REST_Response([
            'success' => (bool) $log_id,
            'log_id'  => $log_id,
        ], 200);
    }

    public function handle_create_draft(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        error_log('OMNI DEBUG - Step 1: Endpoint hit. Params received: ' . wp_json_encode(array_keys($params)));

        $content = (string) ($params['content'] ?? '');
        $raw_title = sanitize_text_field($params['title'] ?? '');
        $raw_slug = sanitize_text_field($params['slug'] ?? '');
        $raw_excerpt = sanitize_textarea_field($params['excerpt'] ?? '');
        $category_id = intval($params['category_id'] ?? 0);
        $status = sanitize_text_field($params['status'] ?? 'draft');
        $post_type = sanitize_text_field($params['post_type'] ?? 'post');
        $scheduled_date = sanitize_text_field($params['scheduled_date'] ?? '');
        $generate_image = !empty($params['generate_image']);
        $settings = Provider_Factory::get_settings();
        $image_provider = sanitize_text_field($params['image_provider'] ?? $settings['default_image_provider'] ?? 'gemini');

        error_log('OMNI DEBUG - Step 2: Content length: ' . strlen($content) . ', User ID: ' . get_current_user_id() . ', Post Type: ' . $post_type . ', Status: ' . $status);

        if (empty(trim($content))) {
            error_log('OMNI DEBUG - Execution halted: Content is empty.');
            return new \WP_REST_Response(['success' => false, 'message' => __('Content is empty.', 'omni-ai-suite')], 400);
        }

        $extracted_title = '';
        $extracted_slug = '';
        $extracted_excerpt = '';

        // 1. Extract Title: from **عنوان مقاله:**, **عنوان:**, ### عنوان, # ..., or [TITLE: ...]
        if (preg_match('/^[ \t]*(?:#{1,4}|[-*•]|\d+[\.\)])?[ \t]*\*{0,2}عنوان(?: مقاله)?[:\s]*\*{0,2}\s*([^\n\r]+)/mu', $content, $m)) {
            $extracted_title = trim($m[1], " *#\"'\t\n\r");
            $content = preg_replace('/^[ \t]*(?:#{1,4}|[-*•]|\d+[\.\)])?[ \t]*\*{0,2}عنوان(?: مقاله)?[:\s]*\*{0,2}\s*[^\n\r]+[\r\n]*/mu', '', $content, 1);
        } elseif (preg_match('/^#\s+([^\n\r]+)/m', $content, $m)) {
            $extracted_title = trim($m[1], " *#\"'\t\n\r");
            $content = preg_replace('/^#\s+[^\n\r]+[\r\n]*/m', '', $content, 1);
        } elseif (preg_match('/\[TITLE:\s*([^\]]+)\]/iu', $content, $m)) {
            $extracted_title = trim($m[1]);
            $content = preg_replace('/\[TITLE:\s*[^\]]+\][\r\n]*/iu', '', $content, 1);
        }

        // Strictly sanitize extracted title against XSS
        if (!empty($extracted_title)) {
            $extracted_title = sanitize_text_field(wp_strip_all_tags($extracted_title));
        }

        // 2. Extract English Slug: from **اسلاگ انگلیسی:**, **نامک انگلیسی:**, **اسلاگ:**, or [SLUG: ...]
        if (preg_match('/^[ \t]*(?:#{1,4}|[-*•]|\d+[\.\)])?[ \t]*\*{0,2}(?:اسلاگ|نامک)(?: انگلیسی)?[:\s]*\*{0,2}\s*([^\n\r]+)/mu', $content, $m)) {
            $extracted_slug = trim($m[1], " *#\"'\t\n\r");
            $content = preg_replace('/^[ \t]*(?:#{1,4}|[-*•]|\d+[\.\)])?[ \t]*\*{0,2}(?:اسلاگ|نامک)(?: انگلیسی)?[:\s]*\*{0,2}\s*[^\n\r]+[\r\n]*/mu', '', $content, 1);
        } elseif (preg_match('/\[SLUG:\s*([^\]]+)\]/iu', $content, $m)) {
            $extracted_slug = trim($m[1]);
            $content = preg_replace('/\[SLUG:\s*[^\]]+\][\r\n]*/iu', '', $content, 1);
        }

        // 3. Extract Excerpt / Meta Description: from **چکیده مقاله:**, **متاتوضیحات:**, etc.
        if (preg_match('/^[ \t]*(?:#{1,4}|[-*•]|\d+[\.\)])?[ \t]*\*{0,2}(?:چکیده(?: مقاله)?|متا\s*توضیحات(?: \(Meta Description\))?)[:\s]*\*{0,2}\s*([^\n\r]+)/mu', $content, $m)) {
            $extracted_excerpt = trim($m[1], " *#\"'\t\n\r");
            $content = preg_replace('/^[ \t]*(?:#{1,4}|[-*•]|\d+[\.\)])?[ \t]*\*{0,2}(?:چکیده(?: مقاله)?|متا\s*توضیحات(?: \(Meta Description\))?)[:\s]*\*{0,2}\s*[^\n\r]+[\r\n]*/mu', '', $content, 1);
        } elseif (preg_match('/\[EXCERPT:\s*([^\]]+)\]/iu', $content, $m)) {
            $extracted_excerpt = trim($m[1]);
            $content = preg_replace('/\[EXCERPT:\s*[^\]]+\][\r\n]*/iu', '', $content, 1);
        }

        // 4. Strip leading divider line (--- or ***) that separated metadata header from article body
        $content = preg_replace('/^\s*(\-{3,}|\*{3,})\s*[\r\n]*/u', '', $content, 1);

        // Resolve Final Title: prioritize explicit title from user, or extracted article title
        $title = $raw_title;
        if (!empty($extracted_title)) {
            if (empty($title) || (!empty($params['prompt']) && str_starts_with($params['prompt'], $title))) {
                $title = sanitize_text_field(wp_strip_all_tags($extracted_title));
            }
        }
        if (empty($title)) {
            $title = !empty($params['prompt']) ? wp_trim_words(sanitize_text_field(wp_strip_all_tags($params['prompt'])), 8, '') : __('AI Generated Article', 'omni-ai-suite');
        }
        $title = sanitize_text_field(wp_strip_all_tags(trim($title, " \t\n\r\0\x0B*#\"'")));

        // Resolve Final Slug: must be clean English kebab-case
        $slug = !empty($raw_slug) ? $raw_slug : $extracted_slug;
        if (!empty($slug)) {
            $slug = sanitize_title_with_dashes($slug);
        }

        // Resolve Final Excerpt
        $excerpt = !empty($raw_excerpt) ? $raw_excerpt : $extracted_excerpt;
        $excerpt = sanitize_textarea_field(trim($excerpt, " \t\n\r\0\x0B*#\"'"));

        error_log('OMNI DEBUG - Step 3: Title resolved: "' . $title . '", Slug: "' . $slug . '", Excerpt length: ' . strlen($excerpt));

        // Lightweight Markdown-to-HTML Parser (Preserving Mermaid code blocks)
        error_log('OMNI DEBUG - Step 4: Starting parse_markdown_to_html...');
        $parsed_html = self::parse_markdown_to_html($content);
        error_log('OMNI DEBUG - Step 4b: Markdown parsed. HTML length: ' . strlen($parsed_html));

        $post_args = [
            'post_title'   => $title,
            'post_name'    => $slug,
            'post_excerpt' => $excerpt,
            'post_content' => $parsed_html,
            'post_status'  => in_array($status, ['draft', 'publish', 'future', 'pending'], true) ? $status : 'draft',
            'post_type'    => $post_type,
            'post_author'  => get_current_user_id(),
        ];

        if ($category_id > 0) {
            $post_args['post_category'] = [$category_id];
        }

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

        error_log('OMNI DEBUG - Step 5: Calling wp_insert_post...');
        $post_id = wp_insert_post($post_args);

        if (is_wp_error($post_id) || !$post_id) {
            $err_msg = is_wp_error($post_id) ? $post_id->get_error_message() : __('Failed to insert post.', 'omni-ai-suite');
            error_log('OMNI DEBUG - Execution halted: wp_insert_post failed: ' . $err_msg);
            return new \WP_REST_Response(['success' => false, 'message' => $err_msg], 500);
        }

        error_log('OMNI DEBUG - Step 5b: wp_insert_post success. Post ID: ' . $post_id);

        // Tag post with AI meta for tracking & failover recovery
        update_post_meta($post_id, '_omni_ai_generated', 1);

        // Save into generation logs (avoid duplicate if already logged during streaming)
        $prompt_log = sanitize_textarea_field($params['prompt'] ?? $title);
        $model_log = sanitize_text_field($params['model'] ?? '');
        $provider_log = sanitize_text_field($params['provider'] ?? '');
        $tokens_log = intval($params['tokens'] ?? 0);

        global $wpdb;
        $table_name = $wpdb->prefix . OMNI_AI_LOGS_TABLE;
        $recent_exists = false;
        $since_draft = date('Y-m-d H:i:s', current_time('timestamp') - 180);
        if ($wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name)) === $table_name) {
            $recent_exists = (bool) $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM `{$table_name}` WHERE user_id = %d AND prompt = %s AND created_at >= %s LIMIT 1",
                get_current_user_id(),
                $prompt_log,
                $since_draft
            ));
        }

        if (!$recent_exists) {
            error_log('OMNI DEBUG - Step 6: Calling Log_Repository::insert_log with User ID: ' . get_current_user_id() . ', Model: "' . $model_log . '", Provider: "' . $provider_log . '"');
            $log_id = Log_Repository::insert_log(
                get_current_user_id(),
                $prompt_log,
                $content,
                $model_log,
                $provider_log,
                $tokens_log
            );
            error_log('OMNI DEBUG - Step 6b: Log_Repository::insert_log returned Log ID: ' . var_export($log_id, true));
        } else {
            error_log('OMNI DEBUG - Step 6: Log already recorded during streaming, skipping duplicate insert.');
        }

        // Increase timeout for heavy image sideloading
        @set_time_limit(120);
        error_log('OMNI DEBUG - Step 7: Loading WordPress media files for sideloading...');
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $image_style = sanitize_text_field($params['image_style'] ?? 'cinematic');
        $style_suffix = " detailed, high quality, " . $image_style . " style";
        $image_attached = false;
        $image_notice = '';

        // 1. Process In-Content Images: [IMAGE: prompt]
        $updated_content = $parsed_html;
        error_log('OMNI DEBUG - Step 8: Checking for in-content image tags using regex in parsed content (length: ' . strlen($updated_content) . ')...');
        if (preg_match_all('/\[IMAGE:\s*(.+?)\]/isu', $updated_content, $matches, PREG_SET_ORDER)) {
            error_log('OMNI DEBUG - Step 8: Found ' . count($matches) . ' in-content image tag(s).');
            foreach ($matches as $idx => $match) {
                $raw_tag = $match[0];
                $img_prompt = trim($match[1]) . ',' . $style_suffix;
                error_log('OMNI DEBUG - Step 8[' . $idx . ']: Found tag: ' . $raw_tag . ' | Prompt: ' . $img_prompt);

                $img_result = $this->attach_image_by_provider($post_id, $title, $img_prompt, $image_provider, false);
                $attachment_id = !empty($img_result['attach_id']) ? $img_result['attach_id'] : null;

                $para_pattern = '/<!-- wp:paragraph -->\s*<p>\s*' . preg_quote($raw_tag, '/') . '\s*<\/p>\s*<!-- \/wp:paragraph -->/isu';

                if (!empty($attachment_id) && !is_wp_error($attachment_id)) {
                    error_log('OMNI DEBUG - Step 8[' . $idx . ']: Image Sideload SUCCESS! ID: ' . $attachment_id);
                    $local_url = wp_get_attachment_url($attachment_id);
                    $gutenberg_block = "<!-- wp:image {\"id\":{$attachment_id},\"sizeSlug\":\"large\"} -->\n<figure class=\"wp-block-image size-large\"><img src=\"" . esc_url($local_url) . "\" alt=\"" . esc_attr($img_prompt) . "\" class=\"wp-image-{$attachment_id}\"/></figure>\n<!-- /wp:image -->";

                    if (preg_match($para_pattern, $updated_content)) {
                        $updated_content = preg_replace($para_pattern, $gutenberg_block, $updated_content, 1);
                    } else {
                        $updated_content = str_replace($raw_tag, $gutenberg_block, $updated_content);
                    }
                } else {
                    error_log('OMNI DEBUG - Step 8[' . $idx . ']: Image Sideload FAILED: ' . ($img_result['error'] ?? 'Unknown error'));
                    if (preg_match($para_pattern, $updated_content)) {
                        $updated_content = preg_replace($para_pattern, '', $updated_content, 1);
                    } else {
                        $updated_content = str_replace($raw_tag, '', $updated_content);
                    }
                }
            }
        } else {
            error_log('OMNI DEBUG - Step 8: No in-content image tags found in the generated content.');
        }

        // 2. Process Featured Image (if requested)
        error_log('OMNI DEBUG - Step 9: Featured image requested? ' . ($generate_image ? 'YES' : 'NO'));
        if ($generate_image) {
            $custom_img_prompt = sanitize_text_field($params['image_prompt_custom'] ?? '');
            error_log('OMNI DEBUG - Step 9a: Generating Featured Image via attach_featured_image (Provider: ' . $image_provider . ', Style: ' . $image_style . ')');
            
            $feat_result = $this->attach_featured_image(
                $post_id,
                $title,
                $image_provider,
                $image_style,
                $custom_img_prompt
            );

            if (!empty($feat_result['success'])) {
                $feat_attachment_id = $feat_result['attach_id'] ?? 0;
                error_log('OMNI DEBUG - Step 9b: Featured Image Sideload SUCCESS! ID: ' . $feat_attachment_id);
                $image_attached = true;
                $image_notice = ' ' . __('(Featured Image generated & attached successfully)', 'omni-ai-suite');
            } else {
                $err = $feat_result['error'] ?? 'Unknown error';
                error_log('OMNI DEBUG - Step 9b: Featured Image Sideload FAILED: ' . $err);
                $image_notice = ' ' . sprintf(__('⚠️ Note: Post created, but image generation failed (%s).', 'omni-ai-suite'), $err);
            }
        }

        // 3. Update the post with the new content containing local images
        error_log('OMNI DEBUG - Step 10: Updating post #' . $post_id . ' with new content (length: ' . strlen($updated_content) . ')...');
        $update_result = wp_update_post([
            'ID'           => $post_id,
            'post_content' => $updated_content,
        ], true);

        if (is_wp_error($update_result)) {
            error_log('OMNI DEBUG - Step 10: wp_update_post FAILED: ' . $update_result->get_error_message());
        } else {
            error_log('OMNI DEBUG - Step 10: wp_update_post SUCCESS.');
        }

        $edit_url = get_edit_post_link($post_id, 'raw');

        $status_labels = [
            'draft'   => __('Draft', 'omni-ai-suite'),
            'publish' => __('Published', 'omni-ai-suite'),
            'future'  => __('Scheduled', 'omni-ai-suite'),
            'pending' => __('Pending Review', 'omni-ai-suite'),
        ];
        $status_label = $status_labels[$post_args['post_status']] ?? $post_args['post_status'];

        error_log('OMNI DEBUG - Step 11: Dispatching final JSON response for Post #' . $post_id);

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

    private function attach_featured_image(int $post_id, string $title, string $provider = 'gemini', string $style = 'isometric_3d', string $custom_prompt = ''): array {
        $final_prompt = $this->build_visual_image_prompt($title, $style, $custom_prompt);
        return $this->attach_image_by_provider($post_id, $title, $final_prompt, $provider, true);
    }

    /**
     * Sideloads an image using Google Gemini (Imagen / Flash Image) or OpenAI DALL-E 3.
     */
    private function attach_image_by_provider(int $post_id, string $title, string $prompt, string $provider = 'gemini', bool $is_featured = false): array {
        @set_time_limit(120);

        if (!function_exists('download_url')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        if (!function_exists('media_handle_sideload')) {
            require_once ABSPATH . 'wp-admin/includes/media.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';
        }

        $settings = Provider_Factory::get_settings();
        $tmp_file = null;

        // 1. Google Gemini Native Image Models (Nano Banana / Flash Image / Imagen 3)
        if ($provider === 'gemini' || str_starts_with($provider, 'gemini')) {
            $gemini_key_data = Provider_Factory::resolve_api_key('gemini', $settings['gemini_api_key'] ?? '');
            if (!empty($gemini_key_data['key'])) {
                $gemini_key = $gemini_key_data['key'];
                error_log('OMNI DEBUG - Step 9: Calling Google Gemini Image Models with key...');

                // Multimodal image generation models
                $gemini_image_models = [
                    'gemini-2.5-flash-image',
                    'gemini-3.1-flash-image',
                    'gemini-3-pro-image',
                ];

                foreach ($gemini_image_models as $g_model) {
                    $endpoint_url = "https://generativelanguage.googleapis.com/v1beta/models/{$g_model}:generateContent?key=" . urlencode($gemini_key);
                    $payload = [
                        'contents' => [
                            [
                                'parts' => [
                                    ['text' => 'Generate an ultra high quality visual illustration, clean composition, no text: ' . $prompt],
                                ],
                            ],
                        ],
                        'generationConfig' => [
                            'responseModalities' => ['TEXT', 'IMAGE'],
                        ],
                    ];

                    $resp = wp_remote_post($endpoint_url, [
                        'headers' => ['Content-Type' => 'application/json'],
                        'body'    => wp_json_encode($payload),
                        'timeout' => 50,
                    ]);

                    if (is_wp_error($resp)) {
                        error_log("OMNI DEBUG - Gemini {$g_model} request error: " . $resp->get_error_message());
                        continue;
                    }

                    $http_code = wp_remote_retrieve_response_code($resp);
                    $resp_body = wp_remote_retrieve_body($resp);
                    error_log("OMNI DEBUG - Gemini {$g_model} HTTP {$http_code}");

                    if ($http_code === 200) {
                        $b = json_decode($resp_body, true);
                        if (!empty($b['candidates'][0]['content']['parts'])) {
                            foreach ($b['candidates'][0]['content']['parts'] as $part) {
                                $data_b64 = $part['inlineData']['data'] ?? $part['inline_data']['data'] ?? null;
                                if (!empty($data_b64)) {
                                    $raw_data = base64_decode($data_b64);
                                    if (!empty($raw_data)) {
                                        $tmp_file = wp_tempnam('omni_gemini_');
                                        file_put_contents($tmp_file, $raw_data);
                                        error_log("OMNI DEBUG - Gemini Image successfully generated with {$g_model}! Size: " . strlen($raw_data) . " bytes");
                                        break 2;
                                    }
                                }
                            }
                        }
                    } else {
                        error_log("OMNI DEBUG - Gemini {$g_model} failed response: " . substr($resp_body, 0, 250));
                    }
                }

                // If flash-image didn't return image, try imagen-3.0-generate-002
                if (empty($tmp_file)) {
                    $imagen_url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=" . urlencode($gemini_key);
                    $resp2 = wp_remote_post($imagen_url, [
                        'headers' => ['Content-Type' => 'application/json'],
                        'body'    => wp_json_encode([
                            'instances' => [
                                ['prompt' => $prompt],
                            ],
                            'parameters' => [
                                'sampleCount' => 1,
                                'aspectRatio' => '16:9',
                            ],
                        ]),
                        'timeout' => 50,
                    ]);

                    if (!is_wp_error($resp2) && wp_remote_retrieve_response_code($resp2) === 200) {
                        $b2 = json_decode(wp_remote_retrieve_body($resp2), true);
                        $bytes = $b2['predictions'][0]['bytesBase64Encoded'] ?? null;
                        if (!empty($bytes)) {
                            $raw_data = base64_decode($bytes);
                            if (!empty($raw_data)) {
                                $tmp_file = wp_tempnam('omni_gemini_');
                                file_put_contents($tmp_file, $raw_data);
                                error_log("OMNI DEBUG - Gemini Image successfully generated with imagen-3.0-generate-002! Size: " . strlen($raw_data) . " bytes");
                            }
                        }
                    }
                }
            } else {
                error_log('OMNI DEBUG - Gemini key is empty in settings!');
            }
        }

        // 2. OpenAI DALL-E 3
        if (empty($tmp_file) && $provider === 'dall-e') {
            $openai_key_data = Provider_Factory::resolve_api_key('openai', $settings['openai_api_key'] ?? '');
            if (!empty($openai_key_data['key'])) {
                $response = wp_remote_post('https://api.openai.com/v1/images/generations', [
                    'headers' => [
                        'Content-Type'  => 'application/json',
                        'Authorization' => 'Bearer ' . $openai_key_data['key'],
                    ],
                    'body'    => wp_json_encode([
                        'model'           => 'dall-e-3',
                        'prompt'          => $prompt,
                        'n'               => 1,
                        'size'            => '1024x1024',
                        'response_format' => 'url',
                    ]),
                    'timeout' => 60,
                ]);
                if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
                    $body = json_decode(wp_remote_retrieve_body($response), true);
                    if (!empty($body['data'][0]['url'])) {
                        $tmp_file = download_url($body['data'][0]['url'], 45);
                    }
                }
            }
        }

        if (is_wp_error($tmp_file) || empty($tmp_file) || !file_exists($tmp_file)) {
            $err_msg = is_wp_error($tmp_file) ? $tmp_file->get_error_message() : 'Failed to generate image via ' . esc_html($provider);
            error_log('OMNI DEBUG - Image generation failed: ' . $err_msg);
            return ['success' => false, 'error' => $err_msg];
        }

        return $this->sideload_local_image_file($tmp_file, $post_id, $title, $prompt, $is_featured);
    }

    /**
     * Converts downloaded/generated image to WebP, builds SEO filename and registers in Media Library.
     */
    private function sideload_local_image_file(string $tmp_file, int $post_id, string $title, string $prompt, bool $is_featured = false): array {
        // Convert to WebP format if server supports WebP and WordPress image editor is available
        $is_webp = false;
        $supports_webp = function_exists('imagetypes') && (imagetypes() & IMG_WEBP);

        if ($supports_webp && function_exists('wp_get_image_editor')) {
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

        // Build clean English filename and attachment slug
        $english_slug = $this->build_english_slug($title, $post_id);
        $file_ext = $is_webp ? 'webp' : 'jpg';
        $filename = "{$english_slug}-" . wp_rand(100, 999) . ".{$file_ext}";

        $file_array = [
            'name'     => $filename,
            'tmp_name' => $tmp_file,
        ];

        // Register image in WordPress Media Library
        $attach_id = media_handle_sideload($file_array, $post_id, sanitize_text_field($title), [
            'post_name'      => $english_slug,
            'post_title'     => ucwords(str_replace('-', ' ', $english_slug)),
            'post_mime_type' => $is_webp ? 'image/webp' : 'image/jpeg',
        ]);

        if (is_wp_error($attach_id)) {
            @unlink($tmp_file);
            return ['success' => false, 'error' => $attach_id->get_error_message()];
        }

        // Assign as Post Thumbnail if featured image requested
        if ($is_featured) {
            set_post_thumbnail($post_id, $attach_id);
        }

        return [
            'success'   => true,
            'attach_id' => $attach_id,
            'url'       => wp_get_attachment_url($attach_id),
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
            'default_image_provider' => sanitize_text_field($params['default_image_provider'] ?? $current['default_image_provider'] ?? 'gemini'),
            'gemini_model'           => sanitize_text_field($params['gemini_model'] ?? $current['gemini_model'] ?? 'gemini-3.8-flash'),
            'openai_model'           => sanitize_text_field($params['openai_model'] ?? $current['openai_model'] ?? 'gpt-4o-mini'),
            'claude_model'           => sanitize_text_field($params['claude_model'] ?? $current['claude_model'] ?? 'claude-3-5-sonnet-20241022'),
            'temperature'            => floatval($params['temperature'] ?? $current['temperature'] ?? 0.7),
            'max_tokens'             => intval($params['max_tokens'] ?? $current['max_tokens'] ?? 8192),
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
        delete_transient('omni_ai_cached_models');

        // Immediately discover live models with newly configured API keys
        $providers = Provider_Factory::get_all_providers();
        $fresh = [];
        foreach ($providers as $id => $p) {
            $is_live = false;
            $models = $p->get_supported_models();
            if ($p->is_configured()) {
                $live = $p->fetch_live_models();
                if (!empty($live)) {
                    $models = $live;
                    $is_live = true;
                }
            }
            $fresh[$id] = [
                'name'       => $p->get_name(),
                'configured' => $p->is_configured(),
                'models'     => $models,
                'is_live'    => $is_live,
            ];
        }
        set_transient('omni_ai_cached_models', $fresh, DAY_IN_SECONDS);

        return new \WP_REST_Response([
            'success'   => true,
            'message'   => __('Settings saved and models updated.', 'omni-ai-suite'),
            'providers' => $fresh,
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

    public function handle_get_models(): \WP_REST_Response {
        $providers = Provider_Factory::get_all_providers();
        $cached = get_transient('omni_ai_cached_models');
        $needs_update = false;

        if (!is_array($cached)) {
            $cached = [];
        }

        // Purge deprecated and image/non-content models from cache
        if (!empty($cached['gemini']['models']) && is_array($cached['gemini']['models'])) {
            $has_unwanted = false;
            foreach ($cached['gemini']['models'] as $m_slug => $m_lbl) {
                $is_unwanted = (
                    !str_starts_with($m_slug, 'gemini-') ||
                    str_contains($m_slug, 'image') ||
                    str_contains($m_slug, 'imagen') ||
                    str_contains($m_slug, 'picture') ||
                    str_contains($m_slug, 'photo') ||
                    str_contains($m_slug, 'audio') ||
                    str_contains($m_slug, 'speech') ||
                    str_contains($m_slug, 'tts') ||
                    str_contains($m_slug, 'whisper') ||
                    str_contains($m_slug, 'embedding') ||
                    str_contains($m_slug, 'veo') ||
                    str_contains($m_slug, 'video') ||
                    str_contains($m_slug, '2.0-flash') ||
                    str_contains($m_slug, '2.5-flash') ||
                    preg_match('/^gemini-2\.[05]/', $m_slug) ||
                    preg_match('/-\d{3}$/', $m_slug)
                );
                if ($is_unwanted) {
                    unset($cached['gemini']['models'][$m_slug]);
                    $has_unwanted = true;
                    $needs_update = true;
                }
            }
            if ($has_unwanted || count($cached['gemini']['models']) > 15 || !isset($cached['gemini']['models']['gemini-3.8-flash'])) {
                // Invalidate gemini cache so it re-fetches clean content-only models
                unset($cached['gemini']);
                $needs_update = true;
            }
        }

        foreach ($providers as $id => $p) {
            $configured = $p->is_configured();
            // If configured but models not yet queried live, query now
            if ($configured && (empty($cached[$id]['is_live']) || empty($cached[$id]['models']))) {
                $live = $p->fetch_live_models();
                $is_live = !empty($live) && ($live !== $p->get_supported_models());
                $cached[$id] = [
                    'name'       => $p->get_name(),
                    'configured' => true,
                    'models'     => !empty($live) ? $live : $p->get_supported_models(),
                    'is_live'    => $is_live,
                ];
                $needs_update = true;
            } elseif (!isset($cached[$id])) {
                $cached[$id] = [
                    'name'       => $p->get_name(),
                    'configured' => $configured,
                    'models'     => $p->get_supported_models(),
                    'is_live'    => false,
                ];
                $needs_update = true;
            } else {
                $cached[$id]['configured'] = $configured;
                $cached[$id]['name'] = $p->get_name();
            }
        }

        if ($needs_update) {
            set_transient('omni_ai_cached_models', $cached, DAY_IN_SECONDS);
        }

        return new \WP_REST_Response([
            'providers' => $cached,
        ], 200);
    }

    public function handle_refresh_models(\WP_REST_Request $request): \WP_REST_Response {
        $providers = Provider_Factory::get_all_providers();
        $fresh = [];

        foreach ($providers as $id => $p) {
            $is_live = false;
            $models = $p->get_supported_models();
            if ($p->is_configured()) {
                $live = $p->fetch_live_models();
                if (!empty($live)) {
                    $models = $live;
                    $is_live = true;
                }
            }

            $fresh[$id] = [
                'name'       => $p->get_name(),
                'configured' => $p->is_configured(),
                'models'     => $models,
                'is_live'    => $is_live,
            ];
        }

        set_transient('omni_ai_cached_models', $fresh, DAY_IN_SECONDS);

        return new \WP_REST_Response([
            'success'   => true,
            'message'   => __('Models refreshed successfully.', 'omni-ai-suite'),
            'providers' => $fresh,
        ], 200);
    }

    public function handle_get_prompts(): \WP_REST_Response {
        $custom = get_option('omni_ai_custom_prompts', []);
        return new \WP_REST_Response([
            'success' => true,
            'prompts' => is_array($custom) ? $custom : [],
        ], 200);
    }

    public function handle_save_prompts(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $prompts = $params['prompts'] ?? [];
        if (!is_array($prompts)) {
            $prompts = [];
        }

        $sanitized = [];
        foreach ($prompts as $p) {
            $id = sanitize_key($p['id'] ?? uniqid('prompt_'));
            $title = sanitize_text_field($p['title'] ?? '');
            $prompt_text = sanitize_textarea_field($p['prompt'] ?? '');
            if (!empty($title) && !empty($prompt_text)) {
                $sanitized[] = [
                    'id'     => $id,
                    'title'  => $title,
                    'prompt' => $prompt_text,
                ];
            }
        }

        update_option('omni_ai_custom_prompts', $sanitized, false);

        return new \WP_REST_Response([
            'success' => true,
            'prompts' => $sanitized,
        ], 200);
    }

    public function handle_get_categories(): \WP_REST_Response {
        $wp_categories = get_categories(['hide_empty' => false]);
        $list = [];
        if (is_array($wp_categories)) {
            foreach ($wp_categories as $c) {
                $list[] = [
                    'id'          => $c->term_id,
                    'name'        => html_entity_decode($c->name, ENT_QUOTES, 'UTF-8'),
                    'slug'        => sanitize_title($c->slug),
                    'count'       => (int) $c->count,
                    'description' => sanitize_text_field($c->description),
                ];
            }
        }

        return new \WP_REST_Response([
            'success'    => true,
            'categories' => $list,
        ], 200);
    }

    /**
     * Public endpoint to get published blog posts for the Next.js static/dynamic frontend.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function handle_get_posts(\WP_REST_Request $request): \WP_REST_Response {
        $per_page = min(100, max(1, absint($request->get_param('per_page') ?: 20)));
        $paged = max(1, absint($request->get_param('page') ?: 1));
        $category = sanitize_text_field($request->get_param('category') ?? '');
        $search = sanitize_text_field($request->get_param('search') ?? '');
        $slug = sanitize_title($request->get_param('slug') ?? '');
        $status_param = sanitize_key($request->get_param('status') ?? 'publish');
        $allowed_statuses = ['publish', 'draft', 'pending', 'any'];
        $post_status = in_array($status_param, $allowed_statuses, true) ? $status_param : 'publish';

        $args = [
            'post_type'           => 'post',
            'post_status'         => $post_status,
            'posts_per_page'      => $per_page,
            'paged'               => $paged,
            'orderby'             => 'date',
            'order'               => 'DESC',
            'ignore_sticky_posts' => true,
        ];

        if (!empty($slug)) {
            $args['name'] = $slug;
        }
        if (!empty($category)) {
            $args['category_name'] = $category;
        }
        if (!empty($search)) {
            $args['s'] = $search;
        }

        $query = new \WP_Query($args);
        $items = [];
        foreach ($query->posts as $post) {
            $items[] = $this->format_post_for_blog($post);
        }

        return new \WP_REST_Response([
            'success'     => true,
            'items'       => $items,
            'total'       => (int) $query->found_posts,
            'total_pages' => (int) $query->max_num_pages,
            'page'        => $paged,
            'per_page'    => $per_page,
        ], 200);
    }

    /**
     * Public endpoint to get a single post by slug for the Next.js article reader.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function handle_get_single_post(\WP_REST_Request $request): \WP_REST_Response {
        $slug = sanitize_title($request->get_param('slug') ?? '');
        if (empty($slug)) {
            return new \WP_REST_Response(['success' => false, 'message' => 'Slug is required'], 400);
        }

        $query = new \WP_Query([
            'post_type'      => 'post',
            'post_status'    => ['publish', 'draft'],
            'name'           => $slug,
            'posts_per_page' => 1,
        ]);

        if (empty($query->posts)) {
            return new \WP_REST_Response(['success' => false, 'message' => 'Post not found'], 404);
        }

        return new \WP_REST_Response([
            'success' => true,
            'post'    => $this->format_post_for_blog($query->posts[0]),
        ], 200);
    }

    /**
     * Format a WordPress Post for the Next.js Blog API including Rank Math SEO metadata.
     *
     * @param \WP_Post $post
     * @return array
     */
    public function format_post_for_blog(\WP_Post $post): array {
        $post_id = absint($post->ID);

        // Categories
        $wp_categories = get_the_category($post_id);
        $primary_category = 'development';
        $category_list = [];
        if (!empty($wp_categories) && is_array($wp_categories)) {
            $primary_category = sanitize_title($wp_categories[0]->slug);
            foreach ($wp_categories as $cat) {
                $category_list[] = [
                    'id'   => $cat->term_id,
                    'name' => html_entity_decode($cat->name, ENT_QUOTES, 'UTF-8'),
                    'slug' => sanitize_title($cat->slug),
                ];
            }
        }

        // Tags
        $wp_tags = wp_get_post_tags($post_id, ['fields' => 'names']);
        $tags = is_array($wp_tags) ? array_map('sanitize_text_field', $wp_tags) : [];

        // Author
        $author_id = absint($post->post_author);
        $author_name = sanitize_text_field(get_the_author_meta('display_name', $author_id)) ?: 'تحریریه زبراکد';
        $author_bio = sanitize_text_field(get_the_author_meta('description', $author_id)) ?: 'یادداشت‌های کاربردی برای ساختن نرم‌افزار بهتر.';

        // Featured Image
        $featured_image = null;
        $thumb_id = get_post_thumbnail_id($post_id);
        if ($thumb_id) {
            $img_src = wp_get_attachment_image_src($thumb_id, 'full');
            if ($img_src) {
                $featured_image = [
                    'url'    => esc_url_raw($img_src[0]),
                    'width'  => (int) $img_src[1],
                    'height' => (int) $img_src[2],
                    'alt'    => sanitize_text_field(get_post_meta($thumb_id, '_wp_attachment_image_alt', true) ?: $post->post_title),
                ];
            }
        }

        // FAQ from plugin meta or Rank Math FAQ Schema
        $faq = get_post_meta($post_id, '_ai_faq_data', true);
        if (empty($faq) || !is_array($faq)) {
            $faq = get_post_meta($post_id, '_zebracode_blog_ai_faq', true);
        }
        if (empty($faq) || !is_array($faq)) {
            $rank_math_faq = get_post_meta($post_id, 'rank_math_schema_FAQ', true);
            if (!empty($rank_math_faq) && is_array($rank_math_faq)) {
                $faq = [];
                foreach ($rank_math_faq as $item) {
                    if (isset($item['title'], $item['content'])) {
                        $faq[] = [
                            'question' => wp_strip_all_tags($item['title']),
                            'answer'   => wp_strip_all_tags($item['content']),
                        ];
                    }
                }
            }
        }
        $formatted_faq = [];
        if (is_array($faq)) {
            foreach ($faq as $item) {
                if (is_array($item) && !empty($item['question']) && !empty($item['answer'])) {
                    $formatted_faq[] = [
                        'question' => sanitize_text_field($item['question']),
                        'answer'   => sanitize_textarea_field($item['answer']),
                    ];
                }
            }
        }

        // Related tools
        $tools = get_post_meta($post_id, '_zebracode_blog_ai_related_tools', true);
        $related_tools = is_array($tools) ? array_map('sanitize_title', $tools) : [];

        // Omni AI SEO extraction with Rank Math / Yoast fallbacks
        $omni_title = (string) get_post_meta($post_id, '_omni_ai_seo_title', true);
        $raw_rm_title = !empty($omni_title) ? $omni_title : (string) get_post_meta($post_id, 'rank_math_title', true);
        if (empty($raw_rm_title)) {
            $raw_rm_title = (string) get_post_meta($post_id, '_yoast_wpseo_title', true);
        }

        $omni_desc = (string) get_post_meta($post_id, '_omni_ai_meta_description', true);
        $raw_rm_desc  = !empty($omni_desc) ? $omni_desc : (string) get_post_meta($post_id, 'rank_math_description', true);
        if (empty($raw_rm_desc)) {
            $raw_rm_desc = (string) get_post_meta($post_id, '_yoast_wpseo_metadesc', true);
        }

        // Resolve Rank Math template variables (%title%, %sep%, %sitename%, etc.) if Rank Math is loaded
        $rm_title = $raw_rm_title;
        $rm_desc  = $raw_rm_desc;
        if (class_exists('\\RankMath\\Helper') && method_exists('\\RankMath\\Helper', 'replace_vars')) {
            if (!empty($raw_rm_title)) {
                $rm_title = \RankMath\Helper::replace_vars($raw_rm_title, $post);
            }
            if (!empty($raw_rm_desc)) {
                $rm_desc = \RankMath\Helper::replace_vars($raw_rm_desc, $post);
            }
        }

        $post_title = wp_strip_all_tags(get_the_title($post_id));
        $seo_title = !empty($rm_title) ? sanitize_text_field($rm_title) : $post_title;

        $post_excerpt = wp_strip_all_tags(get_the_excerpt($post_id));
        $seo_desc = !empty($rm_desc) ? sanitize_textarea_field($rm_desc) : $post_excerpt;

        $focus_keyword = sanitize_text_field((string) get_post_meta($post_id, '_omni_ai_focus_keyword', true));
        if (empty($focus_keyword)) {
            $focus_keyword = sanitize_text_field((string) get_post_meta($post_id, 'rank_math_focus_keyword', true));
        }
        if (empty($focus_keyword)) {
            $focus_keyword = sanitize_text_field((string) get_post_meta($post_id, '_yoast_wpseo_focuskw', true));
        }

        $canonical_url = esc_url_raw((string) get_post_meta($post_id, '_omni_ai_canonical_url', true));
        if (empty($canonical_url)) {
            $canonical_url = esc_url_raw((string) get_post_meta($post_id, 'rank_math_canonical_url', true));
        }

        // Robots
        $omni_noindex = get_post_meta($post_id, '_omni_ai_noindex', true);
        $omni_nofollow = get_post_meta($post_id, '_omni_ai_nofollow', true);
        $robots_meta = get_post_meta($post_id, 'rank_math_robots', true);
        $robots_list = [];
        $is_noindex = ($omni_noindex === '1');
        $is_nofollow = ($omni_nofollow === '1');
        if (is_array($robots_meta)) {
            $robots_list = array_map('sanitize_key', $robots_meta);
            if (in_array('noindex', $robots_list, true)) $is_noindex = true;
            if (in_array('nofollow', $robots_list, true)) $is_nofollow = true;
        } elseif (is_string($robots_meta) && !empty($robots_meta)) {
            $robots_list = array_map('trim', explode(',', $robots_meta));
            if (in_array('noindex', $robots_list, true)) $is_noindex = true;
            if (in_array('nofollow', $robots_list, true)) $is_nofollow = true;
        }
        if ($is_noindex && !in_array('noindex', $robots_list, true)) {
            $robots_list[] = 'noindex';
        }
        if ($is_nofollow && !in_array('nofollow', $robots_list, true)) {
            $robots_list[] = 'nofollow';
        }

        // Ranking Scores
        $scores = [
            'seo'   => (int) get_post_meta($post_id, '_omni_ranking_seo_score', true),
            'aeo'   => (int) get_post_meta($post_id, '_omni_ranking_aeo_score', true),
            'geo'   => (int) get_post_meta($post_id, '_omni_ranking_geo_score', true),
            'total' => (int) get_post_meta($post_id, '_omni_ranking_avg_score', true),
        ];

        // Social / OpenGraph / Twitter
        $og_title = sanitize_text_field((string) get_post_meta($post_id, '_omni_ai_og_title', true));
        if (empty($og_title)) $og_title = sanitize_text_field((string) get_post_meta($post_id, 'rank_math_facebook_title', true)) ?: $seo_title;

        $og_desc  = sanitize_textarea_field((string) get_post_meta($post_id, '_omni_ai_og_description', true));
        if (empty($og_desc)) $og_desc = sanitize_textarea_field((string) get_post_meta($post_id, 'rank_math_facebook_description', true)) ?: $seo_desc;

        $og_image = esc_url_raw((string) get_post_meta($post_id, '_omni_ai_og_image', true));
        if (empty($og_image)) $og_image = esc_url_raw((string) get_post_meta($post_id, 'rank_math_facebook_image', true));
        if (empty($og_image) && $featured_image) {
            $og_image = $featured_image['url'];
        }

        $twitter_title = sanitize_text_field((string) get_post_meta($post_id, '_omni_ai_twitter_title', true));
        if (empty($twitter_title)) $twitter_title = sanitize_text_field((string) get_post_meta($post_id, 'rank_math_twitter_title', true)) ?: $og_title;

        $twitter_desc  = sanitize_textarea_field((string) get_post_meta($post_id, '_omni_ai_twitter_description', true));
        if (empty($twitter_desc)) $twitter_desc = sanitize_textarea_field((string) get_post_meta($post_id, 'rank_math_twitter_description', true)) ?: $og_desc;

        $twitter_image = esc_url_raw((string) get_post_meta($post_id, '_omni_ai_twitter_image', true));
        if (empty($twitter_image)) $twitter_image = esc_url_raw((string) get_post_meta($post_id, 'rank_math_twitter_image', true)) ?: $og_image;

        // Content (rendered Gutenberg blocks or HTML)
        $rendered_content = apply_filters('the_content', $post->post_content);

        return [
            'id'               => $post_id,
            'slug'             => sanitize_title($post->post_name),
            'title'            => $post_title,
            'excerpt'          => $post_excerpt,
            'content'          => $rendered_content,
            'category'         => $primary_category,
            'categories'       => $category_list,
            'tags'             => $tags,
            'published_at'     => get_post_time('c', true, $post_id),
            'updated_at'       => get_post_modified_time('c', true, $post_id),
            'featured_image'   => $featured_image,
            'author'           => [
                'name'     => $author_name,
                'role'     => 'تحریریه زبراکد',
                'bio'      => $author_bio,
                'initials' => mb_substr($author_name, 0, 2),
            ],
            'meta_description' => $seo_desc,
            'faq'              => $formatted_faq,
            'related_tools'    => $related_tools,
            'seo'              => [
                'title'               => $seo_title,
                'description'         => $seo_desc,
                'focus_keyword'       => $focus_keyword,
                'canonical_url'       => $canonical_url ?: get_permalink($post_id),
                'robots'              => $robots_list,
                'is_noindex'          => $is_noindex,
                'is_nofollow'         => $is_nofollow,
                'og_title'            => $og_title,
                'og_description'      => $og_desc,
                'og_image'            => $og_image,
                'twitter_title'       => $twitter_title,
                'twitter_description' => $twitter_desc,
                'twitter_image'       => $twitter_image,
                'scores'              => $scores,
            ],
        ];
    }

    /**
     * Convert basic Markdown (Headings, Bold, Lists, Code, Tables) and Mermaid code blocks into native Gutenberg HTML blocks.
     */
    public static function parse_markdown_to_html(string $text): string {
        $text = trim($text);
        if (empty($text)) return '';

        $text = str_replace(["\r\n", "\r"], "\n", $text);

        // 1. Mermaid Sideloading
        $mermaid_blocks = [];
        $text = preg_replace_callback('/```mermaid[\r\n]+([\s\S]*?)```/iu', function ($matches) use (&$mermaid_blocks) {
            $inner_mermaid = trim($matches[1]);
            $json_payload = wp_json_encode([
                'code' => $inner_mermaid,
                'mermaid' => [
                    'theme' => 'base',
                    'themeVariables' => [
                        'fontFamily'         => 'Vazirmatn, Tahoma, system-ui, sans-serif',
                        'fontSize'           => '14px',
                        'primaryColor'       => '#eef2ff',
                        'primaryTextColor'   => '#1e1b4b',
                        'primaryBorderColor' => '#6366f1',
                        'lineColor'          => '#4f46e5',
                        'secondaryColor'     => '#ecfdf5',
                        'tertiaryColor'      => '#f8fafc',
                        'background'         => '#ffffff',
                        'mainBkg'            => '#f8fafc',
                        'nodeBorder'         => '#6366f1',
                        'clusterBkg'         => '#f1f5f9',
                        'clusterBorder'      => '#cbd5e1',
                    ],
                ],
            ]);
            $base64 = rtrim(strtr(base64_encode($json_payload), '+/', '-_'), '=');
            $external_url = "https://mermaid.ink/svg/" . $base64;
            $local_url = $external_url;

            $response = wp_remote_get($external_url, ['timeout' => 15]);
            if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
                $svg_content = wp_remote_retrieve_body($response);
                $upload_dir = wp_upload_dir();
                $target_dir = $upload_dir['basedir'] . '/omni-ai-diagrams';
                if (wp_mkdir_p($target_dir)) {
                    $filename = 'diagram-' . md5($base64) . '.svg';
                    if (file_put_contents($target_dir . '/' . $filename, $svg_content)) {
                        $local_url = $upload_dir['baseurl'] . '/omni-ai-diagrams/' . $filename;
                    }
                }
            }
            $token = '%%MERMAID_DIV_' . count($mermaid_blocks) . '%%';
            $mermaid_blocks[$token] = "<!-- wp:image -->\n<figure class=\"wp-block-image\"><img src=\"" . esc_url($local_url) . "\" alt=\"AI Generated Diagram\"/></figure>\n<!-- /wp:image -->";
            return $token;
        }, $text);

        // 2. Generic Code Blocks (```python, ```js, etc.) -> Gutenberg Code
        $text = preg_replace_callback('/```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/u', function ($matches) {
            $lang = trim($matches[1]);
            $code = esc_html(trim($matches[2]));
            $class_attr = $lang ? " class=\"language-" . esc_attr($lang) . "\"" : '';
            return "<!-- wp:code -->\n<pre class=\"wp-block-code\"><code{$class_attr}>{$code}</code></pre>\n<!-- /wp:code -->";
        }, $text);

        // 3. Headings -> Gutenberg Headings
        $text = preg_replace('/^[ \t]*####[ \t]+([^\n]+)$/m', "<!-- wp:heading {\"level\":4} -->\n<h4>$1</h4>\n<!-- /wp:heading -->", $text);
        $text = preg_replace('/^[ \t]*###[ \t]+([^\n]+)$/m', "<!-- wp:heading {\"level\":3} -->\n<h3>$1</h3>\n<!-- /wp:heading -->", $text);
        $text = preg_replace('/^[ \t]*##[ \t]+([^\n]+)$/m', "<!-- wp:heading {\"level\":2} -->\n<h2>$1</h2>\n<!-- /wp:heading -->", $text);
        $text = preg_replace('/^[ \t]*#[ \t]+([^\n]+)$/m', "<!-- wp:heading {\"level\":2} -->\n<h2>$1</h2>\n<!-- /wp:heading -->", $text);

        // 4. Horizontal Separators
        $text = preg_replace('/^[ \t]*(\-{3,}|\*{3,}|_{3,})[ \t]*$/m', "<!-- wp:separator -->\n<hr class=\"wp-block-separator has-alpha-channel-opacity\"/>\n<!-- /wp:separator -->", $text);

        // 5. Blockquotes (> quote) -> Gutenberg Quote
        $text = preg_replace_callback('/(?:(?:^[ \t]*>[ \t]*.+?(?:\n|$))+)/m', function ($matches) {
            $lines = array_map(function ($l) {
                return trim(preg_replace('/^[ \t]*>[ \t]*/', '', $l));
            }, explode("\n", trim($matches[0])));
            $quote_body = nl2br(implode("\n", array_filter($lines)));
            return "<!-- wp:quote -->\n<blockquote class=\"wp-block-quote\"><p>{$quote_body}</p></blockquote>\n<!-- /wp:quote -->";
        }, $text);

        // 6. Tables -> Gutenberg Tables (Lenient Pipe Matching)
        $text = preg_replace_callback('/((?:(?:.*?[|].*?)[\n]+)+)/m', function ($matches) {
            $lines = array_filter(array_map('trim', explode("\n", trim($matches[0]))));
            $has_separator = false;
            foreach ($lines as $line) {
                if (preg_match('/^[|\s\-:]+$/', $line) && strpos($line, '-') !== false) {
                    $has_separator = true;
                    break;
                }
            }
            if (!$has_separator || count($lines) < 2) return $matches[0];

            $html = "<!-- wp:table -->\n<figure class=\"wp-block-table\"><table>\n";
            $is_head = true;
            foreach ($lines as $line) {
                if (preg_match('/^[|\s\-:]+$/', $line) && strpos($line, '-') !== false) {
                    $is_head = false;
                    $html .= "<tbody>\n";
                    continue;
                }
                $html .= $is_head ? "<thead><tr>" : "<tr>";
                $cells = explode('|', trim($line, '|'));
                foreach ($cells as $cell) {
                    $cell = preg_replace('/\*\*(.+?)\*\*/us', '<strong>$1</strong>', trim($cell));
                    $html .= $is_head ? "<th>$cell</th>" : "<td>$cell</td>";
                }
                $html .= $is_head ? "</tr></thead>\n" : "</tr>\n";
            }
            $html .= "</tbody>\n</table></figure>\n<!-- /wp:table -->";
            return $html;
        }, $text);

        // 7. Ordered Lists (1. 2. 3.) -> Gutenberg Ordered List
        $text = preg_replace_callback('/(?:(?:^[ \t]*\d+[\.\)][ \t]+.+?(?:\n|$))+)/m', function ($matches) {
            $lines = array_filter(array_map('trim', explode("\n", trim($matches[0]))));
            $html = "<!-- wp:list {\"ordered\":true} -->\n<ol>\n";
            foreach ($lines as $line) {
                $item = preg_replace('/^\d+[\.\)][ \t]+/u', '', $line);
                $item = preg_replace('/\*\*(.+?)\*\*/us', '<strong>$1</strong>', $item);
                $html .= "<li>$item</li>\n";
            }
            return $html . "</ol>\n<!-- /wp:list -->";
        }, $text);

        // 8. Unordered Lists (- or *) -> Gutenberg List
        $text = preg_replace_callback('/(?:(?:^[ \t]*[-*•][ \t]+.+?(?:\n|$))+)/m', function ($matches) {
            $lines = array_filter(array_map('trim', explode("\n", trim($matches[0]))));
            $html = "<!-- wp:list -->\n<ul>\n";
            foreach ($lines as $line) {
                $item = preg_replace('/^[-*•][ \t]+/u', '', $line);
                $item = preg_replace('/\*\*(.+?)\*\*/us', '<strong>$1</strong>', $item);
                $html .= "<li>$item</li>\n";
            }
            return $html . "</ul>\n<!-- /wp:list -->";
        }, $text);

        // 9. Inline Markdown: Links, Code, and Bold
        $text = preg_replace('/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/u', '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>', $text);
        $text = preg_replace('/`([^`\n]+)`/u', '<code>$1</code>', $text);
        $text = preg_replace('/\*\*(.+?)\*\*/us', '<strong>$1</strong>', $text);

        // 10. Paragraphs -> Gutenberg Paragraphs
        $blocks = explode("\n\n", $text);
        $parsed_blocks = [];
        foreach ($blocks as $block) {
            $block = trim($block);
            if (empty($block)) continue;

            // If it's already a Gutenberg block, keep it intact
            if (str_starts_with($block, '<!-- wp:')) {
                $parsed_blocks[] = $block;
            } elseif (preg_match('/^\[IMAGE:\s*.+?\]$/isu', $block)) {
                // Standalone Image Placeholder: keep outside <p> so replacement block is not nested in paragraph
                $parsed_blocks[] = $block;
            } else {
                $block = nl2br($block);
                $parsed_blocks[] = "<!-- wp:paragraph -->\n<p>$block</p>\n<!-- /wp:paragraph -->";
            }
        }
        $text = implode("\n\n", $parsed_blocks);

        // 11. Restore Mermaid Blocks
        if (!empty($mermaid_blocks)) {
            $text = strtr($text, $mermaid_blocks);
        }

        return $text;
    }

    /**
     * Convert clean Markdown text into native WordPress Gutenberg block comments & HTML.
     */
    public static function markdown_to_gutenberg(string $text): string {
        $text = trim($text);
        if (empty($text)) {
            return '';
        }

        $text = str_replace(["\r\n", "\r"], "\n", $text);
        $lines = explode("\n", $text);
        $blocks = [];
        $cur_list = [];
        $list_type = 'ul';
        $cur_table = [];
        $cur_para = [];
        $in_code = false;
        $code_buf = [];

        $flush_para = function () use (&$cur_para, &$blocks) {
            if (!empty($cur_para)) {
                $p_text = trim(implode("\n", $cur_para));
                if (!empty($p_text)) {
                    $p_html = self::format_inline_markdown($p_text);
                    $blocks[] = "<!-- wp:paragraph -->\n<p>{$p_html}</p>\n<!-- /wp:paragraph -->";
                }
                $cur_para = [];
            }
        };

        $flush_list = function () use (&$cur_list, &$list_type, &$blocks) {
            if (!empty($cur_list)) {
                $tag = ($list_type === 'ol') ? 'ol' : 'ul';
                $attrs = ($list_type === 'ol') ? ' {"ordered":true}' : '';
                $items_html = '';
                foreach ($cur_list as $li) {
                    $items_html .= "<li>" . self::format_inline_markdown($li) . "</li>\n";
                }
                $blocks[] = "<!-- wp:list{$attrs} -->\n<{$tag}>\n{$items_html}</{$tag}>\n<!-- /wp:list -->";
                $cur_list = [];
            }
        };

        $flush_table = function () use (&$cur_table, &$blocks) {
            if (!empty($cur_table)) {
                $html = self::render_markdown_table($cur_table);
                if (!empty($html)) {
                    $blocks[] = $html;
                }
                $cur_table = [];
            }
        };

        foreach ($lines as $line) {
            $trimmed = trim($line);

            // Code fence handling
            if (str_starts_with($trimmed, '```')) {
                if ($in_code) {
                    $in_code = false;
                    $code_content = esc_html(implode("\n", $code_buf));
                    $blocks[] = "<!-- wp:code -->\n<pre class=\"wp-block-code\"><code>{$code_content}</code></pre>\n<!-- /wp:code -->";
                    $code_buf = [];
                } else {
                    $flush_para();
                    $flush_list();
                    $flush_table();
                    $in_code = true;
                }
                continue;
            }

            if ($in_code) {
                $code_buf[] = $line;
                continue;
            }

            // Empty line
            if ($trimmed === '') {
                $flush_para();
                $flush_list();
                $flush_table();
                continue;
            }

            // Horizontal Separator
            if (preg_match('/^(\-{3,}|\*{3,}|_{3,})$/', $trimmed)) {
                $flush_para();
                $flush_list();
                $flush_table();
                $blocks[] = "<!-- wp:separator -->\n<hr class=\"wp-block-separator has-alpha-channel-opacity\"/>\n<!-- /wp:separator -->";
                continue;
            }

            // Table rows (starts with |)
            if (str_starts_with($trimmed, '|')) {
                $flush_para();
                $flush_list();
                $cur_table[] = $trimmed;
                continue;
            } elseif (!empty($cur_table)) {
                $flush_table();
            }

            // Headings (#, ##, ###, etc.)
            if (preg_match('/^(#{1,6})\s+(.+)$/', $trimmed, $m)) {
                $flush_para();
                $flush_list();
                $flush_table();
                $level = strlen($m[1]);
                $heading_text = self::format_inline_markdown(trim($m[2]));
                $tag_level = ($level === 1) ? 2 : $level;
                $level_attr = ($tag_level > 2) ? " {\"level\":{$tag_level}}" : '';
                $blocks[] = "<!-- wp:heading{$level_attr} -->\n<h{$tag_level}>{$heading_text}</h{$tag_level}>\n<!-- /wp:heading -->";
                continue;
            }

            // Blockquotes
            if (str_starts_with($trimmed, '>')) {
                $flush_para();
                $flush_list();
                $flush_table();
                $quote_text = self::format_inline_markdown(trim(substr($trimmed, 1)));
                $blocks[] = "<!-- wp:quote -->\n<blockquote class=\"wp-block-quote\"><p>{$quote_text}</p></blockquote>\n<!-- /wp:quote -->";
                continue;
            }

            // Lists (bullets or numbered)
            if (preg_match('/^[-*•]\s+(.+)$/u', $trimmed, $m)) {
                $flush_para();
                $flush_table();
                $list_type = 'ul';
                $cur_list[] = $m[1];
                continue;
            }

            if (preg_match('/^\d+[\.\)]\s+(.+)$/u', $trimmed, $m)) {
                $flush_para();
                $flush_table();
                $list_type = 'ol';
                $cur_list[] = $m[1];
                continue;
            }

            // Regular paragraph line
            if (!empty($cur_list)) {
                $flush_list();
            }
            $cur_para[] = $trimmed;
        }

        $flush_para();
        $flush_list();
        $flush_table();

        return implode("\n\n", $blocks);
    }

    private static function format_inline_markdown(string $text): string {
        $text = preg_replace('/\*\*(.+?)\*\*/us', '<strong>$1</strong>', $text);
        $text = preg_replace('/__(.+?)__/us', '<strong>$1</strong>', $text);
        $text = preg_replace('/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/us', '<em>$1</em>', $text);
        $text = preg_replace('/`([^`]+)`/u', '<code>$1</code>', $text);
        $text = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/u', '<a href="$2">$1</a>', $text);
        return $text;
    }

    private static function render_markdown_table(array $rows): string {
        if (count($rows) < 2) {
            return '';
        }

        $header_line = array_shift($rows);
        $divider = array_shift($rows);

        $split_row = function ($row_str) {
            $trimmed = trim($row_str, '| ');
            $cols = explode('|', $trimmed);
            return array_map(function ($c) {
                return self::format_inline_markdown(trim($c));
            }, $cols);
        };

        $headers = $split_row($header_line);
        $thead = "<thead><tr>";
        foreach ($headers as $h) {
            $thead .= "<th>" . $h . "</th>";
        }
        $thead .= "</tr></thead>";

        $tbody = "<tbody>";
        foreach ($rows as $r) {
            if (empty(trim($r))) continue;
            if (preg_match('/^\|[\s\-:]+\|$/', trim($r))) continue;
            $cells = $split_row($r);
            $tbody .= "<tr>";
            foreach ($cells as $c) {
                $tbody .= "<td>" . $c . "</td>";
            }
            $tbody .= "</tr>";
        }
        $tbody .= "</tbody>";

        return "<!-- wp:table -->\n<figure class=\"wp-block-table\"><table>\n{$thead}\n{$tbody}\n</table></figure>\n<!-- /wp:table -->";
    }

    /**
     * Detect which major SEO plugin is currently active.
     *
     * @return string 'rank_math'|'yoast'|'aioseo'|'general'
     */
    public function detect_active_seo_plugin(): string {
        if (defined('RANK_MATH_VERSION') || class_exists('RankMath')) {
            return 'rank_math';
        }
        if (defined('WPSEO_VERSION') || class_exists('WPSEO_Options')) {
            return 'yoast';
        }
        if (defined('AIOSEO_VERSION')) {
            return 'aioseo';
        }
        return 'general';
    }

    /**
     * Handle manual article import from Chatbot JSON payload.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function handle_import_article(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $raw_input = (string) ($params['raw_json'] ?? '');
        $category_id = intval($params['category_id'] ?? 0);
        $status = sanitize_text_field($params['status'] ?? 'draft');
        $seo_target = sanitize_text_field($params['seo_target'] ?? 'auto'); // auto, rank_math, yoast, both

        if (empty(trim($raw_input))) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('متن یا ساختار JSON نمی‌تواند خالی باشد.', 'omni-ai-suite')
            ], 400);
        }

        // 1. Clean markdown code wrappers (```json ... ``` or ``` ... ```)
        $cleaned = trim($raw_input);
        $cleaned = preg_replace('/^```(?:json)?\s*(.*?)\s*```$/ms', '$1', $cleaned);

        // Extract substring between outermost '{' and '}' if surrounded by conversational text
        if (!str_starts_with($cleaned, '{')) {
            $first_brace = mb_strpos($cleaned, '{');
            $last_brace = mb_strrpos($cleaned, '}');
            if ($first_brace !== false && $last_brace !== false && $last_brace > $first_brace) {
                $cleaned = mb_substr($cleaned, $first_brace, ($last_brace - $first_brace) + 1);
            }
        }

        // 2. Decode JSON with Multi-Layer Auto-Healing
        $data = json_decode($cleaned, true);

        // Fallback 2a: Repair unescaped double quotes inside HTML attributes (e.g. style="...", class="...")
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            $repaired_html_quotes = preg_replace_callback('/<[^>]+>/s', function ($tag_match) {
                // Replace ="..." with ='...' inside HTML tags
                return preg_replace('/=(["])(.*?)\1/s', "='$2'", $tag_match[0]);
            }, $cleaned);

            $data = json_decode($repaired_html_quotes, true);

            // Fallback 2b: Normalize unescaped line breaks inside strings
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
                $repaired_newlines = preg_replace('/(?<!\\\\)\r\n|\r|\n/', '\n', $repaired_html_quotes);
                $data = json_decode($repaired_newlines, true);
            }
        }

        // Fallback 2c: Deep Regex extraction if JSON parser still fails on broken syntax
        if (!is_array($data) || empty($data['title'])) {
            $fallback_data = [];

            // Extract title
            if (preg_match('/"title"\s*:\s*"([^"\r\n]+)"/u', $cleaned, $m)) {
                $fallback_data['title'] = $m[1];
            }

            // Extract seo_title
            if (preg_match('/"seo_title"\s*:\s*"([^"\r\n]+)"/u', $cleaned, $m)) {
                $fallback_data['seo_title'] = $m[1];
            }

            // Extract seo_desc
            if (preg_match('/"seo_desc"\s*:\s*"([^"\r\n]+)"/u', $cleaned, $m)) {
                $fallback_data['seo_desc'] = $m[1];
            }

            // Extract content (between "content": and next key)
            if (preg_match('/"content"\s*:\s*"(.*?)"\s*,\s*"(?:seo_title|seo_desc|image_prompts|faq)"/su', $cleaned, $m)) {
                $fallback_data['content'] = stripcslashes($m[1]);
            }

            // Extract image_prompts
            if (preg_match('/"image_prompts"\s*:\s*\[([\s\S]*?)\]/u', $cleaned, $m)) {
                if (preg_match_all('/"([^"]+)"/u', $m[1], $img_matches)) {
                    $fallback_data['image_prompts'] = $img_matches[1];
                }
            }

            // Extract FAQ
            if (preg_match('/"faq"\s*:\s*\[([\s\S]*?)\]/u', $cleaned, $m)) {
                $faq_raw = '[' . $m[1] . ']';
                $decoded_faq = json_decode($faq_raw, true);
                if (is_array($decoded_faq)) {
                    $fallback_data['faq'] = $decoded_faq;
                } else {
                    preg_match_all('/\{\s*"question"\s*:\s*"([^"]+)"\s*,\s*"answer"\s*:\s*"([^"]+)"\s*\}/u', $m[1], $qa_matches, PREG_SET_ORDER);
                    $parsed_faq = [];
                    foreach ($qa_matches as $qa) {
                        $parsed_faq[] = ['question' => $qa[1], 'answer' => $qa[2]];
                    }
                    if (!empty($parsed_faq)) {
                        $fallback_data['faq'] = $parsed_faq;
                    }
                }
            }

            if (!empty($fallback_data['title']) && !empty($fallback_data['content'])) {
                $data = $fallback_data;
            }
        }

        if (!is_array($data) || empty($data['title'])) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => sprintf(
                    __('ساختار JSON نامعتبر است: %s. لطفاً خروجی چت‌بات را بدون تغییر در باکس پیست نمایید.', 'omni-ai-suite'),
                    json_last_error_msg()
                )
            ], 400);
        }

        // 3. Extract and normalize fields
        $title = sanitize_text_field(wp_strip_all_tags($data['title'] ?? $data['عنوان'] ?? $data['post_title'] ?? ''));
        $content = (string) ($data['content'] ?? $data['محتوا'] ?? $data['post_content'] ?? '');
        $seo_title = sanitize_text_field(wp_strip_all_tags($data['seo_title'] ?? $data['عنوان_سئو'] ?? $title));
        $seo_desc = sanitize_textarea_field(wp_strip_all_tags($data['seo_desc'] ?? $data['seo_description'] ?? $data['توضیحات_سئو'] ?? $data['meta_desc'] ?? ''));
        $raw_slug = (string) ($data['slug'] ?? $data['نامک'] ?? $data['اسلاگ'] ?? '');
        $image_prompts = $data['image_prompts'] ?? $data['پرامپت_تصاویر'] ?? $data['images'] ?? [];
        $faq = $data['faq'] ?? $data['faqs'] ?? $data['سوالات_متداول'] ?? [];

        if (empty($title)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('کلید title (عنوان مقاله) در فایل JSON یافت نشد یا خالی است.', 'omni-ai-suite')
            ], 400);
        }

        if (empty(trim($content))) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('کلید content (بدنه مقاله) در فایل JSON یافت نشد یا خالی است.', 'omni-ai-suite')
            ], 400);
        }

        // 4. Transform content: if markdown without HTML blocks, convert to rich Gutenberg blocks
        if (!preg_match('/<p\b|<div\b|<h[1-6]\b/i', $content) && preg_match('/(?:^#{1,6}\s|^\s*[-*]\s|\*{2})/m', $content)) {
            $content = self::parse_markdown_to_html($content);
        }

        // 4b. Auto-convert any Mermaid diagrams (whether in <code class="language-mermaid">, <pre>, or ```mermaid) to visual SVG images
        $content = self::convert_all_mermaid_in_content($content);

        // 5. Stylize [IMAGE_PLACEHOLDER] for Gutenberg & easy Ctrl+F replacement (100% valid Gutenberg format)
        $placeholder_block = "\n<!-- wp:paragraph -->\n" .
            "<p style=\"background-color:#f0f4f8;color:#2c3338;border:2px dashed #72aee6;border-radius:8px;padding:18px 20px;margin:28px 0;text-align:center;font-size:14px;line-height:1.8;\">" .
            "📷 <strong style=\"color:#135e96;font-size:15px;\">[IMAGE_PLACEHOLDER]</strong><br/>" .
            "<em>جایگاه قرارگیری تصویر &mdash; این بلوک را حذف نموده و تصویر ساخته‌شده را در اینجا درج نمایید.</em>" .
            "</p>\n<!-- /wp:paragraph -->\n";

        $content = str_replace('[IMAGE_PLACEHOLDER]', $placeholder_block, $content);

        // 6. Append FAQ Accordion + FAQPage JSON-LD Schema (Option A - Gutenberg Valid Format)
        if (is_array($faq) && !empty($faq)) {
            $faq_html = "\n\n<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">پرسش‌های متداول</h2>\n<!-- /wp:heading -->\n";
            $schema_entities = [];

            foreach ($faq as $item) {
                if (!is_array($item)) continue;
                $q = sanitize_text_field($item['question'] ?? $item['q'] ?? $item['پرسش'] ?? '');
                $a = wp_kses_post($item['answer'] ?? $item['a'] ?? $item['پاسخ'] ?? '');

                if (empty($q) || empty($a)) continue;

                // Native WordPress Gutenberg Core Details Block Format (Passes 100% of block validation)
                $faq_html .= "<!-- wp:details -->\n";
                $faq_html .= "<details class=\"wp-block-details\"><summary>" . esc_html($q) . "</summary><!-- wp:paragraph -->\n";
                $faq_html .= "<p>" . $a . "</p>\n";
                $faq_html .= "<!-- /wp:paragraph --></details>\n";
                $faq_html .= "<!-- /wp:details -->\n";

                $schema_entities[] = [
                    '@type'          => 'Question',
                    'name'           => $q,
                    'acceptedAnswer' => [
                        '@type' => 'Answer',
                        'text'  => wp_strip_all_tags($a)
                    ]
                ];
            }

            if (!empty($schema_entities)) {
                $schema_json = wp_json_encode([
                    '@context'   => 'https://schema.org',
                    '@type'      => 'FAQPage',
                    'mainEntity' => $schema_entities
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

                $faq_html .= "\n<!-- wp:html -->\n<script type=\"application/ld+json\">\n" . $schema_json . "\n</script>\n<!-- /wp:html -->\n";
            }

            $content .= $faq_html;
        }

        // 7. Resolve English Slug & Insert Post to WordPress Database
        $post_status = in_array($status, ['draft', 'publish', 'pending', 'future'], true) ? $status : 'draft';
        $english_slug = self::resolve_english_slug($raw_slug, $title, (array) $image_prompts);

        $post_args = [
            'post_title'   => $title,
            'post_name'    => $english_slug,
            'post_content' => $content,
            'post_excerpt' => $seo_desc,
            'post_status'  => $post_status,
            'post_type'    => 'post',
            'post_author'  => get_current_user_id() ?: 1,
        ];

        if ($category_id > 0) {
            $post_args['post_category'] = [$category_id];
        }

        $post_id = wp_insert_post($post_args, true);

        if (is_wp_error($post_id) || !$post_id) {
            $err_msg = is_wp_error($post_id) ? $post_id->get_error_message() : __('خطا در درج نوشته در وردپرس.', 'omni-ai-suite');
            return new \WP_REST_Response(['success' => false, 'message' => $err_msg], 500);
        }

        // 8. Save SEO Metadata (Rank Math, Yoast SEO, AIOSEO)
        $detected_seo = $this->detect_active_seo_plugin();

        // Always save both or target-specific SEO fields to guarantee compatibility
        $should_save_rank_math = ($seo_target === 'rank_math' || $seo_target === 'both' || ($seo_target === 'auto' && ($detected_seo === 'rank_math' || $detected_seo === 'general')));
        $should_save_yoast = ($seo_target === 'yoast' || $seo_target === 'both' || ($seo_target === 'auto' && ($detected_seo === 'yoast' || $detected_seo === 'general')));

        if ($should_save_rank_math && !empty($seo_title)) {
            update_post_meta($post_id, 'rank_math_title', $seo_title);
            update_post_meta($post_id, 'rank_math_description', $seo_desc);
            update_post_meta($post_id, 'rank_math_focus_keyword', $title);
        }

        if ($should_save_yoast && !empty($seo_title)) {
            update_post_meta($post_id, '_yoast_wpseo_title', $seo_title);
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $seo_desc);
            update_post_meta($post_id, '_yoast_wpseo_focuskw', $title);
        }

        // Universal Fallbacks
        update_post_meta($post_id, '_aioseo_title', $seo_title);
        update_post_meta($post_id, '_aioseo_description', $seo_desc);
        update_post_meta($post_id, '_ai_seo_title', $seo_title);
        update_post_meta($post_id, '_ai_seo_desc', $seo_desc);

        // 9. Save Special Meta (Image prompts, FAQ data, Mode tag)
        if (is_array($image_prompts) && !empty($image_prompts)) {
            update_post_meta($post_id, '_ai_image_prompts', array_values($image_prompts));
        }
        if (is_array($faq) && !empty($faq)) {
            update_post_meta($post_id, '_ai_faq_data', array_values($faq));
        }
        update_post_meta($post_id, '_omni_ai_generated', 1);
        update_post_meta($post_id, '_omni_article_import_mode', 'manual_json');

        // 10. Record in Log Repository for tracking
        Log_Repository::insert_log(
            get_current_user_id() ?: 1,
            $title,
            "درج دستی JSON مقاله - سئو: " . mb_substr($seo_title, 0, 80),
            'manual-json-import',
            'chatbot-import',
            is_array($image_prompts) ? count($image_prompts) : 0
        );

        $edit_url = get_edit_post_link($post_id, 'raw');
        $preview_url = get_preview_post_link($post_id);

        return new \WP_REST_Response([
            'success'        => true,
            'post_id'        => $post_id,
            'title'          => $title,
            'slug'           => $english_slug,
            'seo_title'      => $seo_title,
            'seo_desc'       => $seo_desc,
            'image_prompts'  => is_array($image_prompts) ? array_values($image_prompts) : [],
            'faq_count'      => is_array($faq) ? count($faq) : 0,
            'detected_seo'   => $detected_seo,
            'edit_url'       => $edit_url ?: admin_url('post.php?post=' . $post_id . '&action=edit'),
            'preview_url'    => $preview_url ?: home_url('/?p=' . $post_id . '&preview=true'),
            'message'        => __('مقاله با موفقیت به صورت پیش‌نویس با تنظیمات سئو، سوالات متداول و پرامپت‌های تصویر ذخیره شد.', 'omni-ai-suite'),
        ], 200);
    }

    /**
     * Render raw Mermaid diagram code to a high-quality SVG image block.
     *
     * @param string $inner_mermaid
     * @return string
     */
    public static function render_mermaid_code_to_image_block(string $inner_mermaid): string {
        $inner_mermaid = trim(html_entity_decode(strip_tags($inner_mermaid), ENT_QUOTES, 'UTF-8'));
        if (empty($inner_mermaid)) {
            return '';
        }

        $json_payload = wp_json_encode([
            'code' => $inner_mermaid,
            'mermaid' => [
                'theme' => 'base',
                'themeVariables' => [
                    'fontFamily'         => 'Vazirmatn, Tahoma, system-ui, sans-serif',
                    'fontSize'           => '14px',
                    'primaryColor'       => '#eef2ff',
                    'primaryTextColor'   => '#1e1b4b',
                    'primaryBorderColor' => '#6366f1',
                    'lineColor'          => '#4f46e5',
                    'secondaryColor'     => '#ecfdf5',
                    'tertiaryColor'      => '#f8fafc',
                    'background'         => '#ffffff',
                    'mainBkg'            => '#f8fafc',
                    'nodeBorder'         => '#6366f1',
                    'clusterBkg'         => '#f1f5f9',
                    'clusterBorder'      => '#cbd5e1',
                ],
            ],
        ], JSON_UNESCAPED_UNICODE);

        $base64 = rtrim(strtr(base64_encode($json_payload), '+/', '-_'), '=');
        $external_url = "https://mermaid.ink/svg/" . $base64;
        $local_url = $external_url;

        // Try to download and store SVG locally in WordPress uploads
        $response = wp_remote_get($external_url, ['timeout' => 12]);
        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
            $svg_content = wp_remote_retrieve_body($response);
            if (!empty($svg_content) && str_contains($svg_content, '<svg')) {
                $upload_dir = wp_upload_dir();
                $target_dir = $upload_dir['basedir'] . '/omni-ai-diagrams';
                if (wp_mkdir_p($target_dir)) {
                    $filename = 'diagram-' . md5($base64) . '.svg';
                    if (file_put_contents($target_dir . '/' . $filename, $svg_content)) {
                        $local_url = $upload_dir['baseurl'] . '/omni-ai-diagrams/' . $filename;
                    }
                }
            }
        }

        return "\n<!-- wp:image {\"align\":\"center\"} -->\n<figure class=\"wp-block-image aligncenter\"><img src=\"" . esc_url($local_url) . "\" alt=\"نمودار فرایند\"/></figure>\n<!-- /wp:image -->\n";
    }

    /**
     * Search and convert all Mermaid occurrences in content to visual SVG image blocks.
     *
     * @param string $content
     * @return string
     */
    public static function convert_all_mermaid_in_content(string $content): string {
        // 1. Match HTML tags: <code class="...mermaid...">...</code> or <pre class="...mermaid...">...
        $content = preg_replace_callback('/<(?:pre|code|div)[^>]*class=[\'"][^\'"]*mermaid[^\'"]*[\'"][^>]*>([\s\S]*?)<\/(?:pre|code|div)>/iu', function ($m) {
            return self::render_mermaid_code_to_image_block($m[1]);
        }, $content);

        // 2. Match Markdown code blocks: ```mermaid ... ```
        $content = preg_replace_callback('/```(?:mermaid)?[\r\n]+((?:flowchart|graph|sequenceDiagram|mindmap|classDiagram|timeline)[\s\S]*?)```/iu', function ($m) {
            return self::render_mermaid_code_to_image_block($m[1]);
        }, $content);

        // 3. Match generic code blocks containing mermaid flowchart/sequence/mindmap
        $content = preg_replace_callback('/<code[^>]*>[\s\r\n]*((?:flowchart|graph|sequenceDiagram|mindmap|classDiagram)\s+[\s\S]*?)<\/code>/iu', function ($m) {
            return self::render_mermaid_code_to_image_block($m[1]);
        }, $content);

        return $content;
    }

    /**
     * Resolve and ensure a 100% clean English slug for WordPress posts.
     *
     * @param string $raw_slug
     * @param string $title
     * @param array $image_prompts
     * @return string
     */
    public static function resolve_english_slug(string $raw_slug, string $title, array $image_prompts = []): string {
        // 1. If explicit slug provided in JSON, clean and verify English characters
        if (!empty($raw_slug)) {
            $slug = strtolower(trim($raw_slug));
            $slug = preg_replace('/[^a-z0-9\- ]/i', '', $slug);
            $slug = preg_replace('/[\s\-]+/', '-', $slug);
            $slug = trim($slug, '-');
            if (strlen($slug) >= 3) {
                return $slug;
            }
        }

        // 2. Try to extract English words from title (e.g. "راهنمای React و Next.js" -> "react-nextjs")
        if (preg_match_all('/[a-zA-Z0-9]{2,}/', $title, $m) && !empty($m[0])) {
            $slug = strtolower(implode('-', array_slice($m[0], 0, 5)));
            if (strlen($slug) >= 3) {
                return $slug;
            }
        }

        // 3. Extract meaningful English keywords from the first image prompt
        if (!empty($image_prompts) && is_array($image_prompts)) {
            $first_prompt = (string) ($image_prompts[0] ?? '');
            $clean_prompt = preg_replace('/\b(cinematic|illustration|render|isometric|highly|detailed|hyper|8k|4k|unreal|engine|realistic|photography|wallpaper|background|style)\b/i', '', $first_prompt);
            if (preg_match_all('/[a-zA-Z]{3,}/', $clean_prompt, $m) && !empty($m[0])) {
                $slug = strtolower(implode('-', array_slice($m[0], 0, 4)));
                if (strlen($slug) >= 3) {
                    return $slug;
                }
            }
        }

        // 4. Default fallback: Clean English timestamp
        return 'post-' . date('Ymd-His');
    }

    /**
     * Get security settings.
     */
    public function handle_get_security_settings(): \WP_REST_Response {
        $settings = \OmniAI\Modules\Security_Module::get_settings();
        $custom_login_url = !empty($settings['custom_login_slug']) 
            ? home_url('/' . $settings['custom_login_slug']) 
            : home_url('/wp-login.php');
        $recovery_url = home_url('/wp-login.php?omni_recovery=' . ($settings['hide_login_recovery_key'] ?? ''));

        return new \WP_REST_Response([
            'success'          => true,
            'settings'         => $settings,
            'client_ip'        => \OmniAI\Modules\Security_Module::get_client_ip(),
            'site_url'         => home_url('/'),
            'custom_login_url' => $custom_login_url,
            'recovery_url'     => $recovery_url,
        ], 200);
    }

    /**
     * Save security settings.
     */
    public function handle_save_security_settings(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $submitted = $params['settings'] ?? [];

        if (!is_array($submitted)) {
            return new \WP_REST_Response(['success' => false, 'message' => __('داده‌های نامعتبر.', 'omni-ai-suite')], 400);
        }

        $enable_hide = !empty($submitted['enable_hide_login']);
        $custom_slug = sanitize_title(trim($submitted['custom_login_slug'] ?? ''));

        if ($enable_hide && empty($custom_slug)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('برای فعال‌سازی تغییر آدرس ورود، تعیین نامک اختصاصی (اسلاگ) الزامی است.', 'omni-ai-suite'),
            ], 400);
        }

        $reserved = ['wp-admin', 'wp-login', 'wp-login.php', 'login', 'admin', 'dashboard', 'wp-json', 'xmlrpc', 'xmlrpc.php', 'feed', 'sitemap', 'sitemap.xml', 'sitemap_index.xml', 'robots.txt'];
        if ($enable_hide && in_array(strtolower($custom_slug), $reserved, true)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => sprintf(__('نامک "%s" جزء آدرس‌های رزرو شده وردپرس است. لطفاً نامک دیگری انتخاب نمایید.', 'omni-ai-suite'), $custom_slug),
            ], 400);
        }

        $redirect_slug = sanitize_text_field(trim($submitted['hide_login_redirect_slug'] ?? '404'));
        $recovery_key = !empty($submitted['hide_login_recovery_key']) 
            ? sanitize_text_field($submitted['hide_login_recovery_key']) 
            : wp_generate_password(16, false);

        $sanitized = [
            'disable_xmlrpc'           => !empty($submitted['disable_xmlrpc']),
            'block_user_enumeration'   => !empty($submitted['block_user_enumeration']),
            'hide_wp_version'          => !empty($submitted['hide_wp_version']),
            'disable_file_edit'        => !empty($submitted['disable_file_edit']),
            'security_headers'         => !empty($submitted['security_headers']),
            'require_rest_auth'        => !empty($submitted['require_rest_auth']),
            'global_ip_whitelist'      => sanitize_textarea_field($submitted['global_ip_whitelist'] ?? ''),
            'enable_hide_login'        => $enable_hide,
            'custom_login_slug'        => $custom_slug,
            'hide_login_redirect_slug' => $redirect_slug,
            'hide_login_recovery_key'  => $recovery_key,
            'routes_config'            => [],
        ];

        if (isset($submitted['routes_config']) && is_array($submitted['routes_config'])) {
            foreach ($submitted['routes_config'] as $route => $cfg) {
                if (!is_array($cfg)) continue;
                $clean_route = sanitize_text_field($route);
                $sanitized['routes_config'][$clean_route] = [
                    'disabled'     => !empty($cfg['disabled']),
                    'require_auth' => !empty($cfg['require_auth']),
                    'ip_whitelist' => sanitize_textarea_field($cfg['ip_whitelist'] ?? ''),
                ];
            }
        }

        \OmniAI\Modules\Security_Module::save_settings($sanitized);

        return new \WP_REST_Response([
            'success'  => true,
            'message'  => __('تنظیمات امنیت و REST API با موفقیت ذخیره شد.', 'omni-ai-suite'),
            'settings' => $sanitized,
        ], 200);
    }

    /**
     * Get all active WordPress REST API routes including the root index.
     */
    public function handle_get_security_routes(): \WP_REST_Response {
        $wp_rest_server = rest_get_server();
        $raw_routes = $wp_rest_server->get_routes();
        $formatted = [];

        $settings = \OmniAI\Modules\Security_Module::get_settings();
        $routes_config = $settings['routes_config'] ?? [];
        $url_prefix = function_exists('rest_get_url_prefix') ? rest_get_url_prefix() : 'wp-json';

        foreach ($raw_routes as $route => $endpoints) {
            $methods = [];

            if ($route === '/' || empty($route)) {
                $route_key = '/';
                $namespace = 'core-root';
                $display_route = '/' . $url_prefix;
            } else {
                $route_key = $route;
                $display_route = $route;
                $parts = explode('/', trim($route, '/'));
                $namespace = count($parts) >= 2 ? ($parts[0] . '/' . $parts[1]) : $parts[0];
            }

            foreach ($endpoints as $ep) {
                if (isset($ep['methods'])) {
                    if (is_array($ep['methods'])) {
                        foreach (array_keys($ep['methods']) as $m) {
                            if (!in_array($m, $methods, true)) $methods[] = $m;
                        }
                    } else {
                        $m_str = (string) $ep['methods'];
                        if (!in_array($m_str, $methods, true)) $methods[] = $m_str;
                    }
                }
            }

            $cfg = $routes_config[$route_key] ?? [];

            $formatted[] = [
                'route'         => $route_key,
                'display_route' => $display_route,
                'is_root'       => ($route_key === '/'),
                'namespace'     => $namespace,
                'methods'       => $methods,
                'disabled'      => !empty($cfg['disabled']),
                'require_auth'  => !empty($cfg['require_auth']),
                'ip_whitelist'  => $cfg['ip_whitelist'] ?? '',
            ];
        }

        return new \WP_REST_Response([
            'success'    => true,
            'url_prefix' => $url_prefix,
            'routes'     => $formatted,
            'client_ip'  => \OmniAI\Modules\Security_Module::get_client_ip(),
        ], 200);
    }

    public function handle_get_post_seo(\WP_REST_Request $request): \WP_REST_Response {
        $post_id = (int) $request->get_param('id');
        $post = get_post($post_id);
        if (!$post) {
            return new \WP_REST_Response(['success' => false, 'message' => 'Post not found'], 404);
        }

        $focus_kw = (string) get_post_meta($post_id, '_omni_ai_focus_keyword', true);
        if (empty($focus_kw)) $focus_kw = (string) get_post_meta($post_id, 'rank_math_focus_keyword', true);
        if (empty($focus_kw)) $focus_kw = (string) get_post_meta($post_id, '_yoast_wpseo_focuskw', true);

        $seo_title = (string) get_post_meta($post_id, '_omni_ai_seo_title', true);
        if (empty($seo_title)) $seo_title = (string) get_post_meta($post_id, 'rank_math_title', true);
        if (empty($seo_title)) $seo_title = (string) get_post_meta($post_id, '_yoast_wpseo_title', true);
        if (empty($seo_title)) $seo_title = $post->post_title;

        $meta_desc = (string) get_post_meta($post_id, '_omni_ai_meta_description', true);
        if (empty($meta_desc)) $meta_desc = (string) get_post_meta($post_id, 'rank_math_description', true);
        if (empty($meta_desc)) $meta_desc = (string) get_post_meta($post_id, '_yoast_wpseo_metadesc', true);

        $canonical = (string) get_post_meta($post_id, '_omni_ai_canonical_url', true);
        if (empty($canonical)) $canonical = (string) get_post_meta($post_id, 'rank_math_canonical_url', true);
        if (empty($canonical)) $canonical = get_permalink($post_id);

        $noindex   = get_post_meta($post_id, '_omni_ai_noindex', true) === '1';
        $nofollow  = get_post_meta($post_id, '_omni_ai_nofollow', true) === '1';

        $og_title = (string) get_post_meta($post_id, '_omni_ai_og_title', true) ?: (string) get_post_meta($post_id, 'rank_math_facebook_title', true) ?: $seo_title;
        $og_desc  = (string) get_post_meta($post_id, '_omni_ai_og_description', true) ?: (string) get_post_meta($post_id, 'rank_math_facebook_description', true) ?: $meta_desc;
        $og_image = (string) get_post_meta($post_id, '_omni_ai_og_image', true) ?: (string) get_post_meta($post_id, 'rank_math_facebook_image', true);
        if (empty($og_image) && has_post_thumbnail($post_id)) {
            $og_image = (string) get_the_post_thumbnail_url($post_id, 'large');
        }

        $twitter_title = (string) get_post_meta($post_id, '_omni_ai_twitter_title', true) ?: (string) get_post_meta($post_id, 'rank_math_twitter_title', true) ?: $og_title;
        $twitter_desc  = (string) get_post_meta($post_id, '_omni_ai_twitter_description', true) ?: (string) get_post_meta($post_id, 'rank_math_twitter_description', true) ?: $og_desc;
        $twitter_image = (string) get_post_meta($post_id, '_omni_ai_twitter_image', true) ?: (string) get_post_meta($post_id, 'rank_math_twitter_image', true) ?: $og_image;

        $schema_type   = (string) get_post_meta($post_id, '_omni_ai_schema_type', true) ?: 'article';
        $review_item   = (string) get_post_meta($post_id, '_omni_ai_review_item', true) ?: $post->post_title;
        $review_rating = (float) (get_post_meta($post_id, '_omni_ai_review_rating', true) ?: 5.0);
        $howto_data    = get_post_meta($post_id, '_omni_ai_howto_data', true);

        $ranking = [];
        if (class_exists('\\OmniAI\\Modules\\Ranking_Module')) {
            $ranking_mod = new \OmniAI\Modules\Ranking_Module();
            $ranking = $ranking_mod->get_post_ranking($post_id);
        }

        return new \WP_REST_Response([
            'success' => true,
            'data'    => [
                'id'                  => $post_id,
                'title'               => $post->post_title,
                'slug'                => $post->post_name,
                'focus_keyword'       => $focus_kw,
                'seo_title'           => $seo_title,
                'meta_description'    => $meta_desc,
                'canonical_url'       => $canonical,
                'is_noindex'          => $noindex,
                'is_nofollow'         => $nofollow,
                'og_title'            => $og_title,
                'og_description'      => $og_desc,
                'og_image'            => $og_image,
                'twitter_title'       => $twitter_title,
                'twitter_description' => $twitter_desc,
                'twitter_image'       => $twitter_image,
                'schema_type'         => $schema_type,
                'review_item'         => $review_item,
                'review_rating'       => $review_rating,
                'howto_data'          => $howto_data,
                'ranking'             => $ranking,
            ],
        ], 200);
    }

    public function handle_update_post_seo(\WP_REST_Request $request): \WP_REST_Response {
        $post_id = (int) $request->get_param('id');
        $post = get_post($post_id);
        if (!$post) {
            return new \WP_REST_Response(['success' => false, 'message' => 'Post not found'], 404);
        }

        $params = $request->get_json_params() ?: $request->get_params();

        if (isset($params['focus_keyword'])) {
            $kw = sanitize_text_field($params['focus_keyword']);
            update_post_meta($post_id, '_omni_ai_focus_keyword', $kw);
            update_post_meta($post_id, 'rank_math_focus_keyword', $kw);
            update_post_meta($post_id, '_yoast_wpseo_focuskw', $kw);
        }

        if (isset($params['seo_title'])) {
            $st = sanitize_text_field($params['seo_title']);
            update_post_meta($post_id, '_omni_ai_seo_title', $st);
            update_post_meta($post_id, 'rank_math_title', $st);
            update_post_meta($post_id, '_yoast_wpseo_title', $st);
        }

        if (isset($params['meta_description'])) {
            $md = sanitize_textarea_field($params['meta_description']);
            update_post_meta($post_id, '_omni_ai_meta_description', $md);
            update_post_meta($post_id, 'rank_math_description', $md);
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $md);
        }

        if (isset($params['canonical_url'])) {
            $cu = esc_url_raw($params['canonical_url']);
            update_post_meta($post_id, '_omni_ai_canonical_url', $cu);
            update_post_meta($post_id, 'rank_math_canonical_url', $cu);
            update_post_meta($post_id, '_yoast_wpseo_canonical', $cu);
        }

        if (isset($params['is_noindex']) || isset($params['noindex'])) {
            $val = (!empty($params['is_noindex']) || !empty($params['noindex'])) ? '1' : '0';
            update_post_meta($post_id, '_omni_ai_noindex', $val);
        }

        if (isset($params['is_nofollow']) || isset($params['nofollow'])) {
            $val = (!empty($params['is_nofollow']) || !empty($params['nofollow'])) ? '1' : '0';
            update_post_meta($post_id, '_omni_ai_nofollow', $val);
        }

        // Social / OpenGraph / Twitter metadata
        if (isset($params['og_title'])) {
            $val = sanitize_text_field($params['og_title']);
            update_post_meta($post_id, '_omni_ai_og_title', $val);
            update_post_meta($post_id, 'rank_math_facebook_title', $val);
            update_post_meta($post_id, '_yoast_wpseo_opengraph-title', $val);
        }
        if (isset($params['og_description'])) {
            $val = sanitize_textarea_field($params['og_description']);
            update_post_meta($post_id, '_omni_ai_og_description', $val);
            update_post_meta($post_id, 'rank_math_facebook_description', $val);
            update_post_meta($post_id, '_yoast_wpseo_opengraph-description', $val);
        }
        if (isset($params['og_image'])) {
            $val = esc_url_raw($params['og_image']);
            update_post_meta($post_id, '_omni_ai_og_image', $val);
            update_post_meta($post_id, 'rank_math_facebook_image', $val);
            update_post_meta($post_id, '_yoast_wpseo_opengraph-image', $val);
        }
        if (isset($params['twitter_title'])) {
            $val = sanitize_text_field($params['twitter_title']);
            update_post_meta($post_id, '_omni_ai_twitter_title', $val);
            update_post_meta($post_id, 'rank_math_twitter_title', $val);
            update_post_meta($post_id, '_yoast_wpseo_twitter-title', $val);
        }
        if (isset($params['twitter_description'])) {
            $val = sanitize_textarea_field($params['twitter_description']);
            update_post_meta($post_id, '_omni_ai_twitter_description', $val);
            update_post_meta($post_id, 'rank_math_twitter_description', $val);
            update_post_meta($post_id, '_yoast_wpseo_twitter-description', $val);
        }
        if (isset($params['twitter_image'])) {
            $val = esc_url_raw($params['twitter_image']);
            update_post_meta($post_id, '_omni_ai_twitter_image', $val);
            update_post_meta($post_id, 'rank_math_twitter_image', $val);
            update_post_meta($post_id, '_yoast_wpseo_twitter-image', $val);
        }

        // Schema & Structured Data
        if (isset($params['schema_type'])) {
            $st = sanitize_text_field($params['schema_type']);
            update_post_meta($post_id, '_omni_ai_schema_type', in_array($st, ['article', 'howto', 'review', 'faq', 'none'], true) ? $st : 'article');
        }
        if (isset($params['review_item'])) {
            update_post_meta($post_id, '_omni_ai_review_item', sanitize_text_field($params['review_item']));
        }
        if (isset($params['review_rating'])) {
            update_post_meta($post_id, '_omni_ai_review_rating', max(1.0, min(5.0, (float) $params['review_rating'])));
        }
        if (isset($params['howto_data'])) {
            update_post_meta($post_id, '_omni_ai_howto_data', is_array($params['howto_data']) ? $params['howto_data'] : []);
        }

        $ranking = [];
        if (class_exists('\\OmniAI\\Modules\\Ranking_Module')) {
            $ranking_mod = new \OmniAI\Modules\Ranking_Module();
            $ranking = $ranking_mod->analyze_and_save_post($post_id);
        }

        return new \WP_REST_Response([
            'success' => true,
            'message' => 'SEO metadata updated successfully.',
            'data'    => [
                'id'      => $post_id,
                'ranking' => $ranking,
            ],
        ], 200);
    }

    public function handle_generate_seo_snippet(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $post_id = (int) ($params['post_id'] ?? 0);
        $focus_kw = sanitize_text_field($params['focus_keyword'] ?? '');
        $title = sanitize_text_field($params['title'] ?? '');
        $content = wp_strip_all_tags($params['content'] ?? '');

        if ($post_id > 0) {
            $post = get_post($post_id);
            if ($post) {
                if (empty($title)) $title = $post->post_title;
                if (empty($content)) $content = wp_strip_all_tags($post->post_content);
                if (empty($focus_kw)) {
                    $focus_kw = (string) get_post_meta($post_id, '_omni_ai_focus_keyword', true);
                    if (empty($focus_kw)) $focus_kw = (string) get_post_meta($post_id, 'rank_math_focus_keyword', true);
                }
            }
        }

        $excerpt = mb_substr($content, 0, 1500, 'UTF-8');

        $prompt = "با توجه به عنوان و محتوای زیر، یک عنوان سئو جذاب (بین ۴۰ تا ۶۰ کاراکتر) و یک توضیحات متای استاندارد و ترغیب‌کننده برای جذب کلیک در سرچ گوگل (بین ۱۲۰ تا ۱۵۵ کاراکتر) تولید کن.\n"
            . (!empty($focus_kw) ? "کلمه کلیدی کانونی: {$focus_kw}\n(بسیار مهم: حتماً کلمه کلیدی را در ابتدای عنوان و در توضیحات متا به کار ببر)\n" : "")
            . "عنوان فعلی: {$title}\n"
            . "خلاصه محتوا: {$excerpt}\n\n"
            . "پاسخ را دقیقاً و فقط به فرمت JSON بدون هیچ توضیح اضافی یا کدبلاک ارسال کن:\n"
            . "{\"seo_title\": \"عنوان سئو\", \"meta_description\": \"توضیحات متای بهینه\", \"focus_keyword\": \"{$focus_kw}\"}";

        $provider_id = sanitize_text_field($params['provider'] ?? '');
        $provider = !empty($provider_id) ? Provider_Factory::get_provider($provider_id) : Provider_Factory::get_default();
        if (!$provider) {
            return new \WP_REST_Response(['success' => false, 'message' => 'No active AI provider configured.'], 400);
        }

        try {
            $response = $provider->generate($prompt, ['max_tokens' => 500, 'temperature' => 0.4]);
            $text = trim($response['text'] ?? '');
            $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
            $text = preg_replace('/\s*```$/i', '', $text);
            $json = json_decode($text, true);

            if (!is_array($json) || empty($json['seo_title'])) {
                return new \WP_REST_Response(['success' => false, 'message' => 'Invalid AI response.', 'raw' => $text], 500);
            }

            return new \WP_REST_Response([
                'success' => true,
                'data'    => [
                    'seo_title'        => sanitize_text_field($json['seo_title']),
                    'meta_description' => sanitize_textarea_field($json['meta_description'] ?? ''),
                    'focus_keyword'    => sanitize_text_field($json['focus_keyword'] ?? $focus_kw),
                ],
            ], 200);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'message' => 'AI generation error: ' . $e->getMessage()], 500);
        }
    }
}
