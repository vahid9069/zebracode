<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WooCommerce AI Integration Module.
 */
class Woocommerce_Module implements Module_Interface {
    public function get_id(): string {
        return 'woocommerce';
    }

    public function get_title(): string {
        return __('WooCommerce AI Product Writer', 'omni-ai-suite');
    }

    public function get_description(): string {
        return __('Adds one-click AI product description and feature bullet generator inside WooCommerce product editor.', 'omni-ai-suite');
    }

    public function is_active(): bool {
        $states = get_option('omni_ai_modules', []);
        return !isset($states[$this->get_id()]) || (bool) $states[$this->get_id()];
    }

    public function register(): void {
        // Hook into WooCommerce product options general product data
        add_action('woocommerce_product_options_general_product_data', [$this, 'render_ai_product_button']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_product_assets']);
    }

    public function render_ai_product_button(): void {
        ?>
        <div class="options_group omni-ai-wc-generator" style="padding: 12px; background: #f0f6fc; border-left: 4px solid #2271b1; margin: 15px 10px;">
            <p class="form-field" style="margin-bottom: 8px;">
                <label for="omni_ai_wc_keywords"><strong><?php esc_html_e('AI Product Description Generator', 'omni-ai-suite'); ?></strong></label>
                <input type="text" class="short" name="omni_ai_wc_keywords" id="omni_ai_wc_keywords" placeholder="<?php esc_attr_e('Keywords (e.g. leather, waterproof, brown, handcrafted)', 'omni-ai-suite'); ?>" style="width: 100%; max-width: 400px;" />
            </p>
            <div style="display: flex; gap: 10px; align-items: center; margin-top: 8px;">
                <button type="button" class="button button-primary" id="omni-ai-wc-generate-btn">
                    <span class="dashicons dashicons-superhero" style="vertical-align: middle; margin-right: 4px;"></span>
                    <?php esc_html_e('Generate Product Copy with AI', 'omni-ai-suite'); ?>
                </button>
                <span id="omni-ai-wc-spinner" class="spinner" style="float: none; margin: 0;"></span>
                <span id="omni-ai-wc-msg" style="color: #2271b1; font-weight: 500;"></span>
            </div>
        </div>
        <?php
    }

    public function enqueue_product_assets(string $hook): void {
        global $post;
        if (!in_array($hook, ['post.php', 'post-new.php'], true) || ($post && $post->post_type !== 'product')) {
            return;
        }

        wp_enqueue_script(
            'omni-ai-wc-script',
            OMNI_AI_URL . 'assets/js/woocommerce.js',
            ['jquery'],
            OMNI_AI_VERSION,
            true
        );

        wp_localize_script('omni-ai-wc-script', 'omniAiWc', [
            'restUrl' => esc_url_raw(rest_url('omni-ai/v1/ask')),
            'nonce'   => wp_create_nonce('wp_rest'),
        ]);
    }
}
