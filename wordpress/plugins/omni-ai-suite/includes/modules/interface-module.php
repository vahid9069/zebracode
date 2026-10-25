<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Interface for all plugin modules.
 */
interface Module_Interface {
    /**
     * Unique module identifier.
     */
    public function get_id(): string;

    /**
     * Module display title.
     */
    public function get_title(): string;

    /**
     * Module description.
     */
    public function get_description(): string;

    /**
     * Check if module is currently enabled.
     */
    public function is_active(): bool;

    /**
     * Register hooks, filters, and assets ONLY when module is active.
     */
    public function register(): void;
}
