<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Normalizes the model's article JSON into the plugin's stable article shape.
 */
final class ArticleValidator
{
    /**
     * @param mixed $article Decoded model response.
     * @return array
     * @throws \InvalidArgumentException When the article does not match the contract.
     */
    public static function normalize($article)
    {
        if (!is_array($article)) {
            throw new \InvalidArgumentException('The generated article must be a JSON object.');
        }

        $required = array(
            'title',
            'slug',
            'excerpt',
            'content',
            'category',
            'tags',
            'meta_description',
            'faq',
            'related_tools',
        );

        foreach ($required as $field) {
            if (!array_key_exists($field, $article)) {
                throw new \InvalidArgumentException(sprintf('The generated article is missing the "%s" field.', $field));
            }
        }

        $normalized = array(
            'title' => self::text($article['title'], 'title', 200),
            'slug' => self::slug($article['slug']),
            'excerpt' => self::text($article['excerpt'], 'excerpt', 500),
            'content' => self::content($article['content']),
            'category' => self::text($article['category'], 'category', 100),
            'tags' => self::tags($article['tags']),
            'meta_description' => self::text($article['meta_description'], 'meta_description', 320),
            'faq' => self::faq($article['faq']),
            'related_tools' => self::related_tools($article['related_tools']),
        );

        self::require_persian($normalized['title'], 'title');
        self::require_persian($normalized['excerpt'], 'excerpt');
        self::require_persian($normalized['content'], 'content');

        return $normalized;
    }

    /**
     * @param mixed $value
     * @return bool
     */
    public static function is_valid($value)
    {
        try {
            self::normalize($value);
        } catch (\InvalidArgumentException $exception) {
            return false;
        }

        return true;
    }

    /**
     * @param mixed $value
     * @param string $field
     * @param int $max_length
     * @return string
     */
    private static function text($value, $field, $max_length)
    {
        if (!is_string($value)) {
            throw new \InvalidArgumentException(sprintf('The generated article field "%s" must be text.', $field));
        }

        $value = trim((string) $value);

        if ($value === '') {
            throw new \InvalidArgumentException(sprintf('The generated article field "%s" cannot be empty.', $field));
        }

        if (function_exists('mb_strlen') && mb_strlen($value, 'UTF-8') > $max_length) {
            throw new \InvalidArgumentException(sprintf('The generated article field "%s" is too long.', $field));
        }

        if (!function_exists('mb_strlen') && strlen($value) > ($max_length * 4)) {
            throw new \InvalidArgumentException(sprintf('The generated article field "%s" is too long.', $field));
        }

        return $value;
    }

    /**
     * Normalize Markdown fallbacks before checking the Persian content.
     *
     * @param mixed $value
     * @return string
     */
    private static function content($value)
    {
        return ArticleFormatter::normalize(self::text($value, 'content', 200000));
    }

    /**
     * The editorial product is Persian-first. Technical identifiers may remain
     * Latin, but the primary article fields must contain Persian prose.
     *
     * @param string $value
     * @param string $field
     * @return void
     */
    private static function require_persian($value, $field)
    {
        if (!preg_match('/[\x{0600}-\x{06FF}]/u', $value)) {
            throw new \InvalidArgumentException(sprintf('The generated article field "%s" must contain Persian text.', $field));
        }
    }

    /**
     * @param mixed $value
     * @return string
     */
    private static function slug($value)
    {
        $slug = self::text($value, 'slug', 200);
        $sanitized = function_exists('sanitize_title') ? sanitize_title($slug) : '';

        if ($sanitized === '') {
            $sanitized = strtolower(trim((string) preg_replace('/[^a-zA-Z0-9]+/', '-', $slug), '-'));
        }

        if ($sanitized === '') {
            throw new \InvalidArgumentException('The generated article slug is invalid.');
        }

        return $sanitized;
    }

    /**
     * @param mixed $value
     * @return array
     */
    private static function tags($value)
    {
        if (is_string($value)) {
            $value = explode(',', $value);
        }

        if (!is_array($value)) {
            throw new \InvalidArgumentException('The generated article tags must be an array.');
        }

        $tags = array();
        foreach ($value as $tag) {
            if (!is_string($tag)) {
                throw new \InvalidArgumentException('Each generated article tag must be text.');
            }

            $tag = trim((string) $tag);
            if ($tag !== '' && !in_array($tag, $tags, true)) {
                $tags[] = $tag;
            }
        }

        if (count($tags) > 30) {
            throw new \InvalidArgumentException('The generated article has too many tags.');
        }

        return $tags;
    }

    /**
     * FAQ entries are normalized to arrays with question and answer keys.
     *
     * @param mixed $value
     * @return array
     */
    private static function faq($value)
    {
        if (!is_array($value)) {
            throw new \InvalidArgumentException('The generated article FAQ must be an array.');
        }

        $faq = array();
        foreach ($value as $entry) {
            if (!is_array($entry)) {
                throw new \InvalidArgumentException('Each generated FAQ item must be an object.');
            }

            $question = isset($entry['question']) ? $entry['question'] : '';
            $answer = isset($entry['answer']) ? $entry['answer'] : '';

            $faq[] = array(
                'question' => self::text($question, 'faq.question', 300),
                'answer' => self::text($answer, 'faq.answer', 5000),
            );
        }

        if (count($faq) > 20) {
            throw new \InvalidArgumentException('The generated article has too many FAQ items.');
        }

        return $faq;
    }

    /**
     * Related tools are stored as stable tool slugs.
     *
     * @param mixed $value
     * @return array
     */
    private static function related_tools($value)
    {
        if (!is_array($value)) {
            throw new \InvalidArgumentException('The generated related_tools field must be an array.');
        }

        $tools = array();
        foreach ($value as $tool) {
            if (is_array($tool)) {
                $tool = isset($tool['slug']) ? $tool['slug'] : '';
            }

            if (!is_string($tool)) {
                throw new \InvalidArgumentException('Each related tool must have a slug.');
            }

            $tool = trim((string) $tool);
            if ($tool === '') {
                throw new \InvalidArgumentException('Each related tool must have a slug.');
            }

            $tool_slug = function_exists('sanitize_title') ? sanitize_title($tool) : '';
            if ($tool_slug === '') {
                $tool_slug = strtolower(trim((string) preg_replace('/[^a-zA-Z0-9]+/', '-', $tool), '-'));
            }

            if ($tool_slug !== '' && !in_array($tool_slug, $tools, true)) {
                $tools[] = $tool_slug;
            }
        }

        if (count($tools) > 20) {
            throw new \InvalidArgumentException('The generated article has too many related tools.');
        }

        return $tools;
    }
}
