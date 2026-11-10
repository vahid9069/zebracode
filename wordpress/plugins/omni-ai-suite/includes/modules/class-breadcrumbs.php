<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Breadcrumbs Engine: Hierarchical breadcrumb trail generator with HTML markup and Schema.org BreadcrumbList JSON-LD.
 */
class Breadcrumbs {
    /**
     * Build the breadcrumbs items array for current query.
     *
     * @return array<int, array{title: string, url: string}>
     */
    public static function get_trail(): array {
        $trail = [];
        $settings = get_option('omni_ai_ranking_settings', []);
        $show_home = $settings['breadcrumbs_show_home'] ?? true;
        $home_label = !empty($settings['breadcrumbs_home_label']) ? $settings['breadcrumbs_home_label'] : 'خانه';

        if ($show_home) {
            $trail[] = [
                'title' => $home_label,
                'url'   => home_url('/'),
            ];
        }

        if (is_front_page() || is_home()) {
            return $trail;
        }

        if (is_singular('post')) {
            $post_id = get_the_ID();
            $categories = get_the_category($post_id);
            if (!empty($categories) && !is_wp_error($categories)) {
                $primary_cat = $categories[0];
                $cat_ancestors = get_ancestors($primary_cat->term_id, 'category');
                if (!empty($cat_ancestors)) {
                    $cat_ancestors = array_reverse($cat_ancestors);
                    foreach ($cat_ancestors as $ancestor_id) {
                        $term = get_term($ancestor_id, 'category');
                        if ($term && !is_wp_error($term)) {
                            $trail[] = [
                                'title' => $term->name,
                                'url'   => get_category_link($term->term_id),
                            ];
                        }
                    }
                }
                $trail[] = [
                    'title' => $primary_cat->name,
                    'url'   => get_category_link($primary_cat->term_id),
                ];
            }
            $trail[] = [
                'title' => get_the_title($post_id),
                'url'   => get_permalink($post_id),
            ];
        } elseif (is_singular('page')) {
            $post_id = get_the_ID();
            $ancestors = get_post_ancestors($post_id);
            if (!empty($ancestors)) {
                $ancestors = array_reverse($ancestors);
                foreach ($ancestors as $ancestor_id) {
                    $trail[] = [
                        'title' => get_the_title($ancestor_id),
                        'url'   => get_permalink($ancestor_id),
                    ];
                }
            }
            $trail[] = [
                'title' => get_the_title($post_id),
                'url'   => get_permalink($post_id),
            ];
        } elseif (is_singular()) {
            $post_id = get_the_ID();
            $post_type = get_post_type($post_id);
            $pt_obj = get_post_type_object($post_type);
            if ($pt_obj && !empty($pt_obj->has_archive)) {
                $trail[] = [
                    'title' => $pt_obj->labels->name,
                    'url'   => get_post_type_archive_link($post_type),
                ];
            }
            $trail[] = [
                'title' => get_the_title($post_id),
                'url'   => get_permalink($post_id),
            ];
        } elseif (is_category()) {
            $current_cat = get_queried_object();
            if ($current_cat && !is_wp_error($current_cat)) {
                $ancestors = get_ancestors($current_cat->term_id, 'category');
                if (!empty($ancestors)) {
                    $ancestors = array_reverse($ancestors);
                    foreach ($ancestors as $ancestor_id) {
                        $term = get_term($ancestor_id, 'category');
                        if ($term && !is_wp_error($term)) {
                            $trail[] = [
                                'title' => $term->name,
                                'url'   => get_category_link($term->term_id),
                            ];
                        }
                    }
                }
                $trail[] = [
                    'title' => $current_cat->name,
                    'url'   => get_category_link($current_cat->term_id),
                ];
            }
        } elseif (is_tag()) {
            $tag = get_queried_object();
            if ($tag && !is_wp_error($tag)) {
                $trail[] = [
                    'title' => $tag->name,
                    'url'   => get_tag_link($tag->term_id),
                ];
            }
        } elseif (is_tax()) {
            $term = get_queried_object();
            if ($term && !is_wp_error($term)) {
                $ancestors = get_ancestors($term->term_id, $term->taxonomy);
                if (!empty($ancestors)) {
                    $ancestors = array_reverse($ancestors);
                    foreach ($ancestors as $ancestor_id) {
                        $anc_term = get_term($ancestor_id, $term->taxonomy);
                        if ($anc_term && !is_wp_error($anc_term)) {
                            $trail[] = [
                                'title' => $anc_term->name,
                                'url'   => get_term_link($anc_term->term_id, $term->taxonomy),
                            ];
                        }
                    }
                }
                $trail[] = [
                    'title' => $term->name,
                    'url'   => get_term_link($term->term_id, $term->taxonomy),
                ];
            }
        } elseif (is_search()) {
            $trail[] = [
                'title' => sprintf('نتایج جستجو برای: %s', get_search_query()),
                'url'   => get_search_link(),
            ];
        } elseif (is_author()) {
            $author = get_queried_object();
            if ($author) {
                $trail[] = [
                    'title' => sprintf('نویسنده: %s', $author->display_name),
                    'url'   => get_author_posts_url($author->ID),
                ];
            }
        } elseif (is_date()) {
            if (is_day()) {
                $trail[] = ['title' => get_the_date('Y'), 'url' => get_year_link((int) get_the_date('Y'))];
                $trail[] = ['title' => get_the_date('F'), 'url' => get_month_link((int) get_the_date('Y'), (int) get_the_date('m'))];
                $trail[] = ['title' => get_the_date('j F Y'), 'url' => get_day_link((int) get_the_date('Y'), (int) get_the_date('m'), (int) get_the_date('d'))];
            } elseif (is_month()) {
                $trail[] = ['title' => get_the_date('Y'), 'url' => get_year_link((int) get_the_date('Y'))];
                $trail[] = ['title' => get_the_date('F Y'), 'url' => get_month_link((int) get_the_date('Y'), (int) get_the_date('m'))];
            } elseif (is_year()) {
                $trail[] = ['title' => get_the_date('Y'), 'url' => get_year_link((int) get_the_date('Y'))];
            }
        } elseif (is_404()) {
            $trail[] = [
                'title' => 'صفحه پیدا نشد (خطای 404)',
                'url'   => '',
            ];
        } elseif (is_post_type_archive()) {
            $pt = get_query_var('post_type');
            if (is_array($pt)) {
                $pt = reset($pt);
            }
            $pt_obj = get_post_type_object($pt);
            if ($pt_obj) {
                $trail[] = [
                    'title' => $pt_obj->labels->name,
                    'url'   => get_post_type_archive_link($pt),
                ];
            }
        }

        return apply_filters('omni_ai_breadcrumbs_trail', $trail);
    }

