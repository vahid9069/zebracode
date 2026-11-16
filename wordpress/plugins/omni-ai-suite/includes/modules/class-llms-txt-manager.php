<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * مدیریت استانداردهای هوش مصنوعی و کراولرها:
 * تولید llms.txt و llms-full.txt و مدیریت دایرکتیوهای AI در robots.txt
 */
class Llms_Txt_Manager {

    public function register(): void {
        add_action('init', [$this, 'register_llms_rewrite_rules']);
        add_filter('query_vars', [$this, 'register_query_vars']);
        add_action('template_redirect', [$this, 'handle_llms_template_redirect']);
        add_filter('robots_txt', [$this, 'filter_robots_txt'], 99, 2);
    }

    /* --- Rewrite Rules for llms.txt --- */

    public function register_llms_rewrite_rules(): void {
        add_rewrite_rule('^llms\.txt$', 'index.php?omni_llms_feed=summary', 'top');
        add_rewrite_rule('^llms-full\.txt$', 'index.php?omni_llms_feed=full', 'top');
    }

    public function register_query_vars($vars = []): array {
        $vars = is_array($vars) ? $vars : [];
        $vars[] = 'omni_llms_feed';
        return $vars;
    }

    public function handle_llms_template_redirect(): void {
        $feed = get_query_var('omni_llms_feed');
        if (!empty($feed)) {
            $is_full = ($feed === 'full');
            if (!headers_sent()) {
                header('Content-Type: text/plain; charset=utf-8');
                header('X-Robots-Tag: all');
            }
            echo $this->generate_llms_content($is_full);
            exit;
        }

        // بررسی مستقیم URI در صورتی که rewrite rules فلاش نشده باشد یا در ساب‌فولدر قرار داشته باشد
        $req_uri = $_SERVER['REQUEST_URI'] ?? '';
        $path    = strtolower(strtok($req_uri, '?'));
        if (substr($path, -9) === '/llms.txt' || $path === '/llms.txt' || $path === 'llms.txt') {
            if (!headers_sent()) {
                header('Content-Type: text/plain; charset=utf-8');
                header('X-Robots-Tag: all');
            }
            echo $this->generate_llms_content(false);
            exit;
        } elseif (substr($path, -14) === '/llms-full.txt' || $path === '/llms-full.txt' || $path === 'llms-full.txt') {
            if (!headers_sent()) {
                header('Content-Type: text/plain; charset=utf-8');
                header('X-Robots-Tag: all');
            }
            echo $this->generate_llms_content(true);
            exit;
        }
    }

    public function get_effective_site_url(array $options = []): string {
        if (empty($options)) {
            $options = get_option('omni_ai_ranking_settings', []);
        }
        $saved = !empty($options['custom_site_url']) ? trim($options['custom_site_url']) : '';
        if (!empty($saved)) {
            return untrailingslashit($saved);
        }

        $admin_path = untrailingslashit(admin_url());
        if (strpos($admin_path, '/blog-admin') !== false && strpos(site_url(), '/blog-admin') === false) {
            return untrailingslashit(home_url('/blog-admin'));
        }

        $site = untrailingslashit(site_url());
        if (!empty($site)) {
            return $site;
        }

        return untrailingslashit(home_url());
    }

