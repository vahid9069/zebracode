<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Shared outbound transport for provider requests.
 *
 * Shared hosting often has unreliable IPv6 routes or transient cURL failures.
 * Keep the retry policy here so providers do not each implement a different
 * version of the same network workaround.
 */
final class ProviderTransport
{
    /**
     * Stream an HTTP response through cURL without buffering the provider body.
     *
     * @param string   $method
     * @param string   $url
     * @param array    $args
     * @param callable $on_chunk
     * @param int      $timeout
     * @return array|\WP_Error
     */
    public static function stream($method, $url, array $args, callable $on_chunk, $timeout = 120)
    {
        if (!function_exists('curl_init')) {
            return new \WP_Error('curl_unavailable', 'PHP cURL is required for streaming responses.');
        }

        $method = strtoupper((string) $method);
        $headers = array();
        foreach (isset($args['headers']) && is_array($args['headers']) ? $args['headers'] : array() as $name => $value) {
            $headers[] = $name . ': ' . $value;
        }

        $handle = curl_init($url);
        $options = array(
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_HEADER => false,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => min(15, max(3, (int) $timeout)),
            CURLOPT_TIMEOUT => max(3, (int) $timeout),
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_WRITEFUNCTION => function ($curl, $chunk) use ($on_chunk) {
                $on_chunk($chunk);
                if (function_exists('ob_flush')) {
                    @ob_flush();
                }
                @flush();
                return strlen($chunk);
            },
        );

        if ($method === 'POST') {
            $options[CURLOPT_POST] = true;
            $options[CURLOPT_POSTFIELDS] = isset($args['body']) ? $args['body'] : '';
        }
        if (defined('CURLOPT_IPRESOLVE') && defined('CURL_IPRESOLVE_V4')) {
            $options[CURLOPT_IPRESOLVE] = CURL_IPRESOLVE_V4;
        }

        curl_setopt_array($handle, $options);
        $result = curl_exec($handle);
        $error = curl_error($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_HTTP_CODE);
        curl_close($handle);

        if ($result === false || $error !== '') {
            return new \WP_Error('stream_request_failed', sanitize_text_field($error !== '' ? $error : 'The streaming request failed.'));
        }

        return array('status' => $status);
    }

    /**
     * @param string $method
     * @param string $url
     * @param array $args
     * @param int $timeout
     * @param bool $retry_network
     * @param bool $retry_transient_response
     * @return array|\WP_Error
     */
    public static function request($method, $url, array $args = array(), $timeout = 30, $retry_network = true, $retry_transient_response = false)
    {
        $method = strtoupper((string) $method);
        $request_args = array_merge(
            array(
                'timeout' => max(3, (int) $timeout),
                'redirection' => 0,
                'blocking' => true,
                'sslverify' => true,
            ),
            $args
        );

        $host = (string) wp_parse_url($url, PHP_URL_HOST);
        $connect_timeout = min(15, max(3, (int) $request_args['timeout']));
        $curl_hook = static function ($handle, $request, $request_url) use ($host, $connect_timeout) {
            if ($host === '' || (string) wp_parse_url($request_url, PHP_URL_HOST) !== $host) {
                return;
            }

            if (defined('CURLOPT_IPRESOLVE') && defined('CURL_IPRESOLVE_V4')) {
                curl_setopt($handle, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
            }
            if (defined('CURLOPT_CONNECTTIMEOUT')) {
                curl_setopt($handle, CURLOPT_CONNECTTIMEOUT, $connect_timeout);
            }
        };

        add_action('http_api_curl', $curl_hook, 10, 3);
        try {
            $attempts = ($retry_network || $retry_transient_response) ? 3 : 1;
            $response = null;

            for ($attempt = 1; $attempt <= $attempts; $attempt++) {
                $response = $method === 'GET'
                    ? wp_safe_remote_get($url, $request_args)
                    : wp_safe_remote_post($url, $request_args);

                $retryable_error = is_wp_error($response) && $retry_network && self::is_retryable($response);
                $retryable_response = !is_wp_error($response) && $retry_transient_response && self::is_retryable_response($response);
                if ((!$retryable_error && !$retryable_response) || $attempt === $attempts) {
                    break;
                }

                sleep(min(4, 1 << ($attempt - 1)));
            }

            return $response;
        } finally {
            remove_action('http_api_curl', $curl_hook, 10);
        }
    }

    /**
     * @param \WP_Error $error
     * @return bool
     */
    private static function is_retryable($error)
    {
        $message = is_wp_error($error) ? $error->get_error_message() : '';
        return (bool) preg_match('/timed out|cURL error (6|7|28|35|52|56)|Could not resolve host|SSL connection/i', (string) $message);
    }

    /**
     * Retry only transient provider failures. Do not retry 4xx auth/configuration errors.
     *
     * @param array $response
     * @return bool
     */
    private static function is_retryable_response($response)
    {
        $status = is_array($response) ? (int) wp_remote_retrieve_response_code($response) : 0;
        return in_array($status, array(408, 429, 500, 502, 503, 504), true);
    }
}
