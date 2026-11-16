<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Security & REST API Management Module.
 * Provides granular REST API route blocking, IP whitelisting,
 * username enumeration protection, XML-RPC disablement, and WP hardening.
 */
class Security_Module implements Module_Interface {
    public const OPTION_NAME = 'omni_ai_security_settings';

    public function get_id(): string {
        return 'security';
    }

    public function get_title(): string {
        return __('امنیت و REST API', 'omni-ai-suite');
    }

    public function get_description(): string {
        return __('مدیریت دسترسی به اندپوینت‌های REST API، مسدودسازی آی‌پی، حفاظت از نام‌های کاربری و امن‌سازی وردپرس.', 'omni-ai-suite');
    }

    public function is_active(): bool {
        return true; // Core security module is always active
    }

    public static function get_settings(): array {
        $defaults = [
            'disable_xmlrpc'           => true,
            'block_user_enumeration'   => true,
            'hide_wp_version'          => true,
            'disable_file_edit'        => false,
            'security_headers'         => true,
            'require_rest_auth'        => false,
            'global_ip_whitelist'      => '',
            'routes_config'            => [],
            // تنظیمات مخفی‌سازی و تغییر آدرس ورود به وردپرس (Hide Login)
            'enable_hide_login'        => false,
            'custom_login_slug'        => '',
            'hide_login_redirect_slug' => '404',
            'hide_login_recovery_key'  => '',
        ];
        $stored = get_option(self::OPTION_NAME, []);
        $settings = is_array($stored) ? wp_parse_args($stored, $defaults) : $defaults;

        if (empty($settings['hide_login_recovery_key'])) {
            $settings['hide_login_recovery_key'] = wp_generate_password(16, false);
            update_option(self::OPTION_NAME, $settings, false);
        }

        return $settings;
    }

    public static function save_settings(array $settings): bool {
        return update_option(self::OPTION_NAME, $settings, false);
    }

    public function register(): void {
        $settings = self::get_settings();

        // 1. Enforce REST API access controls (IP whitelist, route disablement, user restriction)
        add_filter('rest_pre_dispatch', [$this, 'filter_rest_requests'], 10, 3);

        // 2. Disable XML-RPC if enabled
        if (!empty($settings['disable_xmlrpc'])) {
            add_filter('xmlrpc_enabled', '__return_false', 999);
            add_filter('xmlrpc_methods', '__return_empty_array', 999);
            remove_action('wp_head', 'rsd_link');
            remove_action('wp_head', 'wlwmanifest_link');
        }

        // 3. Block Username Enumeration (/wp/v2/users & ?author=N)
        if (!empty($settings['block_user_enumeration'])) {
            add_action('template_redirect', [$this, 'block_author_query_scan']);
        }

        // 4. Hide WordPress Version in HTML & Asset URLs
        if (!empty($settings['hide_wp_version'])) {
            remove_action('wp_head', 'wp_generator');
            add_filter('the_generator', '__return_empty_string');
            add_filter('style_loader_src', [$this, 'remove_ver_query'], 9999);
            add_filter('script_loader_src', [$this, 'remove_ver_query'], 9999);
        }

        // 5. Disable In-Dashboard File Editing
        if (!empty($settings['disable_file_edit'])) {
            if (!defined('DISALLOW_FILE_EDIT')) {
                define('DISALLOW_FILE_EDIT', true);
            }
        }

        // 6. Security Headers
        if (!empty($settings['security_headers'])) {
            add_action('send_headers', [$this, 'send_security_headers']);
        }

        // 7. Hide & Custom Login URL
        if (!empty($settings['enable_hide_login']) && !empty($settings['custom_login_slug'])) {
            $this->setup_hide_login($settings);
        }
    }

    /**
     * Configure hooks for Hide Login URL functionality.
     */
    private function setup_hide_login(array $settings): void {
        add_filter('site_url', [$this, 'filter_site_url'], 999, 3);
        add_filter('network_site_url', [$this, 'filter_network_site_url'], 999, 3);
        add_filter('wp_redirect', [$this, 'filter_wp_redirect'], 999, 2);
        add_filter('login_url', [$this, 'filter_login_url'], 999, 3);
        add_filter('lostpassword_url', [$this, 'filter_lostpassword_url'], 999, 2);
        add_filter('logout_url', [$this, 'filter_logout_url'], 999, 2);
        add_filter('register_url', [$this, 'filter_register_url'], 999);

        // Intercept requests early on wp_loaded
        add_action('wp_loaded', [$this, 'handle_custom_login_request'], 1);
    }

