<?php

namespace ZebraCode\BlogAI;

use ZebraCode\BlogAI\Contracts\ContentGeneratorInterface;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Small WP-Cron-backed queue for generation requests.
 */
final class GenerationQueue
{
    const OPTION_KEY = 'zebracode_blog_ai_generation_jobs';
    const ACTION = 'zebracode_blog_ai_process_job';
    const MAX_JOBS = 50;
    const MAX_ATTEMPTS = 2;
    const MAX_TRANSIENT_ATTEMPTS = 4;
    const REFRESH_CANDIDATE_META_KEY = '_zebracode_blog_ai_refresh_candidate_post_id';
    const REFRESH_JOB_META_KEY = '_zebracode_blog_ai_refresh_job_id';
    const REFRESH_SOURCE_META_KEY = '_zebracode_blog_ai_refresh_source_post_id';
    const REFRESH_SOURCE_HASH_META_KEY = '_zebracode_blog_ai_refresh_source_hash';
    const REFRESH_SOURCE_MODIFIED_META_KEY = '_zebracode_blog_ai_refresh_source_modified_gmt';

    private $generator;
    private $writer;
    private $settings;
    private $activity;
    private $refresh_audit;
    private $refresh_protector;
    private $refresh_generator;
    private $refresh_writer;
    private $featured_image_generator;

    /**
     * The final five arguments are intentionally optional. The existing
     * bootstrap can continue constructing this queue with its original four
     * dependencies while refresh services are introduced independently.
     *
     * @param mixed $refresh_audit
     * @param mixed $refresh_protector
     * @param mixed $refresh_generator
     * @param mixed $refresh_writer
     * @param mixed $featured_image_generator
     */
    public function __construct(ContentGeneratorInterface $generator, DraftWriter $writer, Settings $settings, ActivityLogger $activity, $refresh_audit = null, $refresh_protector = null, $refresh_generator = null, $refresh_writer = null, $featured_image_generator = null)
    {
        $this->generator = $generator;
        $this->writer = $writer;
        $this->settings = $settings;
        $this->activity = $activity;
        $this->featured_image_generator = $featured_image_generator;
        $this->set_refresh_dependencies($refresh_audit, $refresh_protector, $refresh_generator, $refresh_writer);
    }

    /**
     * Allow a later bootstrap to wire isolated refresh services without
     * changing the existing constructor call site.
     *
     * @param mixed $audit
     * @param mixed $protector
     * @param mixed $generator
     * @param mixed $writer
     * @return $this
     */
    public function set_refresh_dependencies($audit = null, $protector = null, $generator = null, $writer = null)
    {
        $this->refresh_audit = $audit;
        $this->refresh_protector = $protector;
        $this->refresh_generator = $generator;
        $this->refresh_writer = $writer;

        return $this;
    }

    public function register_hooks()
    {
        add_action(self::ACTION, array($this, 'process'), 10, 1);
    }

    public function enqueue(array $brief, $user_id)
    {
        $job_id = function_exists('wp_generate_uuid4') ? wp_generate_uuid4() : uniqid('zc_', true);
        $job = array(
            'id' => sanitize_key(str_replace('-', '', $job_id)),
            'status' => 'queued',
            'attempts' => 0,
            'brief' => $brief,
            'user_id' => absint($user_id),
            'created_at' => current_time('mysql', true),
            'updated_at' => current_time('mysql', true),
            'last_error' => '',
            'post_id' => 0,
        );

        $jobs = $this->jobs();
        array_unshift($jobs, $job);
        $this->save_jobs(array_slice($jobs, 0, self::MAX_JOBS));
        $this->schedule_job($job['id']);
        $this->activity->log('generation_queued', array('status' => 'queued', 'job_id' => $job['id'], 'topic' => $brief['topic']));

        return $job;
    }

