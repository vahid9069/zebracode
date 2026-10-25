<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

final class Settings
{
    const OPTION_GROUP = 'zebracode_blog_ai';
    const CONNECTOR_ID = 'zebracode_blog_ai';
    const CONNECTOR_SETTING = 'zebracode_blog_ai_connector_key';
    const CONNECTOR_ENV_VAR = 'ZEBRACODE_BLOG_AI_API_KEY';
    const CONNECTOR_CONSTANT = 'ZEBRACODE_BLOG_AI_API_KEY';

    public static function defaults()
    {
        return array(
            'provider' => 'openai-compatible',
            'endpoint' => 'https://api.openai.com/v1',
            'model' => '',
            'image_model' => '',
            'api_key' => '',
        );
    }

    public function register_hooks()
    {
        add_action('admin_init', array($this, 'register'));

        if (function_exists('wp_get_connectors')) {
            add_action('wp_connectors_init', array($this, 'register_connector'));
        }
    }

    public function register()
    {
        register_setting(
            self::OPTION_GROUP,
            Plugin::OPTION_KEY,
            array(
                'type' => 'array',
                'sanitize_callback' => array($this, 'sanitize'),
                'default' => self::defaults(),
            )
        );
        register_setting(
            self::OPTION_GROUP,
            ModuleManager::OPTION_KEY,
            array(
                'type' => 'array',
                'sanitize_callback' => array('ZebraCode\\BlogAI\\ModuleManager', 'sanitize'),
                'default' => ModuleManager::defaults(),
            )
        );

        add_settings_section(
            'zebracode_blog_ai_provider',
            __('AI provider', 'zebracode-blog-ai'),
            array($this, 'render_provider_description'),
            'zebracode-blog-ai'
        );

        add_settings_field(
            'provider',
            __('Provider type', 'zebracode-blog-ai'),
            array($this, 'render_provider_field'),
            'zebracode-blog-ai',
            'zebracode_blog_ai_provider'
        );
        add_settings_field(
            'endpoint',
            __('API base URL', 'zebracode-blog-ai'),
            array($this, 'render_endpoint_field'),
            'zebracode-blog-ai',
            'zebracode_blog_ai_provider'
        );
        add_settings_field(
            'model',
            __('Model', 'zebracode-blog-ai'),
            array($this, 'render_model_field'),
            'zebracode-blog-ai',
            'zebracode_blog_ai_provider'
        );
        add_settings_field(
            'connection',
            __('Provider connection', 'zebracode-blog-ai'),
            array($this, 'render_connection_field'),
            'zebracode-blog-ai',
            'zebracode_blog_ai_provider'
        );
        add_settings_field(
            'image_model',
            __('Featured image model', 'zebracode-blog-ai'),
            array($this, 'render_image_model_field'),
            'zebracode-blog-ai',
            'zebracode_blog_ai_provider'
        );
        add_settings_field(
            'modules',
            __('Feature modules', 'zebracode-blog-ai'),
            array($this, 'render_modules_field'),
            'zebracode-blog-ai',
            'zebracode_blog_ai_provider'
        );
    }

    public function sanitize($input)
    {
        $current = $this->get_stored();
        $input = is_array($input) ? $input : array();

        $api_key = isset($input['api_key']) ? trim((string) $input['api_key']) : '';

        $provider = isset($input['provider']) ? sanitize_key((string) $input['provider']) : $current['provider'];
        if (!in_array($provider, array('openai-compatible', 'gemini'), true)) {
            $provider = 'openai-compatible';
        }

        return array(
            'provider' => $provider,
            'endpoint' => isset($input['endpoint']) ? esc_url_raw(trim((string) $input['endpoint'])) : self::defaults()['endpoint'],
            'model' => isset($input['model']) ? sanitize_text_field($input['model']) : '',
            'image_model' => isset($input['image_model']) ? sanitize_text_field($input['image_model']) : '',
            // An empty password field means “keep the existing key”.
            'api_key' => $api_key !== '' ? sanitize_text_field($api_key) : $current['api_key'],
        );
    }

    public function get()
    {
        $settings = $this->get_stored();
        $settings['api_key'] = $this->get_api_key($settings['api_key']);

        return $settings;
    }

    /**
     * Return the plugin's own stored settings without resolving a Connector
     * key. This keeps legacy credentials from being copied into the plugin
     * option when the settings form is saved after Connector migration.
     *
     * @return array
     */
    private function get_stored()
    {
        $settings = get_option(Plugin::OPTION_KEY, array());

        return wp_parse_args(is_array($settings) ? $settings : array(), self::defaults());
    }