    public function filter_site_url(string $url, string $path, ?string $scheme = null): string {
        $settings = self::get_settings();
        if (empty($settings['enable_hide_login']) || empty($settings['custom_login_slug'])) {
            return $url;
        }

        if (str_contains($url, 'wp-login.php')) {
            return str_replace('wp-login.php', $settings['custom_login_slug'], $url);
        }

        return $url;
    }

    public function filter_network_site_url(string $url, string $path, ?string $scheme = null): string {
        $settings = self::get_settings();
        if (empty($settings['enable_hide_login']) || empty($settings['custom_login_slug'])) {
            return $url;
        }

        if (str_contains($url, 'wp-login.php')) {
            return str_replace('wp-login.php', $settings['custom_login_slug'], $url);
        }

        return $url;
    }

    public function filter_wp_redirect(string $location, int $status): string {
        $settings = self::get_settings();
        if (empty($settings['enable_hide_login']) || empty($settings['custom_login_slug'])) {
            return $location;
        }

        if (str_contains($location, 'wp-login.php')) {
            return str_replace('wp-login.php', $settings['custom_login_slug'], $location);
        }

        return $location;
    }

    public function filter_login_url(string $login_url, string $redirect, bool $force_reauth): string {
        $settings = self::get_settings();
        if (empty($settings['enable_hide_login']) || empty($settings['custom_login_slug'])) {
            return $login_url;
        }

        return str_replace('wp-login.php', $settings['custom_login_slug'], $login_url);
    }

    public function filter_lostpassword_url(string $lostpassword_url, string $redirect): string {
        $settings = self::get_settings();
        if (empty($settings['enable_hide_login']) || empty($settings['custom_login_slug'])) {
            return $lostpassword_url;
        }

        return str_replace('wp-login.php', $settings['custom_login_slug'], $lostpassword_url);
    }

    public function filter_logout_url(string $logout_url, string $redirect): string {
        $settings = self::get_settings();
        if (empty($settings['enable_hide_login']) || empty($settings['custom_login_slug'])) {
            return $logout_url;
        }

        return str_replace('wp-login.php', $settings['custom_login_slug'], $logout_url);
    }

    public function filter_register_url(string $register_url): string {
        $settings = self::get_settings();
        if (empty($settings['enable_hide_login']) || empty($settings['custom_login_slug'])) {
            return $register_url;
        }

        return str_replace('wp-login.php', $settings['custom_login_slug'], $register_url);
    }

    public function handle_custom_login_request(): void {
        $settings = self::get_settings();
        $slug = $settings['custom_login_slug'] ?? '';
        if (empty($settings['enable_hide_login']) || empty($slug)) {
            return;
        }

        // Emergency bypass constant (can be set in wp-config.php)
        if (defined('OMNI_DISABLE_HIDE_LOGIN') && OMNI_DISABLE_HIDE_LOGIN) {
            return;
        }

        // Emergency recovery key check (?omni_recovery=XYZ)
        $recovery_key = $settings['hide_login_recovery_key'] ?? '';
        if (!empty($recovery_key) && isset($_GET['omni_recovery']) && hash_equals($recovery_key, (string) $_GET['omni_recovery'])) {
            return;
        }

        $request_uri = $_SERVER['REQUEST_URI'] ?? '';
        $raw_path = wp_parse_url($request_uri, PHP_URL_PATH) ?: '';
        $path = untrailingslashit(trim($raw_path, '/'));

        // Handle sub-directory WordPress installations (e.g. example.com/site/secret-login)
        $site_path = untrailingslashit(trim(wp_parse_url(home_url(), PHP_URL_PATH) ?: '', '/'));
        if (!empty($site_path) && str_starts_with($path, $site_path)) {
            $path = untrailingslashit(trim(substr($path, strlen($site_path)), '/'));
        }

        // 1. User is accessing the custom login slug
        if ($path === $slug) {
            $action = $_REQUEST['action'] ?? '';

            // If user is logged in and NOT logging out or doing postpass, redirect to admin dashboard
            if (is_user_logged_in() && !in_array($action, ['logout', 'postpass'], true)) {
                wp_safe_redirect(admin_url());
                exit;
            }

            // Tell WordPress we are executing wp-login.php
            $GLOBALS['pagenow'] = 'wp-login.php';
            status_header(200);

            require_once ABSPATH . 'wp-login.php';
            exit;
        }

        // 2. Block direct access to wp-login.php
        if (str_contains($raw_path, 'wp-login.php')) {
            // Allow AJAX, REST API, or post password verification
            if (wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST)) {
                return;
            }

            if (isset($_GET['action']) && $_GET['action'] === 'postpass') {
                return;
            }

            $this->block_unauthorized_access($settings);
        }

