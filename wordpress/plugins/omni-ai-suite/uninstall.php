<?php
/**
 * Fired when the plugin is uninstalled.
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

global $wpdb;

// Check if user requested complete data removal
$settings = get_option('omni_ai_settings', []);
$remove_all_data = !empty($settings['remove_data_on_uninstall']);

if ($remove_all_data) {
    // Delete custom table
    $table_name = $wpdb->prefix . 'ai_generation_logs';
    $wpdb->query("DROP TABLE IF EXISTS {$table_name}");

    // Delete options
    delete_option('omni_ai_settings');
    delete_option('omni_ai_modules');
    delete_option('omni_ai_db_version');
}