    /**
     * Register the plugin's credential in WordPress' Connectors screen.
     *
     * This is deliberately a non-AI connector. The current plugin has its own
     * OpenAI-compatible and Gemini adapters, so it is not yet a provider in the
     * WordPress AI Client registry and should not be validated as one by Core.
     *
     * @param object $registry
     * @return void
     */
    public function register_connector($registry)
    {
        if (!is_object($registry) || !method_exists($registry, 'register') || !function_exists('wp_is_connector_registered')) {
            return;
        }

        if (wp_is_connector_registered(self::CONNECTOR_ID)) {
            return;
        }

        $registry->register(
            self::CONNECTOR_ID,
            array(
                'name' => __('ZebraCode Blog AI', 'zebracode-blog-ai'),
                'description' => __('API key used by the ZebraCode content generation adapters.', 'zebracode-blog-ai'),
                'type' => 'content_generation',
                'authentication' => array(
                    'method' => 'api_key',
                    'setting_name' => self::CONNECTOR_SETTING,
                    'constant_name' => self::CONNECTOR_CONSTANT,
                    'env_var_name' => self::CONNECTOR_ENV_VAR,
                ),
                'plugin' => array(
                    'file' => plugin_basename(ZEBRACODE_BLOG_AI_FILE),
                    'is_active' => function () {
                        return defined('ZEBRACODE_BLOG_AI_VERSION');
                    },
                ),
            )
        );
    }

    /**
     * Return the effective API key without exposing it to the browser.
     * Environment and constant values follow Core's Connector precedence,
     * then the Connector option, then the legacy plugin option.
     *
     * @param string $legacy_key
     * @return string
     */
    private function get_api_key($legacy_key = '')
    {
        $env_key = getenv(self::CONNECTOR_ENV_VAR);
        if ($env_key !== false && trim((string) $env_key) !== '') {
            return trim((string) $env_key);
        }

        if (defined(self::CONNECTOR_CONSTANT) && trim((string) constant(self::CONNECTOR_CONSTANT)) !== '') {
            return trim((string) constant(self::CONNECTOR_CONSTANT));
        }

        $setting_name = $this->connector_setting_name();
        if ($setting_name !== '') {
            $connector_key = get_option($setting_name, '');
            if (is_string($connector_key) && trim($connector_key) !== '') {
                return trim($connector_key);
            }
        }

        return is_scalar($legacy_key) ? trim((string) $legacy_key) : '';
    }

    /**
     * Return the source currently providing the effective API key.
     *
     * @return string
     */
    public function api_key_source()
    {
        $env_key = getenv(self::CONNECTOR_ENV_VAR);
        if ($env_key !== false && trim((string) $env_key) !== '') {
            return 'env';
        }

        if (defined(self::CONNECTOR_CONSTANT) && trim((string) constant(self::CONNECTOR_CONSTANT)) !== '') {
            return 'constant';
        }

        $setting_name = $this->connector_setting_name();
        if ($setting_name !== '') {
            $connector_key = get_option($setting_name, '');
            if (is_string($connector_key) && trim($connector_key) !== '') {
                return 'connector';
            }
        }

        return $this->get_stored()['api_key'] !== '' ? 'legacy' : 'none';
    }

    /**
     * Resolve the registered Connector option name without calling the lookup
     * API before the registry is initialized or for an unregistered ID.
     *
     * @return string
     */
    private function connector_setting_name()
    {
        if (!function_exists('wp_get_connector') || !function_exists('wp_is_connector_registered') || !wp_is_connector_registered(self::CONNECTOR_ID)) {
            return '';
        }

        $connector = wp_get_connector(self::CONNECTOR_ID);

        return is_array($connector) && isset($connector['authentication']['setting_name'])
            ? (string) $connector['authentication']['setting_name']
            : self::CONNECTOR_SETTING;
    }

    public function render_provider_description()
    {
        $provider = $this->get()['provider'];
        if ($provider === 'gemini') {
            echo '<p>' . esc_html__('Gemini uses the native Generative Language API. Use the base URL https://generativelanguage.googleapis.com/v1beta, a text model such as gemini-flash-latest, and an image model such as gemini-3.1-flash-image. Requests stay on the server.', 'zebracode-blog-ai') . '</p>';
            return;
        }

        echo '<p>' . esc_html__('OpenAI-compatible chat and image endpoints are supported when the selected server exposes both /chat/completions and /images/generations. Requests stay on the server; no key is exposed to the browser.', 'zebracode-blog-ai') . '</p>';
    }

    public function render_provider_field()
    {
        $settings = $this->get();
        printf(
            '<select class="regular-text zc-ltr-field" dir="ltr" name="%1$s[provider]"><option value="openai-compatible"%2$s>%3$s</option><option value="gemini"%4$s>%5$s</option></select><p class="description">%6$s</p>',
            esc_attr(Plugin::OPTION_KEY),
            selected($settings['provider'], 'openai-compatible', false),
            esc_html__('OpenAI-compatible (initial adapter)', 'zebracode-blog-ai'),
            selected($settings['provider'], 'gemini', false),
            esc_html__('Google Gemini (Generative Language API)', 'zebracode-blog-ai'),
            esc_html__('Gemini uses the native generateContent API and sends the key through the X-goog-api-key header. Save the matching endpoint and model below.', 'zebracode-blog-ai')
        );
    }