        // 3. Block unauthenticated access to wp-admin (so secret slug is never exposed to visitors/bots)
        $is_admin_request = is_admin() || str_contains($raw_path, 'wp-admin');
        if ($is_admin_request && !is_user_logged_in()) {
            if (wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST)) {
                return;
            }

            // Allow front-end AJAX requests hitting admin-ajax.php
            if (str_contains($raw_path, 'admin-ajax.php')) {
                return;
            }

            $this->block_unauthorized_access($settings);
        }
    }

    /**
     * Send 404 header and template or redirect to configured slug.
     */
    private function block_unauthorized_access(array $settings): void {
        $redirect_target = $settings['hide_login_redirect_slug'] ?? '404';
        if ($redirect_target === '404') {
            status_header(404);
            nocache_headers();
            $template_404 = get_404_template();
            if ($template_404 && file_exists($template_404)) {
                include $template_404;
            } else {
                wp_die(__('برگه مورد نظر یافت نشد.', 'omni-ai-suite'), '404 Not Found', ['response' => 404]);
            }
            exit;
        } else {
            wp_safe_redirect(home_url('/' . ltrim($redirect_target, '/')));
            exit;
        }
    }

    /**
     * Get real client IP address considering proxy headers.
     */
    public static function get_client_ip(): string {
        $headers = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',  // Proxies / Load Balancers
            'HTTP_CLIENT_IP',
            'REMOTE_ADDR'
        ];

        foreach ($headers as $h) {
            if (!empty($_SERVER[$h])) {
                $raw = (string) $_SERVER[$h];
                if (str_contains($raw, ',')) {
                    $parts = explode(',', $raw);
                    $ip = trim($parts[0]);
                } else {
                    $ip = trim($raw);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }

    /**
     * Check if given IP matches a whitelist (supports single IPs and CIDR ranges).
     */
    public static function is_ip_whitelisted(string $client_ip, string $whitelist_str): bool {
        $whitelist = array_filter(array_map('trim', explode("\n", str_replace([',', ';'], "\n", $whitelist_str))));
        if (empty($whitelist)) {
            return false;
        }

        foreach ($whitelist as $allowed) {
            if ($allowed === '*' || $allowed === $client_ip) {
                return true;
            }
            // Subnet CIDR match (e.g. 192.168.1.0/24)
            if (str_contains($allowed, '/')) {
                [$subnet, $bits] = explode('/', $allowed);
                if (filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && is_numeric($bits)) {
                    $ip_long = ip2long($client_ip);
                    $sub_long = ip2long($subnet);
                    if ($ip_long !== false && $sub_long !== false) {
                        $mask = -1 << (32 - (int)$bits);
                        if (($ip_long & $mask) === ($sub_long & $mask)) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    /**
     * Intercept and filter all REST API requests.
     */
    public function filter_rest_requests($result, $server, $request) {
        if (!($request instanceof \WP_REST_Request)) {
            return $result;
        }

        $route = $request->get_route();
        $settings = self::get_settings();
        $client_ip = self::get_client_ip();
        $is_admin = current_user_can('manage_options');

        // Whitelist Omni AI Suite plugin admin calls for admins to avoid self-lockout
        if ($is_admin && str_starts_with($route, '/omni-ai/v1/')) {
            return $result;
        }

        // Global IP Whitelist check
        $global_whitelist = trim($settings['global_ip_whitelist'] ?? '');
        $is_globally_whitelisted = !empty($global_whitelist) && self::is_ip_whitelisted($client_ip, $global_whitelist);

        // 1. Anti-Username Enumeration: Restrict /wp/v2/users for non-authenticated guests
        if (!empty($settings['block_user_enumeration'])) {
            if (str_starts_with($route, '/wp/v2/users') && !is_user_logged_in() && !$is_globally_whitelisted) {
                return new \WP_Error(
                    'rest_forbidden_user_enum',
                    __('دسترسی به فهرست کاربران برای عموم مسدود است.', 'omni-ai-suite'),
                    ['status' => 403]
                );
            }
        }

        // 2. Global REST Authentication requirement (except login/public endpoints)
        if (!empty($settings['require_rest_auth']) && !is_user_logged_in() && !$is_globally_whitelisted) {
            // Check if this specific route is explicitly configured as public in routes_config
            $routes_config = $settings['routes_config'] ?? [];
            $route_explicitly_public = false;
            if (is_array($routes_config)) {
                foreach ($routes_config as $target_pattern => $cfg) {
                    if (empty($cfg) || !is_array($cfg)) continue;
                    $matched = ($route === $target_pattern);
                    if (!$matched && str_ends_with($target_pattern, '*')) {
                        $prefix = rtrim($target_pattern, '*');
                        $matched = str_starts_with($route, $prefix);
                    }
                    if ($matched) {
                        // If admin configured this route as public (not requiring auth and not disabled)
                        if (empty($cfg['require_auth']) && empty($cfg['disabled'])) {
                            $route_explicitly_public = true;
                            break;
                        }
                    }
                }
            }

            // Essential public endpoints for headless blog and embeds
            $default_public = [
                '/oembed/1.0/embed',
                '/omni-ai/v1',
                '/omni-ai/v1/posts',
                '/omni-ai/v1/categories',
            ];
            $public_allowed = apply_filters('omni_ai_public_rest_routes', $default_public);
            $is_public = $route_explicitly_public;

            if (!$is_public) {
                foreach ($public_allowed as $pub) {
                    if ($route === $pub || str_starts_with($route, rtrim($pub, '/') . '/')) {
                        $is_public = true;
                        break;
                    }
                }
            }

            if (!$is_public) {
                return new \WP_Error(
                    'rest_auth_required',
                    __('دسترسی به این اندپوینت نیازمند ورود به حساب کاربری است.', 'omni-ai-suite'),
                    ['status' => 401]
                );
            }
        }

        // 3. Per-Route Specific Rules
        $routes_config = $settings['routes_config'] ?? [];
        if (is_array($routes_config) && !empty($routes_config)) {
            foreach ($routes_config as $target_pattern => $cfg) {
                if (empty($cfg) || !is_array($cfg)) continue;

                // Match exact or prefix route
                $matched = ($route === $target_pattern);
                if (!$matched && str_ends_with($target_pattern, '*')) {
                    $prefix = rtrim($target_pattern, '*');
                    $matched = str_starts_with($route, $prefix);
                }

                if ($matched) {
                    // Check if route is disabled
                    if (!empty($cfg['disabled'])) {
                        // Allow if admin or specifically IP whitelisted
                        $route_whitelist = trim($cfg['ip_whitelist'] ?? '');
                        $has_ip_access = (!empty($route_whitelist) && self::is_ip_whitelisted($client_ip, $route_whitelist)) || $is_globally_whitelisted;

                        if (!$has_ip_access) {
                            return new \WP_Error(
                                'rest_route_disabled',
                                __('این اندپوینت REST API توسط مدیر سایت غیرفعال شده است.', 'omni-ai-suite'),
                                ['status' => 403]
                            );
                        }
                    }

                    // Check if route requires authentication
                    if (!empty($cfg['require_auth']) && !is_user_logged_in()) {
                        return new \WP_Error(
                            'rest_route_auth_required',
                            __('دسترسی به این مسیر فقط برای اعضای سایت مجاز است.', 'omni-ai-suite'),
                            ['status' => 401]
                        );
                    }

                    // Check route-specific IP whitelist if specified and route is active
                    $route_ip_whitelist = trim($cfg['ip_whitelist'] ?? '');
                    if (!empty($route_ip_whitelist)) {
                        if (!self::is_ip_whitelisted($client_ip, $route_ip_whitelist) && !$is_globally_whitelisted && !$is_admin) {
                            return new \WP_Error(
                                'rest_ip_blocked',
                                __('آی‌پی شما اجازه دسترسی به این اندپوینت را ندارد.', 'omni-ai-suite'),
                                ['status' => 403]
                            );
                        }
                    }
                    break;
                }
            }
        }

        return $result;
    }

    /**
     * Prevent scanning author usernames via URL parameters like ?author=1
     */
    public function block_author_query_scan(): void {
        if (!is_admin() && !is_user_logged_in() && isset($_GET['author'])) {
            wp_safe_redirect(home_url(), 301);
            exit;
        }
    }

    /**
     * Strip WordPress query version strings from CSS & JS.
     */
    public function remove_ver_query(string $src): string {
        if (str_contains($src, 'ver=')) {
            $src = remove_query_arg('ver', $src);
        }
        return $src;
    }

    /**
     * Add essential security HTTP response headers.
     */
    public function send_security_headers(): void {
        if (!headers_sent()) {
            header('X-Content-Type-Options: nosniff');
            header('X-Frame-Options: SAMEORIGIN');
            header('X-XSS-Protection: 1; mode=block');
            header('Referrer-Policy: strict-origin-when-cross-origin');
        }
    }
}
