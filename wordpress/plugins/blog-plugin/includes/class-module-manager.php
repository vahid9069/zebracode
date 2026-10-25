<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Feature switches for the modular plugin surface.
 */
final class ModuleManager
{
    const OPTION_KEY = 'zebracode_blog_ai_modules';

    public static function defaults()
    {
        return array(
            'studio' => true,
            'streaming' => true,
            'content' => true,
            'seo' => true,
            'featured_image' => true,
            'bulk' => true,
            'gutenberg' => false,
            'elementor' => false,
            'woocommerce' => false,
            'chatbot' => false,
        );
    }

    public static function all()
    {
        $stored = get_option(self::OPTION_KEY, array());
        return wp_parse_args(is_array($stored) ? $stored : array(), self::defaults());
    }

    public static function enabled($module)
    {
        $modules = self::all();
        $module = sanitize_key((string) $module);

        return isset($modules[$module]) && (bool) $modules[$module];
    }

    public static function sanitize($input)
    {
        $input = is_array($input) ? $input : array();
        $result = self::defaults();

        foreach ($result as $module => $enabled) {
            if (array_key_exists($module, $input)) {
                $result[$module] = !empty($input[$module]);
            }
        }

        return $result;
    }
}
