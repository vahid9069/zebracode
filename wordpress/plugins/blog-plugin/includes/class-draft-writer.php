<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Writes normalized generated article data as a WordPress Draft.
 */
final class DraftWriter
{
    public function create(array $article, array $brief, $user_id, $model = '')
    {
        $post_id = wp_insert_post(
            array(
                'post_type' => 'post',
                'post_status' => 'draft',
                'post_author' => absint($user_id),
                'post_title' => sanitize_text_field($article['title']),
                'post_name' => sanitize_title($article['slug']),
                'post_excerpt' => sanitize_textarea_field($article['excerpt']),
                'post_content' => wp_kses_post($article['content']),
            ),
            true
        );

        if (is_wp_error($post_id)) {
            throw new \RuntimeException(__('WordPress could not create the draft.', 'zebracode-blog-ai'));
        }

        update_post_meta($post_id, '_zebracode_blog_ai_meta_description', sanitize_textarea_field($article['meta_description']));
        update_post_meta($post_id, '_zebracode_blog_ai_category', sanitize_text_field($article['category']));
        update_post_meta($post_id, '_zebracode_blog_ai_faq', wp_json_encode($article['faq'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        update_post_meta($post_id, '_zebracode_blog_ai_related_tools', wp_json_encode($article['related_tools'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        update_post_meta($post_id, '_zebracode_blog_ai_generated', current_time('mysql'));
        update_post_meta($post_id, '_zebracode_blog_ai_model', sanitize_text_field($model));
        update_post_meta($post_id, '_zebracode_blog_ai_brief', wp_json_encode($brief, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        if (!empty($article['tags'])) {
            wp_set_post_tags($post_id, array_map('sanitize_text_field', $article['tags']), false);
        }

        $category_slug = sanitize_title($article['category']);
        $category = get_term_by('slug', $category_slug, 'category');
        if (!$category) {
            $category = get_term_by('name', $article['category'], 'category');
        }
        if ($category && !is_wp_error($category)) {
            wp_set_post_categories($post_id, array((int) $category->term_id), false);
        }

        return (int) $post_id;
    }
}
