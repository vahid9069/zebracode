<?php
namespace OmniAI\Api;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles media sideloading stubs and visual prompt helpers.
 *
 * NOTE: Automatic external image generation & sideloading has been deprecated in favor of the
 * Prompt-First Visual Workflow (generating high-precision prompts for author-guided generation).
 */
class Media_Sideloader {
    /**
     * Deprecated stub: External image generation disabled in favor of Prompt-First workflow.
     *
     * @param int $post_id
     * @param string $title
     * @param string $provider
     * @param string $style
     * @param string $custom_prompt
     * @return array
     */
    public static function attach_featured_image(int $post_id, string $title, string $provider = 'gemini', string $style = 'dark_slate_neon', string $custom_prompt = ''): array {
        $final_prompt = self::build_visual_image_prompt($title, $style, $custom_prompt);
        update_post_meta($post_id, '_omni_ai_featured_image_prompt', $final_prompt);

        return [
            'success' => false,
            'message' => 'Automatic external image generation is deprecated in favor of Prompt-First Visual Workflow.',
            'prompt'  => $final_prompt,
        ];
    }

    /**
     * Deprecated stub: Sideloading via external image APIs disabled.
     *
     * @param int $post_id
     * @param string $title
     * @param string $prompt
     * @param string $provider
     * @param bool $is_featured
     * @return array
     */
    public static function attach_image_by_provider(int $post_id, string $title, string $prompt, string $provider = 'gemini', bool $is_featured = false): array {
        return [
            'success' => false,
            'message' => 'External image API calls are disabled.',
            'prompt'  => $prompt,
        ];
    }

    /**
     * Deprecated stub for local image sideloading.
     *
     * @param string $file_path
     * @param int $post_id
     * @param string $title
     * @param string $prompt
     * @param bool $is_featured
     * @return array
     */
    public static function sideload_local_image_file(string $file_path, int $post_id, string $title, string $prompt, bool $is_featured = false): array {
        return [
            'success' => false,
            'message' => 'Local image sideloading is deprecated.',
        ];
    }

    /**
     * Builds a structured, high-clarity English visual prompt from article title & style preset.
     *
     * @param string $title
     * @param string $style
     * @param string $custom_prompt
     * @return string
     */
    public static function build_visual_image_prompt(string $title, string $style = 'dark_slate_neon', string $custom_prompt = ''): string {
        if (!empty($custom_prompt) && strlen(trim($custom_prompt)) > 5) {
            return trim($custom_prompt) . ", 16:9 aspect ratio, 1200x675 resolution, wide angle landscape composition, --ar 16:9, --q 1, modern developer aesthetic, lightweight web asset, no text, no watermark, no logo";
        }

        // Extract key English tech words if present in the Persian title (e.g. JSON, Python, React, AI, CSS, API)
        preg_match_all('/[a-zA-Z0-9#\+\.\-]+/', $title, $matches);
        $keywords = !empty($matches[0]) ? implode(' ', array_slice($matches[0], 0, 4)) : '';

        if (!empty($keywords)) {
            $subject = "Modern conceptual illustration of {$keywords}";
        } else {
            $subject = "Modern software technology, developer tools, and programming architecture concept";
        }

        $style_map = [
            'dark_slate_neon' => 'dark slate and electric cyan aesthetic, #0f172a deep background with glowing cyan #38bdf8 accents and crisp vector 3D elements, minimal developer dark mode theme, subtle grid lines, studio lighting, clean web banner render',
            'isometric_3d'    => 'clean miniature 3D isometric tech scene, miniature servers, floating code blocks, soft studio ambient lighting, smooth clay and glass materials, vibrant modern tech palette',
            'minimal_flat'    => 'modern minimal flat vector illustration, Stripe and GitHub blog style, clean geometric lines, high-contrast contemporary tech graphics, balanced white-space, vector art',
            'blueprint'       => 'technical software architecture blueprint, schematic engineering grid on deep navy background #0a0f1d, glowing white and laser-blue vector connection lines, high detail flow diagram art',
            'glassmorphism'   => 'modern glassmorphism UI concept, frosted translucent dark acrylic glass cards, subtle neon gradients, floating developer code symbols, soft blur depth of field',
        ];

        $style_desc = $style_map[$style] ?? $style_map['dark_slate_neon'];

        return "{$subject}, {$style_desc}, 16:9 aspect ratio, 1200x675 resolution, clean sharp vector styling, lightweight web asset, web banner composition, --ar 16:9, --q 1, no text, no typography, no watermark, no logos, no blur";
    }

    /**
     * Generates a clean English slug & filename for the image.
     *
     * @param string $title
     * @param int $post_id
     * @return string
     */
    public static function build_english_slug(string $title, int $post_id): string {
        preg_match_all('/[a-zA-Z0-9]+/', $title, $matches);
        $english_words = !empty($matches[0]) ? array_map('strtolower', $matches[0]) : [];

        if (!empty($english_words)) {
            $slug_base = implode('-', array_slice($english_words, 0, 3));
        } else {
            $slug_base = 'article-banner';
        }

        $clean = sanitize_title("{$slug_base}-featured-{$post_id}");
        return $clean ?: "post-featured-{$post_id}";
    }

    /**
     * Resolve and ensure a 100% clean English slug for WordPress posts.
     *
     * @param string $raw_slug
     * @param string $title
     * @param array $image_prompts
     * @return string
     */
    public static function resolve_english_slug(string $raw_slug, string $title, array $image_prompts = []): string {
        // 1. If explicit slug provided in JSON, clean and verify English characters
        if (!empty($raw_slug)) {
            $slug = strtolower(trim($raw_slug));
            $slug = preg_replace('/[^a-z0-9\- ]/i', '', $slug);
            $slug = preg_replace('/[\s\-]+/', '-', $slug);
            $slug = trim($slug, '-');
            if (strlen($slug) >= 3) {
                return $slug;
            }
        }

        // 2. Try to extract English words from title (e.g. "راهنمای React و Next.js" -> "react-nextjs")
        if (preg_match_all('/[a-zA-Z0-9]{2,}/', $title, $m) && !empty($m[0])) {
            $slug = strtolower(implode('-', array_slice($m[0], 0, 5)));
            if (strlen($slug) >= 3) {
                return $slug;
            }
        }

        // 3. Extract meaningful English keywords from the first image prompt
        if (!empty($image_prompts) && is_array($image_prompts)) {
            $first_prompt = (string) ($image_prompts[0] ?? '');
            $clean_prompt = preg_replace('/\b(cinematic|illustration|render|isometric|highly|detailed|hyper|8k|4k|unreal|engine|realistic|photography|wallpaper|background|style)\b/i', '', $first_prompt);
            if (preg_match_all('/[a-zA-Z]{3,}/', $clean_prompt, $m) && !empty($m[0])) {
                $slug = strtolower(implode('-', array_slice($m[0], 0, 4)));
                if (strlen($slug) >= 3) {
                    return $slug;
                }
            }
        }

        return 'article-' . current_time('timestamp');
    }
}
