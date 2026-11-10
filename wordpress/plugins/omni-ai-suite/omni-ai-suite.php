<?php
/**
 * Plugin Name:       Omni AI Suite - All-in-One AI for WordPress
 * Plugin URI:        https://github.com/zebracode/omni-ai-suite
 * Description:       A modular, high-performance All-in-One WordPress AI plugin with BYOK, real-time streaming, Action Scheduler bulk generation, Gutenberg & Elementor integration, and zero DB bloat.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      8.0
 * Author:            Omni AI Team
 * Author URI:        https://zebracode.ir
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       omni-ai-suite
 * Domain Path:       /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

// PHP 7.4 / 8.0 Backward Compatibility Polyfills
if (!function_exists('str_starts_with')) {
    function str_starts_with(?string $haystack, ?string $needle): bool {
        if ($haystack === null || $needle === null) {
            return false;
        }
        return '' === $needle || 0 === strncmp($haystack, $needle, strlen($needle));
    }
}
if (!function_exists('str_ends_with')) {
    function str_ends_with(?string $haystack, ?string $needle): bool {
        if ($haystack === null || $needle === null) {
            return false;
        }
        return '' === $needle || ('' !== $haystack && substr($haystack, -strlen($needle)) === $needle);
    }
}
if (!function_exists('str_contains')) {
    function str_contains(?string $haystack, ?string $needle): bool {
        if ($haystack === null || $needle === null) {
            return false;
        }
        return '' === $needle || false !== strpos($haystack, $needle);
    }
}

// Plugin constants
define('OMNI_AI_VERSION', '1.0.0');
define('OMNI_AI_FILE', __FILE__);
define('OMNI_AI_PATH', plugin_dir_path(__FILE__));
define('OMNI_AI_URL', plugin_dir_url(__FILE__));
define('OMNI_AI_LOGS_TABLE', 'ai_generation_logs');

// Load PSR-4 Autoloader
require_once OMNI_AI_PATH . 'includes/class-autoloader.php';

// Register activation and deactivation hooks
register_activation_hook(__FILE__, ['OmniAI\\Activator', 'activate']);
register_deactivation_hook(__FILE__, ['OmniAI\\Deactivator', 'deactivate']);

// Boot the plugin
add_action('plugins_loaded', function () {
    \OmniAI\Plugin::instance()->boot();
});
