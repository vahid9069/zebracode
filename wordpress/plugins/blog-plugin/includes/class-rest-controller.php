<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Public, read-only contract consumed by the static blog at build time.
 */
final class RESTController
{
    const NAMESPACE = 'zebracode-blog/v1';

    private $provider;
    private $queue;
    private $logs;

    public function __construct($provider = null, GenerationQueue $queue = null, GenerationLogRepository $logs = null)
    {
        $this->provider = $provider;
        $this->queue = $queue;
        $this->logs = $logs instanceof GenerationLogRepository ? $logs : new GenerationLogRepository();
    }

    public function register_hooks()
    {
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    public function register_routes()
    {
        register_rest_route(
            self::NAMESPACE,
            '/posts',
            array(
                'methods' => \WP_REST_Server::READABLE,
                'callback' => array($this, 'posts'),
                'permission_callback' => '__return_true',
                'args' => array(
                    'per_page' => array('default' => 100, 'sanitize_callback' => 'absint'),
                ),
            )
        );

        register_rest_route(self::NAMESPACE, '/ask', array(
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => array($this, 'ask'),
            'permission_callback' => array($this, 'permission_callback'),
        ));

        register_rest_route(self::NAMESPACE, '/stream-ai', array(
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => array($this, 'stream_ai'),
            'permission_callback' => array($this, 'permission_callback'),
        ));

        register_rest_route(self::NAMESPACE, '/logs', array(
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => array($this, 'save_log'),
            'permission_callback' => array($this, 'permission_callback'),
        ));

        register_rest_route(self::NAMESPACE, '/logs', array(
            'methods' => \WP_REST_Server::READABLE,
            'callback' => array($this, 'logs'),
            'permission_callback' => array($this, 'manage_permission_callback'),
        ));

        register_rest_route(self::NAMESPACE, '/bulk', array(
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => array($this, 'bulk'),
            'permission_callback' => array($this, 'permission_callback'),
        ));
    }

    public function permission_callback($request)
    {
        return current_user_can('edit_posts') && $this->valid_rest_nonce($request);
    }

    public function manage_permission_callback($request)
    {
        return current_user_can('manage_options') && $this->valid_rest_nonce($request);
    }

    public function ask($request)
    {
        if (!ModuleManager::enabled('content') || !$this->provider || !method_exists($this->provider, 'generateContent')) {
            return new \WP_Error('module_disabled', __('Content generation is disabled.', 'zebracode-blog-ai'), array('status' => 503));
        }

        try {
            $messages = $this->messages_from_request($request);
            $options = $this->options_from_request($request);
            $result = $this->provider->generateContent($messages, $options);
            $this->logs->insert(array(
                'user_id' => get_current_user_id(),
                'event' => 'rest_generation',
                'status' => 'completed',
                'model' => isset($result['model']) ? $result['model'] : '',
                'prompt' => wp_json_encode($messages, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'response' => isset($result['content']) ? $result['content'] : '',
                'data' => array('source' => 'rest_ask'),
                'created_at' => current_time('mysql', true),
            ));
            return rest_ensure_response($result);
        } catch (\Throwable $exception) {
            return new \WP_Error('generation_failed', sanitize_text_field($exception->getMessage()), array('status' => 400));
        }
    }

    public function stream_ai($request)
    {
        if (!ModuleManager::enabled('streaming') || !$this->provider || !method_exists($this->provider, 'streamContent')) {
            return new \WP_Error('module_disabled', __('Streaming is disabled.', 'zebracode-blog-ai'), array('status' => 503));
        }

        try {
            $messages = $this->messages_from_request($request);
            $options = $this->options_from_request($request);
            @ignore_user_abort(true);
            @set_time_limit(0);
            nocache_headers();
            status_header(200);
            header('Content-Type: text/event-stream; charset=utf-8');
            header('Cache-Control: no-cache, no-transform');
            header('X-Accel-Buffering: no');
            echo ": connected\n\n";
            @ob_flush();
            @flush();

            $this->provider->streamContent($messages, $options, function ($text) {
                echo 'data: ' . wp_json_encode(array('text' => (string) $text), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";
                @ob_flush();
                @flush();
            });

            echo "data: " . wp_json_encode(array('done' => true)) . "\n\n";
            @ob_flush();
            @flush();
            exit;
        } catch (\Throwable $exception) {
            echo 'data: ' . wp_json_encode(array('error' => sanitize_text_field($exception->getMessage()))) . "\n\n";
            @ob_flush();
            @flush();
            exit;
        }
    }

    public function save_log($request)
    {
        $params = $request->get_json_params();
        $params = is_array($params) ? $params : array();
        $prompt = isset($params['prompt']) && is_scalar($params['prompt']) ? sanitize_textarea_field((string) $params['prompt']) : '';
        $response = isset($params['response']) && is_scalar($params['response']) ? sanitize_textarea_field((string) $params['response']) : '';
        $id = $this->logs->insert(array(
            'user_id' => get_current_user_id(),
            'event' => 'stream_generation',
            'status' => 'completed',
            'provider' => isset($params['provider']) ? sanitize_key((string) $params['provider']) : '',
            'model' => isset($params['model']) ? sanitize_text_field((string) $params['model']) : '',
            'prompt' => $prompt,
            'response' => $response,
            'data' => array('source' => 'rest_stream', 'length' => strlen($response)),
            'created_at' => current_time('mysql', true),
        ));

        return rest_ensure_response(array('id' => $id, 'saved' => $id > 0));
    }

    public function logs($request)
    {
        return rest_ensure_response(array(
            'items' => $this->logs->recent($request->get_param('per_page') ?: 20),
            'counts' => $this->logs->count_by_status(),
        ));
    }

    public function bulk($request)
    {
        if (!ModuleManager::enabled('bulk') || !$this->queue || !method_exists($this->queue, 'enqueue_bulk')) {
            return new \WP_Error('module_disabled', __('Bulk generation is disabled.', 'zebracode-blog-ai'), array('status' => 503));
        }

        $params = $request->get_json_params();
        $briefs = isset($params['briefs']) && is_array($params['briefs']) ? array_slice($params['briefs'], 0, 100) : array();
        if (empty($briefs)) {
            return new \WP_Error('invalid_briefs', __('At least one content brief is required.', 'zebracode-blog-ai'), array('status' => 400));
        }

        return rest_ensure_response(array('jobs' => $this->queue->enqueue_bulk($briefs, get_current_user_id())));
    }

    public function posts($request)
    {
        $per_page = min(100, max(1, absint($request->get_param('per_page'))));
        $query = new \WP_Query(array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => $per_page,
            'orderby' => 'date',
            'order' => 'DESC',
            'ignore_sticky_posts' => true,
            'meta_query' => array(array('key' => DraftRepository::GENERATED_META_KEY, 'compare' => 'EXISTS')),
        ));

        $items = array();
        foreach ($query->posts as $post) {
            $items[] = $this->normalize($post);
        }

        return rest_ensure_response(array('items' => $items, 'total' => (int) $query->found_posts));
    }

    private function normalize($post)
    {
        $post_id = absint($post->ID);
        $categories = get_the_category($post_id);
        $category = 'development';
        if (!empty($categories) && isset($categories[0]->slug)) {
            $category = sanitize_title($categories[0]->slug);
        }

        $faq = $this->json_meta($post_id, '_zebracode_blog_ai_faq');
        $tools = $this->json_meta($post_id, '_zebracode_blog_ai_related_tools');
        $tags = wp_get_post_tags($post_id, array('fields' => 'names'));

        return array(
            'id' => $post_id,
            'slug' => sanitize_title($post->post_name),
            'title' => wp_strip_all_tags(get_the_title($post_id)),
            'excerpt' => wp_strip_all_tags(get_the_excerpt($post_id)),
            'content' => apply_filters('the_content', $post->post_content),
            'category' => $category,
            'tags' => array_map('sanitize_text_field', is_array($tags) ? $tags : array()),
            'published_at' => get_post_time('c', true, $post_id),
            'updated_at' => get_post_modified_time('c', true, $post_id),
            'author' => array(
                'name' => sanitize_text_field(get_the_author_meta('display_name', $post->post_author)),
                'role' => 'ZebraCode editorial team',
                'bio' => 'Practical developer notes from ZebraCode.',
            ),
            'meta_description' => sanitize_textarea_field((string) get_post_meta($post_id, '_zebracode_blog_ai_meta_description', true)),
            'faq' => is_array($faq) ? $faq : array(),
            'related_tools' => is_array($tools) ? $tools : array(),
        );
    }

    private function valid_rest_nonce($request)
    {
        $nonce = $request instanceof \WP_REST_Request ? $request->get_header('X-WP-Nonce') : '';
        return $nonce !== '' && (bool) wp_verify_nonce($nonce, 'wp_rest');
    }

    private function messages_from_request($request)
    {
        $params = $request->get_json_params();
        $params = is_array($params) ? $params : array();
        if (isset($params['messages']) && is_array($params['messages'])) {
            $messages = array();
            foreach ($params['messages'] as $message) {
                if (!is_array($message) || !isset($message['role'], $message['content'])) {
                    continue;
                }
                $role = sanitize_key((string) $message['role']);
                $content = is_scalar($message['content']) ? trim((string) $message['content']) : '';
                if (in_array($role, array('system', 'user', 'assistant'), true) && $content !== '') {
                    $messages[] = array('role' => $role, 'content' => $content);
                }
            }
            if (!empty($messages)) {
                return $messages;
            }
        }

        $prompt = isset($params['prompt']) && is_scalar($params['prompt']) ? trim((string) $params['prompt']) : '';
        if ($prompt === '' || strlen($prompt) > 50000) {
            throw new \InvalidArgumentException(__('A prompt is required and must be shorter than 50,000 characters.', 'zebracode-blog-ai'));
        }

        return array(array('role' => 'user', 'content' => $prompt));
    }

    private function options_from_request($request)
    {
        $params = $request->get_json_params();
        $params = is_array($params) ? $params : array();
        $options = array();
        foreach (array('temperature', 'top_p', 'max_tokens') as $key) {
            if (isset($params[$key]) && is_numeric($params[$key])) {
                $options[$key] = $params[$key];
            }
        }

        return $options;
    }

    private function json_meta($post_id, $key)
    {
        $value = get_post_meta($post_id, $key, true);
        if (is_string($value)) {
            $value = json_decode($value, true);
        }

        return is_array($value) ? $value : array();
    }
}
