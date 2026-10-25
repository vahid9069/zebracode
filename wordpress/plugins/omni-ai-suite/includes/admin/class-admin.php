<?php
namespace OmniAI\Admin;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles WordPress admin registration, menu, and SPA asset enqueueing.
 */
class Admin {
    public const MENU_SLUG = 'omni-ai-suite';

    public function init(): void {
        add_action('admin_init', ['\\OmniAI\\Activator', 'create_custom_tables']);
        add_action('admin_menu', [$this, 'register_menu_pages']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
    }

    public function register_menu_pages(): void {
        $locale = get_user_locale();
        $is_fa = str_starts_with($locale, 'fa') || is_rtl();

        add_menu_page(
            $is_fa ? 'امنی ای‌آی سوئیت' : 'Omni AI Suite',
            $is_fa ? 'هوش مصنوعی (Omni AI)' : 'Omni AI',
            'edit_posts',
            self::MENU_SLUG,
            [$this, 'render_admin_app'],
            'dashicons-superhero',
            30
        );

        add_submenu_page(
            self::MENU_SLUG,
            $is_fa ? 'پیشخوان هوش مصنوعی' : 'Dashboard',
            $is_fa ? 'پیشخوان' : 'Dashboard',
            'edit_posts',
            self::MENU_SLUG,
            [$this, 'render_admin_app']
        );

        add_submenu_page(
            self::MENU_SLUG,
            $is_fa ? 'استودیو تولید محتوا' : 'Content Studio',
            $is_fa ? 'استودیو محتوا' : 'Content Studio',
            'edit_posts',
            self::MENU_SLUG . '#/studio',
            [$this, 'render_admin_app']
        );

        add_submenu_page(
            self::MENU_SLUG,
            $is_fa ? 'تولید انبوه مقالات' : 'Bulk Generator',
            $is_fa ? 'تولید انبوه پست' : 'Bulk Generator',
            'publish_posts',
            self::MENU_SLUG . '#/bulk',
            [$this, 'render_admin_app']
        );

        add_submenu_page(
            self::MENU_SLUG,
            $is_fa ? 'تاریخچه و لاگ‌های تولید' : 'History & Logs',
            $is_fa ? 'تاریخچه و لاگ‌ها' : 'History & Logs',
            'edit_posts',
            self::MENU_SLUG . '#/logs',
            [$this, 'render_admin_app']
        );

        add_submenu_page(
            self::MENU_SLUG,
            $is_fa ? 'مدیریت ماژول‌ها' : 'Modules Manager',
            $is_fa ? 'مدیریت ماژول‌ها' : 'Modules',
            'manage_options',
            self::MENU_SLUG . '#/modules',
            [$this, 'render_admin_app']
        );

        add_submenu_page(
            self::MENU_SLUG,
            $is_fa ? 'تنظیمات کلیدهای هوش مصنوعی' : 'API Settings',
            $is_fa ? 'تنظیمات (BYOK)' : 'Settings (BYOK)',
            'manage_options',
            self::MENU_SLUG . '#/settings',
            [$this, 'render_admin_app']
        );
    }

    public function enqueue_admin_assets(string $hook): void {
        // Enqueue ONLY on the Omni AI Suite admin screens to avoid polluting the rest of WP Admin
        if (!str_contains($hook, self::MENU_SLUG)) {
            return;
        }

        // Native WordPress UI components stylesheet
        wp_enqueue_style('wp-components');

        // Scoped Tailwind stylesheet (preflight disabled, scoped to .omni-ai-admin-wrap)
        $css_path = OMNI_AI_PATH . 'assets/css/admin.css';
        $css_ver = file_exists($css_path) ? (string) filemtime($css_path) : OMNI_AI_VERSION;
        wp_enqueue_style(
            'omni-ai-admin-style',
            OMNI_AI_URL . 'assets/css/admin.css',
            ['wp-components'],
            $css_ver
        );

        // Core WordPress script dependencies
        $deps = [
            'wp-element',
            'wp-components',
            'wp-i18n',
            'wp-api-fetch',
            'wp-url',
            'wp-html-entities',
        ];

        // Check if generated asset dependency file exists
        $asset_file = OMNI_AI_PATH . 'assets/js/admin.asset.php';
        if (file_exists($asset_file)) {
            $asset = include $asset_file;
            $deps = $asset['dependencies'] ?? $deps;
        }

        $js_path = OMNI_AI_PATH . 'assets/js/admin.js';
        $version = file_exists($js_path) ? (string) filemtime($js_path) : OMNI_AI_VERSION;

        wp_enqueue_script(
            'omni-ai-admin-app',
            OMNI_AI_URL . 'assets/js/admin.js',
            $deps,
            $version,
            true
        );

        // Load script translations for i18n
        if (function_exists('wp_set_script_translations')) {
            wp_set_script_translations('omni-ai-admin-app', 'omni-ai-suite', OMNI_AI_PATH . 'languages');
        }

        $user_locale = get_user_locale();
        $is_persian = str_starts_with($user_locale, 'fa');

        // Pass localized data without exposing any sensitive API keys
        wp_localize_script('omni-ai-admin-app', 'omniAiData', [
            'restUrl'     => esc_url_raw(rest_url('omni-ai/v1/')),
            'nonce'       => wp_create_nonce('wp_rest'),
            'locale'      => $user_locale,
            'isRtl'       => is_rtl() || $is_persian,
            'defaultLang' => $is_persian ? 'fa' : 'en',
            'currentUser' => [
                'id'          => get_current_user_id(),
                'name'        => wp_get_current_user()->display_name,
                'canManage'   => current_user_can('manage_options'),
                'canPublish'  => current_user_can('publish_posts'),
            ],
            'pluginUrl'   => OMNI_AI_URL,
            'version'     => OMNI_AI_VERSION,
        ]);
    }

    public function render_admin_app(): void {
        ?>
        <div class="wrap omni-ai-admin-wrap">
            <div id="omni-ai-admin-root">
                <div style="padding: 40px 20px; text-align: center; color: #555;">
                    <span class="spinner is-active" style="float: none; margin-bottom: 12px;"></span>
                    <p><?php esc_html_e('Loading Omni AI Suite React Dashboard...', 'omni-ai-suite'); ?></p>
                </div>
            </div>
        </div>
        <?php
    }
}
