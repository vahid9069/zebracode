<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * ماژول نقشه سایت هوشمند و فوق‌العاده سریع XML (Sitemap Engine)
 * تولید نقشه سایت استاندارد XML برای نوشته‌ها، برگه‌ها، دسته‌بندی‌ها و تصاویر با حذف خودکار موارد noindex
 */
class Sitemap_Module implements Module_Interface {

    public const CACHE_PREFIX = 'omni_sitemap_cache_';
    public const CACHE_TTL    = 43200; // 12 hours

    public function get_id(): string {
        return 'sitemap';
    }

    public function get_title(): string {
        return 'نقشه سایت هوشمند XML (Sitemap Engine)';
    }

    public function get_description(): string {
        return 'تولید نقشه سایت XML بسیار سریع و سبک با پشتیبانی از تصاویر، دسته‌ها و حذف خودکار صفحات noindex.';
    }

    public function is_active(): bool {
        $states = get_option('omni_ai_modules', []);
        return !isset($states[$this->get_id()]) || (bool) $states[$this->get_id()];
    }

    public function register(): void {
        // ۱. بازنویسی قوانین آدرس‌ها (Rewrite Rules)
        add_action('init', [$this, 'register_rewrite_rules']);
        add_filter('query_vars', [$this, 'register_query_vars']);
        add_action('template_redirect', [$this, 'handle_sitemap_request']);

        // ۲. پاکسازی خودکار کش نقشه سایت هنگام ویرایش محتوا
        add_action('save_post', [$this, 'clear_sitemap_cache']);
        add_action('deleted_post', [$this, 'clear_sitemap_cache']);
        add_action('create_category', [$this, 'clear_sitemap_cache']);
        add_action('edited_category', [$this, 'clear_sitemap_cache']);
        add_action('delete_category', [$this, 'clear_sitemap_cache']);

        // ۳. غیرفعال کردن نقشه سایت پیش‌فرض سنگین وردپرس جهت جلوگیری از تداخل
        add_filter('wp_sitemaps_enabled', '__return_false');
    }

    public function register_rewrite_rules(): void {
        add_rewrite_rule('^sitemap\.xml$', 'index.php?omni_sitemap=index', 'top');
        add_rewrite_rule('^sitemap_index\.xml$', 'index.php?omni_sitemap=index', 'top');
        add_rewrite_rule('^sitemap-([a-z0-9_-]+)\.xml$', 'index.php?omni_sitemap=$matches[1]', 'top');
    }

    public function register_query_vars(array $vars): array {
        $vars[] = 'omni_sitemap';
        return $vars;
    }

    public function clear_sitemap_cache(): void {
        delete_transient(self::CACHE_PREFIX . 'index');
        delete_transient(self::CACHE_PREFIX . 'posts');
        delete_transient(self::CACHE_PREFIX . 'pages');
        delete_transient(self::CACHE_PREFIX . 'categories');
    }

    public function handle_sitemap_request(): void {
        $sitemap_type = get_query_var('omni_sitemap');
        if (empty($sitemap_type)) {
            return;
        }

        $sitemap_type = sanitize_key($sitemap_type);
        $cache_key = self::CACHE_PREFIX . $sitemap_type;
        $xml = get_transient($cache_key);

        if ($xml === false || empty($xml)) {
            switch ($sitemap_type) {
                case 'index':
                    $xml = $this->generate_index_sitemap();
                    break;
                case 'posts':
                    $xml = $this->generate_posts_sitemap();
                    break;
                case 'pages':
                    $xml = $this->generate_pages_sitemap();
                    break;
                case 'categories':
                    $xml = $this->generate_categories_sitemap();
                    break;
                default:
                    return;
            }

            if (!empty($xml)) {
                set_transient($cache_key, $xml, self::CACHE_TTL);
            }
        }

        if (empty($xml)) {
            global $wp_query;
            $wp_query->set_404();
            status_header(404);
            return;
        }

        // ارسال هدرهای بهینه
        header('Content-Type: application/xml; charset=utf-8');
        header('X-Robots-Tag: noindex, follow');
        header('Cache-Control: public, max-age=3600');

        echo $xml;
        exit;
    }

    /**
     * تولید نقشه اصلی (Sitemap Index)
     */
    private function generate_index_sitemap(): string {
        $home = home_url();
        $now  = current_time('c');

        // دریافت تاریخ آخرین ویرایش پست‌ها
        $latest_post = get_posts([
            'numberposts' => 1,
            'post_status' => 'publish',
            'post_type'   => 'post',
            'orderby'     => 'modified',
            'order'       => 'DESC',
        ]);
        $posts_lastmod = !empty($latest_post) ? get_post_modified_time('c', true, $latest_post[0]->ID) : $now;

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        // ۱. نقشه پست‌ها
        $xml .= "  <sitemap>\n";
        $xml .= "    <loc>" . esc_url($home . '/sitemap-posts.xml') . "</loc>\n";
        $xml .= "    <lastmod>" . esc_html($posts_lastmod) . "</lastmod>\n";
        $xml .= "  </sitemap>\n";

        // ۲. نقشه برگه‌ها
        $xml .= "  <sitemap>\n";
        $xml .= "    <loc>" . esc_url($home . '/sitemap-pages.xml') . "</loc>\n";
        $xml .= "    <lastmod>" . esc_html($now) . "</lastmod>\n";
        $xml .= "  </sitemap>\n";

        // ۳. نقشه دسته‌بندی‌ها
        $xml .= "  <sitemap>\n";
        $xml .= "    <loc>" . esc_url($home . '/sitemap-categories.xml') . "</loc>\n";
        $xml .= "    <lastmod>" . esc_html($posts_lastmod) . "</lastmod>\n";
        $xml .= "  </sitemap>\n";

        $xml .= '</sitemapindex>';
        return $xml;
    }

