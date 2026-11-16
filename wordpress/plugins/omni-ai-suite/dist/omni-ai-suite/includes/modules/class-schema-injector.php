<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * مدیریت تزریق متاتگ‌های سئو و اسکیماهای ساختاریافته (JSON-LD)
 * AEO / GEO / Speakable / FAQPage / HowTo / Review / BlogPosting / Organization / Product
 */
class Schema_Injector {

    public function register(): void {
        add_action('wp_head', [$this, 'output_frontend_seo_tags'], 1);
        add_action('wp_head', [$this, 'output_webmaster_verification_tags'], 1);
        add_filter('pre_get_document_title', [$this, 'filter_document_title'], 15);
        add_filter('document_title_parts', [$this, 'filter_document_title_parts'], 15);
        add_action('wp_head', [$this, 'output_frontend_schemas'], 99);
        add_filter('the_content', [$this, 'filter_content_breadcrumbs'], 5);
    }

    /**
     * تزریق کدهای تأیید وب‌مستر تولز (گوگل، بینگ، پینترست، یاندکس، بایدو)
     */
    public function output_webmaster_verification_tags(): void {
        $options = get_option('omni_ai_ranking_settings', []);

        $verifications = [
            'google_verify'    => 'google-site-verification',
            'bing_verify'      => 'msvalidate.01',
            'pinterest_verify' => 'p:domain_verify',
            'yandex_verify'    => 'yandex-verification',
            'baidu_verify'     => 'baidu-site-verification',
        ];

        foreach ($verifications as $opt_key => $meta_name) {
            if (!empty($options[$opt_key])) {
                $val = trim((string) $options[$opt_key]);
                if (preg_match('/content=[\'"]([^\'"]+)[\'"]/i', $val, $matches)) {
                    $val = $matches[1];
                }
                echo '<meta name="' . esc_attr($meta_name) . '" content="' . esc_attr($val) . '" />' . "\n";
            }
        }
    }

    /**
     * افزودن خودکار بردکرامب (مسیر راهنما) به ابتدای محتوای نوشته در صورت فعال بودن
     */
    public function filter_content_breadcrumbs(string $content): string {
        if (!is_singular('post')) {
            return $content;
        }

        $options = get_option('omni_ai_ranking_settings', []);
        if (!empty($options['auto_insert_breadcrumbs']) && class_exists('\\OmniAI\\Modules\\Breadcrumbs')) {
            $breadcrumbs_html = Breadcrumbs::render_html();
            return $breadcrumbs_html . "\n" . $content;
        }

        return $content;
    }

