<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Smart Ad & Sponsorship Manager for WordPress and Next.js Headless Blog.
 * Provides granular 5-level enable/disable controls, priority ordering,
 * targeting (post/category/device/date), and script network support (Najva/Yektanet).
 */
class Ads_Manager {
    public const OPTION_CAMPAIGNS = 'omni_ai_ad_campaigns';
    public const OPTION_SETTINGS  = 'omni_ai_ad_settings';

    /**
     * Get default settings for the Ad Manager.
     */
    public static function get_default_settings(): array {
        return [
            'master_enabled'          => true,
            'head_script_enabled'     => false,
            'global_head_script'      => '',
            'tool_rotation_enabled'   => true,
            'tool_rotation_mode'      => 'per_post',
            'tool_rotation_days'      => 1,
            'tool_rotation_placement' => 'after_content',
            'tool_rotation_badge'     => 'پیشنهاد ویژه ابزار',
            'tool_rotation_cta'       => 'مشاهده و استفاده رایگان',
            'tool_rotation_offset'    => 0,
            'placements_status'       => [
                'before_content'  => true,
                'middle_content'  => true,
                'after_paragraph' => true,
                'after_content'   => true,
                'catalog_top'     => true,
                'catalog_bottom'  => true,
            ],
        ];
    }

    /**
     * Get ad settings with defaults.
     */
    public static function get_settings(): array {
        $saved = get_option(self::OPTION_SETTINGS, []);
        $defaults = self::get_default_settings();

        if (!is_array($saved)) {
            $saved = [];
        }

        $merged = array_merge($defaults, $saved);

        // Ensure all placement toggles exist
        if (!isset($merged['placements_status']) || !is_array($merged['placements_status'])) {
            $merged['placements_status'] = $defaults['placements_status'];
        } else {
            $merged['placements_status'] = array_merge($defaults['placements_status'], $merged['placements_status']);
        }

        return $merged;
    }

    /**
     * Save global ad settings.
     */
    public static function save_settings(array $settings): array {
        $current = self::get_settings();

        $valid_placements = ['before_content', 'middle_content', 'after_paragraph', 'after_content', 'catalog_top', 'catalog_bottom'];
        $rotation_placement = isset($settings['tool_rotation_placement']) && in_array($settings['tool_rotation_placement'], $valid_placements, true)
            ? $settings['tool_rotation_placement']
            : ($current['tool_rotation_placement'] ?? 'after_content');

        $clean_settings = [
            'master_enabled'          => isset($settings['master_enabled']) ? (bool) $settings['master_enabled'] : $current['master_enabled'],
            'head_script_enabled'     => isset($settings['head_script_enabled']) ? (bool) $settings['head_script_enabled'] : $current['head_script_enabled'],
            'global_head_script'      => isset($settings['global_head_script']) ? trim((string) $settings['global_head_script']) : $current['global_head_script'],
            'tool_rotation_enabled'   => isset($settings['tool_rotation_enabled']) ? (bool) $settings['tool_rotation_enabled'] : (bool) ($current['tool_rotation_enabled'] ?? true),
            'tool_rotation_mode'      => isset($settings['tool_rotation_mode']) && in_array($settings['tool_rotation_mode'], ['global', 'per_post'], true) ? $settings['tool_rotation_mode'] : (string) ($current['tool_rotation_mode'] ?? 'per_post'),
            'tool_rotation_days'      => isset($settings['tool_rotation_days']) ? max(1, min(30, (int) $settings['tool_rotation_days'])) : (int) ($current['tool_rotation_days'] ?? 1),
            'tool_rotation_placement' => $rotation_placement,
            'tool_rotation_badge'     => isset($settings['tool_rotation_badge']) ? sanitize_text_field((string) $settings['tool_rotation_badge']) : (string) ($current['tool_rotation_badge'] ?? 'پیشنهاد ویژه ابزار'),
            'tool_rotation_cta'       => isset($settings['tool_rotation_cta']) ? sanitize_text_field((string) $settings['tool_rotation_cta']) : (string) ($current['tool_rotation_cta'] ?? 'مشاهده و استفاده رایگان'),
            'tool_rotation_offset'    => isset($settings['tool_rotation_offset']) ? max(0, (int) $settings['tool_rotation_offset']) : (int) ($current['tool_rotation_offset'] ?? 0),
            'placements_status'       => $current['placements_status'],
        ];

        if (isset($settings['placements_status']) && is_array($settings['placements_status'])) {
            foreach ($clean_settings['placements_status'] as $p => $v) {
                if (isset($settings['placements_status'][$p])) {
                    $clean_settings['placements_status'][$p] = (bool) $settings['placements_status'][$p];
                }
            }
        }

        update_option(self::OPTION_SETTINGS, $clean_settings, false);

        return [
            'success'      => true,
            'settings'     => $clean_settings,
            'rotated_tool' => self::get_rotated_tool_ad($clean_settings),
            'message'      => __('تنظیمات عمومی تبلیغات با موفقیت ذخیره شد.', 'omni-ai-suite'),
        ];
    }

