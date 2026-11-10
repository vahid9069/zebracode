<?php
namespace OmniAI\Database;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles database operations for 301/302 Redirections and 404 Monitor logs.
 */
class Redirect_Repository {
    public static function redirects_table(): string {
        global $wpdb;
        return $wpdb->prefix . 'omni_ai_redirects';
    }

    public static function logs_404_table(): string {
        global $wpdb;
        return $wpdb->prefix . 'omni_ai_404_logs';
    }

    /**
     * Create custom tables for redirects and 404 logs.
     */
    public static function create_tables(): void {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        $redirects_table = self::redirects_table();
        $logs_404_table = self::logs_404_table();

        $sql_redirects = "CREATE TABLE IF NOT EXISTS {$redirects_table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            source_url text NOT NULL,
            target_url text NOT NULL,
            status_code smallint(4) NOT NULL DEFAULT 301,
            match_type varchar(20) NOT NULL DEFAULT 'exact',
            hits bigint(20) unsigned NOT NULL DEFAULT 0,
            is_active tinyint(1) NOT NULL DEFAULT 1,
            created_at datetime NOT NULL,
            last_accessed datetime DEFAULT NULL,
            PRIMARY KEY (id),
            KEY status_code (status_code),
            KEY is_active (is_active)
        ) {$charset_collate};";