    /**
     * Render semantic HTML markup for breadcrumbs.
     */
    public static function render_html(string $custom_separator = ''): string {
        $trail = self::get_trail();
        if (empty($trail)) {
            return '';
        }

        $settings = get_option('omni_ai_ranking_settings', []);
        $separator = !empty($custom_separator) ? $custom_separator : ($settings['breadcrumb_separator'] ?? '»');

        $html = '<nav class="omni-ai-breadcrumbs" aria-label="مسیر راهنما" dir="rtl">';
        $html .= '<ol class="omni-breadcrumbs-list" itemscope itemtype="https://schema.org/BreadcrumbList">';

        $total = count($trail);
        foreach ($trail as $index => $item) {
            $position = $index + 1;
            $is_last = ($position === $total);

            $html .= '<li class="omni-breadcrumb-item' . ($is_last ? ' is-current' : '') . '" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
            
            if (!$is_last && !empty($item['url'])) {
                $html .= '<a itemprop="item" href="' . esc_url($item['url']) . '">';
                $html .= '<span itemprop="name">' . esc_html($item['title']) . '</span>';
                $html .= '</a>';
            } else {
                $html .= '<span itemprop="name" class="omni-breadcrumb-current">' . esc_html($item['title']) . '</span>';
            }

            $html .= '<meta itemprop="position" content="' . esc_attr((string) $position) . '" />';
            $html .= '</li>';

            if (!$is_last) {
                $html .= '<span class="omni-breadcrumb-separator" aria-hidden="true">' . esc_html($separator) . '</span>';
            }
        }

        $html .= '</ol>';
        $html .= '</nav>';

        return $html;
    }

    /**
     * Generate Schema.org BreadcrumbList JSON-LD array.
     */
    public static function get_schema(): ?array {
        $trail = self::get_trail();
        if (count($trail) < 2) {
            return null;
        }

        $items = [];
        foreach ($trail as $index => $item) {
            $entry = [
                '@type'    => 'ListItem',
                'position' => $index + 1,
                'name'     => $item['title'],
            ];
            if (!empty($item['url'])) {
                $entry['item'] = esc_url($item['url']);
            }
            $items[] = $entry;
        }

        return [
            '@context'        => 'https://schema.org',
            '@type'           => 'BreadcrumbList',
            'itemListElement' => $items,
        ];
    }
}

/**
 * Global helper function for theme templates: omni_ai_breadcrumbs()
 */
if (!function_exists('omni_ai_breadcrumbs')) {
    function omni_ai_breadcrumbs(string $separator = '', bool $echo = true): string {
        $html = Breadcrumbs::render_html($separator);
        if ($echo) {
            echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        }
        return $html;
    }
}