    /**
     * Enqueue many independent briefs without holding one web request open.
     * Action Scheduler is preferred when WooCommerce (or another host) has
     * provided it; WP-Cron remains a compatible fallback.
     *
     * @param array $briefs
     * @param int   $user_id
     * @return array
     */
    public function enqueue_bulk(array $briefs, $user_id)
    {
        $jobs = array();
        foreach (array_slice($briefs, 0, 100) as $brief) {
            if (!is_array($brief) || empty($brief['topic']) || is_array($brief['topic'])) {
                continue;
            }
            $jobs[] = $this->enqueue($brief, $user_id);
        }

        return $jobs;
    }

    private function schedule_job($job_id)
    {
        if (function_exists('as_enqueue_async_action')) {
            as_enqueue_async_action(self::ACTION, array($job_id), 'zebracode-blog-ai');
            return;
        }

        wp_schedule_single_event(time() + 1, self::ACTION, array($job_id));
    }

    /**
     * Queue a refresh against an existing generated post.
     *
     * The source snapshot is captured before the job is persisted. The source
     * is checked again in process_refresh(), because the cron request may run
     * much later and must never send an edited or unrelated post to a
     * provider.
     *
     * @param int   $source_post_id
     * @param int   $user_id
     * @param mixed $audit Audit data or an audit service for this request.
     * @param mixed $protector Optional source protection service.
     * @param mixed $refresh_generator Optional isolated refresh generator.
     * @param mixed $refresh_writer Optional isolated candidate writer.
     * @return array
     */
    public function enqueue_refresh($source_post_id, $user_id, $audit = null, $protector = null, $refresh_generator = null, $refresh_writer = null)
    {
        $source_post_id = absint($source_post_id);
        $snapshot = $this->source_snapshot($source_post_id);

        if (is_object($audit) || is_callable($audit)) {
            $this->refresh_audit = $audit;
            $audit_data = array();
        } else {
            $audit_data = is_array($audit) ? $audit : array();
        }
        if ($protector !== null) {
            $this->refresh_protector = $protector;
        }
        if ($refresh_generator !== null) {
            $this->refresh_generator = $refresh_generator;
        }
        if ($refresh_writer !== null) {
            $this->refresh_writer = $refresh_writer;
        }

        $existing = $this->find_refresh_job($source_post_id, $snapshot);
        if ($existing) {
            $this->activity->log('refresh_idempotent', array(
                'status' => $existing['status'],
                'job_id' => $existing['id'],
                'source_post_id' => $source_post_id,
                'candidate_post_id' => $this->candidate_id_from_job($existing),
            ));

            return $existing;
        }

        $candidate_post_id = $this->source_candidate_id($source_post_id, $snapshot);
        $status = $candidate_post_id > 0 ? 'completed' : 'queued';
        $job_id = function_exists('wp_generate_uuid4') ? wp_generate_uuid4() : uniqid('zc_', true);
        $job = array(
            'id' => sanitize_key(str_replace('-', '', $job_id)),
            'mode' => 'refresh',
            'type' => 'refresh',
            'status' => $status,
            'attempts' => 0,
            'source_post_id' => $source_post_id,
            'source_content_hash' => isset($snapshot['content_hash']) ? $snapshot['content_hash'] : '',
            'source_modified_gmt' => isset($snapshot['modified_gmt']) ? $snapshot['modified_gmt'] : '',
            'user_id' => absint($user_id),
            'audit' => $audit_data,
            'snapshot' => array(
                'content_hash' => isset($snapshot['content_hash']) ? $snapshot['content_hash'] : '',
                'modified_gmt' => isset($snapshot['modified_gmt']) ? $snapshot['modified_gmt'] : '',
            ),
            'candidate_post_id' => $candidate_post_id,
            'metadata' => array('candidate_post_id' => $candidate_post_id),
            'created_at' => current_time('mysql', true),
            'updated_at' => current_time('mysql', true),
            'last_error' => '',
            'post_id' => $candidate_post_id,
        );

        $jobs = $this->jobs();
        array_unshift($jobs, $job);
        $this->save_jobs(array_slice($jobs, 0, self::MAX_JOBS));

        if ($status === 'queued') {
            wp_schedule_single_event(time() + 1, self::ACTION, array($job['id']));
        } else {
            $this->record_candidate_metadata($source_post_id, $candidate_post_id, $job, $job['snapshot']);
        }

        $this->activity->log($status === 'queued' ? 'refresh_queued' : 'refresh_idempotent', array(
            'status' => $status,
            'job_id' => $job['id'],
            'source_post_id' => $source_post_id,
            'candidate_post_id' => $candidate_post_id,
        ));

        return $job;
    }

