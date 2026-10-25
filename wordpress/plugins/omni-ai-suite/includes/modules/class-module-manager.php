<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Module Manager: ensures inactive modules NEVER load hooks or assets.
 */
class Module_Manager {
    /**
     * @var array<string, Module_Interface>
     */
    private static array $modules = [];
    private static bool $booted = false;

    public static function init(): void {
        if (self::$booted) {
            return;
        }

        self::register_default_modules();

        // Boot only active modules
        foreach (self::$modules as $module) {
            if ($module->is_active()) {
                $module->register();
            }
        }

        self::$booted = true;
    }

    private static function register_default_modules(): void {
        self::add_module(new Content_Module());
        self::add_module(new Gutenberg_Module());
        self::add_module(new Elementor_Module());
        self::add_module(new Woocommerce_Module());
        self::add_module(new Chatbot_Module());
        self::add_module(new Bulk_Module());
    }

    public static function add_module(Module_Interface $module): void {
        self::$modules[$module->get_id()] = $module;
    }

    public static function get_module(string $id): ?Module_Interface {
        return self::$modules[$id] ?? null;
    }

    /**
     * @return array<string, Module_Interface>
     */
    public static function get_all(): array {
        if (empty(self::$modules)) {
            self::register_default_modules();
        }
        return self::$modules;
    }

    /**
     * Get module statuses for UI.
     */
    public static function get_module_statuses(): array {
        $states = get_option('omni_ai_modules', []);
        $all = self::get_all();
        $output = [];
        $is_fa = str_starts_with(get_user_locale(), 'fa') || is_rtl();

        $fa_translations = [
            'content_generator' => [
                'title' => 'استودیو تولید محتوا (هسته اصلی)',
                'desc'  => 'تولید زنده مقالات، تیترها و توضیحات متا با استریم آنی SSE.',
            ],
            'gutenberg' => [
                'title' => 'ادغام با ویرایشگر گوتنبرگ (Gutenberg)',
                'desc'  => 'بلوک اختصاصی هوش مصنوعی داخل ویرایشگر گوتنبرگ وردپرس.',
            ],
            'elementor' => [
                'title' => 'ویجت اختصاصی المنتور (Elementor)',
                'desc'  => 'ابزارک هوشمند تولید محتوا مستقیماً در پنل طراحی المنتور.',
            ],
            'woocommerce' => [
                'title' => 'تولید محتوای فروشگاهی ووکامرس',
                'desc'  => 'تولید هوشمند توضیحات محصول، چکیده و ویژگی‌های سئو ووکامرس.',
            ],
            'chatbot' => [
                'title' => 'چت‌بات هوشمند تعاملی',
                'desc'  => 'دستیار شناور هوش مصنوعی برای پاسخ‌گویی به سوالات کاربران بر اساس سایت.',
            ],
            'bulk_generator' => [
                'title' => 'تولید انبوه مقالات (Bulk Generator)',
                'desc'  => 'تولید دسته‌ای نوشته‌ها در صف پس‌زمینه با Action Scheduler بدون تایم‌اوت.',
            ],
        ];

        foreach ($all as $id => $module) {
            $is_active = isset($states[$id]) ? (bool) $states[$id] : true;
            $title = ($is_fa && isset($fa_translations[$id])) ? $fa_translations[$id]['title'] : $module->get_title();
            $desc = ($is_fa && isset($fa_translations[$id])) ? $fa_translations[$id]['desc'] : $module->get_description();

            $output[] = [
                'id'          => $id,
                'title'       => $title,
                'description' => $desc,
                'active'      => $is_active,
            ];
        }

        return $output;
    }

    /**
     * Toggle module state.
     */
    public static function set_module_state(string $module_id, bool $active): void {
        $states = get_option('omni_ai_modules', []);
        $states[$module_id] = $active;
        update_option('omni_ai_modules', $states);
    }
}
