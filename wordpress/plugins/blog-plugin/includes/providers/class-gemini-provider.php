<?php

namespace ZebraCode\BlogAI\Providers;

use ZebraCode\BlogAI\Contracts\AIProviderInterface;
use ZebraCode\BlogAI\ProviderTransport;
use ZebraCode\BlogAI\Settings;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Native adapter for the Google Gemini generateContent API.
 *
 * The adapter deliberately uses the WordPress HTTP API so API keys remain
 * server-side and provider responses are normalized for the application.
 */
final class GeminiProvider implements AIProviderInterface
{
    const DEFAULT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';
    const REQUEST_TIMEOUT = 30;
    const LIST_MODELS_TIMEOUT = 15;

    /** @var Settings */
    private $settings;

    /**
     * @param Settings|null $settings
     */
    public function __construct(Settings $settings = null)
    {
        $this->settings = $settings instanceof Settings ? $settings : new Settings();
    }

    /**
     * @param array $messages
     * @param array $options
     * @return array{content:string,model:string,usage:array}
     */
    public function generate(array $messages, array $options = array())
    {
        return $this->generate_with_configuration($this->configuration(), $messages, $options);
    }

    public function generateContent(array $messages, array $options = array())
    {
        return $this->generate($messages, $options);
    }

    public function streamContent(array $messages, array $options, callable $on_chunk)
    {
        $configuration = $this->configuration();
        if ($configuration['api_key'] === '' || $configuration['model'] === '') {
            throw new \RuntimeException('The AI provider is not configured.');
        }

        $request = $this->build_request($messages, $options);
        $encoded = wp_json_encode($request, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($encoded)) {
            throw new \RuntimeException('The streaming request could not be encoded.');
        }

        $buffer = '';
        $content = '';
        $model = $configuration['model'];
        $response = ProviderTransport::stream(
            'POST',
            $this->stream_endpoint($configuration['endpoint'], $configuration['model']),
            array(
                'headers' => $this->headers($configuration['api_key'], true),
                'body' => $encoded,
            ),
            function ($chunk) use (&$buffer, &$content, &$model, $on_chunk) {
                $buffer .= (string) $chunk;
                while (($newline = strpos($buffer, "\n")) !== false) {
                    $line = trim(substr($buffer, 0, $newline));
                    $buffer = substr($buffer, $newline + 1);
                    if (strpos($line, 'data:') !== 0) {
                        continue;
                    }
                    $decoded = json_decode(trim(substr($line, 5)), true);
                    if (!is_array($decoded)) {
                        continue;
                    }
                    if (!empty($decoded['modelVersion']) && is_scalar($decoded['modelVersion'])) {
                        $model = sanitize_text_field((string) $decoded['modelVersion']);
                    }
                    $parts = isset($decoded['candidates'][0]['content']['parts']) && is_array($decoded['candidates'][0]['content']['parts']) ? $decoded['candidates'][0]['content']['parts'] : array();
                    foreach ($parts as $part) {
                        $text = is_array($part) && isset($part['text']) && is_string($part['text']) ? $part['text'] : '';
                        if ($text !== '') {
                            $content .= $text;
                            $on_chunk($text);
                        }
                    }
                }
            },
            120
        );

        if (is_wp_error($response)) {
            throw new \RuntimeException($response->get_error_message());
        }
        if (!is_array($response) || (int) $response['status'] < 200 || (int) $response['status'] >= 300) {
            throw new \RuntimeException('The AI provider returned an unsuccessful streaming response.');
        }

        return array('content' => $content, 'model' => $model, 'usage' => array());
    }