    public function generate_llms_content(bool $full = false): string {
        $options   = get_option('omni_ai_ranking_settings', []);
        $site_name = get_bloginfo('name');
        $site_desc = !empty($options['llms_site_summary']) ? $options['llms_site_summary'] : get_bloginfo('description');
        $site_url  = $this->get_effective_site_url($options);
        $limit     = !empty($options['llms_post_limit']) ? (int) $options['llms_post_limit'] : 50;

        $posts = get_posts([
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => $limit,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ]);

        $output = "# {$site_name}\n\n";
        if (!empty($site_desc)) {
            $output .= "> {$site_desc}\n\n";
        }
        $output .= "آدرس وب‌سایت: {$site_url}\n\n";

        if ($full) {
            $output .= "## آرشیو کامل متنی مقالات برای مدل‌های هوش مصنوعی (Full Text Content)\n\n";
            foreach ($posts as $p) {
                $permalink = get_permalink($p->ID);
                $clean_text = wp_strip_all_tags($p->post_content);
                $clean_text = preg_replace("/[\r\n]{3,}/", "\n\n", trim($clean_text));

                $output .= "### " . $p->post_title . "\n";
                $output .= "- نشانی اینترنتی: " . $permalink . "\n";
                $output .= "- تاریخ انتشار: " . get_the_date('Y/m/d', $p->ID) . "\n\n";
                $output .= $clean_text . "\n\n";
                $output .= "---\n\n";
            }
        } else {
            $output .= "## راهنماها و مقالات کلیدی (Key Articles & Documentation)\n\n";
            foreach ($posts as $p) {
                $permalink = get_permalink($p->ID);
                $ranking   = get_post_meta($p->ID, '_omni_content_ranking', true);

                $excerpt = '';
                if (!empty($p->post_excerpt)) {
                    $excerpt = wp_strip_all_tags($p->post_excerpt);
                } else {
                    $clean = wp_strip_all_tags($p->post_content);
                    $excerpt = mb_substr($clean, 0, 160, 'UTF-8');
                }
                $excerpt = str_replace(["\r", "\n"], ' ', trim($excerpt));

                $score_badge = '';
                if (!empty($ranking['avg_score'])) {
                    $score_badge = " [امتیاز آمادگی هوش مصنوعی: " . $ranking['avg_score'] . "%]";
                }

                $output .= "- [" . $p->post_title . "](" . $permalink . "): " . $excerpt . $score_badge . "\n";
            }

            $cats = get_categories(['hide_empty' => true]);
            if (!empty($cats)) {
                $output .= "\n## موضوعات و دسته‌بندی‌ها (Topics & Categories)\n\n";
                foreach ($cats as $cat) {
                    $output .= "- [" . $cat->name . "](" . get_category_link($cat->term_id) . ")\n";
                }
            }
        }

        return $output;
    }

    /* --- AI Bots Manager (robots.txt filter & Preview) --- */

    public function get_full_robots_content(): string {
        $settings = get_option('omni_ai_ranking_settings', []);
        $site_url = !empty($settings['custom_site_url']) ? rtrim($settings['custom_site_url'], '/') : rtrim($this->get_effective_site_url($settings), '/');

        $lines = [
            'User-agent: *',
            'Disallow: /wp-admin/',
            'Allow: /wp-admin/admin-ajax.php',
            '',
            'Sitemap: ' . $site_url . '/sitemap_index.xml',
            'Sitemap: ' . $site_url . '/sitemap.xml',
            '',
        ];
        $base = implode("\n", $lines);

        if (!empty($settings['enable_ai_bots_manager'])) {
            $preview = $this->generate_ai_robots_preview($settings);
            return $base . "\n" . $preview . "\n";
        }

        return $base;
    }

    public function generate_ai_robots_preview(array $settings): string {
        if (empty($settings['enable_ai_bots_manager'])) {
            return "# مدیریت ربات‌های هوش مصنوعی غیرفعال است (قوانین سفارشی در robots.txt درج نمی‌شود).";
        }

        $bots = $settings['ai_bots'] ?? [];
        $out  = "# =============================================================\n";
        $out .= "# Omni AI Suite - AI Bots & LLM Web Crawlers Directives\n";
        $out .= "# Generated automatically based on your AI Bots Manager settings\n";
        $out .= "# =============================================================\n\n";

        foreach ($bots as $bot => $action) {
            $out .= "User-agent: {$bot}\n";
            $out .= ($action === 'allow') ? "Allow: /\n\n" : "Disallow: /\n\n";
        }

        return trim($out);
    }

    public function filter_robots_txt($output = '', $public = true): string {
        $output   = (string) $output;
        $settings = get_option('omni_ai_ranking_settings', []);
        if (empty($settings['enable_ai_bots_manager'])) {
            return $output;
        }

        $preview = $this->generate_ai_robots_preview($settings);
        return $output . "\n\n" . $preview . "\n";
    }
}
