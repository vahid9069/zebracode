<?php

namespace ZebraCode\BlogAI;

if (!defined('ABSPATH')) {
    exit;
}

use ZebraCode\BlogAI\Providers\GeminiProvider;
use ZebraCode\BlogAI\Providers\OpenAICompatibleProvider;

/**
 * Small service-provider registry that keeps model adapters replaceable.
 */
final class ProviderRegistry
{
    private $settings;
    private $factories = array();

    public function __construct(Settings $settings)
    {
        $this->settings = $settings;
        $this->register('openai-compatible', function () {
            return new OpenAICompatibleProvider($this->settings);
        });
        $this->register('gemini', function () {
            return new GeminiProvider($this->settings);
        });
    }

    public function register($id, callable $factory)
    {
        $this->factories[sanitize_key((string) $id)] = $factory;
    }

    public function make($id = '')
    {
        $id = sanitize_key((string) $id);
        if ($id === '') {
            $id = sanitize_key((string) $this->settings->get()['provider']);
        }

        if (!isset($this->factories[$id])) {
            throw new \RuntimeException('The requested AI provider is not registered.');
        }

        return call_user_func($this->factories[$id]);
    }

    public function ids()
    {
        return array_keys($this->factories);
    }
}
