<?php

namespace ZebraCode\BlogAI;

use ZebraCode\BlogAI\Contracts\TemplateRepositoryInterface;

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/contracts/interface-template-repository.php';

/**
 * Option-backed storage for reusable article content templates.
 *
 * Templates contain editorial guidance only. Provider credentials and other
 * settings are deliberately not part of this option or this data contract.
 */
final class TemplateRepository implements TemplateRepositoryInterface
{
    const OPTION_KEY = 'zebracode_blog_ai_templates';
    const MAX_TEMPLATES = 100;
    const MAX_ID_LENGTH = 80;
    const MAX_TYPE_LENGTH = 60;
    const MAX_TITLE_LENGTH = 120;
    const MAX_DESCRIPTION_LENGTH = 500;
    const MAX_PROMPT_LENGTH = 4000;
    const MAX_BRIEF_LENGTH = 4000;
    const MAX_FIELD_LENGTH = 500;
    const MAX_SECTION_LENGTH = 160;
    const MAX_SECTIONS = 20;

    /**
     * Return the built-in templates used when the option has not been saved.
     *
     * @return array
     */
    public static function defaults()
    {
        return array(
            array(
                'id' => 'technical-guide',
                'slug' => 'technical-guide',
                'title' => 'Technical guide',
                'type' => 'technical-guide',
                'description' => 'A problem-first developer guide with practical examples and a clear path to the result.',
                'prompt' => 'Explain the problem, show a safe implementation path, call out common mistakes, and close with a concise verification checklist.',
                'sections' => array(
                    'Problem and expected outcome',
                    'Key concepts and constraints',
                    'Step-by-step implementation',
                    'Working example',
                    'Common mistakes',
                    'Verification checklist',
                    'FAQ',
                    'Related ZebraCode tool',
                ),
                'defaults' => array(
                    'topic' => '',
                    'primary_keyword' => '',
                    'secondary_keywords' => '',
                    'category' => 'Development',
                    'audience' => 'Intermediate',
                    'tone' => 'Technical and precise',
                    'brief' => 'Focus on a concrete developer problem. Include a reproducible example, explain why the solution works, and mention relevant edge cases.',
                    'faq' => true,
                    'seo' => true,
                    'links' => true,
                    'social' => false,
                ),
                'is_default' => true,
                'created_at' => '',
                'updated_at' => '',
            ),
            array(
                'id' => 'tool-guide',
                'slug' => 'tool-guide',
                'title' => 'Tool guide',
                'type' => 'tool-guide',
                'description' => 'A focused guide that helps readers use a developer tool with confidence.',
                'prompt' => 'Describe the input, output, privacy boundary, and a small real-world example. Keep instructions easy to follow and explain how to validate the result.',
                'sections' => array(
                    'What the tool does',
                    'When to use it',
                    'Input and expected output',
                    'Worked example',
                    'Privacy and limitations',
                    'FAQ',
                ),
                'defaults' => array(
                    'topic' => '',
                    'primary_keyword' => '',
                    'secondary_keywords' => '',
                    'category' => 'Development',
                    'audience' => 'Beginner',
                    'tone' => 'Clear and practical',
                    'brief' => 'Show a small input-to-output example. Explain what stays in the browser or server, identify limitations, and give the reader a way to verify the result.',
                    'faq' => true,
                    'seo' => true,
                    'links' => true,
                    'social' => false,
                ),
                'is_default' => true,
                'created_at' => '',
                'updated_at' => '',
            ),
            array(
                'id' => 'comparison',
                'slug' => 'comparison',
                'title' => 'Comparison',
                'type' => 'comparison',
                'description' => 'A decision-oriented comparison that makes trade-offs and use cases easy to scan.',
                'prompt' => 'Compare the approaches by use case, trade-offs, implementation effort, maintenance, and a final decision checklist. Avoid declaring a universal winner.',
                'sections' => array(
                    'Decision context',
                    'Approach one overview',
                    'Approach two overview',
                    'Use-case comparison',
                    'Trade-offs and implementation effort',
                    'Decision checklist',
                    'FAQ',
                ),
                'defaults' => array(
                    'topic' => '',
                    'primary_keyword' => '',
                    'secondary_keywords' => '',
                    'category' => 'Development',
                    'audience' => 'Intermediate',
                    'tone' => 'Technical and precise',
                    'brief' => 'Compare the options using explicit criteria and representative use cases. State where each option is a good fit and where it introduces cost or complexity.',
                    'faq' => true,
                    'seo' => true,
                    'links' => true,
                    'social' => false,
                ),
                'is_default' => true,
                'created_at' => '',
                'updated_at' => '',
            ),
        );
    }

