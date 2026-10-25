<?php
namespace OmniAI\Providers;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Interface for AI service providers (Gemini, OpenAI, Claude, etc.)
 */
interface AI_Provider_Interface {
    /**
     * Unique identifier for the provider.
     */
    public function get_id(): string;

    /**
     * Human-readable name.
     */
    public function get_name(): string;

    /**
     * Check if provider has required credentials.
     */
    public function is_configured(): bool;

    /**
     * Get available models for this provider.
     *
     * @return array<string, string> Key is model slug, value is label.
     */
    public function get_supported_models(): array;

    /**
     * Synchronous content generation.
     *
     * @param string $prompt Prompt string.
     * @param array $options Model options (model, temperature, max_tokens, system_prompt, etc.)
     * @return array ['text' => string, 'tokens' => int, 'model' => string, 'provider' => string]
     * @throws \Exception On API error.
     */
    public function generate(string $prompt, array $options = []): array;

    /**
     * Streaming content generation via cURL and Server-Sent Events (SSE).
     *
     * @param string $prompt Prompt string.
     * @param array $options Model options.
     * @param callable|null $chunk_callback Optional callback called with each chunk string.
     * @return void
     * @throws \Exception On connection or authorization error.
     */
    public function stream(string $prompt, array $options = [], ?callable $chunk_callback = null): void;
}
