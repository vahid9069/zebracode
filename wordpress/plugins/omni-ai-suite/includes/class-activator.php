<?php
namespace OmniAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles plugin activation routines.
 */
class Activator {
    public static function activate(): void {
        self::create_custom_tables();
        self::initialize_default_options();
        flush_rewrite_rules(false);
    }

    /**
     * Creates custom tables using dbDelta to prevent CPT/postmeta bloat.
     */
    public static function create_custom_tables(): void {
        Database\Log_Repository::maybe_create_table();
        Database\Redirect_Repository::maybe_create_tables();
        update_option('omni_ai_db_version', OMNI_AI_VERSION);
    }

    /**
     * Set default options if not present.
     */
    public static function initialize_default_options(): void {
        if (false === get_option('omni_ai_settings')) {
            update_option('omni_ai_settings', [
                'default_provider' => 'gemini',
                'gemini_api_key'   => '',
                'gemini_model'     => 'gemini-1.5-flash',
                'openai_api_key'   => '',
                'openai_model'     => 'gpt-4o-mini',
                'claude_api_key'   => '',
                'claude_model'     => 'claude-3-5-sonnet-20241022',
                'temperature'      => 0.7,
                'max_tokens'       => 2000,
            ]);
        }

        if (false === get_option('omni_ai_modules')) {
            update_option('omni_ai_modules', [
                'content_generator' => true,
                'gutenberg'         => true,
                'elementor'         => true,
                'woocommerce'       => true,
                'chatbot'           => true,
                'bulk_generator'    => true,
            ]);
        }
    }
}
