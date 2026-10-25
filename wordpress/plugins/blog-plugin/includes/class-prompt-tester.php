<?php

namespace ZebraCode\BlogAI;

use ZebraCode\BlogAI\Contracts\AIProviderInterface;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Runs an authenticated provider prompt without creating a post or job.
 */
final class PromptTester
{
    /** @var AIProviderInterface */
    private $provider;

    public function __construct(AIProviderInterface $provider)
    {
        $this->provider = $provider;
    }

    /**
     * @param string $system_prompt
     * @param string $user_prompt
     * @param array $options
     * @return array
     */
    public function test($system_prompt, $user_prompt, array $options = array())
    {
        $system_prompt = $this->bounded_text($system_prompt, 12000);
        $user_prompt = $this->bounded_text($user_prompt, 30000);

        if ($system_prompt === '' || $user_prompt === '') {
            throw new \InvalidArgumentException('Both system and user prompts are required.');
        }

        $response = $this->provider->generate(
            array(
                array('role' => 'system', 'content' => $system_prompt),
                array('role' => 'user', 'content' => $user_prompt),
            ),
            array_merge(array('temperature' => 0.2, 'max_tokens' => 8000, 'response_mime_type' => 'application/json'), $options)
        );

        $raw = isset($response['content']) && is_string($response['content']) ? $response['content'] : '';
        $decoded = $this->decode_json($raw);
        $validation = array('valid' => false, 'error' => '');

        if (is_array($decoded)) {
            try {
                ArticleValidator::normalize($decoded);
                $validation['valid'] = true;
            } catch (\Throwable $exception) {
                $validation['error'] = sanitize_text_field($exception->getMessage());
            }
        }

        return array(
            'raw' => $this->bounded_text($raw, 30000),
            'raw_length' => function_exists('mb_strlen') ? mb_strlen($raw, 'UTF-8') : strlen($raw),
            'model' => isset($response['model']) ? sanitize_text_field((string) $response['model']) : '',
            'finish_reason' => isset($response['finish_reason']) ? sanitize_key((string) $response['finish_reason']) : '',
            'usage' => isset($response['usage']) && is_array($response['usage']) ? $response['usage'] : array(),
            'json_valid' => is_array($decoded),
            'json_error' => is_array($decoded) ? '' : 'The response is not a valid JSON object.',
            'article_valid' => $validation['valid'],
            'article_error' => $validation['error'],
        );
    }

    private function decode_json($raw)
    {
        $raw = trim($raw);
        $raw = preg_replace('/^```(?:json)?\s*(.*?)\s*```$/is', '$1', $raw);
        $decoded = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }

        $start = strpos($raw, '{');
        $end = strrpos($raw, '}');
        if ($start === false || $end === false || $end <= $start) {
            return null;
        }

        $decoded = json_decode(substr($raw, $start, $end - $start + 1), true);
        return json_last_error() === JSON_ERROR_NONE && is_array($decoded) ? $decoded : null;
    }

    private function bounded_text($value, $limit)
    {
        $value = is_scalar($value) ? (string) $value : '';
        return function_exists('mb_substr') ? mb_substr($value, 0, $limit, 'UTF-8') : substr($value, 0, $limit);
    }
}