        $sql_404 = "CREATE TABLE IF NOT EXISTS {$logs_404_table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            url text NOT NULL,
            referer text DEFAULT NULL,
            ip_address varchar(45) NOT NULL DEFAULT '',
            user_agent varchar(255) NOT NULL DEFAULT '',
            hits bigint(20) unsigned NOT NULL DEFAULT 1,
            created_at datetime NOT NULL,
            last_accessed datetime NOT NULL,
            PRIMARY KEY (id),
            KEY hits (hits),
            KEY last_accessed (last_accessed)
        ) {$charset_collate};";

        $wpdb->query($sql_redirects);
        $wpdb->query($sql_404);

        if (!function_exists('dbDelta')) {
            require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        }
        dbDelta($sql_redirects);
        dbDelta($sql_404);
    }

    public static function maybe_create_tables(): void {
        global $wpdb;
        $redirects_table = self::redirects_table();
        if ($wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $redirects_table)) !== $redirects_table) {
            self::create_tables();
        }
    }

    /* -------------------------------------------------------------
     *  Redirections Management
     * ----------------------------------------------------------- */

    /**
     * Add or update a redirect.
     */
    public static function add_redirect(string $source_url, string $target_url, int $status_code = 301, string $match_type = 'exact'): int|false {
        global $wpdb;
        self::maybe_create_tables();

        $source_clean = self::normalize_url_path($source_url);
        $target_clean = trim($target_url);

        if (empty($source_clean) || empty($target_clean)) {
            return false;
        }

        // Check if redirect for source already exists
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM " . self::redirects_table() . " WHERE source_url = %s LIMIT 1",
            $source_clean
        ));

        $data = [
            'source_url'   => $source_clean,
            'target_url'   => $target_clean,
            'status_code'  => in_array($status_code, [301, 302, 307, 410], true) ? $status_code : 301,
            'match_type'   => in_array($match_type, ['exact', 'regex', 'prefix'], true) ? $match_type : 'exact',
            'is_active'    => 1,
            'created_at'   => current_time('mysql'),
        ];

        if ($existing) {
            $wpdb->update(
                self::redirects_table(),
                [
                    'target_url'  => $data['target_url'],
                    'status_code' => $data['status_code'],
                    'match_type'  => $data['match_type'],
                    'is_active'   => 1,
                ],
                ['id' => $existing->id],
                ['%s', '%d', '%s', '%d'],
                ['%d']
            );
            return (int) $existing->id;
        }

        $result = $wpdb->insert(
            self::redirects_table(),
            $data,
            ['%s', '%s', '%d', '%s', '%d', '%s']
        );

        return $result ? (int) $wpdb->insert_id : false;
    }

    /**
     * Get paginated redirects.
     */
    public static function get_redirects(int $limit = 50, int $offset = 0, string $search = ''): array {
        global $wpdb;
        self::maybe_create_tables();

        $table = self::redirects_table();
        $where = "WHERE 1=1";
        $params = [];

        if (!empty($search)) {
            $where .= " AND (source_url LIKE %s OR target_url LIKE %s)";
            $like = '%' . $wpdb->esc_like(trim($search)) . '%';
            $params[] = $like;
            $params[] = $like;
        }

        $total_sql = "SELECT COUNT(*) FROM {$table} {$where}";
        $total = !empty($params) 
            ? (int) $wpdb->get_var($wpdb->prepare($total_sql, $params))
            : (int) $wpdb->get_var($total_sql);

        $sql = "SELECT * FROM {$table} {$where} ORDER BY id DESC LIMIT %d OFFSET %d";
        $query_params = array_merge($params, [$limit, $offset]);
        $items = $wpdb->get_results($wpdb->prepare($sql, $query_params), ARRAY_A);

        return [
            'items' => is_array($items) ? $items : [],
            'total' => $total,
        ];
    }

    /**
     * Delete a redirect.
     */
    public static function delete_redirect(int $id): bool {
        global $wpdb;
        self::maybe_create_tables();
        $result = $wpdb->delete(self::redirects_table(), ['id' => $id], ['%d']);
        return false !== $result;
    }

    /**
     * Find a matching redirect for a requested URI.
     */
    public static function match_redirect(string $request_uri): ?array {
        global $wpdb;
        self::maybe_create_tables();

        $normalized_uri = self::normalize_url_path($request_uri);
        $table = self::redirects_table();

        // 1. Try exact match first
        $exact = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$table} WHERE is_active = 1 AND source_url = %s LIMIT 1",
            $normalized_uri
        ), ARRAY_A);

        if ($exact) {
            self::increment_hit((int) $exact['id']);
            return $exact;
        }

        // Also check without or with trailing slash
        $alt_uri = str_ends_with($normalized_uri, '/') ? rtrim($normalized_uri, '/') : $normalized_uri . '/';
        $alt_match = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$table} WHERE is_active = 1 AND source_url = %s LIMIT 1",
            $alt_uri
        ), ARRAY_A);

        if ($alt_match) {
            self::increment_hit((int) $alt_match['id']);
            return $alt_match;
        }

        // 2. Check regex or prefix matches
        $patterns = $wpdb->get_results(
            "SELECT * FROM {$table} WHERE is_active = 1 AND match_type IN ('regex', 'prefix')",
            ARRAY_A
        );

        if (!empty($patterns)) {
            foreach ($patterns as $redirect) {
                if ($redirect['match_type'] === 'prefix') {
                    if (str_starts_with($normalized_uri, $redirect['source_url'])) {
                        self::increment_hit((int) $redirect['id']);
                        return $redirect;
                    }
                } elseif ($redirect['match_type'] === 'regex') {
                    $pattern = '#' . str_replace('#', '\#', $redirect['source_url']) . '#i';
                    if (@preg_match($pattern, $request_uri)) {
                        self::increment_hit((int) $redirect['id']);
                        $target = @preg_replace($pattern, $redirect['target_url'], $request_uri);
                        if (!empty($target)) {
                            $redirect['target_url'] = $target;
                        }
                        return $redirect;
                    }
                }
            }
        }

        return null;
    }

    private static function increment_hit(int $id): void {
        global $wpdb;
        $wpdb->query($wpdb->prepare(
            "UPDATE " . self::redirects_table() . " SET hits = hits + 1, last_accessed = %s WHERE id = %d",
            current_time('mysql'),
            $id
        ));
    }

    /* -------------------------------------------------------------
     *  404 Monitor Logs
     * ----------------------------------------------------------- */

    /**
     * Log a 404 error hit.
     */
    public static function log_404(string $url, string $referer = '', string $ip = '', string $ua = ''): void {
        global $wpdb;
        self::maybe_create_tables();

        $url_clean = self::normalize_url_path($url);
        if (empty($url_clean)) {
            return;
        }

        // Ignore common spam/bot probes (wp-login, .env, xmlrpc, etc.) if desired, or record them
        $table = self::logs_404_table();

        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id, hits FROM {$table} WHERE url = %s LIMIT 1",
            $url_clean
        ));

        if ($existing) {
            $wpdb->update(
                $table,
                [
                    'hits'          => (int) $existing->hits + 1,
                    'referer'       => substr($referer, 0, 500),
                    'last_accessed' => current_time('mysql'),
                ],
                ['id' => $existing->id],
                ['%d', '%s', '%s'],
                ['%d']
            );
        } else {
            $wpdb->insert(
                $table,
                [
                    'url'           => $url_clean,
                    'referer'       => substr($referer, 0, 500),
                    'ip_address'    => substr($ip, 0, 45),
                    'user_agent'    => substr($ua, 0, 255),
                    'hits'          => 1,
                    'created_at'    => current_time('mysql'),
                    'last_accessed' => current_time('mysql'),
                ],
                ['%s', '%s', '%s', '%s', '%d', '%s', '%s']
            );
        }
    }

    /**
     * Get 404 logs.
     */
    public static function get_404_logs(int $limit = 50, int $offset = 0, string $search = ''): array {
        global $wpdb;
        self::maybe_create_tables();

        $table = self::logs_404_table();
        $where = "WHERE 1=1";
        $params = [];

        if (!empty($search)) {
            $where .= " AND (url LIKE %s OR referer LIKE %s)";
            $like = '%' . $wpdb->esc_like(trim($search)) . '%';
            $params[] = $like;
            $params[] = $like;
        }

        $total_sql = "SELECT COUNT(*) FROM {$table} {$where}";
        $total = !empty($params) 
            ? (int) $wpdb->get_var($wpdb->prepare($total_sql, $params))
            : (int) $wpdb->get_var($total_sql);

        $sql = "SELECT * FROM {$table} {$where} ORDER BY last_accessed DESC LIMIT %d OFFSET %d";
        $query_params = array_merge($params, [$limit, $offset]);
        $items = $wpdb->get_results($wpdb->prepare($sql, $query_params), ARRAY_A);

        return [
            'items' => is_array($items) ? $items : [],
            'total' => $total,
        ];
    }

    /**
     * Delete a 404 log entry.
     */
    public static function delete_404(int $id): bool {
        global $wpdb;
        self::maybe_create_tables();
        $result = $wpdb->delete(self::logs_404_table(), ['id' => $id], ['%d']);
        return false !== $result;
    }

    /**
     * Clear all 404 logs.
     */
    public static function clear_all_404s(): bool {
        global $wpdb;
        self::maybe_create_tables();
        $wpdb->query("TRUNCATE TABLE " . self::logs_404_table());
        return true;
    }

    /**
     * Helper to normalize URL paths for comparison.
     */
    public static function normalize_url_path(string $url): string {
        $parsed = parse_url(trim($url));
        $path = $parsed['path'] ?? $url;
        if (!str_starts_with($path, '/')) {
            $path = '/' . $path;
        }
        return $path;
    }
}