    /**
     * تولید نقشه پست‌ها همراه با تصاویر شاخص
     */
    private function generate_posts_sitemap(): string {
        $posts = get_posts([
            'numberposts' => 1000,
            'post_status' => 'publish',
            'post_type'   => 'post',
            'orderby'     => 'modified',
            'order'       => 'DESC',
        ]);

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";

        foreach ($posts as $post) {
            // بررسی دستور noindex (عدم ثبت صفحات noindex در نقشه سایت)
            if ($this->is_post_noindex($post->ID)) {
                continue;
            }

            $loc      = get_permalink($post->ID);
            $lastmod  = get_post_modified_time('c', true, $post->ID);
            $thumb_id = get_post_thumbnail_id($post->ID);
            $thumb_url = $thumb_id ? wp_get_attachment_url($thumb_id) : '';

            $xml .= "  <url>\n";
            $xml .= "    <loc>" . esc_url($loc) . "</loc>\n";
            $xml .= "    <lastmod>" . esc_html($lastmod) . "</lastmod>\n";
            $xml .= "    <changefreq>weekly</changefreq>\n";
            $xml .= "    <priority>0.8</priority>\n";

            if (!empty($thumb_url)) {
                $alt = get_post_meta($thumb_id, '_wp_attachment_image_alt', true) ?: $post->post_title;
                $xml .= "    <image:image>\n";
                $xml .= "      <image:loc>" . esc_url($thumb_url) . "</image:loc>\n";
                $xml .= "      <image:title>" . esc_html(htmlspecialchars($alt, ENT_XML1, 'UTF-8')) . "</image:title>\n";
                $xml .= "    </image:image>\n";
            }

            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';
        return $xml;
    }

    /**
     * تولید نقشه برگه‌های سایت
     */
    private function generate_pages_sitemap(): string {
        $pages = get_pages([
            'number'      => 500,
            'post_status' => 'publish',
        ]);

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        // برگه اصلی سایت
        $xml .= "  <url>\n";
        $xml .= "    <loc>" . esc_url(home_url('/')) . "</loc>\n";
        $xml .= "    <lastmod>" . esc_html(current_time('c')) . "</lastmod>\n";
        $xml .= "    <changefreq>daily</changefreq>\n";
        $xml .= "    <priority>1.0</priority>\n";
        $xml .= "  </url>\n";

        foreach ($pages as $page) {
            if ($this->is_post_noindex($page->ID)) {
                continue;
            }

            $loc     = get_permalink($page->ID);
            $lastmod = get_post_modified_time('c', true, $page->ID);

            $xml .= "  <url>\n";
            $xml .= "    <loc>" . esc_url($loc) . "</loc>\n";
            $xml .= "    <lastmod>" . esc_html($lastmod) . "</lastmod>\n";
            $xml .= "    <changefreq>monthly</changefreq>\n";
            $xml .= "    <priority>0.6</priority>\n";
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';
        return $xml;
    }

    /**
     * تولید نقشه دسته‌بندی‌ها
     */
    private function generate_categories_sitemap(): string {
        $terms = get_terms([
            'taxonomy'   => 'category',
            'hide_empty' => true,
        ]);

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        if (!is_wp_error($terms) && is_array($terms)) {
            foreach ($terms as $term) {
                $loc = get_term_link($term, 'category');
                if (is_wp_error($loc)) {
                    continue;
                }

                $xml .= "  <url>\n";
                $xml .= "    <loc>" . esc_url($loc) . "</loc>\n";
                $xml .= "    <changefreq>weekly</changefreq>\n";
                $xml .= "    <priority>0.5</priority>\n";
                $xml .= "  </url>\n";
            }
        }

        $xml .= '</urlset>';
        return $xml;
    }

    /**
     * بررسی هوشمند وضعیت noindex یک نوشته
     */
    private function is_post_noindex(int $post_id): bool {
        // ۱. بررسی متای بومی Omni AI
        $omni_noindex = get_post_meta($post_id, '_omni_ai_noindex', true);
        if ($omni_noindex === '1') {
            return true;
        }

        // ۲. بررسی سازگاری با رنک‌مث
        $rm_robots = get_post_meta($post_id, 'rank_math_robots', true);
        if (is_array($rm_robots) && in_array('noindex', $rm_robots, true)) {
            return true;
        }
        if (is_string($rm_robots) && strpos($rm_robots, 'noindex') !== false) {
            return true;
        }

        // ۳. بررسی سازگاری با یواست سئو
        $yoast_noindex = get_post_meta($post_id, '_yoast_wpseo_meta-robots-noindex', true);
        if ($yoast_noindex === '1') {
            return true;
        }

        return false;
    }
}