    /**
     * Default initial campaign seed.
     */
    public static function get_default_campaigns(): array {
        return [
            [
                'id'                => 'ad_sample_native_1',
                'title'             => 'ابزار فاکتور آنلاین زبراکد',
                'active'            => true,
                'ad_type'           => 'native',
                'placement'         => 'after_content',
                'paragraph_number'  => 3,
                'priority'          => 1,
                'image_url'         => '',
                'mobile_image_url'  => '',
                'target_url'        => 'https://kit.zebracode.ir/invoice-generator',
                'alt_text'          => 'سازنده پیش‌فاکتور و فاکتور رسمی',
                'utm_campaign'      => 'blog_after_content',
                'open_new_tab'      => true,
                'script_code'       => '',
                'badge_text'        => 'پیشنهاد ویژه ابزار',
                'headline'          => 'صدور آنلاین فاکتور رسمی و پیش‌فاکتور در کمتر از ۲ دقیقه',
                'description'       => 'با ابزار فاکتورساز کیت زبراکد بدون نیاز به نرم‌افزارهای پیچیده مالی، فاکتورهای استاندارد دارای مالیات و تخفیف با لوگوی اختصاصی صادر و دانلود کنید.',
                'cta_text'          => 'شروع و صدور فاکتور رایگان',
                'target_categories' => [],
                'include_posts'     => '',
                'exclude_posts'     => '',
                'device'            => 'all',
                'start_date'        => '',
                'end_date'          => '',
            ],
        ];
    }

    /**
     * Get all campaigns.
     */
    public static function get_campaigns(): array {
        $campaigns = get_option(self::OPTION_CAMPAIGNS, null);
        if ($campaigns === null) {
            $campaigns = self::get_default_campaigns();
            update_option(self::OPTION_CAMPAIGNS, $campaigns, false);
        }
        if (!is_array($campaigns)) {
            $campaigns = [];
        }

        // Sort by priority ASC
        usort($campaigns, function ($a, $b) {
            $pA = isset($a['priority']) ? (int) $a['priority'] : 10;
            $pB = isset($b['priority']) ? (int) $b['priority'] : 10;
            return $pA <=> $pB;
        });

        return array_values($campaigns);
    }