    /**
     * Return normalized templates, with optional type/search/limit/offset filters.
     *
     * @param array $args
     * @return array
     */
    public function get_templates($args = array())
    {
        $args = is_array($args) ? $args : array();
        $templates = $this->read_templates();
        $type = isset($args['type']) && !is_array($args['type']) ? sanitize_key((string) $args['type']) : '';
        $search = isset($args['search']) && !is_array($args['search']) ? strtolower(trim((string) $args['search'])) : '';
        $filtered = array();

        foreach ($templates as $template) {
            if ($type !== '' && $template['type'] !== $type) {
                continue;
            }

            if ($search !== '') {
                $haystack = strtolower($template['id'] . ' ' . $template['slug'] . ' ' . $template['title'] . ' ' . $template['description']);
                if (strpos($haystack, $search) === false) {
                    continue;
                }
            }

            $filtered[] = $template;
        }

        $offset = isset($args['offset']) ? max(0, absint($args['offset'])) : 0;
        $limit = isset($args['limit']) ? absint($args['limit']) : self::MAX_TEMPLATES;
        $limit = min(self::MAX_TEMPLATES, max(1, $limit));

        return array_values(array_slice($filtered, $offset, $limit));
    }

    /**
     * CamelCase alias for integrations that expose getTemplates().
     *
     * @param array $args
     * @return array
     */
    public function getTemplates($args = array())
    {
        return $this->get_templates($args);
    }

    /**
     * Alias for integrations that use a list-oriented method name.
     *
     * @param array $args
     * @return array
     */
    public function list_templates($args = array())
    {
        return $this->get_templates($args);
    }

    /**
     * CamelCase alias for integrations that expose listTemplates().
     *
     * @param array $args
     * @return array
     */
    public function listTemplates($args = array())
    {
        return $this->get_templates($args);
    }

    /**
     * Alias for integrations that use all().
     *
     * @param array $args
     * @return array
     */
    public function all($args = array())
    {
        return $this->get_templates($args);
    }

    /**
     * Return one normalized template or null when it does not exist.
     *
     * @param string $id
     * @return array|null
     */
    public function get_template($id)
    {
        $id = $this->normalize_id($id);
        if ($id === '') {
            return null;
        }

        foreach ($this->read_templates() as $template) {
            if ($template['id'] === $id || $template['slug'] === $id) {
                return $template;
            }
        }

        return null;
    }

    /**
     * Alias for integrations that use get().
     *
     * @param string $id
     * @return array|null
     */
    public function get($id)
    {
        return $this->get_template($id);
    }

    /**
     * CamelCase alias for integrations that expose getTemplate().
     *
     * @param string $id
     * @return array|null
     */
    public function getTemplate($id)
    {
        return $this->get_template($id);
    }

    /**
     * Create a template and persist it in the WordPress option.
     *
     * @param array $template
     * @return array|\WP_Error
     */
    public function create_template(array $template)
    {
        $templates = $this->read_templates();
        if (count($templates) >= self::MAX_TEMPLATES) {
            return $this->error('template_limit', 'The maximum number of templates has been reached.');
        }

        $normalized = $this->normalize_template($template, false);
        if (is_wp_error($normalized)) {
            return $normalized;
        }

        foreach ($templates as $existing) {
            if ($existing['id'] === $normalized['id'] || $existing['slug'] === $normalized['slug']) {
                return $this->error('template_exists', 'A template with this ID or slug already exists.');
            }
        }

        $templates[] = $normalized;
        $this->write_templates($templates);

        return $normalized;
    }

    /**
     * Alias for integrations that use create().
     *
     * @param array $template
     * @return array|\WP_Error
     */
    public function create(array $template)
    {
        return $this->create_template($template);
    }

    /**
     * CamelCase alias for integrations that expose createTemplate().
     *
     * @param array $template
     * @return array|\WP_Error
     */
    public function createTemplate(array $template)
    {
        return $this->create_template($template);
    }

    /**
     * Update an existing template while keeping its stable ID.
     *
     * @param string $id
     * @param array $template
     * @return array|\WP_Error
     */
    public function update_template($id, array $template)
    {
        $id = $this->normalize_id($id);
        if ($id === '') {
            return $this->error('template_not_found', 'The template could not be found.');
        }

        $templates = $this->read_templates();
        foreach ($templates as $index => $existing) {
            if ($existing['id'] !== $id) {
                continue;
            }

            $candidate = array_merge($existing, $template, array('id' => $existing['id'], 'is_default' => $existing['is_default']));
            $normalized = $this->normalize_template($candidate, true, $existing);
            if (is_wp_error($normalized)) {
                return $normalized;
            }

            foreach ($templates as $other_index => $other) {
                if ($other_index !== $index && ($other['id'] === $normalized['id'] || $other['slug'] === $normalized['slug'])) {
                    return $this->error('template_exists', 'A template with this ID or slug already exists.');
                }
            }

            $templates[$index] = $normalized;
            $this->write_templates($templates);

            return $normalized;
        }

        return $this->error('template_not_found', 'The template could not be found.');
    }

