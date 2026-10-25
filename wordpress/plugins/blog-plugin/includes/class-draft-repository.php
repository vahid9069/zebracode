<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Repository for posts created by the ZebraCode Blog AI generator.
 */
final class DraftRepository
{
    const GENERATED_META_KEY = '_zebracode_blog_ai_generated';

    /**
     * Query generated posts and return a bounded, normalized result set.
     *
     * @param array $args Optional query arguments. Supported values are
     *                    post_status, posts_per_page, paged, orderby, and order.
     * @return array{rows: array, count: int, total: int, pages: int, page: int, per_page: int}
     */
    public function query($args = array())
    {
        $args = is_array($args) ? $args : array();
        $per_page = isset($args['posts_per_page']) ? absint($args['posts_per_page']) : 20;
        $per_page = min(100, max(1, $per_page));
        $page = isset($args['paged']) ? absint($args['paged']) : 1;
        $page = max(1, $page);

        $query_args = array(
            'post_type' => 'post',
            'post_status' => $this->post_statuses(isset($args['post_status']) ? $args['post_status'] : null),
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => $this->orderby(isset($args['orderby']) ? $args['orderby'] : 'date'),
            'order' => $this->order(isset($args['order']) ? $args['order'] : 'DESC'),
            'meta_key' => self::GENERATED_META_KEY,
            'meta_query' => array(
                array(
                    'key' => self::GENERATED_META_KEY,
                    'compare' => 'EXISTS',
                ),
            ),
            'ignore_sticky_posts' => true,
        );

        $query = new \WP_Query($query_args);
        $rows = array();
        foreach ($query->posts as $post) {
            $normalized = $this->normalize($post);
            if ($normalized !== null) {
                $rows[] = $normalized;
            }
        }

        return array(
            'rows' => $rows,
            'count' => count($rows),
            'total' => (int) $query->found_posts,
            'pages' => (int) $query->max_num_pages,
            'page' => $page,
            'per_page' => $per_page,
        );
    }

    /**
     * Alias using the camelCase service API.
     *
     * @param array $args
     * @return array
     */
    public function getDrafts($args = array())
    {
        return $this->query($args);
    }

    /**
     * Alias following the naming style used by the plugin's existing classes.
     *
     * @param array $args
     * @return array
     */
    public function get_drafts($args = array())
    {
        return $this->query($args);
    }

    /**
     * Return only normalized rows for callers that do not need pagination data.
     *
     * @param array $args
     * @return array
     */
    public function rows($args = array())
    {
        $result = $this->query($args);

        return $result['rows'];
    }

    /**
     * Count generated posts, optionally restricted to one post status.
     *
     * @param string|null $status
     * @return int
     */
    public function count($status = null)
    {
        $query_args = array(
            'post_type' => 'post',
            'post_status' => $this->post_statuses($status),
            'posts_per_page' => 1,
            'paged' => 1,
            'fields' => 'ids',
            'no_found_rows' => false,
            'meta_query' => array(
                array(
                    'key' => self::GENERATED_META_KEY,
                    'compare' => 'EXISTS',
                ),
            ),
        );

        $query = new \WP_Query($query_args);

        return (int) $query->found_posts;
    }

    /**
     * Return counts for the statuses used by the editorial workflow.
     *
     * @return array
     */
    public function counts()
    {
        $counts = array();
        foreach ($this->default_statuses() as $status) {
            $counts[$status] = $this->count($status);
        }
        $counts['total'] = array_sum($counts);

        return $counts;
    }

    /**
     * Alias for consumers that prefer an explicit getter.
     *
     * @return array
     */
    public function getCounts()
    {
        return $this->counts();
    }

    /**
     * Alias for consumers using snake_case method names.
     *
     * @return array
     */
    public function get_counts()
    {
        return $this->counts();
    }

    /**
     * Normalize a post to safe scalar values suitable for an admin view or API.
     *
     * @param mixed $post
     * @return array|null
     */
    private function normalize($post)
    {
        if (!is_object($post) || empty($post->ID)) {
            return null;
        }

        $post_id = absint($post->ID);
        $status = sanitize_key((string) get_post_status($post_id));
        $status_object = get_post_status_object($status);
        $status_label = $status_object && isset($status_object->label) ? $status_object->label : $status;
        $author_id = absint(isset($post->post_author) ? $post->post_author : get_post_field('post_author', $post_id));
        $author = $author_id ? get_userdata($author_id) : false;
        $generated_at = get_post_meta($post_id, self::GENERATED_META_KEY, true);
        $categories = get_the_category($post_id);
        $category_names = array();

        if (is_array($categories)) {
            foreach ($categories as $category) {
                if (is_object($category) && isset($category->name)) {
                    $category_names[] = sanitize_text_field($category->name);
                }
            }
        }

        $edit_url = get_edit_post_link($post_id, '');
        $permalink = get_permalink($post_id);

        return array(
            'id' => $post_id,
            'title' => sanitize_text_field(wp_strip_all_tags(get_the_title($post_id))),
            'refresh_source_id' => absint(get_post_meta($post_id, RefreshDraftWriter::SOURCE_POST_ID_META_KEY, true)),
            'status' => $status,
            'status_label' => sanitize_text_field(wp_strip_all_tags((string) $status_label)),
            'author_id' => $author_id,
            'author' => $author && isset($author->display_name) ? sanitize_text_field($author->display_name) : '',
            'date' => sanitize_text_field((string) get_post_time('mysql', false, $post_id)),
            'modified' => sanitize_text_field((string) get_post_modified_time('mysql', false, $post_id)),
            'generated_at' => is_scalar($generated_at) ? sanitize_text_field((string) $generated_at) : '',
            'model' => sanitize_text_field((string) get_post_meta($post_id, '_zebracode_blog_ai_model', true)),
            'excerpt' => sanitize_textarea_field(wp_strip_all_tags(get_the_excerpt($post_id))),
            'categories' => $category_names,
            'edit_url' => $edit_url ? esc_url_raw($edit_url) : '',
            'permalink' => $permalink ? esc_url_raw($permalink) : '',
        );
    }

    /**
     * @param mixed $status
     * @return array|string
     */
    private function post_statuses($status)
    {
        if ($status === null || $status === '') {
            return $this->default_statuses();
        }

        if (is_array($status)) {
            $statuses = array();
            foreach ($status as $value) {
                $value = sanitize_key((string) $value);
                if ($value !== '') {
                    $statuses[] = $value;
                }
            }

            return $statuses ? array_values(array_unique($statuses)) : $this->default_statuses();
        }

        return sanitize_key((string) $status);
    }

    /**
     * @return array
     */
    private function default_statuses()
    {
        return array('draft', 'pending', 'publish', 'private', 'future');
    }

    /**
     * @param mixed $orderby
     * @return string
     */
    private function orderby($orderby)
    {
        $allowed = array('date', 'modified', 'title', 'ID', 'meta_value', 'post_date');
        $orderby = is_string($orderby) ? $orderby : 'date';

        return in_array($orderby, $allowed, true) ? $orderby : 'date';
    }

    /**
     * @param mixed $order
     * @return string
     */
    private function order($order)
    {
        return strtoupper((string) $order) === 'ASC' ? 'ASC' : 'DESC';
    }
}