    /**
     * تزریق متاتگ‌های سئو، شبکه‌های اجتماعی (Open Graph) و توییتر
     */
    public function output_frontend_seo_tags(): void {
        if (!is_singular()) {
            return;
        }
        $post_id = get_the_ID();
        if (!$post_id) {
            return;
        }

        $is_other_seo = defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION') || defined('SEOPRESS_VERSION');
        if ($is_other_seo) {
            return;
        }

        $meta_desc = (string) get_post_meta($post_id, '_omni_ai_meta_description', true);
        if (!empty($meta_desc)) {
            echo '<meta name="description" content="' . esc_attr($meta_desc) . '" />' . "\n";
        }

        $noindex  = get_post_meta($post_id, '_omni_ai_noindex', true);
        $nofollow = get_post_meta($post_id, '_omni_ai_nofollow', true);
        $robots = [];
        $robots[] = ($noindex === '1') ? 'noindex' : 'index';
        $robots[] = ($nofollow === '1') ? 'nofollow' : 'follow';
        echo '<meta name="robots" content="' . esc_attr(implode(', ', $robots)) . ', max-snippet:-1, max-image-preview:large, max-video-preview:-1" />' . "\n";

        $canonical = (string) get_post_meta($post_id, '_omni_ai_canonical_url', true);
        if (!empty($canonical)) {
            echo '<link rel="canonical" href="' . esc_url($canonical) . '" />' . "\n";
        } else {
            echo '<link rel="canonical" href="' . esc_url(get_permalink($post_id)) . '" />' . "\n";
        }

        // Open Graph & Social Meta Tags
        $post = get_post($post_id);
        $seo_title = (string) get_post_meta($post_id, '_omni_ai_seo_title', true) ?: ($post ? $post->post_title : '');
        $og_title  = (string) get_post_meta($post_id, '_omni_ai_og_title', true) ?: (string) get_post_meta($post_id, 'rank_math_facebook_title', true) ?: $seo_title;
        $og_desc   = (string) get_post_meta($post_id, '_omni_ai_og_description', true) ?: (string) get_post_meta($post_id, 'rank_math_facebook_description', true) ?: $meta_desc;
        
        $og_image  = (string) get_post_meta($post_id, '_omni_ai_og_image', true) ?: (string) get_post_meta($post_id, 'rank_math_facebook_image', true);
        if (empty($og_image) && has_post_thumbnail($post_id)) {
            $og_image = (string) get_the_post_thumbnail_url($post_id, 'large');
        }

        $twitter_title = (string) get_post_meta($post_id, '_omni_ai_twitter_title', true) ?: (string) get_post_meta($post_id, 'rank_math_twitter_title', true) ?: $og_title;
        $twitter_desc  = (string) get_post_meta($post_id, '_omni_ai_twitter_description', true) ?: (string) get_post_meta($post_id, 'rank_math_twitter_description', true) ?: $og_desc;
        $twitter_image = (string) get_post_meta($post_id, '_omni_ai_twitter_image', true) ?: (string) get_post_meta($post_id, 'rank_math_twitter_image', true) ?: $og_image;

        $permalink = get_permalink($post_id);
        $site_name = get_bloginfo('name');
        $locale    = get_locale() ?: 'fa_IR';

        echo '<meta property="og:locale" content="' . esc_attr($locale) . '" />' . "\n";
        echo '<meta property="og:type" content="' . (is_singular('post') ? 'article' : 'website') . '" />' . "\n";
        echo '<meta property="og:title" content="' . esc_attr($og_title) . '" />' . "\n";
        if (!empty($og_desc)) {
            echo '<meta property="og:description" content="' . esc_attr($og_desc) . '" />' . "\n";
        }
        echo '<meta property="og:url" content="' . esc_url($permalink) . '" />' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr($site_name) . '" />' . "\n";

        if (!empty($og_image)) {
            echo '<meta property="og:image" content="' . esc_url($og_image) . '" />' . "\n";
            echo '<meta property="og:image:width" content="1200" />' . "\n";
            echo '<meta property="og:image:height" content="630" />' . "\n";
        }

        if (is_singular('post') && $post) {
            echo '<meta property="article:published_time" content="' . esc_attr(get_post_time('c', true, $post_id)) . '" />' . "\n";
            echo '<meta property="article:modified_time" content="' . esc_attr(get_post_modified_time('c', true, $post_id)) . '" />' . "\n";
            $cats = wp_get_post_categories($post_id, ['fields' => 'names']);
            if (!empty($cats) && is_array($cats)) {
                echo '<meta property="article:section" content="' . esc_attr($cats[0]) . '" />' . "\n";
            }
        }

        // Twitter Cards
        echo '<meta name="twitter:card" content="summary_large_image" />' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($twitter_title) . '" />' . "\n";
        if (!empty($twitter_desc)) {
            echo '<meta name="twitter:description" content="' . esc_attr($twitter_desc) . '" />' . "\n";
        }
        if (!empty($twitter_image)) {
            echo '<meta name="twitter:image" content="' . esc_url($twitter_image) . '" />' . "\n";
        }
    }

    public function filter_document_title(string $title): string {
        if (is_singular()) {
            $post_id = get_the_ID();
            if ($post_id) {
                $is_other_seo = defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION');
                if (!$is_other_seo) {
                    $custom_title = (string) get_post_meta($post_id, '_omni_ai_seo_title', true);
                    if (!empty($custom_title)) {
                        return esc_html($custom_title);
                    }
                }
            }
        }
        return $title;
    }