    /**
     * Alias for integrations that use update().
     *
     * @param string $id
     * @param array $template
     * @return array|\WP_Error
     */
    public function update($id, array $template)
    {
        return $this->update_template($id, $template);
    }

    /**
     * CamelCase alias for integrations that expose updateTemplate().
     *
     * @param string $id
     * @param array $template
     * @return array|\WP_Error
     */
    public function updateTemplate($id, array $template)
    {
        return $this->update_template($id, $template);
    }

    /**
     * Delete a template by ID. Deleting a missing template is a no-op.
     *
     * @param string $id
     * @return bool
     */
    public function delete_template($id)
    {
        $id = $this->normalize_id($id);
        if ($id === '') {
            return false;
        }

        $templates = $this->read_templates();
        $remaining = array();
        $deleted = false;

        foreach ($templates as $template) {
            if ($template['id'] === $id) {
                $deleted = true;
                continue;
            }

            $remaining[] = $template;
        }

        if (!$deleted) {
            return false;
        }

        $this->write_templates($remaining);

        return true;
    }

    /**
     * Alias for integrations that use delete().
     *
     * @param string $id
     * @return bool
     */
    public function delete($id)
    {
        return $this->delete_template($id);
    }

    /**
     * CamelCase alias for integrations that expose deleteTemplate().
     *
     * @param string $id
     * @return bool
     */
    public function deleteTemplate($id)
    {
        return $this->delete_template($id);
    }

    /**
     * Read and normalize the option, falling back to safe built-ins.
     *
     * @return array
     */
    private function read_templates()
    {
        $stored = get_option(self::OPTION_KEY, null);
        if ($stored === null || $stored === false) {
            return $this->normalize_stored_templates(self::defaults());
        }

        // An explicitly saved empty array means the administrator deleted all
        // templates; it must not silently re-seed the built-ins.
        if (is_array($stored) && empty($stored)) {
            return array();
        }

        if (!is_array($stored)) {
            return $this->normalize_stored_templates(self::defaults());
        }

        // Accept an envelope so a future option version can add metadata
        // without changing the public repository methods.
        $is_envelope = isset($stored['templates']) && is_array($stored['templates']);
        if ($is_envelope) {
            $stored = $stored['templates'];
        }

        if ($is_envelope && empty($stored)) {
            return array();
        }

        $templates = $this->normalize_stored_templates($stored);
        return $templates ? $templates : $this->normalize_stored_templates(self::defaults());
    }

    /**
     * @param array $stored
     * @return array
     */
    private function normalize_stored_templates(array $stored)
    {
        $templates = array();
        foreach ($stored as $key => $template) {
            if (!is_array($template)) {
                continue;
            }

            $fallback_id = is_string($key) ? $key : '';
            $normalized = $this->normalize_template($template, true, array('id' => $fallback_id));
            if (is_wp_error($normalized)) {
                continue;
            }

            $duplicate = false;
            foreach ($templates as $existing) {
                if ($existing['id'] === $normalized['id'] || $existing['slug'] === $normalized['slug']) {
                    $duplicate = true;
                    break;
                }
            }
            if (!$duplicate) {
                $templates[] = $normalized;
            }

            if (count($templates) >= self::MAX_TEMPLATES) {
                break;
            }
        }

        return $templates;
    }

