<?php
namespace OmniAI\Modules;

use OmniAI\Database\Log_Repository;
use OmniAI\Providers\Provider_Factory;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Bulk Content Generation Module powered by Action Scheduler background workers.
 * Completely eliminates HTTP 504 Gateway Timeouts by asynchronously queueing individual items.
 */
class Bulk_Module implements Module_Interface {
    public function get_id(): string {
        return 'bulk_generator';
    }

    public function get_title(): string {
        return __('Asynchronous Bulk Post Generator', 'omni-ai-suite');
    }

    public function get_description(): string {
        return __('Generates batches of articles safely in the background using Action Scheduler without 504 timeouts.', 'omni-ai-suite');
    }

    public function is_active(): bool {
        $states = get_option('omni_ai_modules', []);
        return !isset($states[$this->get_id()]) || (bool) $states[$this->get_id()];
    }

    public function register(): void {
        // Hook into Action Scheduler / WP Cron event
        add_action('omni_ai_process_bulk_item', [$this, 'process_bulk_item'], 10, 1);
    }

    /**
     * Background worker callback.
     *
     * @param array $data Contains ['prompt', 'title', 'options', 'user_id']
     */
    public function process_bulk_item($data): void {
        if (!is_array($data) || empty($data['prompt'])) {
            return;
        }

        $prompt = $data['prompt'];
        $title = !empty($data['title']) ? $data['title'] : wp_trim_words($prompt, 8, '...');
        $options = $data['options'] ?? [];
        $user_id = intval($data['user_id'] ?? 1);

        try {
            $provider = Provider_Factory::get_provider($options['provider'] ?? '');
            $generation_options = [
                'model'         => $options['model'] ?? '',
                'system_prompt' => $options['system_prompt'] ?? 'You are a professional blog writer. Format content cleanly with markdown/HTML headings and paragraphs.',
                'temperature'   => 0.7,
                'max_tokens'    => 2500,
            ];

            $result = $provider->generate($prompt, $generation_options);
            $content = $result['text'] ?? '';

            if (empty($content)) {
                return;
            }

            // Create draft post
            $post_id = wp_insert_post([
                'post_title'   => sanitize_text_field($title),
                'post_content' => wp_kses_post($content),
                'post_status'  => sanitize_text_field($options['post_status'] ?? 'draft'),
                'post_author'  => $user_id,
                'post_type'    => sanitize_text_field($options['post_type'] ?? 'post'),
            ]);

            // Save log to custom table (zero CPT/meta bloat)
            if ($post_id && !is_wp_error($post_id)) {
                Log_Repository::insert_log(
                    $user_id,
                    $prompt,
                    $content,
                    $result['model'] ?? 'unknown',
                    $result['provider'] ?? 'unknown',
                    $result['tokens'] ?? 0
                );
            }
        } catch (\Throwable $e) {
            error_log('[Omni AI Suite Bulk Error]: ' . $e->getMessage());
        }
    }
}
