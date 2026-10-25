<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Persistent generation history stored outside wp_options and postmeta.
 */
final class GenerationLogRepository
{
    const TABLE_SUFFIX = 'ai_generation_logs';
    const VERSION_OPTION = 'zebracode_blog_ai_generation_logs_version';
    const VERSION = '1.0.0';

    /**
     * @return string
     */
    public static function table_name()
    {
        global $wpdb;

        return $wpdb->prefix . self::TABLE_SUFFIX;
    }

    /**
     * Create or upgrade the custom log table.
     *
     * @return void
     */
    public static function install()
    {
        global $wpdb;

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $table = self::table_name();
        $charset = $wpdb->get_charset_collate();
        $sql = "CREATE TABLE {$table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL DEFAULT 0,
            job_id varchar(64) NOT NULL DEFAULT '',
            event varchar(80) NOT NULL DEFAULT 'generation',
            status varchar(32) NOT NULL DEFAULT 'unknown',
            provider varchar(80) NOT NULL DEFAULT '',
            model varchar(191) NOT NULL DEFAULT '',
            prompt longtext NOT NULL,
            response longtext NOT NULL,
            data longtext NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY status (status),
            KEY event (event),
            KEY user_id (user_id),
            KEY created_at (created_at)
        ) {$charset};";

        dbDelta($sql);
        update_option(self::VERSION_OPTION, self::VERSION, false);
    }

    /**
     * @param array $entry
     * @return int
     */
    public function insert(array $entry)
    {
        global $wpdb;

        $data = isset($entry['data']) && is_array($entry['data']) ? $entry['data'] : array();
        $encoded = wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $encoded = is_string($encoded) ? $encoded : '{}';

        $wpdb->insert(
            self::table_name(),
            array(
                'user_id' => isset($entry['user_id']) ? absint($entry['user_id']) : get_current_user_id(),
                'job_id' => isset($entry['job_id']) ? sanitize_text_field((string) $entry['job_id']) : '',
                'event' => isset($entry['event']) ? sanitize_key((string) $entry['event']) : 'generation',
                'status' => isset($entry['status']) ? sanitize_key((string) $entry['status']) : 'unknown',
                'provider' => isset($entry['provider']) ? sanitize_key((string) $entry['provider']) : '',
                'model' => isset($entry['model']) ? sanitize_text_field((string) $entry['model']) : '',
                'prompt' => isset($entry['prompt']) ? (string) $entry['prompt'] : '',
                'response' => isset($entry['response']) ? (string) $entry['response'] : '',
                'data' => $encoded,
                'created_at' => isset($entry['created_at']) ? gmdate('Y-m-d H:i:s', strtotime((string) $entry['created_at'])) : current_time('mysql', true),
            ),
            array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s')
        );

        return absint($wpdb->insert_id);
    }

    /**
     * @param int $limit
     * @return array
     */
    public function recent($limit = 20)
    {
        global $wpdb;

        $limit = min(200, max(1, absint($limit)));
        $rows = $wpdb->get_results($wpdb->prepare('SELECT * FROM ' . self::table_name() . ' ORDER BY id DESC LIMIT %d', $limit), ARRAY_A);

        return array_map(array($this, 'normalize'), is_array($rows) ? $rows : array());
    }

    /**
     * @param string|null $status
     * @return int|array
     */
    public function count_by_status($status = null)
    {
        global $wpdb;

        if ($status !== null && $status !== '') {
            return absint($wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM ' . self::table_name() . ' WHERE status = %s', sanitize_key((string) $status))));
        }

        $rows = $wpdb->get_results('SELECT status, COUNT(*) AS total FROM ' . self::table_name() . ' GROUP BY status', ARRAY_A);
        $counts = array();
        foreach (is_array($rows) ? $rows : array() as $row) {
            $counts[sanitize_key((string) $row['status'])] = absint($row['total']);
        }

        return $counts;
    }

    /**
     * @param array $row
     * @return array
     */
    private function normalize(array $row)
    {
        $data = isset($row['data']) ? json_decode((string) $row['data'], true) : array();

        return array(
            'id' => isset($row['id']) ? absint($row['id']) : 0,
            'event' => isset($row['event']) ? sanitize_key((string) $row['event']) : 'generation',
            'status' => isset($row['status']) ? sanitize_key((string) $row['status']) : 'unknown',
            'data' => is_array($data) ? $data : array(),
            'timestamp' => isset($row['created_at']) ? sanitize_text_field((string) $row['created_at']) : '',
        );
    }
}