    /**
     * Generate an image using the same Gemini API key with an image-capable
     * model. Text and image models remain separate settings.
     *
     * @param string $prompt
     * @param array  $options
     * @return array{data:string,mime_type:string,extension:string,model:string}
     */
    public function generate_image($prompt, array $options = array())
    {
        $configuration = $this->configuration();
        if ($configuration['api_key'] === '') {
            throw new \RuntimeException('The AI provider is not configured.');
        }

        $settings = $this->settings->get();
        $image_model = isset($options['image_model']) && is_scalar($options['image_model']) ? trim((string) $options['image_model']) : '';
        if ($image_model === '' && isset($settings['image_model']) && is_scalar($settings['image_model'])) {
            $image_model = trim((string) $settings['image_model']);
        }
        if ($image_model === '') {
            $image_model = 'gemini-3.1-flash-image';
        }

        $request = array(
            'contents' => array(
                array(
                    'role' => 'user',
                    'parts' => array(array('text' => (string) $prompt)),
                ),
            ),
            'generationConfig' => array(
                'responseModalities' => array('TEXT', 'IMAGE'),
                'responseFormat' => array(
                    'image' => array(
                        'aspectRatio' => isset($options['aspect_ratio']) && is_scalar($options['aspect_ratio']) ? sanitize_text_field((string) $options['aspect_ratio']) : '16:9',
                        'imageSize' => isset($options['image_size']) && is_scalar($options['image_size']) ? sanitize_text_field((string) $options['image_size']) : '1K',
                    ),
                ),
            ),
        );
        $encoded = wp_json_encode($request, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($encoded)) {
            throw new \RuntimeException('The image request could not be encoded.');
        }

        $response = ProviderTransport::request(
            'POST',
            $this->generate_endpoint($configuration['endpoint'], $image_model),
            array(
                'headers' => $this->headers($configuration['api_key'], true),
                'body' => $encoded,
                'data_format' => 'body',
            ),
            120,
            true,
            true
        );
        if (is_wp_error($response)) {
            throw new \RuntimeException($this->wp_error_message('The image provider request failed.', $response));
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        if ($status < 200 || $status >= 300) {
            throw new \RuntimeException($this->http_failure_message('The image provider returned an unsuccessful response', $status, wp_remote_retrieve_body($response)));
        }

        $decoded = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($decoded)) {
            throw new \RuntimeException('The image provider returned invalid JSON.');
        }

        $parts = isset($decoded['candidates'][0]['content']['parts']) && is_array($decoded['candidates'][0]['content']['parts']) ? $decoded['candidates'][0]['content']['parts'] : array();
        foreach ($parts as $part) {
            if (!is_array($part)) {
                continue;
            }
            $inline = isset($part['inlineData']) && is_array($part['inlineData']) ? $part['inlineData'] : (isset($part['inline_data']) && is_array($part['inline_data']) ? $part['inline_data'] : array());
            if (empty($inline['data']) || !is_string($inline['data'])) {
                continue;
            }

            $binary = base64_decode($inline['data'], true);
            if ($binary === false || $binary === '') {
                continue;
            }
            $mime = isset($inline['mimeType']) && is_scalar($inline['mimeType']) ? strtolower((string) $inline['mimeType']) : (isset($inline['mime_type']) && is_scalar($inline['mime_type']) ? strtolower((string) $inline['mime_type']) : 'image/png');
            return array(
                'data' => $binary,
                'mime_type' => $mime,
                'extension' => $mime === 'image/jpeg' ? 'jpg' : ($mime === 'image/webp' ? 'webp' : 'png'),
                'model' => sanitize_text_field($image_model),
            );
        }

        throw new \RuntimeException('The image provider returned no inline image data.');
    }

