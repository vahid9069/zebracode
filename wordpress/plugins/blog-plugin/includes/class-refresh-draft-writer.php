<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Creates a new draft candidate from an existing post.
 *
 * The source post is read only. The candidate receives a unique refresh slug,
 * the source's featured image and taxonomies, copied plugin metadata, and a
 * small provenance record for editorial review and background jobs.
 */
final class RefreshDraftWriter
{
    const SOURCE_POST_ID_META_KEY = '_zebracode_blog_ai_refresh_source_post_id';
    const SOURCE_HASH_META_KEY = '_zebracode_blog_ai_refresh_source_hash';
    const AUDIT_META_KEY = '_zebracode_blog_ai_refresh_audit';
    const JOB_META_KEY = '_zebracode_blog_ai_refresh_job';
    const JOB_ID_META_KEY = '_zebracode_blog_ai_refresh_job_id';

    /**
     * Create a new draft candidate and never update the source post.
     *
     * The preferred signature is create($source_post_id, $article, $user_id,
     * $metadata). For integrations that already use article-first services,
     * create($article, $source_post_id, $user_id, $metadata) is also accepted.
     *
     * @param mixed $source_post_id Source WordPress post ID, or article array in the compatibility form.
     * @param mixed $article Normalized refresh article.
     * @param mixed $user_id Optional author ID; source author is used when empty.
     * @param mixed $metadata Audit/job/model metadata.
     * @return int New draft post ID.
     * @throws \InvalidArgumentException For malformed source or article data.
     * @throws \RuntimeException When WordPress cannot create the candidate.
     */
    public function create($source_post_id, $article = array(), $user_id = 0, $metadata = array())
    {
        if (is_array($source_post_id)) {
            $article_first = $source_post_id;
            $source_post_id = $article;
            $article = $article_first;
        }

        $source_post_id = absint($source_post_id);
        if ($source_post_id < 1 || !function_exists('get_post')) {
            throw new \InvalidArgumentException('A valid source post is required for refresh.');
        }

        $source = get_post($source_post_id);
        if (!is_object($source) || empty($source->ID)) {
            throw new \InvalidArgumentException('The source post could not be found.');
        }

        if (!is_array($article)) {
            throw new \InvalidArgumentException('The refreshed article must be an array.');
        }

        $article = $this->normalize_article($article);
        $metadata = is_array($metadata) ? $metadata : array('job_id' => is_scalar($metadata) ? (string) $metadata : '');
        $source_hash = isset($metadata['source_hash']) && is_scalar($metadata['source_hash']) && trim((string) $metadata['source_hash']) !== ''
            ? sanitize_key((string) $metadata['source_hash'])
            : $this->source_hash($source);
        $post_author = absint($user_id) > 0 ? absint($user_id) : absint(isset($source->post_author) ? $source->post_author : 0);
        $source_slug = isset($source->post_name) && is_scalar($source->post_name) ? (string) $source->post_name : '';
        if ($source_slug === '' && isset($source->post_title)) {
            $source_slug = (string) $source->post_title;
        }

        $post_id = wp_insert_post(
            array(
                'post_type' => isset($source->post_type) && is_scalar($source->post_type) ? sanitize_key((string) $source->post_type) : 'post',
                'post_status' => 'draft',
                'post_author' => $post_author,
                'post_title' => $this->text_field($article['title']),
                'post_name' => $this->refresh_slug(
                    $source_slug,
                    $source_post_id,
                    $source_hash,
                    isset($source->post_type) && is_scalar($source->post_type) ? (string) $source->post_type : 'post'
                ),
                'post_excerpt' => $this->textarea($article['excerpt']),
                'post_content' => $this->safe_html($article['content']),
            ),
            true
        );

        if (is_wp_error($post_id)) {
            throw new \RuntimeException(__('WordPress could not create the refresh draft.', 'zebracode-blog-ai'));
        }

        $post_id = absint($post_id);
        if ($post_id < 1) {
            throw new \RuntimeException(__('WordPress returned an invalid refresh draft ID.', 'zebracode-blog-ai'));
        }

        $this->copy_plugin_metadata($source_post_id, $post_id);
        $this->write_article_metadata($post_id, $article, $source_post_id, $source_hash, $metadata);
        $this->copy_taxonomies($source, $source_post_id, $post_id);
        $this->copy_featured_image($source_post_id, $post_id);

        return $post_id;
    }

    /**
     * Explicit source-first alias for queue and REST integrations.
     *
     * @param int $source_post_id
     * @param array $article
     * @param int $user_id
     * @param array $metadata
     * @return int
     */
    public function create_from_source($source_post_id, array $article, $user_id = 0, array $metadata = array())
    {
        return $this->create($source_post_id, $article, $user_id, $metadata);
    }

