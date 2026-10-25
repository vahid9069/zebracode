<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Activity log facade backed by the custom generation log table.
 */
final class ActivityLogger
{
    /** @var GenerationLogRepository */
    private $repository;

    public function __construct(GenerationLogRepository $repository = null)
    {
        $this->repository = $repository instanceof GenerationLogRepository ? $repository : new GenerationLogRepository();
    }

    /**
     * Record an event after removing credentials and other sensitive values.
     *
     * @param string $event
     * @param array  $data
     * @return array
     */
    public function log($event, $data = array())
    {
        $event = sanitize_key((string) $event);
        $event = $event !== '' ? $event : 'unknown';
        $data = is_array($data) ? $data : array();
        $safe_data = $this->sanitize_data($data);
        $status = isset($safe_data['status']) ? sanitize_key((string) $safe_data['status']) : 'unknown';
        $entry = array(
            'event' => $event,
            'status' => $status !== '' ? $status : 'unknown',
            'data' => $safe_data,
            'timestamp' => current_time('mysql', true),
        );

        $this->repository->insert(array(
            'event' => $event,
            'status' => $entry['status'],
            'data' => $safe_data,
            'user_id' => isset($safe_data['user_id']) ? absint($safe_data['user_id']) : get_current_user_id(),
            'job_id' => isset($safe_data['job_id']) ? (string) $safe_data['job_id'] : '',
            'provider' => isset($safe_data['provider']) ? (string) $safe_data['provider'] : '',
            'model' => isset($safe_data['model']) ? (string) $safe_data['model'] : '',
            'prompt' => isset($safe_data['prompt']) ? (string) $safe_data['prompt'] : '',
            'response' => isset($safe_data['response']) ? (string) $safe_data['response'] : '',
            'created_at' => $entry['timestamp'],
        ));

        return $entry;
    }

    /**
     * Return newest entries, with a hard upper bound of the retention limit.
     *
     * @param int $limit
     * @return array
     */
    public function recent($limit = 20)
    {
        return $this->repository->recent($limit);
    }

    /**
     * Count entries by their normalized status.
     *
     * With no status, all counters are returned.
     *
     * @param string|null $status
     * @return int|array
     */
    public function countByStatus($status = null)
    {
        return $this->repository->count_by_status($status);
    }

    /**
     * Return status counters for all retained events.
     *
     * @return array
     */
    public function statusCounters()
    {
        return $this->repository->count_by_status();
    }

    /**
     * Alias for callers using a lower-case separator convention.
     *
     * @return array
     */
    public function status_counters()
    {
        return $this->statusCounters();
    }

    /**
     * Recursively sanitize log data and omit keys that commonly contain secrets.
     *
     * @param array $data
     * @param int   $depth
     * @return array
     */
    private function sanitize_data(array $data, $depth = 0)
    {
        if ($depth > 5) {
            return array();
        }

        $safe = array();
        foreach ($data as $key => $value) {
            $key = is_string($key) ? sanitize_key($key) : (string) $key;
            if ($key === '' || $this->is_sensitive_key($key)) {
                continue;
            }

            if (is_array($value)) {
                $safe[$key] = $this->sanitize_data($value, $depth + 1);
            } elseif (is_bool($value) || is_int($value) || is_float($value)) {
                $safe[$key] = $value;
            } elseif (is_string($value)) {
                $safe[$key] = $this->sanitize_string($value);
            }
        }

        return $safe;
    }

    /**
     * @param string $key
     * @return bool
     */
    private function is_sensitive_key($key)
    {
        return (bool) preg_match('/(?:pass(?:word)?|api[_-]?key|secret|token|authorization|credential|private[_-]?key)/i', $key);
    }

    /**
     * Remove common secret formats even when embedded in a non-sensitive field.
     *
     * @param string $value
     * @return string
     */
    private function sanitize_string($value)
    {
        $value = sanitize_textarea_field($value);
        $value = preg_replace('/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/i', '[redacted]', $value);
        $value = preg_replace('/\b(?:sk|rk)-[A-Za-z0-9_-]{12,}\b/i', '[redacted]', $value);
        $value = preg_replace('/\b(?:api[_-]?key|token|secret|password|authorization)\s*[:=]\s*[^\s,;]+/i', '[redacted]', $value);

        return function_exists('mb_substr') ? mb_substr($value, 0, 2000) : substr($value, 0, 2000);
    }
}