    public function process($job_id)
    {
        $job = $this->find($job_id);
        if (!$job || !in_array($job['status'], array('queued', 'retrying'), true)) {
            return;
        }

        if ($this->is_refresh_job($job)) {
            $this->process_refresh($job);
            return;
        }

        $job['status'] = 'processing';
        $job['attempts'] = absint($job['attempts']) + 1;
        $job['updated_at'] = current_time('mysql', true);
        $this->replace($job);

        try {
            $article = $this->generator->generate($job['brief'], array('temperature' => 0.2, 'max_tokens' => 8000));
            $post_id = $this->writer->create($article, $job['brief'], $job['user_id'], $this->settings->get()['model']);
            $this->maybe_attach_featured_image($post_id, $article, $job['brief']);
            $job['status'] = 'completed';
            $job['post_id'] = $post_id;
            $job['last_error'] = '';
            $job['updated_at'] = current_time('mysql', true);
            $this->replace($job);
            $this->activity->log('generation_completed', array('status' => 'completed', 'job_id' => $job['id'], 'post_id' => $post_id, 'title' => $article['title']));
        } catch (\Throwable $exception) {
            $job['last_error'] = sanitize_text_field($exception->getMessage());
            $job['updated_at'] = current_time('mysql', true);
            $transient = $this->is_transient_provider_error($job['last_error']);
            $max_attempts = $transient ? self::MAX_TRANSIENT_ATTEMPTS : self::MAX_ATTEMPTS;
            if ($job['attempts'] < $max_attempts) {
                $job['status'] = 'retrying';
                $this->replace($job);
                $delay = $transient ? min(600, 60 * (2 ** max(0, $job['attempts'] - 1))) : 60;
                wp_schedule_single_event(time() + $delay, self::ACTION, array($job['id']));
                $this->activity->log('generation_retrying', array('status' => 'queued', 'job_id' => $job['id'], 'attempt' => $job['attempts'], 'delay' => $delay));
            } else {
                $job['status'] = 'failed';
                $this->replace($job);
                $this->activity->log('generation_failed', array('status' => 'failed', 'job_id' => $job['id'], 'message' => $job['last_error']));
            }
        }
    }

    /**
     * Image generation is deliberately non-blocking for article creation: a
     * provider without an image model must not lose the completed text draft.
     *
     * @param int   $post_id
     * @param array $article
     * @param array $brief
     * @return void
     */
    private function maybe_attach_featured_image($post_id, array $article, array $brief)
    {
        if (empty($brief['featured_image']) || !$this->featured_image_generator || !method_exists($this->featured_image_generator, 'attach')) {
            return;
        }

        try {
            $attachment_id = $this->featured_image_generator->attach($post_id, $article, $brief, $this->settings->get()['model']);
            update_post_meta($post_id, '_zebracode_blog_ai_featured_image_status', 'completed');
            $this->activity->log('featured_image_completed', array('status' => 'completed', 'post_id' => $post_id, 'attachment_id' => $attachment_id));
        } catch (\Throwable $exception) {
            update_post_meta($post_id, '_zebracode_blog_ai_featured_image_status', 'failed');
            $this->activity->log('featured_image_failed', array('status' => 'failed', 'post_id' => $post_id, 'message' => sanitize_text_field($exception->getMessage())));
        }
    }

