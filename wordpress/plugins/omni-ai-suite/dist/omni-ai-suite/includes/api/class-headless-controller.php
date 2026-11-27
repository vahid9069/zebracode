<?php
namespace OmniAI\Api;

use OmniAI\Providers\Provider_Factory;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Headless Blog & SEO API Controller for Next.js and frontend consumers.
 */
class Headless_Controller {
    public const NAMESPACE = 'omni-ai/v1';

    /**
     * Register public headless and SEO REST API routes.
     */
    public function register_routes(): void {
        // Categories endpoint (public for Next.js blog and Gutenberg/Studio)
        register_rest_route(self::NAMESPACE, '/categories', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'handle_get_categories'],
            'permission_callback' => '__return_true',
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

        // Signed Headless Preview Endpoint for static Next.js frontend
        register_rest_route(self::NAMESPACE, '/preview', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'handle_get_preview_post'],
            'permission_callback' => '__return_true',
            'args'                => [
                'id'    => [
                    'required'          => true,
                    'sanitize_callback' => 'absint',
                ],
                'exp'   => [
                    'required'          => true,
                    'sanitize_callback' => 'absint',
                ],
                'token' => [
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);
    }

    /**
     * Register WordPress admin/editor hooks for headless preview links.
     */
    public function register_preview_hooks(): void {
        add_filter('preview_post_link', [$this, 'filter_preview_post_link'], 10, 2);
    }

    /**
     * Resolve the configured Next.js blog base URL.
     */
    private function get_blog_base_url(): string {
        $base_url = '';
        if (defined('OMNI_AI_PREVIEW_BASE_URL') && is_string(OMNI_AI_PREVIEW_BASE_URL)) {
            $base_url = trim(OMNI_AI_PREVIEW_BASE_URL);
        }
        if ($base_url === '' && class_exists('\\OmniAI\\Modules\\Social_Broadcast')) {
            $settings = \OmniAI\Modules\Social_Broadcast::get_settings();
            if (!empty($settings['blog_base_url']) && is_string($settings['blog_base_url'])) {
                $base_url = trim($settings['blog_base_url']);
            }
        }
        if ($base_url === '') {
            $base_url = 'https://zebracode.ir/blog';
        }
        return rtrim((string) apply_filters('omni_ai_preview_base_url', $base_url), '/');
    }

    /**
     * Generate an HMAC-SHA256 preview token bound to post ID and expiration timestamp.
     */
    private function generate_preview_token(int $post_id, int $exp): string {
        return hash_hmac('sha256', $post_id . '|' . $exp, wp_salt('auth'));
    }

    /**
     * Redirect WordPress editor "Preview" button to the static Next.js /preview/ page.
     *
     * @param string   $preview_link
     * @param \WP_Post $post
     * @return string
     */
    public function filter_preview_post_link(string $preview_link, $post): string {
        if (!($post instanceof \WP_Post) || $post->post_type !== 'post') {
            return $preview_link;
        }

        $exp   = time() + (15 * MINUTE_IN_SECONDS);
        $token = $this->generate_preview_token((int) $post->ID, $exp);

        return add_query_arg([
            'id'    => (int) $post->ID,
            'exp'   => $exp,
            'token' => $token,
        ], $this->get_blog_base_url() . '/preview/');
    }

    /**
     * Return a single post (including drafts & autosaves) when a valid signed preview token is provided.
     */
    public function handle_get_preview_post(\WP_REST_Request $request): \WP_REST_Response {
        $post_id = absint($request->get_param('id'));
        $exp     = absint($request->get_param('exp'));
        $token   = sanitize_text_field((string) ($request->get_param('token') ?? ''));

        $respond = function (array $data, int $status): \WP_REST_Response {
            $response = new \WP_REST_Response($data, $status);
            $request_origin = isset($_SERVER['HTTP_ORIGIN']) ? esc_url_raw(wp_unslash($_SERVER['HTTP_ORIGIN'])) : '';
            $blog_origin    = '';
            $parsed_blog    = wp_parse_url($this->get_blog_base_url());
            if (!empty($parsed_blog['scheme']) && !empty($parsed_blog['host'])) {
                $blog_origin = $parsed_blog['scheme'] . '://' . $parsed_blog['host'] . (!empty($parsed_blog['port']) ? ':' . $parsed_blog['port'] : '');
            }
            $allowed_origins = array_filter(array_unique([
                $blog_origin,
                'https://zebracode.ir',
                'http://localhost:3004',
                'http://127.0.0.1:3004',
            ]));
            if ($request_origin && in_array($request_origin, $allowed_origins, true)) {
                $response->header('Access-Control-Allow-Origin', $request_origin);
            } elseif ($blog_origin) {
                $response->header('Access-Control-Allow-Origin', $blog_origin);
            }
            $response->header('Vary', 'Origin');
            $response->header('Cache-Control', 'no-store, no-cache, must-revalidate');
            return $response;
        };

        if (!$post_id || !$exp || $token === '') {
            return $respond(['success' => false, 'message' => 'پارامترهای پیش‌نمایش ناقص است.'], 400);
        }

        if (time() > $exp) {
            return $respond(['success' => false, 'message' => 'لینک پیش‌نمایش منقضی شده است. لطفاً دوباره در وردپرس روی Preview کلیک کنید.'], 403);
        }

        $expected = $this->generate_preview_token($post_id, $exp);
        if (!hash_equals($expected, $token)) {
            return $respond(['success' => false, 'message' => 'توکن پیش‌نمایش نامعتبر است.'], 403);
        }

        $post = get_post($post_id);
        if (!($post instanceof \WP_Post) || $post->post_type !== 'post') {
            return $respond(['success' => false, 'message' => 'مقاله مورد نظر پیدا نشد.'], 404);
        }

        $is_autosave = false;
        $autosave    = wp_get_post_autosave($post_id);
        $target_post = clone $post;

        if ($autosave instanceof \WP_Post && strtotime($autosave->post_modified_gmt) > strtotime($post->post_modified_gmt)) {
            $is_autosave               = true;
            $target_post->post_title   = $autosave->post_title;
            $target_post->post_content = $autosave->post_content;
            $target_post->post_excerpt = $autosave->post_excerpt;
        }

        $formatted = $this->format_post_for_blog($target_post);

        if ($is_autosave) {
            if (!empty($autosave->post_title)) {
                $formatted['title'] = wp_strip_all_tags($autosave->post_title);
            }
            if (!empty($autosave->post_excerpt)) {
                $formatted['excerpt'] = wp_strip_all_tags($autosave->post_excerpt);
            }
        }
        if (empty($formatted['slug'])) {
            $formatted['slug'] = 'preview-' . $post_id;
        }

        return $respond([
            'success'     => true,
            'status'      => $post->post_status,
            'is_autosave' => $is_autosave,
            'post'        => $formatted,
        ], 200);
    }

    /**
     * Public endpoint to get blog categories for the Next.js navigation and filtering.
     *
     * @return \WP_REST_Response
     */
    public function handle_get_categories(): \WP_REST_Response {
        $wp_categories = get_categories(['hide_empty' => false]);
        $list = [];
        if (is_array($wp_categories)) {
            $has_other_cats = count($wp_categories) > 1;
            foreach ($wp_categories as $c) {
                $raw_slug = (string) $c->slug;
                $decoded_slug = urldecode($raw_slug);
                $clean_name = html_entity_decode($c->name, ENT_QUOTES, 'UTF-8');

                // If other categories are present, filter out default uncategorized
                if ($has_other_cats && in_array(strtolower($raw_slug), ['uncategorized', 'uncategorised', '%d8%af%d8%b3%d8%aa%d9%87%e2%80%8c%d8%a8%d9%86%d8%af%db%8c-%d9%86%d8%b4%d8%af%d9%87'], true)) {
                    continue;
                }
                if ($has_other_cats && in_array($clean_name, ['دسته‌بندی نشده', 'دسته بندی نشده', 'Uncategorized'], true)) {
                    continue;
                }

                $list[] = [
                    'id'          => (int) $c->term_id,
                    'slug'        => $decoded_slug,
                    'name'        => $clean_name,
                    'count'       => (int) $c->count,
                    'description' => html_entity_decode((string) $c->description, ENT_QUOTES, 'UTF-8'),
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

        // Security: Unauthenticated or non-editing users must strictly query published posts only
        $can_edit = current_user_can('edit_posts');
        if ($can_edit) {
            $status_param = sanitize_key($request->get_param('status') ?? 'publish');
            $allowed_statuses = ['publish', 'draft', 'pending', 'any'];
            $post_status = in_array($status_param, $allowed_statuses, true) ? $status_param : 'publish';
        } else {
            $post_status = 'publish';
        }

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

        // Security: Only allow 'draft' in post_status if current_user_can('edit_posts') is true; otherwise 'publish' only
        $allowed_status = current_user_can('edit_posts') ? ['publish', 'draft'] : 'publish';

        $query = new \WP_Query([
            'post_type'      => 'post',
            'post_status'    => $allowed_status,
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

        // Related tools (enriched with sitemap-driven sync data & auto-matching)
        $related_tools = \OmniAI\Modules\Tool_Synchronizer::enrich_post_tools(
            $post_id,
            $post_title,
            $post_excerpt,
            $primary_category,
            $focus_keyword,
            $tags
        );

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

        // Level 5: Check if ads are disabled on this post
        $disable_ads_meta = get_post_meta($post_id, '_omni_ai_disable_ads', true);
        $disable_ads = ($disable_ads_meta === '1' || $disable_ads_meta === 1 || $disable_ads_meta === true);
        $post_ads = $disable_ads ? [] : \OmniAI\Modules\Ads_Manager::get_ads_for_post($post);

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
                'name'       => $author_name,
                'role'       => 'تحریریه زبراکد',
                'bio'        => $author_bio,
                'initials'   => mb_substr($author_name, 0, 2),
                'avatar_url' => get_avatar_url((int) get_post_field('post_author', $post_id), ['size' => 128]) ?: '',
            ],
            'meta_description' => $seo_desc,
            'faq'              => $formatted_faq,
            'related_tools'    => $related_tools,
            'disable_ads'      => $disable_ads,
            'ads'              => $post_ads,
            'seo'              => [
                'title'               => $seo_title,
                'description'         => $seo_desc,
                'focus_keyword'       => $focus_keyword,
                'canonical_url'       => $canonical_url,
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
     * Get single post SEO settings and audit data.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
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

    /**
     * Update single post SEO settings.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
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

        // Schema settings
        if (isset($params['schema_type'])) {
            $val = sanitize_text_field($params['schema_type']);
            update_post_meta($post_id, '_omni_ai_schema_type', in_array($val, ['article', 'howto', 'review', 'faq', 'none'], true) ? $val : 'article');
        }
        if (isset($params['review_item'])) {
            update_post_meta($post_id, '_omni_ai_review_item', sanitize_text_field($params['review_item']));
        }
        if (isset($params['review_rating'])) {
            update_post_meta($post_id, '_omni_ai_review_rating', floatval($params['review_rating']));
        }
        if (isset($params['howto_data']) && is_array($params['howto_data'])) {
            update_post_meta($post_id, '_omni_ai_howto_data', $params['howto_data']);
        }

        // Re-analyze ranking scores if Ranking_Module exists
        $new_ranking = [];
        if (class_exists('\\OmniAI\\Modules\\Ranking_Module')) {
            $ranking_mod = new \OmniAI\Modules\Ranking_Module();
            $new_ranking = $ranking_mod->analyze_and_save_post($post_id);
        }

        return new \WP_REST_Response([
            'success' => true,
            'message' => 'تنظیمات سئو با موفقیت به‌روزرسانی شد.',
            'ranking' => $new_ranking,
        ], 200);
    }

    /**
     * Generate an AI SEO title and meta description snippet.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
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
