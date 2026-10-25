<?php

namespace ZebraCode\BlogAI\Contracts;

if (!defined('ABSPATH')) {
    exit;
}

interface AIProviderInterface
{
    /**
     * Provider-neutral content generation method used by the modular core.
     *
     * @param array $messages
     * @param array $options
     * @return array
     */
    public function generateContent(array $messages, array $options = array());

    /**
     * Stream provider output and invoke the callback for every text chunk.
     *
     * @param array    $messages
     * @param array    $options
     * @param callable $on_chunk
     * @return array
     */
    public function streamContent(array $messages, array $options, callable $on_chunk);

    /**
     * Send a normalized chat request and return a normalized response.
     *
     * @param array $messages Chat messages in provider-neutral format.
     * @param array $options Provider/model options.
     * @return array{content:string,model:string,usage:array}
     */
    public function generate(array $messages, array $options = array());

    /**
     * Verify credentials and endpoint without generating content.
     *
     * @return array{model:string,models:int}
     */
    public function test_connection(array $overrides = array());

    /**
     * List models available to the configured provider credentials.
     *
     * @param array $overrides Optional endpoint and api_key values for this request.
     * @return array<int,array{id:string,name:string,label:string}>
     */
    public function list_models(array $overrides = array());
}