    private function generate_with_configuration(array $configuration, array $messages, array $options = array())
    {
        if ($configuration['api_key'] === '' || $configuration['model'] === '') {
            throw new \RuntimeException('The AI provider is not configured.');
        }

        $request = $this->build_request($messages, $options);
        $encoded_request = wp_json_encode($request, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($encoded_request)) {
            throw new \RuntimeException('The AI provider request could not be encoded.');
        }

        $response = ProviderTransport::request(
            'POST',
            $this->generate_endpoint($configuration['endpoint'], $configuration['model']),
            array(
                'headers' => $this->headers($configuration['api_key'], true),
                'body' => $encoded_request,
                'data_format' => 'body',
            ),
            self::REQUEST_TIMEOUT,
            false,
            true
        );

        if (is_wp_error($response)) {
            throw new \RuntimeException($this->wp_error_message('The AI provider request failed.', $response));
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        if ($status < 200 || $status >= 300) {
            throw new \RuntimeException($this->http_failure_message('The AI provider returned an unsuccessful response', $status, wp_remote_retrieve_body($response)));
        }

        $decoded = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($decoded)) {
            throw new \RuntimeException('The AI provider returned invalid JSON.');
        }

        return array(
            'content' => $this->response_content($decoded),
            'model' => $this->response_model($decoded, $configuration['model']),
            'usage' => $this->normalize_usage(isset($decoded['usageMetadata']) && is_array($decoded['usageMetadata']) ? $decoded['usageMetadata'] : array()),
            'finish_reason' => isset($decoded['candidates'][0]['finishReason']) ? sanitize_key((string) $decoded['candidates'][0]['finishReason']) : '',
        );
    }

    /**
     * Use Gemini's models endpoint as a non-generating health check.
     *
     * @return array{model:string,models:int}
     */
    public function test_connection(array $overrides = array())
    {
        $configuration = $this->configuration($overrides);
        if ($configuration['api_key'] === '') {
            throw new \RuntimeException('The AI provider is not configured.');
        }

        $response = ProviderTransport::request(
            'GET',
            $this->models_endpoint($configuration['endpoint']),
            array(
                'headers' => $this->headers($configuration['api_key']),
            ),
            self::LIST_MODELS_TIMEOUT,
            true
        );

        if (is_wp_error($response)) {
            throw new \RuntimeException($this->wp_error_message('The AI provider connection failed.', $response));
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        if ($status < 200 || $status >= 300) {
            throw new \RuntimeException($this->http_failure_message('The AI provider rejected the connection test', $status, wp_remote_retrieve_body($response)));
        }

        $decoded = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($decoded)) {
            throw new \RuntimeException('The AI provider returned invalid connection data.');
        }

        // A models GET proves credentials and network access, but not that the
        // selected model can generate. Probe the real generation endpoint with
        // a tiny request so Test connection matches the Generate workflow.
        $this->generate_with_configuration(
            $configuration,
            array(array('role' => 'user', 'content' => 'Reply with OK only.')),
            // Gemini 3 models may spend output budget on internal thinking
            // before returning visible text. Four tokens can end in MAX_TOKENS
            // with an empty candidate even when the model and key are valid.
            array('temperature' => 0, 'max_tokens' => 128)
        );

        return array(
            'model' => $configuration['model'],
            'models' => isset($decoded['models']) && is_array($decoded['models']) ? count($decoded['models']) : 0,
        );
    }