    /**
     * Queue-friendly alias that accepts the normalized source payload used by
     * GenerationQueue and keeps the source post ID explicit.
     *
     * @param array  $article
     * @param array  $source_payload
     * @param int    $user_id
     * @param string $model
     * @param array  $job
     * @return int
     */
    public function create_candidate(array $article, array $source_payload, $user_id = 0, $model = '', array $job = array())
    {
        $source_post_id = isset($source_payload['post_id']) ? absint($source_payload['post_id']) : 0;
        $metadata = array(
            'model' => $model,
            'audit' => isset($source_payload['audit']) && is_array($source_payload['audit']) ? $source_payload['audit'] : array(),
            'job' => $job,
            'job_id' => isset($job['id']) ? $job['id'] : '',
            'source_hash' => isset($source_payload['content_hash']) ? $source_payload['content_hash'] : '',
        );

        return $this->create($source_post_id, $article, $user_id, $metadata);
    }

    /**
     * Camel-case alias for service consumers.
     *
     * @param int $source_post_id
     * @param array $article
     * @param int $user_id
     * @param array $metadata
     * @return int
     */
    public function createDraft($source_post_id, array $article, $user_id = 0, array $metadata = array())
    {
        return $this->create($source_post_id, $article, $user_id, $metadata);
    }

    /**
     * @param array $article
     * @return array
     */
    private function normalize_article(array $article)
    {
        foreach (array('title', 'excerpt', 'meta_description', 'content', 'faq') as $field) {
            if (!array_key_exists($field, $article)) {
                throw new \InvalidArgumentException(sprintf('The refreshed article is missing the "%s" field.', $field));
            }
        }

        foreach (array('title', 'excerpt', 'meta_description', 'content') as $field) {
            if (!is_scalar($article[$field]) || trim((string) $article[$field]) === '') {
                throw new \InvalidArgumentException(sprintf('The refreshed article field "%s" must contain text.', $field));
            }
        }

        if (!is_array($article['faq'])) {
            throw new \InvalidArgumentException('The refreshed article FAQ must be an array.');
        }

        $faq = array();
        foreach ($article['faq'] as $item) {
            if (!is_array($item) || !isset($item['question'], $item['answer']) || !is_scalar($item['question']) || !is_scalar($item['answer'])) {
                throw new \InvalidArgumentException('Each refreshed FAQ item must contain question and answer text.');
            }
            $faq[] = array(
                'question' => trim((string) $item['question']),
                'answer' => trim((string) $item['answer']),
            );
        }

        return array(
            'title' => trim((string) $article['title']),
            'excerpt' => trim((string) $article['excerpt']),
            'meta_description' => trim((string) $article['meta_description']),
            'content' => (string) $article['content'],
            'faq' => $faq,
        );
    }

    /**
     * @param object $source
     * @return string
     */
    private function source_hash($source)
    {
        return hash('sha256', isset($source->post_content) ? (string) $source->post_content : '');
    }

    /**
     * @param string $source_slug
     * @param int $source_post_id
     * @param string $source_hash
     * @param string $post_type
     * @return string
     */
    private function refresh_slug($source_slug, $source_post_id, $source_hash, $post_type = 'post')
    {
        $base = sanitize_title($source_slug);
        $base = $base !== '' ? $base : 'article';
        $suffix = substr(hash('sha256', $source_post_id . '|' . $source_hash . '|' . microtime(true)), 0, 10);
        $requested = sanitize_title($base . '-refresh-' . $suffix);

        if (function_exists('wp_unique_post_slug')) {
            return wp_unique_post_slug($requested, 0, 'draft', sanitize_key($post_type), 0);
        }

        return $requested;
    }

    /**
     * Copy only metadata owned by this plugin. Values are copied before the
     * refresh provenance is written so the candidate retains source context.
     *
     * @param int $source_post_id
     * @param int $post_id
     * @return void
     */
    private function copy_plugin_metadata($source_post_id, $post_id)
    {
        if (!function_exists('get_post_meta') || !function_exists('update_post_meta')) {
            return;
        }

        $metadata = get_post_meta($source_post_id);
        if (!is_array($metadata)) {
            return;
        }

        foreach ($metadata as $key => $values) {
            if (!is_string($key) || strpos($key, '_zebracode_blog_ai_') !== 0 || strpos($key, '_zebracode_blog_ai_refresh_') === 0 || !is_array($values)) {
                continue;
            }

            foreach ($values as $value) {
                update_post_meta($post_id, $key, $value);
            }
        }
    }

