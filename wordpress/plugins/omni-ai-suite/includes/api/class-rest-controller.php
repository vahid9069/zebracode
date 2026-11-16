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

    /**
     * Conditional debug logger. Only logs if OMNI_AI_DEBUG is true.
     *
     * @param string $message
     */
    public static function debug_log(string $message): void {
        if (defined('OMNI_AI_DEBUG') && OMNI_AI_DEBUG === true) {
            error_log($message);
        }
    }


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

        // Register Headless Blog & SEO public and management routes
        (new Headless_Controller())->register_routes();

        // Import manual AI article from JSON endpoint
        register_rest_route(self::NAMESPACE, '/import-article', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_import_article'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        // Content Calendar & Topic Planner endpoints
        register_rest_route(self::NAMESPACE, '/calendar', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_calendar'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_save_calendar'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
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

        // Developer Tools Manager & Sitemap Synchronizer endpoints
        register_rest_route(self::NAMESPACE, '/tools', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_tools'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_manage_tools'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/tools/sync', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_sync_tools'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        // Smart Ad & Sponsorship Manager endpoints
        register_rest_route(self::NAMESPACE, '/ads', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_ads'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_manage_ads'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
        ]);

        // CI/CD Blog Deployment & GitHub Actions monitor
        register_rest_route(self::NAMESPACE, '/deploy', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_deploy_status'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_trigger_deploy'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
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

        self::debug_log('OMNI DEBUG - handle_save_log hit. User: ' . get_current_user_id() . ' | Provider: ' . $provider . ' | Model: ' . $model . ' | Prompt: ' . substr($prompt, 0, 50));

        if (empty($prompt) || empty($response)) {
            self::debug_log('OMNI DEBUG - handle_save_log: Missing prompt or response content.');
            return new \WP_REST_Response(['message' => 'Missing prompt or response content'], 400);
        }

        // Prevent duplicate log if already saved by stream handler within the last 60 seconds
        global $wpdb;
        $table_name = $wpdb->prefix . OMNI_AI_LOGS_TABLE;
        $since = date('Y-m-d H:i:s', current_time('timestamp') - 60);
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

        $log_id = Log_Repository::insert_log(
            get_current_user_id(),
            $prompt,
            $response,
            $model,
            $provider,
            $tokens
        );

        self::debug_log('OMNI DEBUG - handle_save_log: Insert result Log ID: ' . var_export($log_id, true));

        return new \WP_REST_Response([
            'success' => (bool) $log_id,
            'log_id'  => $log_id,
        ], 200);
    }

    public function handle_create_draft(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        self::debug_log('OMNI DEBUG - Step 1: Endpoint hit. Params received: ' . wp_json_encode(array_keys($params)));

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

        self::debug_log('OMNI DEBUG - Step 2: Content length: ' . strlen($content) . ', User ID: ' . get_current_user_id() . ', Post Type: ' . $post_type . ', Status: ' . $status);

        if (empty(trim($content))) {
            self::debug_log('OMNI DEBUG - Execution halted: Content is empty.');
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

        self::debug_log('OMNI DEBUG - Step 3: Title resolved: "' . $title . '", Slug: "' . $slug . '", Excerpt length: ' . strlen($excerpt));

        // Lightweight Markdown-to-HTML Parser (Preserving Mermaid code blocks)
        self::debug_log('OMNI DEBUG - Step 4: Starting parse_markdown_to_html...');
        $parsed_html = Markdown_Parser::parse($content);
        self::debug_log('OMNI DEBUG - Step 4b: Markdown parsed. HTML length: ' . strlen($parsed_html));

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

        self::debug_log('OMNI DEBUG - Step 5: Calling wp_insert_post...');
        $post_id = wp_insert_post($post_args);

        if (is_wp_error($post_id) || !$post_id) {
            $err_msg = is_wp_error($post_id) ? $post_id->get_error_message() : __('Failed to insert post.', 'omni-ai-suite');
            self::debug_log('OMNI DEBUG - Execution halted: wp_insert_post failed: ' . $err_msg);
            return new \WP_REST_Response(['success' => false, 'message' => $err_msg], 500);
        }

        self::debug_log('OMNI DEBUG - Step 5b: wp_insert_post success. Post ID: ' . $post_id);

        // Tag post with AI meta for tracking & failover recovery
        update_post_meta($post_id, '_omni_ai_generated', 1);

        // Save into generation logs (avoid duplicate if already logged during streaming)
        $prompt_log = sanitize_textarea_field($params['prompt'] ?? $title);
        $model_log = sanitize_text_field($params['model'] ?? '');
        $provider_log = sanitize_text_field($params['provider'] ?? '');
        $tokens_log = intval($params['tokens'] ?? 0);

        global $wpdb;
        $table_name = $wpdb->prefix . OMNI_AI_LOGS_TABLE;
        $since_draft = date('Y-m-d H:i:s', current_time('timestamp') - 180);
        $recent_exists = (bool) $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM `{$table_name}` WHERE user_id = %d AND prompt = %s AND created_at >= %s LIMIT 1",
            get_current_user_id(),
            $prompt_log,
            $since_draft
        ));

        if (!$recent_exists) {
            self::debug_log('OMNI DEBUG - Step 6: Calling Log_Repository::insert_log with User ID: ' . get_current_user_id() . ', Model: "' . $model_log . '", Provider: "' . $provider_log . '"');
            $log_id = Log_Repository::insert_log(
                get_current_user_id(),
                $prompt_log,
                $content,
                $model_log,
                $provider_log,
                $tokens_log
            );
            self::debug_log('OMNI DEBUG - Step 6b: Log_Repository::insert_log returned Log ID: ' . var_export($log_id, true));
        } else {
            self::debug_log('OMNI DEBUG - Step 6: Log already recorded during streaming, skipping duplicate insert.');
        }

        // Increase timeout for heavy image sideloading
        @set_time_limit(120);
        self::debug_log('OMNI DEBUG - Step 7: Loading WordPress media files for sideloading...');
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $image_style = sanitize_text_field($params['image_style'] ?? 'cinematic');
        $style_suffix = " detailed, high quality, " . $image_style . " style";
        $image_attached = false;
        $image_notice = '';

        // 1. Process In-Content Images: [IMAGE: prompt] -> Convert to styled Gutenberg callout
        $updated_content = $parsed_html;
        $extracted_image_prompts = [];
        self::debug_log('OMNI DEBUG - Step 8: Checking for in-content image tags using regex in parsed content (length: ' . strlen($updated_content) . ')...');
        if (preg_match_all('/\[IMAGE:\s*(.+?)\]/isu', $updated_content, $matches, PREG_SET_ORDER)) {
            self::debug_log('OMNI DEBUG - Step 8: Found ' . count($matches) . ' in-content image tag(s).');
            foreach ($matches as $idx => $match) {
                $raw_tag = $match[0];
                $img_prompt = trim($match[1]);
                $extracted_image_prompts[] = $img_prompt;

                $placeholder_block = "\n<!-- wp:group {\"style\":{\"border\":{\"width\":\"1px\",\"style\":\"dashed\",\"color\":\"#38bdf8\"},\"spacing\":{\"padding\":{\"top\":\"1.25rem\",\"bottom\":\"1.25rem\",\"left\":\"1.25rem\",\"right\":\"1.25rem\"}}},\"backgroundColor\":\"dark-slate\",\"textColor\":\"slate-100\",\"layout\":{\"type\":\"constrained\"}} -->\n" .
                    "<div class=\"wp-block-group has-slate-100-color has-dark-slate-background-color has-text-color has-background\" style=\"border-color:#38bdf8;border-style:dashed;border-width:1px;border-radius:10px;padding:1.25rem;margin:24px 0;background-color:#0f172a;color:#e2e8f0;\">\n" .
                    "<!-- wp:paragraph {\"style\":{\"typography\":{\"fontWeight\":\"700\"}}} -->\n" .
                    "<p style=\"font-weight:700;color:#38bdf8;margin:0 0 8px 0;font-size:15px;\">🖼️ جایگاه تصویر محتوا #" . ($idx + 1) . " (Image Placeholder)</p>\n" .
                    "<!-- /wp:paragraph -->\n" .
                    "<!-- wp:paragraph {\"fontSize\":\"small\"} -->\n" .
                    "<p class=\"has-small-font-size\" style=\"color:#94a3b8;margin:0 0 10px 0;font-size:12px;line-height:1.6;\">پرامپت پیشنهادی برای ساخت تصویر در هوش مصنوعی:</p>\n" .
                    "<!-- /wp:paragraph -->\n" .
                    "<!-- wp:code -->\n" .
                    "<pre class=\"wp-block-code\" style=\"font-size:12px;background:#1e293b;color:#f1f5f9;border:1px solid #334155;border-radius:6px;padding:10px;direction:ltr;text-align:left;line-height:1.5;\"><code>" . esc_html($img_prompt) . "</code></pre>\n" .
                    "<!-- /wp:code -->\n" .
                    "</div>\n<!-- /wp:group -->\n";

                $para_pattern = '/<!-- wp:paragraph -->\s*<p>\s*' . preg_quote($raw_tag, '/') . '\s*<\/p>\s*<!-- \/wp:paragraph -->/isu';
                if (preg_match($para_pattern, $updated_content)) {
                    $updated_content = preg_replace($para_pattern, $placeholder_block, $updated_content, 1);
                } else {
                    $updated_content = str_replace($raw_tag, $placeholder_block, $updated_content);
                }
            }
        }

        // 2. Process Featured Image Prompt (Prompt-First Visual Workflow - No External API Calls)
        $featured_image_prompt = '';
        if ($generate_image) {
            $custom_img_prompt = sanitize_text_field($params['image_prompt_custom'] ?? '');
            $featured_image_prompt = Media_Sideloader::build_visual_image_prompt($title, $image_style, $custom_img_prompt);
            update_post_meta($post_id, '_omni_ai_featured_image_prompt', $featured_image_prompt);
            $image_notice = ' ' . __('(پرامپت تصویر شاخص با موفقیت تولید و ذخیره شد)', 'omni-ai-suite');
        }

        // 3. Update the post with the new content containing local placeholders
        self::debug_log('OMNI DEBUG - Step 10: Updating post #' . $post_id . ' with new content (length: ' . strlen($updated_content) . ')...');
        $update_result = wp_update_post([
            'ID'           => $post_id,
            'post_content' => $updated_content,
        ], true);

        if (is_wp_error($update_result)) {
            self::debug_log('OMNI DEBUG - Step 10: wp_update_post FAILED: ' . $update_result->get_error_message());
        } else {
            self::debug_log('OMNI DEBUG - Step 10: wp_update_post SUCCESS.');
        }

        $edit_url = get_edit_post_link($post_id, 'raw');

        $status_labels = [
            'draft'   => __('Draft', 'omni-ai-suite'),
            'publish' => __('Published', 'omni-ai-suite'),
            'future'  => __('Scheduled', 'omni-ai-suite'),
            'pending' => __('Pending Review', 'omni-ai-suite'),
        ];
        $status_label = $status_labels[$post_args['post_status']] ?? $post_args['post_status'];

        self::debug_log('OMNI DEBUG - Step 11: Dispatching final JSON response for Post #' . $post_id);

        return new \WP_REST_Response([
            'success'               => true,
            'post_id'               => $post_id,
            'title'                 => $title,
            'status'                => $post_args['post_status'],
            'image_attached'        => false,
            'featured_image_prompt' => $featured_image_prompt,
            'image_prompts'         => $extracted_image_prompts,
            'edit_url'              => $edit_url ?: admin_url('post.php?action=edit&post=' . $post_id),
            'message'               => sprintf(__('Post #%d created as [%s] with title "%s"!%s', 'omni-ai-suite'), $post_id, $status_label, $title, $image_notice),
        ], 200);
    }

    public function attach_featured_image(int $post_id, string $title, string $provider = 'gemini', string $style = 'isometric_3d', string $custom_prompt = ''): array {
        return Media_Sideloader::attach_featured_image($post_id, $title, $provider, $style, $custom_prompt);
    }

    public function attach_image_by_provider(int $post_id, string $title, string $prompt, string $provider = 'gemini', bool $is_featured = false): array {
        return Media_Sideloader::attach_image_by_provider($post_id, $title, $prompt, $provider, $is_featured);
    }

    public function sideload_local_image_file(string $tmp_file, int $post_id, string $title, string $prompt, bool $is_featured = false): array {
        return Media_Sideloader::sideload_local_image_file($tmp_file, $post_id, $title, $prompt, $is_featured);
    }

    public function build_visual_image_prompt(string $title, string $style = 'isometric_3d', string $custom_prompt = ''): string {
        return Media_Sideloader::build_visual_image_prompt($title, $style, $custom_prompt);
    }

    public function build_english_slug(string $title, int $post_id): string {
        return Media_Sideloader::build_english_slug($title, $post_id);
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

                    preg_match('/-\d{3}$/', $m_slug)
                );
                if ($is_unwanted) {
                    unset($cached['gemini']['models'][$m_slug]);
                    $has_unwanted = true;
                    $needs_update = true;
                }
            }
            if ($has_unwanted || count($cached['gemini']['models']) > 40 || !isset($cached['gemini']['models']['gemini-3.8-flash'])) {
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
        return (new Headless_Controller())->handle_get_categories();
    }

    public function handle_get_posts(\WP_REST_Request $request): \WP_REST_Response {
        return (new Headless_Controller())->handle_get_posts($request);
    }

    public function handle_get_single_post(\WP_REST_Request $request): \WP_REST_Response {
        return (new Headless_Controller())->handle_get_single_post($request);
    }

    public function format_post_for_blog(\WP_Post $post): array {
        return (new Headless_Controller())->format_post_for_blog($post);
    }

    public static function parse_markdown_to_html(string $text): string {
        return Markdown_Parser::parse($text);
    }

    public static function markdown_to_gutenberg(string $text): string {
        return Markdown_Parser::markdown_to_gutenberg($text);
    }

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

            // Extract featured_image_prompt
            if (preg_match('/"featured_image_prompt"\s*:\s*"([^"\r\n]+)"/u', $cleaned, $m)) {
                $fallback_data['featured_image_prompt'] = $m[1];
            }

            // Extract diagram_prompt
            if (preg_match('/"diagram_prompt"\s*:\s*"([^"\r\n]+)"/u', $cleaned, $m)) {
                $fallback_data['diagram_prompt'] = $m[1];
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
        
        $featured_image_prompt = sanitize_textarea_field($data['featured_image_prompt'] ?? $data['تصویر_شاخص'] ?? $data['featured_image'] ?? $data['prompt_featured_image'] ?? '');
        $diagram_prompt = sanitize_textarea_field($data['diagram_prompt'] ?? $data['دیاگرام'] ?? $data['diagram'] ?? $data['infographic_prompt'] ?? '');

        $raw_image_prompts = $data['image_prompts'] ?? $data['پرامپت_تصاویر'] ?? $data['images'] ?? [];
        $image_prompts = [];
        if (is_array($raw_image_prompts)) {
            foreach ($raw_image_prompts as $p) {
                if (is_string($p) && trim($p) !== '') {
                    $image_prompts[] = trim($p);
                } elseif (is_array($p) && !empty($p['prompt'])) {
                    $image_prompts[] = trim($p['prompt']);
                }
            }
        }
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
            $content = Markdown_Parser::parse($content);
        }

        // 4b. Auto-convert any Mermaid diagrams or [DIAGRAM_PLACEHOLDER] to Gutenberg diagram callouts (No external HTTP calls)
        if (!empty($diagram_prompt)) {
            $diagram_block = Markdown_Parser::render_diagram_placeholder_block($diagram_prompt);
            $content = str_replace('[DIAGRAM_PLACEHOLDER]', $diagram_block, $content);
        }
        $content = Markdown_Parser::convert_all_mermaid_in_content($content);

        // 5. Stylize [IMAGE_PLACEHOLDER_x] and [IMAGE_PLACEHOLDER] with corresponding prompts
        $img_idx = 0;
        $content = preg_replace_callback('/\[IMAGE_PLACEHOLDER(?:_(\d+))?\]/i', function ($m) use (&$img_idx, $image_prompts) {
            $num = !empty($m[1]) ? (int) $m[1] : ($img_idx + 1);
            $img_idx++;
            $prompt = $image_prompts[$num - 1] ?? ($image_prompts[$img_idx - 1] ?? '');
            $prompt_html = !empty($prompt)
                ? "<pre class=\"wp-block-code\" style=\"font-size:12px;background:#1e293b;color:#f1f5f9;border:1px solid #334155;border-radius:6px;padding:10px;direction:ltr;text-align:left;line-height:1.5;\"><code>" . esc_html($prompt) . "</code></pre>"
                : "<em>جایگاه قرارگیری تصویر &mdash; این بلوک را حذف نموده و تصویر ساخته‌شده را در اینجا درج نمایید.</em>";

            return "\n<!-- wp:group {\"style\":{\"border\":{\"width\":\"1px\",\"style\":\"dashed\",\"color\":\"#38bdf8\"},\"spacing\":{\"padding\":{\"top\":\"1.25rem\",\"bottom\":\"1.25rem\",\"left\":\"1.25rem\",\"right\":\"1.25rem\"}}},\"backgroundColor\":\"dark-slate\",\"textColor\":\"slate-100\",\"layout\":{\"type\":\"constrained\"}} -->\n" .
                "<div class=\"wp-block-group has-slate-100-color has-dark-slate-background-color has-text-color has-background\" style=\"border-color:#38bdf8;border-style:dashed;border-width:1px;border-radius:10px;padding:1.25rem;margin:24px 0;background-color:#0f172a;color:#e2e8f0;\">\n" .
                "<!-- wp:paragraph {\"style\":{\"typography\":{\"fontWeight\":\"700\"}}} -->\n" .
                "<p style=\"font-weight:700;color:#38bdf8;margin:0 0 8px 0;font-size:15px;\">📷 جایگاه تصویر محتوا #" . $num . " (Image Placeholder)</p>\n" .
                "<!-- /wp:paragraph -->\n" .
                "<!-- wp:paragraph {\"fontSize\":\"small\"} -->\n" .
                "<p class=\"has-small-font-size\" style=\"color:#94a3b8;margin:0 0 10px 0;font-size:12px;line-height:1.6;\">پرامپت پیشنهادی تصویر برای هوش مصنوعی:</p>\n" .
                "<!-- /wp:paragraph -->\n" .
                "<!-- wp:code -->\n" .
                $prompt_html . "\n" .
                "<!-- /wp:code -->\n" .
                "</div>\n<!-- /wp:group -->\n";
        }, $content);

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

        // 9. Save Special Meta (Image prompts, Diagram prompt, Featured image prompt, FAQ data, Mode tag)
        if (!empty($featured_image_prompt)) {
            update_post_meta($post_id, '_omni_ai_featured_image_prompt', $featured_image_prompt);
        }
        if (!empty($diagram_prompt)) {
            update_post_meta($post_id, '_omni_ai_diagram_prompt', $diagram_prompt);
        }
        if (!empty($image_prompts)) {
            update_post_meta($post_id, '_omni_ai_image_prompts', array_values($image_prompts));
            update_post_meta($post_id, '_ai_image_prompts', array_values($image_prompts));
        }
        if (is_array($faq) && !empty($faq)) {
            update_post_meta($post_id, '_ai_faq_data', array_values($faq));
        }

        // 9b. Save Related Tools for Headless Blog and Dynamic Tool Synchronizer
        $raw_related_tools = $data['related_tools'] ?? $data['tools'] ?? $data['ابزارهای_مرتبط'] ?? [];
        $related_tool_slugs = [];
        if (is_array($raw_related_tools)) {
            foreach ($raw_related_tools as $t) {
                if (is_string($t) && trim($t) !== '') {
                    $related_tool_slugs[] = sanitize_title(trim($t));
                } elseif (is_array($t) && !empty($t['slug'])) {
                    $related_tool_slugs[] = sanitize_title(trim($t['slug']));
                }
            }
        }
        if (!empty($related_tool_slugs)) {
            update_post_meta($post_id, '_zebracode_blog_ai_related_tools', array_values(array_unique($related_tool_slugs)));
        }

        // 9c. Save Per-Post Disable Ads Flag
        $disable_ads = !empty($data['disable_ads']) || !empty($params['disable_ads']);
        if ($disable_ads) {
            update_post_meta($post_id, '_omni_ai_disable_ads', 1);
        } else {
            delete_post_meta($post_id, '_omni_ai_disable_ads');
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

        // 11. If linked to content calendar, automatically mark item as completed
        $calendar_item_id = sanitize_text_field($params['calendar_item_id'] ?? '');
        self::mark_calendar_item_completed($calendar_item_id, $post_id, $title);

        // 12. If auto_deploy_staging is enabled, automatically trigger staging build
        $auto_deploy_result = null;
        $cicd_settings = self::get_cicd_settings();
        if (!empty($cicd_settings['auto_deploy_staging']) && !empty($cicd_settings['github_repo']) && !empty($cicd_settings['github_token'])) {
            $auto_deploy_result = self::trigger_github_workflow('staging', 'Auto-deploy after article #' . $post_id . ' created: ' . mb_substr($title, 0, 30));
        }

        $edit_url = get_edit_post_link($post_id, 'raw');
        $preview_url = get_preview_post_link($post_id);

        $success_msg = __('مقاله با موفقیت ایجاد و ذخیره شد.', 'omni-ai-suite');
        if ($auto_deploy_result && !empty($auto_deploy_result['success'])) {
            $success_msg .= ' ' . __('(بیلد استیجینگ وبلاگ در گیت‌هاب اکشنز به صورت خودکار آغاز شد 🚀)', 'omni-ai-suite');
        }

        return new \WP_REST_Response([
            'success'               => true,
            'post_id'               => $post_id,
            'title'                 => $title,
            'slug'                  => $english_slug,
            'seo_title'             => $seo_title,
            'seo_desc'              => $seo_desc,
            'featured_image_prompt' => $featured_image_prompt,
            'diagram_prompt'        => $diagram_prompt,
            'image_prompts'         => is_array($image_prompts) ? array_values($image_prompts) : [],
            'faq_count'             => is_array($faq) ? count($faq) : 0,
            'detected_seo'          => $detected_seo,
            'edit_url'              => $edit_url ?: admin_url('post.php?post=' . $post_id . '&action=edit'),
            'preview_url'           => $preview_url ?: home_url('/?p=' . $post_id . '&preview=true'),
            'auto_deploy'           => $auto_deploy_result,
            'message'               => $success_msg,
        ], 200);
    }

    /**
     * Render raw Mermaid diagram code to styled Gutenberg callout (no external sideloading).
     *
     * @param string $inner_mermaid
     * @return string
     */
    public static function render_mermaid_code_to_image_block(string $inner_mermaid): string {
        return Markdown_Parser::render_diagram_placeholder_block($inner_mermaid);
    }

    /**
     * Search and convert all Mermaid occurrences in content to Gutenberg diagram placeholder blocks.
     *
     * @param string $content
     * @return string
     */
    public static function convert_all_mermaid_in_content(string $content): string {
        return Markdown_Parser::convert_all_mermaid_in_content($content);
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
        return (new Headless_Controller())->handle_get_post_seo($request);
    }

    public function handle_update_post_seo(\WP_REST_Request $request): \WP_REST_Response {
        return (new Headless_Controller())->handle_update_post_seo($request);
    }

    public function handle_generate_seo_snippet(\WP_REST_Request $request): \WP_REST_Response {
        return (new Headless_Controller())->handle_generate_seo_snippet($request);
    }

    /**
     * Normalize a title or focus keyword for anti-duplication & cannibalization checks.
     */
    public static function normalize_dedup_string(string $str): string {
        $str = mb_strtolower(trim($str), 'UTF-8');
        // Unify Persian / Arabic letter variants and zero-width spaces
        $str = str_replace(
            ['ي', 'ك', 'ة', 'ۀ', '‌', '‏', "\xE2\x80\x8C", "\xE2\x80\x8F"],
            ['ی', 'ک', 'ه', 'ه', ' ', ' ', ' ', ' '],
            $str
        );
        // Replace common punctuation with a single space
        $str = preg_replace('/[[:punct:]\x{060C}\x{061B}\x{061F}\x{0640}]+/u', ' ', $str);
        // Collapse multiple whitespace
        $str = preg_replace('/\s+/u', ' ', $str);
        return trim($str);
    }

    /**
     * Get existing posts and content calendar topics for AI context and deduplication.
     */
    public static function get_existing_posts_and_topics(): array {
        $existing = [];
        $seen = [];

        // 1. Fetch latest 100 WordPress posts
        if (function_exists('get_posts')) {
            $posts = get_posts([
                'post_type'      => 'post',
                'post_status'    => ['publish', 'draft', 'future', 'pending'],
                'posts_per_page' => 100,
                'orderby'        => 'date',
                'order'          => 'DESC',
            ]);
            if (is_array($posts)) {
                foreach ($posts as $p) {
                    $t = trim($p->post_title ?? '');
                    if (empty($t)) continue;
                    $norm = self::normalize_dedup_string($t);
                    if (isset($seen[$norm])) continue;
                    $seen[$norm] = true;

                    $kw = get_post_meta($p->ID, '_omni_ai_focus_keyword', true);
                    if (empty($kw)) {
                        $kw = get_post_meta($p->ID, '_yoast_wpseo_focuskw', true)
                           ?: get_post_meta($p->ID, 'rank_math_focus_keyword', true);
                    }

                    $existing[] = [
                        'id'      => $p->ID,
                        'title'   => $t,
                        'keyword' => !empty($kw) ? sanitize_text_field((string)$kw) : '',
                        'source'  => 'post',
                        'status'  => $p->post_status,
                    ];
                }
            }
        }

        // 2. Fetch current content calendar topics
        $calendar = get_option('omni_ai_content_calendar', []);
        if (is_array($calendar)) {
            foreach ($calendar as $cal_item) {
                $t = trim($cal_item['title'] ?? '');
                if (empty($t)) continue;
                $norm = self::normalize_dedup_string($t);
                if (isset($seen[$norm])) continue;
                $seen[$norm] = true;

                $existing[] = [
                    'id'      => $cal_item['id'] ?? null,
                    'title'   => $t,
                    'keyword' => sanitize_text_field((string)($cal_item['focus_keyword'] ?? '')),
                    'source'  => 'calendar',
                    'status'  => $cal_item['status'] ?? 'planned',
                ];
            }
        }

        return $existing;
    }

    /**
     * Get content calendar items. Seeds with 12 high-traffic developer topics if empty.
     */
    public function handle_get_calendar(\WP_REST_Request $request): \WP_REST_Response {
        $calendar = get_option('omni_ai_content_calendar', null);
        if (empty($calendar) || !is_array($calendar)) {
            $calendar = self::get_default_calendar_topics();
            update_option('omni_ai_content_calendar', $calendar);
        }

        $wp_categories = get_categories(['hide_empty' => false]);
        $cat_list = [];
        if (is_array($wp_categories)) {
            $has_other_cats = count($wp_categories) > 1;
            foreach ($wp_categories as $c) {
                $raw_slug = (string) $c->slug;
                $decoded_slug = urldecode($raw_slug);
                $clean_name = html_entity_decode($c->name, ENT_QUOTES, 'UTF-8');
                if ($has_other_cats && in_array(strtolower($raw_slug), ['uncategorized', 'uncategorised', '%d8%af%d8%b3%d8%aa%d9%87%e2%80%8c%d8%a8%d9%86%d8%af%db%8c-%d9%86%d8%b4%d8%af%d9%87'], true)) {
                    continue;
                }
                if ($has_other_cats && in_array($clean_name, ['دسته‌بندی نشده', 'دسته بندی نشده', 'Uncategorized'], true)) {
                    continue;
                }
                $cat_list[] = [
                    'id'          => (int) $c->term_id,
                    'slug'        => $decoded_slug,
                    'name'        => $clean_name,
                    'count'       => (int) $c->count,
                    'description' => html_entity_decode((string) $c->description, ENT_QUOTES, 'UTF-8'),
                ];
            }
        }

        return new \WP_REST_Response([
            'success'         => true,
            'items'           => array_values($calendar),
            'categories'      => $cat_list,
            'existing_topics' => self::get_existing_posts_and_topics(),
        ], 200, [
            'Access-Control-Allow-Origin' => '*',
            'Content-Type'                => 'application/json; charset=utf-8',
        ]);
    }

    /**
     * Save / update content calendar items.
     */
    public function handle_save_calendar(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $action = sanitize_text_field($params['action'] ?? 'save');
        $items = get_option('omni_ai_content_calendar', []);
        if (!is_array($items)) {
            $items = [];
        }

        if ($action === 'reset') {
            $items = self::get_default_calendar_topics();
            update_option('omni_ai_content_calendar', $items);
            return new \WP_REST_Response([
                'success' => true,
                'items'   => $items,
                'message' => __('تقویم با موضوعات استاندارد بازنشانی شد.', 'omni-ai-suite'),
            ], 200);
        }

        if ($action === 'delete') {
            $id = sanitize_text_field($params['id'] ?? '');
            $items = array_values(array_filter($items, function ($it) use ($id) {
                return (string) ($it['id'] ?? '') !== (string) $id;
            }));
            update_option('omni_ai_content_calendar', $items);
            return new \WP_REST_Response([
                'success' => true,
                'items'   => $items,
                'message' => __('موضوع با موفقیت حذف شد.', 'omni-ai-suite'),
            ], 200);
        }

        if ($action === 'toggle_status') {
            $id = sanitize_text_field($params['id'] ?? '');
            foreach ($items as &$it) {
                if ((string) ($it['id'] ?? '') === (string) $id) {
                    $it['status'] = ($it['status'] ?? 'planned') === 'completed' ? 'planned' : 'completed';
                    break;
                }
            }
            unset($it);
            update_option('omni_ai_content_calendar', $items);
            return new \WP_REST_Response([
                'success' => true,
                'items'   => $items,
                'message' => __('وضعیت موضوع به‌روزرسانی شد.', 'omni-ai-suite'),
            ], 200);
        }

        if ($action === 'add') {
            $item = is_array($params['item'] ?? null) ? $params['item'] : [];
            $title = trim($item['title'] ?? '');
            if (empty($title)) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => __('عنوان موضوع الزامی است.', 'omni-ai-suite'),
                ], 400);
            }

            $kw = trim($item['focus_keyword'] ?? '');
            $norm_title = self::normalize_dedup_string($title);
            $norm_kw = self::normalize_dedup_string($kw);

            // Layer 2: Check for duplicates in existing calendar items
            foreach ($items as $existing_item) {
                $exist_norm_t = self::normalize_dedup_string($existing_item['title'] ?? '');
                if (!empty($norm_title) && $exist_norm_t === $norm_title) {
                    return new \WP_REST_Response([
                        'success' => false,
                        'message' => sprintf(__('موضوعی با عنوان مشابه («%s») قبلاً در تقویم ثبت شده است.', 'omni-ai-suite'), $existing_item['title']),
                    ], 400);
                }
                if (!empty($norm_kw) && !empty($existing_item['focus_keyword'])) {
                    if (self::normalize_dedup_string($existing_item['focus_keyword']) === $norm_kw) {
                        return new \WP_REST_Response([
                            'success' => false,
                            'message' => sprintf(__('کلمه کلیدی «%s» قبلاً در موضوع «%s» تقویم استفاده شده است.', 'omni-ai-suite'), $kw, $existing_item['title']),
                        ], 400);
                    }
                }
            }

            // Layer 2: Check for duplicates in WordPress posts
            global $wpdb;
            if ($wpdb) {
                $post_match = $wpdb->get_row($wpdb->prepare(
                    "SELECT ID, post_title FROM {$wpdb->posts} WHERE post_title = %s AND post_type = 'post' AND post_status IN ('publish', 'draft', 'pending', 'future') LIMIT 1",
                    $title
                ));
                if ($post_match) {
                    return new \WP_REST_Response([
                        'success' => false,
                        'message' => sprintf(__('مقاله‌ای با این عنوان دقیق قبلاً در سایت منتشر یا پیش‌نویس شده است (نوشته #%d).', 'omni-ai-suite'), $post_match->ID),
                    ], 400);
                }
                if (!empty($kw)) {
                    $meta_match = $wpdb->get_var($wpdb->prepare(
                        "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_omni_ai_focus_keyword' AND meta_value = %s LIMIT 1",
                        $kw
                    ));
                    if ($meta_match) {
                        return new \WP_REST_Response([
                            'success' => false,
                            'message' => sprintf(__('کلمه کلیدی «%s» قبلاً در نوشته #%d سایت به کار رفته است.', 'omni-ai-suite'), $kw, $meta_match),
                        ], 400);
                    }
                }
            }

            $slot_val = sanitize_text_field($item['day_slot'] ?? $item['week'] ?? ('روز ' . (count($items) + 1)));
            $new_item = [
                'id'            => 'cal_' . time() . '_' . wp_rand(100, 999),
                'day_slot'      => $slot_val,
                'week'          => $slot_val,
                'title'         => sanitize_text_field($title),
                'focus_keyword' => sanitize_text_field($kw),
                'category_slug' => sanitize_text_field($item['category_slug'] ?? 'development'),
                'pillar'        => sanitize_text_field($item['pillar'] ?? 'Tool-Led'),
                'notes'         => sanitize_textarea_field($item['notes'] ?? ''),
                'status'        => sanitize_text_field($item['status'] ?? 'planned'),
                'post_id'       => !empty($item['post_id']) ? intval($item['post_id']) : null,
            ];

            $items[] = $new_item;
            update_option('omni_ai_content_calendar', $items);

            return new \WP_REST_Response([
                'success' => true,
                'items'   => $items,
                'message' => __('موضوع جدید با موفقیت اضافه شد.', 'omni-ai-suite'),
            ], 200);
        }

        if ($action === 'bulk_import') {
            $raw_items = is_array($params['items'] ?? null) ? $params['items'] : [];
            $mode = sanitize_text_field($params['mode'] ?? 'append'); // append or replace
            $imported = [];
            $skipped_duplicates_count = 0;
            $counter = ($mode === 'append') ? count($items) + 1 : 1;

            // Collect existing normalized titles and keywords to guard against duplicates
            $seen_titles = [];
            $seen_keywords = [];

            if ($mode === 'append') {
                foreach ($items as $it) {
                    $t_norm = self::normalize_dedup_string($it['title'] ?? '');
                    if (!empty($t_norm)) {
                        $seen_titles[$t_norm] = true;
                    }
                    $k_norm = self::normalize_dedup_string($it['focus_keyword'] ?? '');
                    if (!empty($k_norm)) {
                        $seen_keywords[$k_norm] = true;
                    }
                }
            }

            // Also check latest 150 published/draft WP posts
            global $wpdb;
            if ($wpdb) {
                $existing_posts = $wpdb->get_results(
                    "SELECT ID, post_title FROM {$wpdb->posts} WHERE post_type = 'post' AND post_status IN ('publish', 'draft', 'pending', 'future') ORDER BY ID DESC LIMIT 150",
                    ARRAY_A
                );
                if (is_array($existing_posts)) {
                    foreach ($existing_posts as $ep) {
                        $p_norm = self::normalize_dedup_string($ep['post_title'] ?? '');
                        if (!empty($p_norm)) {
                            $seen_titles[$p_norm] = true;
                        }
                    }
                }
                $existing_metas = $wpdb->get_col(
                    "SELECT meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_omni_ai_focus_keyword' ORDER BY meta_id DESC LIMIT 150"
                );
                if (is_array($existing_metas)) {
                    foreach ($existing_metas as $em) {
                        $m_norm = self::normalize_dedup_string($em);
                        if (!empty($m_norm)) {
                            $seen_keywords[$m_norm] = true;
                        }
                    }
                }
            }

            foreach ($raw_items as $raw) {
                if (!is_array($raw) || empty(trim($raw['title'] ?? ''))) {
                    continue;
                }

                $title = trim($raw['title'] ?? '');
                $kw = trim($raw['focus_keyword'] ?? '');
                $norm_t = self::normalize_dedup_string($title);
                $norm_k = self::normalize_dedup_string($kw);

                // Anti-duplication & Cannibalization check:
                if (isset($seen_titles[$norm_t]) || (!empty($norm_k) && isset($seen_keywords[$norm_k]))) {
                    $skipped_duplicates_count++;
                    continue;
                }

                $seen_titles[$norm_t] = true;
                if (!empty($norm_k)) {
                    $seen_keywords[$norm_k] = true;
                }

                $slot_val = !empty($raw['day_slot'])
                    ? sanitize_text_field($raw['day_slot'])
                    : (!empty($raw['week']) ? sanitize_text_field($raw['week']) : ('روز ' . $counter++));

                $imported[] = [
                    'id'            => 'cal_' . time() . '_' . wp_rand(100, 99999),
                    'day_slot'      => $slot_val,
                    'week'          => $slot_val,
                    'title'         => sanitize_text_field($title),
                    'focus_keyword' => sanitize_text_field($kw),
                    'category_slug' => sanitize_text_field($raw['category_slug'] ?? 'development'),
                    'pillar'        => sanitize_text_field($raw['pillar'] ?? 'Tool-Led'),
                    'notes'         => sanitize_textarea_field($raw['notes'] ?? ''),
                    'status'        => sanitize_text_field($raw['status'] ?? 'planned'),
                    'post_id'       => !empty($raw['post_id']) ? intval($raw['post_id']) : null,
                ];
            }

            $added_count = count($imported);

            if ($mode === 'replace') {
                $items = $imported;
            } else {
                $items = array_merge($items, $imported);
            }
            update_option('omni_ai_content_calendar', $items);

            $msg = '';
            if ($added_count > 0 && $skipped_duplicates_count > 0) {
                $msg = sprintf(__('%d موضوع جدید به تقویم افزوده شد (%d موضوع تکراری جهت جلوگیری از Cannibalization حذف گردید).', 'omni-ai-suite'), $added_count, $skipped_duplicates_count);
            } elseif ($added_count > 0) {
                $msg = sprintf(__('%d موضوع با موفقیت به تقویم اضافه شد.', 'omni-ai-suite'), $added_count);
            } else {
                $msg = sprintf(__('هیچ موضوع جدیدی اضافه نشد؛ هر %d موضوع ارسالی به دلیل تکراری بودن در سایت یا تقویم حذف شدند.', 'omni-ai-suite'), $skipped_duplicates_count);
            }

            return new \WP_REST_Response([
                'success'                  => $added_count > 0,
                'items'                    => $items,
                'added_count'              => $added_count,
                'skipped_duplicates_count' => $skipped_duplicates_count,
                'message'                  => $msg,
            ], 200);
        }

        // Default 'save' action: save array of items directly
        if (isset($params['items']) && is_array($params['items'])) {
            $clean_items = [];
            foreach ($params['items'] as $it) {
                if (!is_array($it) || empty(trim($it['title'] ?? ''))) {
                    continue;
                }
                $slot_val = sanitize_text_field($it['day_slot'] ?? $it['week'] ?? '');
                $clean_items[] = [
                    'id'            => sanitize_text_field($it['id'] ?? ('cal_' . time() . '_' . wp_rand(100, 999))),
                    'day_slot'      => $slot_val,
                    'week'          => $slot_val,
                    'title'         => sanitize_text_field($it['title'] ?? ''),
                    'focus_keyword' => sanitize_text_field($it['focus_keyword'] ?? ''),
                    'category_slug' => sanitize_text_field($it['category_slug'] ?? 'development'),
                    'pillar'        => sanitize_text_field($it['pillar'] ?? 'Tool-Led'),
                    'notes'         => sanitize_textarea_field($it['notes'] ?? ''),
                    'status'        => sanitize_text_field($it['status'] ?? 'planned'),
                    'post_id'       => !empty($it['post_id']) ? intval($it['post_id']) : null,
                ];
            }
            update_option('omni_ai_content_calendar', $clean_items);
            return new \WP_REST_Response([
                'success' => true,
                'items'   => $clean_items,
                'message' => __('تغییرات تقویم ذخیره شد.', 'omni-ai-suite'),
            ], 200);
        }

        return new \WP_REST_Response(['success' => true, 'items' => $items], 200);
    }

    /**
     * Public endpoint to get synced tools and configured sitemaps.
     */
    public function handle_get_tools(\WP_REST_Request $request): \WP_REST_Response {
        $tools = \OmniAI\Modules\Tool_Synchronizer::get_synced_tools();
        $sitemaps = \OmniAI\Modules\Tool_Synchronizer::get_sitemap_urls();

        return new \WP_REST_Response([
            'success'      => true,
            'tools'        => $tools,
            'sitemap_urls' => $sitemaps,
            'count'        => count($tools),
        ], 200, [
            'Access-Control-Allow-Origin' => '*',
            'Content-Type'                => 'application/json; charset=utf-8',
        ]);
    }

    /**
     * Crawl sitemaps and synchronize developer tools.
     */
    public function handle_sync_tools(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $raw_urls = $params['sitemap_urls'] ?? [];

        if (is_string($raw_urls)) {
            $raw_urls = preg_split('/[\r\n,]+/', $raw_urls);
        }
        if (!is_array($raw_urls)) {
            $raw_urls = [];
        }

        $result = \OmniAI\Modules\Tool_Synchronizer::sync_from_sitemaps($raw_urls);

        return new \WP_REST_Response($result, 200, [
            'Access-Control-Allow-Origin' => '*',
            'Content-Type'                => 'application/json; charset=utf-8',
        ]);
    }

    /**
     * Manual add, update, delete or bulk save of tools.
     */
    public function handle_manage_tools(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $action = sanitize_text_field($params['action'] ?? 'save_all');

        if ($action === 'delete') {
            $slug = sanitize_text_field($params['slug'] ?? '');
            $res = \OmniAI\Modules\Tool_Synchronizer::delete_tool($slug);
            return new \WP_REST_Response($res, 200);
        }

        if ($action === 'add' || $action === 'update') {
            $tool_data = (array) ($params['tool'] ?? $params);
            $res = \OmniAI\Modules\Tool_Synchronizer::add_or_update_tool($tool_data);
            return new \WP_REST_Response($res, 200);
        }

        // save_all
        $tools = (array) ($params['tools'] ?? []);
        $res = \OmniAI\Modules\Tool_Synchronizer::save_all_tools($tools);

        return new \WP_REST_Response($res, 200);
    }

    /**
     * Get ad campaigns and settings.
     * Public for frontend; returns full campaigns list in ?mode=admin for editors.
     */
    public function handle_get_ads(\WP_REST_Request $request): \WP_REST_Response {
        $settings = \OmniAI\Modules\Ads_Manager::get_settings();
        $mode = $request->get_param('mode');

        if ($mode === 'admin' && current_user_can('edit_posts')) {
            $campaigns = \OmniAI\Modules\Ads_Manager::get_campaigns();
            return new \WP_REST_Response([
                'success'   => true,
                'settings'  => $settings,
                'campaigns' => $campaigns,
                'count'     => count($campaigns),
            ], 200, [
                'Access-Control-Allow-Origin' => '*',
                'Content-Type'                => 'application/json; charset=utf-8',
            ]);
        }

        // Public frontend delivery
        $active_ads = \OmniAI\Modules\Ads_Manager::get_active_ads_for_frontend();
        $head_script = !empty($settings['head_script_enabled']) ? ($settings['global_head_script'] ?? '') : '';

        return new \WP_REST_Response([
            'success'             => true,
            'master_enabled'      => (bool) ($settings['master_enabled'] ?? true),
            'head_script_enabled' => (bool) ($settings['head_script_enabled'] ?? false),
            'global_head_script'  => $head_script,
            'placements_status'   => $settings['placements_status'] ?? [],
            'ads'                 => $active_ads,
            'count'               => count($active_ads),
        ], 200, [
            'Access-Control-Allow-Origin' => '*',
            'Content-Type'                => 'application/json; charset=utf-8',
        ]);
    }

    /**
     * Manage ad campaigns and settings.
     */
    public function handle_manage_ads(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $action = sanitize_text_field($params['action'] ?? 'save_campaign');

        if ($action === 'delete_campaign') {
            $id = sanitize_text_field($params['id'] ?? '');
            $res = \OmniAI\Modules\Ads_Manager::delete_campaign($id);
            return new \WP_REST_Response($res, 200);
        }

        if ($action === 'toggle_campaign') {
            $id = sanitize_text_field($params['id'] ?? '');
            $active = isset($params['active']) ? (bool) $params['active'] : null;
            $res = \OmniAI\Modules\Ads_Manager::toggle_campaign($id, $active);
            return new \WP_REST_Response($res, 200);
        }

        if ($action === 'reorder_campaigns') {
            $ids = (array) ($params['ordered_ids'] ?? []);
            $res = \OmniAI\Modules\Ads_Manager::reorder_campaigns($ids);
            return new \WP_REST_Response($res, 200);
        }

        if ($action === 'save_global_settings') {
            $settings_data = (array) ($params['settings'] ?? $params);
            $res = \OmniAI\Modules\Ads_Manager::save_settings($settings_data);
            return new \WP_REST_Response($res, 200);
        }

        // save_campaign
        $campaign_data = (array) ($params['campaign'] ?? $params);
        $res = \OmniAI\Modules\Ads_Manager::save_campaign($campaign_data);

        return new \WP_REST_Response($res, 200);
    }

    /**
     * Mark calendar item as completed when an article is published/imported.
     */
    public static function mark_calendar_item_completed(string $calendar_item_id, int $post_id, string $title): bool {
        $items = get_option('omni_ai_content_calendar', []);
        if (!is_array($items) || empty($items)) {
            return false;
        }

        $matched = false;
        foreach ($items as &$it) {
            $id_match = !empty($calendar_item_id) && (string) ($it['id'] ?? '') === (string) $calendar_item_id;
            $title_match = empty($calendar_item_id) && !empty($title) && mb_stripos($title, $it['title'] ?? '') !== false;

            if ($id_match || $title_match) {
                $it['status'] = 'completed';
                $it['post_id'] = $post_id;
                $matched = true;
                break;
            }
        }
        unset($it);

        if ($matched) {
            update_option('omni_ai_content_calendar', $items);
        }
        return $matched;
    }

    /**
     * Seed 12 high-traffic developer topics across core categories, dynamically mapped to existing WordPress categories.
     */
    public static function get_default_calendar_topics(): array {
        // Fetch live categories to map seed category slugs dynamically
        $wp_categories = get_categories(['hide_empty' => false]);
        $slug_pool = [];
        if (is_array($wp_categories)) {
            $has_other_cats = count($wp_categories) > 1;
            foreach ($wp_categories as $c) {
                $raw_slug = (string) $c->slug;
                $decoded_slug = urldecode($raw_slug);
                $clean_name = html_entity_decode($c->name, ENT_QUOTES, 'UTF-8');
                if ($has_other_cats && in_array(strtolower($raw_slug), ['uncategorized', 'uncategorised', '%d8%af%d8%b3%d8%aa%d9%87%e2%80%8c%d8%a8%d9%86%d8%af%db%8c-%d9%86%d8%b4%d8%af%d9%87'], true)) {
                    continue;
                }
                if ($has_other_cats && in_array($clean_name, ['دسته‌بندی نشده', 'دسته بندی نشده', 'Uncategorized'], true)) {
                    continue;
                }
                $slug_pool[] = [
                    'slug' => $decoded_slug,
                    'name' => $clean_name,
                ];
            }
        }

        $resolve_cat = function(string $preferred_slug, array $keywords = []) use ($slug_pool): string {
            if (empty($slug_pool)) {
                return $preferred_slug;
            }
            foreach ($slug_pool as $cat) {
                if ($cat['slug'] === $preferred_slug) {
                    return $cat['slug'];
                }
            }
            foreach ($keywords as $kw) {
                foreach ($slug_pool as $cat) {
                    if (stripos($cat['slug'], $kw) !== false || stripos($cat['name'], $kw) !== false) {
                        return $cat['slug'];
                    }
                }
            }
            return $slug_pool[0]['slug'] ?? $preferred_slug;
        };

        $cat_tools       = $resolve_cat('tools', ['tool', 'ابزار']);
        $cat_security    = $resolve_cat('security', ['sec', 'امنیت']);
        $cat_tech_trends = $resolve_cat('tech-trends', ['tech', 'trend', 'فناوری', 'ترند', 'تازه']);
        $cat_development = $resolve_cat('development', ['dev', 'توسعه', 'برنامه']);
        $cat_data        = $resolve_cat('data', ['data', 'داده', 'دیتابیس', 'ساختار']);
        $cat_network     = $resolve_cat('network', ['net', 'api', 'شبکه', 'وب']);

        return [
            [
                'id'            => 'cal_seed_1',
                'day_slot'      => 'روز ۱ - نوبت ۱ (صبح)',
                'week'          => 'روز ۱ - نوبت ۱ (صبح)',
                'title'         => '۱۰ ابزار ضروری و آنلاین برای توسعه‌دهندگان وب در سال ۲۰۲۶',
                'focus_keyword' => 'ابزارهای آنلاین توسعه دهنده',
                'category_slug' => $cat_tools,
                'pillar'        => 'Tool-Led',
                'notes'         => 'معرفی ابزارهای کاربردی تبدیل فرمت، JSON فرمتر، تست RegEx و ویرایش سریع کد در مرورگر',
                'status'        => 'planned',
                'post_id'       => null,
            ],
            [
                'id'            => 'cal_seed_2',
                'day_slot'      => 'روز ۱ - نوبت ۲ (عصر)',
                'week'          => 'روز ۱ - نوبت ۲ (عصر)',
                'title'         => 'چک‌لیست جامع امنیت وب‌سایت‌های مدرن و راه‌های مقابله با آسیب‌پذیری‌های متداول',
                'focus_keyword' => 'امنیت کاربردی وب',
                'category_slug' => $cat_security,
                'pillar'        => 'Problem-Solving',
                'notes'         => 'بررسی XSS، CSRF، SQL Injection و نحوه تنظیم هدرهای امنیتی Content Security Policy',
                'status'        => 'planned',
                'post_id'       => null,
            ],
            [
                'id'            => 'cal_seed_3',
                'day_slot'      => 'روز ۲ - نوبت ۱ (صبح)',
                'week'          => 'روز ۲ - نوبت ۱ (صبح)',
                'title'         => 'ترندها و قابلیت‌های کلیدی اکوسیستم وب و توسعه نرم‌افزار در سال ۲۰۲۶',
                'focus_keyword' => 'ترندهای توسعه وب ۲۰۲۶',
                'category_slug' => $cat_tech_trends,
                'pillar'        => 'Trend',
                'notes'         => 'بررسی وب‌اسمبلی، استانداردهای جدید مرورگرها، پردازش‌های هوش مصنوعی سمت کلاینت و تحول فرانت‌اند',
                'status'        => 'planned',
                'post_id'       => null,
            ],
            [
                'id'            => 'cal_seed_4',
                'day_slot'      => 'روز ۲ - نوبت ۲ (عصر)',
                'week'          => 'روز ۲ - نوبت ۲ (عصر)',
                'title'         => 'مقایسه معماری App Router و Pages Router در Next.js: کدام یک برای سئو بهتر است؟',
                'focus_keyword' => 'معماری Next.js',
                'category_slug' => $cat_development,
                'pillar'        => 'Comparison',
                'notes'         => 'بررسی Server Components، رندرینگ استاتیک و داینامیک، و بهینه‌سازی سرعت LCP در Next.js',
                'status'        => 'planned',
                'post_id'       => null,
            ],
            [
                'id'            => 'cal_seed_5',
                'day_slot'      => 'روز ۳ - نوبت ۱ (صبح)',
                'week'          => 'روز ۳ - نوبت ۱ (صبح)',
                'title'         => 'راهنمای بهینه‌سازی دیتابیس MySQL و PostgreSQL برای وب‌سایت‌های پربازدید',
                'focus_keyword' => 'بهینه سازی دیتابیس',
                'category_slug' => $cat_data,
                'pillar'        => 'Problem-Solving',
                'notes'         => 'تکنیک‌های ایندکس‌گذاری صحیح، تحلیل Slow Queries و استفاده از استراتژی‌های کشینگ با Redis',
                'status'        => 'planned',
                'post_id'       => null,
            ],
            [
                'id'            => 'cal_seed_6',
                'day_slot'      => 'روز ۳ - نوبت ۲ (عصر)',
                'week'          => 'روز ۳ - نوبت ۲ (عصر)',
                'title'         => 'پروتکل HTTP/3 و QUIC چیست و چگونه سرعت سایت را متحول می‌کند؟',
                'focus_keyword' => 'پروتکل HTTP3',
                'category_slug' => $cat_network,
                'pillar'        => 'Trend',
                'notes'         => 'تفاوت با HTTP/2، نحوه اتصال بر بستر UDP، کاهش تاخیر هندشیک TLS و پیاده‌سازی روی کلودفلر',
                'status'        => 'planned',
                'post_id'       => null,
            ],
            [
                'id'            => 'cal_seed_7',
                'day_slot'      => 'روز ۴ - نوبت ۱ (صبح)',
                'week'          => 'روز ۴ - نوبت ۱ (صبح)',
                'title'         => 'راهنمای کار با ابزارهای تبدیل فرمت و بهینه‌سازی تصاویر WebP و AVIF',
                'focus_keyword' => 'تبدیل تصاویر WebP',
                'category_slug' => $cat_tools,
                'pillar'        => 'Tool-Led',
                'notes'         => 'آموزش کاهش حجم تصاویر بدون افت کیفیت برای بهبود شاخص Core Web Vitals',
                'status'        => 'planned',
                'post_id'       => null,
            ],
            [
                'id'            => 'cal_seed_8',
                'day_slot'      => 'روز ۴ - نوبت ۲ (عصر)',
                'week'          => 'روز ۴ - نوبت ۲ (عصر)',
                'title'         => 'پیاده‌سازی احراز هویت دوعاملی (2FA) و Passkeys در اپلیکیشن‌های وب',
                'focus_keyword' => 'احراز هویت دو مرحله ای',
                'category_slug' => $cat_security,
                'pillar'        => 'Problem-Solving',
                'notes'         => 'آشنایی با استاندارد WebAuthn و جایگزینی رمزهای عبور سنتی با کلیدهای عبور بیومتریک',
                'status'        => 'planned',
                'post_id'       => null,
            ],
            [
                'id'            => 'cal_seed_9',
                'day_slot'      => 'روز ۵ - نوبت ۱ (صبح)',
                'week'          => 'روز ۵ - نوبت ۱ (صبح)',
                'title'         => 'هوش مصنوعی مولد و ایجنت‌های کدنویسی خودمختار: نقشه راه برنامه‌نویسان ۲۰۲۶',
                'focus_keyword' => 'ایجنت هوش مصنوعی برنامه نویسی',
                'category_slug' => $cat_tech_trends,
                'pillar'        => 'Trend',
                'notes'         => 'بررسی تاثیر ایجنت‌های کدنویسی، تغییر نقش برنامه‌نویسان و استانداردهای جدید AEO/GEO',
                'status'        => 'planned',
                'post_id'       => null,
            ],
            [
                'id'            => 'cal_seed_10',
                'day_slot'      => 'روز ۵ - نوبت ۲ (عصر)',
                'week'          => 'روز ۵ - نوبت ۲ (عصر)',
                'title'         => 'بهترین روش‌های مدیریت State در React و مقایسه Zustand با Redux Toolkit',
                'focus_keyword' => 'مدیریت استیت در React',
                'category_slug' => $cat_development,
                'pillar'        => 'Comparison',
                'notes'         => 'مقایسه پرفورمنس، حجم باندل، سادگی سینتکس و قابلیت تست‌پذیری در پروژه‌های مقیاس‌پذیر',
                'status'        => 'planned',
                'post_id'       => null,
            ],
            [
                'id'            => 'cal_seed_11',
                'day_slot'      => 'روز ۶ - نوبت ۱ (صبح)',
                'week'          => 'روز ۶ - نوبت ۱ (صبح)',
                'title'         => 'معماری ذخیره‌سازی داده‌های ساختارنیافته با دیتابیس‌های برداری (Vector DBs)',
                'focus_keyword' => 'دیتابیس های برداری',
                'category_slug' => $cat_data,
                'pillar'        => 'Trend',
                'notes'         => 'استفاده از Pinecone و pgvector برای سیستم‌های RAG و جستجوی معنایی هوش مصنوعی',
                'status'        => 'planned',
                'post_id'       => null,
            ],
            [
                'id'            => 'cal_seed_12',
                'day_slot'      => 'روز ۶ - نوبت ۲ (عصر)',
                'week'          => 'روز ۶ - نوبت ۲ (عصر)',
                'title'         => 'راهنمای جامع راه‌اندازی Nginx به عنوان Reverse Proxy و لودبالانسر',
                'focus_keyword' => 'کانفیگ Nginx Reverse Proxy',
                'category_slug' => $cat_network,
                'pillar'        => 'Problem-Solving',
                'notes'         => 'تنظیم SSL رایگان با Let\'s Encrypt، کشینگ فایل‌های استاتیک و توزیع بار روی سرورها',
                'status'        => 'planned',
                'post_id'       => null,
            ],
        ];
    }

    /**
     * Get saved CI/CD deployment settings with sensible defaults.
     *
     * @return array
     */
    public static function get_cicd_settings(): array {
        $defaults = [
            'github_repo'          => '',
            'github_token'         => '',
            'staging_workflow'     => 'deploy-blog-develop.yml',
            'staging_branch'       => 'develop',
            'production_workflow'  => 'deploy-blog-main.yml',
            'production_branch'    => 'main',
            'auto_deploy_staging'  => false,
            'last_triggered'       => null,
        ];
        $saved = get_option('omni_ai_cicd_settings', []);
        return wp_parse_args(is_array($saved) ? $saved : [], $defaults);
    }

    /**
     * Mask personal access token for safe UI display.
     *
     * @param string $token
     * @return string
     */
    public static function mask_token(string $token): string {
        $token = trim($token);
        $len = strlen($token);
        if ($len <= 8) {
            return str_repeat('•', 8);
        }
        return substr($token, 0, 4) . str_repeat('•', 8) . substr($token, -4);
    }

    /**
     * GET /omni-ai/v1/deploy
     * Returns saved CI/CD configuration (with masked token) and the latest 5 workflow runs from GitHub Actions.
     */
    public function handle_get_deploy_status(\WP_REST_Request $request): \WP_REST_Response {
        $settings = self::get_cicd_settings();
        $repo = trim((string) ($settings['github_repo'] ?? ''));
        $token = trim((string) ($settings['github_token'] ?? ''));

        $runs = [];
        $github_error = null;

        if (!empty($repo) && !empty($token)) {
            $clean_repo = trim($repo, '/');
            $url = "https://api.github.com/repos/{$clean_repo}/actions/runs?per_page=6";
            $res = wp_remote_get($url, [
                'headers' => [
                    'Authorization'        => 'Bearer ' . $token,
                    'Accept'               => 'application/vnd.github+json',
                    'User-Agent'           => 'WordPress-Omni-AI-Suite',
                    'X-GitHub-Api-Version' => '2022-11-28',
                ],
                'timeout' => 15,
            ]);

            if (is_wp_error($res)) {
                $github_error = $res->get_error_message();
            } else {
                $code = wp_remote_retrieve_response_code($res);
                $body = json_decode(wp_remote_retrieve_body($res), true);
                if ($code === 200 && isset($body['workflow_runs']) && is_array($body['workflow_runs'])) {
                    foreach ($body['workflow_runs'] as $run) {
                        $runs[] = [
                            'id'            => $run['id'] ?? 0,
                            'name'          => $run['name'] ?? '',
                            'display_title' => $run['display_title'] ?? '',
                            'head_branch'   => $run['head_branch'] ?? '',
                            'head_sha'      => substr($run['head_sha'] ?? '', 0, 7),
                            'status'        => $run['status'] ?? '', // queued, in_progress, completed, waiting
                            'conclusion'    => $run['conclusion'] ?? null, // success, failure, cancelled, timed_out
                            'html_url'      => $run['html_url'] ?? '',
                            'run_number'    => $run['run_number'] ?? 0,
                            'event'         => $run['event'] ?? '',
                            'created_at'    => $run['created_at'] ?? '',
                            'updated_at'    => $run['updated_at'] ?? '',
                            'actor'         => [
                                'login'      => $run['actor']['login'] ?? '',
                                'avatar_url' => $run['actor']['avatar_url'] ?? '',
                            ],
                        ];
                    }
                } else {
                    $github_error = $body['message'] ?? sprintf(__('خطا در دریافت وضعیت گیت‌هاب (کد %d)', 'omni-ai-suite'), $code);
                }
            }
        }

        return new \WP_REST_Response([
            'success'      => true,
            'settings'     => [
                'github_repo'          => $settings['github_repo'],
                'has_token'            => !empty($token),
                'masked_token'         => !empty($token) ? self::mask_token($token) : '',
                'staging_workflow'     => $settings['staging_workflow'],
                'staging_branch'       => $settings['staging_branch'],
                'production_workflow'  => $settings['production_workflow'],
                'production_branch'    => $settings['production_branch'],
                'auto_deploy_staging'  => !empty($settings['auto_deploy_staging']),
                'last_triggered'       => $settings['last_triggered'] ?? null,
            ],
            'runs'         => $runs,
            'github_error' => $github_error,
        ], 200);
    }

    /**
     * POST /omni-ai/v1/deploy
     * Saves CI/CD settings or triggers a build on GitHub Actions.
     */
    public function handle_trigger_deploy(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $action = sanitize_text_field($params['action'] ?? 'trigger');

        if ($action === 'save_settings') {
            $existing = self::get_cicd_settings();
            $new_repo = sanitize_text_field($params['github_repo'] ?? '');
            $new_token_input = trim((string) ($params['github_token'] ?? ''));

            $token_to_save = $existing['github_token'];
            if (!empty($new_token_input) && !str_contains($new_token_input, '•')) {
                $token_to_save = sanitize_text_field($new_token_input);
            }

            $updated = [
                'github_repo'          => $new_repo,
                'github_token'         => $token_to_save,
                'staging_workflow'     => sanitize_text_field($params['staging_workflow'] ?? 'deploy-blog-develop.yml'),
                'staging_branch'       => sanitize_text_field($params['staging_branch'] ?? 'develop'),
                'production_workflow'  => sanitize_text_field($params['production_workflow'] ?? 'deploy-blog-main.yml'),
                'production_branch'    => sanitize_text_field($params['production_branch'] ?? 'main'),
                'auto_deploy_staging'  => !empty($params['auto_deploy_staging']),
                'last_triggered'       => $existing['last_triggered'] ?? null,
            ];

            update_option('omni_ai_cicd_settings', $updated);

            return new \WP_REST_Response([
                'success'  => true,
                'message'  => __('تنظیمات گیت‌هاب CI/CD با موفقیت ذخیره شد.', 'omni-ai-suite'),
                'settings' => [
                    'github_repo'          => $updated['github_repo'],
                    'has_token'            => !empty($updated['github_token']),
                    'masked_token'         => !empty($updated['github_token']) ? self::mask_token($updated['github_token']) : '',
                    'staging_workflow'     => $updated['staging_workflow'],
                    'staging_branch'       => $updated['staging_branch'],
                    'production_workflow'  => $updated['production_workflow'],
                    'production_branch'    => $updated['production_branch'],
                    'auto_deploy_staging'  => $updated['auto_deploy_staging'],
                    'last_triggered'       => $updated['last_triggered'],
                ],
            ], 200);
        }

        // Action is 'trigger'
        $target = sanitize_text_field($params['target'] ?? 'staging');
        $reason = sanitize_text_field($params['reason'] ?? '');

        $result = self::trigger_github_workflow($target, $reason);

        return new \WP_REST_Response($result, $result['success'] ? 200 : 400);
    }

    /**
     * Trigger a GitHub Actions workflow via workflow_dispatch API with repository_dispatch fallback.
     *
     * @param string $target 'staging' or 'production'
     * @param string $reason Optional trigger description
     * @return array
     */
    public static function trigger_github_workflow(string $target, string $reason = ''): array {
        $settings = self::get_cicd_settings();
        $repo = trim((string) ($settings['github_repo'] ?? ''));
        $token = trim((string) ($settings['github_token'] ?? ''));

        if (empty($repo) || empty($token)) {
            return [
                'success' => false,
                'message' => __('لطفاً نام ریپازیتوری (owner/repo) و توکن دسترسی گیت‌هاب (PAT) را در بخش تنظیمات CI/CD وارد و ذخیره کنید.', 'omni-ai-suite'),
            ];
        }

        $clean_repo = trim($repo, '/');
        $is_production = ($target === 'production');
        $workflow_file = $is_production
            ? ($settings['production_workflow'] ?: 'deploy-blog-main.yml')
            : ($settings['staging_workflow'] ?: 'deploy-blog-develop.yml');
        $ref_branch = $is_production
            ? ($settings['production_branch'] ?: 'main')
            : ($settings['staging_branch'] ?: 'develop');

        $headers = [
            'Authorization'        => 'Bearer ' . $token,
            'Accept'               => 'application/vnd.github+json',
            'User-Agent'           => 'WordPress-Omni-AI-Suite',
            'X-GitHub-Api-Version' => '2022-11-28',
            'Content-Type'         => 'application/json',
        ];

        $target_label = $is_production ? 'پروداکشن (اصلی)' : 'استیجینگ (تست)';

        // 1. Trigger workflow_dispatch
        $dispatch_url = "https://api.github.com/repos/{$clean_repo}/actions/workflows/{$workflow_file}/dispatches";
        $trigger_reason = !empty($reason) ? $reason : ('Manual trigger from Omni AI Suite by ' . wp_get_current_user()->display_name);

        $payload = [
            'ref'    => $ref_branch,
            'inputs' => [
                'reason' => $trigger_reason,
            ],
        ];

        $res = wp_remote_post($dispatch_url, [
            'headers' => $headers,
            'body'    => wp_json_encode($payload),
            'timeout' => 15,
        ]);

        $code = !is_wp_error($res) ? wp_remote_retrieve_response_code($res) : 0;

        if ($code === 204) {
            $last_triggered = [
                'target'    => $target,
                'branch'    => $ref_branch,
                'workflow'  => $workflow_file,
                'timestamp' => current_time('mysql'),
                'user'      => wp_get_current_user()->display_name,
                'reason'    => $trigger_reason,
            ];
            $settings['last_triggered'] = $last_triggered;
            update_option('omni_ai_cicd_settings', $settings);

            return [
                'success'        => true,
                'message'        => sprintf(__('بیلد %s با موفقیت روی شاخه %s در گیت‌هاب اجرا شد و در صف استقرار قرار گرفت.', 'omni-ai-suite'), $target_label, $ref_branch),
                'last_triggered' => $last_triggered,
            ];
        }

        // 2. Fallback: repository_dispatch
        $repo_dispatch_url = "https://api.github.com/repos/{$clean_repo}/dispatches";
        $repo_payload = [
            'event_type'     => $is_production ? 'deploy-blog-production' : 'deploy-blog-staging',
            'client_payload' => [
                'reason' => $trigger_reason,
                'branch' => $ref_branch,
            ],
        ];

        $fallback_res = wp_remote_post($repo_dispatch_url, [
            'headers' => $headers,
            'body'    => wp_json_encode($repo_payload),
            'timeout' => 15,
        ]);

        $fallback_code = !is_wp_error($fallback_res) ? wp_remote_retrieve_response_code($fallback_res) : 0;

        if ($fallback_code === 204) {
            $last_triggered = [
                'target'    => $target,
                'branch'    => $ref_branch,
                'workflow'  => 'repository_dispatch (' . ($is_production ? 'deploy-blog-production' : 'deploy-blog-staging') . ')',
                'timestamp' => current_time('mysql'),
                'user'      => wp_get_current_user()->display_name,
                'reason'    => $trigger_reason,
            ];
            $settings['last_triggered'] = $last_triggered;
            update_option('omni_ai_cicd_settings', $settings);

            return [
                'success'        => true,
                'message'        => sprintf(__('درخواست بیلد %s از طریق repository_dispatch با موفقیت به گیت‌هاب ارسال شد.', 'omni-ai-suite'), $target_label),
                'last_triggered' => $last_triggered,
            ];
        }

        $raw_error = !is_wp_error($res) ? wp_remote_retrieve_body($res) : $res->get_error_message();
        $err_json = json_decode($raw_error, true);
        $err_msg = $err_json['message'] ?? $raw_error;

        return [
            'success' => false,
            'code'    => $code,
            'message' => sprintf(__('خطا در ارسال درخواست به گیت‌هاب (کد %d): %s', 'omni-ai-suite'), $code, $err_msg),
        ];
    }
}
