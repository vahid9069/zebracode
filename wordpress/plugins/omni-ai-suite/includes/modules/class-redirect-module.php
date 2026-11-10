<?php
namespace OmniAI\Modules;

use OmniAI\Database\Redirect_Repository;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * 301/302 Redirection & 404 Monitor Module
 */
class Redirect_Module implements Module_Interface {
    public function get_id(): string {
        return 'redirect';
    }

    public function get_title(): string {
        return __('Redirections & 404 Monitor', 'omni-ai-suite');
    }

    public function get_description(): string {
        return __('Manage 301/302 redirects, auto-redirect on slug change, and track 404 errors.', 'omni-ai-suite');
    }

    public function is_active(): bool {
        $states = get_option('omni_ai_modules', []);
        return isset($states['redirect']) ? (bool) $states['redirect'] : true;
    }

    public function register(): void {
        // Ensure database tables exist
        Redirect_Repository::maybe_create_tables();

        // 1. Intercept incoming requests for redirects and 404 monitoring
        add_action('template_redirect', [$this, 'handle_template_redirect'], 1);

        // 2. Auto-create 301 redirect when a published post slug changes
        add_action('post_updated', [$this, 'handle_post_slug_change'], 10, 3);

        // 3. Register REST API routes
        add_action('rest_api_init', [$this, 'register_rest_routes']);
    }