    public function filter_document_title_parts(array $parts): array {
        if (is_singular()) {
            $post_id = get_the_ID();
            if ($post_id) {
                $is_other_seo = defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION');
                if (!$is_other_seo) {
                    $custom_title = (string) get_post_meta($post_id, '_omni_ai_seo_title', true);
                    if (!empty($custom_title)) {
                        $parts['title'] = esc_html($custom_title);
                    }
                }
            }
        }
        return $parts;
    }

    /**
     * خروجی اسکیماهای ساختاریافته (JSON-LD) در فرانت‌اند
     */
    public function output_frontend_schemas(): void {
        $options = get_option('omni_ai_ranking_settings', []);
        $enable_schemas = $options['enable_schemas'] ?? true;
        if (!$enable_schemas) {
            return;
        }

        $schemas = [];

        // ۱. اسکیمای سازمان یا کسب‌وکار محلی (Organization / LocalBusiness) در صفحه اصلی
        if ((is_front_page() || is_home()) && ($options['enable_org_schema'] ?? true)) {
            $org_type = !empty($options['org_type']) ? sanitize_text_field($options['org_type']) : 'Organization';
            $org_name = !empty($options['org_name']) ? sanitize_text_field($options['org_name']) : get_bloginfo('name');
            $org_schema = [
                '@context' => 'https://schema.org',
                '@type'    => $org_type,
                'name'     => $org_name,
                'url'      => home_url('/'),
            ];
            if (!empty($options['org_logo'])) {
                $org_schema['logo'] = esc_url($options['org_logo']);
            }
            if (!empty($options['org_phone'])) {
                $org_schema['telephone'] = sanitize_text_field($options['org_phone']);
            }
            if (!empty($options['org_price_range'])) {
                $org_schema['priceRange'] = sanitize_text_field($options['org_price_range']);
            }
            $schemas[] = $org_schema;
        }

        // ۲. اسکیمای مسیر راهنما (BreadcrumbList)
        if (!is_front_page() && ($options['enable_breadcrumb_schema'] ?? true) && class_exists('\\OmniAI\\Modules\\Breadcrumbs')) {
            $bc_schema = Breadcrumbs::get_schema();
            if (!empty($bc_schema)) {
                $schemas[] = $bc_schema;
            }
        }

        // ۳. اسکیماهای اختصاصی صفحات تکی (مقاله‌ها، برگه‌ها و پست تایپ‌ها)
        if (is_singular()) {
            $post_id = get_the_ID();
            if ($post_id) {
                $content = get_post_field('post_content', $post_id);
                $post = get_post($post_id);

                // ۳-۱. اسکیمای Speakable (AEO - جستجوی صوتی)
                if (($options['enable_speakable'] ?? true) && (strpos($content, 'omni-direct-answer') !== false || strpos($content, 'omni-direct-answer-box') !== false)) {
                    $schemas[] = [
                        '@context'   => 'https://schema.org',
                        '@type'      => 'WebPage',
                        'speakable'  => [
                            '@type'       => 'SpeakableSpecification',
                            'cssSelector' => ['.omni-direct-answer-box', '.omni-direct-answer-box p'],
                        ],
                        'url'        => get_permalink($post_id),
                    ];
                }

                // ۳-۲. اسکیمای FAQPage ساختاریافته
                if ($options['enable_faq_schema'] ?? true) {
                    $faqs = $this->extract_faqs_for_schema($content);
                    if (!empty($faqs)) {
                        $main_entities = [];
                        foreach ($faqs as $faq) {
                            $main_entities[] = [
                                '@type'          => 'Question',
                                'name'           => $faq['q'],
                                'acceptedAnswer' => [
                                    '@type' => 'Answer',
                                    'text'  => $faq['a'],
                                ],
                            ];
                        }
                        $schemas[] = [
                            '@context'   => 'https://schema.org',
                            '@type'      => 'FAQPage',
                            'mainEntity' => $main_entities,
                        ];
                    }
                }

                // نوع اسکیمای انتخاب شده توسط کاربر در متاباکس
                $schema_type = (string) get_post_meta($post_id, '_omni_ai_schema_type', true) ?: 'article';

                // ۳-۳. اسکیمای HowTo (آموزش گام‌به‌گام)
                if ($schema_type === 'howto' && ($options['enable_howto_schema'] ?? true)) {
                    $howto_raw = get_post_meta($post_id, '_omni_ai_howto_data', true);
                    $howto_data = is_array($howto_raw) ? $howto_raw : (json_decode((string) $howto_raw, true) ?: []);

                    $howto_steps = [];
                    if (!empty($howto_data['steps']) && is_array($howto_data['steps'])) {
                        foreach ($howto_data['steps'] as $idx => $s) {
                            $howto_steps[] = [
                                '@type' => 'HowToStep',
                                'position' => $idx + 1,
                                'name'  => sanitize_text_field($s['title'] ?? ('مرحله ' . ($idx + 1))),
                                'text'  => sanitize_textarea_field($s['text'] ?? ''),
                            ];
                        }
                    }

                    $schemas[] = [
                        '@context'    => 'https://schema.org',
                        '@type'       => 'HowTo',
                        'name'        => !empty($howto_data['name']) ? sanitize_text_field($howto_data['name']) : $post->post_title,
                        'description' => !empty($howto_data['description']) ? sanitize_textarea_field($howto_data['description']) : wp_trim_words($content, 35),
                        'totalTime'   => !empty($howto_data['total_time']) ? sanitize_text_field($howto_data['total_time']) : 'PT15M',
                        'step'        => $howto_steps,
                    ];
                }
                // ۳-۴. اسکیمای Review (نقد و بررسی و امتیازدهی ستاره‌ای)
                elseif ($schema_type === 'review' && ($options['enable_review_schema'] ?? true)) {
                    $review_item = (string) get_post_meta($post_id, '_omni_ai_review_item', true) ?: $post->post_title;
                    $review_rating = (float) (get_post_meta($post_id, '_omni_ai_review_rating', true) ?: 5.0);
                    $author_name = get_the_author_meta('display_name', $post->post_author) ?: get_bloginfo('name');

                    $schemas[] = [
                        '@context'      => 'https://schema.org',
                        '@type'         => 'Review',
                        'itemReviewed'  => [
                            '@type' => 'Thing',
                            'name'  => sanitize_text_field($review_item),
                        ],
                        'reviewRating'  => [
                            '@type'       => 'Rating',
                            'ratingValue' => max(1.0, min(5.0, $review_rating)),
                            'bestRating'  => 5,
                            'worstRating' => 1,
                        ],
                        'author'        => [
                            '@type' => 'Person',
                            'name'  => $author_name,
                        ],
                        'reviewBody'    => wp_trim_words($content, 40),
                    ];
                }
                // ۳-۵. اسکیمای استاندارد BlogPosting همراه با نهادها (Entities & Mentions برای GEO)
                elseif ($schema_type === 'article' && ($options['enable_article_schema'] ?? true) && is_singular('post')) {
                    if ($post) {
                        $author_name = get_the_author_meta('display_name', $post->post_author) ?: get_bloginfo('name');
                        $raw_tags = wp_get_post_tags($post_id, ['fields' => 'names']);
                        $raw_cats = wp_get_post_categories($post_id, ['fields' => 'names']);
                        $tags = (!is_wp_error($raw_tags) && is_array($raw_tags)) ? $raw_tags : [];
                        $cats = (!is_wp_error($raw_cats) && is_array($raw_cats)) ? $raw_cats : [];
                        $keywords = array_merge($cats, $tags);
                        $thumb_id = get_post_thumbnail_id($post_id);
                        $thumb_url = $thumb_id ? wp_get_attachment_url($thumb_id) : '';

                        $about_entities = [];
                        foreach (array_slice($keywords, 0, 8) as $kw) {
                            if (is_string($kw) && trim($kw) !== '') {
                                $about_entities[] = [
                                    '@type' => 'Thing',
                                    'name'  => sanitize_text_field($kw),
                                ];
                            }
                        }

                        $article_schema = [
                            '@context'         => 'https://schema.org',
                            '@type'            => 'BlogPosting',
                            'mainEntityOfPage' => [
                                '@type' => 'WebPage',
                                '@id'   => get_permalink($post_id),
                            ],
                            'headline'         => $post->post_title,
                            'datePublished'    => get_the_date('c', $post_id),
                            'dateModified'     => get_the_modified_date('c', $post_id),
                            'author'           => [
                                '@type' => 'Person',
                                'name'  => $author_name,
                            ],
                            'publisher'        => [
                                '@type' => 'Organization',
                                'name'  => get_bloginfo('name'),
                                'url'   => home_url('/'),
                            ],
                        ];

                        if (!empty($keywords)) {
                            $article_schema['keywords'] = implode(', ', $keywords);
                        }
                        if (!empty($thumb_url)) {
                            $article_schema['image'] = $thumb_url;
                        }
                        if (!empty($about_entities)) {
                            $article_schema['about'] = $about_entities;
                        }

                        $schemas[] = $article_schema;
                    }
                }
                // ۳-۶. اسکیمای Product برای ووکامرس و محصولات فروشگاهی
                elseif (($schema_type === 'product' || is_singular('product') || ($post && $post->post_type === 'product')) && ($options['enable_product_schema'] ?? true)) {
                    $meta_desc = (string) get_post_meta($post_id, '_omni_ai_meta_description', true);
                    $prod_schema = [
                        '@context'    => 'https://schema.org',
                        '@type'       => 'Product',
                        'name'        => $post ? $post->post_title : '',
                        'description' => wp_strip_all_tags($meta_desc ?: wp_trim_words($content, 40)),
                        'url'         => get_permalink($post_id),
                    ];
                    $thumb_id = get_post_thumbnail_id($post_id);
                    if ($thumb_id) {
                        $prod_schema['image'] = wp_get_attachment_url($thumb_id);
                    }

                    if (function_exists('wc_get_product')) {
                        $wc_prod = wc_get_product($post_id);
                        if ($wc_prod) {
                            $prod_schema['name'] = $wc_prod->get_name();
                            $prod_schema['sku']  = $wc_prod->get_sku() ?: ('PROD-' . $post_id);
                            $currency = function_exists('get_woocommerce_currency') ? get_woocommerce_currency() : 'IRT';
                            $prod_schema['offers'] = [
                                '@type'         => 'Offer',
                                'price'         => $wc_prod->get_price() ?: '0',
                                'priceCurrency' => $currency,
                                'availability'  => $wc_prod->is_in_stock() ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                                'url'           => get_permalink($post_id),
                            ];
                            if ($wc_prod->get_rating_count() > 0) {
                                $prod_schema['aggregateRating'] = [
                                    '@type'       => 'AggregateRating',
                                    'ratingValue' => $wc_prod->get_average_rating(),
                                    'reviewCount' => $wc_prod->get_rating_count(),
                                ];
                            }
                        }
                    } else {
                        $prod_schema['offers'] = [
                            '@type'         => 'Offer',
                            'price'         => '0',
                            'priceCurrency' => 'IRT',
                            'availability'  => 'https://schema.org/InStock',
                            'url'           => get_permalink($post_id),
                        ];
                    }
                    $schemas[] = $prod_schema;
                }
            }
        }

        if (!empty($schemas)) {
            foreach ($schemas as $schema) {
                echo "\n<!-- Omni AI Suite (Structured Schema) -->\n";
                echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "</script>\n";
            }
        }
    }

    public function extract_faqs_for_schema(string $content): array {
        $faqs = [];
        if (preg_match('/<!-- omni-faq -->([\s\S]*?)<!-- \/omni-faq -->|<div class=[\'"]omni-faq-section[\'"][\s\S]*?<\/div>/iu', $content, $match)) {
            $block = $match[0];
            if (preg_match_all('/<h[3-4][^>]*>(.*?)<\/h[3-4]>\s*<p[^>]*>(.*?)<\/p>/iu', $block, $pairs, PREG_SET_ORDER)) {
                foreach ($pairs as $p) {
                    $q = trim(wp_strip_all_tags($p[1]));
                    $a = trim(wp_strip_all_tags($p[2]));
                    if (!empty($q) && !empty($a)) {
                        $faqs[] = ['q' => $q, 'a' => $a];
                    }
                }
            }
        }
        return $faqs;
    }
}