    public function counts()
    {
        $counts = array('queued' => 0, 'processing' => 0, 'retrying' => 0, 'completed' => 0, 'failed' => 0, 'stale' => 0);
        foreach ($this->jobs() as $job) {
            if (isset($counts[$job['status']])) {
                $counts[$job['status']]++;
            }
        }
        $counts['total'] = array_sum($counts);
        return $counts;
    }

    public function recent($limit = 20)
    {
        return array_slice($this->jobs(), 0, min(self::MAX_JOBS, max(1, absint($limit))));
    }

    private function find($job_id)
    {
        foreach ($this->jobs() as $job) {
            if ($job['id'] === sanitize_key((string) $job_id)) {
                return $job;
            }
        }
        return null;
    }

    /**
     * @param array $job
     * @return bool
     */
    private function is_refresh_job(array $job)
    {
        return (isset($job['mode']) && $job['mode'] === 'refresh') || (isset($job['type']) && $job['type'] === 'refresh');
    }

    /**
     * Process a refresh without changing the normal generation path above.
     *
     * @param array $job
     * @return void
     */
    private function process_refresh(array $job)
    {
        $job['status'] = 'processing';
        $job['attempts'] = absint(isset($job['attempts']) ? $job['attempts'] : 0) + 1;
        $job['updated_at'] = current_time('mysql', true);
        $this->replace($job);
        $this->activity->log('refresh_processing', array(
            'status' => 'processing',
            'job_id' => $job['id'],
            'source_post_id' => isset($job['source_post_id']) ? $job['source_post_id'] : 0,
            'attempt' => $job['attempts'],
        ));

        try {
            $source_post_id = absint(isset($job['source_post_id']) ? $job['source_post_id'] : 0);
            $source = get_post($source_post_id);
            if (!$this->is_generated_source($source, $source_post_id)) {
                $this->mark_refresh_stale($job, 'source_missing_or_not_generated');
                return;
            }

            $snapshot = $this->source_snapshot($source_post_id, $source);
            if (!$this->snapshot_matches($job, $snapshot)) {
                $this->mark_refresh_stale($job, 'source_changed');
                return;
            }

            $candidate_post_id = $this->candidate_id_from_job($job);
            if (!$candidate_post_id) {
                $candidate_post_id = $this->source_candidate_id($source_post_id, $snapshot);
            }
            if ($candidate_post_id && get_post($candidate_post_id)) {
                $job['status'] = 'completed';
                $job['candidate_post_id'] = $candidate_post_id;
                $job['post_id'] = $candidate_post_id;
                $job['last_error'] = '';
                $job['updated_at'] = current_time('mysql', true);
                $this->replace($job);
                $this->activity->log('refresh_idempotent', array(
                    'status' => 'completed',
                    'job_id' => $job['id'],
                    'source_post_id' => $source_post_id,
                    'candidate_post_id' => $candidate_post_id,
                ));
                return;
            }

            $source_payload = $this->source_payload($source, $source_post_id, $snapshot, $job);
            $audit = $this->resolve_refresh_audit($source_payload, $job);
            $source_payload['audit'] = is_array($audit) ? $audit : array();
            $source_payload = $this->protect_source($source_payload, $audit);
            $article = $this->generate_refresh_article($source_payload, $audit, $job);
            // A provider call can take long enough for an editor to modify the
            // source. Re-check before creating a candidate so that a late
            // response cannot be attached to a newer source revision.
            $latest_source = get_post($source_post_id);
            if (!$this->is_generated_source($latest_source, $source_post_id) || !$this->snapshot_matches($job, $this->source_snapshot($source_post_id, $latest_source))) {
                $this->mark_refresh_stale($job, 'source_changed_during_refresh');
                return;
            }
            $candidate_post_id = $this->write_refresh_candidate($article, $source_payload, $audit, $job);
            if (!$candidate_post_id) {
                throw new \RuntimeException('The refresh writer did not return a candidate post ID.');
            }

            $job['status'] = 'completed';
            $job['candidate_post_id'] = $candidate_post_id;
            $job['post_id'] = $candidate_post_id;
            $job['last_error'] = '';
            $job['updated_at'] = current_time('mysql', true);
            $this->replace($job);
            $this->record_candidate_metadata($source_post_id, $candidate_post_id, $job, $snapshot);
            $this->activity->log('refresh_completed', array(
                'status' => 'completed',
                'job_id' => $job['id'],
                'source_post_id' => $source_post_id,
                'candidate_post_id' => $candidate_post_id,
            ));
        } catch (\Throwable $exception) {
            $this->handle_refresh_failure($job, $exception);
        }
    }

