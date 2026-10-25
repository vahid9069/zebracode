<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Server-side connectivity diagnostics for shared hosting without SSH.
 */
final class TransportDiagnostics
{
    public function run()
    {
        $settings = (new Settings())->get();
        $provider = isset($settings['provider']) ? sanitize_key($settings['provider']) : '';
        $endpoint = isset($settings['endpoint']) ? untrailingslashit(trim((string) $settings['endpoint'])) : '';
        $models_url = $endpoint . '/models';
        $headers = $provider === 'gemini'
            ? array('X-goog-api-key' => isset($settings['api_key']) ? trim((string) $settings['api_key']) : '', 'Accept' => 'application/json')
            : array('Authorization' => 'Bearer ' . (isset($settings['api_key']) ? trim((string) $settings['api_key']) : ''), 'Accept' => 'application/json');

        return array(
            'provider' => $provider,
            'endpoint' => esc_url_raw($models_url),
            'php' => PHP_VERSION,
            'openssl' => defined('OPENSSL_VERSION_TEXT') ? OPENSSL_VERSION_TEXT : 'Unavailable',
            'curl' => function_exists('curl_init') ? (defined('CURLOPT_TIMEOUT') ? 'Available' : 'Available, constants unavailable') : 'Unavailable',
            'dns' => $this->dns($endpoint),
            'wordpress_http' => $this->wordpress_http($models_url, $headers),
            'native_curl' => $this->native_curl($models_url, $headers),
        );
    }

    private function dns($endpoint)
    {
        $host = wp_parse_url($endpoint, PHP_URL_HOST);
        if (!$host) {
            return array('status' => 'fail', 'message' => 'The endpoint host is invalid.');
        }
        $ip = gethostbyname($host);
        if ($ip === $host) {
            return array('status' => 'fail', 'message' => 'DNS could not resolve the provider host.');
        }
        return array('status' => 'pass', 'message' => 'DNS resolved provider host.', 'host' => sanitize_text_field($host), 'ip' => sanitize_text_field($ip));
    }

    private function wordpress_http($url, array $headers)
    {
        $response = ProviderTransport::request('GET', $url, array('headers' => $headers), 15, true);
        if (is_wp_error($response)) {
            return array('status' => 'fail', 'code' => sanitize_key((string) $response->get_error_code()), 'message' => sanitize_text_field($response->get_error_message()));
        }
        $status = (int) wp_remote_retrieve_response_code($response);
        return array('status' => $status >= 200 && $status < 300 ? 'pass' : 'warning', 'http_status' => $status, 'message' => $status >= 200 && $status < 300 ? 'WordPress HTTP API reached the provider.' : 'WordPress HTTP API reached the provider but received an HTTP error.');
    }

    private function native_curl($url, array $headers)
    {
        if (!function_exists('curl_init')) {
            return array('status' => 'fail', 'message' => 'PHP cURL extension is not enabled on this server.');
        }
        $handle = curl_init($url);
        $options = array(CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => false, CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_TIMEOUT => 20, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2, CURLOPT_HTTPHEADER => $this->header_lines($headers));
        if (defined('CURLOPT_IPRESOLVE') && defined('CURL_IPRESOLVE_V4')) {
            $options[CURLOPT_IPRESOLVE] = CURL_IPRESOLVE_V4;
        }
        curl_setopt_array($handle, $options);
        $body = curl_exec($handle);
        $error = curl_error($handle);
        $errno = curl_errno($handle);
        $http_status = (int) curl_getinfo($handle, CURLINFO_HTTP_CODE);
        curl_close($handle);
        if ($body === false || $errno !== 0) {
            return array('status' => 'fail', 'code' => $errno, 'message' => sanitize_text_field($error !== '' ? $error : 'Native cURL request failed.'));
        }
        return array('status' => $http_status >= 200 && $http_status < 300 ? 'pass' : 'warning', 'http_status' => $http_status, 'message' => $http_status >= 200 && $http_status < 300 ? 'Native cURL reached the provider.' : 'Native cURL reached the provider but received an HTTP error.');
    }

    private function header_lines(array $headers)
    {
        $lines = array();
        foreach ($headers as $name => $value) {
            $lines[] = $name . ': ' . $value;
        }
        return $lines;
    }
}