    /**
     * List Gemini models that support generateContent.
     *
     * @param array $overrides Optional endpoint and api_key values for this request.
     * @return array<int,array{id:string,name:string,label:string}>
     */
    public function list_models(array $overrides = array())
    {
        $configuration = $this->list_models_configuration($overrides);
        if ($configuration['api_key'] === '' || $configuration['endpoint'] === '') {
            throw new \RuntimeException('The AI provider is not configured.');
        }

        $models = array();
        $page_token = '';
        for ($page = 0; $page < 10; $page++) {
            $url = $this->models_endpoint($configuration['endpoint']);
            if ($page_token !== '') {
                $url = add_query_arg('pageToken', $page_token, $url);
            }
            $response = ProviderTransport::request('GET', $url, array('headers' => $this->headers($configuration['api_key'])), self::LIST_MODELS_TIMEOUT, true);
            if (is_wp_error($response)) {
                throw new \RuntimeException($this->wp_error_message('The AI provider models request failed.', $response));
            }
            $status = (int) wp_remote_retrieve_response_code($response);
            if ($status < 200 || $status >= 300) {
                throw new \RuntimeException($this->http_failure_message('The AI provider returned an unsuccessful models response', $status, wp_remote_retrieve_body($response)));
            }
            $decoded = json_decode(wp_remote_retrieve_body($response), true);
            if (!is_array($decoded) || !isset($decoded['models']) || !is_array($decoded['models'])) {
                throw new \RuntimeException('The AI provider returned invalid model data.');
            }
            foreach ($decoded['models'] as $model) {
            if (!is_array($model) || !isset($model['name']) || !is_scalar($model['name'])) {
                continue;
            }

            if (array_key_exists('supportedGenerationMethods', $model)) {
                if (!is_array($model['supportedGenerationMethods']) || !in_array('generateContent', $model['supportedGenerationMethods'], true)) {
                    continue;
                }
            }

            $name = preg_replace('/^models\//', '', trim((string) $model['name']));
            $name = is_string($name) ? sanitize_text_field($name) : '';
            if ($name === '') {
                continue;
            }

                $display_name = isset($model['displayName']) && is_scalar($model['displayName']) ? sanitize_text_field((string) $model['displayName']) : $name;
                $models[$name] = array('id' => $name, 'name' => $name, 'label' => $display_name . ' (' . $name . ')');
            }
            $page_token = isset($decoded['nextPageToken']) && is_scalar($decoded['nextPageToken']) ? sanitize_text_field((string) $decoded['nextPageToken']) : '';
            if ($page_token === '') {
                break;
            }
        }

        return array_values($models);
    }

    /**
     * @return array{endpoint:string,model:string,api_key:string}
     */
    private function configuration(array $overrides = array())
    {
        $settings = $this->settings->get();
        $settings = is_array($settings) ? $settings : array();

        $endpoint = isset($settings['endpoint']) && is_scalar($settings['endpoint'])
            ? trim((string) $settings['endpoint'])
            : '';

        $configuration = array(
            'endpoint' => $endpoint !== '' ? $endpoint : self::DEFAULT_ENDPOINT,
            'model' => isset($settings['model']) && is_scalar($settings['model']) ? trim((string) $settings['model']) : '',
            'api_key' => isset($settings['api_key']) && is_scalar($settings['api_key']) ? trim((string) $settings['api_key']) : '',
        );

        foreach (array('endpoint', 'model', 'api_key') as $key) {
            if (array_key_exists($key, $overrides)) {
                $configuration[$key] = is_scalar($overrides[$key]) ? trim((string) $overrides[$key]) : '';
            }
        }

        return $configuration;
    }

    /**
     * @param array $overrides
     * @return array{endpoint:string,api_key:string}
     */
    private function list_models_configuration(array $overrides)
    {
        $configuration = $this->configuration();

        if (array_key_exists('endpoint', $overrides)) {
            $configuration['endpoint'] = is_scalar($overrides['endpoint'])
                ? esc_url_raw(trim((string) $overrides['endpoint']))
                : '';
        }

        if (array_key_exists('api_key', $overrides)) {
            $configuration['api_key'] = is_scalar($overrides['api_key'])
                ? sanitize_text_field(trim((string) $overrides['api_key']))
                : '';
        }

        return array(
            'endpoint' => $configuration['endpoint'],
            'api_key' => $configuration['api_key'],
        );
    }

    /**
     * @param array $messages
     * @param array $options
     * @return array
     */
    private function build_request(array $messages, array $options)
    {
        if (empty($messages)) {
            throw new \InvalidArgumentException('At least one chat message is required.');
        }

        $contents = array();
        $system_parts = array();

        foreach ($messages as $message) {
            if (!is_array($message) || !isset($message['role'], $message['content'])) {
                throw new \InvalidArgumentException('Each chat message must contain a role and content.');
            }

            $role = (string) $message['role'];
            $content = $message['content'];
            if (!in_array($role, array('system', 'user', 'assistant'), true) || !is_string($content) || trim($content) === '') {
                throw new \InvalidArgumentException('Chat messages contain invalid data.');
            }

            $part = array('text' => $content);
            if ($role === 'system') {
                $system_parts[] = $part;
                continue;
            }

            $contents[] = array(
                'role' => $role === 'assistant' ? 'model' : 'user',
                'parts' => array($part),
            );
        }

        if (empty($contents)) {
            throw new \InvalidArgumentException('At least one user or assistant message is required.');
        }

        $request = array('contents' => $contents);
        if (!empty($system_parts)) {
            $request['systemInstruction'] = array('parts' => $system_parts);
        }

        $generation_config = $this->generation_config($options);
        if (!empty($generation_config)) {
            $request['generationConfig'] = $generation_config;
        }

        return $request;
    }