    /**
     * @param array $job
     * @param string $reason
     * @return void
     */
    private function mark_refresh_stale(array $job, $reason)
    {
        $job['status'] = 'stale';
        $job['last_error'] = sanitize_text_field((string) $reason);
        $job['updated_at'] = current_time('mysql', true);
        $this->replace($job);
        $this->activity->log('refresh_stale', array(
            'status' => 'stale',
            'job_id' => $job['id'],
            'source_post_id' => isset($job['source_post_id']) ? $job['source_post_id'] : 0,
            'reason' => $reason,
        ));
    }

    /**
     * Keep the same retry and exponential transient backoff rules as normal
     * generation jobs, but use refresh-specific activity events.
     *
     * @param array     $job
     * @param \Throwable $exception
     * @return void
     */
    private function handle_refresh_failure(array $job, \Throwable $exception)
    {
        $job['last_error'] = sanitize_text_field($exception->getMessage());
        $job['updated_at'] = current_time('mysql', true);
        $transient = $this->is_transient_provider_error($job['last_error']);
        $max_attempts = $transient ? self::MAX_TRANSIENT_ATTEMPTS : self::MAX_ATTEMPTS;
        if ($job['attempts'] < $max_attempts) {
            $job['status'] = 'retrying';
            $this->replace($job);
            $delay = $transient ? min(600, 60 * (2 ** max(0, $job['attempts'] - 1))) : 60;
            wp_schedule_single_event(time() + $delay, self::ACTION, array($job['id']));
            $this->activity->log('refresh_retrying', array(
                'status' => 'queued',
                'job_id' => $job['id'],
                'source_post_id' => isset($job['source_post_id']) ? $job['source_post_id'] : 0,
                'attempt' => $job['attempts'],
                'delay' => $delay,
            ));
        } else {
            $job['status'] = 'failed';
            $this->replace($job);
            $this->activity->log('refresh_failed', array(
                'status' => 'failed',
                'job_id' => $job['id'],
                'source_post_id' => isset($job['source_post_id']) ? $job['source_post_id'] : 0,
                'message' => $job['last_error'],
            ));
        }
    }

    /**
     * @param int   $source_post_id
     * @param array $snapshot
     * @return array|null
     */
    private function find_refresh_job($source_post_id, array $snapshot)
    {
        foreach ($this->jobs() as $job) {
            if (!$this->is_refresh_job($job) || absint(isset($job['source_post_id']) ? $job['source_post_id'] : 0) !== $source_post_id) {
                continue;
            }
            if (!in_array(isset($job['status']) ? $job['status'] : '', array('queued', 'processing', 'retrying', 'completed'), true)) {
                continue;
            }
            if ($this->snapshot_matches($job, $snapshot)) {
                return $job;
            }
        }

        return null;
    }

    /**
     * @param int         $source_post_id
     * @param object|null $post
     * @return array
     */
    private function source_snapshot($source_post_id, $post = null)
    {
        $post = $post ?: get_post(absint($source_post_id));
        if (!$post || !is_object($post)) {
            return array('content_hash' => '', 'modified_gmt' => '');
        }

        $raw_content = isset($post->post_content) ? (string) $post->post_content : (string) get_post_field('post_content', $source_post_id, 'raw');
        $modified_gmt = isset($post->post_modified_gmt) ? (string) $post->post_modified_gmt : '';

        return array(
            'content_hash' => hash('sha256', $raw_content),
            'modified_gmt' => $modified_gmt,
        );
    }

