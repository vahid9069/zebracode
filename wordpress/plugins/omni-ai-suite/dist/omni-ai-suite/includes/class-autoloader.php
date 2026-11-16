<?php
namespace OmniAI;

if (!defined('ABSPATH')) {
    exit;
}

if (!function_exists('str_starts_with')) {
    function str_starts_with(?string $haystack, ?string $needle): bool {
        if ($haystack === null || $needle === null) {
            return false;
        }
        return '' === $needle || 0 === strncmp($haystack, $needle, strlen($needle));
    }
}
if (!function_exists('str_ends_with')) {
    function str_ends_with(?string $haystack, ?string $needle): bool {
        if ($haystack === null || $needle === null) {
            return false;
        }
        return '' === $needle || ('' !== $haystack && substr($haystack, -strlen($needle)) === $needle);
    }
}
if (!function_exists('str_contains')) {
    function str_contains(?string $haystack, ?string $needle): bool {
        if ($haystack === null || $needle === null) {
            return false;
        }
        return '' === $needle || false !== strpos($haystack, $needle);
    }
}

/**
 * Autoloader for Omni AI Suite classes following WordPress naming conventions.
 */
class Autoloader {
    public static function register(): void {
        spl_autoload_register([self::class, 'autoload']);
    }

    public static function autoload(string $class): void {
        $prefix = 'OmniAI\\';
        if (!str_starts_with($class, $prefix)) {
            return;
        }

        $relative_class = substr($class, strlen($prefix));
        $parts = explode('\\', $relative_class);
        $class_name = array_pop($parts);

        // Convert subnamespaces to directory paths (use forward slash for cross-platform compatibility)
        $sub_dir = '';
        if (!empty($parts)) {
            $sub_dir = strtolower(implode('/', $parts)) . '/';
        }

        // Format filename: Class_Name -> class-class-name.php, or Interface_Name -> interface-interface-name.php
        $formatted_name = strtolower(str_replace('_', '-', $class_name));
        $is_interface = str_contains(strtolower($class_name), 'interface');

        $file_prefix = $is_interface ? 'interface-' : 'class-';
        // If the interface is named AI_Provider_Interface, formatted_name is ai-provider-interface
        // In WP standard, it might be interface-ai-provider.php
        $file_name = $file_prefix . str_replace(['-interface', 'interface-'], '', $formatted_name) . '.php';

        $file_path = OMNI_AI_PATH . 'includes/' . $sub_dir . $file_name;

        if (file_exists($file_path)) {
            require_once $file_path;
            return;
        }

        // Fallback check with exact formatted name
        $fallback_path = OMNI_AI_PATH . 'includes/' . $sub_dir . 'class-' . $formatted_name . '.php';
        if (file_exists($fallback_path)) {
            require_once $fallback_path;
        }
    }
}

Autoloader::register();
