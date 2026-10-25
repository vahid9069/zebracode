<?php

namespace ZebraCode\BlogAI;

use ZebraCode\BlogAI\Contracts\AIProviderInterface;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Generates and attaches a featured image for a newly generated draft.
 *
 * The image uses the configured provider credentials, but an image-capable
 * model is selected separately from the text model. If image generation fails,
 * the article draft can still be reviewed; callers decide whether the failure
 * should block their workflow.
 */
final class FeaturedImageGenerator
{
    /** @var AIProviderInterface */
    private $provider;

    public function __construct(AIProviderInterface $provider)
    {
        $this->provider = $provider;
    }

    /**
     * Generate, upload, and attach one featured image to a post.
     *
     * @param int    $post_id
     * @param array  $article
     * @param array  $brief
     * @param string $model
     * @return int Attachment ID, or the existing thumbnail ID.
     */
    public function attach($post_id, array $article, array $brief = array(), $model = '')
    {
        $post_id = absint($post_id);
        if ($post_id < 1 || !get_post($post_id)) {
            throw new \InvalidArgumentException(__('The destination post for the featured image was not found.', 'zebracode-blog-ai'));
        }

        $existing = function_exists('get_post_thumbnail_id') ? absint(get_post_thumbnail_id($post_id)) : 0;
        if ($existing > 0) {
            return $existing;
        }

        if (!method_exists($this->provider, 'generate_image')) {
            throw new \RuntimeException(__('The selected provider does not expose an image generation endpoint.', 'zebracode-blog-ai'));
        }

        $title = isset($article['title']) && is_scalar($article['title']) ? trim((string) $article['title']) : '';
        $topic = isset($brief['topic']) && is_scalar($brief['topic']) ? trim((string) $brief['topic']) : $title;
        $prompt = $this->prompt($title, $topic, $brief);
        $image = $this->provider->generate_image(
            $prompt,
            array(
                'image_model' => isset($brief['image_model']) && is_scalar($brief['image_model']) ? (string) $brief['image_model'] : '',
                'size' => '1536x1024',
                'quality' => 'low',
                'aspect_ratio' => '16:9',
                'image_size' => '1K',
            )
        );

        if (!is_array($image) || empty($image['data']) || !is_string($image['data'])) {
            throw new \RuntimeException(__('The image provider returned no usable image data.', 'zebracode-blog-ai'));
        }

        return $this->upload($post_id, $title !== '' ? $title : $topic, $image);
    }

    /**
     * @param string $title
     * @param string $topic
     * @param array  $brief
     * @return string
     */
    private function prompt($title, $topic, array $brief)
    {
        $context = array_filter(array(
            $topic !== '' ? 'Topic: ' . $topic : '',
            $title !== '' ? 'Article title: ' . $title : '',
            isset($brief['category']) && is_scalar($brief['category']) ? 'Category: ' . (string) $brief['category'] : '',
        ));

        return implode("\n", array(
            'Create a polished editorial featured image for a Persian developer blog article.',
            implode("\n", $context),
            'Use a clean modern technical illustration with strong visual hierarchy, generous negative space, and a professional blue/slate palette.',
            'Landscape 16:9 composition suitable for a WordPress featured image and social preview.',
            'Do not render any words, letters, Persian text, English text, logos, watermarks, UI screenshots, fake code, or brand marks inside the image.',
            'Prefer an abstract but concrete visual metaphor for the technical topic. Keep the subject centered and readable at thumbnail size.',
        ));
    }

    /**
     * @param int   $post_id
     * @param string $title
     * @param array $image
     * @return int
     */
    private function upload($post_id, $title, array $image)
    {
        if (defined('ABSPATH')) {
            $includes = array(
                ABSPATH . 'wp-admin/includes/file.php',
                ABSPATH . 'wp-admin/includes/image.php',
                ABSPATH . 'wp-admin/includes/media.php',
            );
            foreach ($includes as $include) {
                if (file_exists($include)) {
                    require_once $include;
                }
            }
        }

        if (!function_exists('wp_upload_bits') || !function_exists('wp_insert_attachment')) {
            throw new \RuntimeException(__('WordPress media functions are unavailable.', 'zebracode-blog-ai'));
        }

        $mime = isset($image['mime_type']) && is_scalar($image['mime_type']) ? strtolower((string) $image['mime_type']) : 'image/png';
        $extension = isset($image['extension']) && is_scalar($image['extension']) ? sanitize_key((string) $image['extension']) : $this->extension($mime);
        if (!in_array($mime, array('image/png', 'image/jpeg', 'image/webp'), true)) {
            $mime = 'image/png';
        }
        if (!in_array($extension, array('png', 'jpg', 'jpeg', 'webp'), true)) {
            $extension = $this->extension($mime);
        }

        $filename = sanitize_file_name($title !== '' ? $title : 'zebracode-featured-image');
        $filename = ($filename !== '' ? $filename : 'zebracode-featured-image') . '.' . $extension;
        $uploaded = wp_upload_bits($filename, null, $image['data']);
        if (!is_array($uploaded) || !empty($uploaded['error']) || empty($uploaded['file'])) {
            $message = is_array($uploaded) && !empty($uploaded['error']) ? (string) $uploaded['error'] : 'Upload failed.';
            throw new \RuntimeException(__('WordPress could not upload the generated featured image.', 'zebracode-blog-ai') . ' ' . sanitize_text_field($message));
        }

        $attachment_id = wp_insert_attachment(
            array(
                'post_mime_type' => $mime,
                'post_title' => sanitize_text_field($title !== '' ? $title : 'ZebraCode featured image'),
                'post_content' => '',
                'post_status' => 'inherit',
                'post_parent' => $post_id,
            ),
            $uploaded['file'],
            $post_id,
            true
        );

        if (is_wp_error($attachment_id)) {
            throw new \RuntimeException(__('WordPress could not create the image attachment.', 'zebracode-blog-ai'));
        }

        $attachment_id = absint($attachment_id);
        if ($attachment_id < 1) {
            throw new \RuntimeException(__('WordPress could not create the image attachment.', 'zebracode-blog-ai'));
        }
        if (function_exists('wp_generate_attachment_metadata') && function_exists('wp_update_attachment_metadata')) {
            $metadata = wp_generate_attachment_metadata($attachment_id, $uploaded['file']);
            if (is_array($metadata)) {
                wp_update_attachment_metadata($attachment_id, $metadata);
            }
        }

        if (function_exists('update_post_meta')) {
            update_post_meta($attachment_id, '_wp_attachment_image_alt', sanitize_text_field($title));
            update_post_meta($attachment_id, '_zebracode_blog_ai_generated_image', current_time('mysql'));
        }
        if (function_exists('set_post_thumbnail')) {
            set_post_thumbnail($post_id, $attachment_id);
        }

        return $attachment_id;
    }

    /**
     * @param string $mime
     * @return string
     */
    private function extension($mime)
    {
        if ($mime === 'image/jpeg') {
            return 'jpg';
        }
        if ($mime === 'image/webp') {
            return 'webp';
        }

        return 'png';
    }
}