    public function render_endpoint_field()
    {
        $settings = $this->get();
        $placeholder = $settings['provider'] === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta' : 'https://api.openai.com/v1';
        printf(
            '<input class="regular-text zc-ltr-field" dir="ltr" type="url" name="%1$s[endpoint]" value="%2$s" placeholder="%3$s" />',
            esc_attr(Plugin::OPTION_KEY),
            esc_attr($settings['endpoint']),
            esc_attr($placeholder)
        );
    }

    public function render_model_field()
    {
        $settings = $this->get();
        $model = $settings['model'];
        $fallback = $settings['provider'] === 'gemini' ? 'gemini-flash-latest' : 'gpt-4o-mini';
        echo '<select class="regular-text zc-ltr-field" dir="ltr" data-model-field name="' . esc_attr(Plugin::OPTION_KEY) . '[model]">';
        if ($model !== '') {
            echo '<option value="' . esc_attr($model) . '" selected>' . esc_html($model) . '</option>';
        } else {
            echo '<option value="" selected>' . esc_html(sprintf(__('Load models or enter a model such as %s', 'zebracode-blog-ai'), $fallback)) . '</option>';
        }
        echo '</select><p class="description">' . esc_html__('Use Load models below to replace this list with models returned by the selected API.', 'zebracode-blog-ai') . '</p>';
    }

    public function render_connection_field()
    {
        if (function_exists('wp_get_connectors')) {
            $source = $this->api_key_source();
            $status = $source === 'none'
                ? __('Not connected', 'zebracode-blog-ai')
                : __('Connected', 'zebracode-blog-ai');
            $details = $source === 'legacy'
                ? __('A legacy key is still being used. Move it to the WordPress Connectors page when convenient.', 'zebracode-blog-ai')
                : __('Manage the server-side API key in the official WordPress Connectors page.', 'zebracode-blog-ai');
            $url = admin_url('options-connectors.php');
            printf(
                '<a class="button" href="%1$s">%2$s</a><p class="description">%3$s %4$s</p>',
                esc_url($url),
                esc_html__('Manage connection', 'zebracode-blog-ai'),
                esc_html($details),
                esc_html(sprintf(__('Status: %s.', 'zebracode-blog-ai'), $status))
            );
            return;
        }

        $settings = $this->get_stored();
        printf(
            '<input class="regular-text zc-ltr-field" dir="ltr" type="password" name="%1$s[api_key]" value="" autocomplete="new-password" placeholder="%2$s" /><p class="description">%3$s</p>',
            esc_attr(Plugin::OPTION_KEY),
            esc_attr($settings['api_key'] !== '' ? __('Saved; enter a new key to replace it', 'zebracode-blog-ai') : __('Paste the server-side API key', 'zebracode-blog-ai')),
            esc_html__('This WordPress version does not provide Connectors, so the key is stored in the plugin settings. Save the key before loading models or testing the connection.', 'zebracode-blog-ai')
        );
    }

    public function render_image_model_field()
    {
        $settings = $this->get();
        $placeholder = $settings['provider'] === 'gemini' ? 'gemini-3.1-flash-image' : 'gpt-image-1';
        printf(
            '<input class="regular-text zc-ltr-field" dir="ltr" type="text" data-image-model-field name="%1$s[image_model]" value="%2$s" placeholder="%3$s" /><p class="description">%4$s</p>',
            esc_attr(Plugin::OPTION_KEY),
            esc_attr($settings['image_model']),
            esc_attr($placeholder),
            esc_html__('Use an image-capable model with the same provider API key. Leave empty to use the provider default.', 'zebracode-blog-ai')
        );
    }

    public function render_modules_field()
    {
        $modules = ModuleManager::all();
        $labels = array(
            'studio' => __('AI Studio', 'zebracode-blog-ai'),
            'streaming' => __('Streaming responses', 'zebracode-blog-ai'),
            'content' => __('Content generation', 'zebracode-blog-ai'),
            'seo' => __('SEO tools', 'zebracode-blog-ai'),
            'featured_image' => __('Featured images', 'zebracode-blog-ai'),
            'bulk' => __('Bulk generation', 'zebracode-blog-ai'),
            'gutenberg' => __('Gutenberg integration', 'zebracode-blog-ai'),
            'elementor' => __('Elementor integration', 'zebracode-blog-ai'),
            'woocommerce' => __('WooCommerce integration', 'zebracode-blog-ai'),
            'chatbot' => __('Chatbot module', 'zebracode-blog-ai'),
        );

        echo '<fieldset class="zc-module-grid">';
        foreach ($labels as $module => $label) {
            printf(
                '<label><input type="checkbox" name="%1$s[%2$s]" value="1"%3$s /> %4$s</label>',
                esc_attr(ModuleManager::OPTION_KEY),
                esc_attr($module),
                checked(!empty($modules[$module]), true, false),
                esc_html($label)
            );
        }
        echo '</fieldset><p class="description">' . esc_html__('Disabled modules register no integration hooks or assets.', 'zebracode-blog-ai') . '</p>';
    }
}
