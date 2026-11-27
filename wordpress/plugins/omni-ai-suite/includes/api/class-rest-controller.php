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

        // Social Broadcast (Telegram & Bale) endpoints
        register_rest_route(self::NAMESPACE, '/social-broadcast', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_social_broadcast'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_post_social_broadcast'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/social-broadcast/webhook', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_social_broadcast_webhook'],
            'permission_callback' => '__return_true',
        ]);

        // Web Trends / RSS-to-Article endpoints by category
        register_rest_route(self::NAMESPACE, '/web-trends', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_web_trends'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_post_web_trends'],
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

        // Social Broadcast (Telegram & Bale) endpoints
        register_rest_route(self::NAMESPACE, '/social-broadcast', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_social_broadcast'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_post_social_broadcast'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/social-broadcast/webhook', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_social_broadcast_webhook'],
            'permission_callback' => '__return_true',
        ]);

        // Web Trends / RSS-to-Article endpoints by category
        register_rest_route(self::NAMESPACE, '/web-trends', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_web_trends'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_post_web_trends'],
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

        // Social Broadcast (Telegram & Bale) endpoints
        register_rest_route(self::NAMESPACE, '/social-broadcast', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_social_broadcast'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_post_social_broadcast'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/social-broadcast/webhook', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_social_broadcast_webhook'],
            'permission_callback' => '__return_true',
        ]);

        // Web Trends / RSS-to-Article endpoints by category
        register_rest_route(self::NAMESPACE, '/web-trends', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_web_trends'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_post_web_trends'],
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

        // Social Broadcast (Telegram & Bale) endpoints
        register_rest_route(self::NAMESPACE, '/social-broadcast', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_social_broadcast'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_post_social_broadcast'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/social-broadcast/webhook', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_social_broadcast_webhook'],
            'permission_callback' => '__return_true',
        ]);

        // Web Trends / RSS-to-Article endpoints by category
        register_rest_route(self::NAMESPACE, '/web-trends', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_web_trends'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_post_web_trends'],
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

        // Social Broadcast (Telegram & Bale) endpoints
        register_rest_route(self::NAMESPACE, '/social-broadcast', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_social_broadcast'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_post_social_broadcast'],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/social-broadcast/webhook', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_social_broadcast_webhook'],
            'permission_callback' => '__return_true',
        ]);

        // Web Trends / RSS-to-Article endpoints by category
        register_rest_route(self::NAMESPACE, '/web-trends', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'handle_get_web_trends'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'handle_post_web_trends'],
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ],
        ]);

        // Google Search Console endpoints
        register_rest_route(self::NAMESPACE, '/gsc/status', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'handle_gsc_status'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        register_rest_route(self::NAMESPACE, '/gsc/credentials', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_gsc_save_credentials'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        register_rest_route(self::NAMESPACE, '/gsc/disconnect', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_gsc_disconnect'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        register_rest_route(self::NAMESPACE, '/gsc/sites', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'handle_gsc_get_sites'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        register_rest_route(self::NAMESPACE, '/gsc/add-site', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_gsc_add_site'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        register_rest_route(self::NAMESPACE, '/gsc/remove-site', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_gsc_remove_site'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        register_rest_route(self::NAMESPACE, '/gsc/performance', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_gsc_get_performance'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        register_rest_route(self::NAMESPACE, '/gsc/ai-diagnose', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_gsc_ai_diagnose'],
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

        // Clean markdown links inside href before parsing: href="[url](url)" -> href="url"
        $cleaned_pre = preg_replace('/href\s*=\s*(["\'])\s*\[([^\]]+)\](?:\([^)]+\))?\s*\1/i', 'href=$1$2$1', $cleaned);

        // 2. Decode JSON with Multi-Layer Auto-Healing
        $data = json_decode($cleaned_pre, true);
        $initial_json_error = (json_last_error() !== JSON_ERROR_NONE) ? json_last_error_msg() : '';

        // Fallback 2a: Repair unescaped double quotes inside HTML attributes (e.g. href="...", style="...", class="...")
        if (!is_array($data) || empty($data['title'])) {
            $repaired_html_quotes = preg_replace_callback('/<[^>]+>/s', function ($tag_match) {
                // Replace ="..." with ='...' inside HTML tags
                return preg_replace('/=(["])(.*?)\1/s', "='$2'", $tag_match[0]);
            }, $cleaned_pre);

            $data = json_decode($repaired_html_quotes, true);

            // Fallback 2b: Normalize unescaped line breaks inside strings
            if (!is_array($data) || empty($data['title'])) {
                $repaired_newlines = preg_replace('/(?<!\\\\)\r\n|\r|\n/', '\n', $repaired_html_quotes);
                $data = json_decode($repaired_newlines, true);
            }
        }

        // Fallback 2c: Deep Resilient Extractor (for unescaped quotes in Persian text, malformed syntax, or key reordering)
        if (!is_array($data) || empty($data['title']) || empty($data['content'])) {
            $fallback_data = is_array($data) ? $data : [];

            // Extract scalar string fields
            $scalar_keys = [
                'title'                 => ['title', 'عنوان', 'post_title'],
                'slug'                  => ['slug', 'نامک', 'اسلاگ'],
                'seo_title'             => ['seo_title', 'عنوان_سئو'],
                'seo_desc'              => ['seo_desc', 'seo_description', 'توضیحات_سئو', 'meta_desc'],
                'focus_keyword'         => ['focus_keyword', 'focus_kw', 'keyword', 'کلمه_کلیدی', 'کلیدواژه', 'کلمه_کلیدی_کانونی'],
                'featured_image_prompt' => ['featured_image_prompt', 'تصویر_شاخص', 'featured_image', 'prompt_featured_image'],
                'diagram_prompt'        => ['diagram_prompt', 'دیاگرام', 'diagram', 'infographic_prompt'],
            ];

            foreach ($scalar_keys as $std_key => $aliases) {
                if (!empty($fallback_data[$std_key])) {
                    continue;
                }
                foreach ($aliases as $alias) {
                    if (preg_match('/"' . preg_quote($alias, '/') . '"\s*:\s*"((?:\\\\.|[^"\\\\])*)"/u', $cleaned_pre, $m)) {
                        $fallback_data[$std_key] = stripcslashes($m[1]);
                        break;
                    } elseif (preg_match('/"' . preg_quote($alias, '/') . '"\s*:\s*"(.*?)"\s*,\s*"/su', $cleaned_pre, $m)) {
                        $fallback_data[$std_key] = trim(stripcslashes($m[1]));
                        break;
                    }
                }
            }

            // Extract image_prompts array
            if (empty($fallback_data['image_prompts'])) {
                if (preg_match('/"(?:image_prompts|پرامپت_تصاویر|images)"\s*:\s*\[([\s\S]*?)\]\s*(?:,|\})/u', $cleaned_pre, $m)) {
                    if (preg_match_all('/"((?:\\\\.|[^"\\\\])+)"/u', $m[1], $img_matches)) {
                        $fallback_data['image_prompts'] = array_map('stripcslashes', $img_matches[1]);
                    }
                }
            }

            // Extract related_tools array
            if (empty($fallback_data['related_tools'])) {
                if (preg_match('/"(?:related_tools|ابزارهای_مرتبط|tools)"\s*:\s*\[([\s\S]*?)\]\s*(?:,|\})/u', $cleaned_pre, $m)) {
                    if (preg_match_all('/"((?:\\\\.|[^"\\\\])+)"/u', $m[1], $rel_matches)) {
                        $fallback_data['related_tools'] = array_map('stripcslashes', $rel_matches[1]);
                    }
                }
            }

            // Extract FAQ array
            if (empty($fallback_data['faq'])) {
                if (preg_match('/"(?:faq|faqs|سوالات_متداول)"\s*:\s*\[([\s\S]*?)\]\s*(?:,|\})/u', $cleaned_pre, $m)) {
                    $faq_raw = '[' . $m[1] . ']';
                    $decoded_faq = json_decode($faq_raw, true);
                    if (is_array($decoded_faq)) {
                        $fallback_data['faq'] = $decoded_faq;
                    } else {
                        preg_match_all('/\{\s*"question"\s*:\s*"([^"]+)"\s*,\s*"answer"\s*:\s*"([^"]+)"\s*\}/u', $m[1], $qa_matches, PREG_SET_ORDER);
                        $parsed_faq = [];
                        foreach ($qa_matches as $qa) {
                            $parsed_faq[] = ['question' => stripcslashes($qa[1]), 'answer' => stripcslashes($qa[2])];
                        }
                        if (!empty($parsed_faq)) {
                            $fallback_data['faq'] = $parsed_faq;
                        }
                    }
                }
            }

            // Extract content: Robust Boundary Extraction
            if (empty($fallback_data['content'])) {
                if (preg_match('/"(?:content|محتوا|post_content)"\s*:\s*"/u', $cleaned_pre, $m, PREG_OFFSET_CAPTURE)) {
                    $content_start_pos = $m[0][1] + strlen($m[0][0]);
                    $rest_of_json = substr($cleaned_pre, $content_start_pos);

                    // Check if content is followed by another key: e.g. ", \"seo_desc\":" or ", \"faq\":"
                    if (preg_match('/"\s*,\s*"[a-zA-Z0-9_\x{0600}-\x{06FF}]+"\s*:/u', $rest_of_json, $next_key_m, PREG_OFFSET_CAPTURE)) {
                        $raw_content_val = substr($rest_of_json, 0, $next_key_m[0][1]);
                    } else {
                        // Content is the last property before final '}'
                        if (preg_match('/"\s*\}\s*$/u', $rest_of_json, $end_m, PREG_OFFSET_CAPTURE)) {
                            $raw_content_val = substr($rest_of_json, 0, $end_m[0][1]);
                        } else {
                            $last_quote = strrpos($rest_of_json, '"');
                            $raw_content_val = ($last_quote !== false) ? substr($rest_of_json, 0, $last_quote) : $rest_of_json;
                        }
                    }

                    // Normalize literal escapes
                    $raw_content_val = str_replace(['\n', '\r', '\"', '\/'], ["\n", "\r", '"', '/'], $raw_content_val);
                    $fallback_data['content'] = $raw_content_val;
                }
            }

            if (!empty($fallback_data['title']) && !empty($fallback_data['content'])) {
                $data = $fallback_data;
            }
        }

        if (!is_array($data) || empty($data['title'])) {
            $err_msg = !empty($initial_json_error) && $initial_json_error !== 'No error'
                ? $initial_json_error
                : __('کلید title یا content در ساختار یافت نشد.', 'omni-ai-suite');

            return new \WP_REST_Response([
                'success' => false,
                'message' => sprintf(
                    __('ساختار JSON نامعتبر است (%s). لطفاً خروجی چت‌بات را بدون تغییر در باکس پیست نمایید.', 'omni-ai-suite'),
                    $err_msg
                )
            ], 400);
        }

        // 3. Extract and normalize fields
        $title = sanitize_text_field(wp_strip_all_tags($data['title'] ?? $data['عنوان'] ?? $data['post_title'] ?? ''));
        $content = (string) ($data['content'] ?? $data['محتوا'] ?? $data['post_content'] ?? '');
        $seo_title = sanitize_text_field(wp_strip_all_tags($data['seo_title'] ?? $data['عنوان_سئو'] ?? $title));
        $seo_desc = sanitize_textarea_field(wp_strip_all_tags($data['seo_desc'] ?? $data['seo_description'] ?? $data['توضیحات_سئو'] ?? $data['meta_desc'] ?? ''));
        $raw_slug = (string) ($data['slug'] ?? $data['نامک'] ?? $data['اسلاگ'] ?? '');

        $focus_keyword = sanitize_text_field(wp_strip_all_tags(
            $data['focus_keyword'] ?? $data['focus_kw'] ?? $data['keyword'] ?? $data['کلمه_کلیدی'] ?? $data['کلیدواژه'] ?? ($params['focus_keyword'] ?? '')
        ));

        if (empty($focus_keyword)) {
            $param_focus = sanitize_text_field($params['focus_keyword'] ?? '');
            if (!empty($param_focus)) {
                $focus_keyword = $param_focus;
            } else {
                // Smart fallback: extract 2-3 words from topic or title
                $topic_param = sanitize_text_field($params['topic'] ?? '');
                $clean_src = !empty($topic_param) ? $topic_param : $title;
                $clean_src = preg_replace('/[[:punct:]]+/u', ' ', $clean_src);
                $t_words = preg_split('/\s+/u', trim($clean_src), -1, PREG_SPLIT_NO_EMPTY);
                $focus_keyword = implode(' ', array_slice($t_words, 0, min(3, count($t_words))));
            }
        }
        
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

        // 3b. Sanitize internal tool links, nested markdown links, and auto-close unclosed <a> tags
        $content = preg_replace('/\[([^\]]+)\]\(\s*\[([^\]]+)\](?:\([^)]+\))?\s*\)/i', '[$1]($2)', $content);
        $content = preg_replace('/href=(["\'])\s*\[([^\]]+)\](?:\([^)]+\))?\s*\1/i', 'href=$1$2$1', $content);
        $content_lines = explode("\n", $content);
        $fixed_content_lines = [];
        $delim_regex = '/([،\.,;:!?]|\s+(?:به شما|محیطی|می‌توانید|میتوانید|باعث|با ارائه|اختلافات|جهت|برای)\b)/u';
        foreach ($content_lines as $cline) {
            if (str_contains($cline, '<a ') && !str_contains($cline, '</a>')) {
                $cline = preg_replace_callback('/(<a\s+[^>]+>)(.*)/u', function ($am) use ($delim_regex) {
                    $tag = $am[1];
                    $rest = $am[2];
                    if (preg_match($delim_regex, $rest, $dm, PREG_OFFSET_CAPTURE)) {
                        $split_pos = $dm[0][1];
                        $anchor = trim(substr($rest, 0, $split_pos));
                        $rem = substr($rest, $split_pos);
                        return $tag . $anchor . '</a>' . $rem;
                    }
                    $words = explode(' ', $rest);
                    if (count($words) > 4) {
                        return $tag . implode(' ', array_slice($words, 0, 4)) . '</a> ' . implode(' ', array_slice($words, 4));
                    }
                    return $tag . $rest . '</a>';
                }, $cline);
            }
            $fixed_content_lines[] = $cline;
        }
        $content = implode("\n", $fixed_content_lines);

        // 3c-pre. Transform Markdown content to rich Gutenberg HTML blocks BEFORE Auto-Heal checks
        if (!preg_match('/<p\b|<div\b|<h[1-6]\b/i', $content) && preg_match('/(?:^#{1,6}\s|^\s*[-*•]\s|^\s*\d+\.\s|\*{2}|\[[^\]]+\]\(https?:\/\/)/m', $content)) {
            $content = Markdown_Parser::parse($content, $diagram_prompt);
        }

        // Normalize block tags spacing so paragraph splits and word metrics are accurate
        $content = preg_replace('/(<\/(?:p|div|h[1-6]|ul|ol|blockquote|table)>)(?!\s*\n)/iu', "$1\n\n", $content);

        // Ensure standalone HTML tables (not inside Gutenberg wp-block-table) have styling classes
        if (str_contains($content, '<table') && !str_contains($content, 'wp-block-table')) {
            $content = preg_replace_callback('/<table\b([^>]*)>/i', function ($matches) {
                $attrs = $matches[1];
                if (!str_contains($attrs, 'border=')) {
                    $attrs .= ' border="1"';
                }
                if (!str_contains($attrs, 'class=')) {
                    $attrs .= ' class="omni-article-table"';
                } elseif (!str_contains($attrs, 'omni-article-table')) {
                    $attrs = preg_replace('/class=["\']([^"\']*)["\']/i', 'class="$1 omni-article-table"', $attrs);
                }
                return '<table' . $attrs . '>';
            }, $content);
        }

        // 3c. Auto-Heal: Ensure GEO, AEO & SEO Mandatory Elements (Direct Answer, Key Takeaways, Conclusion, Quotes, Links)
        $norm_c = str_replace('‌', ' ', $content);
        $kw_label = esc_html(!empty($focus_keyword) ? $focus_keyword : $title);

        // Ensure Direct Answer paragraph for AEO (under 75 words)
        $text_with_breaks = preg_replace('/<\/(?:p|div|h[1-6]|li|blockquote|tr)>/iu', "\n\n", $content);
        $clean_p_text = trim(wp_strip_all_tags($text_with_breaks));
        $all_paras = array_values(array_filter(array_map('trim', preg_split('/\n+/u', $clean_p_text))));
        $first_p_text = trim($all_paras[0] ?? '');
        $first_p_words = 0;
        if (!empty($first_p_text)) {
            $p_words_arr = preg_split('/[\s\p{Z}\p{P}]+/u', $first_p_text, -1, PREG_SPLIT_NO_EMPTY);
            $first_p_words = is_array($p_words_arr) ? count($p_words_arr) : 0;
        }

        if ($first_p_words < 25 || $first_p_words > 80) {
            $direct_answer_block = "<!-- wp:paragraph -->\n<p><strong>{$kw_label}</strong> به عنوان یکی از مهم‌ترین مفاهیم و ابزارهای توسعه نرم‌افزار، راهکاری تخصصی و مؤثر برای افزایش چشمگیر سرعت کدنویسی و ارتقای کیفیت پروژه‌ها است. بنابراین به‌کارگیری اصولی این راهکارها موجب پیشگیری از خطاهای زمان اجرا و بهینه‌سازی فرایندهای توسعه وب می‌شود.</p>\n<!-- /wp:paragraph -->\n\n";
            $content = $direct_answer_block . $content;
        }

        // Ensure Key Takeaways block
        if (
            mb_stripos($content, 'نکات کلیدی', 0, 'UTF-8') === false &&
            mb_stripos($norm_c, 'نکات کلیدی', 0, 'UTF-8') === false &&
            mb_stripos($content, 'در یک نگاه', 0, 'UTF-8') === false &&
            mb_stripos($content, 'خلاصه اجرایی', 0, 'UTF-8') === false
        ) {
            $takeaway_block = "\n\n<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">نکات کلیدی</h2>\n<!-- /wp:heading -->\n" .
                "<!-- wp:list -->\n<ul>\n" .
                "<li><strong>مفهوم محوری:</strong> شناخت مبانی، کاربردها و مزایای تخصصی {$kw_label} در توسعه نرم‌افزار.</li>\n" .
                "<li><strong>رویکرد عملی:</strong> مراحل پیاده‌سازی گام‌به‌گام و ابزارهای مرتبط جهت پیاده‌سازی استاندارد.</li>\n" .
                "<li><strong>ارزیابی عملکرد:</strong> افزایش بهره‌وری و بهینه‌سازی سرعت سیستم بر اساس الگوهای نوین سال ۲۰۲۶.</li>\n" .
                "</ul>\n<!-- /wp:list -->\n\n";

            if (preg_match('/<\/p>/i', $content, $pm, PREG_OFFSET_CAPTURE)) {
                $p_end = $pm[0][1] + 4;
                $content = substr($content, 0, $p_end) . $takeaway_block . substr($content, $p_end);
            } else {
                $content = $takeaway_block . $content;
            }
        }

        // Ensure Question Headings (AEO)
        preg_match_all('/<h[2-4][^>]*>(.*?)<\/h[2-4]>/is', $content, $h_matches);
        $q_count = 0;
        foreach ($h_matches[1] ?? [] as $ht) {
            $ht_clean = strip_tags($ht);
            if (mb_strpos($ht_clean, '؟') !== false || mb_strpos($ht_clean, '?') !== false || preg_match('/\b(چیست|چگونه|چطور|چرا|کدام)\b/u', $ht_clean)) {
                $q_count++;
            }
        }
        if ($q_count < 2) {
            $q_block = "\n\n<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">چگونه از {$kw_label} برای بهینه‌سازی پروژه‌ها استفاده کنیم؟</h2>\n<!-- /wp:heading -->\n" .
                "<!-- wp:paragraph -->\n<p>برای پیاده‌سازی و بهره‌مندی حداکثری از {$kw_label}، ابتدا نیازمندی‌های پروژه را ارزیابی کرده و سپس ابزارهای مناسب را در معماری روزمره خود ادغام نمایید.</p>\n<!-- /wp:paragraph -->\n\n";
            $content .= $q_block;
        }

        // Ensure Internal Links (SEO)
        $site_host = wp_parse_url(home_url(), PHP_URL_HOST);
        preg_match_all('/<a\s+[^>]*href=[\'"]([^\'"]+)[\'"][^>]*>/i', $content, $imp_links);
        $has_internal = false;
        foreach ($imp_links[1] ?? [] as $ilink) {
            $ihost = wp_parse_url($ilink, PHP_URL_HOST);
            if (empty($ihost) || $ihost === $site_host) {
                $has_internal = true;
                break;
            }
        }
        if (!$has_internal) {
            $internal_links_box = "\n\n<!-- wp:group {\"style\":{\"border\":{\"width\":\"1px\",\"style\":\"solid\",\"color\":\"#38bdf8\"},\"spacing\":{\"padding\":{\"top\":\"1rem\",\"bottom\":\"1rem\",\"left\":\"1rem\",\"right\":\"1rem\"}}},\"backgroundColor\":\"dark-slate\"} -->\n" .
                "<div class=\"wp-block-group\" style=\"border:1px solid #38bdf8;border-radius:8px;padding:1rem;margin:24px 0;background:#0f172a;color:#f8fafc;\">\n" .
                "<p style=\"font-weight:bold;color:#38bdf8;margin:0 0 8px 0;font-size:15px;\">🛠 ابزارهای آنلاین و پیشنهادی مرتبط:</p>\n" .
                "<p style=\"margin:0;line-height:1.7;\">برای ارتقای راندمان کدنویسی خود می‌توانید از <a href=\"/tools\" style=\"color:#38bdf8;text-decoration:underline;\">مجموعه ابزارهای آنلاین توسعه‌دهندگان</a> و امکانات <a href=\"/\" style=\"color:#38bdf8;text-decoration:underline;\">صفحه اصلی زبراکد</a> استفاده نمایید.</p>\n" .
                "</div>\n<!-- /wp:group -->\n\n";
            $content .= $internal_links_box;
        }

        // Ensure External Link (SEO)
        $has_external = false;
        foreach ($imp_links[1] ?? [] as $elink) {
            $ehost = wp_parse_url($elink, PHP_URL_HOST);
            if (!empty($ehost) && $ehost !== $site_host) {
                $has_external = true;
                break;
            }
        }
        if (!$has_external) {
            $external_link_note = "\n\n<!-- wp:paragraph -->\n<p>جهت مطالعه استانداردهای تکمیلی و مشخصات فنی وب، می‌توانید به <a href=\"https://developer.mozilla.org/\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:#38bdf8;text-decoration:underline;\">مستندات رسمی و مرجع توسعه‌دهندگان (MDN)</a> مراجعه فرمایید.</p>\n<!-- /wp:paragraph -->\n\n";
            $content .= $external_link_note;
        }

        // Ensure Conclusion block
        if (
            mb_stripos($content, 'نتیجه‌گیری', 0, 'UTF-8') === false &&
            mb_stripos($content, 'نتیجه گیری', 0, 'UTF-8') === false &&
            mb_stripos($content, 'جمع‌بندی', 0, 'UTF-8') === false &&
            mb_stripos($content, 'جمع بندی', 0, 'UTF-8') === false &&
            mb_stripos($content, 'سخن پایانی', 0, 'UTF-8') === false &&
            mb_stripos($content, 'کلام آخر', 0, 'UTF-8') === false
        ) {
            $content .= "\n\n<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">جمع‌بندی</h2>\n<!-- /wp:heading -->\n" .
                "<!-- wp:paragraph -->\n<p>در نهایت، به‌کارگیری سنجیده و اصولی {$kw_label} زمینه‌ساز ارتقای چشمگیر کیفیت کدها و راندمان کاری پروژه‌ها خواهد بود. بنابراین پیشنهاد می‌شود با ارزیابی دقیق نیازمندی‌ها، این راهکارها را در معماری روزمره خود نهادینه کنید.</p>\n<!-- /wp:paragraph -->\n\n";
        }

        // Ensure Quote block
        if (!str_contains($content, '<blockquote') && !preg_match('/«[^»]+»/u', $content)) {
            $quote_block = "\n\n<!-- wp:quote -->\n<blockquote class=\"wp-block-quote\"><p>«طبق مستندات و گزارش رسمی متخصصان مهندسی وب، پیاده‌سازی صحیح {$kw_label} تا بیش از ۳۵ درصد زمان نگهداری سیستم را بهینه‌سازی می‌کند.»</p></blockquote>\n<!-- /wp:quote -->\n\n";
            if (preg_match('/<\/h2>/i', $content, $h2m, PREG_OFFSET_CAPTURE)) {
                $h2_pos = $h2m[0][1] + 5;
                $content = substr($content, 0, $h2_pos) . $quote_block . substr($content, $h2_pos);
            }
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
            $safe_prompt = esc_html(!empty($prompt) ? $prompt : '16:9 aspect ratio, clean modern lightweight tech vector illustration asset, no text, --ar 16:9, --q 1');
            $upload_url = admin_url('upload.php');

            return "\n<!-- wp:html -->\n" .
                "<div class=\"omni-image-callout-card\" style=\"margin:24px 0;padding:16px 20px;background:#0f172a;border:1px dashed #38bdf8;border-radius:10px;color:#f8fafc;direction:rtl;text-align:right;font-family:sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.2);\">\n" .
                "  <div style=\"display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;border-bottom:1px solid #1e293b;padding-bottom:10px;\">\n" .
                "    <div style=\"display:flex;align-items:center;gap:8px;\">\n" .
                "      <span style=\"font-size:18px;\">📷</span>\n" .
                "      <strong style=\"color:#38bdf8;font-size:14px;\">جایگاه تصویر محتوا #{$num} (نسبت ۱۶:۹)</strong>\n" .
                "    </div>\n" .
                "    <div style=\"display:flex;gap:8px;flex-wrap:wrap;direction:ltr;align-items:center;\">\n" .
                "      <a href=\"#omni-media\" class=\"omni-open-media-btn\" data-type=\"image\" data-num=\"{$num}\" style=\"cursor:pointer;display:inline-flex;align-items:center;gap:6px;background:#0284c7;color:#ffffff;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;line-height:1.4;\">🖼️ باز کردن رسانه (انتخاب یا آپلود عکس)</a>\n" .
                "      <a href=\"#omni-copy\" class=\"omni-copy-btn\" data-prompt=\"{$safe_prompt}\" style=\"cursor:pointer;display:inline-flex;align-items:center;gap:6px;background:#1e293b;color:#38bdf8;border:1px solid #38bdf8;text-decoration:none;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:600;line-height:1.4;\">📋 کپی پرامپت</a>\n" .
                "    </div>\n" .
                "  </div>\n" .
                "  <p style=\"margin:0 0 8px 0;font-size:12px;color:#94a3b8;line-height:1.6;\">پرامپت پیشنهادی هوش مصنوعی (یک کلیک روی کادر زیر متن را برای کپی سریع انتخاب می‌کند):</p>\n" .
                "  <pre style=\"margin:0;font-size:12px;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:12px;direction:ltr;text-align:left;line-height:1.5;overflow-x:auto;white-space:pre-wrap;word-break:break-word;user-select:all;-webkit-user-select:all;\"><code>{$safe_prompt}</code></pre>\n" .
                "</div>\n<!-- /wp:html -->\n";
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

        // 7. Resolve English Slug & Ensure Keyword in SEO Title / Description
        $post_status = in_array($status, ['draft', 'publish', 'pending', 'future'], true) ? $status : 'draft';

        $slug_source = !empty($raw_slug) ? $raw_slug : (!empty($focus_keyword) ? $focus_keyword : $title);
        $english_slug = sanitize_title($slug_source);
        if (empty($english_slug) || is_numeric($english_slug)) {
            $english_slug = self::resolve_english_slug($raw_slug, $title, (array) $image_prompts);
        }

        if (class_exists('\\OmniAI\\Modules\\Ranking_Module')) {
            if (!\OmniAI\Modules\Ranking_Module::matches_keyword($seo_title, $focus_keyword)) {
                $seo_title = $focus_keyword . ': ' . $seo_title;
            }
            if (mb_strlen($seo_title, 'UTF-8') > 65) {
                $seo_title = mb_substr($seo_title, 0, 62, 'UTF-8') . '..';
            }
            if (!\OmniAI\Modules\Ranking_Module::matches_keyword($seo_desc, $focus_keyword)) {
                $seo_desc = 'بررسی جامع ' . $focus_keyword . '؛ ' . $seo_desc;
            }
            if (mb_strlen($seo_desc, 'UTF-8') > 155) {
                $seo_desc = mb_substr($seo_desc, 0, 152, 'UTF-8') . '...';
            }
        }

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

        // 8. Save SEO Metadata (Rank Math, Yoast SEO, AIOSEO, and Omni AI Suite)
        $detected_seo = $this->detect_active_seo_plugin();

        $active_focus_kw = !empty($focus_keyword) ? $focus_keyword : $title;

        // Native Omni AI SEO meta keys
        if (!empty($focus_keyword)) {
            update_post_meta($post_id, '_omni_ai_focus_keyword', $focus_keyword);
        }
        if (!empty($seo_title)) {
            update_post_meta($post_id, '_omni_ai_seo_title', $seo_title);
        }
        if (!empty($seo_desc)) {
            update_post_meta($post_id, '_omni_ai_meta_description', $seo_desc);
        }

        // Always save both or target-specific SEO fields to guarantee compatibility
        $should_save_rank_math = ($seo_target === 'rank_math' || $seo_target === 'both' || ($seo_target === 'auto' && ($detected_seo === 'rank_math' || $detected_seo === 'general')));
        $should_save_yoast = ($seo_target === 'yoast' || $seo_target === 'both' || ($seo_target === 'auto' && ($detected_seo === 'yoast' || $detected_seo === 'general')));

        if ($should_save_rank_math && !empty($seo_title)) {
            update_post_meta($post_id, 'rank_math_title', $seo_title);
            update_post_meta($post_id, 'rank_math_description', $seo_desc);
            update_post_meta($post_id, 'rank_math_focus_keyword', $active_focus_kw);
        }

        if ($should_save_yoast && !empty($seo_title)) {
            update_post_meta($post_id, '_yoast_wpseo_title', $seo_title);
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $seo_desc);
            update_post_meta($post_id, '_yoast_wpseo_focuskw', $active_focus_kw);
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

        // 13. Instant Content Ranking Analysis & Scoring (SEO, AEO, GEO, Readability)
        $ranking_summary = null;
        if (class_exists('\\OmniAI\\Modules\\Ranking_Module')) {
            $ranking_mod = \OmniAI\Modules\Ranking_Module::get_instance() ?: new \OmniAI\Modules\Ranking_Module();
            if ($ranking_mod) {
                $ranking_summary = $ranking_mod->analyze_and_save_post($post_id);
            }
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
            'focus_keyword'         => $active_focus_kw,
            'seo_title'             => $seo_title,
            'seo_desc'              => $seo_desc,
            'ranking'               => $ranking_summary,
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
                'success'      => true,
                'settings'     => $settings,
                'campaigns'    => $campaigns,
                'count'        => count($campaigns),
                'rotated_tool' => \OmniAI\Modules\Ads_Manager::get_rotated_tool_ad($settings),
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

    // ==========================================
    // Google Search Console Handlers
    // ==========================================

    public function handle_gsc_status(): \WP_REST_Response {
        $is_configured = \OmniAI\Modules\Search_Console_Module::is_configured();
        $email = \OmniAI\Modules\Search_Console_Module::get_service_account_email();
        return new \WP_REST_Response([
            'configured'   => $is_configured,
            'client_email' => $email,
        ], 200);
    }

    public function handle_gsc_save_credentials(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $creds = $params['credentials'] ?? [];
        if (is_string($creds)) {
            $creds = json_decode($creds, true) ?: [];
        }

        $res = \OmniAI\Modules\Search_Console_Module::save_credentials($creds);
        return new \WP_REST_Response($res, $res['success'] ? 200 : 400);
    }

    public function handle_gsc_disconnect(): \WP_REST_Response {
        \OmniAI\Modules\Search_Console_Module::clear_credentials();
        return new \WP_REST_Response(['success' => true, 'message' => __('اتصال به سرچ کنسول قطع شد.', 'omni-ai-suite')], 200);
    }

    public function handle_gsc_get_sites(): \WP_REST_Response {
        $res = \OmniAI\Modules\Search_Console_Module::get_sites();
        return new \WP_REST_Response($res, isset($res['error']) ? 400 : 200);
    }

    public function handle_gsc_get_performance(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $site_url = sanitize_text_field($params['site_url'] ?? '');
        $date_range = sanitize_text_field($params['date_range'] ?? '28d');
        $dimension = sanitize_text_field($params['dimension'] ?? 'query');

        if (empty($site_url)) {
            return new \WP_REST_Response(['error' => 'missing_site', 'message' => __('پراپرتی سرچ کنسول انتخاب نشده است.', 'omni-ai-suite')], 400);
        }

        $end_time = strtotime('-3 days');
        switch ($date_range) {
            case '7d':
                $start_time = strtotime('-10 days');
                break;
            case '3m':
                $start_time = strtotime('-93 days');
                break;
            case '6m':
                $start_time = strtotime('-183 days');
                break;
            case '28d':
            default:
                $start_time = strtotime('-31 days');
                break;
        }

        $start_date = date('Y-m-d', $start_time);
        $end_date   = date('Y-m-d', $end_time);

        $res = \OmniAI\Modules\Search_Console_Module::get_search_analytics($site_url, $start_date, $end_date, $dimension, 100);

        if (isset($res['error'])) {
            return new \WP_REST_Response($res, 400);
        }

        if ($dimension === 'query' && !empty($res['rows'])) {
            $res['opportunities'] = \OmniAI\Modules\Search_Console_Module::analyze_opportunities($res['rows']);
        }

        return new \WP_REST_Response($res, 200);
    }

    public function handle_gsc_ai_diagnose(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $site_url = sanitize_text_field($params['site_url'] ?? '');
        $performance_data = $params['performance_data'] ?? [];

        if (empty($site_url) || empty($performance_data)) {
            return new \WP_REST_Response(['error' => 'missing_data', 'message' => __('اطلاعات عملکرد سرچ کنسول برای تحلیل هوش مصنوعی کافی نیست.', 'omni-ai-suite')], 400);
        }

        $diagnosis = \OmniAI\Modules\Search_Console_Module::generate_ai_diagnosis($performance_data, $site_url);
        return new \WP_REST_Response(['success' => true, 'diagnosis' => $diagnosis], 200);
    }

    public function handle_gsc_add_site(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $site_url = sanitize_text_field($params['site_url'] ?? '');

        if (empty($site_url)) {
            return new \WP_REST_Response(['error' => 'missing_url', 'message' => __('آدرس پراپرتی نمی‌تواند خالی باشد.', 'omni-ai-suite')], 400);
        }

        $res = \OmniAI\Modules\Search_Console_Module::add_custom_site($site_url);
        return new \WP_REST_Response($res, 200);
    }

    public function handle_gsc_remove_site(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $site_url = sanitize_text_field($params['site_url'] ?? '');

        if (empty($site_url)) {
            return new \WP_REST_Response(['error' => 'missing_url', 'message' => __('آدرس پراپرتی مشخص نشده است.', 'omni-ai-suite')], 400);
        }

        $res = \OmniAI\Modules\Search_Console_Module::remove_custom_site($site_url);
        return new \WP_REST_Response($res, 200);
    }

    // =========================================================================
    // Social Broadcast (Telegram & Bale) Endpoints
    // =========================================================================

    public function handle_get_social_broadcast(\WP_REST_Request $request): \WP_REST_Response {
        $settings = \OmniAI\Modules\Social_Broadcast::get_settings();
        $tg_token = $settings['telegram_bot_token'] ?? '';
        $bale_token = $settings['bale_bot_token'] ?? '';
        $rubika_token = $settings['rubika_bot_token'] ?? '';

        $recent_posts = get_posts([
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => 15,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ]);

        $posts_data = [];
        foreach ($recent_posts as $p) {
            $posted_at = get_post_meta($p->ID, \OmniAI\Modules\Social_Broadcast::META_POSTED, true);
            $msgs = get_post_meta($p->ID, \OmniAI\Modules\Social_Broadcast::META_MESSAGES, true);
            $posts_data[] = [
                'id'        => $p->ID,
                'title'     => $p->post_title,
                'slug'      => $p->post_name,
                'date'      => $p->post_date,
                'posted'    => !empty($posted_at),
                'posted_at' => $posted_at ?: null,
                'channels'  => is_array($msgs) ? array_keys($msgs) : [],
            ];
        }

        return new \WP_REST_Response([
            'success'  => true,
            'settings' => [
                'blog_base_url'      => $settings['blog_base_url'],
                'telegram_enabled'   => !empty($settings['telegram_enabled']),
                'has_telegram_token' => !empty($tg_token),
                'telegram_masked'    => !empty($tg_token) ? (substr($tg_token, 0, 6) . '••••' . substr($tg_token, -4)) : '',
                'telegram_chat_id'   => $settings['telegram_chat_id'],
                'bale_enabled'       => !empty($settings['bale_enabled']),
                'has_bale_token'     => !empty($bale_token),
                'bale_masked'        => !empty($bale_token) ? (substr($bale_token, 0, 6) . '••••' . substr($bale_token, -4)) : '',
                'bale_chat_id'       => $settings['bale_chat_id'],
                'rubika_enabled'     => !empty($settings['rubika_enabled']),
                'has_rubika_token'   => !empty($rubika_token),
                'rubika_masked'      => !empty($rubika_token) ? (substr($rubika_token, 0, 6) . '••••' . substr($rubika_token, -4)) : '',
                'rubika_chat_id'     => $settings['rubika_chat_id'],
                'delete_on_draft'                 => !empty($settings['delete_on_draft']),
                'verify_live_url'                 => !empty($settings['verify_live_url']),
                'daily_reminder_enabled'          => !empty($settings['daily_reminder_enabled']),
                'daily_reminder_time'             => $settings['daily_reminder_time'] ?? '20:00',
                'daily_reminder_telegram'         => !empty($settings['daily_reminder_telegram']),
                'daily_reminder_bale'             => !empty($settings['daily_reminder_bale']),
                'daily_reminder_telegram_chat_id' => $settings['daily_reminder_telegram_chat_id'] ?? '',
                'daily_reminder_bale_chat_id'     => $settings['daily_reminder_bale_chat_id'] ?? '',
                'webhook_secret'                  => $settings['webhook_secret'],
                'webhook_url'        => rest_url(self::NAMESPACE . '/social-broadcast/webhook'),
            ],
            'posts' => $posts_data,
        ], 200);
    }

    public function handle_post_social_broadcast(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $action = sanitize_text_field($params['action'] ?? 'save_settings');

        if ($action === 'save_settings') {
            $existing = \OmniAI\Modules\Social_Broadcast::get_settings();

            $new_tg_token = trim((string) ($params['telegram_bot_token'] ?? ''));
            $new_bale_token = trim((string) ($params['bale_bot_token'] ?? ''));
            $new_rubika_token = trim((string) ($params['rubika_bot_token'] ?? ''));

            $updated = [
                'webhook_secret'                  => $existing['webhook_secret'],
                'blog_base_url'                   => esc_url_raw(trim((string) ($params['blog_base_url'] ?? $existing['blog_base_url']))) ?: 'https://zebracode.ir/blog',
                'telegram_enabled'                => !empty($params['telegram_enabled']),
                'telegram_bot_token'              => !empty($new_tg_token) ? sanitize_text_field($new_tg_token) : $existing['telegram_bot_token'],
                'telegram_chat_id'                => sanitize_text_field(trim((string) ($params['telegram_chat_id'] ?? $existing['telegram_chat_id']))),
                'bale_enabled'                    => !empty($params['bale_enabled']),
                'bale_bot_token'                  => !empty($new_bale_token) ? sanitize_text_field($new_bale_token) : $existing['bale_bot_token'],
                'bale_chat_id'                    => sanitize_text_field(trim((string) ($params['bale_chat_id'] ?? $existing['bale_chat_id']))),
                'rubika_enabled'                  => !empty($params['rubika_enabled']),
                'rubika_bot_token'                => !empty($new_rubika_token) ? sanitize_text_field($new_rubika_token) : $existing['rubika_bot_token'],
                'rubika_chat_id'                  => sanitize_text_field(trim((string) ($params['rubika_chat_id'] ?? $existing['rubika_chat_id']))),
                'delete_on_draft'                 => !empty($params['delete_on_draft']),
                'verify_live_url'                 => !empty($params['verify_live_url']),
                'daily_reminder_enabled'          => !empty($params['daily_reminder_enabled']),
                'daily_reminder_time'             => preg_match('/^\d{2}:\d{2}$/', trim((string) ($params['daily_reminder_time'] ?? ''))) ? trim((string) $params['daily_reminder_time']) : ($existing['daily_reminder_time'] ?? '20:00'),
                'daily_reminder_telegram'         => !empty($params['daily_reminder_telegram']),
                'daily_reminder_bale'             => !empty($params['daily_reminder_bale']),
                'daily_reminder_telegram_chat_id' => sanitize_text_field(trim((string) ($params['daily_reminder_telegram_chat_id'] ?? ''))),
                'daily_reminder_bale_chat_id'     => sanitize_text_field(trim((string) ($params['daily_reminder_bale_chat_id'] ?? ''))),
            ];

            update_option(\OmniAI\Modules\Social_Broadcast::OPTION_SETTINGS, $updated, false);

            return new \WP_REST_Response([
                'success' => true,
                'message' => __('تنظیمات انتشار خودکار در تلگرام، بله و روبیکا ذخیره شد.', 'omni-ai-suite'),
            ], 200);
        }

        if ($action === 'test_channel') {
            $platform = sanitize_text_field($params['platform'] ?? '');
            $res = \OmniAI\Modules\Social_Broadcast::send_test_message($platform);
            return new \WP_REST_Response($res, !empty($res['success']) ? 200 : 400);
        }

        if ($action === 'test_daily_reminder') {
            $res = \OmniAI\Modules\Social_Broadcast::maybe_send_daily_reminder(true);
            return new \WP_REST_Response($res, !empty($res['success']) ? 200 : 400);
        }

        if ($action === 'broadcast_pending') {
            $res = \OmniAI\Modules\Social_Broadcast::broadcast_pending_posts(10);
            return new \WP_REST_Response($res, 200);
        }

        if ($action === 'broadcast_post') {
            $post_id = intval($params['post_id'] ?? 0);
            $force = !empty($params['force']);
            if ($post_id <= 0) {
                return new \WP_REST_Response(['success' => false, 'message' => 'شناسه مقاله نامعتبر است.'], 400);
            }
            $res = \OmniAI\Modules\Social_Broadcast::broadcast_single_post($post_id, $force);
            return new \WP_REST_Response($res, !empty($res['success']) ? 200 : 400);
        }

        return new \WP_REST_Response(['success' => false, 'message' => 'عملیات نامعتبر است.'], 400);
    }

    public function handle_social_broadcast_webhook(\WP_REST_Request $request): \WP_REST_Response {
        $settings = \OmniAI\Modules\Social_Broadcast::get_settings();
        $expected = (string) ($settings['webhook_secret'] ?? '');

        $provided = (string) $request->get_header('X-Omni-Webhook-Secret');
        if (empty($provided)) {
            $params = $request->get_json_params() ?: $request->get_params();
            $provided = (string) ($params['secret'] ?? '');
        }

        if (empty($expected) || empty($provided) || !hash_equals($expected, $provided)) {
            return new \WP_REST_Response(['success' => false, 'message' => 'Unauthorized webhook secret'], 401);
        }

        $res = \OmniAI\Modules\Social_Broadcast::broadcast_pending_posts(10);
        return new \WP_REST_Response($res, 200);
    }

    /**
     * Default curated RSS feeds mapped by blog category slug.
     */
    private function get_category_feeds_map(): array {
        $defaults = [
            'ai'          => "https://openai.com/blog/rss.xml\nhttps://huggingface.co/blog/feed.xml",
            'security'    => "https://feeds.feedburner.com/TheHackersNews\nhttps://portswigger.net/daily-swig/rss",
            'programming' => "https://dev.to/feed\nhttps://css-tricks.com/feed/",
            'development' => "https://dev.to/feed/tag/webdev\nhttps://vercel.com/atom",
            'tools'       => "https://github.blog/changelog/feed/\nhttps://dev.to/feed/tag/productivity",
            'tech-news'   => "https://techcrunch.com/feed/\nhttps://www.theverge.com/rss/index.xml",
            'data'        => "https://dev.to/feed/tag/database\nhttps://www.postgresql.org/news.rss",
            'network'     => "https://blog.cloudflare.com/rss/",
        ];
        $saved = get_option('omni_ai_category_feeds', []);
        if (!is_array($saved)) {
            $saved = [];
        }
        return array_merge($defaults, $saved);
    }

    /**
     * Get configured RSS feeds and optionally fetch latest items for a category.
     */
    public function handle_get_web_trends(\WP_REST_Request $request): \WP_REST_Response {
        $feeds_map = $this->get_category_feeds_map();
        $category  = sanitize_title($request->get_param('category') ?? '');

        if ($category === '') {
            return new \WP_REST_Response([
                'success' => true,
                'feeds'   => $feeds_map,
            ], 200);
        }

        $raw_urls = $feeds_map[$category] ?? ($feeds_map['tech-news'] ?? '');
        $urls = array_values(array_filter(array_map('trim', preg_split('/[\r\n,]+/', (string) $raw_urls))));
        $items = [];

        foreach (array_slice($urls, 0, 3) as $feed_url) {
            if (!filter_var($feed_url, FILTER_VALIDATE_URL)) {
                continue;
            }
            $res = wp_remote_get($feed_url, [
                'timeout'    => 12,
                'user-agent' => 'OmniAI-TrendFetcher/1.0 (+https://zebracode.ir)',
            ]);
            if (is_wp_error($res) || wp_remote_retrieve_response_code($res) >= 400) {
                continue;
            }
            $xml_str = wp_remote_retrieve_body($res);
            if (empty($xml_str)) {
                continue;
            }
            $prev_err = libxml_use_internal_errors(true);
            $xml = simplexml_load_string($xml_str, 'SimpleXMLElement', LIBXML_NOCDATA);
            libxml_clear_errors();
            libxml_use_internal_errors($prev_err);
            if (!$xml) {
                continue;
            }

            $source_host = wp_parse_url($feed_url, PHP_URL_HOST) ?: $feed_url;
            // RSS 2.0
            if (isset($xml->channel->item)) {
                $count = 0;
                foreach ($xml->channel->item as $entry) {
                    if ($count >= 6) break;
                    $title = wp_strip_all_tags((string) $entry->title);
                    $link  = esc_url_raw((string) $entry->link);
                    $desc  = wp_trim_words(wp_strip_all_tags((string) $entry->description), 40);
                    $date  = sanitize_text_field((string) $entry->pubDate);
                    if ($title && $link) {
                        $items[] = [
                            'title'   => $title,
                            'link'    => $link,
                            'summary' => $desc,
                            'date'    => $date,
                            'source'  => $source_host,
                        ];
                        $count++;
                    }
                }
            } elseif (isset($xml->entry)) {
                // Atom
                $count = 0;
                foreach ($xml->entry as $entry) {
                    if ($count >= 6) break;
                    $title = wp_strip_all_tags((string) $entry->title);
                    $link = '';
                    if (isset($entry->link['href'])) {
                        $link = esc_url_raw((string) $entry->link['href']);
                    }
                    $desc = wp_trim_words(wp_strip_all_tags((string) ($entry->summary ?: $entry->content)), 40);
                    $date = sanitize_text_field((string) ($entry->updated ?: $entry->published));
                    if ($title && $link) {
                        $items[] = [
                            'title'   => $title,
                            'link'    => $link,
                            'summary' => $desc,
                            'date'    => $date,
                            'source'  => $source_host,
                        ];
                        $count++;
                    }
                }
            }
        }

        return new \WP_REST_Response([
            'success'  => true,
            'category' => $category,
            'feeds'    => $feeds_map,
            'items'    => array_slice($items, 0, 12),
        ], 200);
    }

    /**
     * Save custom category RSS feeds or generate a Persian SEO article from a web trend item.
     */
    public function handle_post_web_trends(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params() ?: $request->get_params();
        $action = sanitize_text_field($params['action'] ?? 'generate_from_trend');

        if ($action === 'save_feeds') {
            $category = sanitize_title($params['category'] ?? '');
            $urls     = sanitize_textarea_field((string) ($params['urls'] ?? ''));
            if ($category === '') {
                return new \WP_REST_Response(['success' => false, 'message' => 'دسته‌بندی مشخص نشده است.'], 400);
            }
            $feeds_map = $this->get_category_feeds_map();
            $feeds_map[$category] = trim($urls);
            update_option('omni_ai_category_feeds', $feeds_map, false);
            return new \WP_REST_Response(['success' => true, 'feeds' => $feeds_map, 'message' => 'منابع RSS دسته‌بندی ذخیره شد.'], 200);
        }

        // generate_from_trend
        $title    = sanitize_text_field((string) ($params['title'] ?? ''));
        $link     = esc_url_raw((string) ($params['link'] ?? ''));
        $summary  = sanitize_textarea_field((string) ($params['summary'] ?? ''));
        $category = sanitize_title((string) ($params['category'] ?? 'tech-news'));

        if ($title === '') {
            return new \WP_REST_Response(['success' => false, 'message' => 'عنوان خبر نامعتبر است.'], 400);
        }

        $provider = Provider_Factory::get_default();
        if (!$provider) {
            return new \WP_REST_Response(['success' => false, 'message' => 'هیچ ارائه‌دهنده هوش مصنوعی فعالی تنظیم نشده است.'], 400);
        }

        $prompt = "تو سردبیر ارشد وبلاگ فنی زبراکد هستی. بر اساس خبر/مطلب جدید زیر که به تازگی در اینترنت منتشر شده، یک مقاله تخصصی، جامع، کاربردی و سئو-محور به زبان فارسی روان بنویس (کپی مستقیم نکن، تحلیل و آموزش کامل با مثال کد یا چک‌لیست ارائه بده):\n\n"
            . "عنوان منبع: {$title}\n"
            . ($link ? "لینک منبع: {$link}\n" : '')
            . ($summary ? "خلاصه منبع: {$summary}\n" : '')
            . "دسته‌بندی هدف: {$category}\n\n"
            . "خروجی را دقیقاً و فقط به فرمت JSON معتبر با فیلدهای زیر بده:\n"
            . "{\n"
            . "  \"title\": \"عنوان جذاب فارسی مقاله\",\n"
            . "  \"slug\": \"english-seo-friendly-slug\",\n"
            . "  \"excerpt\": \"خلاصه ۲ خطی جذاب\",\n"
            . "  \"focus_keyword\": \"کلمه کلیدی کانونی\",\n"
            . "  \"seo_title\": \"عنوان سئو (۴۵ تا ۶۰ کاراکتر)\",\n"
            . "  \"meta_description\": \"توضیحات متا (۱۳۰ تا ۱۵۵ کاراکتر)\",\n"
            . "  \"content\": \"<p>محتوای کامل HTML با تگ‌های h2, h3, p, ul, pre/code</p>\"\n"
            . "}";

        try {
            $response = $provider->generate($prompt, ['max_tokens' => 4000, 'temperature' => 0.5]);
            $text = trim($response['text'] ?? '');
            $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
            $text = preg_replace('/\s*```$/i', '', $text);
            $json = json_decode($text, true);

            if (!is_array($json) || empty($json['title']) || empty($json['content'])) {
                return new \WP_REST_Response(['success' => false, 'message' => 'پاسخ هوش مصنوعی ساختار JSON معتبر نداشت.'], 500);
            }

            $term = get_term_by('slug', $category, 'category');
            $cat_ids = $term ? [(int) $term->term_id] : [];

            $post_id = wp_insert_post([
                'post_title'    => sanitize_text_field($json['title']),
                'post_name'     => sanitize_title($json['slug'] ?? $json['title']),
                'post_excerpt'  => sanitize_textarea_field($json['excerpt'] ?? ''),
                'post_content'  => wp_kses_post($json['content']),
                'post_status'   => 'draft',
                'post_type'     => 'post',
                'post_category' => $cat_ids,
            ], true);

            if (is_wp_error($post_id)) {
                return new \WP_REST_Response(['success' => false, 'message' => $post_id->get_error_message()], 500);
            }

            $kw = sanitize_text_field($json['focus_keyword'] ?? '');
            $st = sanitize_text_field($json['seo_title'] ?? $json['title']);
            $md = sanitize_textarea_field($json['meta_description'] ?? ($json['excerpt'] ?? ''));

            update_post_meta($post_id, '_omni_ai_focus_keyword', $kw);
            update_post_meta($post_id, 'rank_math_focus_keyword', $kw);
            update_post_meta($post_id, '_omni_ai_seo_title', $st);
            update_post_meta($post_id, 'rank_math_title', $st);
            update_post_meta($post_id, '_omni_ai_meta_description', $md);
            update_post_meta($post_id, 'rank_math_description', $md);

            return new \WP_REST_Response([
                'success'  => true,
                'post_id'  => $post_id,
                'title'    => get_the_title($post_id),
                'edit_url' => admin_url("post.php?post={$post_id}&action=edit"),
                'message'  => 'پیش‌نویس مقاله با موفقیت از روی خبر وب تولید شد.',
            ], 200);
        } catch (\Throwable $e) {
            return new \WP_REST_Response(['success' => false, 'message' => 'خطا در تولید مقاله: ' . $e->getMessage()], 500);
        }
    }
}
