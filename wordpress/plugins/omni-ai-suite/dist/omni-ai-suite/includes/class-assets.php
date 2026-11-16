<?php
namespace OmniAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles frontend asset loading for Omni AI Suite.
 */
class Assets {
    public static function init(): void {
        add_action('wp_enqueue_scripts', [self::class, 'enqueue_frontend_scripts']);
    }

    /**
     * Enqueue frontend scripts and styles if needed.
     */
    public static function enqueue_frontend_scripts(): void {
        // No client-side diagram library needed; diagrams are rendered server-side as SVG images.
    }
}
