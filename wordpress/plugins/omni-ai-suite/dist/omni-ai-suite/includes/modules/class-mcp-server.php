<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * سرور پروتکل رسمی متنی مدل (Model Context Protocol - MCP)
 * پشتیبانی از JSON-RPC 2.0، Server-Sent Events (SSE)، لاگ ترافیک و ابزارهای مدیریت وردپرس
 */
class Mcp_Server {

    /**
     * ثبت مسیرهای REST اختصاصی سرور MCP
     */
    public function register_routes(): void {
        $mcp_route_args = [
            'methods'             => ['GET', 'POST', 'OPTIONS', 'HEAD', 'DELETE'],
            'callback'            => [$this, 'handle_rest_mcp'],
            'permission_callback' => '__return_true',
        ];
        register_rest_route('omni-ai/v1', '/mcp', $mcp_route_args);
        register_rest_route('omni-ai/v1', '/mcp/(?P<subpath>.*)', $mcp_route_args);

        register_rest_route('omni-ai/v1', '/mcp-logs', [
            'methods'             => ['GET'],
            'callback'            => [$this, 'handle_rest_mcp_logs'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * گزارش لاگ درخواست‌های ارسالی به سرور MCP (جهت عیب‌یابی اتصال کلاینت‌ها مانند Grok)
     */
    public function handle_rest_mcp_logs(\WP_REST_Request $request): \WP_REST_Response {
        $logs = get_option('omni_mcp_traffic_logs', []);
        return new \WP_REST_Response([
            'status' => 'active',
            'count'  => is_array($logs) ? count($logs) : 0,
            'logs'   => is_array($logs) ? $logs : [],
        ], 200, [
            'Access-Control-Allow-Origin' => '*',
            'Content-Type'                => 'application/json; charset=utf-8',
        ]);
    }

    /**
     * هندلر اصلی درخواست‌های سرور MCP
     */
    public function handle_rest_mcp(\WP_REST_Request $request): \WP_REST_Response {
        // ۱. ثبت ترافیک ورودی سرور جهت عیب‌یابی اتصال کلاینت‌ها (مانند Grok Connectors)
        $raw_body = $request->get_body();
        $headers  = function_exists('getallheaders') ? getallheaders() : [];
        $log_entry = [
            'time'       => current_time('mysql'),
            'ip'         => $_SERVER['REMOTE_ADDR'] ?? '',
            'method'     => $request->get_method(),
            'uri'        => $_SERVER['REQUEST_URI'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'headers'    => $headers,
            'body'       => mb_substr($raw_body, 0, 1000, 'UTF-8'),
        ];
        $logs = get_option('omni_mcp_traffic_logs', []);
        if (!is_array($logs)) {
            $logs = [];
        }
        array_unshift($logs, $log_entry);
        if (count($logs) > 40) {
            $logs = array_slice($logs, 0, 40);
        }
        update_option('omni_mcp_traffic_logs', $logs, false);

        $default_cors = [
            'Access-Control-Allow-Origin'  => '*',
            'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS, HEAD, DELETE',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, Mcp-Session-Id, MCP-Protocol-Version, mcp-session-id, mcp-protocol-version, Accept, Origin',
            'Access-Control-Expose-Headers'=> 'Mcp-Session-Id, MCP-Protocol-Version, mcp-session-id, mcp-protocol-version, Link',
            'mcp-session-id'               => 'omni-ai-mcp-session',
            'mcp-protocol-version'         => '2026-07-28',
        ];

        $settings = get_option('omni_ai_ranking_settings', []);
        $enabled  = $settings['enable_mcp_server'] ?? true;
        if (!$enabled) {
            return new \WP_REST_Response([
                'jsonrpc' => '2.0',
                'error'   => ['code' => -32600, 'message' => 'MCP Server is currently disabled in plugin settings.'],
            ], 403, $default_cors);
        }

        $http_method = strtoupper($request->get_method());
        if ($http_method === 'OPTIONS' || $http_method === 'HEAD') {
            return new \WP_REST_Response(null, 200, array_merge($default_cors, [
                'Allow' => 'GET, POST, OPTIONS, HEAD, DELETE',
            ]));
        }

        if ($http_method === 'DELETE') {
            return new \WP_REST_Response([
                'status'  => 'closed',
                'message' => 'MCP session closed.',
            ], 200, $default_cors);
        }

        if ($http_method === 'GET') {
            $accept = $request->get_header('accept') ?: '';
            if (strpos($accept, 'text/event-stream') !== false) {
                // پشتیبانی کامل و پایدار از Server-Sent Events (SSE)
                if (function_exists('apache_setenv')) {
                    @apache_setenv('no-gzip', '1');
                }
                @ini_set('zlib.output_compression', '0');
                @ini_set('implicit_flush', '1');
                @set_time_limit(180);
                @ignore_user_abort(true);

                header('Content-Type: text/event-stream; charset=utf-8');
                header('Cache-Control: no-cache, no-transform, no-store');
                header('Connection: keep-alive');
                header('X-Accel-Buffering: no');
                header('Access-Control-Allow-Origin: *');
                header('mcp-session-id: omni-ai-mcp-session');
                header('mcp-protocol-version: 2026-07-28');

                echo "event: endpoint\n";
                echo "data: " . rest_url('omni-ai/v1/mcp') . "\n\n";
                if (function_exists('ob_flush')) { @ob_flush(); }
                flush();

                // نگه‌داشتن ارتباط زنده با ارسال ضربان‌های متناوب تا زمان قطع شدن اتصال توسط کلاینت
                $start = time();
                while (time() - $start < 120) {
                    if (connection_aborted() || connection_status() !== CONNECTION_NORMAL) {
                        break;
                    }
                    sleep(2);
                    echo ": keepalive\n\n";
                    if (function_exists('ob_flush')) { @ob_flush(); }
                    flush();
                }
                exit;
            }

            return new \WP_REST_Response([
                'jsonrpc'         => '2.0',
                'name'            => 'omni-ai-wordpress-mcp',
                'version'         => '1.0.0',
                'protocolVersion' => '2026-07-28',
                'status'          => 'active',
                'description'     => 'Official Model Context Protocol (MCP) Server for ' . get_bloginfo('name'),
                'capabilities'    => [
                    'tools'     => ['listChanged' => false],
                    'resources' => ['subscribe' => false, 'listChanged' => false],
                    'prompts'   => ['listChanged' => false],
                    'logging'   => new \stdClass(),
                ],
                'serverInfo'      => [
                    'name'    => 'omni-ai-wordpress-mcp',
                    'version' => '1.0.0',
                ],
                'endpoint'        => rest_url('omni-ai/v1/mcp'),
            ], 200, $default_cors);
        }

        // بررسی و پارس دقیق JSON-RPC
        $body = $request->get_json_params();
        if (empty($body) && !empty($raw_body)) {
            $decoded = json_decode($raw_body, true);
            if (is_array($decoded)) {
                $body = $decoded;
            }
        }
        if (!is_array($body)) {
            $body = [];
        }

        // پشتیبانی از Batch JSON-RPC
        if (isset($body[0]) && is_array($body[0])) {
            $batch_responses = [];
            foreach ($body as $single_req) {
                if (is_array($single_req)) {
                    $batch_responses[] = $this->dispatch_single_mcp_message($single_req);
                }
            }
            return new \WP_REST_Response($batch_responses, 200, $default_cors);
        }

        $res = $this->dispatch_single_mcp_message($body);
        return new \WP_REST_Response($res, 200, $default_cors);
    }

    public function dispatch_single_mcp_message(array $body): array {
        $id     = $body['id'] ?? 1;
        $method = $body['method'] ?? '';
        $params = $body['params'] ?? [];

        switch ($method) {
            case 'ping':
                return [
                    'jsonrpc' => '2.0',
                    'id'      => $id,
                    'result'  => new \stdClass(),
                ];

            case 'notifications/initialized':
            case 'initialized':
                return [
                    'jsonrpc' => '2.0',
                    'result'  => new \stdClass(),
                ];

            case 'roots/list':
                return [
                    'jsonrpc' => '2.0',
                    'id'      => $id,
                    'result'  => [
                        'roots' => [],
                    ],
                ];

            case 'logging/setLevel':
                return [
                    'jsonrpc' => '2.0',
                    'id'      => $id,
                    'result'  => new \stdClass(),
                ];

            case 'prompts/list':
                return [
                    'jsonrpc' => '2.0',
                    'id'      => $id,
                    'result'  => [
                        'prompts' => [],
                    ],
                ];

            case 'server/discover':
                return [
                    'jsonrpc' => '2.0',
                    'id'      => $id,
                    'result'  => [
                        'resultType'        => 'complete',
                        'supportedVersions' => [
                            '2026-07-28',
                            '2025-11-25',
                            '2025-06-18',
                            '2024-11-05',
                        ],
                        'protocolVersion'   => '2026-07-28',
                        'capabilities'      => [
                            'tools'     => ['listChanged' => false],
                            'resources' => ['subscribe' => false, 'listChanged' => false],
                            'prompts'   => ['listChanged' => false],
                        ],
                        'serverInfo'        => [
                            'name'    => 'omni-ai-wordpress-mcp',
                            'version' => '1.0.0',
                        ],
                        '_meta'             => [
                            'io.modelcontextprotocol/serverInfo' => [
                                'name'    => 'omni-ai-wordpress-mcp',
                                'version' => '1.0.0',
                            ],
                        ],
                        'instructions'      => 'Official Omni AI Suite WordPress Model Context Protocol Server for managing articles, content ranking, and automated publishing.',
                        'ttlMs'             => 3600000,
                        'cacheScope'        => 'public',
                    ],
                ];

            case 'initialize':
                $client_version = $params['protocolVersion'] ?? '2024-11-05';
                return [
                    'jsonrpc' => '2.0',
                    'id'      => $id,
                    'result'  => [
                        'protocolVersion' => $client_version,
                        'capabilities'    => [
                            'tools'     => ['listChanged' => false],
                            'resources' => ['subscribe' => false, 'listChanged' => false],
                            'prompts'   => ['listChanged' => false],
                            'logging'   => new \stdClass(),
                        ],
                        'serverInfo'      => [
                            'name'    => 'omni-ai-wordpress-mcp',
                            'version' => '1.0.0',
                        ],
                    ],
                ];

            case 'tools/list':
                return [
                    'jsonrpc' => '2.0',
                    'id'      => $id,
                    'result'  => [
                        'tools' => $this->get_mcp_tools(),
                    ],
                ];

            case 'tools/call':
                $tool_name = $params['name'] ?? '';
                $tool_args = $params['arguments'] ?? [];
                $result_text = $this->execute_mcp_tool($tool_name, $tool_args);

                return [
                    'jsonrpc' => '2.0',
                    'id'      => $id,
                    'result'  => [
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => $result_text,
                            ],
                        ],
                    ],
                ];

            case 'resources/list':
                return [
                    'jsonrpc' => '2.0',
                    'id'      => $id,
                    'result'  => [
                        'resources' => [
                            [
                                'uri'         => 'omni://llms.txt',
                                'name'        => 'LLMS.txt Site Summary',
                                'mimeType'    => 'text/markdown',
                                'description' => 'استاندارد خلاصه سایت برای مدل‌های زبانی',
                            ],
                            [
                                'uri'         => 'omni://llms-full.txt',
                                'name'        => 'LLMS-Full.txt Full Content',
                                'mimeType'    => 'text/markdown',
                                'description' => 'محتوای کامل متنی مقالات اخیر برای هوش مصنوعی',
                            ],
                        ],
                    ],
                ];

            case 'resources/templates/list':
                return [
                    'jsonrpc' => '2.0',
                    'id'      => $id,
                    'result'  => [
                        'resourceTemplates' => [],
                    ],
                ];

            case 'resources/read':
                $uri  = $params['uri'] ?? '';
                $text = '';
                $llms_manager = new Llms_Txt_Manager();
                if ($uri === 'omni://llms.txt') {
                    $text = $llms_manager->generate_llms_content(false);
                } elseif ($uri === 'omni://llms-full.txt') {
                    $text = $llms_manager->generate_llms_content(true);
                } else {
                    return [
                        'jsonrpc' => '2.0',
                        'id'      => $id,
                        'error'   => ['code' => -32602, 'message' => 'Resource URI not found.'],
                    ];
                }

                return [
                    'jsonrpc' => '2.0',
                    'id'      => $id,
                    'result'  => [
                        'contents' => [
                            [
                                'uri'      => $uri,
                                'mimeType' => 'text/markdown',
                                'text'     => $text,
                            ],
                        ],
                    ],
                ];

            default:
                if (!empty($method) && strpos($method, 'notifications/') === 0) {
                    return [
                        'jsonrpc' => '2.0',
                        'result'  => new \stdClass(),
                    ];
                }

                return [
                    'jsonrpc' => '2.0',
                    'id'      => $id,
                    'error'   => ['code' => -32601, 'message' => "Method '{$method}' not supported."],
                ];
        }
    }

    /**
     * فهرست تعریف ابزارهای سرور MCP
     */
    public function get_mcp_tools(): array {
        return [
            [
                'name'        => 'search_posts',
                'title'       => 'Search Posts',
                'description' => 'Search published WordPress articles by keyword and limit. (جستجو در مقالات سایت)',
                'inputSchema' => [
                    'type'       => 'object',
                    'properties' => [
                        'query' => ['type' => 'string', 'description' => 'Search term or keyword'],
                        'limit' => ['type' => 'integer', 'description' => 'Maximum number of articles to return (default 5)'],
                    ],
                    'required'   => [],
                ],
            ],
            [
                'name'        => 'get_post',
                'title'       => 'Get Post Content',
                'description' => 'Fetch full structured text content of a post by ID. (دریافت متن کامل نوشته)',
                'inputSchema' => [
                    'type'       => 'object',
                    'properties' => [
                        'id' => ['type' => 'integer', 'description' => 'Post ID'],
                    ],
                    'required'   => ['id'],
                ],
            ],
            [
                'name'        => 'get_site_summary',
                'title'       => 'Get Site Summary',
                'description' => 'Get site summary, topics, categories, and structure for AI models. (خلاصه سایت و موضوعات)',
                'inputSchema' => [
                    'type'       => 'object',
                    'properties' => new \stdClass(),
                    'required'   => [],
                ],
            ],
            [
                'name'        => 'get_content_ranking',
                'title'       => 'Get Content Ranking',
                'description' => 'Evaluate post readiness for AI engines (SEO, AEO, GEO) with improvement tips. (ارزیابی رتبه محتوا)',
                'inputSchema' => [
                    'type'       => 'object',
                    'properties' => [
                        'id' => ['type' => 'integer', 'description' => 'Post ID'],
                    ],
                    'required'   => ['id'],
                ],
            ],
            [
                'name'        => 'create_post',
                'title'       => 'Create or Publish Post',
                'description' => 'Create or publish a new article in WordPress following SEO/AEO publishing rules (English URL slug, complete image metadata with alt text, duplicate prevention, and AI ranking calculation).',
                'inputSchema' => [
                    'type'       => 'object',
                    'properties' => [
                        'title'             => ['type' => 'string', 'description' => 'Article title (عنوان مقاله)'],
                        'content'           => ['type' => 'string', 'description' => 'Full structured content with H2, H3 headings, paragraphs, and bullet points'],
                        'slug'              => ['type' => 'string', 'description' => 'Mandatory rule: English URL slug in kebab-case format (e.g. ai-agents-guide-2026). Must contain ONLY English lowercase letters, numbers, and hyphens.'],
                        'status'            => ['type' => 'string', 'enum' => ['draft', 'publish', 'pending'], 'description' => 'Publication status: draft or publish. Default: draft'],
                        'excerpt'           => ['type' => 'string', 'description' => 'Meta description / excerpt (120-160 characters for SEO search snippet)'],
                        'category_names'    => [
                            'type'        => 'array',
                            'items'       => [
                                'type' => 'string',
                                'enum' => [
                                    'تازه‌ها و ترندهای فناوری',
                                    'توسعه و برنامه‌نویسی',
                                    'ابزارها و بهره‌وری',
                                    'شبکه، وب و API',
                                    'داده و ساختار',
                                    'امنیت کاربردی',
                                ],
                            ],
                            'description' => 'Mandatory rule: Select from the 6 fixed canonical categories ONLY. No new categories are allowed: 1) تازه‌ها و ترندهای فناوری, 2) توسعه و برنامه‌نویسی, 3) ابزارها و بهره‌وری, 4) شبکه، وب و API, 5) داده و ساختار, 6) امنیت کاربردی.',
                        ],
                        'tags'              => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'Relevant semantic tags (at least 3 recommended)'],
                        'image_base64'      => ['type' => 'string', 'description' => 'Optional Base64 encoded featured image string'],
                        'image_filename'    => ['type' => 'string', 'description' => 'Optional featured image filename in English (e.g. ai-trends.jpg)'],
                        'image_alt'         => ['type' => 'string', 'description' => 'Mandatory rule: Alternative text (Alt) for the featured image describing its visual content for SEO and accessibility (متن جایگزین تصویر)'],
                        'image_title'       => ['type' => 'string', 'description' => 'Media library title for the image'],
                        'image_caption'     => ['type' => 'string', 'description' => 'Caption text displayed beneath the image'],
                        'image_description' => ['type' => 'string', 'description' => 'Detailed description of the image in media library'],
                        'allow_duplicate'   => ['type' => 'boolean', 'description' => 'Set to true to bypass duplicate title and content checks. Default: false'],
                    ],
                    'required'   => ['title', 'content'],
                ],
            ],
            [
                'name'        => 'set_featured_image',
                'title'       => 'Set Featured Image',
                'description' => 'Upload image from Base64 and assign as featured image to a post with complete metadata (Alt text, title, caption, and description).',
                'inputSchema' => [
                    'type'       => 'object',
                    'properties' => [
                        'post_id'           => ['type' => 'integer', 'description' => 'Target Post ID'],
                        'image_base64'      => ['type' => 'string', 'description' => 'Base64 image data string'],
                        'filename'          => ['type' => 'string', 'description' => 'English filename like ai-header.jpg'],
                        'image_alt'         => ['type' => 'string', 'description' => 'Mandatory rule: Image Alt text for SEO and accessibility (متن جایگزین تصویر)'],
                        'image_title'       => ['type' => 'string', 'description' => 'Image Title in WordPress media library'],
                        'image_caption'     => ['type' => 'string', 'description' => 'Image Caption'],
                        'image_description' => ['type' => 'string', 'description' => 'Detailed description in media library'],
                    ],
                    'required'   => ['post_id', 'image_base64'],
                ],
            ],
            [
                'name'        => 'sync_categories',
                'title'       => 'Sync & Clean Categories',
                'description' => 'تثبیت ۶ دسته‌بندی اصلی و استاندارد وبلاگ، انتقال نوشته‌ها و حذف دسته‌های قدیمی و نامعتبر.',
                'inputSchema' => [
                    'type'       => 'object',
                    'properties' => new \stdClass(),
                ],
            ],
        ];
    }

    /**
     * اجرای ابزار درخواست‌شده MCP
     */
    public function execute_mcp_tool(string $name, array $args): string {
        switch ($name) {
            case 'search_posts':
                $query = sanitize_text_field($args['query'] ?? '');
                $limit = max(1, min(20, (int) ($args['limit'] ?? 5)));
                $posts = get_posts([
                    'post_type'      => 'post',
                    'post_status'    => 'publish',
                    's'              => $query,
                    'posts_per_page' => $limit,
                ]);

                if (empty($posts)) {
                    return "هیچ نوشته‌ای مرتبط با عبارت «{$query}» یافت نشد.";
                }

                $res = "نتایج جستجو برای «{$query}» (تعداد: " . count($posts) . "):\n\n";
                foreach ($posts as $p) {
                    $res .= "• [شناسه: #{$p->ID}] {$p->post_title}\n";
                    $res .= "  نشانی: " . get_permalink($p->ID) . "\n";
                    $clean = wp_strip_all_tags($p->post_content);
                    $res .= "  خلاصه: " . mb_substr($clean, 0, 140, 'UTF-8') . "...\n\n";
                }
                return trim($res);

            case 'get_post':
                $post_id = (int) ($args['id'] ?? 0);
                $post = get_post($post_id);
                if (!$post || $post->post_status !== 'publish') {
                    return "خطا: نوشته با شناسه #{$post_id} یافت نشد یا منتشر نشده است.";
                }

                $clean_body = wp_strip_all_tags($post->post_content);
                $clean_body = preg_replace("/[\r\n]{3,}/", "\n\n", trim($clean_body));
                $cats = wp_get_post_categories($post_id, ['fields' => 'names']);

                $out = "# {$post->post_title}\n\n";
                $out .= "- شناسه: #{$post->ID}\n";
                $out .= "- نشانی: " . get_permalink($post->ID) . "\n";
                $out .= "- تاریخ انتشار: " . get_the_date('Y-m-d', $post->ID) . "\n";
                if (!empty($cats)) {
                    $out .= "- موضوعات: " . implode(', ', $cats) . "\n";
                }
                $out .= "\n## متن مقاله:\n\n" . $clean_body;
                return $out;

            case 'get_site_summary':
                $llms = new Llms_Txt_Manager();
                return $llms->generate_llms_content(false);

            case 'get_content_ranking':
                $post_id = (int) ($args['id'] ?? 0);
                $post = get_post($post_id);
                if (!$post) {
                    return "نوشته یافت نشد.";
                }
                $ranking_module = Ranking_Module::get_instance() ?: new Ranking_Module();
                $r = $ranking_module->get_post_ranking($post_id);
                $out = "ارزیابی رتبه‌بندی محتوا برای: «{$post->post_title}»\n";
                $out .= "• میانگین کل آمادگی هوش مصنوعی: " . ($r['avg_score'] ?? 0) . "%\n";
                $out .= "• سئو ارگانیک: " . ($r['seo']['score'] ?? 0) . "%\n";
                $out .= "• موتور پاسخگو (AEO): " . ($r['aeo']['score'] ?? 0) . "%\n";
                $out .= "• مدل‌های هوش مصنوعی (GEO): " . ($r['geo']['score'] ?? 0) . "%\n\n";

                if (!empty($r['aeo']['recommendations'])) {
                    $out .= "توصیه‌های AEO:\n- " . implode("\n- ", $r['aeo']['recommendations']) . "\n\n";
                }
                if (!empty($r['geo']['recommendations'])) {
                    $out .= "توصیه‌های GEO:\n- " . implode("\n- ", $r['geo']['recommendations']) . "\n";
                }
                return trim($out);

            case 'create_post':
                global $wpdb;
                $title     = sanitize_text_field($args['title'] ?? '');
                $content   = $args['content'] ?? '';
                $status    = in_array($args['status'] ?? 'draft', ['draft', 'publish', 'pending'], true) ? $args['status'] : 'draft';
                $excerpt   = sanitize_textarea_field($args['excerpt'] ?? '');
                $allow_dup = !empty($args['allow_duplicate']);

                if (empty($title) || empty($content)) {
                    return "خطای اعتبارسنجی: عنوان و متن محتوای مقاله الزامی هستند.";
                }

                // ۱. قانون بررسی تکراری نبودن مقاله (Duplicate Prevention)
                if (!$allow_dup) {
                    // الف: بررسی تکراری بودن عنوان دقیق
                    $existing_title = $wpdb->get_row($wpdb->prepare(
                        "SELECT ID, post_title, post_status FROM {$wpdb->posts} WHERE post_title = %s AND post_type = 'post' AND post_status IN ('publish', 'draft', 'pending') LIMIT 1",
                        $title
                    ));
                    if ($existing_title) {
                        $link = get_permalink($existing_title->ID);
                        return "⚠️ خطای اعتبارسنجی سئو (Duplicate Title Detected):\n" .
                               "مقاله‌ای با این عنوان دقیقاً از قبل در وردپرس وجود دارد:\n" .
                               "• شناسه: #{$existing_title->ID}\n" .
                               "• عنوان: «{$existing_title->post_title}» (وضعیت: {$existing_title->post_status})\n" .
                               "• پیوند نوشته موجود: {$link}\n\n" .
                               "قانون سئو: برای جلوگیری از افت رتبه به دلیل محتوای تکراری (Cannibalization / Duplicate Content)، ایجاد مقاله با عنوان تکراری متوقف شد. لطفاً عنوان دیگری انتخاب کنید یا شناسه فعلی را ویرایش نمایید.";
                    }

                    // ب: بررسی تکراری بودن لید یا پاراگراف ابتدایی مقاله
                    $clean_lead = mb_substr(trim(wp_strip_all_tags($content)), 0, 140, 'UTF-8');
                    if (mb_strlen($clean_lead) >= 60) {
                        $lead_like = '%' . $wpdb->esc_like($clean_lead) . '%';
                        $existing_body = $wpdb->get_row($wpdb->prepare(
                            "SELECT ID, post_title FROM {$wpdb->posts} WHERE post_content LIKE %s AND post_type = 'post' AND post_status IN ('publish', 'draft', 'pending') LIMIT 1",
                            $lead_like
                        ));
                        if ($existing_body) {
                            return "⚠️ خطای اعتبارسنجی سئو (Duplicate Content Detected):\n" .
                                   "بخش قابل توجهی از محتوای این مقاله عیناً در نوشته «{$existing_body->post_title}» (شناسه #{$existing_body->ID}) وجود دارد. لطفاً محتوای جدید، بازنویسی شده یا توسعه‌یافته ارسال کنید.";
                        }
                    }
                }

                // ۲. قانون نامک انگلیسی استاندارد (Mandatory English URL Slug)
                $raw_slug   = $args['slug'] ?? '';
                $clean_slug = '';
                if (!empty($raw_slug)) {
                    $clean_slug = preg_replace('/[^a-z0-9\-]/i', '', strtolower($raw_slug));
                    $clean_slug = trim(preg_replace('/-+/', '-', $clean_slug), '-');
                }
                if (empty($clean_slug)) {
                    // استخراج خودکار کلمات انگلیسی از عنوان در صورت وجود
                    preg_match_all('/[a-z0-9]+/i', $title, $eng_words);
                    if (!empty($eng_words[0])) {
                        $clean_slug = strtolower(implode('-', array_slice($eng_words[0], 0, 6)));
                    } else {
                        // تولید نامک انگلیسی خوانا و معتبر بر اساس تاریخ و هش
                        $clean_slug = 'article-' . gmdate('Ymd') . '-' . substr(md5($title), 0, 6);
                    }
                }

                // ۳. قانون حداقل طول استاندارد محتوا و بهینه‌سازی متادیسکریپشن
                $plain_text = wp_strip_all_tags($content);
                $word_count = count(preg_split('/\s+/u', trim($plain_text), -1, PREG_SPLIT_NO_EMPTY));
                if ($word_count < 80) {
                    return "⚠️ خطای اعتبارسنجی (Thin Content Warning):\n" .
                           "طول مقاله بسیار کم است ({$word_count} کلمه). طبق استانداردهای کیفی سئو و موتورهای پاسخگو (AEO)، مقالات باید حداقل شامل ۳۰۰ کلمه و تیترهای بخش‌بندی شده (H2) باشند.";
                }

                if (empty($excerpt)) {
                    // تولید خودکار چکیده سئو استاندارد در بازه ۱۲۰ تا ۱۵۰ کاراکتر
                    $excerpt = mb_substr(preg_replace('/\s+/', ' ', trim($plain_text)), 0, 150, 'UTF-8') . '...';
                }

                // ۴. اختصاص هوشمند دسته‌بندی‌ها (فقط از بین ۶ دسته مجاز و ثابت، بدون امکان ایجاد دسته جدید)
                $cat_ids = [];
                if (!empty($args['category_names']) && is_array($args['category_names'])) {
                    foreach ($args['category_names'] as $cname) {
                        $cname = sanitize_text_field((string) $cname);
                        if (!empty($cname)) {
                            $cat_ids[] = Ranking_Module::resolve_canonical_category($cname);
                        }
                    }
                }
                if (empty($cat_ids)) {
                    // در صورت تعیین نشدن، به صورت خودکار به دسته ترندها و تازه‌های فناوری منتسب می‌شود
                    $cat_ids[] = Ranking_Module::resolve_canonical_category('tech-trends');
                }
                $cat_ids = array_values(array_unique(array_filter($cat_ids)));

                $post_data = [
                    'post_title'   => $title,
                    'post_name'    => $clean_slug,
                    'post_content' => wp_kses_post($content),
                    'post_excerpt' => $excerpt,
                    'post_status'  => $status,
                    'post_type'    => 'post',
                    'post_author'  => get_current_user_id() ?: 1,
                ];
                if (!empty($cat_ids)) {
                    $post_data['post_category'] = $cat_ids;
                }
                if (!empty($args['tags']) && is_array($args['tags'])) {
                    $post_data['tags_input'] = array_map('sanitize_text_field', $args['tags']);
                }

                $post_id = wp_insert_post($post_data, true);
                if (is_wp_error($post_id)) {
                    return "خطا در ایجاد نوشته: " . $post_id->get_error_message();
                }

                // ذخیره متادیسکریپشن برای افزونه‌های سئو (Yoast و Rank Math)
                update_post_meta($post_id, '_yoast_wpseo_metadesc', $excerpt);
                update_post_meta($post_id, 'rank_math_description', $excerpt);

                // ۵. آپلود تصویر شاخص با تکمیل ۱۰۰٪ متادیتا (Alt, Title, Caption, Description)
                $image_msg = '';
                if (!empty($args['image_base64'])) {
                    $img_fn = !empty($args['image_filename']) ? sanitize_file_name($args['image_filename']) : ($clean_slug . '-featured.jpg');
                    $img_meta = [
                        'alt'         => !empty($args['image_alt']) ? sanitize_text_field($args['image_alt']) : ('تصویر شاخص مقاله: ' . $title),
                        'title'       => !empty($args['image_title']) ? sanitize_text_field($args['image_title']) : $title,
                        'caption'     => !empty($args['image_caption']) ? sanitize_textarea_field($args['image_caption']) : '',
                        'description' => !empty($args['image_description']) ? sanitize_textarea_field($args['image_description']) : $excerpt,
                    ];
                    $img_res = $this->attach_image_to_post($post_id, $args['image_base64'], $img_fn, $img_meta);
                    if ($img_res['success']) {
                        $image_msg = "\n• تصویر شاخص: اختصاص یافت (" . $img_res['url'] . ")\n" .
                                     "  - متن جایگزین سئو (Alt): " . $img_meta['alt'] . "\n" .
                                     "  - عنوان رسانه: " . $img_meta['title'] . 
                                     (!empty($img_meta['caption']) ? ("\n  - توضیح زیر تصویر (Caption): " . $img_meta['caption']) : '');
                    }
                }

                // ۶. محاسبه و ارزیابی آنی امتیاز هوش مصنوعی و سئو (Omni AI Ranking)
                $ranking_module = Ranking_Module::get_instance() ?: new Ranking_Module();
                $ratings = $ranking_module->analyze_and_save_post($post_id);
                $seo_score = $ratings['seo']['score'] ?? 0;
                $aeo_score = $ratings['aeo']['score'] ?? 0;
                $geo_score = $ratings['geo']['score'] ?? 0;
                $avg_score = $ratings['avg_score'] ?? 0;

                $status_fa = ($status === 'publish') ? 'منتشر شد (Published)' : 'به صورت پیش‌نویس (Draft) ذخیره شد';
                $edit_url  = admin_url("post.php?post={$post_id}&action=edit");
                $view_url  = get_permalink($post_id);

                return "✅ نوشته جدید با موفقیت {$status_fa}!\n" .
                       "• شناسه نوشته: #{$post_id}\n" .
                       "• عنوان: {$title}\n" .
                       "• نامک انگلیسی (URL Slug): {$clean_slug}\n" .
                       "• وضعیت: {$status}\n" .
                       "• تعداد کلمات: {$word_count} کلمه\n" .
                       "• متادیسکریپشن: {$excerpt}" .
                       $image_msg . "\n" .
                       "• ارزیابی آمادگی هوش مصنوعی (Omni AI Score):\n" .
                       "  - سئو ارگانیک (SEO): {$seo_score}%\n" .
                       "  - موتورهای پاسخگو (AEO): {$aeo_score}%\n" .
                       "  - موتورهای مولد هوش مصنوعی (GEO): {$geo_score}%\n" .
                       "  - میانگین کل: {$avg_score}%\n" .
                       "• پیوند ویرایش در وردپرس: {$edit_url}\n" .
                       "• پیوند مشاهده: {$view_url}";

            case 'set_featured_image':
                $post_id      = (int) ($args['post_id'] ?? 0);
                $image_base64 = $args['image_base64'] ?? '';
                $filename     = sanitize_file_name($args['filename'] ?? ('post-' . $post_id . '-featured.jpg'));

                if (!$post_id || empty($image_base64)) {
                    return "خطا: شناسه نوشته و داده تصویر (image_base64) الزامی هستند.";
                }

                $post = get_post($post_id);
                if (!$post) {
                    return "خطا: نوشته با شناسه #{$post_id} یافت نشد.";
                }

                $img_meta = [
                    'alt'         => !empty($args['image_alt']) ? sanitize_text_field($args['image_alt']) : ('تصویر نوشته: ' . $post->post_title),
                    'title'       => !empty($args['image_title']) ? sanitize_text_field($args['image_title']) : $post->post_title,
                    'caption'     => !empty($args['image_caption']) ? sanitize_textarea_field($args['image_caption']) : '',
                    'description' => !empty($args['image_description']) ? sanitize_textarea_field($args['image_description']) : $post->post_excerpt,
                ];

                $res = $this->attach_image_to_post($post_id, $image_base64, $filename, $img_meta);
                if (!$res['success']) {
                    return "خطا در تنظیم تصویر شاخص: " . $res['message'];
                }

                return "تصویر شاخص با موفقیت همراه با متادیتای کامل برای نوشته «{$post->post_title}» (شناسه #{$post_id}) تنظیم گردید!\n" .
                       "• شناسه پیوست رسانه: #{$res['attach_id']}\n" .
                       "• نشانی تصویر: {$res['url']}\n" .
                       "• متن جایگزین سئو (Alt): {$img_meta['alt']}\n" .
                       "• عنوان رسانه: {$img_meta['title']}" .
                       (!empty($img_meta['caption']) ? ("\n• توضیح زیر تصویر (Caption): {$img_meta['caption']}") : '');

            case 'sync_categories':
                $sync_result = Ranking_Module::sync_canonical_categories();
                $all_cats = get_categories(['hide_empty' => false]);
                $cat_summary = [];
                foreach ($all_cats as $c) {
                    $cat_summary[] = "• {$c->name} (slug: {$c->slug}, شناسه: #{$c->term_id}, تعداد نوشته: {$c->count})";
                }
                return "✅ دسته‌بندی‌های وردپرس با موفقیت همگام‌سازی و تثبیت شدند:\n\n" .
                       "📌 دسته‌های فعال و رسمی وبلاگ:\n" . implode("\n", $cat_summary) . "\n\n" .
                       "📊 آمار عملیات:\n" .
                       "• تعداد نوشته‌های انتقال‌یافته: " . $sync_result['migrated_posts'] . "\n" .
                       "• دسته‌های اضافی حذف‌شده: " . (!empty($sync_result['deleted_terms']) ? implode(', ', $sync_result['deleted_terms']) : 'هیچ دسته اضافه‌ای یافت نشد');

            default:
                return "ابزار «{$name}» شناخته نشد.";
        }
    }

    /**
     * الحاق تصویر Base64 به عنوان تصویر شاخص نوشته
     */
    public function attach_image_to_post(int $post_id, string $image_base64, string $filename = 'featured-image.jpg', array $meta = []): array {
        if (preg_match('/^data:image\/(\w+);base64,/', $image_base64, $matches)) {
            $image_base64 = substr($image_base64, strpos($image_base64, ',') + 1);
            if (empty($filename) || $filename === 'featured-image.jpg') {
                $ext = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
                $filename = 'post-' . $post_id . '-featured.' . $ext;
            }
        }

        $image_data = base64_decode($image_base64);
        if (!$image_data) {
            return ['success' => false, 'message' => 'کد Base64 تصویر نامعتبر است.'];
        }

        $filename = sanitize_file_name($filename ?: ('post-' . $post_id . '.jpg'));
        $upload = wp_upload_bits($filename, null, $image_data);
        if (!empty($upload['error'])) {
            return ['success' => false, 'message' => 'خطا در ذخیره فایل در هاست: ' . $upload['error']];
        }

        $file_path = $upload['file'];
        $file_type = wp_check_filetype($filename, null);

        $img_title   = !empty($meta['title']) ? sanitize_text_field($meta['title']) : preg_replace('/\.[^.]+$/', '', $filename);
        $img_caption = !empty($meta['caption']) ? sanitize_textarea_field($meta['caption']) : '';
        $img_desc    = !empty($meta['description']) ? sanitize_textarea_field($meta['description']) : '';
        $img_alt     = !empty($meta['alt']) ? sanitize_text_field($meta['alt']) : $img_title;

        $attachment = [
            'post_mime_type' => $file_type['type'] ?: 'image/jpeg',
            'post_title'     => $img_title,
            'post_excerpt'   => $img_caption,
            'post_content'   => $img_desc,
            'post_status'    => 'inherit',
        ];

        if (!function_exists('wp_generate_attachment_metadata')) {
            require_once ABSPATH . 'wp-admin/includes/image.php';
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/media.php';
        }

        $attach_id = wp_insert_attachment($attachment, $file_path, $post_id);
        if (is_wp_error($attach_id) || !$attach_id) {
            return ['success' => false, 'message' => 'خطا در ثبت تصویر در رسانه‌های وردپرس.'];
        }

        // ذخیره متن جایگزین تصویر (Alt Text) برای سئو
        update_post_meta($attach_id, '_wp_attachment_image_alt', $img_alt);

        $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
        if (!empty($attach_data)) {
            wp_update_attachment_metadata($attach_id, $attach_data);
        }

        set_post_thumbnail($post_id, $attach_id);

        return [
            'success'   => true,
            'attach_id' => $attach_id,
            'url'       => wp_get_attachment_url($attach_id),
            'alt'       => $img_alt,
        ];
    }
}
