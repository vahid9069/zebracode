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
                        'prompts' => [
                            [
                                'name'        => 'generate_seo_article',
                                'description' => 'Generate an authoritative, deeply researched SEO, AEO, and GEO Persian article blueprint for any topic.',
                                'arguments'   => [
                                    [
                                        'name'        => 'topic',
                                        'description' => 'Main topic of the article (موضوع اصلی مقاله)',
                                        'required'    => true,
                                    ],
                                    [
                                        'name'        => 'focus_keyword',
                                        'description' => 'Focus keyword (کلیدواژه کانونی)',
                                        'required'    => false,
                                    ],
                                ],
                            ],
                        ],
                    ],
                ];

            case 'prompts/get':
                $p_name = $params['name'] ?? '';
                $p_args = $params['arguments'] ?? [];
                $topic  = sanitize_text_field($p_args['topic'] ?? '');
                $kw     = sanitize_text_field($p_args['focus_keyword'] ?? '');
                $prompt_content = $this->build_article_system_prompt($topic, $kw);
                return [
                    'jsonrpc' => '2.0',
                    'id'      => $id,
                    'result'  => [
                        'description' => 'Official ZebraCode SEO/AEO/GEO Editorial Prompt',
                        'messages'    => [
                            [
                                'role'    => 'user',
                                'content' => [
                                    'type' => 'text',
                                    'text' => $prompt_content,
                                ],
                            ],
                        ],
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
                        'featured_image_prompt' => ['type' => 'string', 'description' => 'Mandatory: Detailed English visual prompt for generating the 16:9 featured image (no text, dark slate and electric cyan styling)'],
                        'diagram_prompt'        => ['type' => 'string', 'description' => 'Mandatory: Detailed English architecture/flowchart diagram prompt for visual placeholder in content'],
                        'image_prompts'         => [
                            'type'        => 'array',
                            'items'       => ['type' => 'string'],
                            'description' => 'Mandatory: List of at least 2 English image prompts for in-content images (16:9 aspect ratio, no text)',
                        ],
                        'focus_keyword'         => ['type' => 'string', 'description' => 'Focus keyword (کلیدواژه کانونی)'],
                        'seo_title'             => ['type' => 'string', 'description' => 'SEO meta title starting with focus keyword (40-60 chars)'],
                        'seo_desc'              => ['type' => 'string', 'description' => 'SEO meta description starting with focus keyword (130-155 chars)'],
                        'faq'                   => [
                            'type'        => 'array',
                            'items'       => [
                                'type'       => 'object',
                                'properties' => [
                                    'question' => ['type' => 'string'],
                                    'answer'   => ['type' => 'string'],
                                ],
                                'required'   => ['question', 'answer'],
                            ],
                            'description' => 'FAQ items for AEO and Schema injection (at least 3-4 items)',
                        ],
                        'related_tools'         => [
                            'type'        => 'array',
                            'items'       => ['type' => 'string'],
                            'description' => 'Exact slugs of 3 to 5 internal developer tools linked inside the article',
                        ],
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
            [
                'name'        => 'get_search_console_sites',
                'title'       => 'Get Search Console Sites',
                'description' => 'Get list of all verified properties in Google Search Console (لیست تمام پراپرتی‌های متصل در سرچ کنسول).',
                'inputSchema' => [
                    'type'       => 'object',
                    'properties' => new \stdClass(),
                ],
            ],
            [
                'name'        => 'get_search_console_performance',
                'title'       => 'Get Search Console Performance',
                'description' => 'Fetch Google Search Console performance data (clicks, impressions, CTR, position, and top queries/pages) for a specific property.',
                'inputSchema' => [
                    'type'       => 'object',
                    'properties' => [
                        'site_url'   => ['type' => 'string', 'description' => 'Target property URL (e.g. sc-domain:zebracode.ir or https://kit.zebracode.ir/)'],
                        'days'       => ['type' => 'integer', 'description' => 'Number of past days (e.g. 7, 28, 90). Default: 28'],
                        'dimension'  => ['type' => 'string', 'enum' => ['query', 'page', 'country', 'device'], 'description' => 'Aggregation dimension. Default: query'],
                        'row_limit'  => ['type' => 'integer', 'description' => 'Max number of rows to return (default 25)'],
                    ],
                    'required'   => ['site_url'],
                ],
            ],
            [
                'name'        => 'get_search_console_diagnosis',
                'title'       => 'Get Search Console AI Diagnosis',
                'description' => 'Analyze Google Search Console performance data with AI to identify low CTR issues, striking-distance ranking opportunities, and prioritized SEO action plan.',
                'inputSchema' => [
                    'type'       => 'object',
                    'properties' => [
                        'site_url' => ['type' => 'string', 'description' => 'Target property URL (e.g. sc-domain:zebracode.ir or https://kit.zebracode.ir/)'],
                        'days'     => ['type' => 'integer', 'description' => 'Number of past days to analyze (default 28)'],
                    ],
                    'required'   => ['site_url'],
                ],
            ],
            [
                'name'        => 'get_article_prompt',
                'title'       => 'Get Article SEO/AEO Prompt Blueprint',
                'description' => 'Generates the official ZebraCode editorial blueprint prompt with internal links, AEO direct answer structure, comparison tables, and strict SEO rules for any given topic. Call this tool first to obtain the exact prompt before generating content and calling create_post.',
                'inputSchema' => [
                    'type'       => 'object',
                    'properties' => [
                        'topic'            => ['type' => 'string', 'description' => 'Main topic or title of the article (موضوع اصلی مقاله)'],
                        'focus_keyword'    => ['type' => 'string', 'description' => 'Target focus keyword (کلیدواژه کانونی). If omitted, extracted from topic.'],
                        'additional_notes' => ['type' => 'string', 'description' => 'Optional specific instructions, outline points, or architectural angle'],
                    ],
                    'required'   => ['topic'],
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

                // ۴. استخراج فراداده‌های سئو، تصاویر و AEO
                $focus_kw           = sanitize_text_field($args['focus_keyword'] ?? '');
                $seo_title          = sanitize_text_field($args['seo_title'] ?? '');
                $seo_desc           = sanitize_text_field($args['seo_desc'] ?? '');
                $featured_img_prompt= sanitize_textarea_field($args['featured_image_prompt'] ?? '');
                $diagram_prompt     = sanitize_textarea_field($args['diagram_prompt'] ?? '');
                $image_prompts      = is_array($args['image_prompts'] ?? null) ? array_values(array_filter(array_map('sanitize_textarea_field', $args['image_prompts']))) : [];
                $faq                = is_array($args['faq'] ?? null) ? $args['faq'] : [];
                $related_tools      = is_array($args['related_tools'] ?? null) ? array_values(array_filter(array_map('sanitize_title', $args['related_tools']))) : [];

                // ۵. بهینه‌سازی، ترمیم هوشمند (Auto-Heal) و جاسازی پرامپت‌های تصاویر در بدنه محتوا
                $content = $this->auto_heal_article_content(
                    $content,
                    $title,
                    $focus_kw,
                    $diagram_prompt,
                    $image_prompts,
                    $faq,
                    $related_tools
                );

                // ۶. اختصاص هوشمند دسته‌بندی‌ها (فقط از بین ۶ دسته مجاز و ثابت، بدون امکان ایجاد دسته جدید)
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
                    'post_excerpt' => $seo_desc ?: $excerpt,
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

                // ذخیره تمام متاداده‌های اختصاصی سئو و هوش مصنوعی
                $final_meta_desc = $seo_desc ?: $excerpt;
                update_post_meta($post_id, '_yoast_wpseo_metadesc', $final_meta_desc);
                update_post_meta($post_id, 'rank_math_description', $final_meta_desc);
                update_post_meta($post_id, '_ai_seo_title', $seo_title ?: $title);
                update_post_meta($post_id, '_ai_seo_desc', $final_meta_desc);

                if (!empty($focus_kw)) {
                    update_post_meta($post_id, '_omni_ai_focus_keyword', $focus_kw);
                    update_post_meta($post_id, '_yoast_wpseo_focuskw', $focus_kw);
                    update_post_meta($post_id, 'rank_math_focus_keyword', $focus_kw);
                }
                if (!empty($featured_img_prompt)) {
                    update_post_meta($post_id, '_omni_ai_featured_image_prompt', $featured_img_prompt);
                }
                if (!empty($diagram_prompt)) {
                    update_post_meta($post_id, '_omni_ai_diagram_prompt', $diagram_prompt);
                }
                if (!empty($image_prompts)) {
                    update_post_meta($post_id, '_omni_ai_image_prompts', $image_prompts);
                    update_post_meta($post_id, '_ai_image_prompts', $image_prompts);
                }
                if (!empty($faq)) {
                    update_post_meta($post_id, '_ai_faq_data', $faq);
                }
                if (!empty($related_tools)) {
                    update_post_meta($post_id, '_zebracode_blog_ai_related_tools', $related_tools);
                }
                update_post_meta($post_id, '_omni_ai_generated', 1);
                update_post_meta($post_id, '_omni_article_import_mode', 'mcp_agent');

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
                       "• متادیسکریپشن: {$final_meta_desc}\n" .
                       (!empty($featured_img_prompt) ? ("• پرامپت تصویر شاخص: در متادیتا ذخیره شد\n") : '') .
                       (!empty($diagram_prompt) ? ("• پرامپت دیاگرام: در محتوا و متادیتا ذخیره شد\n") : '') .
                       (!empty($image_prompts) ? ("• پرامپت‌های تصاویر محتوا: " . count($image_prompts) . " مورد در محتوا و متادیتا قرار گرفت\n") : '') .
                       (!empty($faq) ? ("• سوالات متداول (FAQ): " . count($faq) . " پرسش با ساختار اسکیما ثبت شد\n") : '') .
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

            case 'get_search_console_sites':
                if (!Search_Console_Module::is_configured()) {
                    return "⚠️ خطای سرچ کنسول: کلید سرویس اکانت در پنل افزونه پیکربندی نشده است.";
                }
                $sites_data = Search_Console_Module::get_sites();
                if (!empty($sites_data['error'])) {
                    return "خطا در دریافت لیست پراپرتی‌ها: " . ($sites_data['message'] ?? $sites_data['error']);
                }
                $sites = $sites_data['sites'] ?? [];
                if (empty($sites)) {
                    return "هیچ سایتی برای این سرویس‌اکانت در سرچ کنسول تعریف یا وریفای نشده است.";
                }
                $out = "🌐 لیست پراپرتی‌های متصل در Google Search Console (" . count($sites) . " مورد):\n\n";
                foreach ($sites as $s) {
                    $out .= "• {$s['label']}\n";
                    $out .= "  شناسه فنی (siteUrl): {$s['siteUrl']}\n";
                    $out .= "  سطح دسترسی: {$s['permissionLevel']}\n\n";
                }
                return trim($out);

            case 'get_search_console_performance':
                if (!Search_Console_Module::is_configured()) {
                    return "⚠️ خطای سرچ کنسول: کلید سرویس اکانت در پنل افزونه پیکربندی نشده است.";
                }
                $site_url = sanitize_text_field($args['site_url'] ?? '');
                if (empty($site_url)) {
                    return "خطا: نشانی پراپرتی (site_url) الزامی است (مثال: sc-domain:zebracode.ir یا https://kit.zebracode.ir/).";
                }
                $days = max(1, min(90, (int) ($args['days'] ?? 28)));
                $dimension = in_array($args['dimension'] ?? 'query', ['query', 'page', 'country', 'device'], true) ? $args['dimension'] : 'query';
                $row_limit = max(1, min(100, (int) ($args['row_limit'] ?? 25)));

                $end_date = gmdate('Y-m-d', strtotime('-3 days'));
                $start_date = gmdate('Y-m-d', strtotime("-{$days} days", strtotime($end_date)));

                $analytics = Search_Console_Module::get_search_analytics($site_url, $start_date, $end_date, $dimension, $row_limit);
                if (!empty($analytics['error'])) {
                    return "خطا در دریافت آمار عملکرد سرچ کنسول: " . ($analytics['message'] ?? $analytics['error']);
                }

                $summary = $analytics['summary'] ?? [];
                $out = "📊 گزارش عملکرد سرچ کنسول برای «{$site_url}» ({$days} روز گذشته: {$start_date} تا {$end_date}):\n\n";
                $out .= "• مجموع کلیک‌ها (Clicks): " . number_format($summary['clicks'] ?? 0) . "\n";
                $out .= "• مجموع نمایش‌ها (Impressions): " . number_format($summary['impressions'] ?? 0) . "\n";
                $out .= "• میانگین نرخ کلیک (CTR): " . ($summary['ctr'] ?? 0) . "%\n";
                $out .= "• میانگین رتبه (Average Position): " . ($summary['position'] ?? 0) . "\n\n";

                $rows = $analytics['rows'] ?? [];
                $out .= "📌 برترین موارد بر اساس بُعد [{$dimension}] (" . count($rows) . " مورد):\n";
                foreach ($rows as $i => $row) {
                    $num = $i + 1;
                    $key = $row['keys'][0] ?? 'نامشخص';
                    $clicks = $row['clicks'] ?? 0;
                    $impressions = $row['impressions'] ?? 0;
                    $ctr = round(($row['ctr'] ?? 0) * 100, 2);
                    $pos = round($row['position'] ?? 0, 1);
                    $out .= "{$num}. «{$key}» -> کلیک: {$clicks} | نمایش: {$impressions} | نرخ کلیک: {$ctr}% | جایگاه: {$pos}\n";
                }
                return trim($out);

            case 'get_search_console_diagnosis':
                if (!Search_Console_Module::is_configured()) {
                    return "⚠️ خطای سرچ کنسول: کلید سرویس اکانت در پنل افزونه پیکربندی نشده است.";
                }
                $site_url = sanitize_text_field($args['site_url'] ?? '');
                if (empty($site_url)) {
                    return "خطا: نشانی پراپرتی (site_url) الزامی است.";
                }
                $days = max(7, min(90, (int) ($args['days'] ?? 28)));
                $end_date = gmdate('Y-m-d', strtotime('-3 days'));
                $start_date = gmdate('Y-m-d', strtotime("-{$days} days", strtotime($end_date)));

                $analytics = Search_Console_Module::get_search_analytics($site_url, $start_date, $end_date, 'query', 60);
                if (!empty($analytics['error'])) {
                    return "خطا در دریافت داده‌ها برای عیب‌یابی: " . ($analytics['message'] ?? $analytics['error']);
                }

                $diagnosis = Search_Console_Module::generate_ai_diagnosis($analytics, $site_url);
                if (empty($diagnosis['success'])) {
                    return "خطا در اجرای عیب‌یابی هوش مصنوعی: " . ($diagnosis['message'] ?? 'نامشخص');
                }

                $report = $diagnosis['report'] ?? [];
                $out = "🔍 گزارش عیب‌یابی و راهکارهای هوشمند سرچ کنسول برای «{$site_url}»:\n\n";
                $out .= "• نمره سلامت سئو: " . ($report['health_score'] ?? '-') . " از 100 (" . ($report['health_status'] ?? '') . ")\n\n";
                $out .= "📝 خلاصه مدیریتی:\n" . ($report['executive_summary'] ?? '') . "\n\n";

                if (!empty($report['critical_issues'])) {
                    $out .= "🚨 ایرادات اولویت‌دار و فرصت‌های افت رتبه:\n";
                    foreach ($report['critical_issues'] as $issue) {
                        $out .= "• [{$issue['severity']}] {$issue['title']}\n";
                        $out .= "  علت ریشه‌ای: {$issue['root_cause']}\n";
                        if (!empty($issue['action_plan'])) {
                            $out .= "  برنامه اقدام: " . implode(' | ', $issue['action_plan']) . "\n";
                        }
                        if (!empty($issue['target_queries'])) {
                            $out .= "  کوئری‌های هدف: " . implode(', ', $issue['target_queries']) . "\n";
                        }
                        $out .= "\n";
                    }
                }

                if (!empty($report['growth_quick_wins'])) {
                    $out .= "⚡ پیروزی‌های سریع (Quick Wins):\n";
                    foreach ($report['growth_quick_wins'] as $qw) {
                        $out .= "• {$qw}\n";
                    }
                    $out .= "\n";
                }

                if (!empty($report['content_expansion_topics'])) {
                    $out .= "💡 ایده‌های توسعه محتوا بر اساس سرچ واقعی:\n";
                    foreach ($report['content_expansion_topics'] as $topic) {
                        $out .= "• {$topic}\n";
                    }
                }
                return trim($out);

            case 'get_article_prompt':
                $topic    = sanitize_text_field($args['topic'] ?? '');
                $focus_kw = sanitize_text_field($args['focus_keyword'] ?? '');
                $notes    = sanitize_textarea_field($args['additional_notes'] ?? '');
                if (empty($topic)) {
                    return "خطا: موضوع مقاله (topic) الزامی است.";
                }
                return $this->build_article_system_prompt($topic, $focus_kw, $notes);

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

    /**
     * رندر بلوک استاندارد HTML با استایل مدرن تیره برای جایگاه و پرامپت تصاویر محتوا
     * کاملاً سازگار با گوتنبرگ بدون خطای Block Invalidation، به همراه دکمه کپی پرامپت و باز کردن مستقیم رسانه وردپرس
     */
    public function render_image_callout_block(int $num, string $prompt = ''): string {
        $clean = trim(html_entity_decode(strip_tags($prompt), ENT_QUOTES, 'UTF-8'));
        if (empty($clean)) {
            $clean = 'Modern clean lightweight 16:9 web illustration asset with dark slate tech styling, no text, --ar 16:9, --q 1';
        }
        $safe_code = esc_html($clean);
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
            "      <a href=\"#omni-copy\" class=\"omni-copy-btn\" data-prompt=\"{$safe_code}\" style=\"cursor:pointer;display:inline-flex;align-items:center;gap:6px;background:#1e293b;color:#38bdf8;border:1px solid #38bdf8;text-decoration:none;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:600;line-height:1.4;\">📋 کپی پرامپت</a>\n" .
            "    </div>\n" .
            "  </div>\n" .
            "  <p style=\"margin:0 0 8px 0;font-size:12px;color:#94a3b8;line-height:1.6;\">پرامپت پیشنهادی هوش مصنوعی (یک کلیک روی کادر زیر متن را برای کپی سریع انتخاب می‌کند):</p>\n" .
            "  <pre style=\"margin:0;font-size:12px;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:12px;direction:ltr;text-align:left;line-height:1.5;overflow-x:auto;white-space:pre-wrap;word-break:break-word;user-select:all;-webkit-user-select:all;\"><code>{$safe_code}</code></pre>\n" .
            "</div>\n<!-- /wp:html -->\n";
    }

    /**
     * ترمیم و بهینه‌سازی خودکار ساختار محتوا (Auto-Heal Pipeline)
     * شامل تبدیل مارک‌داون، تزریق بلوک‌های پرامپت تصاویر و دیاگرام، جداول استاندارد، پاسخ صریح AEO، نکات کلیدی و FAQ
     */
    public function auto_heal_article_content(
        string $content,
        string $title,
        string $focus_keyword = '',
        string $diagram_prompt = '',
        array $image_prompts = [],
        array $faq = [],
        array $related_tools = []
    ): string {
        $content = trim($content);
        if (empty($content)) {
            return '';
        }

        // ۱. در صورت مارک‌داون بودن (وجود تیترهای ## بدون تگ‌های بلوکی HTML)، تبدیل هوشمند به بلوک‌های بومی گوتنبرگ
        if (!preg_match('/<p\b|<div\b|<h[1-6]\b/i', $content) && preg_match('/(?:^#{1,6}\s|^\s*[-*]\s|\*{2})/m', $content)) {
            if (class_exists('\\OmniAI\\Api\\Markdown_Parser')) {
                $content = \OmniAI\Api\Markdown_Parser::parse($content);
            }
        }

        // ۲. پاکسازی و بستن تگ‌های <a> بازمانده
        $content = preg_replace('/href=(["\'])\s*\[([^\]]+)\](?:\([^)]+\))?\s*\1/i', 'href=$1$2$1', $content);

        // ۳. استانداردسازی جداول: افزودن border="1" و کلاس استایل
        if (str_contains($content, '<table')) {
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

        // ۴. جایگزینی یا تزریق دیاگرام معماری (Diagram Block)
        $diag_code = !empty($diagram_prompt) ? $diagram_prompt : 'Technical architecture flowchart or concept diagram (16:9).';
        $diag_block = class_exists('\\OmniAI\\Api\\Markdown_Parser')
            ? \OmniAI\Api\Markdown_Parser::render_diagram_placeholder_block($diag_code)
            : '';

        if (!empty($diag_block)) {
            if (stripos($content, '[DIAGRAM_PLACEHOLDER]') !== false) {
                $content = str_ireplace('[DIAGRAM_PLACEHOLDER]', $diag_block, $content);
            } elseif (!empty($diagram_prompt)) {
                // در صورت نبود پلیس‌هولدر، تزریق بعد از اولین بخش H2
                if (preg_match('/(<\/h2>[\s\S]*?<\/p>)/i', $content, $m, PREG_OFFSET_CAPTURE)) {
                    $pos = $m[0][1] + strlen($m[0][0]);
                    $content = substr($content, 0, $pos) . "\n\n" . $diag_block . "\n\n" . substr($content, $pos);
                }
            }
        }

        // ۵. جایگزینی یا تزریق پرامپت‌های تصاویر درون محتوا (Image Callout Blocks)
        $img_idx = 0;
        $that = $this;
        $content = preg_replace_callback('/\[IMAGE_PLACEHOLDER(?:_(\d+))?\]/i', function ($m) use (&$img_idx, $image_prompts, $that) {
            $num = !empty($m[1]) ? (int) $m[1] : ($img_idx + 1);
            $img_idx++;
            $prompt = $image_prompts[$num - 1] ?? ($image_prompts[$img_idx - 1] ?? '');
            return $that->render_image_callout_block($num, $prompt);
        }, $content);

        // اگر مدل پلیس‌هولدرها را در متن نگذاشته بود اما پرامپت‌ها را فرستاده بود، آنها را هوشمند در فواصل محتوا درج می‌کنیم
        if ($img_idx === 0 && !empty($image_prompts)) {
            foreach ($image_prompts as $k => $iprompt) {
                $block_num = $k + 1;
                $callout = $this->render_image_callout_block($block_num, $iprompt);
                preg_match_all('/<h2\b[^>]*>/i', $content, $all_h2, PREG_OFFSET_CAPTURE);
                $target_idx = ($block_num === 1) ? 2 : 4;
                if (!empty($all_h2[0][$target_idx])) {
                    $insert_pos = $all_h2[0][$target_idx][1];
                    $content = substr($content, 0, $insert_pos) . $callout . "\n\n" . substr($content, $insert_pos);
                } else {
                    $content .= "\n\n" . $callout;
                }
            }
        }

        // ۶. تضمین پاسخ صریح برای AEO در پاراگراف اول
        $kw_label = esc_html(!empty($focus_keyword) ? $focus_keyword : $title);
        $clean_p_text = trim(wp_strip_all_tags($content));
        $all_paras = array_values(array_filter(array_map('trim', preg_split('/\n+/u', $clean_p_text))));
        $first_p_text = trim($all_paras[0] ?? '');
        $first_p_words = !empty($first_p_text) ? count(preg_split('/[\s\p{Z}\p{P}]+/u', $first_p_text, -1, PREG_SPLIT_NO_EMPTY)) : 0;
        if ($first_p_words < 25 || $first_p_words > 80 || mb_stripos($first_p_text, $kw_label) === false) {
            $direct_answer = "<!-- wp:paragraph -->\n<p><strong>{$kw_label}</strong> فرآیندی استاندارد و کلیدی در مهندسی نرم‌افزار نوین است که با بهینه‌سازی منابع، حذف پردازش‌های زائد و کاهش زمان پاسخگویی (Latency)، پایداری و کارایی سیستم‌های دیجیتال را تضمین می‌کند. پیاده‌سازی اصولی این راهکارها مانع از افت راندمان و بروز خطاهای پیش‌بینی‌نشده در مقیاس بالا می‌گردد.</p>\n<!-- /wp:paragraph -->\n\n";
            $content = $direct_answer . $content;
        }

        // ۷. تضمین باکس نکات کلیدی (Key Takeaways برای GEO)
        if (mb_stripos($content, 'نکات کلیدی', 0, 'UTF-8') === false && mb_stripos($content, 'در یک نگاه', 0, 'UTF-8') === false) {
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

        // ۸. تبدیل و درج آکاردئون پرسش‌های متداول (FAQ)
        if (!empty($faq) && is_array($faq) && mb_stripos($content, 'پرسش‌های متداول', 0, 'UTF-8') === false && mb_stripos($content, '<details', 0, 'UTF-8') === false) {
            $faq_html = "\n\n<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">پرسش‌های متداول</h2>\n<!-- /wp:heading -->\n";
            foreach ($faq as $item) {
                if (!is_array($item)) continue;
                $q = sanitize_text_field($item['question'] ?? $item['q'] ?? '');
                $a = wp_kses_post($item['answer'] ?? $item['a'] ?? '');
                if (empty($q) || empty($a)) continue;
                $faq_html .= "<!-- wp:details -->\n";
                $faq_html .= "<details class=\"wp-block-details\"><summary>" . esc_html($q) . "</summary><!-- wp:paragraph -->\n";
                $faq_html .= "<p>" . $a . "</p>\n";
                $faq_html .= "<!-- /wp:paragraph --></details>\n";
                $faq_html .= "<!-- /wp:details -->\n";
            }
            $content .= $faq_html;
        }

        // ۹. تقسیم پاراگراف‌های بیش از حد طولانی (بیش از ۱۲۵ کلمه) جهت بهبود نمره خوانایی
        $content = preg_replace_callback('/<p\b([^>]*)>(.*?)<\/p>/is', function ($pm) {
            $p_attrs = $pm[1];
            $p_text = $pm[2];
            $clean_words = preg_split('/[\s\p{Z}\p{P}]+/u', strip_tags($p_text), -1, PREG_SPLIT_NO_EMPTY);
            $w_count = is_array($clean_words) ? count($clean_words) : 0;
            if ($w_count > 125) {
                $sentences = preg_split('/(?<=[\.!\؟])\s+/u', $p_text, -1, PREG_SPLIT_NO_EMPTY);
                if (count($sentences) >= 2) {
                    $mid = (int) ceil(count($sentences) / 2);
                    $part1 = implode(' ', array_slice($sentences, 0, $mid));
                    $part2 = implode(' ', array_slice($sentences, $mid));
                    return "<p{$p_attrs}>{$part1}</p>\n\n<p{$p_attrs}>{$part2}</p>";
                }
            }
            return $pm[0];
        }, $content);

        // ۱۰. تضمین لینک‌های داخلی به ابزارهای زبراکد
        $site_host = strtolower((string) wp_parse_url(home_url(), PHP_URL_HOST));
        $root_domain = $site_host;
        if (preg_match('/(?:\b|^)([a-z0-9\-]+\.[a-z]{2,})$/i', $site_host, $dm)) {
            $root_domain = strtolower($dm[1]);
        }
        $synced_tools = Tool_Synchronizer::get_synced_tools();
        $synced_domains = [];
        if (!empty($synced_tools) && is_array($synced_tools)) {
            foreach ($synced_tools as $st) {
                if (!empty($st['domain'])) {
                    $synced_domains[] = strtolower(trim($st['domain']));
                }
            }
        }
        $synced_domains = array_unique($synced_domains);

        preg_match_all('/<a\s+[^>]*href=[\'"]([^\'"]+)[\'"][^>]*>/i', $content, $imp_links);
        $has_internal = false;
        foreach ($imp_links[1] ?? [] as $ilink) {
            $ihost = strtolower((string) wp_parse_url($ilink, PHP_URL_HOST));
            if (empty($ihost) || $ihost === $site_host || (!empty($root_domain) && ($ihost === $root_domain || str_ends_with($ihost, '.' . $root_domain))) || in_array($ihost, $synced_domains, true)) {
                $has_internal = true;
                break;
            }
        }
        if (!$has_internal) {
            $tools_to_show = !empty($synced_tools) ? array_slice($synced_tools, 0, 3) : [];
            $tool_items = '';
            foreach ($tools_to_show as $st) {
                $tool_items .= "<li><a href='{$st['url']}'>{$st['title']}</a>: {$st['domain']}</li>\n";
            }
            if (empty($tool_items)) {
                $tool_items = "<li><a href='/tools'>ابزارهای آنلاین توسعه‌دهندگان زبراکد</a></li>\n";
            }

            $content .= "\n\n<!-- wp:group -->\n<div class=\"wp-block-group\" style=\"border:1px solid #38bdf8;border-radius:8px;padding:1rem;margin:24px 0;background:#0f172a;color:#f8fafc;\">\n" .
                "<p style=\"font-weight:bold;color:#38bdf8;margin:0 0 8px 0;font-size:15px;\">🛠 ابزارهای آنلاین و پیشنهادی مرتبط:</p>\n" .
                "<ul>\n{$tool_items}</ul>\n</div>\n<!-- /wp:group -->\n";
        }

        return $content;
    }

    /**
     * تولید پرامپت استاندارد تحریریه و سئو/AEO/GEO زبراکد برای هر موضوع
     */
    public function build_article_system_prompt(string $topic, string $focus_keyword = '', string $additional_notes = ''): string {
        $clean_topic = trim($topic);
        $clean_kw    = trim($focus_keyword);
        if (empty($clean_kw)) {
            $clean_kw = $clean_topic;
        }

        $synced_tools = Tool_Synchronizer::get_synced_tools();
        $tools_guideline = '';
        $tools_json_sample = '';
        if (!empty($synced_tools) && is_array($synced_tools)) {
            // Smart semantic scoring based on article topic, focus keyword and notes
            $topic_haystack = mb_strtolower($clean_topic . ' ' . $clean_kw . ' ' . $additional_notes);
            $raw_tokens = preg_split('/[\s,\-_،؛\(\)\/]+/u', $topic_haystack);
            $topic_terms = [];
            foreach ($raw_tokens as $token) {
                $token = trim((string)$token);
                if (mb_strlen($token) >= 2 && !in_array($token, ['در', 'به', 'از', 'با', 'برای', 'یک', 'این', 'آن', 'های', 'شود', 'است', 'کند'], true)) {
                    $topic_terms[] = $token;
                }
            }
            $topic_terms = array_values(array_unique($topic_terms));

            $scored_tools = [];
            foreach ($synced_tools as $t) {
                $t_slug = $t['slug'] ?? '';
                $t_title = $t['title'] ?? '';
                $t_desc = $t['description'] ?? '';
                $t_domain = $t['domain'] ?? '';

                $score = 0;
                $searchable = mb_strtolower("{$t_slug} {$t_title} {$t_desc} {$t_domain}");
                foreach ($topic_terms as $term) {
                    if (str_contains($searchable, $term)) {
                        $score += 10;
                    }
                    if (str_contains(mb_strtolower($t_slug), $term)) {
                        $score += 15;
                    }
                }
                $scored_tools[] = [
                    'tool'  => $t,
                    'score' => $score,
                ];
            }

            // Sort highest matching score first so relevant tools appear at the top
            usort($scored_tools, fn($a, $b) => $b['score'] <=> $a['score']);

            $tool_lines = [];
            foreach ($scored_tools as $item) {
                $t = $item['tool'];
                $t_title = $t['title'] ?? '';
                $t_domain = $t['domain'] ?? '';
                $t_url = $t['url'] ?? '';
                $t_slug = $t['slug'] ?? '';
                $tool_lines[] = "- {$t_title} ({$t_domain}): {$t_url} [اسلاگ: \"{$t_slug}\"]";
            }
            $tools_str = implode("\n", $tool_lines);

            $tools_guideline = "
- **🔗 لینک‌سازی داخلی هوشمند و معتبر (فقط از ابزارهای واقعی سایت):**
  قانون قطعی: فقط و فقط از میان لیست ابزارهای واقعی زیر (که بر اساس ارتباط موضوعی اولویت‌بندی شده‌اند)، ۳ تا ۵ مورد را که ارتباط ماهوی، فنی و مستقیم با موضوع مقاله دارند انتخاب کرده و در طول متن با فرمت استاندارد مارک‌داون `[عنوان طبیعی و کاربردی ابزار](URL)` لینک دهید. **هرگز هیچ ابزار، صفحه یا URL فرضی را اختراع نکنید:**
{$tools_str}
  نمونه لینک داخلی مارک‌داون: `[فرمت و مرتب‌سازی JSON](https://zebracode.ir/json-format)`
  اسلاگ دقیق این ابزارها را حتماً در فیلد `\"related_tools\": [\"slug-1\", \"slug-2\"]` در خروجی JSON قرار دهید.";

            $tools_json_sample = "\n  \"related_tools\": [\"slug-1\", \"slug-2\", \"slug-3\"],";
        } else {
            $tools_guideline = "
- **🔗 لینک‌سازی داخلی هوشمند و معتبر:**
  حداقل ۲ تا ۳ لینک داخلی ارگانیک با فرمت مارک‌داون (`[ابزارهای آنلاین توسعه‌دهندگان](/tools)` یا `[صفحه اصلی زبراکد](/)`) در بخش‌های متناسب متن قرار دهید.";
        }

        $notes_part = !empty($additional_notes) ? "\n**نکات و زوایای تخصصی درخواستی:**\n{$additional_notes}\n" : '';

        return "You are an elite SEO/GEO/AEO content strategist, principal software architect, and senior Persian technical writer.
Write an authoritative, deeply researched, engaging, and comprehensive article in fluent Persian (Farsi) about the following topic:

**Topic / موضوع اصلی مقاله:** {$clean_topic}
**Focus Keyword / کلیدواژه کانونی اصلی:** {$clean_kw}
**حجم و عمق محتوا:** متناسب با عمق موضوع (حداقل ۱۲۰۰ تا ۱۵۰۰ کلمه تحلیلی، تخصصی و ساختاریافته)
{$notes_part}
### الزامات ۵ گانه برای تولید محتوای رتبه یک (SEO, AEO, GEO, Readability, Architecture - نسخه طلایی ۲.۲):

#### ۱. سئو ارگانیک و کلیدواژه معنایی (SEO & Semantic Search):
- **کلیدواژه کانونی («{$clean_kw}»):**
  ۱. عنوان سئو (`seo_title`): شامل «{$clean_kw}» در نیمه نخست عنوان همراه با قلاب جذاب کلیک (CTR Hook) مانند سناریوی کاربردی یا راهنمای جامع (طول ۴۰ تا ۶۰ کاراکتر؛ کوتاه و رسا تا در موبایل و دسکتاپ بریده نشود).
  ۲. عنوان درون صفحه (`title`): عنوان اصلی مقاله برای تگ H1 (جذاب، تحلیلی و معطوف به حل نیاز کاربر).
  ۳. متای توضیحات (`seo_desc`): شامل «{$clean_kw}» همراه با ارزش پیشنهادی ملموس برای کاربر و ترغیب به کلیک (طول ۱۳۰ تا ۱۵۵ کاراکتر).
  ۴. در اولین پاراگراف مقدمه (پاسخ صریح) کلمه کلیدی «{$clean_kw}» با `**{$clean_kw}**` بولد شود.
  ۵. حداقل در یکی از تیترهای سطح ۲ (`## `) عبارت «{$clean_kw}» به شکلی طبیعی و مرتبط حضور داشته باشد.
  ۶. اسلاگ انگلیسی (`slug`): معادل دقیق انگلیسی کلیدواژه با حروف کوچک و خط تیره (kebab-case) مانند `database-optimization` یا `developer-tools` (بدون تاریخ انقضا یا پسوندهای غیرضروری).
  ۷. **پوشش معنایی و سئو ارگانیک (Semantic SEO):** توزیع ارگانیک و روان کلیدواژه در سراسر متن متناسب با طول محتوا (بدون اصرار بر عددسازی یا چگالی مکانیکی). اولویت مطلق با موجودیت‌های مرتبط (Entities)، مترادف‌ها و ارتباط موضوعی عمیق است.
- **جداول داده‌ای و مقایسه‌ای:** فقط در صورت مقایسه‌ای یا لیستی بودن موضوع، یک جدول استاندارد **Markdown Table** با خط‌های عمودی (`| ستون ۱ | ستون ۲ |`) و خط جداکننده (`| --- | --- |`) ایجاد کنید. در موضوعات غیرمقایسه‌ای نیازی به جدول اجباری نیست.
- **لینک‌های معتبر و امن:**
  ۱. لینک‌های داخلی متنی: فقط و فقط از میان لیست ابزارهای واقعی ارائه‌شده در زیر، ۳ تا ۵ مورد واقعاً مرتبط را با انکر تکست توصیفی و فرمت مارک‌داون `[نام ابزار](URL)` لینک دهید. هرگز صفحه یا URL خیالی اختراع نکنید:
{$tools_guideline}
  ۲. حداقل ۱ لینک خارجی به دامنه اصلی مرجع معتبر جهانی متناسب با موضوع با فرمت مارک‌داون: `[مستندات وب (MDN)](https://developer.mozilla.org/)` یا W3C / RFC رسمی. هرگز URLهای فرعی و ناموجود حدس نزنید.

#### ۲. بهینه‌سازی موتورهای پاسخگو و هوش مصنوعی محاوره‌ای (AEO):
- **پاسخ مستقیم (Direct Answer Snippet):** اولین پاراگراف مقاله بین ۳۵ تا ۵۰ کلمه باشد و با تعریف صریح، دقیق و پاسخ قاطع به چیستی و چرایی «{$clean_kw}» آغاز گردد.
- **تیترهای سؤالی:** حداقل ۲ تیتر سطح ۲ (`## `) باید ساختار شفاف سؤالی با علامت سؤال (؟) داشته باشند تا دغدغه‌های پرتکرار کاربران را هدف قرار دهند.
- **پرسش و پاسخ (FAQ):** حداقل ۴ پرسش پرتکرار و فنی با پاسخ‌های مستقیم و شفاف (هر پاسخ بین ۴۰ تا ۶۰ کلمه) در فیلد `faq` در JSON.

#### ۳. استناد و بهینه‌سازی موتورهای هوش مصنوعی مولد (GEO & E-E-A-T):
- **باکس نکات کلیدی:** تیتر `## نکات کلیدی` به همراه یک لیست نشانه‌دار (`- نکته...`) شامل ۳ تا ۴ نکته محوری، کلیدی و برجسته درباره موضوع درج شود.
- **استدلال‌های فنی متناسب با موضوع (بدون کلیشه و توهم آماری):**
  * اگر موضوع به پردازش کلاینت/محلی مربوط است: از حذف رفت‌وبرگشت‌های شبکه (Zero Network Round-Trips) و عدم ارسال داده‌های حساس به سرور ثالث دفاع کنید.
  * اگر موضوع به دیتابیس یا سرور مربوط است: از تیونینگ منابع، ایندکس‌گذاری، کشینگ و کاهش مصرف I/O و CPU دفاع کنید.
  * از تولید آمار ساختگی، درصدهای جعلی و ادعای تست‌های خیالی سازمانی خودداری کنید.
  * در عوض، از **فکت‌های عددی واقعی و استانداردهای فنی** (مانند سال ۲۰۲۶، نسخه‌های استاندارد مثل `SHA-256`، `TLS 1.3`، `HTTP/2`، `OWASP Top 10`، بازه‌های زمانی واقعی مثل `۷ تا ۱۴ روز` یا `۳۶۵ روز` و نوشتن شمارش‌ها با رقم مثل `۳ لایه` یا `۷ گام`) در متن استفاده کنید.
- **بینش غیرکلیشه‌ای و تخصصی (Unique Insight):** حداقل یک زاویه دید تحلیلی نوآورانه یا راهکار متمایز ارائه کنید که فراتر از توضیحات رایج و بازنویسی‌های سطحی وب باشد.
- **چالش‌ها، محدودیت‌ها و عیب‌یابی عمیق (Trade-offs & Pitfalls):** برای اثبات نگاه مهندسی و متوازن، حداقل ۲ محدودیت فنی واقعی و حداقل ۱ سناریوی مشخص که «استفاده از این رویکرد نامناسب است یا نتیجه عکس می‌دهد» را صراحتاً بیان کنید.
- **استناد مستند (Blockquote):** استناد به یک اصل استاندارد مهندسی نرم‌افزار، مستندات رسمی معتبر یا یک بینش اصیل معماری با علامت نقل‌قول مارک‌داون (`> نقل‌قول...`) (از نسبت دادن جملات ساختگی به اشخاص خودداری شود).
- **بخش جمع‌بندی:** پایان مقاله با تیتر `## جمع‌بندی` و چکیده کاربردی به پایان برسد.

#### ۴. نگارش سلیس فارسی و خوانایی تحریریه‌ای (Readability):
- **لحن طبیعی و تحریریه‌ای:** متن باید لحن روان، سلیس، تخصصی و ساختاریافته داشته باشد و از ترجمه‌های خشک یا ماشینی پرهیز شود.
- **تنوع ریتمیک در طول جملات:** جملات کوتاه و صریح (۱۰ تا ۱۵ کلمه) را با جملات تحلیلی مرکب (۲۰ تا ۲۵ کلمه) ترکیب کنید تا جریان متن زنده و پویا بماند.
- **پیوستگی معنایی:** از کلمات پیوند فارسی (مانند بنابراین، همچنین، علاوه بر این، در نتیجه، با این حال، به عنوان مثال) به شکلی طبیعی در جریان متن استفاده کنید.

#### ۵. استاندارد تصاویر سبک و مدرن وب (۱۶:۹ - 1200x675):
- **تصویر شاخص (featured_image_prompt):** پرامپت انگلیسی برای تصویر سبک و کم‌حجم وب با نسبت ۱۶:۹ متناسب با موضوع:
  \"16:9 aspect ratio, 1200x675 resolution, wide angle landscape composition, clean modern dark tech vector styling with electric cyan accents, lightweight web asset, --ar 16:9, --q 1, no text, no typography, no watermark, no logos\"
- **دیاگرام معماری (diagram_prompt):** در صورت ماهیت معماری یا گردشی موضوع، پرامپت انگلیسی معماری/فلوچارت مفهومی با ترکیب افقی ۱۶:۹ بدون متن، به همراه قرار دادن برچسب [DIAGRAM_PLACEHOLDER] در یک خط مجزا در بخش فنی متن مقاله.
- **تصاویر درون محتوا (image_prompts):** حداقل ۲ پرامپت انگلیسی برای عکس‌های سبک متن با نسبت ۱۶:۹ بدون متن، همراه با قرار دادن برچسب‌های [IMAGE_PLACEHOLDER_1] و [IMAGE_PLACEHOLDER_2] هر کدام در یک خط مجزا در بخش‌های متناسب متن.

### 📐 ساختار سکشن‌های فیلد content (Modular Adaptive Markdown Structure):
متن درون فیلد `content` باید یک ساختار ماژولار و تطبیقی با **فرمت خالص Markdown** داشته باشد (هرگز از تگ‌های HTML مانند `<p>`، `<h2>`، `<a>` یا `<table>` درون `content` استفاده نکنید؛ فقط Markdown بنویسید و بین هر بخش یک خط خالی `\\n\\n` بگذارید):
- **پاراگراف پاسخ صریح (Direct Answer):** پاراگراف اول که با `**{$clean_kw}**` آغاز شده، بین ۳۵ تا ۵۰ کلمه بوده و پاسخی دقیق و فنی بدهد.
- **باکس نکات کلیدی:** تیتر `## نکات کلیدی` به همراه لیست `-` با ۳ تا ۴ بولت‌پوینت تحلیلی و دست‌اول.
- **پلیس‌هولدر دیاگرام:** برچسب `[DIAGRAM_PLACEHOLDER]` در یک خط مجزا.
- **بخش تحلیل مفهومی و چرایی:** تیترهای `## ` و `### ` تحلیلی (شامل حداقل ۲ تیتر سؤالی با علامت ؟).
- **پلیس‌هولدرهای تصاویر:** برچسب‌های `[IMAGE_PLACEHOLDER_1]` و `[IMAGE_PLACEHOLDER_2]` در خطوط مجزا.
- **بخش پیاده‌سازی عملی / مقایسه تخصصی:** در صورت نیاز جدول مقایسه‌ای استاندارد Markdown (`| ... |`) یا نمونه کدهای فنی با بلوک کد مارک‌داون (` ```language ... ``` `) یا لیست‌های ترتیبی (`1. `).
- **چالش‌ها، محدودیت‌ها و عیب‌یابی (Trade-offs & Pitfalls):** بررسی حداقل ۲ محدودیت فنی واقعی و سناریوهای منع استفاده.
- **واکاوی استانداردها، استناد و لینک‌سازی داخلی:** استناد مستند با `> ` و درج طبیعی لینک‌های داخلی ابزارها و لینک خارجی MDN به شکل `[متن](URL)`.
- **جمع‌بندی تحلیلی:** تیتر `## جمع‌بندی` به همراه نتیجه‌گیری کاربردی و راهنمای گام بعدی.

#### ۶. قوانین خروجی و فرمت دقیق JSON (Strict JSON Validity):
- خروجی فقط و فقط باید یک آبجکت معتبر JSON باشد.
- ⚠️ **قانون قطعی برای فیلد content:** تمام متن مقاله در فیلد `content` را منحصراً با **Markdown استاندارد** (`##`، `###`، `-`، `1.`، `| جدول |`، `> نقل‌قول`، `[متن](URL)`) بنویسید و پاراگراف‌ها/بخش‌ها را با `\\n\\n` جدا کنید. **به هیچ عنوان تگ‌های HTML داخل `content` نگذارید تا هیچ چت‌باتی تگ‌ها را حذف یا خراب نکند.**
- **اکیداً ممنوع:** هیچ متن توضیحی، پیام احوال‌پرسی، تعارف، یا سؤال و پیشنهاد پیگیری قبل یا بعد از JSON ننویسید.
- پاسخ شما باید منحصراً با کاراکتر { آغاز شده و با علامت } به پایان برسد.

```json
{
  \"title\": \"راهنمای جامع {$clean_kw}: تحلیل معماری، ابزارها و تکنیک‌های پیاده‌سازی\",
  \"focus_keyword\": \"{$clean_kw}\",
  \"slug\": \"database-optimization-guide\",
  \"seo_title\": \"{$clean_kw} چیست؟ راهنمای جامع و کاربردی\",
  \"seo_desc\": \"راهنمای کامل {$clean_kw}؛ بررسی تکنیک‌های بهینه‌سازی، مقایسه روش‌ها و معرفی ابزارهای ضروری برای بهبود راندمان سیستم.\",
  \"featured_image_prompt\": \"English prompt for 16:9 featured image...\",
  \"diagram_prompt\": \"English prompt for technical architecture diagram...\",
  \"image_prompts\": [
    \"English prompt for in-content image 1...\",
    \"English prompt for in-content image 2...\"
  ],
  \"faq\": [
    {\"question\": \"{$clean_kw} چیست و چه کاربردی دارد؟\", \"answer\": \"پاسخ مستقیم و کوتاه بین ۴۰ تا ۶۰ کلمه...\"},
    {\"question\": \"مهم‌ترین محدودیت یا چالش در پیاده‌سازی {$clean_kw} چیست؟\", \"answer\": \"پاسخ تحلیلی بین ۴۰ تا ۶۰ کلمه درباره محدودیت‌ها و راه‌حل...\"}
  ],{$tools_json_sample}
  \"content\": \"**{$clean_kw}** پاسخی ۳۵ تا ۵۰ کلمه‌ای...\\n\\n## نکات کلیدی\\n- نکته ۱\\n- نکته ۲\\n\\n[DIAGRAM_PLACEHOLDER]\\n\\n## چرا {$clean_kw} حیاتی است؟\\nتوضیحات...\\n\\n[IMAGE_PLACEHOLDER_1]\\n\\n| عنوان | ویژگی |\\n| --- | --- |\\n| روش ۱ | توضیح |\\n\\n[IMAGE_PLACEHOLDER_2]\\n\\n> نقل‌قول مهندسی\\n\\n## جمع‌بندی\\nنتیجه‌گیری...\"
}
```

### 🚀 نحوه ارسال به ابزار create_post در محیط‌های MCP:
هنگام فراخوانی ابزار `create_post`، باید تمام کلیدهای بالا (به‌ویژه `featured_image_prompt`، `diagram_prompt`، `image_prompts` و `faq`) را به عنوان آرگومان‌های مستقل به ابزار ارسال نمایید و متن `content` حتماً شامل برچسب‌های `[DIAGRAM_PLACEHOLDER]`، `[IMAGE_PLACEHOLDER_1]` و `[IMAGE_PLACEHOLDER_2]` باشد تا به بلوک‌های بصری مدرن در سایت تبدیل گردند.";
    }
}
