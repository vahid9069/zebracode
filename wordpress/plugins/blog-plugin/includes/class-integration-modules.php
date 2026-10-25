<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Optional editor/e-commerce integrations. Each module is completely inert
 * unless its feature switch is enabled.
 */
final class IntegrationModules
{
    public function register_hooks()
    {
        if (ModuleManager::enabled('gutenberg')) {
            add_action('enqueue_block_editor_assets', array($this, 'enqueue_gutenberg'));
        }
        if (ModuleManager::enabled('elementor')) {
            add_action('elementor/editor/before_enqueue_scripts', array($this, 'enqueue_elementor'));
        }
        if (ModuleManager::enabled('woocommerce')) {
            add_action('woocommerce_product_options_general_product_data', array($this, 'render_woocommerce_button'));
            add_action('admin_enqueue_scripts', array($this, 'enqueue_woocommerce'));
        }
    }

    public function enqueue_gutenberg()
    {
        wp_enqueue_script(
            'zebracode-blog-ai-gutenberg',
            ZEBRACODE_BLOG_AI_URL . 'assets/integrations/gutenberg.js',
            array('wp-plugins', 'wp-edit-post', 'wp-element', 'wp-data', 'wp-i18n'),
            ZEBRACODE_BLOG_AI_VERSION,
            true
        );
        wp_localize_script('zebracode-blog-ai-gutenberg', 'ZebraCodeBlogAIIntegration', $this->integration_config());
    }

    public function enqueue_elementor()
    {
        wp_enqueue_script(
            'zebracode-blog-ai-elementor',
            ZEBRACODE_BLOG_AI_URL . 'assets/integrations/elementor.js',
            array(),
            ZEBRACODE_BLOG_AI_VERSION,
            true
        );
        wp_localize_script('zebracode-blog-ai-elementor', 'ZebraCodeBlogAIIntegration', $this->integration_config());
    }

    public function enqueue_woocommerce($hook)
    {
        if ($hook !== 'post.php' && $hook !== 'post-new.php') {
            return;
        }

        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        if (!$screen || $screen->post_type !== 'product') {
            return;
        }

        wp_enqueue_script(
            'zebracode-blog-ai-woocommerce',
            ZEBRACODE_BLOG_AI_URL . 'assets/integrations/woocommerce.js',
            array(),
            ZEBRACODE_BLOG_AI_VERSION,
            true
        );
        wp_localize_script('zebracode-blog-ai-woocommerce', 'ZebraCodeBlogAIIntegration', $this->integration_config());
    }

    public function render_woocommerce_button()
    {
        echo '<div class="options_group"><p class="form-field"><button type="button" class="button" data-zebracode-ai-product>' . esc_html__('Generate with ZebraCode AI', 'zebracode-blog-ai') . '</button></p></div>';
    }

    private function integration_config()
    {
        return array(
            'restUrl' => esc_url_raw(rest_url(RESTController::NAMESPACE)),
            'nonce' => wp_create_nonce('wp_rest'),
            'studioUrl' => admin_url('admin.php?page=zebracode-blog-ai-studio'),
        );
    }
}
