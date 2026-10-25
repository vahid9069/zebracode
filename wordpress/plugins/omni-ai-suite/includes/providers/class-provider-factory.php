<?php
namespace OmniAI\Providers;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Service Provider Factory & Registry.
 * Deeply integrates with WordPress Core Connectors API (wp-admin/options-connectors.php)
 * to automatically reuse API keys configured across the site.
 */
class Provider_Factory {
    private static ?array $providers = null;

    /**
     * Get instance of a specific provider or default configured provider.
     */
    public static function get_provider(?string $provider_id = null): AI_Provider_Interface {
        $providers = self::get_all_providers();
        $settings = self::get_settings();

        if (empty($provider_id)) {
            $provider_id = $settings['default_provider'] ?? 'gemini';
        }

        if (isset($providers[$provider_id])) {
            return $providers[$provider_id];
        }

        // Return first configured provider if default is invalid
        foreach ($providers as $provider) {
            if ($provider->is_configured()) {
                return $provider;
            }
        }

        // Return default provider even if unconfigured (it will throw clean error upon invocation)
        return $providers['gemini'] ?? reset($providers);
    }

    /**
     * Retrieve all instantiated providers based on saved settings & core connectors.
     *
     * @return array<string, AI_Provider_Interface>
     */
    public static function get_all_providers(): array {
        if (self::$providers !== null) {
            return self::$providers;
        }

        $settings = self::get_settings();

        self::$providers = [
            'gemini' => new Gemini_Provider(
                $settings['gemini_api_key'] ?? '',
                $settings['gemini_model'] ?? 'gemini-1.5-flash'
            ),
            'openai' => new OpenAI_Provider(
                $settings['openai_api_key'] ?? '',
                $settings['openai_model'] ?? 'gpt-4o-mini'
            ),
            'claude' => new Claude_Provider(
                $settings['claude_api_key'] ?? '',
                $settings['claude_model'] ?? 'claude-3-5-sonnet-20241022'
            ),
        ];

        return self::$providers;
    }

    /**
     * Resolve effective API key with WordPress Connectors (options-connectors.php) priority.
     * Priority order:
     * 1. WordPress Core Connectors API (wp_get_connector / options-connectors.php)
     * 2. Direct Core Connector options (connectors_ai_*_api_key)
     * 3. Constants / Env vars (GOOGLE_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY)
     * 4. Plugin's own custom settings (omni_ai_settings)
     *
     * @param string $provider 'gemini', 'openai', or 'claude'
     * @param string $legacy_key Custom key saved in plugin settings
     * @return array ['key' => string, 'source' => 'connector'|'constant'|'env'|'plugin'|'none']
     */
    public static function resolve_api_key(string $provider, string $legacy_key = ''): array {
        // 1. Check WordPress Core Connectors API registry (options-connectors.php)
        if (function_exists('wp_get_connector')) {
            switch ($provider) {
                case 'gemini':
                case 'google':
                    $connector_ids = ['google', 'gemini'];
                    break;
                case 'openai':
                    $connector_ids = ['openai', 'openai-compatible'];
                    break;
                case 'claude':
                case 'anthropic':
                    $connector_ids = ['anthropic', 'claude'];
                    break;
                default:
                    $connector_ids = [$provider];
                    break;
            }

            foreach ($connector_ids as $cid) {
                if (function_exists('wp_is_connector_registered') && !wp_is_connector_registered($cid)) {
                    continue;
                }
                $connector = wp_get_connector($cid);
                if (is_array($connector) && !empty($connector['authentication'])) {
                    $auth = $connector['authentication'];

                    // Check Env var from connector definition
                    if (!empty($auth['env_var_name'])) {
                        $env = getenv($auth['env_var_name']);
                        if ($env !== false && trim((string) $env) !== '') {
                            return ['key' => trim((string) $env), 'source' => 'env'];
                        }
                    }

                    // Check Constant from connector definition
                    if (!empty($auth['constant_name']) && defined($auth['constant_name'])) {
                        $cval = constant($auth['constant_name']);
                        if (is_scalar($cval) && trim((string) $cval) !== '') {
                            return ['key' => trim((string) $cval), 'source' => 'constant'];
                        }
                    }

                    // Check database option from connector definition
                    if (!empty($auth['setting_name'])) {
                        $opt_val = get_option($auth['setting_name'], '');
                        if (is_string($opt_val) && trim($opt_val) !== '') {
                            return ['key' => trim($opt_val), 'source' => 'connector'];
                        }
                    }
                }
            }
        }

        // 2. Direct database options created by options-connectors.php
        switch ($provider) {
            case 'gemini':
            case 'google':
                $direct_connector_options = [
                    'connectors_ai_google_api_key',
                    'connectors_google_api_key',
                    'connectors_ai_gemini_api_key',
                    'google_api_key',
                ];
                break;
            case 'openai':
                $direct_connector_options = [
                    'connectors_ai_openai_api_key',
                    'connectors_openai_api_key',
                    'openai_api_key',
                ];
                break;
            case 'claude':
            case 'anthropic':
                $direct_connector_options = [
                    'connectors_ai_anthropic_api_key',
                    'connectors_anthropic_api_key',
                    'anthropic_api_key',
                    'claude_api_key',
                ];
                break;
            default:
                $direct_connector_options = [];
                break;
        }

        foreach ($direct_connector_options as $opt_name) {
            $opt_val = get_option($opt_name, '');
            if (is_string($opt_val) && trim($opt_val) !== '') {
                return ['key' => trim($opt_val), 'source' => 'connector'];
            }
        }

        // 3. System constants / Environment variables
        switch ($provider) {
            case 'gemini':
            case 'google':
                $constants = ['GOOGLE_API_KEY', 'GEMINI_API_KEY'];
                break;
            case 'openai':
                $constants = ['OPENAI_API_KEY'];
                break;
            case 'claude':
            case 'anthropic':
                $constants = ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY'];
                break;
            default:
                $constants = [];
                break;
        }

        foreach ($constants as $const_name) {
            $env_val = getenv($const_name);
            if ($env_val !== false && trim((string) $env_val) !== '') {
                return ['key' => trim((string) $env_val), 'source' => 'env'];
            }
            if (defined($const_name)) {
                $const_val = constant($const_name);
                if (is_scalar($const_val) && trim((string) $const_val) !== '') {
                    return ['key' => trim((string) $const_val), 'source' => 'constant'];
                }
            }
        }

        // 4. Query wp_options directly for any matching connector setting
        global $wpdb;
        if (isset($wpdb)) {
            switch ($provider) {
                case 'gemini':
                case 'google':
                    $like_patterns = ['connectors%google%', 'connectors%gemini%', '%google%api_key%'];
                    break;
                case 'openai':
                    $like_patterns = ['connectors%openai%', '%openai%api_key%'];
                    break;
                case 'claude':
                case 'anthropic':
                    $like_patterns = ['connectors%anthropic%', 'connectors%claude%', '%claude%api_key%'];
                    break;
                default:
                    $like_patterns = [];
                    break;
            }
            foreach ($like_patterns as $pattern) {
                $found = $wpdb->get_var($wpdb->prepare(
                    "SELECT option_value FROM {$wpdb->options} WHERE option_name LIKE %s AND option_value != '' LIMIT 1",
                    $pattern
                ));
                if (!empty($found) && is_string($found) && strlen(trim($found)) > 10) {
                    return ['key' => trim($found), 'source' => 'connector'];
                }
            }
        }

        // 5. Fallback to custom plugin-stored key
        if (!empty($legacy_key) && trim($legacy_key) !== '') {
            return ['key' => trim($legacy_key), 'source' => 'plugin'];
        }

        return ['key' => '', 'source' => 'none'];
    }

