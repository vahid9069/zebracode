<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Turns model output into readable, safe WordPress article blocks.
 *
 * The prompt asks for HTML, but providers occasionally return Markdown. This
 * formatter keeps that fallback usable without adding a Markdown dependency.
 */
final class ArticleFormatter
{
    /**
     * @param string $content
     * @return string
     */
    public static function normalize($content)
    {
        $content = trim((string) $content);
        if ($content === '') {
            return '';
        }

        $code_blocks = array();
        $content = preg_replace_callback('/```\s*([a-zA-Z0-9_+#.-]*)\s*\R(.*?)\R?```/s', static function ($matches) use (&$code_blocks) {
            $language = isset($matches[1]) ? strtolower(trim((string) $matches[1])) : '';
            $language = $language !== '' ? sanitize_html_class($language) : 'text';
            $token = '__ZEBRACODE_CODE_' . count($code_blocks) . '__';
            $code_blocks[$token] = '<pre dir="ltr"><code class="language-' . esc_attr($language) . '">' . esc_html(trim((string) $matches[2])) . '</code></pre>';
            return "\n" . $token . "\n";
        }, $content);

        if (!is_string($content)) {
            return '';
        }

        $has_html_blocks = (bool) preg_match('/<(?:p|h[1-6]|ul|ol|li|pre|table|blockquote|hr)\b/i', $content);
        if (!$has_html_blocks) {
            $content = self::markdown_blocks($content);
        }

        foreach ($code_blocks as $token => $html) {
            $content = str_replace($token, $html, $content);
        }

        return trim($content);
    }

    private static function markdown_blocks($content)
    {
        $lines = preg_split('/\r\n|\r|\n/', (string) $content);
        $output = array();
        $paragraph = array();
        $list_type = '';
        $list_items = array();

        $flush_paragraph = static function () use (&$output, &$paragraph) {
            if (!empty($paragraph)) {
                $text = implode(' ', $paragraph);
                $output[] = '<p>' . self::inline($text) . '</p>';
                $paragraph = array();
            }
        };

        $flush_list = static function () use (&$output, &$list_type, &$list_items) {
            if ($list_type !== '' && !empty($list_items)) {
                $items = array_map(static function ($item) {
                    return '<li>' . self::inline($item) . '</li>';
                }, $list_items);
                $output[] = '<' . $list_type . '>' . implode('', $items) . '</' . $list_type . '>';
            }
            $list_type = '';
            $list_items = array();
        };

        foreach ($lines as $line) {
            $line = trim((string) $line);
            if ($line === '') {
                $flush_paragraph();
                $flush_list();
                continue;
            }

            if (preg_match('/^###\s+(.+)$/u', $line, $match)) {
                $flush_paragraph();
                $flush_list();
                $output[] = '<h3>' . self::inline($match[1]) . '</h3>';
                continue;
            }

            if (preg_match('/^##?\s+(.+)$/u', $line, $match)) {
                $flush_paragraph();
                $flush_list();
                $output[] = '<h2>' . self::inline($match[1]) . '</h2>';
                continue;
            }

            if (preg_match('/^[-*•]\s+(.+)$/u', $line, $match)) {
                $flush_paragraph();
                if ($list_type !== 'ul') {
                    $flush_list();
                    $list_type = 'ul';
                }
                $list_items[] = $match[1];
                continue;
            }

            if (preg_match('/^\d+[.)]\s+(.+)$/u', $line, $match)) {
                $flush_paragraph();
                if ($list_type !== 'ol') {
                    $flush_list();
                    $list_type = 'ol';
                }
                $list_items[] = $match[1];
                continue;
            }

            $flush_list();
            $paragraph[] = $line;
        }

        $flush_paragraph();
        $flush_list();

        return implode('', $output);
    }

    private static function inline($value)
    {
        $value = esc_html(trim((string) $value));
        $value = preg_replace('/`([^`]+)`/u', '<code dir="ltr">$1</code>', $value);
        $value = preg_replace('/\*\*(.+?)\*\*/u', '<strong>$1</strong>', $value);
        $value = preg_replace('/__([^_]+?)__/u', '<strong>$1</strong>', $value);
        return is_string($value) ? $value : '';
    }
}
