<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Deterministic, local SEO checks for a WordPress post.
 *
 * This service deliberately has no provider dependency. It reads the post,
 * its content, and the metadata written by this plugin, then returns the same
 * array shape for both valid and invalid post IDs.
 */
final class SEOAuditor
{
    const META_DESCRIPTION_KEY = '_zebracode_blog_ai_meta_description';
    const FAQ_META_KEY = '_zebracode_blog_ai_faq';

    /**
     * Audit one WordPress post.
     *
     * Passing an invalid ID does not throw. The returned error field and
     * zeroed checks allow an administrator screen to render the result safely.
     *
     * @param mixed $post_id WordPress post ID.
     * @return array
     */
    public function audit($post_id)
    {
        $post_id = absint($post_id);
        $post = $post_id > 0 && function_exists('get_post') ? get_post($post_id) : null;

        if (!is_object($post) || empty($post->ID)) {
            return $this->empty_result($post_id, 'The requested post could not be found.');
        }

        $title = $this->text(isset($post->post_title) ? $post->post_title : '');
        $excerpt = $this->text(isset($post->post_excerpt) ? $post->post_excerpt : '');
        $content = isset($post->post_content) ? (string) $post->post_content : '';
        $slug = $this->text(isset($post->post_name) ? $post->post_name : '');
        $headings = $this->headings($content);
        $links = $this->links($content);
        $faq = $this->faq($post_id);
        $checks = array(
            'title' => $this->title_check($title),
            'excerpt' => $this->excerpt_check($excerpt),
            'content' => $this->content_check($content),
            'headings' => $this->heading_check($headings),
            'links' => $this->link_check($links),
            'meta_description' => $this->meta_description_check($post_id),
            'faq' => $faq['check'],
            'slug' => $this->slug_check($slug),
            'answer_block' => $this->answer_block_check($content),
            'question_headings' => $this->question_heading_check($headings),
            'structure' => $this->structure_check($content),
        );

        $result = array(
            'ok' => true,
            'post_id' => $post_id,
            'error' => '',
            'title' => $checks['title'],
            'excerpt' => $checks['excerpt'],
            'content' => array_merge(
                $checks['content'],
                array('word_count' => $this->word_count($content))
            ),
            'headings' => array_merge(
                $checks['headings'],
                array(
                    'count' => $headings['count'],
                    'h1' => $headings['h1'],
                    'h2' => $headings['h2'],
                    'h3' => $headings['h3'],
                    'h4' => $headings['h4'],
                    'h5' => $headings['h5'],
                    'h6' => $headings['h6'],
                    'items' => $headings['items'],
                )
            ),
            'links' => array_merge(
                $checks['links'],
                array(
                    'items' => $links['items'],
                    'internal' => $links['internal'],
                    'external' => $links['external'],
                )
            ),
            'meta_description' => $checks['meta_description'],
            'faq' => array(
                'present' => $faq['present'],
                'valid' => $faq['valid'],
                'count' => $faq['count'],
                'items' => $faq['items'],
                'status' => $faq['check']['status'],
                'passed' => $faq['check']['passed'],
                'message' => $faq['check']['message'],
            ),
            'slug' => $checks['slug'],
            'answer_block' => $checks['answer_block'],
            'question_headings' => $checks['question_headings'],
            'structure' => $checks['structure'],
        );

        $result['summary'] = $this->summary($checks);
        $result['score'] = $result['summary']['score'];

        return $result;
    }

    /**
     * Snake-case alias for integrations using the plugin's older conventions.
     *
     * @param mixed $post_id
     * @return array
     */
    public function audit_post($post_id)
    {
        return $this->audit($post_id);
    }

    /**
     * Camel-case alias for integrations using service-style method names.
     *
     * @param mixed $post_id
     * @return array
     */
    public function auditPost($post_id)
    {
        return $this->audit($post_id);
    }

