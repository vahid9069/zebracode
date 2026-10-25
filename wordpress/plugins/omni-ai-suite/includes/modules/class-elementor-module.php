<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Elementor Page Builder AI Integration Module.
 */
class Elementor_Module implements Module_Interface {
    public function get_id(): string {
        return 'elementor';
    }

    public function get_title(): string {
        return __('Elementor AI Panel', 'omni-ai-suite');
    }

    public function get_description(): string {
        return __('Loads a floating AI writing widget exclusively inside the Elementor editor screen.', 'omni-ai-suite');
    }

    public function is_active(): bool {
        $states = get_option('omni_ai_modules', []);
        return !isset($states[$this->get_id()]) || (bool) $states[$this->get_id()];
    }

    public function register(): void {
        // Hook into Elementor editor exclusively
        add_action('elementor/editor/before_enqueue_scripts', [$this, 'enqueue_editor_assets']);
    }

    public function enqueue_editor_assets(): void {
        wp_enqueue_script(
            'omni-ai-elementor',
            OMNI_AI_URL . 'assets/js/elementor.js',
            ['jquery'],
            OMNI_AI_VERSION,
            true
        );

        wp_localize_script('omni-ai-elementor', 'omniAiElementor', [
            'restUrl' => esc_url_raw(rest_url('omni-ai/v1/')),
            'nonce'   => wp_create_nonce('wp_rest'),
        ]);
    }
}