    /**
     * @param mixed $post
     * @param int   $post_id
     * @return bool
     */
    private function is_generated_source($post, $post_id)
    {
        if (!$post || !is_object($post) || absint($post_id) < 1) {
            return false;
        }
        if (isset($post->post_type) && $post->post_type !== 'post') {
            return false;
        }

        return (bool) get_post_meta($post_id, DraftRepository::GENERATED_META_KEY, true);
    }

    /**
     * @param array $job
     * @param array $snapshot
     * @return bool
     */
    private function snapshot_matches(array $job, array $snapshot)
    {
        $stored_snapshot = isset($job['snapshot']) && is_array($job['snapshot']) ? $job['snapshot'] : array(
            'content_hash' => isset($job['source_content_hash']) ? $job['source_content_hash'] : '',
            'modified_gmt' => isset($job['source_modified_gmt']) ? $job['source_modified_gmt'] : '',
        );

        return isset($stored_snapshot['content_hash'], $stored_snapshot['modified_gmt'])
            && $stored_snapshot['content_hash'] !== ''
            && isset($snapshot['content_hash'], $snapshot['modified_gmt'])
            && hash_equals((string) $stored_snapshot['content_hash'], (string) $snapshot['content_hash'])
            && (string) $stored_snapshot['modified_gmt'] === (string) $snapshot['modified_gmt'];
    }

    /**
     * @param int   $source_post_id
     * @param array $snapshot
     * @return int
     */
    private function source_candidate_id($source_post_id, array $snapshot)
    {
        $candidate = absint(get_post_meta($source_post_id, self::REFRESH_CANDIDATE_META_KEY, true));
        if (!$candidate || $candidate === absint($source_post_id) || !get_post($candidate)) {
            return 0;
        }

        $stored_hash = (string) get_post_meta($source_post_id, self::REFRESH_SOURCE_HASH_META_KEY, true);
        $stored_modified = (string) get_post_meta($source_post_id, self::REFRESH_SOURCE_MODIFIED_META_KEY, true);
        if ($stored_hash !== '' && $stored_hash !== (string) $snapshot['content_hash']) {
            return 0;
        }
        if ($stored_modified !== '' && $stored_modified !== (string) $snapshot['modified_gmt']) {
            return 0;
        }

        return $candidate;
    }

    /**
     * @param array $job
     * @return int
     */
    private function candidate_id_from_job(array $job)
    {
        if (!empty($job['candidate_post_id'])) {
            return absint($job['candidate_post_id']);
        }
        if (!empty($job['metadata']['candidate_post_id'])) {
            return absint($job['metadata']['candidate_post_id']);
        }

        return 0;
    }

    /**
     * @param object $source
     * @param int    $source_post_id
     * @param array  $snapshot
     * @param array  $job
     * @return array
     */
    private function source_payload($source, $source_post_id, array $snapshot, array $job)
    {
        return array(
            'post_id' => absint($source_post_id),
            'title' => isset($source->post_title) ? (string) $source->post_title : '',
            'excerpt' => isset($source->post_excerpt) ? (string) $source->post_excerpt : '',
            'meta_description' => (string) get_post_meta($source_post_id, SEOAuditor::META_DESCRIPTION_KEY, true),
            'faq' => $this->source_faq($source_post_id),
            'content' => isset($source->post_content) ? (string) $source->post_content : '',
            'content_hash' => (string) $snapshot['content_hash'],
            'modified_gmt' => (string) $snapshot['modified_gmt'],
            'audit' => isset($job['audit']) && is_array($job['audit']) ? $job['audit'] : array(),
        );
    }

