<?php
namespace OmniAI;

use OmniAI\Admin\Admin;
use OmniAI\Api\Rest_Controller;
use OmniAI\Modules\Module_Manager;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Main plugin orchestrator class (Singleton).
 */
class Plugin {
    private static ?Plugin $instance = null;
    private Admin $admin;
    private Rest_Controller $rest_controller;

    public static function instance(): Plugin {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->admin = new Admin();
        $this->rest_controller = new Rest_Controller();
    }

    public function boot(): void {
        // Load textdomain
        add_action('init', [$this, 'load_textdomain']);

        // Register REST API endpoints
        add_action('rest_api_init', [$this->rest_controller, 'register_routes']);

        // Initialize Admin UI
        if (is_admin()) {
            $this->admin->init();
        }

        // Initialize active modules (inactive modules never load hooks or assets)
        Module_Manager::init();
    }

    public function load_textdomain(): void {
        load_plugin_textdomain('omni-ai-suite', false, dirname(plugin_basename(OMNI_AI_FILE)) . '/languages');
    }
}
