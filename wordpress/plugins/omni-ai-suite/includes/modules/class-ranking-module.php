<?php
namespace OmniAI\Modules;

use OmniAI\Providers\Provider_Factory;
use OmniAI\Database\Log_Repository;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * ماژول رتبه‌بندی هوشمند محتوا (SEO / AEO / GEO)
 * ارزیابی سئو کلاسیک، بهینه‌سازی پاسخ موتورها (AEO) و بهینه‌سازی مدل‌های مولد (GEO)
 */
class Ranking_Module implements Module_Interface {

    /**
     * ۶ دسته‌بندی ثابت، رسمی و مجاز وبلاگ زیبراکد
     */
    public const CANONICAL_CATEGORIES = [
        'tech-trends' => [
            'name'        => 'تازه‌ها و ترندهای فناوری',
            'description' => 'رصد فناوری‌های نوظهور، هوش مصنوعی و ترندهای موثر در آینده دیجیتال.',
            'aliases'     => ['تازه های فناوری', 'فناوری', 'هوش مصنوعی', 'ai', 'tech', 'trends', 'تازه‌ها و ترندهای فناوری'],
        ],
        'development' => [
            'name'        => 'توسعه و برنامه‌نویسی',
            'description' => 'معماری نرم‌افزار، استانداردهای کدنویسی، فریم‌ورک‌ها و الگوهای توسعه.',
            'aliases'     => ['برنامه نویسی', 'برنامه‌نویسی', 'کدنویسی', 'توسعه', 'programming', 'development', 'software', 'مهندسی نرم افزار', 'توسعه و برنامه‌نویسی'],
        ],
        'tools' => [
            'name'        => 'ابزارها و بهره‌وری',
            'description' => 'ابزارهای خط فرمان، ویرایشگرها، اتوماسیون و ابزارهای افزایش سرعت کار.',
            'aliases'     => ['ابزارها', 'ابزار', 'tools', 'بهره‌وری', 'متن و بهره‌وری', 'cli', 'productivity', 'ابزارها و بهره‌وری'],
        ],
        'network' => [
            'name'        => 'شبکه، وب و API',
            'description' => 'پروتکل‌های وب، طراحی و مصرف APIها و زیرساخت‌های شبکه مدرن.',
            'aliases'     => ['شبکه و وب', 'شبکه', 'وب', 'api', 'network', 'web', 'http', 'شبکه، وب و API'],
        ],
        'data' => [
            'name'        => 'داده و ساختار',
            'description' => 'پایگاه‌داده‌ها، ساختار داده، بهینه‌سازی کوئری‌ها و مدیریت حجم داده.',
            'aliases'     => ['داده', 'ساختار داده', 'database', 'data', 'sql', 'داده و ساختار'],
        ],
        'security' => [
            'name'        => 'امنیت کاربردی',
            'description' => 'امنیت نرم‌افزار، احراز هویت، جلوگیری از آسیب‌پذیری‌ها و ایمن‌سازی سرویس‌ها.',
            'aliases'     => ['امنیت', 'security', 'auth', 'cybersecurity', 'امنیت کاربردی'],
        ],
    ];

    /**
     * همگام‌سازی دسته‌های ثابت وردپرس و انتقال پست‌های دسته‌های منسوخ شده
     */
    public static function sync_canonical_categories(): array {
        if (!function_exists('get_term_by') || !function_exists('wp_insert_term')) {
            return ['success' => false, 'canonical_ids' => []];
        }

        $category_ids = [];
        foreach (self::CANONICAL_CATEGORIES as $slug => $data) {
            $term = get_term_by('slug', $slug, 'category');
            if (!$term) {
                $term = get_term_by('name', $data['name'], 'category');
            }
            if (!$term) {
                $inserted = wp_insert_term($data['name'], 'category', [
                    'slug'        => $slug,
                    'description' => $data['description'],
                ]);
                if (!is_wp_error($inserted) && isset($inserted['term_id'])) {
                    $category_ids[$slug] = (int) $inserted['term_id'];
                }
            } else {
                $category_ids[$slug] = (int) $term->term_id;
                if ($term->name !== $data['name'] || $term->slug !== $slug) {
                    wp_update_term($term->term_id, 'category', [
                        'name'        => $data['name'],
                        'slug'        => $slug,
                        'description' => $data['description'],
                    ]);
                }
            }
        }

        // تنظیم دسته پیش‌فرض
        if (!empty($category_ids['tech-trends'])) {
            update_option('default_category', $category_ids['tech-trends']);
        }

        // انتقال مقالات دسته‌های قدیمی به دسته‌های جدید و حذف دسته‌های اضافی
        $all_existing_terms = get_terms([
            'taxonomy'   => 'category',
            'hide_empty' => false,
        ]);

        $canonical_term_ids = array_values($category_ids);
        $deleted_terms = [];
        $migrated_posts = 0;

        if (!is_wp_error($all_existing_terms) && is_array($all_existing_terms)) {
            foreach ($all_existing_terms as $existing_term) {
                if (in_array((int) $existing_term->term_id, $canonical_term_ids, true)) {
                    continue;
                }

                $target_slug = 'tech-trends';
                $old_name_lower = mb_strtolower(trim($existing_term->name), 'UTF-8');
                $old_slug_lower = mb_strtolower(trim($existing_term->slug), 'UTF-8');

                foreach (self::CANONICAL_CATEGORIES as $c_slug => $c_data) {
                    foreach ($c_data['aliases'] as $alias) {
                        if (mb_stripos($old_name_lower, $alias) !== false || mb_stripos($old_slug_lower, $alias) !== false) {
                            $target_slug = $c_slug;
                            break 2;
                        }
                    }
                }

                $target_term_id = $category_ids[$target_slug] ?? reset($canonical_term_ids);

                $posts = get_posts([
                    'post_type'      => 'post',
                    'posts_per_page' => -1,
                    'post_status'    => 'any',
                    'tax_query'      => [
                        [
                            'taxonomy' => 'category',
                            'field'    => 'term_id',
                            'terms'    => $existing_term->term_id,
                        ],
                    ],
                ]);

                if (!empty($posts) && is_array($posts)) {
                    foreach ($posts as $p) {
                        wp_set_post_categories($p->ID, [$target_term_id], true);
                        $migrated_posts++;
                    }
                }

                if ((int) $existing_term->term_id !== (int) get_option('default_category')) {
                    wp_delete_term($existing_term->term_id, 'category');
                    $deleted_terms[] = $existing_term->name;
                }
            }
        }

        update_option('omni_categories_migrated_v1', 1);

        return [
            'success'        => true,
            'canonical_ids'  => $category_ids,
            'deleted_terms'  => $deleted_terms,
            'migrated_posts' => $migrated_posts,
        ];
    }

    /**
     * تطبیق دقیق یا هوشمند یک عنوان به یکی از ۶ دسته ثابت
     */
    public static function resolve_canonical_category(string $name_or_slug): int {
        $canonical = self::sync_canonical_categories();
        $canonical_ids = $canonical['canonical_ids'] ?? [];

        $input = mb_strtolower(trim($name_or_slug), 'UTF-8');
        foreach (self::CANONICAL_CATEGORIES as $slug => $data) {
            if ($slug === $input || mb_strtolower($data['name'], 'UTF-8') === $input) {
                return $canonical_ids[$slug] ?? reset($canonical_ids);
            }
            foreach ($data['aliases'] as $alias) {
                if (mb_stripos($input, $alias) !== false) {
                    return $canonical_ids[$slug] ?? reset($canonical_ids);
                }
            }
        }

        return $canonical_ids['tech-trends'] ?? (int) reset($canonical_ids);
    }

    public function get_id(): string {
        return 'content_ranking';
    }

    public function get_title(): string {
        $locale = get_user_locale();
        $is_fa = str_starts_with($locale, 'fa') || is_rtl();
        return $is_fa ? 'رتبه‌بندی محتوا (SEO / AEO / GEO)' : 'Content Ranking (SEO/AEO/GEO)';
    }

    public function get_description(): string {
        $locale = get_user_locale();
        $is_fa = str_starts_with($locale, 'fa') || is_rtl();
        return $is_fa
            ? 'ارزیابی هوشمند و امتیازدهی نوشته‌ها بر مبنای سئو، بهینه‌سازی موتور پاسخگو (AEO) و موتور هوش مصنوعی (GEO) در لیست نوشته‌ها و ویرایشگر نوشته همراه با اصلاح خودکار نواقص با AI.'
            : 'AI-driven content ranking evaluating SEO, Answer Engine Optimization (AEO), and Generative Engine Optimization (GEO) in posts table and editor with one-click AI Auto-Fix.';
    }

    public function is_active(): bool {
        $states = get_option('omni_ai_modules', []);
        return !isset($states[$this->get_id()]) || (bool) $states[$this->get_id()];
    }

    private static array $rendered_cells = [];

    public function register(): void {
        // ۱. ثبت ستون در جدول نوشته‌ها و برگه‌ها به عنوان آخرین ستون
        add_filter('manage_posts_columns', [$this, 'add_ranking_column'], 99);
        add_filter('manage_pages_columns', [$this, 'add_ranking_column'], 99);
        add_filter('manage_edit-product_columns', [$this, 'add_ranking_column'], 99);

        // جلوگیری از رندر مجدد در یک سطر
        add_action('manage_posts_custom_column', [$this, 'render_ranking_column'], 10, 2);
        add_action('manage_pages_custom_column', [$this, 'render_ranking_column'], 10, 2);
        add_action('manage_product_posts_custom_column', [$this, 'render_ranking_column'], 10, 2);

        // ستون قابل مرتب‌سازی
        add_filter('manage_edit-post_sortable_columns', [$this, 'make_column_sortable']);
        add_filter('manage_edit-page_sortable_columns', [$this, 'make_column_sortable']);
        add_filter('manage_edit-product_sortable_columns', [$this, 'make_column_sortable']);
        add_action('pre_get_posts', [$this, 'sort_by_ranking']);

        // اطمینان از نمایان بودن ستون به‌طور پیش‌فرض
        add_filter('default_hidden_columns', [$this, 'ensure_column_not_hidden'], 10, 2);

        // ۲. سایدبار و متاباکس در صفحه ویرایش نوشته
        add_action('add_meta_boxes', [$this, 'add_post_metabox']);

        // ۳. لود استایل و اسکریپت
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);

        // ۴. افزودن کانتینر مودال در فوتر ادمین
        add_action('admin_footer-edit.php', [$this, 'render_modal_container']);

        // ۵. تحلیل خودکار پس از ذخیره یا انتشار نوشته
        add_action('save_post', [$this, 'on_save_post'], 10, 3);

        // ۶. درخواست‌های AJAX
        add_action('wp_ajax_omni_ai_reanalyze_post_ratings', [$this, 'ajax_reanalyze']);
        add_action('wp_ajax_omni_ai_get_post_rating_modal', [$this, 'ajax_get_modal']);
        add_action('wp_ajax_omni_ai_optimize_post_content', [$this, 'ajax_optimize_content']);
        add_action('wp_ajax_omni_ai_apply_optimization', [$this, 'ajax_apply_optimization']);
        add_action('wp_ajax_omni_ai_save_post_seo', [$this, 'ajax_save_post_seo']);
        add_action('wp_ajax_omni_ai_generate_seo_snippet', [$this, 'ajax_generate_seo_snippet']);
        add_action('wp_ajax_omni_ai_fix_readability', [$this, 'ajax_fix_readability']);

        // ۷. ثبت مسیرهای REST API برای داشبورد React
        add_action('rest_api_init', [$this, 'register_rest_routes']);

        // ۸. تزریق متاتگ‌های سئو و اسکیماهای استاندارد AEO/GEO در فرانت‌اند
        add_action('wp_head', [$this, 'output_frontend_seo_tags'], 1);
        add_action('wp_head', [$this, 'output_webmaster_verification_tags'], 1);
        add_filter('pre_get_document_title', [$this, 'filter_document_title'], 15);
        add_filter('document_title_parts', [$this, 'filter_document_title_parts'], 15);
        add_action('wp_head', [$this, 'output_frontend_schemas'], 99);
        add_filter('the_content', [$this, 'filter_content_breadcrumbs'], 5);
        add_shortcode('omni_ai_breadcrumbs', ['\\OmniAI\\Modules\\Breadcrumbs', 'render_html']);
        add_shortcode('omni_breadcrumbs', ['\\OmniAI\\Modules\\Breadcrumbs', 'render_html']);

        // ۹. استانداردهای هوش مصنوعی (llms.txt و llms-full.txt)
        add_action('init', [$this, 'register_llms_rewrite_rules']);
        add_filter('query_vars', [$this, 'register_query_vars']);
        add_action('template_redirect', [$this, 'handle_llms_template_redirect']);

        // ۱۰. مدیریت دسترسی ربات‌های هوش مصنوعی در robots.txt (AI Bots Manager)
        add_filter('robots_txt', [$this, 'filter_robots_txt'], 99, 2);

        // ۱۱. پشتیبانی کامل از هدرهای سفارشی MCP در CORS
        add_filter('rest_allowed_cors_headers', function(array $headers): array {
            $extra = ['Mcp-Session-Id', 'MCP-Protocol-Version', 'Accept', 'Origin', 'X-Requested-With'];
            return array_unique(array_merge($headers, $extra));
        });