    /**
     * @param int $post_id
     * @return array
     */
    private function source_faq($post_id)
    {
        $raw = get_post_meta(absint($post_id), SEOAuditor::FAQ_META_KEY, true);
        if (is_array($raw)) {
            return $raw;
        }

        if (!is_string($raw) || trim($raw) === '') {
            return array();
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : array();
    }

    /**
     * @param array $source_payload
     * @param array $job
     * @return mixed
     */
    private function resolve_refresh_audit(array $source_payload, array $job)
    {
        if (!empty($job['audit']) && is_array($job['audit'])) {
            return $job['audit'];
        }
        if (!$this->refresh_audit) {
            return array();
        }

        return $this->invoke_first($this->refresh_audit, array('audit', 'inspect', 'review', 'analyze', 'run'), array($source_payload));
    }

    /**
     * @param array $source_payload
     * @param mixed $audit
     * @return array
     */
    private function protect_source(array $source_payload, $audit)
    {
        if (!$this->refresh_protector) {
            return $source_payload;
        }

        // RefreshGenerator owns the ContentProtector lifecycle and must see
        // raw source HTML so it can restore protected fragments after the
        // provider response passes the token audit.
        if ($this->refresh_protector instanceof ContentProtector) {
            return $source_payload;
        }

        $protected = $this->invoke_first($this->refresh_protector, array('assert_safe', 'protect', 'prepare', 'sanitize', 'validate', 'check'), array($source_payload, $audit));
        if (is_wp_error($protected)) {
            throw new \RuntimeException($protected->get_error_message());
        }
        if ($protected === false) {
            throw new \RuntimeException('The refresh protector rejected the source.');
        }
        if (is_array($protected)) {
            return array_merge($source_payload, $protected);
        }
        if (is_string($protected)) {
            $source_payload['content'] = $protected;
        }

        return $source_payload;
    }

    /**
     * @param array $source_payload
     * @param mixed $audit
     * @param array $job
     * @return array
     */
    private function generate_refresh_article(array $source_payload, $audit, array $job)
    {
        $options = array('temperature' => 0.2, 'max_tokens' => 8000, 'source_content_hash' => $source_payload['content_hash']);
        $generator = $this->refresh_generator ?: $this->generator;
        if (method_exists($generator, 'generate_refresh')) {
            return $this->invoke_method($generator, 'generate_refresh', array($source_payload, $audit, $options));
        }
        if (method_exists($generator, 'refresh')) {
            return $this->invoke_method($generator, 'refresh', array($source_payload, $audit, $options));
        }
        if ($this->refresh_generator && method_exists($generator, 'generate')) {
            return $this->invoke_method($generator, 'generate', array($source_payload, $audit, $options));
        }

        $brief = array(
            'topic' => $source_payload['title'],
            'brief' => $source_payload['content'],
            'source_post_id' => $source_payload['post_id'],
            'refresh' => true,
            'audit' => is_array($audit) ? $audit : array(),
        );

        return $this->invoke_method($generator, 'generate', array($brief, $options));
    }

    /**
     * @param array $article
     * @param array $source_payload
     * @param mixed $audit
     * @param array $job
     * @return int
     */
    private function write_refresh_candidate(array $article, array $source_payload, $audit, array $job)
    {
        $writer = $this->refresh_writer ?: $this->writer;
        if (method_exists($writer, 'create_candidate')) {
            $candidate = $this->invoke_method($writer, 'create_candidate', array($article, $source_payload, absint($job['user_id']), $this->settings->get()['model'], $job));
        } elseif (method_exists($writer, 'write_candidate')) {
            $candidate = $this->invoke_method($writer, 'write_candidate', array($article, $source_payload, absint($job['user_id']), $this->settings->get()['model'], $job));
        } elseif ($this->refresh_writer && method_exists($writer, 'create')) {
            $candidate = $this->invoke_method($writer, 'create', array($article, $source_payload, absint($job['user_id']), $this->settings->get()['model'], $job));
        } else {
            $brief = array(
                'topic' => $source_payload['title'],
                'brief' => $source_payload['content'],
                'source_post_id' => $source_payload['post_id'],
                'refresh' => true,
                'audit' => is_array($audit) ? $audit : array(),
            );
            $candidate = $this->invoke_method($writer, 'create', array($article, $brief, absint($job['user_id']), $this->settings->get()['model']));
        }

        if (is_array($candidate)) {
            $candidate = isset($candidate['candidate_post_id']) ? $candidate['candidate_post_id'] : (isset($candidate['post_id']) ? $candidate['post_id'] : 0);
        }
        if (is_wp_error($candidate)) {
            throw new \RuntimeException($candidate->get_error_message());
        }

        $candidate = absint($candidate);
        if ($candidate && $candidate === absint($source_payload['post_id'])) {
            throw new \RuntimeException('A refresh candidate must be a separate post from its source.');
        }

        return $candidate;
    }

    /**
     * @param int   $source_post_id
     * @param int   $candidate_post_id
     * @param array $job
     * @param array $snapshot
     * @return void
     */
    private function record_candidate_metadata($source_post_id, $candidate_post_id, array $job, array $snapshot)
    {
        if (!$candidate_post_id) {
            return;
        }

        update_post_meta($source_post_id, self::REFRESH_CANDIDATE_META_KEY, $candidate_post_id);
        update_post_meta($source_post_id, self::REFRESH_JOB_META_KEY, $job['id']);
        update_post_meta($source_post_id, self::REFRESH_SOURCE_HASH_META_KEY, $snapshot['content_hash']);
        update_post_meta($source_post_id, self::REFRESH_SOURCE_MODIFIED_META_KEY, $snapshot['modified_gmt']);
        update_post_meta($candidate_post_id, self::REFRESH_SOURCE_META_KEY, $source_post_id);
        update_post_meta($candidate_post_id, self::REFRESH_JOB_META_KEY, $job['id']);
        update_post_meta($candidate_post_id, self::REFRESH_SOURCE_HASH_META_KEY, $snapshot['content_hash']);
        update_post_meta($candidate_post_id, self::REFRESH_SOURCE_MODIFIED_META_KEY, $snapshot['modified_gmt']);
    }

    /**
     * @param mixed  $service
     * @param string $method
     * @param array  $args
     * @return mixed
     */
    private function invoke_method($service, $method, array $args)
    {
        if (!is_object($service) || !method_exists($service, $method)) {
            throw new \RuntimeException('The configured refresh service is unavailable.');
        }

        $reflection = new \ReflectionMethod($service, $method);
        if (!$reflection->isPublic()) {
            throw new \RuntimeException('The configured refresh service method is not public.');
        }
        if (!$reflection->isVariadic()) {
            $args = array_slice($args, 0, $reflection->getNumberOfParameters());
        }

        return call_user_func_array(array($service, $method), $args);
    }

    /**
     * @param mixed $service
     * @param array $methods
     * @param array $args
     * @return mixed
     */
    private function invoke_first($service, array $methods, array $args)
    {
        foreach ($methods as $method) {
            if (is_object($service) && method_exists($service, $method)) {
                return $this->invoke_method($service, $method, $args);
            }
        }
        if (is_callable($service)) {
            return call_user_func_array($service, $args);
        }

        return array();
    }

    private function replace(array $updated)
    {
        $jobs = $this->jobs();
        foreach ($jobs as $index => $job) {
            if ($job['id'] === $updated['id']) {
                $jobs[$index] = $updated;
                $this->save_jobs($jobs);
                return;
            }
        }
    }

    private function jobs()
    {
        $stored = get_option(self::OPTION_KEY, array());
        return is_array($stored) ? array_values(array_filter($stored, 'is_array')) : array();
    }

    private function save_jobs(array $jobs)
    {
        update_option(self::OPTION_KEY, $jobs, false);
    }

    private function is_transient_provider_error($message)
    {
        return (bool) preg_match('/HTTP\s+(408|429|500|502|503|504)|UNAVAILABLE|RESOURCE_EXHAUSTED|timed out|cURL error (6|7|28|35|52|56)/i', (string) $message);
    }
}
