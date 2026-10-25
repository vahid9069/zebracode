<?php
/**
 * Plugin Name:       ZebraCode Blog AI
 * Plugin URI:        https://zebracode.ir/blog/
 * Description:       Private foundation for generating and reviewing ZebraCode blog content with AI.
 * Version:           0.6.0
 * Requires at least: 6.4
 * Requires PHP:      8.0
 * Author:            ZebraCode
 * License:           MIT
 * License URI:       https://opensource.org/licenses/MIT
 * Text Domain:       zebracode-blog-ai
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ZEBRACODE_BLOG_AI_VERSION', '0.6.0');
define('ZEBRACODE_BLOG_AI_FILE', __FILE__);
define('ZEBRACODE_BLOG_AI_DIR', plugin_dir_path(__FILE__));
define('ZEBRACODE_BLOG_AI_URL', plugin_dir_url(__FILE__));

require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-plugin.php';

\ZebraCode\BlogAI\Plugin::instance()->boot();