        // ۱۲. همگام‌سازی و تثبیت ۶ دسته‌بندی اصلی در مدیریت وردپرس
        if (is_admin()) {
            add_action('admin_init', function(): void {
                if (!get_option('omni_categories_migrated_v1')) {
                    self::sync_canonical_categories();
                }
            });
        }
    }

    public function ensure_column_not_hidden($hidden = [], $screen = null): array {
        $hidden = is_array($hidden) ? $hidden : [];
        if (is_object($screen) && isset($screen->id) && in_array($screen->id, ['edit-post', 'edit-page'], true)) {
            $hidden = array_diff($hidden, ['omni_ai_ranking']);
        }
        return $hidden;
    }

    public function add_ranking_column($columns = []): array {
        $columns = is_array($columns) ? $columns : [];
        $columns['omni_ai_ranking'] = 'رتبه محتوا (SEO / AEO / GEO)';
        return $columns;
    }

    public function render_ranking_column($column_name = '', $post_id = 0): void {
        if ($column_name !== 'omni_ai_ranking') {
            return;
        }

        $post_id = (int) $post_id;
        if (!$post_id) {
            return;
        }

        if (isset(self::$rendered_cells[$post_id])) {
            return;
        }
        self::$rendered_cells[$post_id] = true;

        $ratings = $this->get_post_ranking($post_id);
        echo $this->render_ranking_cell_html($post_id, $ratings);
    }

    public function make_column_sortable($columns = []): array {
        $columns = is_array($columns) ? $columns : [];
        $columns['omni_ai_ranking'] = 'omni_ai_avg_score';
        return $columns;
    }

    public function sort_by_ranking($query = null): void {
        if (!($query instanceof \WP_Query)) {
            return;
        }
        if (!is_admin() || !$query->is_main_query()) {
            return;
        }

        if ($query->get('orderby') === 'omni_ai_avg_score') {
            $query->set('meta_key', '_omni_ranking_avg_score');
            $query->set('orderby', 'meta_value_num');
        }
    }

    public function add_post_metabox(): void {
        $screens = ['post', 'page'];
        if (post_type_exists('product')) {
            $screens[] = 'product';
        }
        foreach ($screens as $screen) {
            add_meta_box(
                'omni_content_ranking_box',
                'تحلیل رتبه محتوا (SEO / AEO / GEO / خوانایی) | Omni AI',
                [$this, 'render_metabox_content'],
                $screen,
                'normal',
                'high'
            );
        }
    }

    public function render_metabox_content($post = null): void {
        if (!($post instanceof \WP_Post)) {
            return;
        }
        $ratings = $this->get_post_ranking($post->ID);
        wp_nonce_field('omni_ranking_nonce', 'omni_ranking_nonce_field');
        ?>
        <div class="omni-ranking-metabox" id="omni-ranking-metabox" data-post-id="<?php echo esc_attr($post->ID); ?>">
            <div class="omni-rmb-header">
                <div class="omni-rmb-title">
                    <span class="dashicons dashicons-chart-bar"></span>
                    <span>وضعیت آمادگی محتوا برای موتورهای جستجو، هوش مصنوعی و پاسخگو</span>
                </div>
                <div class="omni-rmb-actions">
                    <button type="button" class="button button-secondary omni-recalc-btn" data-post-id="<?php echo esc_attr($post->ID); ?>">
                        <span class="dashicons dashicons-update"></span>
                        <span>تحلیل مجدد محتوا</span>
                    </button>
                </div>
            </div>

            <div id="omni-rmb-content">
                <?php echo $this->render_full_dashboard_html($post->ID, $ratings); ?>
            </div>
        </div>
        <?php
    }

    public function enqueue_admin_assets($hook = ''): void {
        $hook = (string) $hook;
        $allowed_screens = ['edit.php', 'post.php', 'post-new.php'];
        $is_omni_screen = (strpos($hook, 'omni-ai-suite') !== false);
        if (!in_array($hook, $allowed_screens, true) && !$is_omni_screen) {
            return;
        }

        $base_url = defined('OMNI_AI_URL') ? OMNI_AI_URL : plugin_dir_url(dirname(dirname(__FILE__)) . '/omni-ai-suite.php');
        $css_url  = $base_url . 'assets/css/ranking.css';
        $js_url   = $base_url . 'assets/js/ranking.js';

        if (in_array($hook, ['post.php', 'post-new.php'], true)) {
            wp_enqueue_media();
        }

        $css_file = defined('OMNI_AI_PATH') ? OMNI_AI_PATH . 'assets/css/ranking.css' : '';
        $css_ver  = ($css_file && file_exists($css_file)) ? (string) filemtime($css_file) : '2.0.0';
        $js_file  = defined('OMNI_AI_PATH') ? OMNI_AI_PATH . 'assets/js/ranking.js' : '';
        $js_ver   = ($js_file && file_exists($js_file)) ? (string) filemtime($js_file) : '2.0.0';

        wp_enqueue_style('omni-ranking-css', $css_url, [], $css_ver);
        wp_enqueue_script('omni-ranking-js', $js_url, ['jquery'], $js_ver, true);

        wp_localize_script('omni-ranking-js', 'omniRankingConfig', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('omni_ranking_nonce'),
            'i18n'     => [
                'analyzing'       => 'در حال تحلیل هوشمند...',
                'recalc'          => 'تحلیل مجدد',
                'done'            => 'انجام شد',
                'error'           => 'خطا در بارگذاری',
                'optimizing'      => 'هوش مصنوعی در حال تحلیل نواقص و تولید محتوای بهینه‌ساز...',
                'applying'        => 'در حال اعمال در نوشته...',
                'applied_success' => 'بخش‌های منتخب با موفقیت به نوشته افزوده شدند.',
            ],
        ]);
    }

    public function render_modal_container(): void {
        ?>
        <div id="omni-ranking-modal" class="omni-ranking-modal" style="display: none;">
            <div class="omni-ranking-modal-overlay"></div>
            <div class="omni-ranking-modal-dialog">
                <div class="omni-ranking-modal-header">
                    <div class="omni-modal-heading">
                        <span class="dashicons dashicons-analytics"></span>
                        <h2 id="omni-modal-post-title">تحلیل جامع سئو و هوش مصنوعی</h2>
                        <span class="omni-modal-post-id" id="omni-modal-post-meta"></span>
                    </div>
                    <div class="omni-modal-close-actions">
                        <a id="omni-modal-edit-link" href="#" target="_blank" class="button button-secondary button-small" style="display:none;">
                            <span class="dashicons dashicons-edit"></span> ویرایش نوشته
                        </a>
                        <button type="button" class="omni-modal-close-btn" aria-label="بستن">&times;</button>
                    </div>
                </div>
                <div class="omni-ranking-modal-body" id="omni-modal-content-area">
                    <div class="omni-modal-loading">
                        <span class="spinner is-active"></span>
                        <span>در حال استخراج چک‌لیست و بررسی محتوا...</span>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    public function on_save_post($post_id = 0, $post = null, $update = false): void {
        $post_id = (int) $post_id;
        if (!$post_id || !$post || !is_object($post)) {
            return;
        }
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        if (wp_is_post_revision($post_id)) {
            return;
        }
        if (empty($post->post_type) || !in_array($post->post_type, ['post', 'page', 'product'], true)) {
            return;
        }

        // ذخیره فیلدهای متاباکس سئو در صورت ارسال فرم
        if (isset($_POST['omni_ranking_nonce_field']) && wp_verify_nonce($_POST['omni_ranking_nonce_field'], 'omni_ranking_nonce')) {
            if (isset($_POST['omni_ai_focus_keyword'])) {
                $kw = sanitize_text_field($_POST['omni_ai_focus_keyword']);
                update_post_meta($post_id, '_omni_ai_focus_keyword', $kw);
                update_post_meta($post_id, 'rank_math_focus_keyword', $kw);
                update_post_meta($post_id, '_yoast_wpseo_focuskw', $kw);
            }
            if (isset($_POST['omni_ai_seo_title'])) {
                $st = sanitize_text_field($_POST['omni_ai_seo_title']);
                update_post_meta($post_id, '_omni_ai_seo_title', $st);
                update_post_meta($post_id, 'rank_math_title', $st);
                update_post_meta($post_id, '_yoast_wpseo_title', $st);
            }
            if (isset($_POST['omni_ai_meta_description'])) {
                $md = sanitize_textarea_field($_POST['omni_ai_meta_description']);
                update_post_meta($post_id, '_omni_ai_meta_description', $md);
                update_post_meta($post_id, 'rank_math_description', $md);
                update_post_meta($post_id, '_yoast_wpseo_metadesc', $md);
            }
            if (isset($_POST['omni_ai_canonical_url'])) {
                $cu = esc_url_raw($_POST['omni_ai_canonical_url']);
                update_post_meta($post_id, '_omni_ai_canonical_url', $cu);
                update_post_meta($post_id, 'rank_math_canonical_url', $cu);
                update_post_meta($post_id, '_yoast_wpseo_canonical', $cu);
            }
            $noindex = !empty($_POST['omni_ai_noindex']) ? '1' : '0';
            update_post_meta($post_id, '_omni_ai_noindex', $noindex);

            $nofollow = !empty($_POST['omni_ai_nofollow']) ? '1' : '0';
            update_post_meta($post_id, '_omni_ai_nofollow', $nofollow);

            // شبکه‌های اجتماعی Open Graph و Twitter
            if (isset($_POST['omni_ai_og_title'])) {
                $val = sanitize_text_field($_POST['omni_ai_og_title']);
                update_post_meta($post_id, '_omni_ai_og_title', $val);
                update_post_meta($post_id, 'rank_math_facebook_title', $val);
                update_post_meta($post_id, '_yoast_wpseo_opengraph-title', $val);
            }
            if (isset($_POST['omni_ai_og_description'])) {
                $val = sanitize_textarea_field($_POST['omni_ai_og_description']);
                update_post_meta($post_id, '_omni_ai_og_description', $val);
                update_post_meta($post_id, 'rank_math_facebook_description', $val);
                update_post_meta($post_id, '_yoast_wpseo_opengraph-description', $val);
            }
            if (isset($_POST['omni_ai_og_image'])) {
                $val = esc_url_raw($_POST['omni_ai_og_image']);
                update_post_meta($post_id, '_omni_ai_og_image', $val);
                update_post_meta($post_id, 'rank_math_facebook_image', $val);
                update_post_meta($post_id, '_yoast_wpseo_opengraph-image', $val);
            }
            if (isset($_POST['omni_ai_twitter_title'])) {
                $val = sanitize_text_field($_POST['omni_ai_twitter_title']);
                update_post_meta($post_id, '_omni_ai_twitter_title', $val);
                update_post_meta($post_id, 'rank_math_twitter_title', $val);
                update_post_meta($post_id, '_yoast_wpseo_twitter-title', $val);
            }
            if (isset($_POST['omni_ai_twitter_description'])) {
                $val = sanitize_textarea_field($_POST['omni_ai_twitter_description']);
                update_post_meta($post_id, '_omni_ai_twitter_description', $val);
                update_post_meta($post_id, 'rank_math_twitter_description', $val);
                update_post_meta($post_id, '_yoast_wpseo_twitter-description', $val);
            }
            if (isset($_POST['omni_ai_twitter_image'])) {
                $val = esc_url_raw($_POST['omni_ai_twitter_image']);
                update_post_meta($post_id, '_omni_ai_twitter_image', $val);
                update_post_meta($post_id, 'rank_math_twitter_image', $val);
                update_post_meta($post_id, '_yoast_wpseo_twitter-image', $val);
            }
        }

        $this->analyze_and_save_post($post_id);
    }

    public function get_post_ranking(int $post_id): array {
        $cached = get_post_meta($post_id, '_omni_content_ranking', true);
        if (!empty($cached) && is_array($cached) && isset($cached['seo'], $cached['aeo'], $cached['geo'])) {
            return $cached;
        }
        return $this->analyze_and_save_post($post_id);
    }

    public function analyze_and_save_post(int $post_id): array {
        $post = get_post($post_id);
        if (!$post) {
            return $this->get_empty_ranking();
        }

        $content = (string) $post->post_content;
        $title   = (string) $post->post_title;

        $seo = $this->analyze_seo($post, $content, $title);
        $aeo = $this->analyze_aeo($post, $content, $title);
        $geo = $this->analyze_geo($post, $content, $title);
        $readability = $this->analyze_readability($post, $content, $title);

        $avg = round(($seo['score'] + $aeo['score'] + $geo['score'] + $readability['score']) / 4);

        $result = [
            'post_id'      => $post_id,
            'seo'          => $seo,
            'aeo'          => $aeo,
            'geo'          => $geo,
            'readability'  => $readability,
            'avg_score'    => $avg,
            'analyzed_at'  => current_time('mysql'),
            'word_count'   => $seo['metrics']['word_count'] ?? 0,
        ];

        update_post_meta($post_id, '_omni_content_ranking', $result);
        update_post_meta($post_id, '_omni_ranking_avg_score', $avg);
        update_post_meta($post_id, '_omni_ranking_seo_score', $seo['score']);
        update_post_meta($post_id, '_omni_ranking_aeo_score', $aeo['score']);
        update_post_meta($post_id, '_omni_ranking_geo_score', $geo['score']);
        update_post_meta($post_id, '_omni_ranking_readability_score', $readability['score']);

        return $result;
    }

    private function get_empty_ranking(): array {
        return [
            'seo'         => ['score' => 0, 'checklist' => [], 'recommendations' => [], 'metrics' => []],
            'aeo'         => ['score' => 0, 'checklist' => [], 'recommendations' => [], 'metrics' => []],
            'geo'         => ['score' => 0, 'checklist' => [], 'recommendations' => [], 'metrics' => []],
            'readability' => ['score' => 0, 'checklist' => [], 'recommendations' => [], 'metrics' => []],
            'avg_score'   => 0,
            'analyzed_at' => '',
            'word_count'  => 0,
        ];
    }

    private function count_words(string $text): int {
        $clean = trim(preg_replace('/\s+/u', ' ', wp_strip_all_tags($text)));
        if ($clean === '') {
            return 0;
        }
        $words = preg_split('/[\s\p{Z}\p{P}]+/u', $clean, -1, PREG_SPLIT_NO_EMPTY);
        return is_array($words) ? count($words) : 0;
    }

    /**
     * تحلیل سئو سنتی و ارگانیک (SEO) به همراه ارزیابی عمیق کلمه کلیدی کانونی - مجموع ۱۰۰ امتیاز
     */
    private function analyze_seo(\WP_Post $post, string $content, string $title): array {
        $checklist = [];
        $recommendations = [];
        $score = 0;

        $word_count = $this->count_words($content);
        $clean_text = wp_strip_all_tags($content);

        // ۱. دریافت کلمه کلیدی کانونی، عنوان و متادیسکریپشن
        $focus_kw = trim((string) get_post_meta($post->ID, '_omni_ai_focus_keyword', true));
        if (empty($focus_kw)) {
            $focus_kw = trim((string) get_post_meta($post->ID, 'rank_math_focus_keyword', true));
        }
        if (empty($focus_kw)) {
            $focus_kw = trim((string) get_post_meta($post->ID, '_yoast_wpseo_focuskw', true));
        }

        $seo_title = trim((string) get_post_meta($post->ID, '_omni_ai_seo_title', true));
        if (empty($seo_title)) {
            $seo_title = trim((string) get_post_meta($post->ID, 'rank_math_title', true));
        }
        if (empty($seo_title)) {
            $seo_title = trim((string) get_post_meta($post->ID, '_yoast_wpseo_title', true));
        }
        if (empty($seo_title)) {
            $seo_title = trim($title);
        }
        $title_len = mb_strlen($seo_title, 'UTF-8');

        $meta_desc = (string) get_post_meta($post->ID, '_omni_ai_meta_description', true);
        if (empty($meta_desc)) {
            $meta_desc = (string) get_post_meta($post->ID, 'rank_math_description', true);
        }
        if (empty($meta_desc)) {
            $meta_desc = (string) get_post_meta($post->ID, '_yoast_wpseo_metadesc', true);
        }
        $meta_len = mb_strlen(trim($meta_desc), 'UTF-8');

        // ۲. طول عنوان سئو (۱۰ امتیاز)
        if ($title_len >= 30 && $title_len <= 65) {
            $score += 10;
            $checklist[] = ['label' => 'طول عنوان سئو استاندارد و بهینه است (' . $title_len . ' کاراکتر)', 'status' => 'pass'];
        } elseif ($title_len > 0) {
            $score += 5;
            $checklist[] = ['label' => 'طول عنوان سئو خارج از محدوده پیشنهادی (۳۰ تا ۶۵ کاراکتر) است (' . $title_len . ')', 'status' => 'warning'];
            $recommendations[] = 'عنوان سئو را طوری بنویسید که بین ۳۰ تا ۶۵ کاراکتر باشد تا در نتایج گوگل کوتاه نشود.';
        } else {
            $checklist[] = ['label' => 'عنوان سئو برای نوشته تنظیم نشده است', 'status' => 'fail'];
            $recommendations[] = 'یک عنوان سئوی جذاب با کمک هوش مصنوعی تنظیم کنید.';
        }

        // ۳. حجم متن و تعداد کلمات (۱۵ امتیاز)
        if ($word_count >= 600) {
            $score += 15;
            $checklist[] = ['label' => 'حجم محتوا عالی و جامع است (' . number_format_i18n($word_count) . ' کلمه)', 'status' => 'pass'];
        } elseif ($word_count >= 300) {
            $score += 8;
            $checklist[] = ['label' => 'حجم محتوا متوسط است (' . number_format_i18n($word_count) . ' کلمه)', 'status' => 'warning'];
            $recommendations[] = 'برای کسب رتبه‌های بالاتر در سرچ گوگل، محتوا را به بیش از ۶۰۰ کلمه ارتقا دهید.';
        } else {
            $checklist[] = ['label' => 'محتوا بسیار کوتاه و ضعیف است (' . number_format_i18n($word_count) . ' کلمه)', 'status' => 'fail'];
            $recommendations[] = 'حداقل ۵۰۰ کلمه محتوای تخصصی به نوشته اضافه کنید.';
        }

        // ۴. ساختار تیترها H2 و H3 (۱۰ امتیاز)
        preg_match_all('/<h2[^>]*>(.*?)<\/h2>/is', $content, $h2_matches);
        preg_match_all('/<h3[^>]*>(.*?)<\/h3>/is', $content, $h3_matches);
        $h2_count = count($h2_matches[0] ?? []);
        $h3_count = count($h3_matches[0] ?? []);

        if ($h2_count >= 2) {
            $score += 10;
            $checklist[] = ['label' => 'ساختار هدینگ H2 مناسب است (' . $h2_count . ' تیتر H2)', 'status' => 'pass'];
        } elseif ($h2_count === 1) {
            $score += 5;
            $checklist[] = ['label' => 'فقط یک تیتر H2 در متن وجود دارد', 'status' => 'warning'];
            $recommendations[] = 'حداقل ۲ یا ۳ تیتر H2 در متن قرار دهید.';
        } else {
            $checklist[] = ['label' => 'هیچ تیتر H2 در متن یافت نشد', 'status' => 'fail'];
            $recommendations[] = 'متن خود را با زیرعنوان‌های H2 بخش‌بندی کنید تا ساختار سئو رعایت شود.';
        }

        // ۵. تصاویر و ویژگی Alt (۱۰ امتیاز)
        preg_match_all('/<img[^>]+>/i', $content, $img_matches);
        $img_count = count($img_matches[0] ?? []);
        $has_thumbnail = has_post_thumbnail($post->ID);

        if ($img_count > 0 || $has_thumbnail) {
            $missing_alt = 0;
            foreach ($img_matches[0] as $img_tag) {
                if (!preg_match('/alt=[\'"][^\'"]+[\'"]/i', $img_tag)) {
                    $missing_alt++;
                }
            }

            if ($missing_alt === 0) {
                $score += 10;
                $checklist[] = ['label' => 'تصاویر دارای متن جایگزین (Alt) استاندارد هستند', 'status' => 'pass'];
            } else {
                $score += 5;
                $checklist[] = ['label' => $missing_alt . ' تصویر بدون متن جایگزین (Alt) شناسایی شد', 'status' => 'warning'];
                $recommendations[] = 'برای همه تصاویر متن جایگزین (Alt) مرتبط با کلمه کلیدی قرار دهید.';
            }
        } else {
            $checklist[] = ['label' => 'هیچ تصویری در متن یافت نشد', 'status' => 'warning'];
            $recommendations[] = 'حداقل یک تصویر جذاب همراه با متن Alt به نوشته اضافه کنید.';
        }

        // ۶. پیوندها - داخلی و خارجی (۱۰ امتیاز)
        preg_match_all('/<a\s+[^>]*href=[\'"]([^\'"]+)[\'"][^>]*>/i', $content, $link_matches);
        $links = $link_matches[1] ?? [];
        $site_host = wp_parse_url(home_url(), PHP_URL_HOST);
        $internal_links = 0;
        $external_links = 0;

        foreach ($links as $link) {
            $link_host = wp_parse_url($link, PHP_URL_HOST);
            if (empty($link_host) || $link_host === $site_host) {
                $internal_links++;
            } else {
                $external_links++;
            }
        }

        if ($internal_links >= 1 && $external_links >= 1) {
            $score += 10;
            $checklist[] = ['label' => 'پیوندهای داخلی (' . $internal_links . ') و خارجی (' . $external_links . ') به‌خوبی رعایت شده‌اند', 'status' => 'pass'];
        } elseif ($internal_links >= 1) {
            $score += 6;
            $checklist[] = ['label' => 'پیوند داخلی دارد (' . $internal_links . ')، اما لینک خارجی مرجع ندارد', 'status' => 'warning'];
            $recommendations[] = 'یک پیوند به یک منبع معتبر خارجی مرتبط با موضوع اضافه کنید.';
        } else {
            $checklist[] = ['label' => 'هیچ پیوند داخلی به سایر مطالب سایت یافت نشد', 'status' => 'fail'];
            $recommendations[] = 'حداقل ۲ پیوند داخلی به مقالات مرتبط سایت خود اضافه کنید.';
        }

        // ۷. طول توضیحات متا (۱۰ امتیاز)
        if ($meta_len >= 110 && $meta_len <= 165) {
            $score += 10;
            $checklist[] = ['label' => 'متا دیسکریپشن دقیق و استاندارد تنظیم شده (' . $meta_len . ' کاراکتر)', 'status' => 'pass'];
        } elseif ($meta_len > 0) {
            $score += 5;
            $checklist[] = ['label' => 'طول متا دیسکریپشن بهینه نیست (' . $meta_len . ' کاراکتر)', 'status' => 'warning'];
            $recommendations[] = 'متا دیسکریپشن را به محدوده ۱۲۰ تا ۱۶۰ کاراکتر برسانید.';
        } else {
            $checklist[] = ['label' => 'توضیحات متا (Meta Description) ثبت نشده است', 'status' => 'fail'];
            $recommendations[] = 'توضیحات متای ترغیب‌کننده برای جذب کلیک بنویسید یا از دکمه «تولید عنوان و متادیسکریپشن با AI» استفاده کنید.';
        }

        // ==========================================================
        // ۸. ارزیابی عمیق کلیدواژه کانونی (Focus Keyword) - مجموع ۳۵ امتیاز
        // ==========================================================
        $kw_metrics = [
            'focus_keyword'   => $focus_kw,
            'in_title'        => false,
            'in_meta'         => false,
            'in_slug'         => false,
            'in_first_p'      => false,
            'in_heading'      => false,
            'in_image_alt'    => false,
            'keyword_count'   => 0,
            'keyword_density' => 0.0,
        ];

        if (empty($focus_kw)) {
            $checklist[] = ['label' => 'کلیدواژه کانونی تنظیم نشده است (۳۵ امتیاز کسر شد)', 'status' => 'fail'];
            $recommendations[] = 'یک کلمه کلیدی کانونی برای این مقاله مشخص کنید تا تطابق عنوان، توضیحات، آدرس و متن ارزیابی شود.';
        } else {
            $kw_lower = mb_strtolower($focus_kw, 'UTF-8');
            $post_slug = urldecode($post->post_name);
            if (empty($post_slug) || is_numeric($post_slug)) {
                $post_slug = urldecode(sanitize_title($post->post_title));
            }

            // الف) کلمه کلیدی در عنوان سئو (۶ امتیاز)
            if (mb_stripos($seo_title, $focus_kw) !== false) {
                $score += 6;
                $kw_metrics['in_title'] = true;
                $checklist[] = ['label' => "کلیدواژه کانونی در عنوان سئو قرار دارد («{$focus_kw}»)", 'status' => 'pass'];
            } else {
                $checklist[] = ['label' => "کلیدواژه کانونی در عنوان سئو یافت نشد", 'status' => 'fail'];
                $recommendations[] = "کلیدواژه «{$focus_kw}» را در ابتدای عنوان سئو قرار دهید.";
            }

            // ب) کلمه کلیدی در توضیحات متا (۶ امتیاز)
            if (!empty($meta_desc) && mb_stripos($meta_desc, $focus_kw) !== false) {
                $score += 6;
                $kw_metrics['in_meta'] = true;
                $checklist[] = ['label' => "کلیدواژه کانونی در توضیحات متا قرار دارد", 'status' => 'pass'];
            } else {
                $checklist[] = ['label' => "کلیدواژه کانونی در توضیحات متا یافت نشد", 'status' => 'fail'];
                $recommendations[] = "کلمه کلیدی «{$focus_kw}» را در توضیحات متا به کار ببرید.";
            }

            // ج) کلمه کلیدی در پیوند یکتا / نامک (۵ امتیاز)
            $persian_digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
            $english_digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

            $norm_slug = str_replace($persian_digits, $english_digits, mb_strtolower($post_slug, 'UTF-8'));
            $norm_kw   = str_replace($persian_digits, $english_digits, $kw_lower);
            $kw_slug_part = str_replace([' ', '‌'], '-', $norm_kw);

            $in_slug = false;
            if (!empty($norm_slug) && (
                mb_stripos($norm_slug, $kw_slug_part) !== false ||
                mb_stripos(str_replace('-', ' ', $norm_slug), $norm_kw) !== false ||
                mb_stripos($post_slug, str_replace([' ', '‌'], '-', $kw_lower)) !== false
            )) {
                $in_slug = true;
            } else {
                // بررسی وجود تک‌تک کلمات کلیدی در پیوند یکتا
                $kw_tokens = array_filter(explode(' ', str_replace(['-', '‌', '_'], ' ', $norm_kw)));
                if (!empty($kw_tokens)) {
                    $matched_tokens = 0;
                    foreach ($kw_tokens as $token) {
                        if (mb_strlen($token, 'UTF-8') >= 2 && mb_stripos($norm_slug, $token) !== false) {
                            $matched_tokens++;
                        }
                    }
                    if ($matched_tokens >= count($kw_tokens)) {
                        $in_slug = true;
                    }
                }
            }

            if ($in_slug) {
                $score += 5;
                $kw_metrics['in_slug'] = true;
                $checklist[] = ['label' => "کلیدواژه کانونی در پیوند یکتا (نامک) وجود دارد", 'status' => 'pass'];
            } else {
                $checklist[] = ['label' => "کلیدواژه کانونی در پیوند یکتا (URL) یافت نشد", 'status' => 'warning'];
                $recommendations[] = "کلمه کلیدی را در پیوند یکتای نوشته قرار دهید.";
            }

            // د) کلمه کلیدی در ۱۰٪ ابتدای متن (۵ امتیاز)
            $first_10_percent = mb_substr($clean_text, 0, max(250, (int) (mb_strlen($clean_text, 'UTF-8') * 0.1)), 'UTF-8');
            $norm_first_10 = str_replace($persian_digits, $english_digits, mb_strtolower($first_10_percent, 'UTF-8'));
            if (mb_stripos($first_10_percent, $focus_kw) !== false || mb_stripos($norm_first_10, $norm_kw) !== false) {
                $score += 5;
                $kw_metrics['in_first_p'] = true;
                $checklist[] = ['label' => "کلیدواژه در ۱۰٪ ابتدای متن (پاراگراف آغازین) به کار رفته است", 'status' => 'pass'];
            } else {
                $checklist[] = ['label' => "کلیدواژه در پاراگراف آغازین متن دیده نشد", 'status' => 'warning'];
                $recommendations[] = "در اولین پاراگراف نوشته به کلمه کلیدی «{$focus_kw}» اشاره کنید.";
            }

            // هـ) کلمه کلیدی در زیرعنوان‌های H2 یا H3 (۵ امتیاز)
            $in_headings = false;
            foreach (array_merge($h2_matches[1] ?? [], $h3_matches[1] ?? []) as $h_text) {
                $h_clean = wp_strip_all_tags($h_text);
                $h_norm  = str_replace($persian_digits, $english_digits, mb_strtolower($h_clean, 'UTF-8'));
                if (mb_stripos($h_clean, $focus_kw) !== false || mb_stripos($h_norm, $norm_kw) !== false) {
                    $in_headings = true;
                    break;
                }
            }
            if ($in_headings) {
                $score += 5;
                $kw_metrics['in_heading'] = true;
                $checklist[] = ['label' => "کلیدواژه در حداقل یکی از زیرعنوان‌های H2/H3 وجود دارد", 'status' => 'pass'];
            } else {
                $checklist[] = ['label' => "کلیدواژه در تیترهای فرعی (H2 یا H3) به کار نرفته است", 'status' => 'warning'];
                $recommendations[] = "کلیدواژه «{$focus_kw}» را در یکی از تیترهای H2 قرار دهید.";
            }

            // و) کلمه کلیدی در متن Alt تصاویر یا تصویر شاخص (۴ امتیاز)
            $in_alt = false;

            // ۱. بررسی متن Alt تصاویر داخل محتوا
            foreach ($img_matches[0] ?? [] as $img_tag) {
                if (preg_match('/alt=[\'"]([^\'"]+)[\'"]/i', $img_tag, $alt_m)) {
                    $alt_norm = str_replace($persian_digits, $english_digits, mb_strtolower($alt_m[1], 'UTF-8'));
                    if (mb_stripos($alt_m[1], $focus_kw) !== false || mb_stripos($alt_norm, $norm_kw) !== false) {
                        $in_alt = true;
                        break;
                    } elseif (!empty($kw_tokens) && count($kw_tokens) > 1) {
                        $matched_tokens = 0;
                        foreach ($kw_tokens as $token) {
                            if (mb_strlen($token, 'UTF-8') >= 2 && mb_stripos($alt_norm, $token) !== false) {
                                $matched_tokens++;
                            }
                        }
                        if ($matched_tokens >= count($kw_tokens)) {
                            $in_alt = true;
                            break;
                        }
                    }
                }
            }

            // ۲. بررسی متن Alt تصویر شاخص نوشته (Featured Image)
            if (!$in_alt) {
                $thumb_id = get_post_thumbnail_id($post->ID);
                if ($thumb_id) {
                    $thumb_alt = (string) get_post_meta($thumb_id, '_wp_attachment_image_alt', true);
                    $thumb_alt_norm = str_replace($persian_digits, $english_digits, mb_strtolower($thumb_alt, 'UTF-8'));
                    if (!empty($thumb_alt) && (mb_stripos($thumb_alt, $focus_kw) !== false || mb_stripos($thumb_alt_norm, $norm_kw) !== false)) {
                        $in_alt = true;
                    } elseif (!empty($thumb_alt) && !empty($kw_tokens) && count($kw_tokens) > 1) {
                        $matched_tokens = 0;
                        foreach ($kw_tokens as $token) {
                            if (mb_strlen($token, 'UTF-8') >= 2 && mb_stripos($thumb_alt_norm, $token) !== false) {
                                $matched_tokens++;
                            }
                        }
                        if ($matched_tokens >= count($kw_tokens)) {
                            $in_alt = true;
                        }
                    }
                }
            }

            if ($in_alt) {
                $score += 4;
                $kw_metrics['in_image_alt'] = true;
                $checklist[] = ['label' => "کلیدواژه در متن جایگزین (Alt) تصویر به کار رفته است", 'status' => 'pass'];
            } else {
                $checklist[] = ['label' => "کلیدواژه در متن Alt هیچ تصویری یافت نشد", 'status' => 'warning'];
                $recommendations[] = "در متن جایگزین (Alt) تصویر شاخص یا تصاویر متن از کلمه کلیدی استفاده کنید.";
            }

            // ز) چگالی کلمه کلیدی با محاسبه هوشمند و یکپارچه‌سازی ارقام (۴ امتیاز)
            $norm_clean_text = str_replace($persian_digits, $english_digits, mb_strtolower($clean_text, 'UTF-8'));
            $kw_count = max(
                mb_substr_count(mb_strtolower($clean_text, 'UTF-8'), $kw_lower),
                mb_substr_count($norm_clean_text, $norm_kw)
            );

            // اگر به صورت عبارت چند کلمه‌ای است، تکرار کلمات اصلی را نیز در نظر بگیر
            if ($kw_count < 2 && !empty($kw_tokens) && count($kw_tokens) > 1) {
                $min_token_count = 999;
                foreach ($kw_tokens as $token) {
                    $tc = mb_substr_count($norm_clean_text, $token);
                    if ($tc < $min_token_count) $min_token_count = $tc;
                }
                if ($min_token_count > $kw_count) {
                    $kw_count = $min_token_count;
                }
            }

            $kw_metrics['keyword_count'] = $kw_count;
            $density = ($word_count > 0) ? round(($kw_count / $word_count) * 100, 2) : 0.0;
            $kw_metrics['keyword_density'] = $density;

            if ($density >= 0.6 && $density <= 2.8) {
                $score += 4;
                $checklist[] = ['label' => "چگالی کلمه کلیدی ایده‌آل است ({$density}٪ - {$kw_count} مرتبه تکرار)", 'status' => 'pass'];
            } elseif ($density > 2.8) {
                $score += 2;
                $checklist[] = ['label' => "چگالی کلمه کلیدی بالاست ({$density}٪) - خطر Keyword Stuffing", 'status' => 'warning'];
                $recommendations[] = "تکرار کلمه کلیدی را کاهش داده و از کلمات مترادف استفاده کنید.";
            } elseif ($kw_count > 0) {
                $score += 2;
                $checklist[] = ['label' => "چگالی کلمه کلیدی کم است ({$density}٪ - فقط {$kw_count} بار تکرار)", 'status' => 'warning'];
                $recommendations[] = "کلمه کلیدی را چند بار دیگر در بخش‌های مختلف متن تکرار کنید.";
            } else {
                $checklist[] = ['label' => "کلمه کلیدی حتی یک‌بار در متن اصلی یافت نشد!", 'status' => 'fail'];
                $recommendations[] = "کلمه کلیدی «{$focus_kw}» را در بخش‌های مختلف متن به کار ببرید.";
            }
        }

        return [
            'score'           => min(100, $score),
            'checklist'       => $checklist,
            'recommendations' => $recommendations,
            'metrics'         => array_merge([
                'word_count'     => $word_count,
                'title_length'   => $title_len,
                'h2_count'       => $h2_count,
                'h3_count'       => $h3_count,
                'img_count'      => $img_count,
                'internal_links' => $internal_links,
                'external_links' => $external_links,
                'meta_desc_len'  => $meta_len,
            ], $kw_metrics),
        ];
    }

    /**
     * تحلیل بهینه‌سازی موتورهای پاسخگو (AEO) - مجموع ۱۰۰ امتیاز (۴ شاخص ۲۵ امتیازی)
     * مخصوص Google AI Overviews, Perplexity, Voice Search, Featured Snippets
     */
    private function analyze_aeo(\WP_Post $post, string $content, string $title): array {
        $checklist = [];
        $recommendations = [];
        $score = 0;

        $clean_text = trim(wp_strip_all_tags($content));

        // ۱. پاراگراف پاسخ مستقیم (Direct Answer Snippet) در ابتدای متن (۲۵ امتیاز)
        $paragraphs = preg_split('/\n+/', $clean_text);
        $first_p = trim($paragraphs[0] ?? '');
        $first_p_words = $this->count_words($first_p);

        $has_direct_answer = false;
        if ($first_p_words >= 30 && $first_p_words <= 75) {
            $has_direct_answer = true;
            $score += 25;
            $checklist[] = ['label' => 'پاراگراف پاسخ مستقیم (Direct Answer Snippet) در ابتدای متن شناسایی شد (' . $first_p_words . ' کلمه)', 'status' => 'pass'];
        } elseif ($first_p_words > 75) {
            $score += 15;
            $checklist[] = ['label' => 'پاراگراف آغازین کمی طولانی است (' . $first_p_words . ' کلمه)؛ خلاصه‌تر شدن به اسنیپت پاسخ مستقیم کمک می‌کند', 'status' => 'warning'];
            $recommendations[] = 'یک پاسخ شفاف و کوتاه بین ۴۰ تا ۶۰ کلمه دقیقاً در پاراگراف اول بنویسید تا به عنوان پاسخ صوتی و اسنیپت استخراج شود.';
        } else {
            $checklist[] = ['label' => 'پاسخ صریح و خلاصه به سوال اصلی کاربر در مقدمه وجود ندارد', 'status' => 'fail'];
            $recommendations[] = 'مقدمه را با تعریف صریح و پاسخ قطعی (Direct Answer) شروع کنید.';
        }

        // ۲. تیترهای مبتنی بر سوال (Question-based Headings) (۲۵ امتیاز)
        preg_match_all('/<h[2-4][^>]*>(.*?)<\/h[2-4]>/is', $content, $heading_matches);
        $question_headings = 0;
        $q_keywords = ['چیست', 'چگونه', 'چطور', 'چرا', 'کدام', 'آیا', 'کیست', 'علت', 'راهنمای', 'مراحل', 'نحوه', 'روش', 'how', 'what', 'why', 'is'];

        foreach ($heading_matches[1] ?? [] as $h_text) {
            $h_clean = strip_tags($h_text);
            foreach ($q_keywords as $q) {
                if (mb_stripos($h_clean, $q, 0, 'UTF-8') !== false || mb_strpos($h_clean, '؟') !== false || mb_strpos($h_clean, '?') !== false) {
                    $question_headings++;
                    break;
                }
            }
        }

        if ($question_headings >= 2) {
            $score += 25;
            $checklist[] = ['label' => 'تیترهای سؤالی برای سرچ صوتی و AEO عالی هستند (' . $question_headings . ' تیتر سؤالی)', 'status' => 'pass'];
        } elseif ($question_headings === 1) {
            $score += 15;
            $checklist[] = ['label' => 'فقط یک تیتر سؤالی در متن یافت شد (پیشنهاد: ۲ یا بیشتر)', 'status' => 'warning'];
            $recommendations[] = 'حداقل دو تیتر H2 یا H3 را به‌صورت سؤال‌های رایج کاربران (مثلاً: ... چیست؟ چگونه ... کنیم؟) مطرح کنید.';
        } else {
            $checklist[] = ['label' => 'هیچ تیتر سؤالی (چیست، چگونه، چرا...) شناسایی نشد', 'status' => 'fail'];
            $recommendations[] = 'تیترهایی در قالب سؤال‌های پرتکرار کاربران طراحی کنید تا موتورهای هوش مصنوعی سریعاً پاسخ را مپ کنند.';
        }

        // ۳. وجود لیست‌های نقطه‌ای یا مرحله‌ای (۲۵ امتیاز)
        preg_match_all('/<(ul|ol)[^>]*>(.*?)<\/(ul|ol)>/is', $content, $list_matches);
        $list_count = count($list_matches[0] ?? []);

        if ($list_count >= 1) {
            $score += 25;
            $checklist[] = ['label' => 'لیست‌های مرحله‌ای یا گلوله‌ای در متن شناسایی شدند (' . $list_count . ' لیست)', 'status' => 'pass'];
        } else {
            $checklist[] = ['label' => 'هیچ لیست مرحله‌ای یا گلوله‌ای در متن نیست', 'status' => 'fail'];
            $recommendations[] = 'مراحل اجرای کار یا نکات مهم را در قالب بالت پوینت یا لیست عددی مرتب کنید.';
        }

        // ۴. بخش سوالات متداول (FAQ Section) (۲۵ امتیاز)
        $has_faq = false;
        if (
            mb_stripos($content, 'faq', 0, 'UTF-8') !== false ||
            mb_stripos($content, 'سوالات متداول', 0, 'UTF-8') !== false ||
            mb_stripos($content, 'پرسش‌های متداول', 0, 'UTF-8') !== false ||
            preg_match('/<details/i', $content) ||
            preg_match('/"FAQPage"/i', $content)
        ) {
            $has_faq = true;
            $score += 25;
            $checklist[] = ['label' => 'بخش سوالات متداول (FAQ) در محتوا شناسایی شد', 'status' => 'pass'];
        } else {
            $checklist[] = ['label' => 'بخش سؤالات متداول (FAQ) برای درک هوش مصنوعی یافت نشد', 'status' => 'fail'];
            $recommendations[] = 'یک بخش سوالات متداول با ۳ تا ۴ سوال کلیدی و پاسخ‌های مختصر به انتهای مقاله اضافه کنید.';
        }

        return [
            'score'           => min(100, $score),
            'checklist'       => $checklist,
            'recommendations' => $recommendations,
            'metrics'         => [
                'has_direct_answer'  => $has_direct_answer,
                'first_p_words'      => $first_p_words,
                'question_headings'  => $question_headings,
                'list_count'         => $list_count,
                'has_faq'            => $has_faq,
            ],
        ];
    }

    /**
     * تحلیل بهینه‌سازی موتورهای هوش مصنوعی مولد (GEO) - مجموع ۱۰۰ امتیاز (۴ شاخص ۲۵ امتیازی)
     * مخصوص ChatGPT, Gemini, Claude, Copilot برای استناد (Citation) و درک عمیق
     */
    private function analyze_geo(\WP_Post $post, string $content, string $title): array {
        $checklist = [];
        $recommendations = [];
        $score = 0;

        $clean_text = trim(wp_strip_all_tags($content));

        // ۱. خلاصه اجرایی و نکات کلیدی (Key Takeaways / TL;DR) (۲۵ امتیاز)
        $has_takeaways = false;
        if (
            mb_stripos($content, 'نکات کلیدی', 0, 'UTF-8') !== false ||
            mb_stripos($content, 'در یک نگاه', 0, 'UTF-8') !== false ||
            mb_stripos($content, 'خلاصه اجرایی', 0, 'UTF-8') !== false ||
            mb_stripos($content, 'takeaway', 0, 'UTF-8') !== false ||
            mb_stripos($content, 'tldr', 0, 'UTF-8') !== false
        ) {
            $has_takeaways = true;
            $score += 25;
            $checklist[] = ['label' => 'باکس نکات کلیدی (Key Takeaways / TL;DR) برای استناد سریع مدل‌ها وجود دارد', 'status' => 'pass'];
        } else {
            $checklist[] = ['label' => 'باکس نکات کلیدی یا خلاصه اجرایی برای استناد سریع AI وجود ندارد', 'status' => 'fail'];
            $recommendations[] = 'یک کادر ۳ تا ۵ خطی "نکات کلیدی" در بالای مقاله قرار دهید تا مدل‌های LLM مستقیماً آن را منبع ارجاع خود قرار دهند.';
        }

        // ۲. چگالی آماری، فکت‌های عددی و مقایسه‌های کمی (۲۵ امتیاز)
        // شناسایی ارقام انگلیسی، فارسی و عربی به همراه واحدهای سنجش، درصدها و عبارات مقایسه‌ای
        $digit_pattern = '[\d\x{06F0}-\x{06F9}\x{0660}-\x{0669}]';
        $units = 'درصد|%|هزار|میلیون|میلیارد|برابر|ثانیه|دقیقه|ساعت|روز|ماه|سال|مگابایت|گیگابایت|کیلوبایت|ms|mb|gb|kb|x|مرتبه|بار|مورد|ابزار|کلمه|کاربر';

        preg_match_all('/(' . $digit_pattern . '+[\/\.]?' . $digit_pattern . '*)\s*(?:' . $units . ')/iu', $clean_text, $stat_matches);
        preg_match_all('/(?:13\d\d|14\d\d|20\d\d|[۱][۳۴][۰-۹][۰-۹]|[۲][۰][۰-۹][۰-۹])/u', $clean_text, $year_matches);
        preg_match_all('/(?:بیش از|بیشتر از|کمتر از|کاهش تا|افزایش تا|رشد|حدود|حداقل|حداکثر|تا)\s*(' . $digit_pattern . '+)/iu', $clean_text, $comp_matches);

        $stats_count = count($stat_matches[0] ?? []) + count($year_matches[0] ?? []) + count($comp_matches[0] ?? []);

        if ($stats_count >= 3) {
            $score += 25;
            $checklist[] = ['label' => 'چگالی فکت‌های عددی و آماری بالاست (' . $stats_count . ' ارجاع عددی و آماری)', 'status' => 'pass'];
        } elseif ($stats_count >= 1) {
            $score += 15;
            $checklist[] = ['label' => 'تعدادی ارجاع آماری و عددی یافت شد (' . $stats_count . ' مورد)', 'status' => 'warning'];
            $recommendations[] = 'آمار و ارقام مستند بیشتری اضافه کنید؛ مدل‌های هوش مصنوعی مقالات دارای فکت‌های آماری را بیشتر منبع‌دهی می‌کنند.';
        } else {
            $checklist[] = ['label' => 'داده آماری، درصد یا فکت عددی مشخصی در متن یافت نشد', 'status' => 'fail'];
            $recommendations[] = 'حداقل ۳ الی ۵ آمار، تاریخ یا فکت عددی معتبر در بدنه محتوا ذکر کنید.';
        }

        // ۳. ساختار نتیجه‌گیری شفاف (Definitive Conclusion) (۲۵ امتیاز)
        $has_conclusion = false;
        if (
            mb_stripos($content, 'نتیجه‌گیری', 0, 'UTF-8') !== false ||
            mb_stripos($content, 'جمع‌بندی', 0, 'UTF-8') !== false ||
            mb_stripos($content, 'کلام آخر', 0, 'UTF-8') !== false ||
            mb_stripos($content, 'پایان سخن', 0, 'UTF-8') !== false ||
            mb_stripos($content, 'conclusion', 0, 'UTF-8') !== false
        ) {
            $has_conclusion = true;
            $score += 25;
            $checklist[] = ['label' => 'بخش جمع‌بندی و نتیجه‌گیری نهایی در مقاله مشخص است', 'status' => 'pass'];
        } else {
            $checklist[] = ['label' => 'تیتر و بخش جمع‌بندی شفاف (Conclusion) وجود ندارد', 'status' => 'fail'];
            $recommendations[] = 'یک بخش نتیجه‌گیری تحت عنوان "جمع‌بندی" یا "کلام آخر" برای تثبیت پیام مقاله ایجاد نمایید.';
        }

        // ۴. لحن تخصصی، نقل‌قول و اعتبار مؤلف (Quotations & Entities) (۲۵ امتیاز)
        preg_match_all('/<blockquote[^>]*>(.*?)<\/blockquote>/is', $content, $quote_matches);
        preg_match_all('/(«[^»]+»|"[^"]+")/u', $clean_text, $fa_quote_matches);
        $quotes_count = count($quote_matches[0] ?? []) + count($fa_quote_matches[0] ?? []);

        if ($quotes_count >= 1 || mb_stripos($clean_text, 'به گفته', 0, 'UTF-8') !== false || mb_stripos($clean_text, 'طبق گزارش', 0, 'UTF-8') !== false) {
            $score += 25;
            $checklist[] = ['label' => 'ارجاع به نقل‌قول متخصصین، سازمان‌ها یا گزارش‌های معتبر شناسایی شد', 'status' => 'pass'];
        } else {
            $score += 10;
            $checklist[] = ['label' => 'نقل‌قول مستقیم یا ارجاع به متخصص در متن دیده نشد', 'status' => 'warning'];
            $recommendations[] = 'از عباراتی مثل "طبق گزارش..." یا نقل‌قول معتبر استفاده کنید تا اعتبار محتوا نزد هوش مصنوعی دوچندان شود.';
        }

        return [
            'score'           => min(100, $score),
            'checklist'       => $checklist,
            'recommendations' => $recommendations,
            'metrics'         => [
                'has_takeaways'  => $has_takeaways,
                'stats_count'    => $stats_count,
                'has_conclusion' => $has_conclusion,
                'quotes_count'   => $quotes_count,
            ],
        ];
    }

    /**
     * ارزیابی خوانایی، روانی و ساختار نگارش محتوا (Readability Analysis) - مجموع ۱۰۰ امتیاز
     */
    private function analyze_readability(\WP_Post $post, string $content, string $title): array {
        $checklist = [];
        $recommendations = [];
        $score = 0;

        // حذف جداول، بلوک‌های کد و کامنت‌ها جهت بررسی دقیق نثر و جملات (جلوگیری از ترکیب خانه‌های جدول)
        $prose_content = preg_replace('/<table[^>]*>[\s\S]*?<\/table>/iu', ' ', $content);
        $prose_content = preg_replace('/<pre[^>]*>[\s\S]*?<\/pre>/iu', ' ', $prose_content);
        $prose_content = preg_replace('/<code[^>]*>[\s\S]*?<\/code>/iu', ' ', $prose_content);
        $prose_content = preg_replace('/<!--\s*wp:table[\s\S]*?\/wp:table\s*-->/iu', ' ', $prose_content);
        $clean_text = wp_strip_all_tags($prose_content);
        $word_count = $this->count_words($content);

        if ($word_count === 0) {
            return [
                'score'           => 0,
                'checklist'       => [['label' => 'محتوایی برای تحلیل خوانایی وجود ندارد', 'status' => 'fail']],
                'recommendations' => ['شروع به نوشتن متن مقاله نمایید.'],
                'metrics'         => [],
            ];
        }

        // ۱. تحلیل طول جملات (Sentence Length) - ۲۵ امتیاز
        $sentences = preg_split('/[.!?؟\n]+/u', $clean_text, -1, PREG_SPLIT_NO_EMPTY);
        $sentence_count = max(1, count($sentences));
        $long_sentences = 0;
        $total_sentence_words = 0;

        foreach ($sentences as $s) {
            $sw = $this->count_words($s);
            $total_sentence_words += $sw;
            if ($sw > 25) {
                $long_sentences++;
            }
        }

        $avg_sentence_len = round($total_sentence_words / $sentence_count, 1);
        $long_sentence_pct = round(($long_sentences / $sentence_count) * 100);

        if ($long_sentence_pct <= 20) {
            $score += 25;
            $checklist[] = ['label' => "طول جملات استاندارد و روان است (میانگین {$avg_sentence_len} کلمه بر جمله)", 'status' => 'pass'];
        } elseif ($long_sentence_pct <= 35) {
            $score += 15;
            $checklist[] = ['label' => "تعدادی از جملات طولانی هستند ({$long_sentence_pct}٪ جملات بیش از ۲۵ کلمه دارند)", 'status' => 'warning'];
            $recommendations[] = "جملات طولانی را با نقطه و ویرگول به جملات کوتاه‌تر تقسیم کنید تا خواننده خسته نشود.";
        } else {
            $score += 5;
            $checklist[] = ['label' => "جملات بیش از حد طولانی و پیچیده هستند ({$long_sentence_pct}٪ جملات طولانی)", 'status' => 'fail'];
            $recommendations[] = "جملات طولانی و مرکب را به بخش‌های مجزا و کوتاه بشکنید.";
        }

        // ۲. طول پاراگراف‌ها (Paragraph Length) - ۲۵ امتیاز
        $paragraphs = preg_split('/<\/p>|\n{2,}/iu', $content, -1, PREG_SPLIT_NO_EMPTY);
        $para_count = max(1, count($paragraphs));
        $long_paragraphs = 0;

        foreach ($paragraphs as $p) {
            $pw = $this->count_words(wp_strip_all_tags($p));
            if ($pw > 140) {
                $long_paragraphs++;
            }
        }

        if ($long_paragraphs === 0) {
            $score += 25;
            $checklist[] = ['label' => "پاراگراف‌بندی عالی است (تمام پاراگراف‌ها زیر ۱۴۰ کلمه و خوش‌خوان)", 'status' => 'pass'];
        } elseif ($long_paragraphs <= 2) {
            $score += 15;
            $checklist[] = ['label' => "{$long_paragraphs} پاراگراف طولانی شناسایی شد (بیش از ۱۴۰ کلمه)", 'status' => 'warning'];
            $recommendations[] = "پاراگراف‌های خیلی بلند را به دو یا سه پاراگراف کوتاه‌تر با موضوع مستقل تفکیک کنید.";
        } else {
            $score += 5;
            $checklist[] = ['label' => "تعداد زیادی از پاراگراف‌ها بیش از حد طولانی و سنگین هستند", 'status' => 'fail'];
            $recommendations[] = "متن را با استفاده از پاراگراف‌های ۳ تا ۴ خطی برای تنفس بصری کاربر خرد کنید.";
        }

        // ۳. کلمات ربط و انتقال (Transition Words در فارسی) - ۲۵ امتیاز
        $transitions = [
            'بنابراین', 'در نتیجه', 'به همین دلیل', 'از این رو', 'همچنین', 'هم‌چنین', 'علاوه بر این', 'علاوه‌براین',
            'با این حال', 'اگرچه', 'به عنوان مثال', 'به‌عنوان مثال', 'برای نمونه', 'در نهایت', 'از سوی دیگر',
            'به طور خلاصه', 'به‌طور خلاصه', 'به عبارت دیگر', 'به‌عبارت دیگر', 'نخست', 'سپس', 'در واقع', 'بدین ترتیب',
            'به هر حال', 'به‌هرحال', 'با وجود این', 'به علاوه', 'به‌علاوه', 'از طرفی', 'در این میان', 'البته',
            'اما', 'چرا که', 'زیرا', 'چون', 'بلکه', 'گرچه', 'هرچند', 'در عین حال', 'درعین‌حال', 'به ویژه', 'به‌ویژه',
            'however', 'therefore', 'furthermore', 'moreover', 'in addition', 'for example',
            'as a result', 'finally', 'consequently', 'on the other hand'
        ];

        $matched_transitions = 0;
        $transition_issues = [];
        $long_sentence_issues = [];

        foreach ($sentences as $s) {
            $s_clean = mb_strtolower(trim($s), 'UTF-8');
            $sw = $this->count_words($s);

            if ($sw > 25 && count($long_sentence_issues) < 3) {
                $long_sentence_issues[] = trim($s);
            }

            $has_t = false;
            foreach ($transitions as $t) {
                if (mb_stripos($s_clean, $t) !== false) {
                    $has_t = true;
                    break;
                }
            }
            if ($has_t) {
                $matched_transitions++;
            } else {
                if ($sw >= 6 && mb_strlen(trim($s)) >= 25 && count($transition_issues) < 5) {
                    $transition_issues[] = trim($s);
                }
            }
        }

        $transition_pct = round(($matched_transitions / $sentence_count) * 100);

        if ($transition_pct >= 20) {
            $score += 25;
            $checklist[] = ['label' => "به‌کارگیری کلمات انتقالی و ربط عالی است ({$transition_pct}٪ جملات دارای پیوند مفهومی هستند)", 'status' => 'pass'];
        } elseif ($transition_pct >= 10) {
            $score += 15;
            $checklist[] = ['label' => "استفاده از کلمات انتقالی و پیوند متوسط است ({$transition_pct}٪ جملات)", 'status' => 'warning'];
            $recommendations[] = "از کلمات ربط مانند «بنابراین»، «همچنین»، «به عنوان مثال» و «در نتیجه» برای اتصال بهتر جملات استفاده کنید.";
        } else {
            $score += 5;
            $checklist[] = ['label' => "کلمات ربط و انتقال به ندرت در متن به کار رفته‌اند ({$transition_pct}٪)", 'status' => 'fail'];
            $recommendations[] = "برای روان‌تر شدن متن، پیوستگی جملات را با افزودن عبارات پیونددهنده افزایش دهید.";
        }

        // ۴. توزیع زیرعنوان‌ها و سرفصل‌ها (Subheading Distribution) - ۲۵ امتیاز
        preg_match_all('/<h[2-4][^>]*>(.*?)<\/h[2-4]>/iu', $content, $heading_matches);
        $heading_count = count($heading_matches[0] ?? []);

        if ($word_count <= 250) {
            $score += 25;
            $checklist[] = ['label' => 'طول متن کوتاه است و نیازی به زیرعنوان‌های بیشتر ندارد', 'status' => 'pass'];
        } else {
            $words_per_heading = round($word_count / max(1, $heading_count));
            if ($words_per_heading <= 320 && $heading_count >= 2) {
                $score += 25;
                $checklist[] = ['label' => "توزیع سرفصل‌ها بسیار منظم است (به‌طور میانگین هر {$words_per_heading} کلمه یک زیرعنوان)", 'status' => 'pass'];
            } elseif ($heading_count >= 1) {
                $score += 15;
                $checklist[] = ['label' => "فاصله بین زیرعنوان‌ها زیاد است (هر {$words_per_heading} کلمه یک تیتر)", 'status' => 'warning'];
                $recommendations[] = "سرفصل‌های H2 و H3 بیشتری برای بخش‌بندی و اسکن راحت‌تر متن اضافه کنید.";
            } else {
                $score += 0;
                $checklist[] = ['label' => 'هیچ زیرعنوانی برای هدایت چشم خواننده در متن وجود ندارد', 'status' => 'fail'];
                $recommendations[] = "حتماً حداقل ۲ الی ۳ تیتر H2 در فواصل منظم ۳۰۰ کلمه‌ای قرار دهید.";
            }
        }

        return [
            'score'           => min(100, $score),
            'checklist'       => $checklist,
            'recommendations' => $recommendations,
            'issues'          => [
                'transition_sentences' => $transition_issues,
                'long_sentences'       => $long_sentence_issues,
            ],
            'metrics'         => [
                'sentence_count'     => $sentence_count,
                'avg_sentence_len'   => $avg_sentence_len,
                'long_sentence_pct'  => $long_sentence_pct,
                'para_count'         => $para_count,
                'long_paragraphs'    => $long_paragraphs,
                'transition_pct'     => $transition_pct,
                'heading_count'      => $heading_count,
            ],
        ];
    }

    public function render_ranking_cell_html(int $post_id, array $ratings): string {
        $seo_score = (int) ($ratings['seo']['score'] ?? 0);
        $aeo_score = (int) ($ratings['aeo']['score'] ?? 0);
        $geo_score = (int) ($ratings['geo']['score'] ?? 0);
        $read_score = (int) ($ratings['readability']['score'] ?? 0);
        $avg_score = (int) ($ratings['avg_score'] ?? 0);

        $seo_class = $this->get_badge_class($seo_score);
        $aeo_class = $this->get_badge_class($aeo_score);
        $geo_class = $this->get_badge_class($geo_score);
        $read_class = $this->get_badge_class($read_score);
        $avg_class = $this->get_badge_class($avg_score);

        ob_start();
        ?>
        <div class="omni-rating-cell" data-post-id="<?php echo esc_attr($post_id); ?>">
            <div class="omni-badges-row">
                <span class="omni-score-badge <?php echo esc_attr($seo_class); ?>" title="سئو کلاسیک: <?php echo esc_attr($seo_score); ?> از ۱۰۰">
                    <span class="omni-badge-score"><?php echo esc_html($seo_score); ?></span>
                    <span class="omni-badge-label">SEO</span>
                </span>
                <span class="omni-score-badge <?php echo esc_attr($aeo_class); ?>" title="موتور پاسخگو AEO: <?php echo esc_attr($aeo_score); ?> از ۱۰۰">
                    <span class="omni-badge-score"><?php echo esc_html($aeo_score); ?></span>
                    <span class="omni-badge-label">AEO</span>
                </span>
                <span class="omni-score-badge <?php echo esc_attr($geo_class); ?>" title="موتور هوش مصنوعی GEO: <?php echo esc_attr($geo_score); ?> از ۱۰۰">
                    <span class="omni-badge-score"><?php echo esc_html($geo_score); ?></span>
                    <span class="omni-badge-label">GEO</span>
                </span>
                <span class="omni-score-badge <?php echo esc_attr($read_class); ?>" title="خوانایی و روانی متن: <?php echo esc_attr($read_score); ?> از ۱۰۰">
                    <span class="omni-badge-score"><?php echo esc_html($read_score); ?></span>
                    <span class="omni-badge-label">READ</span>
                </span>
            </div>

            <div class="omni-cell-footer">
                <div class="omni-avg-summary" title="میانگین رتبه سه شاخص">
                    <span class="omni-avg-dot <?php echo esc_attr($avg_class); ?>"></span>
                    <span class="omni-avg-label">میانگین:</span>
                    <span class="omni-avg-val"><?php echo esc_html($avg_score); ?>%</span>
                </div>
                <div class="omni-cell-actions">
                    <button type="button" class="button button-small omni-open-details-btn" data-post-id="<?php echo esc_attr($post_id); ?>" title="مشاهده چک‌لیست و بهینه‌سازی هوشمند">
                        <span class="dashicons dashicons-analytics"></span>
                        <span>تحلیل</span>
                    </button>
                    <button type="button" class="button button-small omni-recalc-btn" data-post-id="<?php echo esc_attr($post_id); ?>" title="تحلیل مجدد محتوا">
                        <span class="dashicons dashicons-update"></span>
                    </button>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    private function get_badge_class(int $score): string {
        if ($score >= 80) {
            return 'omni-badge-good';
        }
        if ($score >= 50) {
            return 'omni-badge-warning';
        }
        return 'omni-badge-danger';
    }

    public function render_full_dashboard_html(int $post_id, array $ratings): string {
        $seo         = $ratings['seo'] ?? ['score' => 0, 'checklist' => [], 'recommendations' => []];
        $aeo         = $ratings['aeo'] ?? ['score' => 0, 'checklist' => [], 'recommendations' => []];
        $geo         = $ratings['geo'] ?? ['score' => 0, 'checklist' => [], 'recommendations' => []];
        $readability = $ratings['readability'] ?? ['score' => 0, 'checklist' => [], 'recommendations' => []];
        $avg         = (int) ($ratings['avg_score'] ?? 0);

        $post = get_post($post_id);
        $focus_kw = (string) get_post_meta($post_id, '_omni_ai_focus_keyword', true);
        if (empty($focus_kw)) $focus_kw = (string) get_post_meta($post_id, 'rank_math_focus_keyword', true);
        if (empty($focus_kw)) $focus_kw = (string) get_post_meta($post_id, '_yoast_wpseo_focuskw', true);

        $seo_title = (string) get_post_meta($post_id, '_omni_ai_seo_title', true);
        if (empty($seo_title)) $seo_title = (string) get_post_meta($post_id, 'rank_math_title', true);
        if (empty($seo_title)) $seo_title = (string) get_post_meta($post_id, '_yoast_wpseo_title', true);
        if (empty($seo_title) && $post) $seo_title = $post->post_title;

        $meta_desc = (string) get_post_meta($post_id, '_omni_ai_meta_description', true);
        if (empty($meta_desc)) $meta_desc = (string) get_post_meta($post_id, 'rank_math_description', true);
        if (empty($meta_desc)) $meta_desc = (string) get_post_meta($post_id, '_yoast_wpseo_metadesc', true);

        $canonical = (string) get_post_meta($post_id, '_omni_ai_canonical_url', true);
        if (empty($canonical)) $canonical = (string) get_post_meta($post_id, 'rank_math_canonical_url', true);

        $noindex  = get_post_meta($post_id, '_omni_ai_noindex', true) === '1';
        $nofollow = get_post_meta($post_id, '_omni_ai_nofollow', true) === '1';

        $og_title = (string) get_post_meta($post_id, '_omni_ai_og_title', true);
        if (empty($og_title)) $og_title = (string) get_post_meta($post_id, 'rank_math_facebook_title', true);
        if (empty($og_title)) $og_title = $seo_title;

        $og_desc = (string) get_post_meta($post_id, '_omni_ai_og_description', true);
        if (empty($og_desc)) $og_desc = (string) get_post_meta($post_id, 'rank_math_facebook_description', true);
        if (empty($og_desc)) $og_desc = $meta_desc;

        $og_image = (string) get_post_meta($post_id, '_omni_ai_og_image', true);
        if (empty($og_image)) $og_image = (string) get_post_meta($post_id, 'rank_math_facebook_image', true);
        if (empty($og_image) && has_post_thumbnail($post_id)) {
            $og_image = (string) get_the_post_thumbnail_url($post_id, 'large');
        }

        $twitter_title = (string) get_post_meta($post_id, '_omni_ai_twitter_title', true);
        if (empty($twitter_title)) $twitter_title = (string) get_post_meta($post_id, 'rank_math_twitter_title', true);
        if (empty($twitter_title)) $twitter_title = $og_title;

        $twitter_desc = (string) get_post_meta($post_id, '_omni_ai_twitter_description', true);
        if (empty($twitter_desc)) $twitter_desc = (string) get_post_meta($post_id, 'rank_math_twitter_description', true);
        if (empty($twitter_desc)) $twitter_desc = $og_desc;

        $twitter_image = (string) get_post_meta($post_id, '_omni_ai_twitter_image', true);
        if (empty($twitter_image)) $twitter_image = (string) get_post_meta($post_id, 'rank_math_twitter_image', true);
        if (empty($twitter_image)) $twitter_image = $og_image;

        $schema_type   = (string) get_post_meta($post_id, '_omni_ai_schema_type', true);
        if (empty($schema_type)) {
            $schema_type = ($post && $post->post_type === 'product') ? 'product' : 'article';
        }
        $review_item   = (string) get_post_meta($post_id, '_omni_ai_review_item', true) ?: ($post ? $post->post_title : '');
        $review_rating = (float) (get_post_meta($post_id, '_omni_ai_review_rating', true) ?: 5.0);
        $howto_raw     = get_post_meta($post_id, '_omni_ai_howto_data', true);
        $howto_data    = is_array($howto_raw) ? $howto_raw : (json_decode((string) $howto_raw, true) ?: []);
        $howto_name    = !empty($howto_data['name']) ? $howto_data['name'] : ($post ? $post->post_title : '');
        $howto_time    = !empty($howto_data['total_time']) ? $howto_data['total_time'] : '15 دقیقه';

        $site_name = get_bloginfo('name');
        $permalink = $post ? get_permalink($post_id) : home_url();

        ob_start();
        ?>
        <div class="omni-dashboard-wrap">
            <!-- بنر هوشمند اصلاح خودکار با AI -->
            <div class="omni-ai-optimizer-banner">
                <div class="omni-opt-banner-main">
                    <div class="omni-opt-icon">
                        <span class="dashicons dashicons-yes-alt"></span>
                    </div>
                    <div class="omni-opt-texts">
                        <strong>رفع خودکار نواقص با هوش مصنوعی</strong>
                        <span class="omni-opt-sub">رفع خودکار چک‌لیست‌های ناقص AEO، نکات کلیدی و آمارهای GEO</span>
                    </div>
                </div>
                <div class="omni-opt-banner-btn-wrap">
                    <button type="button" class="button button-primary omni-btn-ai-optimize" data-post-id="<?php echo esc_attr($post_id); ?>">
                        <span class="dashicons dashicons-admin-generic"></span>
                        <span>تولید و رفع خودکار با AI</span>
                    </button>
                </div>
            </div>

            <!-- پیش‌نمایش پیشنهادات تولید شده توسط AI -->
            <div class="omni-ai-suggestions-preview" id="omni-ai-preview-<?php echo esc_attr($post_id); ?>" style="display:none;"></div>

            <!-- کارت‌های امتیاز ۴ گانه -->
            <div class="omni-score-cards-row">
                <div class="omni-score-card">
                    <div class="omni-card-header">
                        <?php
                        $seo_score = (int) ($seo['score'] ?? 0);
                        $seo_bg = ($seo_score >= 80) ? '#16a34a' : (($seo_score >= 50) ? '#d97706' : '#dc2626');
                        ?>
                        <div class="omni-card-dial <?php echo esc_attr($this->get_badge_class($seo_score)); ?>" style="background-color: <?php echo esc_attr($seo_bg); ?> !important; color: #ffffff !important;">
                            <?php echo esc_html($seo_score); ?>
                        </div>
                        <span class="omni-card-tag seo">SEO ارگانیک</span>
                    </div>
                    <div class="omni-card-desc">کلمه کلیدی، عنوان و توضیحات متا، هدینگ‌ها و پیوندها</div>
                </div>

                <div class="omni-score-card">
                    <div class="omni-card-header">
                        <?php
                        $aeo_score = (int) ($aeo['score'] ?? 0);
                        $aeo_bg = ($aeo_score >= 80) ? '#16a34a' : (($aeo_score >= 50) ? '#d97706' : '#dc2626');
                        ?>
                        <div class="omni-card-dial <?php echo esc_attr($this->get_badge_class($aeo_score)); ?>" style="background-color: <?php echo esc_attr($aeo_bg); ?> !important; color: #ffffff !important;">
                            <?php echo esc_html($aeo_score); ?>
                        </div>
                        <span class="omni-card-tag aeo">موتور پاسخگو AEO</span>
                    </div>
                    <div class="omni-card-desc">پاسخ صریح و اسنیپت برای Google AI Overviews و Perplexity</div>
                </div>

                <div class="omni-score-card">
                    <div class="omni-card-header">
                        <?php
                        $geo_score = (int) ($geo['score'] ?? 0);
                        $geo_bg = ($geo_score >= 80) ? '#16a34a' : (($geo_score >= 50) ? '#d97706' : '#dc2626');
                        ?>
                        <div class="omni-card-dial <?php echo esc_attr($this->get_badge_class($geo_score)); ?>" style="background-color: <?php echo esc_attr($geo_bg); ?> !important; color: #ffffff !important;">
                            <?php echo esc_html($geo_score); ?>
                        </div>
                        <span class="omni-card-tag geo">موتورهای هوش مصنوعی GEO</span>
                    </div>
                    <div class="omni-card-desc">نکات کلیدی، آمار و استنادپذیری توسط ChatGPT، Claude و Gemini</div>
                </div>

                <div class="omni-score-card">
                    <div class="omni-card-header">
                        <?php
                        $read_score = (int) ($readability['score'] ?? 0);
                        $read_bg = ($read_score >= 80) ? '#16a34a' : (($read_score >= 50) ? '#d97706' : '#dc2626');
                        ?>
                        <div class="omni-card-dial <?php echo esc_attr($this->get_badge_class($read_score)); ?>" style="background-color: <?php echo esc_attr($read_bg); ?> !important; color: #ffffff !important;">
                            <?php echo esc_html($read_score); ?>
                        </div>
                        <span class="omni-card-tag readability" style="background:#e0e7ff; color:#3730a3;">روانی و خوانایی</span>
                    </div>
                    <div class="omni-card-desc">طول جملات و پاراگراف‌ها، کلمات ربط و ساختار سرفصل‌ها</div>
                </div>

                <div class="omni-score-card omni-score-card-total">
                    <div class="omni-card-header">
                        <?php
                        $avg_bg = ($avg >= 80) ? '#16a34a' : (($avg >= 50) ? '#d97706' : '#dc2626');
                        ?>
                        <div class="omni-card-dial <?php echo esc_attr($this->get_badge_class($avg)); ?>" style="background-color: <?php echo esc_attr($avg_bg); ?> !important; color: #ffffff !important;">
                            <?php echo esc_html($avg); ?>%
                        </div>
                        <span class="omni-card-tag total">میانگین کل</span>
                    </div>
                    <div class="omni-card-desc">شاخص ترکیبی آمادگی محتوا در موتورهای مدرن وب</div>
                </div>
            </div>

            <!-- تب‌های جزئیات -->
            <div class="omni-details-tabs-wrap">
                <div class="omni-tabs-nav">
                    <button type="button" class="omni-tab-btn active" data-tab="tab-snippet">
                        <span class="dashicons dashicons-google"></span> اسنیپت گوگل و کلمه کلیدی
                    </button>
                    <button type="button" class="omni-tab-btn" data-tab="tab-social">
                        <span class="dashicons dashicons-share"></span> شبکه‌های اجتماعی (Social)
                    </button>
                    <button type="button" class="omni-tab-btn" data-tab="tab-seo">
                        <span class="dashicons dashicons-search"></span> چک‌لیست سئو ارگانیک
                    </button>
                    <button type="button" class="omni-tab-btn" data-tab="tab-aeo">
                        <span class="dashicons dashicons-format-chat"></span> چک‌لیست AEO (موتورهای پاسخگو)
                    </button>
                    <button type="button" class="omni-tab-btn" data-tab="tab-geo">
                        <span class="dashicons dashicons-rest-api"></span> چک‌لیست GEO (مدل‌های هوش مصنوعی)
                    </button>
                    <button type="button" class="omni-tab-btn" data-tab="tab-readability">
                        <span class="dashicons dashicons-editor-alignleft"></span> چک‌لیست خوانایی (Readability)
                    </button>
                    <button type="button" class="omni-tab-btn" data-tab="tab-advanced">
                        <span class="dashicons dashicons-admin-generic"></span> پیشرفته و روبات‌ها
                    </button>
                    <button type="button" class="omni-tab-btn" data-tab="tab-schema">
                        <span class="dashicons dashicons-layout"></span> ساختار داده و اسکیما
                    </button>
                </div>

                <!-- تب ۱: اسنیپت گوگل و کلیدواژه کانونی (پیش‌فرض) -->
                <div class="omni-tab-pane active" id="tab-snippet">
                    <div class="omni-snippet-section">
                        <!-- دکمه‌های انتخاب دسکتاپ یا موبایل -->
                        <div class="omni-snippet-header-row">
                            <span class="omni-snippet-sec-title">پیش‌نمایش زنده در نتایج جستجوی گوگل (SERP)</span>
                            <div class="omni-preview-toggles">
                                <button type="button" class="omni-preview-toggle active" data-device="desktop">
                                    <span class="dashicons dashicons-desktop"></span> دسکتاپ
                                </button>
                                <button type="button" class="omni-preview-toggle" data-device="mobile">
                                    <span class="dashicons dashicons-smartphone"></span> موبایل
                                </button>
                            </div>
                        </div>

                        <!-- جعبه پیش‌نمایش واقعی گوگل -->
                        <div class="omni-serp-preview-box desktop" id="omni-serp-preview-box-<?php echo esc_attr($post_id); ?>">
                            <div class="omni-serp-header">
                                <div class="omni-serp-favicon">⚡</div>
                                <div class="omni-serp-site-info">
                                    <span class="omni-serp-site-name"><?php echo esc_html($site_name); ?></span>
                                    <span class="omni-serp-url" id="omni-serp-url-<?php echo esc_attr($post_id); ?>"><?php echo esc_html($permalink); ?></span>
                                </div>
                            </div>
                            <div class="omni-serp-title" id="omni-serp-title-<?php echo esc_attr($post_id); ?>">
                                <?php echo esc_html($seo_title ?: ($post ? $post->post_title : 'عنوان سئو نوشته')); ?>
                            </div>
                            <div class="omni-serp-snippet" id="omni-serp-desc-<?php echo esc_attr($post_id); ?>">
                                <?php echo esc_html($meta_desc ?: 'توضیحات متای این نوشته در این قسمت نمایش داده خواهد شد تا بتوانید پیش از انتشار، ظاهر آن در گوگل را مشاهده کنید.'); ?>
                            </div>
                        </div>

                        <!-- فیلدهای ویرایش اسنیپت -->
                        <div class="omni-seo-form-card">
                            <div class="omni-form-row">
                                <label for="omni_ai_focus_keyword_<?php echo esc_attr($post_id); ?>">
                                    <strong>کلیدواژه کانونی (Focus Keyword)</strong>
                                </label>
                                <div class="omni-input-wrap">
                                    <input type="text" 
                                           id="omni_ai_focus_keyword_<?php echo esc_attr($post_id); ?>" 
                                           name="omni_ai_focus_keyword" 
                                           class="omni-seo-input omni-field-focus-kw" 
                                           value="<?php echo esc_attr($focus_kw); ?>" 
                                           placeholder="مثال: آموزش وردپرس یا نکست‌جی‌اس" />
                                </div>
                                <p class="omni-field-hint">کلمه کلیدی اصلی که می‌خواهید مقاله در نتایج سرچ بر اساس آن سنجیده شود.</p>
                            </div>

                            <div class="omni-form-row">
                                <div class="omni-label-with-counter">
                                    <label for="omni_ai_seo_title_<?php echo esc_attr($post_id); ?>">
                                        <strong>عنوان سئو (SEO Title)</strong>
                                    </label>
                                    <span class="omni-char-meter-text" id="omni-title-count-<?php echo esc_attr($post_id); ?>">
                                        <span class="count-num"><?php echo mb_strlen($seo_title, 'UTF-8'); ?></span> / ۶۰ کاراکتر
                                    </span>
                                </div>
                                <div class="omni-input-wrap">
                                    <input type="text" 
                                           id="omni_ai_seo_title_<?php echo esc_attr($post_id); ?>" 
                                           name="omni_ai_seo_title" 
                                           class="omni-seo-input omni-field-seo-title" 
                                           value="<?php echo esc_attr($seo_title); ?>" 
                                           placeholder="عنوان بهینه برای جلب کلیک در نتایج جستجو" />
                                </div>
                                <div class="omni-char-progress-bar">
                                    <div class="omni-char-progress-fill" id="omni-title-bar-<?php echo esc_attr($post_id); ?>"></div>
                                </div>
                            </div>

                            <div class="omni-form-row">
                                <div class="omni-label-with-counter">
                                    <label for="omni_ai_meta_description_<?php echo esc_attr($post_id); ?>">
                                        <strong>توضیحات متا (Meta Description)</strong>
                                    </label>
                                    <span class="omni-char-meter-text" id="omni-desc-count-<?php echo esc_attr($post_id); ?>">
                                        <span class="count-num"><?php echo mb_strlen($meta_desc, 'UTF-8'); ?></span> / ۱۶۰ کاراکتر
                                    </span>
                                </div>
                                <div class="omni-input-wrap">
                                    <textarea id="omni_ai_meta_description_<?php echo esc_attr($post_id); ?>" 
                                              name="omni_ai_meta_description" 
                                              rows="3" 
                                              class="omni-seo-textarea omni-field-meta-desc" 
                                              placeholder="توضیحاتی خلاصه، جذاب و ترغیب‌کننده برای کلیک در گوگل..."><?php echo esc_textarea($meta_desc); ?></textarea>
                                </div>
                                <div class="omni-char-progress-bar">
                                    <div class="omni-char-progress-fill" id="omni-desc-bar-<?php echo esc_attr($post_id); ?>"></div>
                                </div>
                            </div>

                            <div class="omni-seo-btn-actions">
                                <button type="button" class="button button-secondary omni-btn-generate-snippet" data-post-id="<?php echo esc_attr($post_id); ?>">
                                    <span class="dashicons dashicons-superhero"></span>
                                    <span>✨ تولید عنوان و متادیسکریپشن با AI</span>
                                </button>
                                <button type="button" class="button button-primary omni-btn-save-seo" data-post-id="<?php echo esc_attr($post_id); ?>">
                                    <span class="dashicons dashicons-saved"></span>
                                    <span>ذخیره و ارزیابی مجدد سئو</span>
                                </button>
                            </div>
                        </div>

                        <!-- ارزیابی تطابق کلیدواژه کانونی -->
                        <div class="omni-kw-audit-block">
                            <h4><span class="dashicons dashicons-yes-alt"></span> ارزیابی وضعیت کلیدواژه کانونی در صفحه:</h4>
                            <?php
                            $kw_items = array_filter($seo['checklist'] ?? [], function($item) {
                                return (strpos($item['label'], 'کلیدواژه') !== false || strpos($item['label'], 'کلمه کلیدی') !== false);
                            });
                            echo $this->render_checklist_items(!empty($kw_items) ? $kw_items : ($seo['checklist'] ?? []));
                            ?>
                        </div>
                    </div>
                </div>

                <!-- تب ۲: پیش‌نمایش و تنظیمات شبکه‌های اجتماعی (Open Graph & Twitter) -->
                <div class="omni-tab-pane" id="tab-social">
                    <div class="omni-social-section">
                        <div class="omni-snippet-header-row">
                            <span class="omni-snippet-sec-title">پیش‌نمایش اشتراک‌گذاری در شبکه‌های اجتماعی (تلگرام، واتساپ، فیس‌بوک و X)</span>
                            <button type="button" class="button button-secondary omni-btn-sync-social" data-post-id="<?php echo esc_attr($post_id); ?>">
                                <span class="dashicons dashicons-controls-repeat"></span> کپی خودکار از عنوان و متای سئو
                            </button>
                        </div>

                        <!-- کارت پیش‌نمایش شبکه‌های اجتماعی -->
                        <div class="omni-social-card-preview" id="omni-social-preview-<?php echo esc_attr($post_id); ?>" style="max-width: 520px; width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff; margin: 12px 0 20px 0; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
                            <div class="omni-social-card-img-wrap" style="width: 100%; max-width: 100%; height: 230px; max-height: 230px; overflow: hidden; background: #f1f5f9; position: relative;">
                                <?php if (!empty($og_image)) : ?>
                                    <img src="<?php echo esc_url($og_image); ?>" 
                                         alt="Social Preview" 
                                         class="omni-social-card-img" 
                                         id="omni-social-card-img-<?php echo esc_attr($post_id); ?>" 
                                         style="width: 100%; max-width: 100%; height: 230px; max-height: 230px; object-fit: cover; display: block; border: 0; margin: 0; padding: 0;" />
                                    <div class="omni-social-card-img-placeholder" style="display: none;">
                                        <span class="dashicons dashicons-format-image"></span>
                                        <span>پیش‌نمایش تصویر انتخابی برای شبکه‌های اجتماعی</span>
                                    </div>
                                <?php else : ?>
                                    <img src="" 
                                         alt="Social Preview" 
                                         class="omni-social-card-img" 
                                         id="omni-social-card-img-<?php echo esc_attr($post_id); ?>" 
                                         style="width: 100%; max-width: 100%; height: 230px; max-height: 230px; object-fit: cover; display: none; border: 0; margin: 0; padding: 0;" />
                                    <div class="omni-social-card-img-placeholder">
                                        <span class="dashicons dashicons-format-image"></span>
                                        <span>تصویری انتخاب نشده است (از تصویر شاخص نوشته استفاده خواهد شد)</span>
                                    </div>
                                <?php endif; ?>
                            </div>
                            <div class="omni-social-card-content">
                                <span class="omni-social-card-domain"><?php echo esc_html(wp_parse_url($permalink, PHP_URL_HOST) ?: 'zebracode.ir'); ?></span>
                                <div class="omni-social-card-title" id="omni-social-card-title-<?php echo esc_attr($post_id); ?>">
                                    <?php echo esc_html($og_title ?: ($seo_title ?: 'عنوان جذاب برای شبکه‌های اجتماعی')); ?>
                                </div>
                                <div class="omni-social-card-desc" id="omni-social-card-desc-<?php echo esc_attr($post_id); ?>">
                                    <?php echo esc_html($og_desc ?: ($meta_desc ?: 'خلاصه محتوای نوشته که در هنگام اشتراک لینک در شبکه‌های اجتماعی نمایش داده خواهد شد.')); ?>
                                </div>
                            </div>
                        </div>

                        <!-- فرم تنظیمات شبکه‌های اجتماعی -->
                        <div class="omni-seo-form-card" style="margin-top: 16px;">
                            <div class="omni-form-row">
                                <label for="omni_ai_og_title_<?php echo esc_attr($post_id); ?>">
                                    <strong>عنوان اشتراک‌گذاری (Social / Open Graph Title)</strong>
                                </label>
                                <input type="text" 
                                       id="omni_ai_og_title_<?php echo esc_attr($post_id); ?>" 
                                       name="omni_ai_og_title" 
                                       class="omni-seo-input omni-field-og-title" 
                                       value="<?php echo esc_attr($og_title); ?>" 
                                       placeholder="عنوانی جذاب که کاربران را به کلیک روی لینک در شبکه‌های اجتماعی ترغیب کند" />
                            </div>

                            <div class="omni-form-row">
                                <label for="omni_ai_og_description_<?php echo esc_attr($post_id); ?>">
                                    <strong>توضیحات اشتراک‌گذاری (Social / Open Graph Description)</strong>
                                </label>
                                <textarea id="omni_ai_og_description_<?php echo esc_attr($post_id); ?>" 
                                          name="omni_ai_og_description" 
                                          rows="3" 
                                          class="omni-seo-textarea omni-field-og-desc" 
                                          placeholder="توضیحات خلاصه برای جلب توجه مخاطبان در پیام‌رسان‌ها و فیدهای اجتماعی..."><?php echo esc_textarea($og_desc); ?></textarea>
                            </div>

                            <div class="omni-form-row omni-social-image-wrap">
                                <label for="omni_ai_og_image_<?php echo esc_attr($post_id); ?>">
                                    <strong>تصویر اختصاصی اشتراک‌گذاری (Social Share Image)</strong>
                                </label>
                                <div class="omni-image-picker-row">
                                    <input type="url" 
                                           id="omni_ai_og_image_<?php echo esc_attr($post_id); ?>" 
                                           name="omni_ai_og_image" 
                                           class="omni-seo-input omni-field-og-image omni-field-social-img" 
                                           value="<?php echo esc_attr($og_image); ?>" 
                                           placeholder="https://... یا انتخاب از کتابخانه رسانه" />
                                    <button type="button" class="button button-secondary omni-btn-upload-social-img" data-post-id="<?php echo esc_attr($post_id); ?>">
                                        <span class="dashicons dashicons-admin-media"></span> انتخاب از رسانه
                                    </button>
                                </div>
                                <p class="omni-field-hint">سایز پیشنهادی ۱۲۰۰ در ۶۳۰ پیکسل برای بالاترین کیفیت در تلگرام، واتساپ و فیس‌بوک. در صورت خالی بودن، تصویر شاخص به کار خواهد رفت.</p>
                            </div>

                            <div class="omni-seo-btn-actions" style="margin-top: 18px;">
                                <button type="button" class="button button-primary omni-btn-save-seo" data-post-id="<?php echo esc_attr($post_id); ?>">
                                    <span class="dashicons dashicons-saved"></span>
                                    <span>ذخیره تنظیمات شبکه‌های اجتماعی</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- تب ۲: چک‌لیست سئو ساختاری -->
                <div class="omni-tab-pane" id="tab-seo">
                    <?php echo $this->render_checklist_items($seo['checklist'] ?? []); ?>
                    <?php if (!empty($seo['recommendations'])): ?>
                        <div class="omni-recom-box">
                            <h4><span class="dashicons dashicons-lightbulb"></span> راهکارهای بهبود سئو ارگانیک:</h4>
                            <ul>
                                <?php foreach ($seo['recommendations'] as $rec): ?>
                                    <li><?php echo esc_html($rec); ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- تب ۳: چک‌لیست AEO -->
                <div class="omni-tab-pane" id="tab-aeo">
                    <?php echo $this->render_checklist_items($aeo['checklist'] ?? []); ?>
                    <?php if (!empty($aeo['recommendations'])): ?>
                        <div class="omni-recom-box">
                            <h4><span class="dashicons dashicons-lightbulb"></span> راهکارهای بهبود برای AEO:</h4>
                            <ul>
                                <?php foreach ($aeo['recommendations'] as $rec): ?>
                                    <li><?php echo esc_html($rec); ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- تب ۴: چک‌لیست GEO -->
                <div class="omni-tab-pane" id="tab-geo">
                    <?php echo $this->render_checklist_items($geo['checklist'] ?? []); ?>
                    <?php if (!empty($geo['recommendations'])): ?>
                        <div class="omni-recom-box">
                            <h4><span class="dashicons dashicons-lightbulb"></span> راهکارهای بهینه‌سازی برای مدل‌های LLM (GEO):</h4>
                            <ul>
                                <?php foreach ($geo['recommendations'] as $rec): ?>
                                    <li><?php echo esc_html($rec); ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- تب ۵: چک‌لیست خوانایی و ساختار نگارش (Readability) -->
                <div class="omni-tab-pane" id="tab-readability">
                    <?php echo $this->render_checklist_items($readability['checklist'] ?? []); ?>
                    <?php if (!empty($readability['recommendations'])): ?>
                        <div class="omni-recom-box">
                            <h4><span class="dashicons dashicons-lightbulb"></span> راهکارهای ارتقای خوانایی و نگارش روان:</h4>
                            <ul>
                                <?php foreach ($readability['recommendations'] as $rec): ?>
                                    <li><?php echo esc_html($rec); ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- تب ۶: تنظیمات پیشرفته و روبات‌ها -->
                <div class="omni-tab-pane" id="tab-advanced">
                    <div class="omni-advanced-seo-box">
                        <div class="omni-form-row">
                            <label><strong>وضعیت نمایه‌سازی روبات‌ها (Robots Meta):</strong></label>
                            <div class="omni-checkbox-group">
                                <label class="omni-checkbox-label">
                                    <input type="checkbox" name="omni_ai_noindex" value="1" <?php checked($noindex, true); ?> class="omni-field-noindex" />
                                    <span>دستور Noindex (جلوگیری از ایندکس شدن این صفحه در گوگل)</span>
                                </label>
                                <label class="omni-checkbox-label">
                                    <input type="checkbox" name="omni_ai_nofollow" value="1" <?php checked($nofollow, true); ?> class="omni-field-nofollow" />
                                    <span>دستور Nofollow (جلوگیری از دنبال کردن پیوندهای این صفحه)</span>
                                </label>
                            </div>
                        </div>

                        <div class="omni-form-row" style="margin-top: 16px;">
                            <label for="omni_ai_canonical_url_<?php echo esc_attr($post_id); ?>">
                                <strong>آدرس کنونیکال سفارشی (Canonical URL)</strong>
                            </label>
                            <input type="url" 
                                   id="omni_ai_canonical_url_<?php echo esc_attr($post_id); ?>" 
                                   name="omni_ai_canonical_url" 
                                   class="omni-seo-input omni-field-canonical" 
                                   value="<?php echo esc_attr($canonical); ?>" 
                                   placeholder="<?php echo esc_attr($permalink); ?>" />
                            <p class="omni-field-hint">اگر این صفحه بازنشر از آدرس دیگری است یا دارای محتوای مشترک است، آدرس منبع اصلی را وارد نمایید. در غیر این صورت خالی بگذارید.</p>
                        </div>

                        <div class="omni-seo-btn-actions" style="margin-top: 18px;">
                            <button type="button" class="button button-primary omni-btn-save-seo" data-post-id="<?php echo esc_attr($post_id); ?>">
                                <span class="dashicons dashicons-saved"></span>
                                <span>ذخیره تنظیمات پیشرفته</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- تب ۶: ساختار داده و اسکیما (Rich Snippets) -->
                <div class="omni-tab-pane" id="tab-schema">
                    <div class="omni-schema-seo-box">
                        <div class="omni-form-row">
                            <label for="omni_ai_schema_type_<?php echo esc_attr($post_id); ?>">
                                <strong>نوع اسکیمای ساختاریافته (Rich Snippet Type):</strong>
                            </label>
                            <select id="omni_ai_schema_type_<?php echo esc_attr($post_id); ?>" name="omni_ai_schema_type" class="omni-seo-select omni-field-schema-type">
                                <option value="article" <?php selected($schema_type, 'article'); ?>>مقاله / وبلاگ (Article / BlogPosting - پیش‌فرض هوشمند)</option>
                                <option value="product" <?php selected($schema_type, 'product'); ?>>محصول فروشگاهی (Product Schema با مشخصات قیمت، ارز و موجودی)</option>
                                <option value="howto" <?php selected($schema_type, 'howto'); ?>>آموزش گام‌به‌گام (HowTo Schema)</option>
                                <option value="review" <?php selected($schema_type, 'review'); ?>>نقد و بررسی ستاره‌ای (Review / Rating Schema)</option>
                                <option value="faq" <?php selected($schema_type, 'faq'); ?>>پرسش و پاسخ اختصاصی (FAQPage)</option>
                                <option value="none" <?php selected($schema_type, 'none'); ?>>غیرفعال‌سازی اسکیما برای این نوشته</option>
                            </select>
                            <p class="omni-field-hint">موتورهای جستجو نظیر گوگل برای نمایش ستاره، زمان آموزش و بخش‌های غنی در نتایج جستجو از این طرح استفاده می‌کنند.</p>
                        </div>

                        <!-- فیلدهای اختصاصی Review -->
                        <div class="omni-schema-review-fields" style="<?php echo ($schema_type === 'review') ? '' : 'display:none;'; ?> margin-top: 14px;">
                            <div class="omni-form-row">
                                <label><strong>نام موضوع مورد بررسی (Item Reviewed):</strong></label>
                                <input type="text" name="omni_ai_review_item" class="omni-seo-input omni-field-review-item" value="<?php echo esc_attr($review_item); ?>" placeholder="نام کالا، نرم‌افزار، کتاب یا خدمات..." />
                            </div>
                            <div class="omni-form-row" style="margin-top: 10px;">
                                <label><strong>امتیاز نقد (از ۱ تا ۵):</strong></label>
                                <input type="number" step="0.1" min="1" max="5" name="omni_ai_review_rating" class="omni-seo-input omni-field-review-rating" value="<?php echo esc_attr($review_rating); ?>" style="max-width: 120px;" />
                            </div>
                        </div>

                        <!-- فیلدهای اختصاصی HowTo -->
                        <div class="omni-schema-howto-fields" style="<?php echo ($schema_type === 'howto') ? '' : 'display:none;'; ?> margin-top: 14px;">
                            <div class="omni-form-row">
                                <label><strong>عنوان آموزش (HowTo Name):</strong></label>
                                <input type="text" name="omni_ai_howto_name" class="omni-seo-input omni-field-howto-name" value="<?php echo esc_attr($howto_name); ?>" placeholder="مثال: نحوه نصب وردپرس در لوکال‌هاست" />
                            </div>
                            <div class="omni-form-row" style="margin-top: 10px;">
                                <label><strong>مدت زمان تخمینی آموزش:</strong></label>
                                <input type="text" name="omni_ai_howto_time" class="omni-seo-input omni-field-howto-time" value="<?php echo esc_attr($howto_time); ?>" placeholder="مثال: 15 دقیقه یا PT15M" style="max-width: 200px;" />
                            </div>
                        </div>

                        <div class="omni-seo-btn-actions" style="margin-top: 18px;">
                            <button type="button" class="button button-primary omni-btn-save-seo" data-post-id="<?php echo esc_attr($post_id); ?>">
                                <span class="dashicons dashicons-saved"></span>
                                <span>ذخیره تنظیمات اسکیما</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    private function render_checklist_items(array $items): string {
        if (empty($items)) {
            return '<p class="omni-empty-muted">موردی برای نمایش وجود ندارد.</p>';
        }

        $html = '<ul class="omni-checklist-list">';
        foreach ($items as $item) {
            $status = $item['status'] ?? 'pass';
            $icon = 'dashicons-yes-alt';
            $class = 'omni-item-pass';

            if ($status === 'warning') {
                $icon = 'dashicons-warning';
                $class = 'omni-item-warn';
            } elseif ($status === 'fail') {
                $icon = 'dashicons-dismiss';
                $class = 'omni-item-fail';
            }

            $html .= '<li class="' . esc_attr($class) . '">';
            $html .= '<span class="dashicons ' . esc_attr($icon) . '"></span>';
            $html .= '<span>' . esc_html($item['label'] ?? '') . '</span>';
            $html .= '</li>';
        }
        $html .= '</ul>';

        return $html;
    }

    /* -------------------------------------------------------------
     *  AJAX Handlers
     * ----------------------------------------------------------- */

    public function ajax_reanalyze(): void {
        check_ajax_referer('omni_ranking_nonce', 'security');

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'دسترسی غیرمجاز.']);
        }

        $post_id = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;
        if (!$post_id) {
            wp_send_json_error(['message' => 'شناسه نوشته معتبر نیست.']);
        }

        $ratings = $this->analyze_and_save_post($post_id);
        $cell_html = $this->render_ranking_cell_html($post_id, $ratings);
        $dashboard_html = $this->render_full_dashboard_html($post_id, $ratings);

        $post = get_post($post_id);
        if ($post && class_exists('OmniAI\\Database\\Log_Repository')) {
            Log_Repository::insert_log(
                get_current_user_id(),
                "تحلیل و محاسبه مجدد رتبه محتوا (SEO / AEO / GEO) برای نوشته: «{$post->post_title}» (شناسه: #{$post_id})",
                "ارزیابی مجدد با موفقیت انجام شد:\n• سئو ارگانیک: {$ratings['seo']['score']}%\n• موتور پاسخگو (AEO): {$ratings['aeo']['score']}%\n• هوش مصنوعی (GEO): {$ratings['geo']['score']}%\n• میانگین کل: {$ratings['avg_score']}%",
                'Content Ranking',
                'Analyzer Engine',
                0
            );
        }

        wp_send_json_success([
            'post_id'        => $post_id,
            'ratings'        => $ratings,
            'cell_html'      => $cell_html,
            'dashboard_html' => $dashboard_html,
        ]);
    }

    public function ajax_get_modal(): void {
        check_ajax_referer('omni_ranking_nonce', 'security');

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'دسترسی غیرمجاز.']);
        }

        $post_id = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;
        $post = get_post($post_id);
        if (!$post) {
            wp_send_json_error(['message' => 'نوشته یافت نشد.']);
        }

        $ratings = $this->get_post_ranking($post_id);
        $html = $this->render_full_dashboard_html($post_id, $ratings);

        wp_send_json_success([
            'post_id'    => $post_id,
            'post_title' => $post->post_title,
            'edit_link'  => get_edit_post_link($post_id, ''),
            'html'       => $html,
        ]);
    }

    /**
     * AJAX: تولید بخش‌های بهینه‌سازی توسط AI همراه با فکت‌های آماری و لینک‌سازی داخلی
     */
    public function ajax_optimize_content(): void {
        check_ajax_referer('omni_ranking_nonce', 'security');

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'دسترسی غیرمجاز.']);
        }

        $post_id = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;
        $post = get_post($post_id);
        if (!$post) {
            wp_send_json_error(['message' => 'نوشته مورد نظر یافت نشد.']);
        }

        try {
            $provider = Provider_Factory::get_provider();
            if (!$provider->is_configured()) {
                wp_send_json_error(['message' => 'سرویس‌دهنده هوش مصنوعی تنظیم نشده است. لطفاً در تنظیمات Omni AI کلید API را وارد کنید.']);
            }

            // ۱. استخراج سایر مقالات منتشرشده برای لینک‌دهی داخلی
            $other_posts = get_posts([
                'post_type'      => 'post',
                'post_status'    => 'publish',
                'numberposts'    => 10,
                'exclude'        => [$post_id],
            ]);

            $links_context = "";
            if (!empty($other_posts)) {
                $links_context = "\nلیست مقالات منتشرشده سایت شما (جهت پیوند داخلی):\n";
                foreach ($other_posts as $op) {
                    $links_context .= "- عنوان مقاله: \"" . esc_html($op->post_title) . "\" | پیوند: " . esc_url(get_permalink($op->ID)) . "\n";
                }
            }

            $clean_content = wp_strip_all_tags($post->post_content);
            $excerpt = mb_substr($clean_content, 0, 1800, 'UTF-8');

            $current_focus_kw = (string) get_post_meta($post_id, '_omni_ai_focus_keyword', true);
            if (empty($current_focus_kw)) {
                $current_focus_kw = (string) get_post_meta($post_id, 'rank_math_focus_keyword', true);
            }
            if (empty($current_focus_kw)) {
                $current_focus_kw = (string) get_post_meta($post_id, '_yoast_wpseo_focuskw', true);
            }

            $current_seo_title = (string) get_post_meta($post_id, '_omni_ai_seo_title', true);
            if (empty($current_seo_title)) {
                $current_seo_title = (string) get_post_meta($post_id, 'rank_math_title', true);
            }
            if (empty($current_seo_title)) {
                $current_seo_title = (string) get_post_meta($post_id, '_yoast_wpseo_title', true);
            }
            if (empty($current_seo_title)) {
                $current_seo_title = $post->post_title;
            }

            $word_count = $this->count_words($post->post_content);
            $target_reps = max(3, min(6, (int) ceil($word_count * 0.008)));

            $prompt = "تو یک متخصص ارشد سئو (SEO)، بهینه‌سازی برای موتورهای پاسخگو (AEO) و بهینه‌سازی هوش مصنوعی (GEO) هستی.\n";
            $prompt .= "عنوان فعلی نوشته: " . $post->post_title . "\n";
            $prompt .= "کلیدواژه کانونی فعلی: " . ($current_focus_kw ? "«{$current_focus_kw}» (کلمه کلیدی محوری تعیین شده و الزامی)" : '(تعیین نشده - باید هوشمندانه انتخاب کنی)') . "\n";
            $prompt .= "عنوان سئوی فعلی: " . $current_seo_title . "\n";
            $prompt .= "طول متن فعلی: {$word_count} کلمه\n";
            $prompt .= "خلاصه محتوای مقاله:\n" . $excerpt . "\n";
            $prompt .= $links_context . "\n";
            $prompt .= "با توجه به اصول سئو مدرن، بخش‌های زیر را به زبان فارسی و با بالاترین کیفیت آماده کن.\n";
            $prompt .= "الزامات حیاتی برای دستیابی به بالاترین رتبه و نمره ۱۰۰٪:\n";
            if (!empty($current_focus_kw)) {
                $prompt .= "۱. کلیدواژه کانونی (focus_keyword): دقیقاً مقدار «{$current_focus_kw}» را بدون تغییر در خروجی حفظ کن و روی آن متمرکز شو.\n";
            } else {
                $prompt .= "۱. کلیدواژه کانونی (focus_keyword): کوتاه، دقیق و هدفمند (۱ تا ۳ کلمه) متناسب با موضوع اصلی نوشته.\n";
            }
            $prompt .= "۲. عنوان سئو (seo_title): جذاب و کلیک‌خور برای گوگل، دقیقاً بین ۴۰ تا ۶۰ کاراکتر (نه بیشتر نه کمتر) که حتماً کلیدواژه کانونی در آن قرار داشته باشد.\n";
            $prompt .= "۳. الزامات GEO: در بخش جمع‌بندی حتماً حداقل ۲ الی ۳ داده عددی، درصد مشخص یا مقایسه کمی ملموس (مانند: افزایش کارایی تا ۸۰٪، رشد ۲ برابری و...) درج کن.\n";
            $prompt .= "۴. پیوند خارجی معتبر: در انتهای بخش جمع‌بندی یا متن، حتماً یک پیوند خارجی به منبع رسمی/مستندات فناوری با فرمت <a href=\"https://...\" target=\"_blank\" rel=\"noopener noreferrer\">منبع و مستندات مرجع</a> اضافه کن تا چک‌لیست سئو پاس شود.\n";
            $prompt .= "۵. پیوند داخلی: در بخش FAQ یا جمع‌بندی حداقل ۱ لینک داخلی به مقالات مرتبط سایت قرار بده.\n";
            $prompt .= "۶. الزام حیاتی چگالی کلیدواژه (Keyword Density): کلیدواژه کانونی «" . ($current_focus_kw ?: 'انتخاب شده') . "» باید حداقل ۳ الی ۴ مرتبه در طول بخش‌های تولیدی به شکل کاملاً طبیعی و روان تکرار شود: ۱ بار در پاسخ صریح (direct_answer)، حداقل ۲ بار در سوالات یا پاسخ‌های متداول (faq_section)، و ۱ بار در بخش جمع‌بندی (conclusion_section). این امر برای رسیدن چگالی کلمه کلیدی به محدوده سبز و استاندارد (بیش از ۰.۸٪) کاملاً الزامی است.\n\n";
            $prompt .= "خروجی را فقط در یک آبجکت JSON معتبر (بدون هیچ توضیح اضافه یا کد markdown خارج از JSON) برگردان:\n";
            $prompt .= "{\n";
            $prompt .= '  "focus_keyword": "' . (!empty($current_focus_kw) ? esc_js($current_focus_kw) : 'کلیدواژه کانونی ۱ الی ۳ کلمه‌ای') . '",' . "\n";
            $prompt .= '  "seo_title": "عنوان سئو بهینه و جذاب دقیقاً بین ۴۰ تا ۶۰ کاراکتر حاوی کلیدواژه",' . "\n";
            $prompt .= '  "direct_answer": "یک پاراگراف پاسخ مستقیم و صریح بین ۴۰ تا ۶۰ کلمه همراه با فکت عددی مشخص و حاوی کلمه کلیدی اصلی، بدون سلام یا حاشیه، مناسب برای Featured Snippet و جستجوی صوتی",' . "\n";
            $prompt .= '  "faq_section": "کد HTML شامل ۳ سوال و پاسخ متداول با تگ‌های <h3> برای سوال و <p> برای پاسخ، مختصر و بسیار مفید (حاوی حداقل ۲ بار تکرار طبیعی کلیدواژه کانونی و ۱ لینک داخلی به مقالات سایت)",' . "\n";
            $prompt .= '  "conclusion_section": "کد HTML شامل بخش جمع‌بندی یکپارچه با تگ <h2>جمع‌بندی و نکات کلیدی</h2> همراه با ۳ نکته بولت پوینت غنی از فکت‌های عددی و حاوی کلیدواژه، و حتماً یک لینک خارجی مرجع با تگ a",' . "\n";
            $prompt .= '  "meta_description": "یک متن جذاب و ترغیب‌کننده برای متادیسکریپشن بین ۱۳۰ تا ۱۵۵ کاراکتر همراه با کلمه کلیدی اصلی"' . "\n";
            $prompt .= "}\n";

            $response = $provider->generate($prompt, [
                'temperature' => 0.3,
                'system_prompt' => 'You are an advanced SEO, AEO, and GEO optimization engine. Return only raw valid JSON without markdown fences.',
            ]);

            $raw_text = trim($response['text'] ?? '');
            // حذف مارک‌داون احتمالی ```json
            $clean_json = preg_replace('/^```(?:json)?\s*/i', '', $raw_text);
            $clean_json = preg_replace('/\s*```$/', '', $clean_json);
            $data = json_decode(trim($clean_json), true);

            if (!is_array($data)) {
                // تلاش برای استخراج اولین بلاک JSON
                if (preg_match('/\{[\s\S]*\}/', $raw_text, $matches)) {
                    $data = json_decode($matches[0], true);
                }
            }

            if (!is_array($data) || empty($data['direct_answer'])) {
                wp_send_json_error([
                    'message' => 'پاسخ هوش مصنوعی در ساختار مناسب دریافت نشد. لطفاً دوباره تلاش کنید.',
                    'raw'     => $raw_text,
                ]);
            }

            // ثبت دقیق در جدول لاگ‌های هوش مصنوعی (History & Logs)
            if (class_exists('OmniAI\\Database\\Log_Repository')) {
                $model_name = !empty($response['model']) ? $response['model'] : (method_exists($provider, 'get_name') ? $provider->get_name() : 'AI Optimizer');
                $prov_id    = !empty($response['provider']) ? $response['provider'] : (method_exists($provider, 'get_id') ? $provider->get_id() : 'gemini');
                $tokens     = intval($response['tokens'] ?? 0);

                Log_Repository::insert_log(
                    get_current_user_id(),
                    "تحلیل و بهینه‌سازی رتبه محتوا با AI (AEO / GEO / SEO) برای نوشته: «{$post->post_title}» (شناسه: #{$post_id})",
                    $raw_text,
                    $model_name,
                    $prov_id,
                    $tokens
                );
            }

            wp_send_json_success([
                'post_id'     => $post_id,
                'suggestions' => [
                    'focus_keyword'      => !empty($data['focus_keyword']) ? sanitize_text_field($data['focus_keyword']) : ($current_focus_kw ?: ''),
                    'seo_title'          => !empty($data['seo_title']) ? sanitize_text_field($data['seo_title']) : $current_seo_title,
                    'direct_answer'      => $data['direct_answer'] ?? '',
                    'faq_section'        => $data['faq_section'] ?? '',
                    'conclusion_section' => $data['conclusion_section'] ?? '',
                    'meta_description'   => $data['meta_description'] ?? '',
                ],
            ]);

        } catch (\Throwable $e) {
            wp_send_json_error(['message' => 'خطا در ارتباط با هوش مصنوعی: ' . $e->getMessage()]);
        }
    }

    /**
     * AJAX: اعمال بخش‌های منتخب تولید شده در محتوای نوشته با جایگزینی هوشمند بخش‌های قدیمی
     */
    public function ajax_apply_optimization(): void {
        check_ajax_referer('omni_ranking_nonce', 'security');

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'دسترسی غیرمجاز.']);
        }

        $post_id = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;
        $post = get_post($post_id);
        if (!$post) {
            wp_send_json_error(['message' => 'نوشته یافت نشد.']);
        }

        $direct_answer = isset($_POST['direct_answer']) ? wp_kses_post(wp_unslash($_POST['direct_answer'])) : '';
        $faq_section   = isset($_POST['faq_section']) ? wp_kses_post(wp_unslash($_POST['faq_section'])) : '';
        $conclusion    = isset($_POST['conclusion_section']) ? wp_kses_post(wp_unslash($_POST['conclusion_section'])) : '';
        $meta_desc     = isset($_POST['meta_description']) ? sanitize_text_field(wp_unslash($_POST['meta_description'])) : '';
        $focus_kw      = isset($_POST['focus_keyword']) ? sanitize_text_field(wp_unslash($_POST['focus_keyword'])) : '';
        $seo_title     = isset($_POST['seo_title']) ? sanitize_text_field(wp_unslash($_POST['seo_title'])) : '';

        $content = $post->post_content;

        // ۱. جایگزینی یا درج هوشمند پاسخ مستقیم در ابتدای محتوا
        if (!empty($direct_answer)) {
            $formatted_direct = "\n\n<!-- omni-direct-answer -->\n<div class=\"omni-direct-answer-box\">\n<p><strong>پاسخ صریح:</strong> " . $direct_answer . "</p>\n</div>\n<!-- /omni-direct-answer -->\n\n";

            $pattern_direct = '/<!-- omni-direct-answer -->[\s\S]*?<!-- \/omni-direct-answer -->|<div class=[\'"]omni-direct-answer-box[\'"][\s\S]*?<\/div>/iu';
            if (preg_match($pattern_direct, $content)) {
                $content = preg_replace($pattern_direct, trim($formatted_direct), $content, 1);
            } else {
                $content = $formatted_direct . $content;
            }
        }

        // ۲. جایگزینی هوشمند بخش نتیجه‌گیری / جمع‌بندی قدیمی جهت جلوگیری از تکرار
        if (!empty($conclusion)) {
            $formatted_conc = "\n\n<!-- omni-conclusion -->\n" . $conclusion . "\n<!-- /omni-conclusion -->\n\n";

            if (strpos($content, '<!-- omni-conclusion -->') !== false) {
                $content = preg_replace('/<!-- omni-conclusion -->[\s\S]*?<!-- \/omni-conclusion -->/u', trim($formatted_conc), $content, 1);
            } else {
                // اگر قبلاً تیتر جمع‌بندی دستی در محتوا بوده، همان بخش را به‌طور کامل جایگزین کن
                $pattern_conc = '/(<h[2-4][^>]*>\s*(?:جمع[‌\s]*بندی|نتیجه[‌\s]*گیری|کلام\s*آخر|پایان\s*سخن|نکات\s*کلیدی|Conclusion)[\s\S]*?)(?=<h[2-4]|$)/iu';
                if (preg_match($pattern_conc, $content)) {
                    $content = preg_replace($pattern_conc, trim($formatted_conc) . "\n\n", $content, 1);
                } else {
                    $content .= $formatted_conc;
                }
            }
        }

        // ۳. جایگزینی هوشمند بخش سوالات متداول قدیمی جهت جلوگیری از تکرار
        if (!empty($faq_section)) {
            $formatted_faq = "\n\n<!-- omni-faq -->\n<div class=\"omni-faq-section\">\n<h2>پرسش‌های متداول</h2>\n" . $faq_section . "\n</div>\n<!-- /omni-faq -->\n\n";

            if (strpos($content, '<!-- omni-faq -->') !== false) {
                $content = preg_replace('/<!-- omni-faq -->[\s\S]*?<!-- \/omni-faq -->/u', trim($formatted_faq), $content, 1);
            } else {
                // اگر قبلاً تیتر پرسش‌های متداول دستی در محتوا بوده، همان بخش را به‌طور کامل جایگزین کن
                $pattern_faq = '/(<h[2-4][^>]*>\s*(?:پرسش[‌\s]*های\s*متداول|سوالات\s*متداول|پرسش[‌\s]*و\s*پاسخ|FAQ)[\s\S]*?)(?=<h[2-4]|$)/iu';
                if (preg_match($pattern_faq, $content)) {
                    $content = preg_replace($pattern_faq, trim($formatted_faq) . "\n\n", $content, 1);
                } else {
                    $content .= $formatted_faq;
                }
            }
        }

        $post_update = [
            'ID'           => $post_id,
            'post_content' => $content,
        ];

        // ۴. به‌روزرسانی هوشمند پیوند یکتا (Slug / نامک)، متن Alt تصویر شاخص و تصاویر متن
        if (!empty($focus_kw)) {
            $persian_digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
            $english_digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

            $current_slug = urldecode($post->post_name);
            $norm_slug = str_replace($persian_digits, $english_digits, mb_strtolower($current_slug, 'UTF-8'));
            $norm_kw   = str_replace($persian_digits, $english_digits, mb_strtolower($focus_kw, 'UTF-8'));
            $kw_slug_part = str_replace([' ', '‌'], '-', $norm_kw);

            $in_slug = false;
            if (!empty($norm_slug) && (
                mb_stripos($norm_slug, $kw_slug_part) !== false ||
                mb_stripos(str_replace('-', ' ', $norm_slug), $norm_kw) !== false
            )) {
                $in_slug = true;
            }

            // اگر نامک در دیتابیس خالی یا عددی است، یا کلیدواژه در آن نیست، نامک را به‌روزرسانی کن
            if (!$in_slug) {
                $new_slug = sanitize_title($focus_kw);
                if (!empty($new_slug)) {
                    $post_update['post_name'] = wp_unique_post_slug($new_slug, $post_id, $post->post_status, $post->post_type, $post->post_parent);
                }
            }

            // ۵. به‌روزرسانی هوشمند متن Alt تصویر شاخص (Featured Image)
            $thumb_id = get_post_thumbnail_id($post_id);
            if ($thumb_id) {
                $thumb_alt = (string) get_post_meta($thumb_id, '_wp_attachment_image_alt', true);
                $thumb_alt_norm = str_replace($persian_digits, $english_digits, mb_strtolower($thumb_alt, 'UTF-8'));
                if (empty($thumb_alt) || (mb_stripos($thumb_alt, $focus_kw) === false && mb_stripos($thumb_alt_norm, $norm_kw) === false)) {
                    $new_alt = $focus_kw . ' - ' . mb_substr($post->post_title, 0, 45, 'UTF-8');
                    update_post_meta($thumb_id, '_wp_attachment_image_alt', $new_alt);
                }
            }

            // ۶. به‌روزرسانی هوشمند متن Alt تصاویر داخل محتوا
            if (strpos($content, '<img') !== false) {
                $has_kw_alt = false;
                preg_match_all('/<img\s+[^>]*alt=[\'"]([^\'"]+)[\'"][^>]*>/i', $content, $all_alts);
                foreach ($all_alts[1] ?? [] as $alt_text) {
                    if (mb_stripos($alt_text, $focus_kw) !== false || mb_stripos(str_replace($persian_digits, $english_digits, $alt_text), $norm_kw) !== false) {
                        $has_kw_alt = true;
                        break;
                    }
                }
                if (!$has_kw_alt) {
                    $replaced_first = false;
                    $content = preg_replace_callback('/<img\s+([^>]+)>/i', function ($matches) use ($focus_kw, &$replaced_first) {
                        if ($replaced_first) {
                            return $matches[0];
                        }
                        $img_attrs = $matches[1];
                        $replaced_first = true;
                        if (preg_match('/alt=[\'"]([^\'"]*)[\'"]/i', $img_attrs, $alt_m)) {
                            $new_alt = trim($alt_m[1]) ? trim($alt_m[1]) . ' - ' . $focus_kw : $focus_kw;
                            return str_replace($alt_m[0], 'alt="' . esc_attr($new_alt) . '"', $matches[0]);
                        } else {
                            return '<img alt="' . esc_attr($focus_kw) . '" ' . $img_attrs . '>';
                        }
                    }, $content);
                    $post_update['post_content'] = $content;
                }
            }
        }

        // ذخیره تغییرات نوشته در دیتابیس
        wp_update_post($post_update);

        // ۴. ذخیره کلیدواژه کانونی، عنوان و توضیحات متا در فیلدهای اختصاصی، رنک‌مث و یواست سئو
        if (!empty($focus_kw)) {
            update_post_meta($post_id, '_omni_ai_focus_keyword', $focus_kw);
            update_post_meta($post_id, 'rank_math_focus_keyword', $focus_kw);
            update_post_meta($post_id, '_yoast_wpseo_focuskw', $focus_kw);
        }

        if (!empty($seo_title)) {
            update_post_meta($post_id, '_omni_ai_seo_title', $seo_title);
            update_post_meta($post_id, 'rank_math_title', $seo_title);
            update_post_meta($post_id, '_yoast_wpseo_title', $seo_title);
        }

        if (!empty($meta_desc)) {
            update_post_meta($post_id, '_omni_ai_meta_description', $meta_desc);
            update_post_meta($post_id, 'rank_math_description', $meta_desc);
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $meta_desc);
        }

        // تحلیل مجدد و ذخیره امتیازهای جدید
        $new_ratings = $this->analyze_and_save_post($post_id);
        $cell_html   = $this->render_ranking_cell_html($post_id, $new_ratings);
        $dash_html   = $this->render_full_dashboard_html($post_id, $new_ratings);

        // ثبت در لاگ‌های تغییرات و ارزیابی محتوا (Audit Trail)
        if (class_exists('OmniAI\\Database\\Log_Repository')) {
            $applied_report = "بهینه‌سازی‌های جامع تولید شده توسط هوش مصنوعی با موفقیت در نوشته اعمال گردید:\n";
            if (!empty($focus_kw)) {
                $applied_report .= "✓ کلیدواژه کانونی تنظیم شد: {$focus_kw}\n";
            }
            if (!empty($seo_title)) {
                $applied_report .= "✓ عنوان سئو بهینه شد: {$seo_title}\n";
            }
            if (!empty($direct_answer)) {
                $applied_report .= "✓ پاراگراف پاسخ صریح (AEO Snippet) در ابتدای متن درج شد.\n";
            }
            if (!empty($faq_section)) {
                $applied_report .= "✓ بخش پرسش و پاسخ‌های متداول (FAQ) به همراه پیوندهای داخلی جایگزین/اضافه شد.\n";
            }
            if (!empty($conclusion)) {
                $applied_report .= "✓ بخش جمع‌بندی غنی از آمار و ارقام عددی (GEO Takeaways) و پیوند خارجی معتبر جایگزین/اضافه شد.\n";
            }
            if (!empty($meta_desc)) {
                $applied_report .= "✓ توضیحات متای سئو تنظیم شد: {$meta_desc}\n";
            }
            $applied_report .= "\nامتیازهای ارزیابی جدید محتوا:\n";
            $applied_report .= "• سئو ارگانیک: " . ($new_ratings['seo']['score'] ?? 0) . "%\n";
            $applied_report .= "• موتور پاسخگو (AEO): " . ($new_ratings['aeo']['score'] ?? 0) . "%\n";
            $applied_report .= "• مدل‌های هوش مصنوعی (GEO): " . ($new_ratings['geo']['score'] ?? 0) . "%\n";
            $applied_report .= "• میانگین کل آمادگی: " . ($new_ratings['avg_score'] ?? 0) . "%";

            Log_Repository::insert_log(
                get_current_user_id(),
                "اعمال تغییرات رتبه‌بندی محتوا روی نوشته: «{$post->post_title}» (شناسه: #{$post_id})",
                $applied_report,
                'Content Ranking',
                'Ranking Optimizer',
                0
            );
        }

        wp_send_json_success([
            'post_id'          => $post_id,
            'message'          => 'بهینه‌سازی با موفقیت روی نوشته اعمال شد و امتیازها دوباره محاسبه گردید.',
            'ratings'          => $new_ratings,
            'focus_keyword'    => $focus_kw,
            'seo_title'        => $seo_title,
            'meta_description' => $meta_desc,
            'cell_html'        => $cell_html,
            'dashboard_html'   => $dash_html,
        ]);
    }

    public function ajax_save_post_seo(): void {
        check_ajax_referer('omni_ranking_nonce', 'security');
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'دسترسی غیرمجاز.']);
        }

        $post_id = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;
        if (!$post_id) {
            wp_send_json_error(['message' => 'شناسه نوشته معتبر نیست.']);
        }

        if (isset($_POST['focus_keyword'])) {
            $kw = sanitize_text_field($_POST['focus_keyword']);
            update_post_meta($post_id, '_omni_ai_focus_keyword', $kw);
            update_post_meta($post_id, 'rank_math_focus_keyword', $kw);
            update_post_meta($post_id, '_yoast_wpseo_focuskw', $kw);
        }

        if (isset($_POST['seo_title'])) {
            $st = sanitize_text_field($_POST['seo_title']);
            update_post_meta($post_id, '_omni_ai_seo_title', $st);
            update_post_meta($post_id, 'rank_math_title', $st);
            update_post_meta($post_id, '_yoast_wpseo_title', $st);
        }

        if (isset($_POST['meta_description'])) {
            $md = sanitize_textarea_field($_POST['meta_description']);
            update_post_meta($post_id, '_omni_ai_meta_description', $md);
            update_post_meta($post_id, 'rank_math_description', $md);
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $md);
        }

        if (isset($_POST['canonical_url'])) {
            $cu = esc_url_raw($_POST['canonical_url']);
            update_post_meta($post_id, '_omni_ai_canonical_url', $cu);
            update_post_meta($post_id, 'rank_math_canonical_url', $cu);
            update_post_meta($post_id, '_yoast_wpseo_canonical', $cu);
        }

        if (isset($_POST['noindex'])) {
            $val = (!empty($_POST['noindex']) && $_POST['noindex'] !== 'false') ? '1' : '0';
            update_post_meta($post_id, '_omni_ai_noindex', $val);
        }

        if (isset($_POST['nofollow'])) {
            $val = (!empty($_POST['nofollow']) && $_POST['nofollow'] !== 'false') ? '1' : '0';
            update_post_meta($post_id, '_omni_ai_nofollow', $val);
        }

        // ذخیره فیلدهای شبکه‌های اجتماعی
        if (isset($_POST['og_title'])) {
            $val = sanitize_text_field($_POST['og_title']);
            update_post_meta($post_id, '_omni_ai_og_title', $val);
            update_post_meta($post_id, 'rank_math_facebook_title', $val);
            update_post_meta($post_id, '_yoast_wpseo_opengraph-title', $val);
        }
        if (isset($_POST['og_description'])) {
            $val = sanitize_textarea_field($_POST['og_description']);
            update_post_meta($post_id, '_omni_ai_og_description', $val);
            update_post_meta($post_id, 'rank_math_facebook_description', $val);
            update_post_meta($post_id, '_yoast_wpseo_opengraph-description', $val);
        }
        if (isset($_POST['og_image'])) {
            $val = esc_url_raw($_POST['og_image']);
            update_post_meta($post_id, '_omni_ai_og_image', $val);
            update_post_meta($post_id, 'rank_math_facebook_image', $val);
            update_post_meta($post_id, '_yoast_wpseo_opengraph-image', $val);
        }
        if (isset($_POST['twitter_title'])) {
            $val = sanitize_text_field($_POST['twitter_title']);
            update_post_meta($post_id, '_omni_ai_twitter_title', $val);
            update_post_meta($post_id, 'rank_math_twitter_title', $val);
            update_post_meta($post_id, '_yoast_wpseo_twitter-title', $val);
        }
        if (isset($_POST['twitter_description'])) {
            $val = sanitize_textarea_field($_POST['twitter_description']);
            update_post_meta($post_id, '_omni_ai_twitter_description', $val);
            update_post_meta($post_id, 'rank_math_twitter_description', $val);
            update_post_meta($post_id, '_yoast_wpseo_twitter-description', $val);
        }
        if (isset($_POST['twitter_image'])) {
            $val = esc_url_raw($_POST['twitter_image']);
            update_post_meta($post_id, '_omni_ai_twitter_image', $val);
            update_post_meta($post_id, 'rank_math_twitter_image', $val);
            update_post_meta($post_id, '_yoast_wpseo_twitter-image', $val);
        }

        // ذخیره تنظیمات ساختار داده و اسکیما (Schema)
        if (isset($_POST['schema_type'])) {
            $st = sanitize_text_field($_POST['schema_type']);
            update_post_meta($post_id, '_omni_ai_schema_type', in_array($st, ['article', 'howto', 'review', 'faq', 'none'], true) ? $st : 'article');
        }
        if (isset($_POST['review_item'])) {
            update_post_meta($post_id, '_omni_ai_review_item', sanitize_text_field($_POST['review_item']));
        }
        if (isset($_POST['review_rating'])) {
            update_post_meta($post_id, '_omni_ai_review_rating', max(1.0, min(5.0, (float) $_POST['review_rating'])));
        }
        if (isset($_POST['howto_name']) || isset($_POST['howto_total_time']) || isset($_POST['howto_steps'])) {
            $steps = [];
            if (!empty($_POST['howto_steps']) && is_array($_POST['howto_steps'])) {
                foreach ($_POST['howto_steps'] as $step) {
                    if (is_array($step) && (!empty($step['title']) || !empty($step['text']))) {
                        $steps[] = [
                            'title' => sanitize_text_field($step['title'] ?? ''),
                            'text'  => sanitize_textarea_field($step['text'] ?? ''),
                        ];
                    }
                }
            }
            $howto_arr = [
                'name'        => sanitize_text_field($_POST['howto_name'] ?? ''),
                'description' => sanitize_textarea_field($_POST['howto_description'] ?? ''),
                'total_time'  => sanitize_text_field($_POST['howto_total_time'] ?? 'PT15M'),
                'steps'       => $steps,
            ];
            update_post_meta($post_id, '_omni_ai_howto_data', $howto_arr);
        }

        $new_ratings = $this->analyze_and_save_post($post_id);
        $cell_html   = $this->render_ranking_cell_html($post_id, $new_ratings);
        $dash_html   = $this->render_full_dashboard_html($post_id, $new_ratings);

        wp_send_json_success([
            'post_id'        => $post_id,
            'message'        => 'تنظیمات سئو با موفقیت ذخیره و تحلیل به‌روزرسانی شد.',
            'ratings'        => $new_ratings,
            'cell_html'      => $cell_html,
            'dashboard_html' => $dash_html,
        ]);
    }

    public function ajax_generate_seo_snippet(): void {
        check_ajax_referer('omni_ranking_nonce', 'security');
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'دسترسی غیرمجاز.']);
        }

        $post_id = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;
        $post = get_post($post_id);
        if (!$post) {
            wp_send_json_error(['message' => 'نوشته یافت نشد.']);
        }

        $focus_kw = isset($_POST['focus_keyword']) ? sanitize_text_field($_POST['focus_keyword']) : '';
        if (empty($focus_kw)) {
            $focus_kw = (string) get_post_meta($post_id, '_omni_ai_focus_keyword', true);
            if (empty($focus_kw)) $focus_kw = (string) get_post_meta($post_id, 'rank_math_focus_keyword', true);
        }

        $content = wp_strip_all_tags($post->post_content);
        $excerpt = mb_substr($content, 0, 1500, 'UTF-8');
        $title   = $post->post_title;

        $prompt = "با توجه به عنوان و محتوای زیر، یک عنوان سئو جذاب (بین ۴۰ تا ۶۰ کاراکتر) و یک توضیحات متای استاندارد و ترغیب‌کننده برای جذب کلیک در سرچ گوگل (بین ۱۲۰ تا ۱۵۵ کاراکتر) تولید کن.\n"
            . (!empty($focus_kw) ? "کلمه کلیدی کانونی: {$focus_kw}\n(بسیار مهم: حتماً کلمه کلیدی را در ابتدای عنوان و در توضیحات متا به کار ببر)\n" : "یک کلمه کلیدی کانونی مناسب (۱ تا ۳ کلمه) برای این مقاله انتخاب کن.\n")
            . "عنوان فعلی: {$title}\n"
            . "خلاصه محتوا: {$excerpt}\n\n"
            . "پاسخ را دقیقاً و فقط به فرمت JSON بدون هیچ توضیح اضافی یا کدبلاک ارسال کن:\n"
            . "{\"seo_title\": \"عنوان سئو بین ۴۰ تا ۶۰ کاراکتر\", \"meta_description\": \"توضیحات متای بهینه بین ۱۲۰ تا ۱۵۵ کاراکتر\", \"focus_keyword\": \"کلمه کلیدی کانونی\"}";

        $provider = Provider_Factory::get_provider();
        if (!$provider || !$provider->is_configured()) {
            wp_send_json_error(['message' => 'هیچ ارائه‌دهنده فعال هوش مصنوعی تنظیم نشده است. لطفاً در تنظیمات Omni AI کلید API را وارد کنید.']);
        }

        try {
            $response = $provider->generate($prompt, ['max_tokens' => 500, 'temperature' => 0.4]);
            $text = trim($response['text'] ?? '');
            $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
            $text = preg_replace('/\s*```$/i', '', $text);
            $json = json_decode($text, true);

            if (!is_array($json) || empty($json['seo_title'])) {
                wp_send_json_error(['message' => 'پاسخ هوش مصنوعی معتبر نبود.', 'raw' => $text]);
            }

            wp_send_json_success([
                'seo_title'        => sanitize_text_field($json['seo_title']),
                'meta_description' => sanitize_textarea_field($json['meta_description'] ?? ''),
                'focus_keyword'    => sanitize_text_field($json['focus_keyword'] ?? $focus_kw),
            ]);
        } catch (\Throwable $e) {
            wp_send_json_error(['message' => 'خطا در ارتباط با هوش مصنوعی: ' . $e->getMessage()]);
        }
    }

    /**
     * AJAX: اصلاح خودکار و هوشمند خوانایی متن و تزریق طبیعی کلمات ربط
     */
    public function ajax_fix_readability(): void {
        check_ajax_referer('omni_ranking_nonce', 'security');

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'دسترسی غیرمجاز.']);
        }

        $post_id = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;
        $post = get_post($post_id);
        if (!$post) {
            wp_send_json_error(['message' => 'نوشته یافت نشد.']);
        }

        try {
            $provider = Provider_Factory::get_provider();
            if (!$provider->is_configured()) {
                wp_send_json_error(['message' => 'پیکربندی هوش مصنوعی انجام نشده است.']);
            }

            $content = $post->post_content;
            $clean_text = wp_strip_all_tags($content);
            $sentences = preg_split('/[.!?؟\n]+/u', $clean_text, -1, PREG_SPLIT_NO_EMPTY);

            $transitions = [
                'بنابراین', 'در نتیجه', 'همچنین', 'علاوه بر این', 'با این حال', 'اگرچه',
                'به عنوان مثال', 'برای نمونه', 'در واقع', 'از سوی دیگر', 'به‌علاوه', 'به‌ویژه', 'اما', 'زیرا', 'چرا که'
            ];

            // پیدا کردن جملات فاقد کلمه ربط
            $candidates = [];
            foreach ($sentences as $s) {
                $trimmed = trim($s);
                $sw = $this->count_words($trimmed);
                if ($sw >= 5 && mb_strlen($trimmed) >= 20) {
                    $has_t = false;
                    foreach ($transitions as $t) {
                        if (mb_stripos($trimmed, $t) !== false) {
                            $has_t = true;
                            break;
                        }
                    }
                    if (!$has_t) {
                        $candidates[] = $trimmed;
                        if (count($candidates) >= 4) break;
                    }
                }
            }

            if (empty($candidates)) {
                wp_send_json_success([
                    'post_id' => $post_id,
                    'message' => 'شاخص کلمات ربط و خوانایی نوشته در حال حاضر استاندارد است.',
                    'ratings' => $this->get_post_ranking($post_id),
                ]);
            }

            $replacements = [];
            foreach ($candidates as $cand) {
                $prompt = "جمله زیر را طوری بازنویسی کن که به طور طبیعی و روان با یکی از عبارات پیونددهنده فارسی (مانند: علاوه بر این، بنابراین، همچنین، در نتیجه، برای نمونه، در واقع) پیوند داده شود. لحن متن حفظ شود و فقط و فقط جمله بازنویسی‌شده بدون هیچ توضیح یا علامت نقل‌قول اضافی برگردانده شود:\n\"{$cand}\"";
                $resp = $provider->generate($prompt, ['temperature' => 0.3]);
                $fixed = trim($resp['text'] ?? '');
                $fixed = trim($fixed, "\"'«»\n\r ");
                if (!empty($fixed) && mb_strpos($fixed, 'لطفاً متنی') === false && mb_strlen($fixed) >= 10) {
                    $replacements[$cand] = $fixed;
                    $content = str_replace($cand, $fixed, $content);
                }
            }

            if (!empty($replacements)) {
                wp_update_post([
                    'ID'           => $post_id,
                    'post_content' => $content,
                ]);
            }

            $ratings = $this->analyze_and_save_post($post_id);

            wp_send_json_success([
                'post_id'      => $post_id,
                'message'      => 'کلمات ربط و پیوستگی متن با موفقیت توسط هوش مصنوعی ارتقا یافت.',
                'replacements' => $replacements,
                'ratings'      => $ratings,
            ]);

        } catch (\Throwable $e) {
            wp_send_json_error(['message' => 'خطا در اصلاح خودکار خوانایی: ' . $e->getMessage()]);
        }
    }

    /**
     * تزریق کدهای تأیید وب‌مستر تولز (گوگل، بینگ، پینترست، یاندکس، بایدو)
     */
    public function output_webmaster_verification_tags(): void {
        $options = get_option('omni_ai_ranking_settings', []);

        // کدهای مختلف به شکل کلید => نام متاتگ
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
                // اگر کاربر کل تگ meta را پیست کرده بود، فقط مقدار content را بردار
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

    /* -------------------------------------------------------------
     *  REST API Handlers for React Admin Page
     * ----------------------------------------------------------- */

    public function register_rest_routes(): void {
        register_rest_route('omni-ai/v1', '/ranking/posts', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'handle_rest_get_posts'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        register_rest_route('omni-ai/v1', '/ranking/modal/(?P<id>\d+)', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'handle_rest_get_modal'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        register_rest_route('omni-ai/v1', '/ranking/reanalyze/(?P<id>\d+)', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_rest_reanalyze'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        register_rest_route('omni-ai/v1', '/ranking/analyze-all', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_rest_analyze_all'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        // تنظیمات اسکیما و llms.txt
        register_rest_route('omni-ai/v1', '/ranking/settings', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'handle_rest_get_settings'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        register_rest_route('omni-ai/v1', '/ranking/settings', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'handle_rest_save_settings'],
            'permission_callback' => function () {
                return current_user_can('manage_options') || current_user_can('edit_posts');
            },
        ]);

        // اندپوینت‌های عمومی llms.txt و llms-full.txt و robots.txt برای Next.js و هوش مصنوعی
        $llms_cb = function () {
            return new \WP_REST_Response($this->generate_llms_content(false), 200, [
                'Content-Type' => 'text/plain; charset=utf-8',
                'X-Robots-Tag' => 'all',
            ]);
        };
        register_rest_route('omni-ai/v1', '/llms\.txt', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => $llms_cb,
            'permission_callback' => '__return_true',
        ]);
        register_rest_route('omni-ai/v1', '/llms', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => $llms_cb,
            'permission_callback' => '__return_true',
        ]);

        $llms_full_cb = function () {
            return new \WP_REST_Response($this->generate_llms_content(true), 200, [
                'Content-Type' => 'text/plain; charset=utf-8',
                'X-Robots-Tag' => 'all',
            ]);
        };
        register_rest_route('omni-ai/v1', '/llms-full\.txt', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => $llms_full_cb,
            'permission_callback' => '__return_true',
        ]);
        register_rest_route('omni-ai/v1', '/llms-full', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => $llms_full_cb,
            'permission_callback' => '__return_true',
        ]);

        $robots_cb = function () {
            return new \WP_REST_Response($this->get_full_robots_content(), 200, [
                'Content-Type' => 'text/plain; charset=utf-8',
                'X-Robots-Tag' => 'all',
            ]);
        };
        register_rest_route('omni-ai/v1', '/robots\.txt', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => $robots_cb,
            'permission_callback' => '__return_true',
        ]);
        register_rest_route('omni-ai/v1', '/robots', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => $robots_cb,
            'permission_callback' => '__return_true',
        ]);

        // سرور MCP (Model Context Protocol) برای اتصال مستقیم دستیارهای هوش مصنوعی (Grok, Claude Desktop, Cursor, Antigravity)
        $mcp_route_args = [
            'methods'             => ['GET', 'POST', 'OPTIONS', 'HEAD', 'DELETE'],
            'callback'            => [$this, 'handle_rest_mcp'],
            'permission_callback' => '__return_true',
        ];
        register_rest_route('omni-ai/v1', '/mcp', $mcp_route_args);
        register_rest_route('omni-ai/v1', '/mcp/(?P<subpath>.*)', $mcp_route_args);

        // گزارش لاگ درخواست‌های ارسالی به سرور MCP (جهت عیب‌یابی اتصال کلاینت‌ها مانند Grok)
        register_rest_route('omni-ai/v1', '/mcp-logs', [
            'methods'             => ['GET'],
            'callback'            => [$this, 'handle_rest_mcp_logs'],
            'permission_callback' => '__return_true',
        ]);

        // همگام‌سازی، تثبیت ۶ دسته استاندارد و حذف دسته‌های اضافی
        register_rest_route('omni-ai/v1', '/sync-categories', [
            'methods'             => ['GET', 'POST'],
            'callback'            => function(): \WP_REST_Response {
                $result = self::sync_canonical_categories();
                $all = get_categories(['hide_empty' => false]);
                return new \WP_REST_Response([
                    'success'    => true,
                    'result'     => $result,
                    'categories' => $all,
                ], 200, [
                    'Access-Control-Allow-Origin' => '*',
                    'Content-Type'                => 'application/json; charset=utf-8',
                ]);
            },
            'permission_callback' => '__return_true',
        ]);
    }

    public function handle_rest_get_modal(\WP_REST_Request $request): \WP_REST_Response {
        try {
            $post_id = (int) $request->get_param('id');
            $post = get_post($post_id);
            if (!$post) {
                return new \WP_REST_Response(['success' => false, 'message' => 'نوشته یافت نشد.'], 404);
            }

            $ratings = $this->get_post_ranking($post_id);
            $html = $this->render_full_dashboard_html($post_id, $ratings);

            return new \WP_REST_Response([
                'success'    => true,
                'post_id'    => $post_id,
                'post_title' => $post->post_title,
                'edit_link'  => get_edit_post_link($post_id, ''),
                'html'       => $html,
            ], 200);
        } catch (\Throwable $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'خطا در تولید اطلاعات مودال: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function handle_rest_reanalyze(\WP_REST_Request $request): \WP_REST_Response {
        try {
            $post_id = (int) $request->get_param('id');
            $post = get_post($post_id);
            if (!$post) {
                return new \WP_REST_Response(['success' => false, 'message' => 'نوشته یافت نشد.'], 404);
            }

            $ratings = $this->analyze_and_save_post($post_id);
            $cell_html = $this->render_ranking_cell_html($post_id, $ratings);
            $dashboard_html = $this->render_full_dashboard_html($post_id, $ratings);

            $post = get_post($post_id);
            if ($post && class_exists('OmniAI\\Database\\Log_Repository')) {
                Log_Repository::insert_log(
                    get_current_user_id(),
                    "تحلیل و محاسبه مجدد رتبه محتوا (SEO / AEO / GEO) برای نوشته: «{$post->post_title}» (شناسه: #{$post_id})",
                    "ارزیابی مجدد با موفقیت انجام شد:\n• سئو ارگانیک: {$ratings['seo']['score']}%\n• موتور پاسخگو (AEO): {$ratings['aeo']['score']}%\n• هوش مصنوعی (GEO): {$ratings['geo']['score']}%\n• میانگین کل: {$ratings['avg_score']}%",
                    'Content Ranking',
                    'Analyzer Engine',
                    0
                );
            }

            return new \WP_REST_Response([
                'success'        => true,
                'post_id'        => $post_id,
                'ratings'        => $ratings,
                'cell_html'      => $cell_html,
                'dashboard_html' => $dashboard_html,
            ], 200);
        } catch (\Throwable $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'خطا در ارزیابی نوشته: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function handle_rest_get_posts(\WP_REST_Request $request): \WP_REST_Response {
        $search       = sanitize_text_field($request->get_param('search') ?? '');
        $score_filter = sanitize_text_field($request->get_param('score_filter') ?? 'all');
        $min_score    = $request->get_param('min_score') !== null ? (int) $request->get_param('min_score') : 0;
        $max_score    = $request->get_param('max_score') !== null ? (int) $request->get_param('max_score') : 100;
        $metric       = sanitize_text_field($request->get_param('metric') ?? 'avg');
        $order        = strtolower(sanitize_text_field($request->get_param('order') ?? 'asc'));
        $order_by     = sanitize_text_field($request->get_param('order_by') ?? 'score');
        $status       = sanitize_text_field($request->get_param('status') ?? 'publish');
        $page         = max(1, (int) ($request->get_param('page') ?? 1));
        $per_page     = max(1, min(100, (int) ($request->get_param('per_page') ?? 15)));

        $query_args = [
            'post_type'      => 'post',
            'post_status'    => ($status === 'all') ? ['publish', 'draft', 'pending'] : $status,
            'posts_per_page' => -1,
            's'              => $search,
        ];

        $all_posts = get_posts($query_args);

        $items = [];
        $total_score_sum = 0;
        $critical_count  = 0;
        $warning_count   = 0;
        $good_count      = 0;

        foreach ($all_posts as $p) {
            $ratings = $this->get_post_ranking($p->ID);
            $avg = (int) ($ratings['avg_score'] ?? 0);
            $seo = (int) ($ratings['seo']['score'] ?? 0);
            $aeo = (int) ($ratings['aeo']['score'] ?? 0);
            $geo = (int) ($ratings['geo']['score'] ?? 0);
            $readability = (int) ($ratings['readability']['score'] ?? 0);

            $total_score_sum += $avg;
            if ($avg < 50) {
                $critical_count++;
            } elseif ($avg < 80) {
                $warning_count++;
            } else {
                $good_count++;
            }

            // فیلتر درصد
            $target_score = $avg;
            if ($metric === 'seo') $target_score = $seo;
            elseif ($metric === 'aeo') $target_score = $aeo;
            elseif ($metric === 'geo') $target_score = $geo;
            elseif ($metric === 'readability') $target_score = $readability;

            $include = true;
            if ($score_filter === 'under_50' && $target_score >= 50) {
                $include = false;
            } elseif ($score_filter === '50_to_79' && ($target_score < 50 || $target_score >= 80)) {
                $include = false;
            } elseif ($score_filter === 'over_80' && $target_score < 80) {
                $include = false;
            } elseif ($score_filter === 'custom' && ($target_score < $min_score || $target_score > $max_score)) {
                $include = false;
            }

            if ($include) {
                $categories = get_the_category($p->ID);
                $cat_names = !empty($categories) ? wp_list_pluck($categories, 'name') : [];

                $items[] = [
                    'id'          => $p->ID,
                    'title'       => $p->post_title ?: '(بدون عنوان)',
                    'date'        => get_the_date('Y/m/d', $p->ID),
                    'status'      => $p->post_status,
                    'author'      => get_the_author_meta('display_name', $p->post_author),
                    'categories'  => $cat_names,
                    'view_url'    => get_permalink($p->ID),
                    'edit_url'    => get_edit_post_link($p->ID, ''),
                    'scores'      => [
                        'avg'         => $avg,
                        'seo'         => $seo,
                        'aeo'         => $aeo,
                        'geo'         => $geo,
                        'readability' => $readability,
                    ],
                    'word_count'  => (int) ($ratings['word_count'] ?? 0),
                    'target_score'=> $target_score,
                ];
            }
        }

        // مرتب‌سازی
        usort($items, function($a, $b) use ($order_by, $order, $metric) {
            if ($order_by === 'score') {
                $valA = $a['scores'][$metric] ?? $a['scores']['avg'];
                $valB = $b['scores'][$metric] ?? $b['scores']['avg'];
                return $order === 'asc' ? ($valA <=> $valB) : ($valB <=> $valA);
            } elseif ($order_by === 'title') {
                return $order === 'asc' ? strcmp($a['title'], $b['title']) : strcmp($b['title'], $a['title']);
            }
            return $order === 'asc' ? ($a['id'] <=> $b['id']) : ($b['id'] <=> $a['id']);
        });

        $total_filtered = count($items);
        $total_pages    = max(1, (int) ceil($total_filtered / $per_page));
        $offset         = ($page - 1) * $per_page;
        $paged_items    = array_slice($items, $offset, $per_page);

        $total_all = count($all_posts);
        $site_avg  = $total_all > 0 ? round($total_score_sum / $total_all) : 0;

        return new \WP_REST_Response([
            'success'      => true,
            'posts'        => $paged_items,
            'total'        => $total_filtered,
            'total_pages'  => $total_pages,
            'page'         => $page,
            'per_page'     => $per_page,
            'summary'      => [
                'total_all'       => $total_all,
                'site_avg'        => $site_avg,
                'critical_count'  => $critical_count,
                'warning_count'   => $warning_count,
                'good_count'      => $good_count,
            ],
        ], 200);
    }

    public function handle_rest_analyze_all(\WP_REST_Request $request): \WP_REST_Response {
        $posts = get_posts([
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => 100,
        ]);
        $analyzed = 0;
        foreach ($posts as $p) {
            $this->analyze_and_save_post($p->ID);
            $analyzed++;
        }

        return new \WP_REST_Response([
            'success'  => true,
            'message'  => "تعداد {$analyzed} نوشته با موفقیت ارزیابی و ذخیره شدند.",
            'analyzed' => $analyzed,
        ], 200);
    }
    /* -------------------------------------------------------------
     *  Settings & LLMS.txt / Schema / AI Bots / MCP Handlers
     * ----------------------------------------------------------- */

    public function handle_rest_get_settings(): \WP_REST_Response {
        $defaults = [
            'enable_schemas'         => true,
            'enable_speakable'       => true,
            'enable_faq_schema'      => true,
            'enable_article_schema'  => true,
            'enable_howto_schema'    => true,
            'enable_review_schema'   => true,
            'enable_org_schema'      => true,
            'org_type'               => 'Organization',
            'org_name'               => get_bloginfo('name'),
            'org_logo'               => '',
            'org_phone'              => '',
            'org_price_range'        => '',
            'enable_breadcrumbs'     => true,
            'breadcrumb_separator'   => '»',
            'breadcrumbs_show_home'  => true,
            'breadcrumbs_home_label' => 'خانه',
            'auto_insert_breadcrumbs' => false,
            'enable_breadcrumb_schema' => true,
            'google_verify'          => '',
            'bing_verify'            => '',
            'pinterest_verify'       => '',
            'yandex_verify'          => '',
            'baidu_verify'           => '',
            'enable_llms_txt'        => true,
            'llms_site_summary'      => get_bloginfo('description') ?: 'مرجع تخصصی مقالات و راهنماهای کاربردی وب‌سایت',
            'llms_post_limit'        => 50,
            'enable_ai_bots_manager' => true,
            'ai_bots'                => [
                'GPTBot'          => 'allow',
                'ChatGPT-User'    => 'allow',
                'ClaudeBot'       => 'allow',
                'PerplexityBot'   => 'allow',
                'Google-Extended' => 'allow',
                'ByteSpider'      => 'disallow',
                'CCBot'           => 'disallow',
                'FacebookBot'     => 'allow',
                'cohere-ai'       => 'allow',
            ],
            'enable_mcp_server'      => true,
        ];
        $saved = get_option('omni_ai_ranking_settings', []);
        $settings = wp_parse_args(is_array($saved) ? $saved : [], $defaults);

        $mcp_url = rest_url('omni-ai/v1/mcp');

        $claude_config = [
            'mcpServers' => [
                'wordpress-omni-ai' => [
                    'url'  => $mcp_url,
                    'type' => 'http',
                ],
            ],
        ];

        $wp_site_url = $this->get_effective_site_url($settings);

        return new \WP_REST_Response([
            'success'  => true,
            'settings' => $settings,
            'urls'     => [
                'llms_txt'        => $wp_site_url . '/llms.txt',
                'llms_full_txt'   => $wp_site_url . '/llms-full.txt',
                'rest_llms_txt'   => rest_url('omni-ai/v1/llms.txt'),
                'rest_llms_full'  => rest_url('omni-ai/v1/llms-full.txt'),
                'robots_txt'      => $wp_site_url . '/robots.txt',
                'rest_robots_txt' => rest_url('omni-ai/v1/robots.txt'),
                'mcp_endpoint'    => $mcp_url,
                'detected_site'   => $wp_site_url,
            ],
            'sample_content'      => mb_substr($this->generate_llms_content(false), 0, 1200, 'UTF-8'),
            'generated_robots'    => $this->generate_ai_robots_preview($settings),
            'mcp_claude_config'   => wp_json_encode($claude_config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
        ], 200);
    }

    public function handle_rest_save_settings(\WP_REST_Request $request): \WP_REST_Response {
        $params = $request->get_json_params();
        if (empty($params)) {
            $raw_body = $request->get_body();
            if (!empty($raw_body)) {
                $params = json_decode($raw_body, true);
            }
        }
        if (empty($params)) {
            $params = $request->get_params();
        }
        if (!is_array($params)) {
            $params = [];
        }

        $saved = get_option('omni_ai_ranking_settings', []);

        $bots = $params['ai_bots'] ?? ($saved['ai_bots'] ?? []);
        if (!is_array($bots)) {
            $bots = [];
        }

        $clean_bots = [];
        $known_bots = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'ByteSpider', 'CCBot', 'FacebookBot', 'cohere-ai'];
        foreach ($known_bots as $b) {
            $rule = isset($bots[$b]) ? sanitize_text_field($bots[$b]) : 'allow';
            $clean_bots[$b] = in_array($rule, ['allow', 'disallow'], true) ? $rule : 'allow';
        }

        $custom_site_url = !empty($params['custom_site_url']) ? esc_url_raw(trim($params['custom_site_url'])) : '';

        $clean = [
            'enable_schemas'         => !empty($params['enable_schemas']),
            'enable_speakable'       => !empty($params['enable_speakable']),
            'enable_faq_schema'      => !empty($params['enable_faq_schema']),
            'enable_article_schema'  => !empty($params['enable_article_schema']),
            'enable_howto_schema'    => !empty($params['enable_howto_schema']),
            'enable_review_schema'   => !empty($params['enable_review_schema']),
            'enable_org_schema'      => !empty($params['enable_org_schema']),
            'org_type'               => sanitize_text_field($params['org_type'] ?? 'Organization'),
            'org_name'               => sanitize_text_field($params['org_name'] ?? get_bloginfo('name')),
            'org_logo'               => esc_url_raw($params['org_logo'] ?? ''),
            'org_phone'              => sanitize_text_field($params['org_phone'] ?? ''),
            'org_price_range'        => sanitize_text_field($params['org_price_range'] ?? ''),
            'enable_breadcrumbs'     => !empty($params['enable_breadcrumbs']),
            'breadcrumb_separator'   => sanitize_text_field($params['breadcrumb_separator'] ?? '»'),
            'breadcrumbs_show_home'  => !empty($params['breadcrumbs_show_home']),
            'breadcrumbs_home_label' => sanitize_text_field($params['breadcrumbs_home_label'] ?? 'خانه'),
            'auto_insert_breadcrumbs' => !empty($params['auto_insert_breadcrumbs']),
            'enable_breadcrumb_schema' => !empty($params['enable_breadcrumb_schema']),
            'google_verify'          => sanitize_text_field($params['google_verify'] ?? ''),
            'bing_verify'            => sanitize_text_field($params['bing_verify'] ?? ''),
            'pinterest_verify'       => sanitize_text_field($params['pinterest_verify'] ?? ''),
            'yandex_verify'          => sanitize_text_field($params['yandex_verify'] ?? ''),
            'baidu_verify'           => sanitize_text_field($params['baidu_verify'] ?? ''),
            'enable_llms_txt'        => !empty($params['enable_llms_txt']),
            'llms_site_summary'      => sanitize_textarea_field($params['llms_site_summary'] ?? ''),
            'llms_post_limit'        => max(10, min(200, (int) ($params['llms_post_limit'] ?? 50))),
            'enable_ai_bots_manager' => !empty($params['enable_ai_bots_manager']),
            'ai_bots'                => $clean_bots,
            'enable_mcp_server'      => !empty($params['enable_mcp_server']),
            'custom_site_url'        => $custom_site_url,
        ];

        update_option('omni_ai_ranking_settings', $clean, false);
        flush_rewrite_rules(false);

        $wp_site_url = $this->get_effective_site_url($clean);

        return new \WP_REST_Response([
            'success'          => true,
            'message'          => 'تنظیمات جامع هوش مصنوعی، ربات‌ها و اسکیما با موفقیت ذخیره گردید.',
            'settings'         => $clean,
            'urls'             => [
                'llms_txt'        => $wp_site_url . '/llms.txt',
                'llms_full_txt'   => $wp_site_url . '/llms-full.txt',
                'rest_llms_txt'   => rest_url('omni-ai/v1/llms.txt'),
                'rest_llms_full'  => rest_url('omni-ai/v1/llms-full.txt'),
                'robots_txt'      => $wp_site_url . '/robots.txt',
                'rest_robots_txt' => rest_url('omni-ai/v1/robots.txt'),
                'mcp_endpoint'    => rest_url('omni-ai/v1/mcp'),
                'detected_site'   => $wp_site_url,
            ],
            'generated_robots' => $this->generate_ai_robots_preview($clean),
        ], 200);
    }

    /* --- AI Bots Manager (robots.txt filter & REST API) --- */

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

    /* --- MCP (Model Context Protocol) JSON-RPC 2.0 Server --- */

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
        if (!is_array($logs)) { $logs = []; }
        array_unshift($logs, $log_entry);
        if (count($logs) > 40) { $logs = array_slice($logs, 0, 40); }
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

    private function dispatch_single_mcp_message(array $body): array {
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
                        'tools' => [
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
                        ],
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
                if ($uri === 'omni://llms.txt') {
                    $text = $this->generate_llms_content(false);
                } elseif ($uri === 'omni://llms-full.txt') {
                    $text = $this->generate_llms_content(true);
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

    private function execute_mcp_tool(string $name, array $args): string {
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
                return $this->generate_llms_content(false);

            case 'get_content_ranking':
                $post_id = (int) ($args['id'] ?? 0);
                $post = get_post($post_id);
                if (!$post) {
                    return "نوشته یافت نشد.";
                }
                $r = $this->get_post_ranking($post_id);
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
                            $cat_ids[] = self::resolve_canonical_category($cname);
                        }
                    }
                }
                if (empty($cat_ids)) {
                    // در صورت تعیین نشدن، به صورت خودکار به دسته ترندها و تازه‌های فناوری منتسب می‌شود
                    $cat_ids[] = self::resolve_canonical_category('tech-trends');
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
                $ratings = $this->analyze_and_save_post($post_id);
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
                $sync_result = self::sync_canonical_categories();
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

    private function attach_image_to_post(int $post_id, string $image_base64, string $filename = 'featured-image.jpg', array $meta = []): array {
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

    /* --- Frontend Schema.org JSON-LD Output (AEO / GEO / Breadcrumbs / Rich Snippets) --- */

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

    private function extract_faqs_for_schema(string $content): array {
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