    /**
     * @param int $post_id
     * @param string $error
     * @return array
     */
    private function empty_result($post_id, $error)
    {
        $empty = array(
            'status' => 'fail',
            'passed' => false,
            'message' => 'Not checked.',
        );

        return array(
            'ok' => false,
            'post_id' => (int) $post_id,
            'error' => $this->text($error),
            'title' => array_merge($empty, array('text' => '', 'length' => 0)),
            'excerpt' => array_merge($empty, array('text' => '', 'length' => 0, 'present' => false)),
            'content' => array_merge($empty, array('word_count' => 0)),
            'headings' => array_merge($empty, array('count' => 0, 'h1' => 0, 'h2' => 0, 'h3' => 0, 'h4' => 0, 'h5' => 0, 'h6' => 0, 'items' => array())),
            'links' => array_merge($empty, array('count' => 0, 'internal' => 0, 'external' => 0, 'items' => array())),
            'meta_description' => array_merge($empty, array('text' => '', 'length' => 0, 'present' => false)),
            'faq' => array('present' => false, 'valid' => false, 'count' => 0, 'items' => array(), 'status' => 'fail', 'passed' => false, 'message' => 'Not checked.'),
            'slug' => array_merge($empty, array('value' => '', 'length' => 0, 'present' => false, 'valid' => false)),
            'answer_block' => $empty,
            'question_headings' => $empty,
            'structure' => $empty,
            'summary' => array(
                'score' => 0,
                'max_score' => 100,
                'percentage' => 0,
                'status' => 'fail',
                'passed' => false,
                'checks' => 0,
                'passed_checks' => 0,
                'warning_checks' => 0,
                'failed_checks' => 0,
                'message' => 'The post could not be audited.',
            ),
            'score' => 0,
        );
    }

    /**
     * Title target: 30-60 characters. 20-70 is a warning range.
     *
     * @param string $title
     * @return array
     */
    private function title_check($title)
    {
        $length = $this->length($title);

        if ($length >= 30 && $length <= 60) {
            return $this->check($title, $length, 'pass', true, __('Title length is within the recommended range.', 'zebracode-blog-ai'));
        }
        if ($length >= 20 && $length <= 70) {
            return $this->check($title, $length, 'warning', false, __('Title is usable, but its length is outside the recommended range.', 'zebracode-blog-ai'));
        }

        return $this->check($title, $length, 'fail', false, __('Title should be between 30 and 60 characters.', 'zebracode-blog-ai'));
    }

    /**
     * Excerpt target: 40-160 characters. 20-240 is a warning range.
     *
     * @param string $excerpt
     * @return array
     */
    private function excerpt_check($excerpt)
    {
        $length = $this->length($excerpt);

        if ($length >= 40 && $length <= 160) {
            $status = 'pass';
            $passed = true;
            $message = __('Excerpt is present and within the recommended range.', 'zebracode-blog-ai');
        } elseif ($length >= 20 && $length <= 240) {
            $status = 'warning';
            $passed = false;
            $message = __('Excerpt is present, but its length is outside the recommended range.', 'zebracode-blog-ai');
        } else {
            $status = 'fail';
            $passed = false;
            $message = __('Add an excerpt between 40 and 160 characters.', 'zebracode-blog-ai');
        }

        return array(
            'text' => $excerpt,
            'length' => $length,
            'present' => $length > 0,
            'status' => $status,
            'passed' => $passed,
            'message' => $message,
        );
    }

    /**
     * Content target: at least 300 words. 150-299 is a warning.
     *
     * @param string $content
     * @return array
     */
    private function content_check($content)
    {
        $count = $this->word_count($content);
        if ($count >= 300) {
            return array('status' => 'pass', 'passed' => true, 'message' => __('Content has at least 300 words.', 'zebracode-blog-ai'));
        }
        if ($count >= 150) {
            return array('status' => 'warning', 'passed' => false, 'message' => __('Content is readable, but has fewer than 300 words.', 'zebracode-blog-ai'));
        }

        return array('status' => 'fail', 'passed' => false, 'message' => __('Content should contain at least 150 words.', 'zebracode-blog-ai'));
    }

    /**
     * @param array $headings
     * @return array
     */
    private function heading_check($headings)
    {
        if ($headings['count'] === 0) {
            return array('status' => 'fail', 'passed' => false, 'message' => __('Add at least one heading to structure the content.', 'zebracode-blog-ai'));
        }
        if ($headings['h1'] > 1 || $headings['h2'] === 0) {
            return array('status' => 'warning', 'passed' => false, 'message' => __('Use headings with one optional H1 and at least one H2.', 'zebracode-blog-ai'));
        }

        return array('status' => 'pass', 'passed' => true, 'message' => __('Heading structure includes an H2 and does not repeat H1.', 'zebracode-blog-ai'));
    }