    /**
     * Normalize and bound a template payload.
     *
     * @param array $input
     * @param bool $allow_existing
     * @param array $existing
     * @return array|\WP_Error
     */
    private function normalize_template(array $input, $allow_existing = false, array $existing = array())
    {
        if (!isset($input['title']) && isset($input['name'])) {
            $input['title'] = $input['name'];
        }
        if (!isset($input['defaults']) && isset($input['fields'])) {
            $input['defaults'] = $input['fields'];
        }

        $id_source = isset($input['id']) ? $input['id'] : (isset($existing['id']) ? $existing['id'] : '');
        $slug_source = isset($input['slug']) ? $input['slug'] : $id_source;
        $title = $this->bounded_text(isset($input['title']) ? $input['title'] : '', self::MAX_TITLE_LENGTH);
        $id = $this->normalize_id($id_source);

        if ($id === '' && $title !== '') {
            $id = $this->normalize_id($title);
        }
        if ($id === '' || $title === '') {
            return $this->error('invalid_template', 'A template title and ID are required.');
        }

        $slug = $this->normalize_id($slug_source);
        if ($slug === '') {
            $slug = $id;
        }

        $type_source = isset($input['type']) ? $input['type'] : $slug;
        $type = $this->normalize_id($type_source);
        if ($type === '') {
            $type = 'custom';
        }
        $sections = $this->normalize_sections(isset($input['sections']) ? $input['sections'] : array());
        $defaults = $this->normalize_defaults(isset($input['defaults']) ? $input['defaults'] : array());
        $now = $this->now();

        return array(
            'id' => $id,
            'slug' => $slug,
            'title' => $title,
            'type' => substr($type, 0, self::MAX_TYPE_LENGTH),
            'description' => $this->bounded_text(isset($input['description']) ? $input['description'] : '', self::MAX_DESCRIPTION_LENGTH, true),
            'prompt' => $this->bounded_text(isset($input['prompt']) ? $input['prompt'] : '', self::MAX_PROMPT_LENGTH, true),
            'sections' => $sections,
            'defaults' => $defaults,
            'is_default' => !empty($input['is_default']),
            'created_at' => isset($input['created_at']) ? $this->bounded_text($input['created_at'], 30) : $now,
            'updated_at' => $now,
        );
    }

    /**
     * @param mixed $sections
     * @return array
     */
    private function normalize_sections($sections)
    {
        if (!is_array($sections)) {
            return array();
        }

        $normalized = array();
        foreach ($sections as $section) {
            if (is_array($section) && isset($section['title'])) {
                $section = $section['title'];
            }
            if (is_array($section) || is_object($section)) {
                continue;
            }

            $section = $this->bounded_text($section, self::MAX_SECTION_LENGTH);
            if ($section !== '') {
                $normalized[] = $section;
            }
            if (count($normalized) >= self::MAX_SECTIONS) {
                break;
            }
        }

        return $normalized;
    }

    /**
     * Keep only fields understood by the Generate article form.
     *
     * @param mixed $defaults
     * @return array
     */
    private function normalize_defaults($defaults)
    {
        if (!is_array($defaults)) {
            return array();
        }

        $normalized = array();
        $text_fields = array('topic', 'primary_keyword', 'secondary_keywords', 'category', 'audience', 'tone');
        foreach ($text_fields as $field) {
            if (isset($defaults[$field]) && !is_array($defaults[$field]) && !is_object($defaults[$field])) {
                $normalized[$field] = $this->bounded_text($defaults[$field], self::MAX_FIELD_LENGTH, true);
            }
        }
        if (isset($defaults['brief']) && !is_array($defaults['brief']) && !is_object($defaults['brief'])) {
            $normalized['brief'] = $this->bounded_text($defaults['brief'], self::MAX_BRIEF_LENGTH, true);
        }

        foreach (array('faq', 'seo', 'links', 'social') as $field) {
            if (array_key_exists($field, $defaults)) {
                $normalized[$field] = !empty($defaults[$field]);
            }
        }

        return $normalized;
    }

    /**
     * @param mixed $value
     * @param int $limit
     * @param bool $multiline
     * @return string
     */
    private function bounded_text($value, $limit, $multiline = false)
    {
        if (is_array($value) || is_object($value)) {
            return '';
        }

        $value = $multiline ? sanitize_textarea_field((string) $value) : sanitize_text_field((string) $value);
        return function_exists('mb_substr') ? mb_substr($value, 0, $limit, 'UTF-8') : substr($value, 0, $limit);
    }

    /**
     * @param mixed $id
     * @return string
     */
    private function normalize_id($id)
    {
        if (is_array($id) || is_object($id)) {
            return '';
        }

        $id = sanitize_title((string) $id);
        return substr($id, 0, self::MAX_ID_LENGTH);
    }

    /**
     * @param array $templates
     * @return void
     */
    private function write_templates(array $templates)
    {
        update_option(self::OPTION_KEY, array_values($templates), false);
    }

    /**
     * @return string
     */
    private function now()
    {
        if (function_exists('current_time')) {
            return sanitize_text_field((string) current_time('mysql', true));
        }

        return gmdate('Y-m-d H:i:s');
    }

    /**
     * @param string $code
     * @param string $message
     * @return \WP_Error
     */
    private function error($code, $message)
    {
        return new \WP_Error($code, $message);
    }
}
