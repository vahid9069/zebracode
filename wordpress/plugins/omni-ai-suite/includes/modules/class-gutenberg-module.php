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
        add_filter('content_edit_pre', [$this, 'filter_clean_legacy_content'], 10, 1);
        add_filter('the_editor_content', [$this, 'filter_clean_legacy_content'], 10, 1);
    }

    /**
     * پاک‌سازی رشته‌های مخدوش قدیمی (مانند onclick های شکسته شده توسط kses) از محتوای ادیتور
     */
    public function filter_clean_legacy_content(string $content): string {
        if (str_contains($content, 'this.innerText') || str_contains($content, 'cursor:pointer;background:#1e293b')) {
            $content = preg_replace('/(?:this\.innerText\s*=\s*[\'"][^\'"]*[\'"]\s*;\s*\d*\s*\)?\s*["\']\s*)?style=[\'"]cursor:pointer;background:#1e293b;[^\'"]*[\'"]>[\s\S]*?(?:📋|کپی\s*پرامپت)[^<]*/iu', '', $content);
        }
        return $content;
    }

    public function enqueue_assets(): void {
        if (function_exists('wp_enqueue_media')) {
            wp_enqueue_media();
        }

        $asset_file = OMNI_AI_PATH . 'assets/js/gutenberg.asset.php';
        $deps = ['wp-plugins', 'wp-element', 'wp-edit-post', 'wp-components', 'wp-data', 'wp-i18n', 'wp-compose', 'wp-api-fetch', 'wp-blocks', 'wp-editor'];
        $js_file = OMNI_AI_PATH . 'assets/js/gutenberg.js';
        $version = OMNI_AI_VERSION . '.' . (file_exists($js_file) ? filemtime($js_file) : time());

        if (file_exists($asset_file)) {
            $asset = include $asset_file;
            $deps = $asset['dependencies'] ?? $deps;
        }

        wp_enqueue_script(
            'omni-ai-gutenberg',
            OMNI_AI_URL . 'assets/js/gutenberg.js',
            $deps,
            $version,
            true
        );

        $post_id = get_the_ID() ?: 0;

        wp_localize_script('omni-ai-gutenberg', 'omniAiGutenberg', [
            'restUrl'             => esc_url_raw(rest_url('omni-ai/v1/')),
            'ajaxUrl'             => admin_url('admin-ajax.php'),
            'nonce'               => wp_create_nonce('omni_ranking_nonce'),
            'restNonce'           => wp_create_nonce('wp_rest'),
            'postId'              => $post_id,
            'adminUploadUrl'      => admin_url('upload.php'),
            'featuredImagePrompt' => (string) get_post_meta($post_id, '_omni_ai_featured_image_prompt', true),
            'diagramPrompt'       => (string) get_post_meta($post_id, '_omni_ai_diagram_prompt', true),
            'imagePrompts'        => (array) (get_post_meta($post_id, '_omni_ai_image_prompts', true) ?: []),
        ]);
    }
}