    /**
     * @param array $links
     * @return array
     */
    private function link_check($links)
    {
        if ($links['count'] === 0) {
            return array('status' => 'fail', 'passed' => false, 'message' => __('Add at least one link to a relevant resource.', 'zebracode-blog-ai'));
        }
        if ($links['internal'] === 0) {
            return array('status' => 'warning', 'passed' => false, 'message' => __('Add at least one internal link.', 'zebracode-blog-ai'));
        }

        return array('status' => 'pass', 'passed' => true, 'message' => __('Content includes an internal link.', 'zebracode-blog-ai'));
    }

    /**
     * AEO check: the first paragraph should answer the main question directly.
     *
     * @param string $content
     * @return array
     */
    private function answer_block_check($content)
    {
        $first = '';
        if (preg_match('/<p(?:\s[^>]*)?>(.*?)<\/p\s*>/is', $content, $match)) {
            $first = $this->text($match[1]);
        }

        $words = $this->word_count($first);
        if ($words >= 35 && $words <= 90) {
            return array('status' => 'pass', 'passed' => true, 'word_count' => $words, 'message' => __('The first paragraph is a concise, quote-ready direct answer.', 'zebracode-blog-ai'));
        }
        if ($words >= 20 && $words <= 120) {
            return array('status' => 'warning', 'passed' => false, 'word_count' => $words, 'message' => __('The first paragraph is present but should be closer to a concise direct answer.', 'zebracode-blog-ai'));
        }

        return array('status' => 'fail', 'passed' => false, 'word_count' => $words, 'message' => __('Start the article with a self-contained direct answer of roughly 40-70 words.', 'zebracode-blog-ai'));
    }

    /**
     * GEO/AEO check: question headings improve retrieval and answer extraction.
     *
     * @param array $headings
     * @return array
     */
    private function question_heading_check($headings)
    {
        $count = 0;
        foreach ((array) $headings['items'] as $item) {
            $text = isset($item['text']) ? trim((string) $item['text']) : '';
            if (preg_match('/\?|؟|^(چگونه|چرا|چیست|کدام|آیا|چه زمانی|چه تفاوتی|how|why|what|when)\b/iu', $text)) {
                $count++;
            }
        }

        if ($count >= 2) {
            return array('status' => 'pass', 'passed' => true, 'count' => $count, 'message' => __('The article has question-shaped headings that support answer extraction.', 'zebracode-blog-ai'));
        }
        if ($count === 1) {
            return array('status' => 'warning', 'passed' => false, 'count' => $count, 'message' => __('Add another natural question heading where it helps the reader.', 'zebracode-blog-ai'));
        }

        return array('status' => 'warning', 'passed' => false, 'count' => 0, 'message' => __('Use question-shaped headings for the main questions when appropriate.', 'zebracode-blog-ai'));
    }

    /**
     * Check that the article is scannable instead of being only paragraphs.
     *
     * @param string $content
     * @return array
     */
    private function structure_check($content)
    {
        $has_list = preg_match('/<(?:ul|ol)\b/i', $content) === 1;
        $has_code_or_table = preg_match('/<(?:pre|table)\b/i', $content) === 1;

        if ($has_list && $has_code_or_table) {
            return array('status' => 'pass', 'passed' => true, 'message' => __('The article uses scannable lists and a technical structure block.', 'zebracode-blog-ai'));
        }
        if ($has_list || $has_code_or_table) {
            return array('status' => 'warning', 'passed' => false, 'message' => __('Add a list and, when relevant, a code block or comparison table.', 'zebracode-blog-ai'));
        }

        return array('status' => 'warning', 'passed' => false, 'message' => __('Break the article into lists, steps, code blocks, or a truthful comparison table where useful.', 'zebracode-blog-ai'));
    }

    /**
     * @param int $post_id
     * @return array
     */
    private function meta_description_check($post_id)
    {
        $value = $this->meta($post_id, self::META_DESCRIPTION_KEY);
        $length = $this->length($value);

        if ($length >= 120 && $length <= 160) {
            $status = 'pass';
            $passed = true;
            $message = __('Meta description is present and within the recommended range.', 'zebracode-blog-ai');
        } elseif ($length >= 80 && $length <= 180) {
            $status = 'warning';
            $passed = false;
            $message = __('Meta description is present, but its length is outside the recommended range.', 'zebracode-blog-ai');
        } else {
            $status = 'fail';
            $passed = false;
            $message = __('Add a meta description between 120 and 160 characters.', 'zebracode-blog-ai');
        }

        return array(
            'text' => $value,
            'length' => $length,
            'present' => $length > 0,
            'status' => $status,
            'passed' => $passed,
            'message' => $message,
        );
    }

