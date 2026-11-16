<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Core Content Generator Module.
 */
class Content_Module implements Module_Interface {
    public function get_id(): string {
        return 'content_generator';
    }

    public function get_title(): string {
        return __('AI Content Studio', 'omni-ai-suite');
    }

    public function get_description(): string {
        return __('Core content generator with real-time SSE streaming, custom templates, and post generation.', 'omni-ai-suite');
    }

    public function is_active(): bool {
        $states = get_option('omni_ai_modules', []);
        return !isset($states[$this->get_id()]) || (bool) $states[$this->get_id()];
    }

    public function register(): void {
        // Module hooks if needed
    }
}