    /**
     * Get settings merging plugin preferences with core WP Connectors keys.
     */
    public static function get_settings(): array {
        $stored = get_option('omni_ai_settings', []);
        if (!is_array($stored)) {
            $stored = [];
        }

        // Automatically resolve API keys from options-connectors.php
        $gemini_res = self::resolve_api_key('gemini', $stored['gemini_api_key'] ?? '');
        $openai_res = self::resolve_api_key('openai', $stored['openai_api_key'] ?? '');
        $claude_res = self::resolve_api_key('claude', $stored['claude_api_key'] ?? '');

        $stored['gemini_api_key'] = $gemini_res['key'];
        $stored['gemini_key_source'] = $gemini_res['source'];

        $stored['openai_api_key'] = $openai_res['key'];
        $stored['openai_key_source'] = $openai_res['source'];

        $stored['claude_api_key'] = $claude_res['key'];
        $stored['claude_key_source'] = $claude_res['source'];

        // Automatically pick configured default provider if current default has no key
        $default_provider = $stored['default_provider'] ?? 'gemini';
        if ($default_provider === 'gemini' && empty($stored['gemini_api_key'])) {
            if (!empty($stored['openai_api_key'])) {
                $default_provider = 'openai';
            } elseif (!empty($stored['claude_api_key'])) {
                $default_provider = 'claude';
            }
        }

        return wp_parse_args($stored, [
            'default_provider'       => $default_provider,
            'fallback_provider'      => $stored['fallback_provider'] ?? 'none',
            'default_image_provider' => $stored['default_image_provider'] ?? 'pollinations',
            'gemini_api_key'         => '',
            'gemini_key_source'      => 'none',
            'gemini_model'           => 'gemini-1.5-flash',
            'openai_api_key'         => '',
            'openai_key_source'      => 'none',
            'openai_model'           => 'gpt-4o-mini',
            'claude_api_key'         => '',
            'claude_key_source'      => 'none',
            'claude_model'           => 'claude-3-5-sonnet-20241022',
            'temperature'            => 0.7,
            'max_tokens'             => 2000,
        ]);
    }

    /**
     * Reset cached provider instances (e.g. after saving options).
     */
    public static function reset(): void {
        self::$providers = null;
    }
}
