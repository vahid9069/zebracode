<?php

namespace ZebraCode\BlogAI\Contracts;

if (!defined('ABSPATH')) {
    exit;
}

interface ContentGeneratorInterface
{
    /**
     * Generate and validate a structured article without publishing it.
     *
     * @param array $brief Article brief fields such as topic, audience, tone, and constraints.
     * @param array $options Provider/model options.
     * @return array Canonical article data.
     */
    public function generate(array $brief, array $options = array());
}
