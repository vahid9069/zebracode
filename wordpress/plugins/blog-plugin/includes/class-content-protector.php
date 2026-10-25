<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Protects editorially significant HTML while an article is sent to an AI
 * provider.
 *
 * Images, embeds, links, code, tables, Gutenberg blocks, and shortcodes are
 * replaced with opaque tokens. The token map is deliberately kept on this
 * instance so restoration can be made atomic: no fragment is restored unless
 * every token is present exactly once in the returned model content.
 */
final class ContentProtector
{
    const TOKEN_PREFIX = '__ZEBRACODE_PROTECTED_';

    /** @var array<string,string> */
    private $fragments = array();

    /** @var string */
    private $source = '';

    /** @var string */
    private $signature = '';

    /**
     * @param string $content Optional source content to protect immediately.
     */
    public function __construct($content = '')
    {
        if ($content !== '') {
            $this->protect($content);
        }
    }

    /**
     * Replace protected fragments with unique tokens.
     *
     * @param mixed $content Source HTML.
     * @return string HTML containing tokens instead of protected fragments.
     */
    public function protect($content)
    {
        if (!is_scalar($content) && $content !== null) {
            throw new \InvalidArgumentException('Protected content must be a scalar string.');
        }

        $this->source = (string) $content;
        $this->fragments = array();
        $this->signature = hash('sha256', $this->source);

        $protected = $this->source;

        // Gutenberg blocks and enclosing shortcodes must be handled first so
        // their inner markup cannot be replaced by separate tokens.
        $protected = $this->replace_pattern(
            '/<!--\s*wp:[^>]+-->.*?<!--\s*\/wp:[^>]+\s*-->/is',
            $protected
        );
        $protected = $this->replace_pattern(
            '/<!--\s*wp:[^>]+\/\s*-->/i',
            $protected
        );
        $protected = $this->replace_pattern(
            '/\[([A-Za-z][A-Za-z0-9_:-]*)(?:\s[^\]]*)?\].*?\[\/\1\]/is',
            $protected
        );
        $protected = $this->replace_pattern(
            '/\[[A-Za-z][A-Za-z0-9_:-]*(?:\s[^\]]*)?\/\]/i',
            $protected
        );
        $protected = $this->replace_pattern(
            '/\[[A-Za-z][A-Za-z0-9_:-]*(?:\s[^\]]*)?\]/i',
            $protected
        );

        // Protect outer containers before their standalone child elements.
        $protected = $this->replace_pattern(
            '~<(figure|picture|table|pre|video|audio|object|iframe|embed|blockquote|details|form)\b[^>]*>.*?</\1\s*>~is',
            $protected
        );
        $protected = $this->replace_pattern(
            '~<(a|code)\b[^>]*>.*?</\1\s*>|<(img|source|track|embed|hr|input)\b[^>]*/?>~is',
            $protected
        );

        return $protected;
    }

    /**
     * Restore protected fragments only after an exact token audit succeeds.
     *
     * @param mixed $content Model output containing the protected tokens.
     * @return string Restored HTML.
     * @throws \RuntimeException When a token is missing or appears more than once.
     */
    public function restore($content)
    {
        if (!is_scalar($content) && $content !== null) {
            throw new \InvalidArgumentException('Generated content must be a scalar string.');
        }

        $content = (string) $content;
        $invalid = array();
        foreach ($this->fragments as $token => $fragment) {
            if (substr_count($content, $token) !== 1) {
                $invalid[] = $token;
            }
        }

        if (!empty($invalid)) {
            throw new \RuntimeException('Protected content tokens were missing or duplicated; refusing to restore fragments.');
        }

        foreach ($this->fragments as $token => $fragment) {
            $content = str_replace($token, $fragment, $content);
        }

        return $content;
    }

    /**
     * Check whether every protected token is present exactly once.
     *
     * @param mixed $content Model output.
     * @return bool
     */
    public function can_restore($content)
    {
        if (!is_scalar($content) && $content !== null) {
            return false;
        }

        $content = (string) $content;
        foreach ($this->fragments as $token => $fragment) {
            if (substr_count($content, $token) !== 1) {
                return false;
            }
        }

        return true;
    }

    /**
     * Return the source HTML's SHA-256 signature.
     *
     * @return string
     */
    public function signature()
    {
        return $this->signature !== '' ? $this->signature : hash('sha256', $this->source);
    }

    /**
     * @return string
     */
    public function get_signature()
    {
        return $this->signature();
    }

    /**
     * @return string
     */
    public function getSignature()
    {
        return $this->signature();
    }

    /**
     * @param mixed $content
     * @return string
     */
    public function protect_content($content)
    {
        return $this->protect($content);
    }

    /**
     * @param mixed $content
     * @return string
     */
    public function restore_content($content)
    {
        return $this->restore($content);
    }

    /**
     * Return the generated token list for prompt construction and auditing.
     *
     * @return array<int,string>
     */
    public function tokens()
    {
        return array_keys($this->fragments);
    }

    /**
     * @return array<int,string>
     */
    public function get_tokens()
    {
        return $this->tokens();
    }

    /**
     * Return a copy of the token-to-fragment map.
     *
     * @return array<string,string>
     */
    public function fragments()
    {
        return $this->fragments;
    }

    /**
     * @param string $pattern
     * @param string $content
     * @return string
     */
    private function replace_pattern($pattern, $content)
    {
        $result = preg_replace_callback($pattern, function ($matches) {
            return $this->add_fragment($matches[0]);
        }, $content);

        return is_string($result) ? $result : $content;
    }

    /**
     * @param string $fragment
     * @return string
     */
    private function add_fragment($fragment)
    {
        $seed = substr(hash('sha256', $this->source . '|' . count($this->fragments)), 0, 16);
        $token = self::TOKEN_PREFIX . $seed . '_' . count($this->fragments) . '__';
        while (isset($this->fragments[$token]) || strpos($this->source, $token) !== false) {
            $token = self::TOKEN_PREFIX . substr(hash('sha256', $token . microtime(true)), 0, 20) . '__';
        }

        $this->fragments[$token] = $fragment;

        return $token;
    }
}
