<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Gutenberg Block Editor AI Integration Module.
 */
class Gutenberg_Module implements Module_Interface {
    public function get_id(): string {
        return 'gutenberg';
    }

    public function get_title(): string {
        return __('Gutenberg AI Assistant', 'omni-ai-suite');
    }

    public function get_description(): string {
        return __('Injects AI generation and improvement buttons directly into the Gutenberg block editor toolbar.', 'omni-ai-suite');
    }

    public function is_active(): bool {
        $states = get_option('omni_ai_modules', []);
        return !isset($states[$this->get_id()]) || (bool) $states[$this->get_id()];
    }

    public function register(): void {
        add_action('enqueue_block_editor_assets', [$this, 'enqueue_assets']);
    }

    public function enqueue_assets(): void {
        $asset_file = OMNI_AI_PATH . 'assets/js/gutenberg.asset.php';
        $deps = ['wp-plugins', 'wp-element', 'wp-edit-post', 'wp-components', 'wp-data', 'wp-i18n', 'wp-compose', 'wp-api-fetch'];
        $version = OMNI_AI_VERSION;

        if (file_exists($asset_file)) {
            $asset = include $asset_file;
            $deps = $asset['dependencies'] ?? $deps;
            $version = $asset['version'] ?? $version;
        }

        wp_enqueue_script(
            'omni-ai-gutenberg',
            OMNI_AI_URL . 'assets/js/gutenberg.js',
            $deps,
            $version,
            true
        );

        wp_localize_script('omni-ai-gutenberg', 'omniAiGutenberg', [
            'restUrl' => esc_url_raw(rest_url('omni-ai/v1/')),
            'nonce'   => wp_create_nonce('wp_rest'),
        ]);
    }
}
