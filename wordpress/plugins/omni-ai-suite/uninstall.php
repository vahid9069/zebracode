<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * Cleans up all database tables and options created by Omni AI Suite.
 *
 * @package OmniAI
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

global $wpdb;

// 1. Drop custom table for AI generation logs
$table_name = $wpdb->prefix . 'ai_generation_logs';
$wpdb->query("DROP TABLE IF EXISTS {$table_name}");

// 2. Delete all plugin options
delete_option('omni_ai_settings');
delete_option('omni_ai_modules');
delete_option('omni_ai_custom_prompts');
delete_option('omni_ai_backup_logs');
delete_option('omni_ai_backup_stats');
delete_option('omni_ai_db_version');
