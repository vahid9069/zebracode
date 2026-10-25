<?php

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Do not delete posts or generated content. Settings cleanup can be enabled
// later after an explicit product decision about data retention.
delete_option('zebracode_blog_ai_settings');
delete_option('zebracode_blog_ai_connector_key');
delete_option('zebracode_blog_ai_modules');
delete_option('zebracode_blog_ai_generation_logs_version');
delete_option('zebracode_blog_ai_activity');

global $wpdb;
$wpdb->query('DROP TABLE IF EXISTS ' . $wpdb->prefix . 'ai_generation_logs');