    /**
     * @param int $post_id
     * @param array $article
     * @param int $source_post_id
     * @param string $source_hash
     * @param array $metadata
     * @return void
     */
    private function write_article_metadata($post_id, array $article, $source_post_id, $source_hash, array $metadata)
    {
        update_post_meta($post_id, '_zebracode_blog_ai_meta_description', $this->textarea($article['meta_description']));
        update_post_meta($post_id, '_zebracode_blog_ai_faq', $this->json_value($article['faq']));
        update_post_meta($post_id, '_zebracode_blog_ai_generated', current_time('mysql'));
        update_post_meta($post_id, self::SOURCE_POST_ID_META_KEY, absint($source_post_id));
        update_post_meta($post_id, self::SOURCE_HASH_META_KEY, sanitize_key($source_hash));

        if (isset($metadata['model']) && is_scalar($metadata['model'])) {
            update_post_meta($post_id, '_zebracode_blog_ai_model', $this->text_field($metadata['model']));
        }

        $audit = isset($metadata['audit']) ? $metadata['audit'] : $this->source_audit($source_post_id);
        update_post_meta($post_id, self::AUDIT_META_KEY, $this->json_value($this->safe_metadata($audit)));

        $job = isset($metadata['job']) ? $metadata['job'] : array();
        $job_id = isset($metadata['job_id']) && is_scalar($metadata['job_id']) ? sanitize_text_field((string) $metadata['job_id']) : '';
        update_post_meta($post_id, self::JOB_META_KEY, $this->json_value($this->safe_metadata($job)));
        if ($job_id !== '') {
            update_post_meta($post_id, self::JOB_ID_META_KEY, $job_id);
        }
    }

    /**
     * @param int $post_id
     * @return mixed
     */
    private function source_audit($post_id)
    {
        if (class_exists('ZebraCode\\BlogAI\\SEOAuditor')) {
            return (new SEOAuditor())->audit($post_id);
        }

        return array();
    }

    /**
     * @param object $source
     * @param int $source_post_id
     * @param int $post_id
     * @return void
     */
    private function copy_taxonomies($source, $source_post_id, $post_id)
    {
        if (!function_exists('get_object_taxonomies') || !function_exists('wp_get_object_terms') || !function_exists('wp_set_post_terms')) {
            return;
        }

        $post_type = isset($source->post_type) && is_scalar($source->post_type) ? (string) $source->post_type : 'post';
        $taxonomies = get_object_taxonomies($post_type, 'names');
        if (!is_array($taxonomies)) {
            return;
        }

        foreach ($taxonomies as $taxonomy) {
            $taxonomy = sanitize_key((string) $taxonomy);
            if ($taxonomy === '') {
                continue;
            }

            $term_ids = wp_get_object_terms($source_post_id, $taxonomy, array('fields' => 'ids'));
            if (is_wp_error($term_ids) || !is_array($term_ids)) {
                continue;
            }

            $term_ids = array_values(array_filter(array_map('absint', $term_ids)));
            wp_set_post_terms($post_id, $term_ids, $taxonomy, false);
        }
    }

    /**
     * @param int $source_post_id
     * @param int $post_id
     * @return void
     */
    private function copy_featured_image($source_post_id, $post_id)
    {
        if (!function_exists('get_post_thumbnail_id') || !function_exists('set_post_thumbnail')) {
            return;
        }

        $thumbnail_id = absint(get_post_thumbnail_id($source_post_id));
        if ($thumbnail_id > 0) {
            set_post_thumbnail($post_id, $thumbnail_id);
        }
    }

    /**
     * @param mixed $value
     * @return string
     */
    private function safe_html($value)
    {
        return function_exists('wp_kses_post') ? wp_kses_post((string) $value) : (string) $value;
    }

    /**
     * @param mixed $value
     * @return string
     */
    private function text_field($value)
    {
        return function_exists('sanitize_text_field') ? sanitize_text_field((string) $value) : trim((string) $value);
    }

    /**
     * @param mixed $value
     * @return string
     */
    private function textarea($value)
    {
        return function_exists('sanitize_textarea_field') ? sanitize_textarea_field((string) $value) : trim((string) $value);
    }

    /**
     * @param mixed $value
     * @return string
     */
    private function json_value($value)
    {
        $encoded = function_exists('wp_json_encode')
            ? wp_json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            : json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return is_string($encoded) ? $encoded : '{}';
    }

    /**
     * Remove objects/resources and bound nested metadata before persistence.
     *
     * @param mixed $value
     * @param int $depth
     * @return mixed
     */
    private function safe_metadata($value, $depth = 0)
    {
        if ($depth > 5) {
            return null;
        }
        if (is_array($value)) {
            $safe = array();
            foreach ($value as $key => $item) {
                $safe[is_scalar($key) ? (string) $key : 'value'] = $this->safe_metadata($item, $depth + 1);
            }
            return $safe;
        }
        if (is_bool($value) || is_int($value) || is_float($value) || is_string($value) || $value === null) {
            return is_string($value) ? $this->textarea($value) : $value;
        }

        return null;
    }
}