    /**
     * @param string $slug
     * @return array
     */
    private function slug_check($slug)
    {
        $length = $this->length($slug);
        $valid = $slug !== '' && $length <= 75 && preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) === 1;

        if (!$valid) {
            return array('value' => $slug, 'length' => $length, 'present' => $slug !== '', 'valid' => false, 'status' => 'fail', 'passed' => false, 'message' => __('Use a non-empty lowercase slug with words separated by hyphens.', 'zebracode-blog-ai'));
        }
        if ($length > 60) {
            return array('value' => $slug, 'length' => $length, 'present' => true, 'valid' => true, 'status' => 'warning', 'passed' => false, 'message' => __('Slug is valid, but shorter slugs are easier to scan.', 'zebracode-blog-ai'));
        }

        return array('value' => $slug, 'length' => $length, 'present' => true, 'valid' => true, 'status' => 'pass', 'passed' => true, 'message' => __('Slug is present and readable.', 'zebracode-blog-ai'));
    }

    /**
     * @param array $checks
     * @return array
     */
    private function summary($checks)
    {
        $passed = 0;
        $warnings = 0;
        $failed = 0;

        foreach ($checks as $check) {
            if ($check['status'] === 'pass') {
                $passed++;
            } elseif ($check['status'] === 'warning') {
                $warnings++;
            } else {
                $failed++;
            }
        }

        $total = count($checks);
        $score = $total > 0 ? (int) round((($passed + ($warnings * 0.5)) / $total) * 100) : 0;
        $status = $score >= 80 ? 'pass' : ($score >= 50 ? 'warning' : 'fail');

        return array(
            'score' => $score,
            'max_score' => 100,
            'percentage' => $score,
            'status' => $status,
            'passed' => $status === 'pass',
            'checks' => $total,
            'passed_checks' => $passed,
            'warning_checks' => $warnings,
            'failed_checks' => $failed,
            'message' => sprintf('%d of %d checks passed.', $passed, $total),
        );
    }

    /**
     * @param string $value
     * @param int $length
     * @param string $status
     * @param bool $passed
     * @param string $message
     * @return array
     */
    private function check($value, $length, $status, $passed, $message)
    {
        return array(
            'text' => $value,
            'length' => $length,
            'status' => $status,
            'passed' => $passed,
            'message' => $message,
        );
    }

    /**
     * @param string $content
     * @return array
     */
    private function headings($content)
    {
        $items = array();
        $counts = array(1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0, 6 => 0);
        $matched = preg_match_all('/<h([1-6])(?:\s[^>]*)?>(.*?)<\/h\1\s*>/is', $content, $matches, PREG_SET_ORDER);

        if ($matched) {
            foreach ($matches as $match) {
                $level = (int) $match[1];
                $text = $this->text($match[2]);
                $counts[$level]++;
                $items[] = array('level' => $level, 'text' => $text);
            }
        }

        return array(
            'count' => count($items),
            'h1' => $counts[1],
            'h2' => $counts[2],
            'h3' => $counts[3],
            'h4' => $counts[4],
            'h5' => $counts[5],
            'h6' => $counts[6],
            'items' => $items,
        );
    }

    /**
     * @param string $content
     * @return array
     */
    private function links($content)
    {
        $items = array();
        $internal = 0;
        $external = 0;
        $matched = preg_match_all('/<a\b[^>]*\bhref\s*=\s*(["\'])(.*?)\1[^>]*>(.*?)<\/a\s*>/is', $content, $matches, PREG_SET_ORDER);

        if ($matched) {
            foreach ($matches as $match) {
                $url = $this->text($match[2]);
                $type = $this->is_internal_url($url) ? 'internal' : 'external';
                if ($type === 'internal') {
                    $internal++;
                } else {
                    $external++;
                }

                if (count($items) < 100) {
                    $items[] = array(
                        'url' => function_exists('esc_url_raw') ? esc_url_raw($url) : $url,
                        'text' => $this->text($match[3]),
                        'type' => $type,
                    );
                }
            }
        }

        return array('count' => $internal + $external, 'internal' => $internal, 'external' => $external, 'items' => $items);
    }

    /**
     * @param string $url
     * @return bool
     */
    private function is_internal_url($url)
    {
        if ($url === '' || strpos($url, '#') === 0 || (strpos($url, '/') === 0 && strpos($url, '//') !== 0)) {
            return true;
        }
        if (preg_match('/^(mailto|tel|javascript):/i', $url)) {
            return false;
        }

        $parts = parse_url($url);
        if (!is_array($parts) || empty($parts['host'])) {
            return true;
        }

        $home = function_exists('home_url') ? parse_url(home_url('/')) : array();
        return is_array($home) && !empty($home['host']) && strtolower($parts['host']) === strtolower($home['host']);
    }

    /**
     * @param int $post_id
     * @return array
     */
    private function faq($post_id)
    {
        $raw = $this->raw_meta($post_id, self::FAQ_META_KEY);
        $present = !($raw === '' || $raw === null || (is_array($raw) && empty($raw)));
        $decoded = $raw;

        if (is_string($decoded)) {
            $decoded = function_exists('wp_json_decode') ? wp_json_decode($decoded, true) : json_decode($decoded, true);
        }

        $valid = is_array($decoded);
        $items = array();
        if ($valid) {
            foreach ($decoded as $entry) {
                if (!is_array($entry) || !isset($entry['question']) || !isset($entry['answer'])) {
                    $valid = false;
                    continue;
                }

                $question = $this->text($entry['question']);
                $answer = $this->text($entry['answer']);
                if ($question === '' || $answer === '') {
                    $valid = false;
                    continue;
                }
                if (count($items) < 50) {
                    $items[] = array('question' => $question, 'answer' => $answer);
                }
            }
        }

        if (!$present) {
            $check = array('status' => 'warning', 'passed' => false, 'message' => 'No FAQ metadata was found.');
        } elseif (!$valid) {
            $check = array('status' => 'fail', 'passed' => false, 'message' => 'FAQ metadata is not a valid list of questions and answers.');
        } elseif (count($items) === 0) {
            $check = array('status' => 'warning', 'passed' => false, 'message' => 'FAQ metadata is present but contains no entries.');
        } else {
            $check = array('status' => 'pass', 'passed' => true, 'message' => 'FAQ metadata contains valid question and answer entries.');
        }

        return array('present' => $present, 'valid' => $valid, 'count' => count($items), 'items' => $items, 'check' => $check);
    }

    /**
     * @param int $post_id
     * @param string $key
     * @return string
     */
    private function meta($post_id, $key)
    {
        $value = $this->raw_meta($post_id, $key);
        return is_scalar($value) ? $this->text((string) $value) : '';
    }

    /**
     * Read metadata without coercing an array FAQ value to text.
     *
     * @param int $post_id
     * @param string $key
     * @return mixed
     */
    private function raw_meta($post_id, $key)
    {
        if (!function_exists('get_post_meta')) {
            return '';
        }

        return get_post_meta($post_id, $key, true);
    }

    /**
     * @param string $content
     * @return int
     */
    private function word_count($content)
    {
        if (function_exists('strip_shortcodes')) {
            $content = strip_shortcodes($content);
        }
        $content = $this->text($content);
        if ($content === '') {
            return 0;
        }

        $matched = preg_match_all('/[\p{L}\p{N}]+(?:[\'’\-][\p{L}\p{N}]+)*/u', $content, $matches);
        if ($matched !== false) {
            return (int) $matched;
        }

        return str_word_count($content);
    }

    /**
     * @param mixed $value
     * @return string
     */
    private function text($value)
    {
        if (!is_scalar($value)) {
            return '';
        }

        $value = (string) $value;
        if (function_exists('wp_strip_all_tags')) {
            $value = wp_strip_all_tags($value);
        } else {
            $value = strip_tags($value);
        }
        $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');
        $value = strip_tags($value);

        $normalized = preg_replace('/\s+/u', ' ', $value);

        return trim($normalized !== false ? $normalized : $value);
    }

    /**
     * @param string $value
     * @return int
     */
    private function length($value)
    {
        if (function_exists('mb_strlen')) {
            return (int) mb_strlen($value, 'UTF-8');
        }

        return (int) strlen($value);
    }
}