    /**
     * Intercept front-end requests for redirects and 404 tracking.
     */
    public function handle_template_redirect(): void {
        if (is_admin() || wp_doing_ajax() || wp_doing_cron() || (defined('REST_REQUEST') && REST_REQUEST)) {
            return;
        }

        $request_uri = isset($_SERVER['REQUEST_URI']) ? sanitize_text_field(wp_unslash($_SERVER['REQUEST_URI'])) : '';
        if (empty($request_uri)) {
            return;
        }

        // Check for matching redirect rule
        $redirect = Redirect_Repository::match_redirect($request_uri);
        if ($redirect) {
            $status = (int) $redirect['status_code'];
            $target = trim($redirect['target_url']);

            // Support relative targets
            if (!str_starts_with($target, 'http://') && !str_starts_with($target, 'https://')) {
                $target = home_url($target);
            }

            wp_redirect($target, $status);
            exit;
        }

        // Track 404 errors if page is not found
        if (is_404()) {
            $referer = isset($_SERVER['HTTP_REFERER']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_REFERER'])) : '';
            $ip = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : '';
            $ua = isset($_SERVER['HTTP_USER_AGENT']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_USER_AGENT'])) : '';

            Redirect_Repository::log_404($request_uri, $referer, $ip, $ua);
        }
    }

    /**
     * Auto 301 redirect when a published post/page slug is updated.
     */
    public function handle_post_slug_change(int $post_id, \WP_Post $post_after, \WP_Post $post_before): void {
        // Only track published posts
        if ($post_before->post_status !== 'publish' || $post_after->post_status !== 'publish') {
            return;
        }

        // Only track if slug actually changed
        if ($post_before->post_name === $post_after->post_name || empty($post_before->post_name)) {
            return;
        }

        // Get old and new relative paths
        $old_permalink = get_permalink($post_before);
        $new_permalink = get_permalink($post_after);

        if (!$old_permalink || !$new_permalink || $old_permalink === $new_permalink) {
            return;
        }

        $old_path = wp_parse_url($old_permalink, PHP_URL_PATH);
        $new_path = wp_parse_url($new_permalink, PHP_URL_PATH);

        if ($old_path && $new_path && $old_path !== $new_path) {
            Redirect_Repository::add_redirect($old_path, $new_path, 301, 'exact');
        }
    }

    /**
     * Register REST API routes.
     */
    public function register_rest_routes(): void {
        register_rest_route('omni-ai/v1', '/redirects', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'rest_get_redirects'],
                'permission_callback' => [$this, 'rest_permissions_check'],
            ],
            [
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'rest_save_redirect'],
                'permission_callback' => [$this, 'rest_permissions_check'],
            ],
        ]);

        register_rest_route('omni-ai/v1', '/redirects/(?P<id>\d+)', [
            'methods'             => \WP_REST_Server::DELETABLE,
            'callback'            => [$this, 'rest_delete_redirect'],
            'permission_callback' => [$this, 'rest_permissions_check'],
        ]);

        register_rest_route('omni-ai/v1', '/404s', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'rest_get_404s'],
            'permission_callback' => [$this, 'rest_permissions_check'],
        ]);

        register_rest_route('omni-ai/v1', '/404s/(?P<id>\d+)', [
            'methods'             => \WP_REST_Server::DELETABLE,
            'callback'            => [$this, 'rest_delete_404'],
            'permission_callback' => [$this, 'rest_permissions_check'],
        ]);

        register_rest_route('omni-ai/v1', '/404s/clear', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'rest_clear_404s'],
            'permission_callback' => [$this, 'rest_permissions_check'],
        ]);

        register_rest_route('omni-ai/v1', '/404s/to-redirect', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'rest_convert_404_to_redirect'],
            'permission_callback' => [$this, 'rest_permissions_check'],
        ]);
    }

    public function rest_permissions_check(): bool {
        return current_user_can('manage_options');
    }

    public function rest_get_redirects(\WP_REST_Request $request): \WP_REST_Response {
        $limit  = max(1, min(100, (int) $request->get_param('limit') ?: 20));
        $page   = max(1, (int) $request->get_param('page') ?: 1);
        $search = sanitize_text_field((string) $request->get_param('search'));
        $offset = ($page - 1) * $limit;

        $data = Redirect_Repository::get_redirects($limit, $offset, $search);

        return new \WP_REST_Response([
            'success'     => true,
            'items'       => $data['items'],
            'total'       => $data['total'],
            'total_pages' => ceil($data['total'] / $limit),
            'page'        => $page,
        ], 200);
    }

    public function rest_save_redirect(\WP_REST_Request $request): \WP_REST_Response {
        $source      = sanitize_text_field((string) $request->get_param('source_url'));
        $target      = sanitize_text_field((string) $request->get_param('target_url'));
        $status_code = (int) $request->get_param('status_code') ?: 301;
        $match_type  = sanitize_text_field((string) $request->get_param('match_type') ?: 'exact');

        if (empty($source) || empty($target)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'آدرس مبدأ و مقصد هر دو الزامی هستند.',
            ], 400);
        }

        $id = Redirect_Repository::add_redirect($source, $target, $status_code, $match_type);
        if (!$id) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'خطا در ثبت ریدایرکت.',
            ], 500);
        }

        return new \WP_REST_Response([
            'success' => true,
            'id'      => $id,
            'message' => 'تغییر مسیر با موفقیت ذخیره شد.',
        ], 200);
    }

    public function rest_delete_redirect(\WP_REST_Request $request): \WP_REST_Response {
        $id = (int) $request->get_param('id');
        $deleted = Redirect_Repository::delete_redirect($id);

        return new \WP_REST_Response([
            'success' => $deleted,
            'message' => $deleted ? 'تغییر مسیر با موفقیت حذف شد.' : 'خطا در حذف.',
        ], $deleted ? 200 : 400);
    }

    public function rest_get_404s(\WP_REST_Request $request): \WP_REST_Response {
        $limit  = max(1, min(100, (int) $request->get_param('limit') ?: 20));
        $page   = max(1, (int) $request->get_param('page') ?: 1);
        $search = sanitize_text_field((string) $request->get_param('search'));
        $offset = ($page - 1) * $limit;

        $data = Redirect_Repository::get_404_logs($limit, $offset, $search);

        return new \WP_REST_Response([
            'success'     => true,
            'items'       => $data['items'],
            'total'       => $data['total'],
            'total_pages' => ceil($data['total'] / $limit),
            'page'        => $page,
        ], 200);
    }

    public function rest_delete_404(\WP_REST_Request $request): \WP_REST_Response {
        $id = (int) $request->get_param('id');
        $deleted = Redirect_Repository::delete_404($id);

        return new \WP_REST_Response([
            'success' => $deleted,
            'message' => $deleted ? 'لاگ ۴۰۴ با موفقیت حذف شد.' : 'خطا در حذف.',
        ], $deleted ? 200 : 400);
    }

    public function rest_clear_404s(): \WP_REST_Response {
        Redirect_Repository::clear_all_404s();

        return new \WP_REST_Response([
            'success' => true,
            'message' => 'تمام لاگ‌های ۴۰۴ با موفقیت پاک شدند.',
        ], 200);
    }

    public function rest_convert_404_to_redirect(\WP_REST_Request $request): \WP_REST_Response {
        $log_id = (int) $request->get_param('log_id');
        $source = sanitize_text_field((string) $request->get_param('source_url'));
        $target = sanitize_text_field((string) $request->get_param('target_url'));

        if (empty($source) || empty($target)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'آدرس مبدأ و مقصد هر دو الزامی هستند.',
            ], 400);
        }

        $id = Redirect_Repository::add_redirect($source, $target, 301, 'exact');
        if ($id && $log_id > 0) {
            Redirect_Repository::delete_404($log_id);
        }

        return new \WP_REST_Response([
            'success' => (bool) $id,
            'id'      => $id,
            'message' => 'ریدایرکت ۳۰۱ با موفقیت ایجاد و لاگ ۴۰۴ پاک شد.',
        ], 200);
    }
}