    /**
     * Map provider-neutral options to Gemini's generationConfig keys.
     *
     * @param array $options
     * @return array
     */
    private function generation_config(array $options)
    {
        $generation_config = array();

        if (array_key_exists('temperature', $options)) {
            if (!is_numeric($options['temperature']) || (float) $options['temperature'] < 0 || (float) $options['temperature'] > 2) {
                throw new \InvalidArgumentException('The provider option "temperature" is out of range.');
            }

            $generation_config['temperature'] = (float) $options['temperature'];
        }

        if (array_key_exists('max_tokens', $options)) {
            if (!is_numeric($options['max_tokens']) || (int) $options['max_tokens'] < 1 || (float) $options['max_tokens'] !== (float) (int) $options['max_tokens']) {
                throw new \InvalidArgumentException('The provider option "max_tokens" must be a positive integer.');
            }

            $generation_config['maxOutputTokens'] = (int) $options['max_tokens'];
        }

        if (isset($options['response_mime_type']) && is_scalar($options['response_mime_type'])) {
            $mime_type = sanitize_text_field((string) $options['response_mime_type']);
            if ($mime_type === 'application/json') {
                $generation_config['responseMimeType'] = $mime_type;
                $generation_config['responseSchema'] = $this->article_schema();
            }
        }

        return $generation_config;
    }

    private function article_schema()
    {
        return array(
            'type' => 'OBJECT',
            'properties' => array(
                'title' => array('type' => 'STRING'),
                'slug' => array('type' => 'STRING'),
                'excerpt' => array('type' => 'STRING'),
                'content' => array('type' => 'STRING'),
                'category' => array('type' => 'STRING'),
                'tags' => array('type' => 'ARRAY', 'items' => array('type' => 'STRING')),
                'meta_description' => array('type' => 'STRING'),
                'faq' => array('type' => 'ARRAY', 'items' => array('type' => 'OBJECT', 'properties' => array('question' => array('type' => 'STRING'), 'answer' => array('type' => 'STRING')), 'required' => array('question', 'answer'))),
                'related_tools' => array('type' => 'ARRAY', 'items' => array('type' => 'STRING')),
            ),
            'required' => array('title', 'slug', 'excerpt', 'content', 'category', 'tags', 'meta_description', 'faq', 'related_tools'),
        );
    }

    /**
     * @param string $endpoint
     * @param string $model
     * @return string
     */
    private function generate_endpoint($endpoint, $model)
    {
        $endpoint = $this->validate_endpoint($endpoint);
        $model = preg_replace('/^models\//', '', trim($model));
        if (!is_string($model) || $model === '' || strpos($model, '/') !== false) {
            throw new \RuntimeException('The AI provider model is invalid.');
        }

        return $endpoint . '/models/' . rawurlencode($model) . ':generateContent';
    }

    private function stream_endpoint($endpoint, $model)
    {
        $endpoint = $this->validate_endpoint($endpoint);
        $model = preg_replace('/^models\//', '', trim($model));
        if (!is_string($model) || $model === '' || strpos($model, '/') !== false) {
            throw new \RuntimeException('The AI provider model is invalid.');
        }

        return $endpoint . '/models/' . rawurlencode($model) . ':streamGenerateContent?alt=sse';
    }

    /**
     * @param string $endpoint
     * @return string
     */
    private function models_endpoint($endpoint)
    {
        return $this->validate_endpoint($endpoint) . '/models';
    }

