<?php

namespace ZebraCode\BlogAI\Contracts;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Storage contract for reusable article content templates.
 */
interface TemplateRepositoryInterface
{
    /**
     * Return normalized templates, optionally filtered by type or search term.
     *
     * @param array $args
     * @return array
     */
    public function get_templates($args = array());

    /**
     * Return one normalized template or null when it does not exist.
     *
     * @param string $id
     * @return array|null
     */
    public function get_template($id);

    /**
     * Create a template, or return a WP_Error for invalid input.
     *
     * @param array $template
     * @return array|\WP_Error
     */
    public function create_template(array $template);

    /**
     * Update a template, or return a WP_Error for invalid input.
     *
     * @param string $id
     * @param array $template
     * @return array|\WP_Error
     */
    public function update_template($id, array $template);

    /**
     * Delete a template. Missing IDs return false.
     *
     * @param string $id
     * @return bool
     */
    public function delete_template($id);
}
