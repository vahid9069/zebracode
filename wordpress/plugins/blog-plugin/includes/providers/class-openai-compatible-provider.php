<?php

namespace ZebraCode\BlogAI\Providers;

use ZebraCode\BlogAI\Contracts\AIProviderInterface;
use ZebraCode\BlogAI\ProviderTransport;
use ZebraCode\BlogAI\Settings;

if (!defined('ABSPATH')) {
    exit;
}

final class OpenAICompatibleProvider implements AIProviderInterface
{
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

        $body = array(
            'model' => $configuration['model'],
            'messages' => $this->normalize_messages($messages),
            'stream' => true,
        );
        $body = array_merge($body, $this->normalize_options($options));
        $encoded = wp_json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($encoded)) {
            throw new \RuntimeException('The streaming request could not be encoded.');
        }

        $buffer = '';
        $content = '';
        $model = $configuration['model'];
        $finish_reason = '';
        $response = ProviderTransport::stream(
            'POST',
            $this->chat_endpoint($configuration['endpoint']),
            array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $configuration['api_key'],
                    'Content-Type' => 'application/json',
                    'Accept' => 'text/event-stream',
                ),
                'body' => $encoded,
            ),
            function ($chunk) use (&$buffer, &$content, &$model, &$finish_reason, $on_chunk) {
                $buffer .= (string) $chunk;
                while (($newline = strpos($buffer, "\n")) !== false) {
                    $line = trim(substr($buffer, 0, $newline));
                    $buffer = substr($buffer, $newline + 1);
                    if (strpos($line, 'data:') !== 0) {
                        continue;
                    }
                    $payload = trim(substr($line, 5));
                    if ($payload === '' || $payload === '[DONE]') {
                        continue;
                    }
                    $decoded = json_decode($payload, true);
                    if (!is_array($decoded)) {
                        continue;
                    }
                    if (!empty($decoded['model']) && is_scalar($decoded['model'])) {
                        $model = sanitize_text_field((string) $decoded['model']);
                    }
                    if (isset($decoded['choices'][0]['finish_reason']) && is_scalar($decoded['choices'][0]['finish_reason'])) {
                        $finish_reason = sanitize_key((string) $decoded['choices'][0]['finish_reason']);
                    }
                    $delta = isset($decoded['choices'][0]['delta']['content']) ? $decoded['choices'][0]['delta']['content'] : '';
                    if (is_string($delta) && $delta !== '') {
                        $content .= $delta;
                        $on_chunk($delta);
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

        return array('content' => $content, 'model' => $model, 'usage' => array(), 'finish_reason' => $finish_reason);
    }

    /**
     * Generate an image through an OpenAI-compatible /images/generations
     * endpoint using the same server-side API key.
     *
     * @param string $prompt
     * @param array  $options
     * @return array{data:string,mime_type:string,extension:string,model:string}
     */
    public function generate_image($prompt, array $options = array())
    {
        $configuration = $this->configuration();
        if ($configuration['api_key'] === '' || $configuration['endpoint'] === '') {
            throw new \RuntimeException('The AI provider is not configured.');
        }

        $settings = $this->settings->get();
        $image_model = isset($options['image_model']) && is_scalar($options['image_model']) ? trim((string) $options['image_model']) : '';
        if ($image_model === '' && isset($settings['image_model']) && is_scalar($settings['image_model'])) {
            $image_model = trim((string) $settings['image_model']);
        }
        if ($image_model === '') {
            $image_model = 'gpt-image-1';
        }

        $body = array(
            'model' => $image_model,
            'prompt' => (string) $prompt,
            'size' => isset($options['size']) && is_scalar($options['size']) ? sanitize_text_field((string) $options['size']) : '1536x1024',
            'quality' => isset($options['quality']) && is_scalar($options['quality']) ? sanitize_key((string) $options['quality']) : 'low',
            'output_format' => 'png',
        );
        $encoded = wp_json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($encoded)) {
            throw new \RuntimeException('The image request could not be encoded.');
        }

        $response = ProviderTransport::request(
            'POST',
            $this->images_endpoint($configuration['endpoint']),
            array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $configuration['api_key'],
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ),
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
        if (!is_array($decoded) || empty($decoded['data'][0]) || !is_array($decoded['data'][0])) {
            throw new \RuntimeException('The image provider returned invalid image data.');
        }

        $item = $decoded['data'][0];
        if (!empty($item['b64_json']) && is_string($item['b64_json'])) {
            $binary = base64_decode($item['b64_json'], true);
            if ($binary !== false && $binary !== '') {
                return array('data' => $binary, 'mime_type' => 'image/png', 'extension' => 'png', 'model' => $image_model);
            }
        }

        if (!empty($item['url']) && is_string($item['url'])) {
            $download = ProviderTransport::request('GET', esc_url_raw($item['url']), array('headers' => array('Accept' => 'image/*')), 120, true, false);
            if (!is_wp_error($download) && (int) wp_remote_retrieve_response_code($download) >= 200 && (int) wp_remote_retrieve_response_code($download) < 300) {
                $binary = wp_remote_retrieve_body($download);
                if (is_string($binary) && $binary !== '') {
                    $mime = wp_remote_retrieve_header($download, 'content-type');
                    $mime = is_string($mime) && strpos(strtolower($mime), 'image/') === 0 ? strtolower($mime) : 'image/png';
                    return array('data' => $binary, 'mime_type' => $mime, 'extension' => $mime === 'image/jpeg' ? 'jpg' : ($mime === 'image/webp' ? 'webp' : 'png'), 'model' => $image_model);
                }
            }
        }

        throw new \RuntimeException('The image provider returned no downloadable image data.');
    }

    private function generate_with_configuration(array $configuration, array $messages, array $options = array())
    {
        $api_key = $configuration['api_key'];
        $model = $configuration['model'];
        $endpoint = $configuration['endpoint'];

        $url = $this->chat_endpoint($endpoint);
        $normalized_messages = $this->normalize_messages($messages);
        $body = array(
            'model' => $model,
            'messages' => $normalized_messages,
        );

        $body = array_merge($body, $this->normalize_options($options));

        $encoded_body = wp_json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($encoded_body)) {
            throw new \RuntimeException('The AI provider request could not be encoded.');
        }

        $response = ProviderTransport::request(
            'POST',
            $url,
            array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $api_key,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ),
                'body' => $encoded_body,
                'data_format' => 'body',
            ),
            self::REQUEST_TIMEOUT,
            false
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

        $content = $this->response_content($decoded);

        return array(
            'content' => $content,
            'model' => isset($decoded['model']) ? sanitize_text_field((string) $decoded['model']) : $model,
            'usage' => isset($decoded['usage']) && is_array($decoded['usage']) ? $this->normalize_usage($decoded['usage']) : array(),
            'finish_reason' => isset($decoded['choices'][0]['finish_reason']) ? sanitize_key((string) $decoded['choices'][0]['finish_reason']) : '',
        );
    }

    /**
     * Use the provider's models endpoint as a non-generating health check.
     *
     * @return array{model:string,models:int}
     */
    public function test_connection(array $overrides = array())
    {
        $configuration = $this->configuration($overrides);
        $api_key = $configuration['api_key'];
        $model = $configuration['model'];
        $endpoint = $configuration['endpoint'];

        if ($api_key === '' || $model === '' || $endpoint === '') {
            throw new \RuntimeException('The AI provider is not configured.');
        }

        $url = $this->models_endpoint($endpoint);
        $response = ProviderTransport::request(
            'GET',
            $url,
            array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $api_key,
                    'Accept' => 'application/json',
                ),
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

        $this->generate_with_configuration(
            $configuration,
            array(array('role' => 'user', 'content' => 'Reply with OK only.')),
            array('temperature' => 0, 'max_tokens' => 128)
        );

        return array(
            'model' => $model,
            'models' => isset($decoded['data']) && is_array($decoded['data']) ? count($decoded['data']) : 0,
        );
    }

    /**
     * List models from the provider's OpenAI-compatible models endpoint.
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

        $response = ProviderTransport::request(
            'GET',
            $this->models_endpoint($configuration['endpoint']),
            array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $configuration['api_key'],
                    'Accept' => 'application/json',
                ),
            ),
            self::LIST_MODELS_TIMEOUT,
            true
        );

        if (is_wp_error($response)) {
            throw new \RuntimeException($this->wp_error_message('The AI provider models request failed.', $response));
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        if ($status < 200 || $status >= 300) {
            throw new \RuntimeException($this->http_failure_message('The AI provider returned an unsuccessful models response', $status, wp_remote_retrieve_body($response)));
        }

        $decoded = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($decoded) || !isset($decoded['data']) || !is_array($decoded['data'])) {
            throw new \RuntimeException('The AI provider returned invalid model data.');
        }

        $models = array();
        foreach ($decoded['data'] as $model) {
            if (!is_array($model) || !isset($model['id']) || !is_scalar($model['id'])) {
                continue;
            }

            $id = sanitize_text_field(trim((string) $model['id']));
            if ($id === '') {
                continue;
            }

            $models[] = array(
                'id' => $id,
                'name' => $id,
                'label' => $id,
            );
        }

        return $models;
    }

    /**
     * @param array $overrides
     * @return array{endpoint:string,api_key:string}
     */
    private function list_models_configuration(array $overrides)
    {
        $settings = $this->settings->get();
        $settings = is_array($settings) ? $settings : array();

        $endpoint = isset($settings['endpoint']) && is_scalar($settings['endpoint'])
            ? trim((string) $settings['endpoint'])
            : '';
        $api_key = isset($settings['api_key']) && is_scalar($settings['api_key'])
            ? trim((string) $settings['api_key'])
            : '';

        if (array_key_exists('endpoint', $overrides)) {
            $endpoint = is_scalar($overrides['endpoint'])
                ? esc_url_raw(trim((string) $overrides['endpoint']))
                : '';
        }

        if (array_key_exists('api_key', $overrides)) {
            $api_key = is_scalar($overrides['api_key'])
                ? sanitize_text_field(trim((string) $overrides['api_key']))
                : '';
        }

        return array(
            'endpoint' => $endpoint,
            'api_key' => $api_key,
        );
    }

    /**
     * @param array $overrides
     * @return array{endpoint:string,model:string,api_key:string}
     */
    private function configuration(array $overrides = array())
    {
        $settings = $this->settings->get();
        $configuration = array(
            'endpoint' => isset($settings['endpoint']) ? trim((string) $settings['endpoint']) : '',
            'model' => isset($settings['model']) ? trim((string) $settings['model']) : '',
            'api_key' => isset($settings['api_key']) ? trim((string) $settings['api_key']) : '',
        );

        foreach (array('endpoint', 'model', 'api_key') as $key) {
            if (array_key_exists($key, $overrides)) {
                $configuration[$key] = is_scalar($overrides[$key]) ? trim((string) $overrides[$key]) : '';
            }
        }

        return $configuration;
    }

    /**
     * @param string $endpoint
     * @return string
     */
    private function chat_endpoint($endpoint)
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

        $endpoint = untrailingslashit($endpoint);
        $chat_path = '/chat/completions';
        if (substr($endpoint, -strlen($chat_path)) !== $chat_path) {
            $endpoint .= '/chat/completions';
        }

        return $endpoint;
    }

    /**
     * @param string $endpoint
     * @return string
     */
    private function models_endpoint($endpoint)
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

        $endpoint = untrailingslashit($endpoint);
        $models_path = '/models';
        if (substr($endpoint, -strlen($models_path)) !== $models_path) {
            $endpoint .= $models_path;
        }

        return $endpoint;
    }

    /**
     * @param string $endpoint
     * @return string
     */
    private function images_endpoint($endpoint)
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

        $endpoint = untrailingslashit($endpoint);
        $images_path = '/images/generations';
        if (substr($endpoint, -strlen($images_path)) !== $images_path) {
            $endpoint .= $images_path;
        }

        return $endpoint;
    }

    /**
     * @param array $messages
     * @return array
     */
    private function normalize_messages(array $messages)
    {
        if (empty($messages)) {
            throw new \InvalidArgumentException('At least one chat message is required.');
        }

        $normalized = array();
        foreach ($messages as $message) {
            if (!is_array($message) || !isset($message['role'], $message['content'])) {
                throw new \InvalidArgumentException('Each chat message must contain a role and content.');
            }

            $role = (string) $message['role'];
            $content = $message['content'];
            if (!in_array($role, array('system', 'user', 'assistant'), true) || !is_string($content) || trim($content) === '') {
                throw new \InvalidArgumentException('Chat messages contain invalid data.');
            }

            $normalized[] = array(
                'role' => $role,
                'content' => $content,
            );
        }

        return $normalized;
    }

    /**
     * Only pass supported, bounded generation options to the remote endpoint.
     *
     * @param array $options
     * @return array
     */
    private function normalize_options(array $options)
    {
        $normalized = array();
        $ranges = array(
            'temperature' => array(0, 2),
            'top_p' => array(0, 1),
            'presence_penalty' => array(-2, 2),
            'frequency_penalty' => array(-2, 2),
        );

        foreach ($ranges as $key => $range) {
            if (!array_key_exists($key, $options)) {
                continue;
            }

            if (!is_numeric($options[$key]) || (float) $options[$key] < $range[0] || (float) $options[$key] > $range[1]) {
                throw new \InvalidArgumentException(sprintf('The provider option "%s" is out of range.', $key));
            }

            $normalized[$key] = (float) $options[$key];
        }

        if (array_key_exists('max_tokens', $options)) {
            if (!is_numeric($options['max_tokens']) || (int) $options['max_tokens'] < 1 || (float) $options['max_tokens'] !== (float) (int) $options['max_tokens']) {
                throw new \InvalidArgumentException('The provider option "max_tokens" must be a positive integer.');
            }

            $normalized['max_tokens'] = (int) $options['max_tokens'];
        }

        if (isset($options['response_mime_type']) && $options['response_mime_type'] === 'application/json') {
            $normalized['response_format'] = array('type' => 'json_object');
        }

        return $normalized;
    }

    /**
     * @param array $response
     * @return string
     */
    private function response_content(array $response)
    {
        if (!isset($response['choices'][0]['message']['content'])) {
            throw new \RuntimeException('The AI provider response did not contain message content.');
        }

        $content = $response['choices'][0]['message']['content'];
        if (is_string($content)) {
            $content = trim($content);
        } elseif (is_array($content)) {
            $parts = array();
            foreach ($content as $part) {
                if (is_array($part) && isset($part['text']) && is_string($part['text'])) {
                    $parts[] = $part['text'];
                }
            }
            $content = trim(implode('', $parts));
        } else {
            $content = '';
        }

        if ($content === '') {
            throw new \RuntimeException('The AI provider response contained empty message content.');
        }

        return $content;
    }

    /**
     * @param array $usage
     * @return array
     */
    private function normalize_usage(array $usage)
    {
        $normalized = array();
        foreach (array('prompt_tokens', 'completion_tokens', 'total_tokens') as $key) {
            if (isset($usage[$key]) && is_numeric($usage[$key])) {
                $normalized[$key] = (int) $usage[$key];
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
        $reason = is_array($decoded) && isset($decoded['error']['type']) ? sanitize_key((string) $decoded['error']['type']) : '';
        $message = is_array($decoded) && isset($decoded['error']['message']) && is_scalar($decoded['error']['message']) ? sanitize_text_field((string) $decoded['error']['message']) : '';
        return $prefix . ' (HTTP ' . absint($status) . ($reason !== '' ? ', ' . $reason : '') . ')' . ($message !== '' ? ': ' . $message : '.');
    }
}