    /**
     * Save / update a campaign item.
     */
    public static function save_campaign(array $data): array {
        $campaigns = self::get_campaigns();

        $id = !empty($data['id']) ? sanitize_text_field($data['id']) : ('ad_' . time() . '_' . wp_rand(100, 999));
        $title = !empty($data['title']) ? sanitize_text_field($data['title']) : __('کمپین تبلیغاتی بدون نام', 'omni-ai-suite');
        $active = isset($data['active']) ? (bool) $data['active'] : true;
        $ad_type = in_array($data['ad_type'] ?? '', ['image', 'script', 'native'], true) ? $data['ad_type'] : 'image';
        $valid_placements = ['before_content', 'middle_content', 'after_paragraph', 'after_content', 'catalog_top', 'catalog_bottom'];
        $placement = in_array($data['placement'] ?? '', $valid_placements, true) ? $data['placement'] : 'middle_content';
        $paragraph_number = max(1, min(50, intval($data['paragraph_number'] ?? 3)));
        $priority = max(1, min(1000, intval($data['priority'] ?? 10)));

        $clean_item = [
            'id'                => $id,
            'title'             => $title,
            'active'            => $active,
            'ad_type'           => $ad_type,
            'placement'         => $placement,
            'paragraph_number'  => $paragraph_number,
            'priority'          => $priority,
            'image_url'         => esc_url_raw($data['image_url'] ?? ''),
            'mobile_image_url'  => esc_url_raw($data['mobile_image_url'] ?? ''),
            'target_url'        => esc_url_raw($data['target_url'] ?? ''),
            'alt_text'          => sanitize_text_field($data['alt_text'] ?? ''),
            'utm_campaign'      => sanitize_text_field($data['utm_campaign'] ?? ''),
            'open_new_tab'      => isset($data['open_new_tab']) ? (bool) $data['open_new_tab'] : true,
            'script_code'       => (string) ($data['script_code'] ?? ''), // Preserved raw for Najva / Yektanet snippets
            'badge_text'        => sanitize_text_field($data['badge_text'] ?? 'پیشنهاد ویژه'),
            'headline'          => sanitize_text_field($data['headline'] ?? ''),
            'description'       => sanitize_textarea_field($data['description'] ?? ''),
            'cta_text'          => sanitize_text_field($data['cta_text'] ?? 'مشاهده و شروع'),
            'target_categories' => is_array($data['target_categories'] ?? null) ? array_map('sanitize_title', $data['target_categories']) : [],
            'include_posts'     => sanitize_text_field($data['include_posts'] ?? ''),
            'exclude_posts'     => sanitize_text_field($data['exclude_posts'] ?? ''),
            'device'            => in_array($data['device'] ?? '', ['all', 'desktop', 'mobile'], true) ? $data['device'] : 'all',
            'start_date'        => sanitize_text_field($data['start_date'] ?? ''),
            'end_date'          => sanitize_text_field($data['end_date'] ?? ''),
        ];

        $updated = false;
        foreach ($campaigns as $idx => $c) {
            if ($c['id'] === $id) {
                $campaigns[$idx] = $clean_item;
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            $campaigns[] = $clean_item;
        }

        // Sort by priority
        usort($campaigns, function ($a, $b) {
            return ($a['priority'] ?? 10) <=> ($b['priority'] ?? 10);
        });

        update_option(self::OPTION_CAMPAIGNS, $campaigns, false);

        return [
            'success'   => true,
            'campaign'  => $clean_item,
            'campaigns' => $campaigns,
            'message'   => __('کمپین تبلیغاتی با موفقیت ذخیره شد.', 'omni-ai-suite'),
        ];
    }

    /**
     * Delete campaign by ID.
     */
    public static function delete_campaign(string $id): array {
        $campaigns = self::get_campaigns();
        $filtered = array_values(array_filter($campaigns, function ($c) use ($id) {
            return $c['id'] !== $id;
        }));

        update_option(self::OPTION_CAMPAIGNS, $filtered, false);

        return [
            'success'   => true,
            'campaigns' => $filtered,
            'message'   => __('کمپین با موفقیت حذف شد.', 'omni-ai-suite'),
        ];
    }

    /**
     * 1-Click Toggle for individual campaign active state.
     */
    public static function toggle_campaign(string $id, ?bool $new_state = null): array {
        $campaigns = self::get_campaigns();
        $toggled_state = false;

        foreach ($campaigns as &$c) {
            if ($c['id'] === $id) {
                $c['active'] = ($new_state !== null) ? $new_state : !($c['active'] ?? true);
                $toggled_state = $c['active'];
                break;
            }
        }

        update_option(self::OPTION_CAMPAIGNS, $campaigns, false);

        return [
            'success'   => true,
            'id'        => $id,
            'active'    => $toggled_state,
            'campaigns' => $campaigns,
            'message'   => $toggled_state
                ? __('کمپین فعال شد.', 'omni-ai-suite')
                : __('کمپین موقتاً غیرفعال شد.', 'omni-ai-suite'),
        ];
    }

    /**
     * Reorder campaigns based on an ordered array of IDs.
     */
    public static function reorder_campaigns(array $ordered_ids): array {
        $campaigns = self::get_campaigns();
        $by_id = [];
        foreach ($campaigns as $c) {
            $by_id[$c['id']] = $c;
        }

        $reordered = [];
        $priority = 1;
        foreach ($ordered_ids as $id) {
            if (isset($by_id[$id])) {
                $item = $by_id[$id];
                $item['priority'] = $priority++;
                $reordered[] = $item;
                unset($by_id[$id]);
            }
        }

        // Append any remaining
        foreach ($by_id as $rem) {
            $rem['priority'] = $priority++;
            $reordered[] = $rem;
        }

        update_option(self::OPTION_CAMPAIGNS, $reordered, false);

        return [
            'success'   => true,
            'campaigns' => $reordered,
            'message'   => __('ترتیب اولویت کمپین‌ها ذخیره شد.', 'omni-ai-suite'),
        ];
    }

    /**
     * Build the deterministic auto-rotated native tool ad for the current period (globally or per post).
     */
    public static function get_rotated_tool_ad(?array $settings = null, int $post_id = 0): ?array {
        $settings = $settings ?? self::get_settings();
        if (empty($settings['master_enabled']) || empty($settings['tool_rotation_enabled'])) {
            return null;
        }

        $placement = $settings['tool_rotation_placement'] ?? 'after_content';
        $placements_status = $settings['placements_status'] ?? [];
        if (isset($placements_status[$placement]) && empty($placements_status[$placement])) {
            return null;
        }

        if (!class_exists('\\OmniAI\\Modules\\Tool_Synchronizer')) {
            return null;
        }

        $catalog = Tool_Synchronizer::get_catalog_tools();
        $tools = array_values(array_filter($catalog, function ($item) {
            return is_array($item) && !empty($item['title']) && !empty($item['url']);
        }));

        if (empty($tools)) {
            return null;
        }

        $days = max(1, min(30, (int) ($settings['tool_rotation_days'] ?? 1)));
        $offset = max(0, (int) ($settings['tool_rotation_offset'] ?? 0));
        $mode = ($settings['tool_rotation_mode'] ?? 'per_post') === 'global' ? 'global' : 'per_post';
        $day_number = (int) floor(current_time('timestamp') / DAY_IN_SECONDS);
        $period_index = (int) floor($day_number / $days);
        $post_shift = ($mode === 'per_post' && $post_id > 0) ? $post_id : 0;
        $index = ($period_index + $offset + $post_shift) % count($tools);
        $tool = $tools[$index];

        $badge = trim((string) ($settings['tool_rotation_badge'] ?? ''));
        $cta   = trim((string) ($settings['tool_rotation_cta'] ?? ''));
        $desc  = trim((string) ($tool['description'] ?? ''));
        if ($desc === '') {
            $desc = 'ابزار آنلاین و رایگان برای برنامه‌نویسان با پردازش سریع و امن در مرورگر.';
        }

        return [
            'id'                => 'ad_auto_tool_rotation',
            'title'             => 'پیشنهاد خودکار ابزار: ' . sanitize_text_field((string) $tool['title']),
            'active'            => true,
            'ad_type'           => 'native',
            'placement'         => $placement,
            'paragraph_number'  => 3,
            'priority'          => 1,
            'image_url'         => '',
            'mobile_image_url'  => '',
            'target_url'        => esc_url_raw((string) $tool['url']),
            'alt_text'          => sanitize_text_field((string) $tool['title']),
            'utm_campaign'      => 'auto_tool_rotation',
            'open_new_tab'      => true,
            'script_code'       => '',
            'badge_text'        => $badge !== '' ? $badge : 'پیشنهاد ویژه ابزار',
            'headline'          => sanitize_text_field((string) $tool['title']),
            'description'       => sanitize_textarea_field($desc),
            'cta_text'          => $cta !== '' ? $cta : 'مشاهده و استفاده رایگان',
            'target_categories' => [],
            'include_posts'     => '',
            'exclude_posts'     => '',
            'device'            => 'all',
            'start_date'        => '',
            'end_date'          => '',
            'rotation_index'    => $index + 1,
            'rotation_total'    => count($tools),
        ];
    }

    /**
     * Get active ads eligible for frontend delivery.
     * Respects Master Kill Switch, Placement Toggles, Campaign Active, and Date Scheduling.
     */
    public static function get_active_ads_for_frontend(int $post_id = 0): array {
        $settings = self::get_settings();
        if (empty($settings['master_enabled'])) {
            return [];
        }

        $placements_status = $settings['placements_status'] ?? [];
        $campaigns = self::get_campaigns();
        $today = current_time('Y-m-d');
        $rotated_tool_ad = self::get_rotated_tool_ad($settings, $post_id);

        $active_ads = [];
        foreach ($campaigns as $ad) {
            if (empty($ad['active'])) {
                continue;
            }

            // Replace default static native seed when auto-rotation is active on the same placement
            if ($rotated_tool_ad !== null && ($ad['id'] ?? '') === 'ad_sample_native_1' && ($ad['placement'] ?? '') === $rotated_tool_ad['placement']) {
                continue;
            }

            $placement = $ad['placement'] ?? '';
            if (isset($placements_status[$placement]) && empty($placements_status[$placement])) {
                continue; // Placement disabled at level 3
            }

            // Date scheduling
            if (!empty($ad['start_date']) && $today < $ad['start_date']) {
                continue; // Not yet started
            }
            if (!empty($ad['end_date']) && $today > $ad['end_date']) {
                continue; // Expired
            }

            $active_ads[] = $ad;
        }

        if ($rotated_tool_ad !== null) {
            array_unshift($active_ads, $rotated_tool_ad);
        }

        return $active_ads;
    }

    /**
     * Match and return ads for a specific post.
     * Evaluates per-post disable flag, targeting categories, include/exclude lists.
     */
    public static function get_ads_for_post($post): array {
        if (is_numeric($post)) {
            $post = get_post($post);
        }
        if (!$post instanceof \WP_Post) {
            return [];
        }

        $post_id = (int) $post->ID;

        // Level 5: Per-post disable ads check
        $disable_ads_meta = get_post_meta($post_id, '_omni_ai_disable_ads', true);
        if ($disable_ads_meta === '1' || $disable_ads_meta === 1 || $disable_ads_meta === true) {
            return [];
        }

        $all_active = self::get_active_ads_for_frontend($post_id);
        if (empty($all_active)) {
            return [];
        }

        $post_slug = sanitize_title($post->post_name);
        $post_categories = wp_get_post_categories($post_id, ['fields' => 'slugs']);
        if (!is_array($post_categories)) {
            $post_categories = [];
        }

        $matched = [];
        foreach ($all_active as $ad) {
            // Exclude posts check
            if (!empty($ad['exclude_posts'])) {
                $excludes = array_map('trim', explode(',', (string) $ad['exclude_posts']));
                if (in_array((string) $post_id, $excludes, true) || in_array($post_slug, $excludes, true)) {
                    continue;
                }
            }

            // Include posts check (if specified, ad only shows on these posts)
            if (!empty($ad['include_posts'])) {
                $includes = array_map('trim', explode(',', (string) $ad['include_posts']));
                if (!in_array((string) $post_id, $includes, true) && !in_array($post_slug, $includes, true)) {
                    continue;
                }
            }

            // Target categories check (empty = all categories)
            if (!empty($ad['target_categories']) && is_array($ad['target_categories'])) {
                $intersection = array_intersect($ad['target_categories'], $post_categories);
                if (empty($intersection)) {
                    continue;
                }
            }

            $matched[] = $ad;
        }

        return $matched;
    }
}
