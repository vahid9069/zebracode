<?php
namespace OmniAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles plugin deactivation routines.
 */
class Deactivator {
    public static function deactivate(): void {
        // Clear any pending Action Scheduler jobs if Action Scheduler is present
        if (function_exists('as_unschedule_all_actions')) {
            as_unschedule_all_actions('omni_ai_process_bulk_item');
        }
    }
}
