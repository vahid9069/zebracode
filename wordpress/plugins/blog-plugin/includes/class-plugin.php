<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-settings.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-module-manager.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-i18n.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/contracts/interface-ai-provider.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/contracts/interface-content-generator.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-article-formatter.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-article-validator.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-content-generator.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-draft-repository.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-activity-logger.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-generation-log-repository.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/contracts/interface-template-repository.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-template-repository.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-seo-auditor.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-rest-controller.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-draft-writer.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-content-protector.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-refresh-generator.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-refresh-draft-writer.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-featured-image-generator.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-generation-queue.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-prompt-tester.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-transport-diagnostics.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-provider-transport.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/providers/class-openai-compatible-provider.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/providers/class-gemini-provider.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-provider-registry.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-admin.php';
require_once ZEBRACODE_BLOG_AI_DIR . 'includes/class-integration-modules.php';

final class Plugin
{
    const OPTION_KEY = 'zebracode_blog_ai_settings';

    /** @var Plugin|null */
    private static $instance = null;

    /** @var Settings */
    private $settings;

    /** @var Admin */
    private $admin;

    /** @var ContentGenerator */
    private $generator;

    /** @var Contracts\AIProviderInterface */
    private $provider;

    /** @var GenerationQueue */
    private $queue;

    public static function instance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct()
    {
        $this->settings = new Settings();
        $provider_registry = new ProviderRegistry($this->settings);
        $provider = $provider_registry->make();
        $this->provider = $provider;
        $this->generator = new ContentGenerator($provider);
        $logs = new GenerationLogRepository();
        $activity = new ActivityLogger($logs);
        $seo = new SEOAuditor();
        $refresh_protector = new ContentProtector();
        $refresh_generator = new RefreshGenerator($provider, $refresh_protector);
        $refresh_writer = new RefreshDraftWriter();
        $featured_image_generator = new FeaturedImageGenerator($provider);
        $this->queue = new GenerationQueue($this->generator, new DraftWriter(), $this->settings, $activity, $seo, $refresh_protector, $refresh_generator, $refresh_writer, $featured_image_generator);
        $this->admin = new Admin(
            $this->settings,
            $this->generator,
            $provider,
            new DraftRepository(),
            $activity,
            new TemplateRepository(),
            $seo,
            $this->queue,
            new PromptTester($provider),
            new TransportDiagnostics(),
            $featured_image_generator
        );
    }

    public function boot()
    {
        (new I18n())->register_hooks();
        add_action('init', array($this, 'load_textdomain'));
        add_action('init', array($this, 'maybe_install'), 1);
        $this->settings->register_hooks();
        (new RESTController($this->provider, $this->queue, new GenerationLogRepository()))->register_hooks();
        $this->queue->register_hooks();
        (new IntegrationModules())->register_hooks();

        if (is_admin()) {
            $this->admin->register_hooks();
        }
    }

    public function load_textdomain()
    {
        load_plugin_textdomain(
            'zebracode-blog-ai',
            false,
            dirname(plugin_basename(ZEBRACODE_BLOG_AI_FILE)) . '/languages'
        );
    }

    public function maybe_install()
    {
        if (get_option(GenerationLogRepository::VERSION_OPTION, '') !== GenerationLogRepository::VERSION) {
            GenerationLogRepository::install();
        }
        if (get_option(ModuleManager::OPTION_KEY, null) === null) {
            add_option(ModuleManager::OPTION_KEY, ModuleManager::defaults(), '', false);
        }
    }

    public static function activate()
    {
        if (get_option(self::OPTION_KEY, null) === null) {
            add_option(self::OPTION_KEY, Settings::defaults(), '', false);
        }
        if (get_option(ModuleManager::OPTION_KEY, null) === null) {
            add_option(ModuleManager::OPTION_KEY, ModuleManager::defaults(), '', false);
        }
        GenerationLogRepository::install();
    }

    public static function deactivate()
    {
        // Deactivation must not delete settings or generated WordPress content.
    }
}

register_activation_hook(ZEBRACODE_BLOG_AI_FILE, array(Plugin::class, 'activate'));
register_deactivation_hook(ZEBRACODE_BLOG_AI_FILE, array(Plugin::class, 'deactivate'));
