<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Sitemap-driven Developer Tools Synchronizer and Manager.
 * Supports multiple domains (e.g. https://zebracode.ir/ and https://kit.zebracode.ir/).
 */
class Tool_Synchronizer {
    public const OPTION_SYNCED_TOOLS = 'omni_ai_synced_tools';
    public const OPTION_SITEMAPS     = 'omni_ai_tool_sitemaps';

    /**
     * Default sitemap endpoints.
     */
    public static function get_default_sitemaps(): array {
        return [
            'https://zebracode.ir/sitemap.xml',
            'https://kit.zebracode.ir/sitemap.xml',
        ];
    }

    /**
     * Get configured sitemap URLs.
     */
    public static function get_sitemap_urls(): array {
        $urls = get_option(self::OPTION_SITEMAPS, null);
        if (!is_array($urls) || empty($urls)) {
            $urls = self::get_default_sitemaps();
        }
        return array_values(array_unique(array_filter(array_map('trim', $urls))));
    }

    /**
     * Load comprehensive tools catalog from bundled JSON file.
     * Contains 151 developer and utility tools across zebracode.ir and kit.zebracode.ir.
     */
    public static function get_catalog_tools(): array {
        static $cached = null;
        if ($cached !== null) {
            return $cached;
        }

        $candidates = [
            defined('OMNI_AI_PATH') ? OMNI_AI_PATH . 'includes/data/tools-catalog.json' : '',
            dirname(__DIR__) . '/data/tools-catalog.json',
            dirname(dirname(__DIR__)) . '/includes/data/tools-catalog.json',
        ];

        foreach ($candidates as $file) {
            if (!empty($file) && file_exists($file)) {
                $raw = @file_get_contents($file);
                if (!empty($raw)) {
                    $data = json_decode($raw, true);
                    if (is_array($data) && !empty($data)) {
                        $cached = $data;
                        return $cached;
                    }
                }
            }
        }

        $cached = [];
        return $cached;
    }

    /**
     * Built-in dictionary of Persian titles and descriptions for known developer tools.
     */
    public static function get_known_tools_dict(): array {
        $catalog = self::get_catalog_tools();
        if (!empty($catalog)) {
            $dict = [];
            foreach ($catalog as $item) {
                $slug = $item['slug'] ?? '';
                if (!empty($slug)) {
                    $dict[$slug] = [
                        'title'       => $item['title'] ?? '',
                        'description' => $item['description'] ?? '',
                    ];
                }
            }
            return $dict;
        }

        return [
            // Core ZebraCode tools
            'json-to-big-query' => [
                'title'       => 'تبدیل JSON به BigQuery Schema',
                'description' => 'تولید خودکار اسکیما و دستورات جدول BigQuery از داده‌های JSON.',
            ],
            'json-schema-validator' => [
                'title'       => 'اعتبارسنجی JSON Schema',
                'description' => 'تست و بررسی انطباق ساختار داده‌های JSON با اسکیما.',
            ],
            'json-format' => [
                'title'       => 'فرمت و مرتب‌سازی JSON',
                'description' => 'زیباسازی، اعتبارسنجی و فشرده‌سازی متن JSON در مرورگر.',
            ],
            'json-to-typescript' => [
                'title'       => 'تبدیل JSON به TypeScript Interfaces',
                'description' => 'تولید خودکار تایپ‌ها و اینترفیس‌های تایپ‌اسکریپت از JSON.',
            ],
            'jwt-encoder-decoder' => [
                'title'       => 'دیکودر و انکودر JWT',
                'description' => 'بررسی پی‌لود، هدر و انقضای توکن‌های JSON Web Token بدون ارسال به سرور.',
            ],
            'base64-encode-decode' => [
                'title'       => 'تبدیل Base64',
                'description' => 'انکود و دیکود داده‌های متنی و باینری با پشتیبانی از UTF-8.',
            ],
            'sql-formatter' => [
                'title'       => 'فرمت‌کننده کوئری‌های SQL',
                'description' => 'زیباسازی و خواناسازی سریع کدهای پیچیده SQL.',
            ],
            'regex-tester' => [
                'title'       => 'تست‌کننده عبارت‌های منظم (Regex)',
                'description' => 'بررسی، تست و تطابق الگوهای Regex به صورت زنده.',
            ],
            'lorem-ipsum-generator' => [
                'title'       => 'تولیدکننده متن تصادفی لورم ایپسوم',
                'description' => 'تولید پاراگراف‌ها و کلمات تستی فارسی و انگلیسی.',
            ],
            'hash-generator' => [
                'title'       => 'تولیدکننده هش (MD5, SHA-256)',
                'description' => 'محاسبه سریع چک‌سام و هشدارهای امنیتی در کلاینت.',
            ],
            'color-converter' => [
                'title'       => 'تبدیل کدهای رنگ (HEX, RGB, HSL)',
                'description' => 'تبدیل پالت‌های رنگی و کپی فرمت‌های مورد نیاز وب.',
            ],
            'cron-generator' => [
                'title'       => 'سازنده عبارات زمان‌بندی Cron',
                'description' => 'تنظیم و درک زمان‌بندی جاب‌های کران به زبان ساده.',
            ],
            'url-encoder-decoder' => [
                'title'       => 'انکود و دیکود URL',
                'description' => 'تبدیل کاراکترهای خاص و پارامترهای Query String به فرمت استاندارد.',
            ],
            // Kit ZebraCode tools
            'invoice-generator' => [
                'title'       => 'سازنده فاکتور و پیش‌فاکتور آنلاین',
                'description' => 'صدور، محاسبه مالیات و چاپ فاکتور رسمی و شرکتی در مرورگر.',
            ],
            'qr-code-generator' => [
                'title'       => 'تولیدکننده بارکد و QR Code',
                'description' => 'ساخت کدهای QR با رنگ، حاشیه و لوگوی اختصاصی.',
            ],
            'barcode-generator' => [
                'title'       => 'سازنده بارکد میله‌ای آنلاین',
                'description' => 'تولید انواع استانداردهای بارکد میله‌ای (Code128, EAN-13).',
            ],
            'uuid-generator' => [
                'title'       => 'تولیدکننده شناسه‌های UUID (v4/v7)',
                'description' => 'تولید انبوه شناسه‌های تصادفی و بر پایه زمان استاندارد.',
            ],
            'password-generator' => [
                'title'       => 'تولیدکننده پسورد قوی و امن',
                'description' => 'تولید رمزهای عبور تصادفی با قابلیت انتخاب کاراکترها و نمادها.',
            ],
            'text-diff' => [
                'title'       => 'مقایسه‌کننده متن و کد (Diff Checker)',
                'description' => 'بررسی آنلاین تفاوت‌های دو متن یا فایل سورس‌کد با هایلایت تغییرات.',
            ],
            'markdown-editor' => [
                'title'       => 'ویرایشگر آنلاین مارک‌داون',
                'description' => 'نوشتن، پیش‌نمایش بلادرنگ و خروجی HTML برای فایل‌های Markdown.',
            ],
            'image-compressor' => [
                'title'       => 'فشرده‌ساز تصاویر وب',
                'description' => 'کاهش حجم عکس‌های WebP, PNG, JPEG بدون افت کیفیت محسوس.',
            ],
            'css-minifier' => [
                'title'       => 'فشرده‌ساز کدهای CSS',
                'description' => 'حذف فاصله‌ها و بهینه‌سازی استایل‌های CSS برای لود سریع‌تر.',
            ],
            'js-minifier' => [
                'title'       => 'فشرده‌ساز جاوااسکریپت',
                'description' => 'کوچک‌سازی و بهینه‌سازی کدهای JavaScript در مرورگر.',
            ],
            'html-formatter' => [
                'title'       => 'مرتب‌کننده و فرمت HTML',
                'description' => 'زیباسازی و ایندنت‌گذاری کدهای HTML با تنظیم فاصله.',
            ],
            'fake-data-generator' => [
                'title'       => 'تولیدکننده داده‌های تستی (Mock Data)',
                'description' => 'ساخت داده‌های ساختگی کاربران و آدرس‌ها برای تست دیتابیس و API.',
            ],
            'timestamp-converter' => [
                'title'       => 'تبدیل زمان Unix Timestamp',
                'description' => 'تبدیل ثانیه‌های یونیکس به تاریخ شمسی، میلادی و زمان محلی.',
            ],
        ];
    }

    /**
     * Initial seed tools when storage is empty.
     */
    public static function get_default_seed_tools(): array {
        $catalog = self::get_catalog_tools();
        if (!empty($catalog)) {
            return $catalog;
        }

        $dict = self::get_known_tools_dict();
        $kit_slugs = ['invoice-generator', 'qr-code-generator', 'barcode-generator', 'uuid-generator', 'password-generator', 'text-diff'];

        $seed = [];
        foreach ($dict as $slug => $meta) {
            $is_kit = in_array($slug, $kit_slugs, true);
            $domain = $is_kit ? 'kit.zebracode.ir' : 'zebracode.ir';
            $url = 'https://' . $domain . '/' . $slug;

            $seed[] = [
                'slug'        => $slug,
                'title'       => $meta['title'],
                'description' => $meta['description'],
                'url'         => $url,
                'domain'      => $domain,
            ];
        }

        return $seed;
    }

    /**
     * Get all synced tools, seeding with defaults if empty or outdated.
     */
    public static function get_synced_tools(): array {
        $tools = get_option(self::OPTION_SYNCED_TOOLS, null);
        if (!is_array($tools) || count($tools) < 100) {
            $tools = self::get_default_seed_tools();
            update_option(self::OPTION_SYNCED_TOOLS, $tools, false);
        }
        return array_values($tools);
    }

    /**
     * Check if a path/URL is a valid developer tool.
     */
    public static function parse_tool_url(string $loc): ?array {
        $loc = trim($loc);
        if (empty($loc)) {
            return null;
        }

        $parts = parse_url($loc);
        if (empty($parts['host'])) {
            return null;
        }

        $domain = strtolower($parts['host']);
        $raw_path = trim($parts['path'] ?? '', '/');

        if (empty($raw_path)) {
            return null; // Root home
        }

        // Normalize multilingual path (e.g. 'fa/json-format' or 'en/json-format')
        $clean_path = preg_replace('#^(en|fa)/#i', '', $raw_path);
        $clean_path = trim($clean_path, '/');

        if (empty($clean_path)) {
            return null;
        }

        $first_segment = strtolower(explode('/', $clean_path)[0]);
        $ignored_roots = [
            'blog', 'articles', 'category', 'tag', 'about', 'contact', 'privacy',
            'terms', 'robots.txt', 'sitemap.xml', 'icon.svg', 'feed', 'wp-admin',
            'wp-content', 'wp-includes', 'wp-json', 'page', 'author', 'search',
        ];

        if (in_array($first_segment, $ignored_roots, true)) {
            return null;
        }

        // Slug is the last meaningful segment
        $slug = basename($clean_path);
        $slug = preg_replace('/\.(html|php|xml|json|txt)$/i', '', $slug);
        $slug = sanitize_title($slug);

        if (empty($slug) || strlen($slug) < 2) {
            return null;
        }

        // Match against known dictionary
        $dict = self::get_known_tools_dict();
        if (isset($dict[$slug])) {
            $title = $dict[$slug]['title'];
            $description = $dict[$slug]['description'];
        } else {
            // Smart slug formatting
            $words = explode('-', $slug);
            $clean_words = array_map(function ($w) {
                if (in_array(strtolower($w), ['json', 'sql', 'css', 'js', 'html', 'jwt', 'url', 'uuid', 'api', 'regex', 'svg', 'csv', 'xml', 'md5', 'sha256'], true)) {
                    return strtoupper($w);
                }
                return ucfirst($w);
            }, $words);

            $title = 'ابزار آنلاین ' . implode(' ', $clean_words);
            $description = 'ابزار کاربردی توسعه‌دهندگان زبراکد در ' . $domain . '.';
        }

        // Canonical tool URL without extra trailing slashes or locale prefix
        $target_url = 'https://' . $domain . '/' . $slug;

        return [
            'slug'        => $slug,
            'title'       => $title,
            'description' => $description,
            'url'         => $target_url,
            'domain'      => $domain,
        ];
    }

    /**
     * Crawl sitemaps and sync tools.
     */
    public static function sync_from_sitemaps(array $sitemap_urls): array {
        $normalized_sitemaps = [];
        foreach ($sitemap_urls as $u) {
            $u = trim((string) $u);
            if (empty($u)) {
                continue;
            }
            if (!preg_match('#^https?://#i', $u)) {
                $u = 'https://' . $u;
            }
            if (!str_contains($u, '.xml') && !str_ends_with($u, 'sitemap')) {
                $u = rtrim($u, '/') . '/sitemap.xml';
            }
            $normalized_sitemaps[] = esc_url_raw($u);
        }

        $normalized_sitemaps = array_values(array_unique(array_filter($normalized_sitemaps)));
        if (empty($normalized_sitemaps)) {
            $normalized_sitemaps = self::get_default_sitemaps();
        }

        // Load existing tools to preserve user edits
        $existing_tools = self::get_synced_tools();
        $existing_by_slug = [];
        foreach ($existing_tools as $t) {
            if (!empty($t['slug'])) {
                $existing_by_slug[$t['slug']] = $t;
            }
        }

        $discovered_tools = [];
        $visited = [];
        $queue = $normalized_sitemaps;
        $max_fetches = 25;
        $fetches = 0;

        while (!empty($queue) && $fetches < $max_fetches) {
            $sitemap_url = array_shift($queue);
            if (isset($visited[$sitemap_url])) {
                continue;
            }
            $visited[$sitemap_url] = true;
            $fetches++;

            $response = wp_remote_get($sitemap_url, [
                'timeout'     => 12,
                'sslverify'   => false,
                'user-agent'  => 'OmniAISuite-SitemapCrawler/1.0 (+https://zebracode.ir)',
            ]);

            if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
                continue;
            }

            $body = wp_remote_retrieve_body($response);
            if (empty($body)) {
                continue;
            }

            // Check for sitemap index
            if (preg_match_all('/<sitemap>\s*<loc>\s*([^<]+)\s*<\/loc>/is', $body, $sub_matches)) {
                foreach ($sub_matches[1] as $sub_url) {
                    $sub_url = trim($sub_url);
                    if (!isset($visited[$sub_url]) && count($queue) < 15) {
                        $queue[] = $sub_url;
                    }
                }
            }

            // Parse URLs
            if (preg_match_all('/<url>\s*<loc>\s*([^<]+)\s*<\/loc>/is', $body, $url_matches)) {
                foreach ($url_matches[1] as $loc) {
                    $tool = self::parse_tool_url($loc);
                    if ($tool) {
                        $slug = $tool['slug'];
                        // Preserve previous custom titles / descriptions if user customized them
                        if (isset($existing_by_slug[$slug])) {
                            $tool['title'] = $existing_by_slug[$slug]['title'] ?? $tool['title'];
                            $tool['description'] = $existing_by_slug[$slug]['description'] ?? $tool['description'];
                        }
                        $discovered_tools[$slug] = $tool;
                    }
                }
            }
        }

        // If crawler could not reach external domains (e.g. offline/local test), merge with seed tools
        if (empty($discovered_tools)) {
            $discovered_tools = $existing_by_slug ?: [];
            foreach (self::get_default_seed_tools() as $seed) {
                if (!isset($discovered_tools[$seed['slug']])) {
                    $discovered_tools[$seed['slug']] = $seed;
                }
            }
        } else {
            // Keep existing tools not found in sitemap if they were previously saved
            foreach ($existing_by_slug as $slug => $old_tool) {
                if (!isset($discovered_tools[$slug])) {
                    $discovered_tools[$slug] = $old_tool;
                }
            }
        }

        $final_tools = array_values($discovered_tools);
        update_option(self::OPTION_SYNCED_TOOLS, $final_tools, false);
        update_option(self::OPTION_SITEMAPS, $normalized_sitemaps, false);

        return [
            'success'      => true,
            'tools'        => $final_tools,
            'sitemap_urls' => $normalized_sitemaps,
            'count'        => count($final_tools),
            'message'      => sprintf(__('همگام‌سازی ابزارها با موفقیت انجام شد. %d ابزار ثبت شد.', 'omni-ai-suite'), count($final_tools)),
        ];
    }

    /**
     * Save all tools manually from admin UI.
     */
    public static function save_all_tools(array $tools): array {
        $sanitized = [];
        foreach ($tools as $tool) {
            $slug = sanitize_title($tool['slug'] ?? '');
            if (empty($slug)) {
                continue;
            }
            $title = sanitize_text_field($tool['title'] ?? $slug);
            $desc = sanitize_textarea_field($tool['description'] ?? '');
            $url = esc_url_raw($tool['url'] ?? ('https://zebracode.ir/' . $slug));
            $domain = sanitize_text_field($tool['domain'] ?? parse_url($url, PHP_URL_HOST) ?? 'zebracode.ir');

            $sanitized[] = [
                'slug'        => $slug,
                'title'       => $title,
                'description' => $desc,
                'url'         => $url,
                'domain'      => $domain,
            ];
        }

        update_option(self::OPTION_SYNCED_TOOLS, $sanitized, false);

        return [
            'success' => true,
            'tools'   => $sanitized,
            'count'   => count($sanitized),
            'message' => __('تغییرات ابزارهای سایت با موفقیت ذخیره شد.', 'omni-ai-suite'),
        ];
    }

    /**
     * Add or update a single tool.
     */
    public static function add_or_update_tool(array $data): array {
        $tools = self::get_synced_tools();
        $slug = sanitize_title($data['slug'] ?? '');
        if (empty($slug)) {
            return ['success' => false, 'message' => __('نامک (slug) ابزار الزامی است.', 'omni-ai-suite')];
        }

        $title = sanitize_text_field($data['title'] ?? $slug);
        $desc = sanitize_textarea_field($data['description'] ?? '');
        $url = esc_url_raw($data['url'] ?? ('https://zebracode.ir/' . $slug));
        $domain = sanitize_text_field($data['domain'] ?? parse_url($url, PHP_URL_HOST) ?? 'zebracode.ir');

        $updated = false;
        foreach ($tools as $idx => $t) {
            if ($t['slug'] === $slug) {
                $tools[$idx] = [
                    'slug'        => $slug,
                    'title'       => $title,
                    'description' => $desc,
                    'url'         => $url,
                    'domain'      => $domain,
                ];
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            array_unshift($tools, [
                'slug'        => $slug,
                'title'       => $title,
                'description' => $desc,
                'url'         => $url,
                'domain'      => $domain,
            ]);
        }

        update_option(self::OPTION_SYNCED_TOOLS, $tools, false);

        return [
            'success' => true,
            'tools'   => $tools,
            'message' => __('ابزار با موفقیت ذخیره شد.', 'omni-ai-suite'),
        ];
    }

    /**
     * Delete a tool by slug.
     */
    public static function delete_tool(string $slug): array {
        $slug = sanitize_title($slug);
        $tools = self::get_synced_tools();
        $filtered = array_values(array_filter($tools, function ($t) use ($slug) {
            return $t['slug'] !== $slug;
        }));

        update_option(self::OPTION_SYNCED_TOOLS, $filtered, false);

        return [
            'success' => true,
            'tools'   => $filtered,
            'message' => __('ابزار مورد نظر با موفقیت حذف شد.', 'omni-ai-suite'),
        ];
    }

    /**
     * Match and enrich related tools for a blog post.
     * Returns rich objects: [{ "slug", "title", "description", "url", "domain" }].
     */
    public static function enrich_post_tools(
        int $post_id,
        string $post_title = '',
        string $post_excerpt = '',
        string $category = '',
        string $focus_keyword = '',
        array $tags = []
    ): array {
        $synced_tools = self::get_synced_tools();
        $tools_by_slug = [];
        foreach ($synced_tools as $st) {
            if (!empty($st['slug'])) {
                $tools_by_slug[$st['slug']] = $st;
            }
        }

        // 1. Check if post has explicit related tools meta
        $raw_tools = get_post_meta($post_id, '_zebracode_blog_ai_related_tools', true);
        $selected_slugs = [];
        if (is_array($raw_tools)) {
            foreach ($raw_tools as $t) {
                if (is_string($t) && trim($t) !== '') {
                    $selected_slugs[] = sanitize_title($t);
                } elseif (is_array($t) && !empty($t['slug'])) {
                    $selected_slugs[] = sanitize_title($t['slug']);
                }
            }
        }

        // 2. If empty, auto-match up to 3 relevant tools based on content keywords
        if (empty($selected_slugs) && !empty($synced_tools)) {
            $post_text = mb_strtolower($post_title . ' ' . $post_excerpt . ' ' . $category . ' ' . $focus_keyword . ' ' . implode(' ', $tags));
            $scored = [];

            foreach ($synced_tools as $st) {
                $st_slug = $st['slug'] ?? '';
                $st_title = mb_strtolower($st['title'] ?? '');
                $st_desc = mb_strtolower($st['description'] ?? '');
                $score = 0;

                // Match slug parts
                $words = explode('-', $st_slug);
                foreach ($words as $w) {
                    if (strlen($w) > 2 && mb_strpos($post_text, $w) !== false) {
                        $score += 3;
                    }
                }

                // Match title keywords
                if (!empty($st_title)) {
                    $title_words = explode(' ', $st_title);
                    foreach ($title_words as $tw) {
                        if (strlen($tw) > 3 && mb_strpos($post_text, $tw) !== false) {
                            $score += 2;
                        }
                    }
                }

                $scored[] = ['slug' => $st_slug, 'score' => $score];
            }

            usort($scored, function ($a, $b) {
                return $b['score'] <=> $a['score'];
            });

            $count = 0;
            foreach ($scored as $item) {
                if ($count >= 3) {
                    break;
                }
                $selected_slugs[] = $item['slug'];
                $count++;
            }
        }

        // 3. Format as rich objects
        $enriched = [];
        foreach ($selected_slugs as $slug) {
            if (isset($tools_by_slug[$slug])) {
                $tool = $tools_by_slug[$slug];
                $enriched[] = [
                    'slug'        => $tool['slug'],
                    'title'       => $tool['title'],
                    'description' => $tool['description'],
                    'url'         => !empty($tool['url']) ? $tool['url'] : 'https://zebracode.ir/' . $tool['slug'],
                    'domain'      => $tool['domain'] ?? 'zebracode.ir',
                ];
            } else {
                // Fallback for custom slug
                $dict = self::get_known_tools_dict();
                $known = $dict[$slug] ?? null;
                $enriched[] = [
                    'slug'        => $slug,
                    'title'       => $known ? $known['title'] : ucwords(str_replace('-', ' ', $slug)),
                    'description' => $known ? $known['description'] : 'ابزار کاربردی توسعه‌دهندگان زبراکد.',
                    'url'         => 'https://zebracode.ir/' . $slug,
                    'domain'      => 'zebracode.ir',
                ];
            }
        }

        return $enriched;
    }
}
