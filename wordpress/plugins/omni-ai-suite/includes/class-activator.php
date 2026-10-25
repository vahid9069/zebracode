<?php
namespace OmniAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles plugin activation routines.
 */
class Activator {
    public static function activate(): void {
        self::create_custom_tables();
        self::initialize_default_options();
    }

    /**
     * Creates custom tables using dbDelta to prevent CPT/postmeta bloat.
     */
    public static function create_custom_tables(): void {
        global $wpdb;

        $table_name = $wpdb->prefix . OMNI_AI_LOGS_TABLE;
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS `{$table_name}` (
            `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            `user_id` bigint(20) unsigned NOT NULL DEFAULT 0,
            `prompt` longtext NOT NULL,
            `response` longtext NOT NULL,
            `model` varchar(100) NOT NULL DEFAULT '',
            `provider` varchar(50) NOT NULL DEFAULT '',
            `tokens_used` int(11) NOT NULL DEFAULT 0,
            `created_at` datetime NOT NULL,
            PRIMARY KEY  (`id`),
            KEY `user_id` (`user_id`),
            KEY `created_at` (`created_at`),
            KEY `provider` (`provider`)
        ) {$charset_collate}";

        $wpdb->query($sql);

        // Also run dbDelta if available for schema synchronization
        if (file_exists(ABSPATH . 'wp-admin/includes/upgrade.php')) {
            require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        }
        if (function_exists('dbDelta')) {
            dbDelta($sql);
        }

        update_option('omni_ai_db_version', OMNI_AI_VERSION);
    }

    /**
     * Set default options if not present.
     */
    public static function initialize_default_options(): void {
        if (false === get_option('omni_ai_settings')) {
            update_option('omni_ai_settings', [
                'default_provider' => 'gemini',
                'gemini_api_key'   => '',
                'gemini_model'     => 'gemini-1.5-flash',
                'openai_api_key'   => '',
                'openai_model'     => 'gpt-4o-mini',
                'claude_api_key'   => '',
                'claude_model'     => 'claude-3-5-sonnet-20241022',
                'temperature'      => 0.7,
                'max_tokens'       => 2000,
            ]);
        }

        if (false === get_option('omni_ai_modules')) {
            update_option('omni_ai_modules', [
                'content_generator' => true,
                'gutenberg'         => true,
                'elementor'         => true,
                'woocommerce'       => true,
                'chatbot'           => true,
                'bulk_generator'    => true,
            ]);
        }
    }
}