    /**
     * @param string $endpoint
     * @return string
     */
    private function validate_endpoint($endpoint)
    {
        $parts = wp_parse_url($endpoint);
        if (
            !is_array($parts)
            || empty($parts['scheme'])
            || empty($parts['host'])
            || !in_array(strtolower($parts['scheme']), array('http', 'https'), true)
            || !empty($parts['user'])
            || !empty($parts['pass'])
            || !empty($parts['query'])
            || !empty($parts['fragment'])
        ) {
            throw new \RuntimeException('The AI provider endpoint is invalid.');
        }

        return untrailingslashit($endpoint);
    }

    /**
     * @param string $api_key
     * @param bool $with_content_type
     * @return array
     */
    private function headers($api_key, $with_content_type = false)
    {
        $headers = array(
            'X-goog-api-key' => $api_key,
            'Accept' => 'application/json',
        );

        if ($with_content_type) {
            $headers['Content-Type'] = 'application/json';
        }

        return $headers;
    }

    /**
     * @param array $response
     * @return string
     */
    private function response_content(array $response)
    {
        if (!isset($response['candidates'][0]['content']['parts']) || !is_array($response['candidates'][0]['content']['parts'])) {
            $reason = isset($response['candidates'][0]['finishReason']) ? sanitize_key((string) $response['candidates'][0]['finishReason']) : '';
            throw new \RuntimeException($reason !== '' ? 'The AI provider returned no visible content (finish reason: ' . $reason . ').' : 'The AI provider response did not contain message content.');
        }

        $parts = array();
        foreach ($response['candidates'][0]['content']['parts'] as $part) {
            if (is_array($part) && isset($part['text']) && is_string($part['text'])) {
                $parts[] = $part['text'];
            }
        }

        $content = trim(implode('', $parts));
        if ($content === '') {
            $reason = isset($response['candidates'][0]['finishReason']) ? sanitize_key((string) $response['candidates'][0]['finishReason']) : '';
            throw new \RuntimeException($reason !== '' ? 'The AI provider returned empty content (finish reason: ' . $reason . ').' : 'The AI provider response contained empty message content.');
        }

        return $content;
    }

    /**
     * @param array $response
     * @param string $fallback
     * @return string
     */
    private function response_model(array $response, $fallback)
    {
        if (isset($response['modelVersion']) && is_scalar($response['modelVersion'])) {
            return sanitize_text_field((string) $response['modelVersion']);
        }

        return sanitize_text_field($fallback);
    }

    /**
     * @param array $usage
     * @return array
     */
    private function normalize_usage(array $usage)
    {
        $normalized = array();
        $mapping = array(
            'promptTokenCount' => 'prompt_tokens',
            'candidatesTokenCount' => 'completion_tokens',
            'totalTokenCount' => 'total_tokens',
        );

        foreach ($mapping as $source => $target) {
            if (isset($usage[$source]) && is_numeric($usage[$source])) {
                $normalized[$target] = (int) $usage[$source];
            }
        }

        return $normalized;
    }

    /**
     * Include a safe WordPress transport code without exposing headers or keys.
     *
     * @param string $prefix
     * @param \WP_Error $error
     * @return string
     */
    private function wp_error_message($prefix, $error)
    {
        $code = sanitize_key((string) $error->get_error_code());
        $message = sanitize_text_field((string) $error->get_error_message());
        return $prefix . ($code !== '' ? ' (' . $code . ')' : '') . ($message !== '' ? ': ' . $message : '.');
    }

    private function http_failure_message($prefix, $status, $body)
    {
        $decoded = json_decode((string) $body, true);
        $reason = is_array($decoded) && isset($decoded['error']['status']) ? sanitize_key((string) $decoded['error']['status']) : '';
        $message = is_array($decoded) && isset($decoded['error']['message']) && is_scalar($decoded['error']['message']) ? sanitize_text_field((string) $decoded['error']['message']) : '';
        return $prefix . ' (HTTP ' . absint($status) . ($reason !== '' ? ', ' . $reason : '') . ')' . ($message !== '' ? ': ' . $message : '.');
    }
}
