<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Chatbot Module: Provides embeddable frontend chatbot.
 * Strictly adheres to the anti-bloat rule: zero frontend assets loaded unless shortcode is active.
 */
class Chatbot_Module implements Module_Interface {
    public function get_id(): string {
        return 'chatbot';
    }

    public function get_title(): string {
        return __('Interactive AI Chatbot', 'omni-ai-suite');
    }

    public function get_description(): string {
        return __('Lightweight client-facing AI chatbot widget with zero frontend bloat (enqueued only when [omni_ai_chatbot] is present).', 'omni-ai-suite');
    }

    public function is_active(): bool {
        $states = get_option('omni_ai_modules', []);
        return !isset($states[$this->get_id()]) || (bool) $states[$this->get_id()];
    }

    public function register(): void {
        add_shortcode('omni_ai_chatbot', [$this, 'render_shortcode']);
    }

    /**
     * Render chatbot HTML and enqueue JS/CSS ONLY on pages where shortcode is used.
     */
    public function render_shortcode(array $atts = []): string {
        $atts = shortcode_atts([
            'title'       => __('AI Assistant', 'omni-ai-suite'),
            'placeholder' => __('Ask me anything...', 'omni-ai-suite'),
            'provider'    => '',
            'model'       => '',
        ], $atts, 'omni_ai_chatbot');

        // Enqueue assets strictly on-demand
        wp_enqueue_style(
            'omni-ai-chatbot-css',
            OMNI_AI_URL . 'assets/css/chatbot.css',
            [],
            OMNI_AI_VERSION
        );

        wp_enqueue_script(
            'omni-ai-chatbot-js',
            OMNI_AI_URL . 'assets/js/chatbot.js',
            [],
            OMNI_AI_VERSION,
            true
        );

        wp_localize_script('omni-ai-chatbot-js', 'omniAiChatbot', [
            'restUrl'  => esc_url_raw(rest_url('omni-ai/v1/stream-ai')),
            'nonce'    => wp_create_nonce('wp_rest'),
            'provider' => sanitize_text_field($atts['provider']),
            'model'    => sanitize_text_field($atts['model']),
        ]);

        $chatbot_id = 'omni-ai-chat-' . wp_generate_uuid4();

        ob_start();
        ?>
        <div id="<?php echo esc_attr($chatbot_id); ?>" class="omni-ai-chatbot-container" data-chat-root>
            <div class="omni-ai-chatbot-header">
                <span class="omni-ai-chatbot-title"><?php echo esc_html($atts['title']); ?></span>
                <span class="omni-ai-chatbot-status-dot" title="Online"></span>
            </div>
            <div class="omni-ai-chatbot-messages" data-chat-messages>
                <div class="omni-ai-msg omni-ai-msg-bot">
                    <?php esc_html_e('Hello! How can I assist you today?', 'omni-ai-suite'); ?>
                </div>
            </div>
            <form class="omni-ai-chatbot-input-row" data-chat-form>
                <input type="text" class="omni-ai-chatbot-input" data-chat-input placeholder="<?php echo esc_attr($atts['placeholder']); ?>" required />
                <button type="submit" class="omni-ai-chatbot-send-btn" data-chat-btn>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </div>
        <?php
        return ob_get_clean();
    }
}
