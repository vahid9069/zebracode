<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WebP Auto-Converter Module.
 * Automatically converts uploaded PNG and JPEG images to WebP with crystal-clear 88% visual quality
 * and replaces the bulky original file to keep the server clean and fast for headless Next.js blogs.
 */
class Webp_Converter implements Module_Interface {
    const QUALITY = 80;

    public function get_id(): string {
        return 'webp_converter';
    }

    public function get_title(): string {
        return __('تبدیل خودکار به WebP (بهینه‌سازی تصاویر)', 'omni-ai-suite');
    }

    public function get_description(): string {
        return __('تبدیل خودکار و بدون افت کیفیت تمام تصاویر آپلودی (PNG و JPEG) به فرمت فوق‌سبک مدرن WebP، کاهش حجم هوشمند و پر کردن خودکار تمام متادیتای تصویر (عنوان، متن جایگزین، توضیح کوتاه و توضیحات).', 'omni-ai-suite');
    }

    public function is_active(): bool {
        $states = get_option('omni_ai_modules', []);
        return !isset($states[$this->get_id()]) || (bool) $states[$this->get_id()];
    }

    public function register(): void {
        // Convert uploads on the fly
        add_filter('wp_handle_upload', [$this, 'convert_uploaded_image_to_webp'], 10, 1);
        add_filter('wp_handle_sideload', [$this, 'convert_uploaded_image_to_webp'], 10, 1);

        // Ensure all generated sub-sizes (thumbnails) use WebP format if supported
        add_filter('image_editor_output_format', [$this, 'force_webp_subsizes'], 10, 1);

        // Ensure optimal visual quality (80%) for WebP thumbnail generation (keeps files under 100KB)
        add_filter('wp_editor_set_quality', [$this, 'set_webp_quality'], 10, 2);

        // Auto-fill all attachment metadata (Title, Alt Text, Caption, Description) on upload
        add_action('add_attachment', [$this, 'auto_fill_attachment_metadata'], 10, 1);

        // Auto-sync attachment metadata when an image is set as featured image (post thumbnail)
        add_action('added_post_meta', [$this, 'on_post_thumbnail_change'], 10, 4);
        add_action('updated_post_meta', [$this, 'on_post_thumbnail_change'], 10, 4);
    }

    /**
     * Converts newly uploaded PNG or JPEG images to WebP, downscales oversized images (max 1200px),
     * and replaces the bulky original file to drastically reduce file size.
     *
     * @param array $upload
     * @return array
     */
    public function convert_uploaded_image_to_webp(array $upload): array {
        if (!empty($upload['error'])) {
            return $upload;
        }

        $file_path = $upload['file'] ?? '';
        $mime_type = $upload['type'] ?? '';

        // Only process PNG, JPEG, and WebP (for re-compression/resizing if bulky)
        if (!in_array($mime_type, ['image/jpeg', 'image/png', 'image/webp'], true)) {
            return $upload;
        }

        if (empty($file_path) || !file_exists($file_path)) {
            return $upload;
        }

        if (!function_exists('wp_get_image_editor')) {
            require_once ABSPATH . 'wp-admin/includes/image.php';
        }

        $editor = wp_get_image_editor($file_path);
        if (is_wp_error($editor) || !$editor->supports_mime_type('image/webp')) {
            return $upload;
        }

        $path_info = pathinfo($file_path);
        $dir       = $path_info['dirname'];
        $filename  = $path_info['filename'];
        $webp_path = $dir . '/' . $filename . '.webp';

        // Downscale oversized images: max 1200px width/height while maintaining aspect ratio
        $size = $editor->get_size();
        if (!empty($size['width']) && $size['width'] > 1200) {
            $editor->resize(1200, null, false);
        } elseif (!empty($size['height']) && $size['height'] > 1200) {
            $editor->resize(null, 1200, false);
        }

        // Apply optimal 80% visual quality (WebP standard recommended by Google)
        $editor->set_quality(self::QUALITY);

        // If it was already a WebP file, re-save it with optimized dimensions/quality
        if ($mime_type === 'image/webp') {
            $saved = $editor->save($file_path, 'image/webp');
            if (!is_wp_error($saved) && !empty($saved['path'])) {
                $upload['file'] = $saved['path'];
            }
            return $upload;
        }

        // Avoid collision if a WebP with this name already exists
        if (file_exists($webp_path)) {
            $unique_name = wp_unique_filename($dir, $filename . '.webp');
            $webp_path   = $dir . '/' . $unique_name;
        }

        $saved = $editor->save($webp_path, 'image/webp');
        if (is_wp_error($saved) || empty($saved['path'])) {
            return $upload;
        }

        // Safely remove the bulky original PNG or JPEG file
        @unlink($file_path);

        // Update upload array with the new WebP file information
        $upload['file'] = $saved['path'];
        $upload['type'] = 'image/webp';

        // Update URL to point to the WebP file
        $original_url = $upload['url'] ?? '';
        if (!empty($original_url)) {
            $new_basename  = basename($saved['path']);
            $upload['url'] = dirname($original_url) . '/' . $new_basename;
        }

        return $upload;
    }

    /**
     * Automatically populates all attachment metadata: Title, Alt text, Caption, and Description.
     * Uses parent post context (title, focus keyword) if attached, or cleans filename intelligently.
     *
     * @param int $attach_id
     * @return void
     */
    public function auto_fill_attachment_metadata(int $attach_id): void {
        $attachment = get_post($attach_id);
        if (!$attachment || $attachment->post_type !== 'attachment') {
            return;
        }

        $mime = get_post_mime_type($attach_id);
        if (!str_starts_with((string) $mime, 'image/')) {
            return;
        }

        // 1. Detect parent post ID
        $parent_id = (int) $attachment->post_parent;
        if (!$parent_id && !empty($_REQUEST['post_id'])) {
            $parent_id = (int) $_REQUEST['post_id'];
        }

        $parent_title = '';
        $focus_kw     = '';

        if ($parent_id > 0) {
            $parent_post = get_post($parent_id);
            if ($parent_post) {
                $parent_title = trim($parent_post->post_title);
                $focus_kw = trim((string) get_post_meta($parent_id, '_omni_ai_focus_keyword', true));
                if (empty($focus_kw)) {
                    $focus_kw = trim((string) get_post_meta($parent_id, 'rank_math_focus_keyword', true));
                }
                if (empty($focus_kw)) {
                    $focus_kw = trim((string) get_post_meta($parent_id, '_yoast_wpseo_focuskw', true));
                }
            }
        }

        // 2. Clean filename for fallback title
        $raw_title = $attachment->post_title;
        $clean_title = sanitize_text_field(preg_replace('/[-_]+/', ' ', $raw_title));
        $clean_title = preg_replace('/\b\d{3,4}x\d{3,4}\b/', '', $clean_title);
        $clean_title = trim(preg_replace('/\s+/', ' ', $clean_title));

        if (!empty($parent_title)) {
            $img_title = !empty($focus_kw) ? "{$focus_kw} - {$parent_title}" : $parent_title;
            $alt_text  = !empty($focus_kw) ? $focus_kw : $parent_title;
            $caption   = "تصویر مرتبط با " . (!empty($focus_kw) ? $focus_kw : $parent_title);
            $desc      = "تصویر بهینه‌شده در فرمت مدرن WebP با کیفیت استاندارد و سئو برای: " . $parent_title;
        } else {
            $img_title = !empty($clean_title) ? $clean_title : 'تصویر بهینه‌شده زبراکد';
            $alt_text  = $img_title;
            $caption   = "تصویر بهینه‌شده WebP: " . $img_title;
            $desc      = "تصویر فشرده‌شده و بهینه‌سازی‌شده در فرمت WebP جهت افزایش حداکثری سرعت بارگذاری سایت.";
        }

        // 3. Set Alt Text if empty
        $current_alt = trim((string) get_post_meta($attach_id, '_wp_attachment_image_alt', true));
        if (empty($current_alt)) {
            update_post_meta($attach_id, '_wp_attachment_image_alt', sanitize_text_field($alt_text));
        }

        // 4. Set Title, Caption, Description if empty or raw filename
        $update_data = ['ID' => $attach_id];
        $needs_update = false;

        if (empty(trim($attachment->post_title)) || is_numeric($attachment->post_title) || preg_replace('/[^a-zA-Z0-9]/', '', $attachment->post_title) === $attachment->post_title) {
            $update_data['post_title'] = sanitize_text_field($img_title);
            $needs_update = true;
        }

        if (empty(trim($attachment->post_excerpt))) {
            $update_data['post_excerpt'] = sanitize_text_field($caption);
            $needs_update = true;
        }

        if (empty(trim($attachment->post_content))) {
            $update_data['post_content'] = sanitize_textarea_field($desc);
            $needs_update = true;
        }

        if ($needs_update) {
            // Remove hook temporarily to avoid infinite recursion
            remove_action('add_attachment', [$this, 'auto_fill_attachment_metadata'], 10);
            wp_update_post($update_data);
            add_action('add_attachment', [$this, 'auto_fill_attachment_metadata'], 10, 1);
        }
    }

    /**
     * When a post thumbnail (featured image) is set or updated, ensure its Alt, Title, Caption, and Description are complete.
     *
     * @param int $meta_id
     * @param int $post_id
     * @param string $meta_key
     * @param mixed $meta_value
     * @return void
     */
    public function on_post_thumbnail_change(int $meta_id, int $post_id, string $meta_key, $meta_value): void {
        if ($meta_key !== '_thumbnail_id' || empty($meta_value)) {
            return;
        }

        $attach_id = (int) $meta_value;
        if ($attach_id > 0) {
            $this->auto_fill_attachment_metadata($attach_id);
        }
    }

    /**
     * Forces thumbnail sub-sizes to be generated in WebP format.
     *
     * @param array $output_format
     * @return array
     */
    public function force_webp_subsizes(array $output_format): array {
        $output_format['image/jpeg'] = 'image/webp';
        $output_format['image/png']  = 'image/webp';
        return $output_format;
    }

    /**
     * Sets high visual quality for WebP image generation across WordPress.
     *
     * @param int $quality
     * @param string $mime_type
     * @return int
     */
    public function set_webp_quality(int $quality, string $mime_type): int {
        if ($mime_type === 'image/webp') {
            return self::QUALITY;
        }
        return $quality;
    }
}
