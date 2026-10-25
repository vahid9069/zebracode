<?php

namespace ZebraCode\BlogAI;

use ZebraCode\BlogAI\Contracts\ContentGeneratorInterface;
use ZebraCode\BlogAI\Contracts\AIProviderInterface;

if (!defined('ABSPATH')) {
    exit;
}

final class Admin
{
    /** @var Settings */
    private $settings;

    /** @var ContentGeneratorInterface */
    private $generator;

    /** @var AIProviderInterface */
    private $provider;

    /** @var DraftRepository */
    private $drafts;

    /** @var ActivityLogger */
    private $activity;

    /** @var TemplateRepository */
    private $templates;

    /** @var SEOAuditor */
    private $seo;

    /** @var GenerationQueue */
    private $queue;

    /** @var PromptTester */
    private $prompt_tester;

    /** @var TransportDiagnostics */
    private $diagnostics;

    /** @var FeaturedImageGenerator|null */
    private $featured_image_generator;

    /** @var array<int,array> */
    private $post_audit_cache = array();

    public function __construct(Settings $settings, ContentGeneratorInterface $generator, AIProviderInterface $provider, DraftRepository $drafts, ActivityLogger $activity, TemplateRepository $templates, SEOAuditor $seo, GenerationQueue $queue, PromptTester $prompt_tester, TransportDiagnostics $diagnostics, $featured_image_generator = null)
    {
        $this->settings = $settings;
        $this->generator = $generator;
        $this->provider = $provider;
        $this->drafts = $drafts;
        $this->activity = $activity;
        $this->templates = $templates;
        $this->seo = $seo;
        $this->queue = $queue;
        $this->prompt_tester = $prompt_tester;
        $this->diagnostics = $diagnostics;
        $this->featured_image_generator = $featured_image_generator;
    }

    public function register_hooks()
    {
        add_action('admin_menu', array($this, 'register_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('wp_ajax_zebracode_blog_ai_list_models', array($this, 'ajax_list_models'));
        add_action('wp_ajax_zebracode_blog_ai_test_connection', array($this, 'ajax_test_connection'));
        add_action('admin_post_zebracode_blog_ai_refresh', array($this, 'handle_refresh_request'));
        add_action('admin_post_zebracode_blog_ai_featured_image', array($this, 'handle_featured_image_request'));
        add_action('admin_notices', array($this, 'render_refresh_notice'));
        add_filter('manage_edit-post_columns', array($this, 'post_list_columns'));
        add_action('manage_post_posts_custom_column', array($this, 'render_post_list_column'), 10, 2);
    }

    public function register_menu()
    {
        add_menu_page(
            __('ZebraCode Blog AI', 'zebracode-blog-ai'),
            __('Blog AI', 'zebracode-blog-ai'),
            'edit_posts',
            'zebracode-blog-ai',
            array($this, 'render_dashboard'),
            'dashicons-edit-page',
            30
        );

        add_submenu_page('zebracode-blog-ai', __('Generate article', 'zebracode-blog-ai'), __('Generate article', 'zebracode-blog-ai'), 'edit_posts', 'zebracode-blog-ai-generate', array($this, 'render_generate'));
        add_submenu_page('zebracode-blog-ai', __('Content templates', 'zebracode-blog-ai'), __('Templates', 'zebracode-blog-ai'), 'edit_posts', 'zebracode-blog-ai-templates', array($this, 'render_templates'));
        add_submenu_page('zebracode-blog-ai', __('Draft library', 'zebracode-blog-ai'), __('Drafts', 'zebracode-blog-ai'), 'edit_posts', 'zebracode-blog-ai-drafts', array($this, 'render_drafts'));
        add_submenu_page('zebracode-blog-ai', __('SEO workspace', 'zebracode-blog-ai'), __('SEO tools', 'zebracode-blog-ai'), 'edit_posts', 'zebracode-blog-ai-seo', array($this, 'render_seo'));
        add_submenu_page('zebracode-blog-ai', __('Jobs and logs', 'zebracode-blog-ai'), __('Jobs & logs', 'zebracode-blog-ai'), 'manage_options', 'zebracode-blog-ai-jobs', array($this, 'render_jobs'));
        add_submenu_page('zebracode-blog-ai', __('Prompt lab', 'zebracode-blog-ai'), __('Prompt lab', 'zebracode-blog-ai'), 'manage_options', 'zebracode-blog-ai-prompt-lab', array($this, 'render_prompt_lab'));
        if (ModuleManager::enabled('studio')) {
            add_submenu_page('zebracode-blog-ai', __('AI Studio', 'zebracode-blog-ai'), __('AI Studio', 'zebracode-blog-ai'), 'edit_posts', 'zebracode-blog-ai-studio', array($this, 'render_studio'));
        }
        add_submenu_page('zebracode-blog-ai', __('Plugin settings', 'zebracode-blog-ai'), __('Settings', 'zebracode-blog-ai'), 'manage_options', 'zebracode-blog-ai-settings', array($this, 'render_settings'));
    }

    public function enqueue_assets($hook)
    {
        if (strpos((string) $hook, 'zebracode-blog-ai') === false && $hook !== 'edit.php') {
            return;
        }

        wp_enqueue_style(
            'zebracode-blog-ai-admin',
            ZEBRACODE_BLOG_AI_URL . 'assets/admin.css',
            array(),
            ZEBRACODE_BLOG_AI_VERSION
        );
        wp_enqueue_script(
            'zebracode-blog-ai-admin',
            ZEBRACODE_BLOG_AI_URL . 'assets/admin.js',
            array(),
            ZEBRACODE_BLOG_AI_VERSION,
            true
        );
        wp_localize_script(
            'zebracode-blog-ai-admin',
            'ZebraCodeBlogAI',
            array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'modelsNonce' => wp_create_nonce('zebracode_blog_ai_models'),
                'testNonce' => wp_create_nonce('zebracode_blog_ai_test_connection'),
                'restUrl' => esc_url_raw(rest_url(RESTController::NAMESPACE)),
                'restNonce' => wp_create_nonce('wp_rest'),
                'studioUrl' => $this->page_url('zebracode-blog-ai-studio'),
            )
        );

        if (ModuleManager::enabled('studio') && isset($_GET['page']) && sanitize_key(wp_unslash($_GET['page'])) === 'zebracode-blog-ai-studio') {
            wp_enqueue_script('zebracode-blog-ai-studio', ZEBRACODE_BLOG_AI_URL . 'assets/studio.js', array('wp-element'), ZEBRACODE_BLOG_AI_VERSION, true);
            wp_localize_script('zebracode-blog-ai-studio', 'ZebraCodeBlogAIStudio', array(
                'restUrl' => esc_url_raw(rest_url(RESTController::NAMESPACE)),
                'restNonce' => wp_create_nonce('wp_rest'),
            ));
        }
    }

    /**
     * Add compact quality columns to wp-admin/edit.php without changing the
     * core title/status/date columns.
     *
     * @param array $columns
     * @return array
     */
    public function post_list_columns($columns)
    {
        $result = array();
        foreach ($columns as $key => $label) {
            if ($key === 'date') {
                $result['zebracode_quality'] = __('Zebra SEO', 'zebracode-blog-ai');
                $result['zebracode_signals'] = __('AEO / GEO', 'zebracode-blog-ai');
            }
            $result[$key] = $label;
        }

        return $result;
    }

    /**
     * Render the quality cells for the post list table.
     *
     * @param string $column
     * @param int $post_id
     * @return void
     */
    public function render_post_list_column($column, $post_id)
    {
        if (!in_array($column, array('zebracode_quality', 'zebracode_signals'), true)) {
            return;
        }

        $post_id = absint($post_id);
        if (!get_post_meta($post_id, DraftRepository::GENERATED_META_KEY, true)) {
            echo '<span class="zc-post-quality-empty">' . esc_html__('Not generated by ZebraCode Blog AI', 'zebracode-blog-ai') . '</span>';
            return;
        }

        $audit = $this->post_audit($post_id);
        if (!$audit || empty($audit['summary'])) {
            echo '<span class="zc-post-quality-empty">—</span>';
            return;
        }

        if ($column === 'zebracode_quality') {
            $status = isset($audit['summary']['status']) ? $audit['summary']['status'] : 'warning';
            $tone = $this->quality_tone($status);
            $score = absint($audit['summary']['score']);
            echo '<span class="zc-post-score zc-post-score-' . esc_attr($tone) . '">' . $score . '<small>/100</small></span>';
            echo '<span class="zc-post-quality-label">' . esc_html($this->quality_status_label($status)) . '</span>';
            if ($score < 50 && current_user_can('edit_post', $post_id)) {
                echo '<form class="zc-refresh-form" method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
                echo wp_nonce_field('zebracode_blog_ai_refresh_' . $post_id, '_zebracode_refresh_nonce', true, false);
                echo '<input type="hidden" name="action" value="zebracode_blog_ai_refresh" />';
                echo '<input type="hidden" name="post_id" value="' . absint($post_id) . '" />';
                echo '<button type="submit" class="zc-refresh-button">↻ ' . esc_html__('Refresh safely', 'zebracode-blog-ai') . '</button>';
                echo '<span class="zc-refresh-hint">' . esc_html__('Creates a new draft and preserves media.', 'zebracode-blog-ai') . '</span>';
                echo '</form>';
            }
            if (!function_exists('get_post_thumbnail_id') || !get_post_thumbnail_id($post_id)) {
                echo '<form class="zc-refresh-form" method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
                echo wp_nonce_field('zebracode_blog_ai_featured_image_' . $post_id, '_zebracode_image_nonce', true, false);
                echo '<input type="hidden" name="action" value="zebracode_blog_ai_featured_image" />';
                echo '<input type="hidden" name="post_id" value="' . absint($post_id) . '" />';
                echo '<button type="submit" class="zc-refresh-button">▧ ' . esc_html__('Generate image', 'zebracode-blog-ai') . '</button>';
                echo '</form>';
            }
            return;
        }

        echo '<div class="zc-post-signals">';
        echo $this->post_signal('AEO', isset($audit['answer_block']['status']) ? $audit['answer_block']['status'] : 'warning');
        echo $this->post_signal('GEO', isset($audit['question_headings']['status']) ? $audit['question_headings']['status'] : 'warning');
        echo $this->post_signal('FAQ', isset($audit['faq']['status']) ? $audit['faq']['status'] : 'warning');
        echo $this->post_signal(__('Links', 'zebracode-blog-ai'), isset($audit['links']['status']) ? $audit['links']['status'] : 'warning');
        echo '</div>';
    }

    private function post_audit($post_id)
    {
        if (!array_key_exists($post_id, $this->post_audit_cache)) {
            $this->post_audit_cache[$post_id] = $this->seo->audit($post_id);
        }

        return $this->post_audit_cache[$post_id];
    }

    private function post_signal($label, $status)
    {
        return '<span class="zc-post-signal zc-post-signal-' . esc_attr($this->quality_tone($status)) . '"><b>' . esc_html($label) . '</b> ' . esc_html($this->quality_status_label($status)) . '</span>';
    }

    private function quality_tone($status)
    {
        if ($status === 'pass') {
            return 'pass';
        }
        if ($status === 'fail') {
            return 'fail';
        }

        return 'warning';
    }

    private function quality_status_label($status)
    {
        if ($status === 'pass') {
            return __('Pass', 'zebracode-blog-ai');
        }
        if ($status === 'fail') {
            return __('Needs work', 'zebracode-blog-ai');
        }

        return __('Review', 'zebracode-blog-ai');
    }

    public function render_dashboard()
    {
        $settings = $this->settings->get();
        $configured = $settings['model'] !== '' && $settings['api_key'] !== '';
        $draft_counts = $this->drafts->counts();
        $activity_counts = $this->activity->statusCounters();
        $queue_counts = $this->queue->counts();

        $this->open_page('dashboard', __('Dashboard', 'zebracode-blog-ai'), __('A calm workspace for planning, generating, reviewing, and publishing better technical content.', 'zebracode-blog-ai'));
        ?>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <?php echo $this->metric_card(__('Provider status', 'zebracode-blog-ai'), $configured ? __('Configured', 'zebracode-blog-ai') : __('Needs setup', 'zebracode-blog-ai'), $configured ? __('Ready for the next integration step.', 'zebracode-blog-ai') : __('Add a model and server-side key in Settings.', 'zebracode-blog-ai'), $configured ? 'green' : 'amber'); ?>
            <?php echo $this->metric_card(__('Drafts', 'zebracode-blog-ai'), (string) $draft_counts['draft'], __('Generated drafts waiting for editorial review.', 'zebracode-blog-ai'), 'blue'); ?>
            <?php echo $this->metric_card(__('Active jobs', 'zebracode-blog-ai'), (string) ($queue_counts['queued'] + $queue_counts['processing'] + $queue_counts['retrying']), __('Queued, processing, or retrying generation jobs.', 'zebracode-blog-ai'), 'slate'); ?>
            <?php echo $this->metric_card(__('Completed runs', 'zebracode-blog-ai'), isset($activity_counts['completed']) ? (string) $activity_counts['completed'] : '0', __('Successful provider and generation events.', 'zebracode-blog-ai'), 'violet'); ?>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <section class="zc-card">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <p class="zc-kicker"><?php echo esc_html__('Start with a clear brief', 'zebracode-blog-ai'); ?></p>
                        <h2 class="mt-2 text-xl font-semibold text-slate-950"><?php echo esc_html__('Create your next useful article', 'zebracode-blog-ai'); ?></h2>
                        <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600"><?php echo esc_html__('The generation flow will turn a topic, audience, and content goal into a reviewable WordPress draft. Nothing will be published automatically.', 'zebracode-blog-ai'); ?></p>
                    </div>
                    <span class="zc-icon-box">✦</span>
                </div>
                <div class="mt-6 flex flex-wrap gap-3">
                    <?php echo $this->button(__('Generate an article', 'zebracode-blog-ai'), $this->page_url('zebracode-blog-ai-generate'), 'primary'); ?>
                    <?php echo $this->button(__('Browse templates', 'zebracode-blog-ai'), $this->page_url('zebracode-blog-ai-templates'), 'secondary'); ?>
                </div>
            </section>

            <section class="zc-card">
                <div class="flex items-center justify-between">
                    <h2 class="text-base font-semibold text-slate-950"><?php echo esc_html__('Workflow', 'zebracode-blog-ai'); ?></h2>
                    <?php echo $this->badge(__('Foundation', 'zebracode-blog-ai'), 'blue'); ?>
                </div>
                <ol class="mt-5 space-y-4">
                    <?php echo $this->workflow_item('01', __('Configure provider', 'zebracode-blog-ai'), $configured ? __('Completed', 'zebracode-blog-ai') : __('Next step', 'zebracode-blog-ai'), $configured); ?>
                    <?php echo $this->workflow_item('02', __('Generate a structured draft', 'zebracode-blog-ai'), __('Available', 'zebracode-blog-ai'), true); ?>
                    <?php echo $this->workflow_item('03', __('Review technical quality', 'zebracode-blog-ai'), __('Available', 'zebracode-blog-ai'), true); ?>
                    <?php echo $this->workflow_item('04', __('Publish or sync to the blog', 'zebracode-blog-ai'), __('After publishing', 'zebracode-blog-ai'), false); ?>
                </ol>
            </section>
        </div>

        <section class="zc-card mt-6">
            <div class="flex items-center justify-between gap-4">
                <div>
                    <p class="zc-kicker"><?php echo esc_html__('Product boundary', 'zebracode-blog-ai'); ?></p>
                    <h2 class="mt-2 text-lg font-semibold text-slate-950"><?php echo esc_html__('What this plugin will own', 'zebracode-blog-ai'); ?></h2>
                </div>
                <?php echo $this->badge(__('Draft-first', 'zebracode-blog-ai'), 'green'); ?>
            </div>
            <div class="mt-5 grid gap-3 md:grid-cols-3">
                <?php echo $this->info_tile('✎', __('Content briefs', 'zebracode-blog-ai'), __('Topics, audience, tone, structure, and reusable templates.', 'zebracode-blog-ai')); ?>
                <?php echo $this->info_tile('✓', __('Human review', 'zebracode-blog-ai'), __('Quality gates before a post can be published or synced.', 'zebracode-blog-ai')); ?>
                <?php echo $this->info_tile('↗', __('Frontend sync', 'zebracode-blog-ai'), __('A controlled handoff to the static ZebraCode blog build.', 'zebracode-blog-ai')); ?>
            </div>
        </section>
        <?php
        $this->close_page();
    }

    public function render_generate()
    {
        $feedback = $this->handle_generation_request();
        $template = null;
        $template_defaults = array();
        if (isset($_GET['template']) && !is_array($_GET['template'])) {
            $template = $this->templates->get_template(sanitize_title(wp_unslash($_GET['template'])));
            if ($template !== null) {
                $template_defaults = $template['defaults'];
            }
        }
        $brief_value = isset($template_defaults['brief']) ? $template_defaults['brief'] : '';
        if ($template !== null) {
            if ($template['prompt'] !== '') {
                $brief_value .= "\n\nTemplate guidance:\n" . $template['prompt'];
            }
            if (!empty($template['sections'])) {
                $brief_value .= "\n\nSuggested sections:\n- " . implode("\n- ", $template['sections']);
            }
        }
        $faq_checked = isset($_POST['faq']) ? true : !empty($template_defaults['faq']);
        $seo_checked = isset($_POST['seo']) ? true : !empty($template_defaults['seo']);
        $links_checked = isset($_POST['links']) ? true : !empty($template_defaults['links']);
        $social_checked = isset($_POST['social']) ? true : !empty($template_defaults['social']);
        $featured_image_checked = $_SERVER['REQUEST_METHOD'] === 'POST' ? isset($_POST['featured_image']) : true;
        $this->open_page('generate', __('Generate article', 'zebracode-blog-ai'), __('Turn a focused brief into a structured WordPress Draft for human review.', 'zebracode-blog-ai'));
        if ($feedback !== null) {
            echo $feedback;
        }
        ?>
        <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section class="zc-card">
                <div class="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
                    <div>
                        <p class="zc-kicker"><?php echo esc_html__('New content brief', 'zebracode-blog-ai'); ?></p>
                        <h2 class="mt-2 text-xl font-semibold text-slate-950"><?php echo esc_html__('Tell the model what to build', 'zebracode-blog-ai'); ?></h2>
                        <?php if ($template !== null) : ?><p class="mt-2 text-xs text-blue-700"><?php echo esc_html(sprintf(__('Using template: %s', 'zebracode-blog-ai'), $template['title'])); ?></p><?php endif; ?>
                    </div>
                    <?php echo $this->badge(__('Draft only', 'zebracode-blog-ai'), 'amber'); ?>
                </div>
                <form class="mt-6 space-y-5" action="<?php echo esc_url($this->page_url('zebracode-blog-ai-generate')); ?>" method="post">
                    <?php wp_nonce_field('zebracode_blog_ai_generate', 'zebracode_blog_ai_nonce'); ?>
                    <input type="hidden" name="zebracode_blog_ai_action" value="generate_draft" />
                    <div class="grid gap-5 md:grid-cols-2">
                        <?php echo $this->form_field('Topic', 'topic', 'e.g. Debugging JSON responses in production', 'text', 'md:col-span-2', isset($template_defaults['topic']) ? $template_defaults['topic'] : ''); ?>
                        <?php echo $this->form_field('Primary keyword', 'primary_keyword', 'e.g. JSON debugging', 'text', '', isset($template_defaults['primary_keyword']) ? $template_defaults['primary_keyword'] : ''); ?>
                        <?php echo $this->form_select('Category', 'category', array('Data & structure', 'Development', 'Security', 'Network & web', 'Text & productivity'), isset($template_defaults['category']) ? $template_defaults['category'] : ''); ?>
                        <?php echo $this->form_select('Audience level', 'audience', array('Beginner', 'Intermediate', 'Advanced'), isset($template_defaults['audience']) ? $template_defaults['audience'] : ''); ?>
                        <?php echo $this->form_select('Tone', 'tone', array('Clear and practical', 'Technical and precise', 'Friendly and educational'), isset($template_defaults['tone']) ? $template_defaults['tone'] : ''); ?>
                    </div>
                    <?php echo $this->form_field('Secondary keywords', 'secondary_keywords', 'Comma-separated keywords (optional)', 'text', '', isset($template_defaults['secondary_keywords']) ? $template_defaults['secondary_keywords'] : ''); ?>
                    <?php echo $this->form_textarea('Brief and constraints', 'brief', 'What should the reader understand or be able to do after reading? Include product notes, examples, or sources you trust.', 6, $brief_value); ?>
                    <div>
                        <span class="mb-3 block text-sm font-semibold text-slate-800"><?php echo esc_html__('Output options', 'zebracode-blog-ai'); ?></span>
                        <div class="grid gap-3 sm:grid-cols-2">
                            <?php echo $this->checkbox('faq', __('Generate FAQ section', 'zebracode-blog-ai'), $faq_checked); ?>
                            <?php echo $this->checkbox('seo', __('Generate SEO metadata', 'zebracode-blog-ai'), $seo_checked); ?>
                            <?php echo $this->checkbox('links', __('Suggest ZebraCode tools', 'zebracode-blog-ai'), $links_checked); ?>
                            <?php echo $this->checkbox('social', __('Prepare social summary', 'zebracode-blog-ai'), $social_checked); ?>
                            <?php echo $this->checkbox('featured_image', __('Generate featured image', 'zebracode-blog-ai'), $featured_image_checked); ?>
                        </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
                        <button type="submit" class="zc-button zc-button-primary"><?php echo esc_html__('Generate draft', 'zebracode-blog-ai'); ?></button>
                        <span class="text-xs text-slate-500"><?php echo esc_html__('The article will be saved as a WordPress draft for human review.', 'zebracode-blog-ai'); ?></span>
                    </div>
                </form>
            </section>

            <aside class="space-y-6">
                <section class="zc-card zc-card-muted">
                    <p class="zc-kicker"><?php echo esc_html__('Generation contract', 'zebracode-blog-ai'); ?></p>
                    <h2 class="mt-2 text-base font-semibold text-slate-950"><?php echo esc_html__('What will be saved', 'zebracode-blog-ai'); ?></h2>
                    <ul class="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                        <li>✓ <?php echo esc_html__('Title, slug, excerpt, and content', 'zebracode-blog-ai'); ?></li>
                        <li>✓ <?php echo esc_html__('Category, tags, FAQ, and metadata', 'zebracode-blog-ai'); ?></li>
                        <li>✓ <?php echo esc_html__('Prompt and model details for review', 'zebracode-blog-ai'); ?></li>
                        <li>✓ <?php echo esc_html__('WordPress draft, never direct publish', 'zebracode-blog-ai'); ?></li>
                    </ul>
                </section>
                <section class="zc-card">
                    <div class="flex items-center gap-3"><span class="zc-icon-box">i</span><h2 class="text-base font-semibold text-slate-950"><?php echo esc_html__('Good briefs make better drafts', 'zebracode-blog-ai'); ?></h2></div>
                    <p class="mt-4 text-sm leading-6 text-slate-600"><?php echo esc_html__('Mention the reader, the exact problem, the desired outcome, and any technical boundaries. The model should support your editorial direction, not replace it.', 'zebracode-blog-ai'); ?></p>
                </section>
            </aside>
        </div>
        <?php
        $this->close_page();
    }

    public function render_templates()
    {
        $feedback = $this->handle_template_action();
        $templates = $this->templates->get_templates();
        $show_form = isset($_GET['new']) && !is_array($_GET['new']) && sanitize_key(wp_unslash($_GET['new'])) === '1';
        $this->open_page('templates', __('Content templates', 'zebracode-blog-ai'), __('Reusable briefs keep the voice, structure, and quality bar consistent across your blog.', 'zebracode-blog-ai'));
        if ($feedback !== null) {
            echo $feedback;
        }
        ?>
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap gap-2">
                <?php echo $this->filter_pill(__('All templates', 'zebracode-blog-ai'), true); ?>
                <?php echo $this->filter_pill(__('Technical guide', 'zebracode-blog-ai')); ?>
                <?php echo $this->filter_pill(__('Comparison', 'zebracode-blog-ai')); ?>
                <?php echo $this->filter_pill(__('Tool guide', 'zebracode-blog-ai')); ?>
            </div>
            <a class="zc-button zc-button-secondary" href="<?php echo esc_url(add_query_arg(array('page' => 'zebracode-blog-ai-templates', 'new' => '1'), admin_url('admin.php'))); ?>">＋ <?php echo esc_html__('New template', 'zebracode-blog-ai'); ?></a>
        </div>
        <?php if ($show_form) : ?>
            <section class="zc-card mb-6">
                <div class="mb-5 border-b border-slate-200 pb-4"><p class="zc-kicker"><?php echo esc_html__('Template editor', 'zebracode-blog-ai'); ?></p><h2 class="mt-2 text-xl font-semibold text-slate-950"><?php echo esc_html__('Create a reusable brief', 'zebracode-blog-ai'); ?></h2></div>
                <form action="<?php echo esc_url($this->page_url('zebracode-blog-ai-templates')); ?>" method="post" class="space-y-5">
                    <?php wp_nonce_field('zebracode_blog_ai_template', 'zebracode_blog_ai_template_nonce'); ?><input type="hidden" name="zebracode_blog_ai_action" value="create_template" />
                    <div class="grid gap-5 md:grid-cols-2"><?php echo $this->form_field('Template title', 'template_title', 'e.g. Troubleshooting guide'); ?><?php echo $this->form_field('Template type', 'template_type', 'e.g. troubleshooting'); ?><?php echo $this->form_field('Description', 'template_description', 'What kind of article does this template create?', 'text', 'md:col-span-2'); ?></div>
                    <?php echo $this->form_textarea('Prompt guidance', 'template_prompt', 'Editorial guidance for the model.', 4); ?>
                    <?php echo $this->form_textarea('Suggested sections', 'template_sections', "One section per line\nProblem\nSolution\nVerification", 5); ?>
                    <div class="flex flex-wrap gap-3"><button type="submit" class="zc-button zc-button-primary"><?php echo esc_html__('Save template', 'zebracode-blog-ai'); ?></button><a class="zc-button zc-button-secondary" href="<?php echo esc_url($this->page_url('zebracode-blog-ai-templates')); ?>"><?php echo esc_html__('Cancel', 'zebracode-blog-ai'); ?></a></div>
                </form>
            </section>
        <?php endif; ?>
        <div class="grid gap-5 lg:grid-cols-3">
            <?php foreach ($templates as $template) : ?>
                <?php
                $use_url = add_query_arg(array('page' => 'zebracode-blog-ai-generate', 'template' => $template['id']), admin_url('admin.php'));
                $tone = $template['type'] === 'tool-guide' ? 'green' : ($template['type'] === 'comparison' ? 'violet' : 'blue');
                ?>
                <article class="zc-card flex flex-col">
                    <div class="flex items-center justify-between gap-3"><?php echo $this->badge($template['title'], $tone); ?><span class="text-xs text-slate-400"><?php echo esc_html(sprintf(_n('%d section', '%d sections', count($template['sections']), 'zebracode-blog-ai'), count($template['sections']))); ?></span></div>
                    <p class="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400"><?php echo esc_html($template['type']); ?></p>
                    <p class="mt-2 flex-1 text-sm leading-6 text-slate-600"><?php echo esc_html($template['description']); ?></p>
                    <a class="zc-button zc-button-secondary mt-6 w-full" href="<?php echo esc_url($use_url); ?>"><?php echo esc_html__('Use template', 'zebracode-blog-ai'); ?></a>
                </article>
            <?php endforeach; ?>
        </div>
        <?php
        $this->close_page();
    }

    public function render_drafts()
    {
        $result = $this->drafts->query(array('posts_per_page' => 20, 'paged' => 1));
        $counts = $this->drafts->counts();
        $this->open_page('drafts', __('Draft library', 'zebracode-blog-ai'), __('Review generated content before it reaches WordPress publishing or the static blog build.', 'zebracode-blog-ai'));
        ?>
        <section class="zc-card">
            <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div><p class="zc-kicker"><?php echo esc_html__('Editorial queue', 'zebracode-blog-ai'); ?></p><h2 class="mt-2 text-xl font-semibold text-slate-950"><?php echo esc_html__('Generated drafts', 'zebracode-blog-ai'); ?></h2><p class="mt-2 text-sm text-slate-500"><?php echo esc_html(sprintf(_n('%d generated post', '%d generated posts', $counts['total'], 'zebracode-blog-ai'), $counts['total'])); ?></p></div>
                <?php echo $this->button(__('Create a brief', 'zebracode-blog-ai'), $this->page_url('zebracode-blog-ai-generate'), 'primary'); ?>
            </div>
            <?php if (empty($result['rows'])) : ?>
                <div class="mt-6 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-slate-500 shadow-sm">✎</div>
                    <h3 class="mt-4 text-base font-semibold text-slate-900"><?php echo esc_html__('No drafts yet', 'zebracode-blog-ai'); ?></h3>
                    <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600"><?php echo esc_html__('Generated drafts will appear here with quality status, author, model, and review actions.', 'zebracode-blog-ai'); ?></p>
                </div>
            <?php else : ?>
                <div class="mt-6 overflow-x-auto">
                    <table class="min-w-full divide-y divide-slate-200 text-start text-sm">
                        <thead><tr class="text-xs uppercase tracking-wide text-slate-400"><th class="px-3 py-3 font-semibold"><?php echo esc_html__('Article', 'zebracode-blog-ai'); ?></th><th class="px-3 py-3 font-semibold"><?php echo esc_html__('Status', 'zebracode-blog-ai'); ?></th><th class="px-3 py-3 font-semibold"><?php echo esc_html__('Author', 'zebracode-blog-ai'); ?></th><th class="px-3 py-3 font-semibold"><?php echo esc_html__('Generated', 'zebracode-blog-ai'); ?></th><th class="px-3 py-3"></th></tr></thead>
                        <tbody class="divide-y divide-slate-100">
                            <?php foreach ($result['rows'] as $row) : ?>
                                <tr class="align-top"><td class="px-3 py-4"><div class="flex flex-wrap items-center gap-2"><a class="font-semibold text-slate-900 no-underline hover:text-blue-700" href="<?php echo esc_url($row['edit_url']); ?>"><?php echo esc_html($row['title'] !== '' ? $row['title'] : __('Untitled draft', 'zebracode-blog-ai')); ?></a><?php if (!empty($row['refresh_source_id'])) : ?><?php echo $this->badge(__('Refresh candidate', 'zebracode-blog-ai'), 'violet'); ?><?php endif; ?></div><p class="mt-1 max-w-xl text-xs leading-5 text-slate-500"><?php echo esc_html(wp_trim_words($row['excerpt'], 18)); ?></p></td><td class="px-3 py-4"><?php echo $this->badge($row['status_label'], $row['status'] === 'draft' ? 'amber' : 'green'); ?></td><td class="px-3 py-4 text-slate-600"><?php echo esc_html($row['author']); ?></td><td class="whitespace-nowrap px-3 py-4 text-xs text-slate-500"><?php echo esc_html($row['generated_at']); ?></td><td class="px-3 py-4 text-end"><a class="text-xs font-semibold text-blue-700 no-underline hover:text-blue-900" href="<?php echo esc_url($row['edit_url']); ?>"><?php echo esc_html__('Open', 'zebracode-blog-ai'); ?> ↗</a></td></tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </section>
        <?php
        $this->close_page();
    }

    public function render_seo()
    {
        $audit = $this->handle_seo_audit();
        $drafts = $this->drafts->rows(array('posts_per_page' => 100, 'paged' => 1));
        $this->open_page('seo', __('SEO workspace', 'zebracode-blog-ai'), __('Review search intent, metadata, headings, internal links, and structured content without publishing automatically.', 'zebracode-blog-ai'));
        if (is_array($audit) && !empty($audit['error'])) {
            echo $this->notice($audit['error'], 'error');
        }
        ?>
        <div class="grid gap-6 xl:grid-cols-[1fr_380px]">
            <section class="zc-card">
                <p class="zc-kicker"><?php echo esc_html__('Content audit', 'zebracode-blog-ai'); ?></p>
                <h2 class="mt-2 text-xl font-semibold text-slate-950"><?php echo esc_html__('Audit an article brief', 'zebracode-blog-ai'); ?></h2>
                <div class="mt-6 space-y-5">
                    <?php if (empty($drafts)) : ?>
                        <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm leading-6 text-slate-600"><?php echo esc_html__('Generate a draft first. Generated WordPress posts will appear here for auditing.', 'zebracode-blog-ai'); ?></div>
                    <?php else : ?>
                        <form action="<?php echo esc_url($this->page_url('zebracode-blog-ai-seo')); ?>" method="post" class="space-y-5">
                            <?php wp_nonce_field('zebracode_blog_ai_seo_audit', 'zebracode_blog_ai_seo_nonce'); ?><input type="hidden" name="zebracode_blog_ai_action" value="audit_seo" />
                            <label class="block"><span class="mb-2 block text-sm font-semibold text-slate-800"><?php echo esc_html__('Generated article', 'zebracode-blog-ai'); ?></span><select class="zc-input" name="seo_post_id"><option value=""><?php echo esc_html__('Select a draft', 'zebracode-blog-ai'); ?></option><?php foreach ($drafts as $draft) : ?><option value="<?php echo absint($draft['id']); ?>" <?php selected(is_array($audit) && isset($audit['post_id']) ? $audit['post_id'] : 0, $draft['id']); ?>><?php echo esc_html($draft['title'] !== '' ? $draft['title'] : __('Untitled draft', 'zebracode-blog-ai')); ?></option><?php endforeach; ?></select></label>
                            <p class="text-xs leading-5 text-slate-500"><?php echo esc_html__('The audit is local and deterministic. It does not send article content to the AI provider.', 'zebracode-blog-ai'); ?></p>
                            <button type="submit" class="zc-button zc-button-primary"><?php echo esc_html__('Run SEO audit', 'zebracode-blog-ai'); ?></button>
                        </form>
                    <?php endif; ?>
                </div>
            </section>
            <aside class="zc-card zc-card-muted">
                <p class="zc-kicker"><?php echo esc_html__('Quality signals', 'zebracode-blog-ai'); ?></p>
                <div class="mt-5 space-y-4">
                    <?php if (is_array($audit) && !empty($audit['summary'])) : ?>
                        <div class="mb-5 rounded-xl bg-white p-4 text-center"><p class="text-3xl font-bold text-slate-950"><?php echo absint($audit['summary']['score']); ?>/100</p><p class="mt-1 text-xs text-slate-500"><?php echo esc_html($audit['summary']['message']); ?></p></div>
                        <?php echo $this->quality_row(__('Title', 'zebracode-blog-ai'), $audit['title']['status'], $audit['title']['status']); ?>
                        <?php echo $this->quality_row(__('Excerpt', 'zebracode-blog-ai'), $audit['excerpt']['status'], $audit['excerpt']['status']); ?>
                        <?php echo $this->quality_row(__('Content', 'zebracode-blog-ai'), $audit['content']['status'], $audit['content']['status']); ?>
                        <?php echo $this->quality_row(__('Headings', 'zebracode-blog-ai'), $audit['headings']['status'], $audit['headings']['status']); ?>
                        <?php echo $this->quality_row(__('Links', 'zebracode-blog-ai'), $audit['links']['status'], $audit['links']['status']); ?>
                        <?php echo $this->quality_row(__('Meta description', 'zebracode-blog-ai'), $audit['meta_description']['status'], $audit['meta_description']['status']); ?>
                        <?php echo $this->quality_row(__('FAQ', 'zebracode-blog-ai'), $audit['faq']['status'], $audit['faq']['status']); ?>
                        <?php echo $this->quality_row(__('Slug', 'zebracode-blog-ai'), $audit['slug']['status'], $audit['slug']['status']); ?>
                        <?php echo $this->quality_row(__('Direct answer (AEO)', 'zebracode-blog-ai'), $audit['answer_block']['status'], $audit['answer_block']['status']); ?>
                        <?php echo $this->quality_row(__('Question headings (GEO)', 'zebracode-blog-ai'), $audit['question_headings']['status'], $audit['question_headings']['status']); ?>
                        <?php echo $this->quality_row(__('Structured content', 'zebracode-blog-ai'), $audit['structure']['status'], $audit['structure']['status']); ?>
                    <?php else : ?>
                        <?php echo $this->quality_row(__('Title', 'zebracode-blog-ai'), __('Waiting for an article', 'zebracode-blog-ai'), 'slate'); ?>
                        <?php echo $this->quality_row(__('Metadata', 'zebracode-blog-ai'), __('Waiting for an article', 'zebracode-blog-ai'), 'slate'); ?>
                        <?php echo $this->quality_row(__('Internal links', 'zebracode-blog-ai'), __('Waiting for an article', 'zebracode-blog-ai'), 'slate'); ?>
                        <?php echo $this->quality_row(__('Schema readiness', 'zebracode-blog-ai'), __('Waiting for an article', 'zebracode-blog-ai'), 'slate'); ?>
                    <?php endif; ?>
                </div>
            </aside>
        </div>
        <?php
        $this->close_page();
    }

    public function render_jobs()
    {
        $events = $this->activity->recent(30);
        $queue_counts = $this->queue->counts();
        $this->open_page('jobs', __('Jobs and logs', 'zebracode-blog-ai'), __('A transparent record of AI requests, retries, quality checks, and sync events.', 'zebracode-blog-ai'));
        ?>
        <div class="grid gap-4 md:grid-cols-3">
            <?php echo $this->metric_card(__('Queued', 'zebracode-blog-ai'), (string) ($queue_counts['queued'] + $queue_counts['retrying']), __('Jobs waiting for WordPress Cron.', 'zebracode-blog-ai'), 'slate'); ?>
            <?php echo $this->metric_card(__('Completed', 'zebracode-blog-ai'), isset($queue_counts['completed']) ? (string) $queue_counts['completed'] : '0', __('Successful generation jobs.', 'zebracode-blog-ai'), 'green'); ?>
            <?php echo $this->metric_card(__('Failed', 'zebracode-blog-ai'), isset($queue_counts['failed']) ? (string) $queue_counts['failed'] : '0', __('Jobs that reached the retry limit.', 'zebracode-blog-ai'), 'amber'); ?>
        </div>
        <section class="zc-card mt-6">
            <div class="flex flex-wrap items-center justify-between gap-4"><div><p class="zc-kicker"><?php echo esc_html__('Activity', 'zebracode-blog-ai'); ?></p><h2 class="mt-2 text-xl font-semibold text-slate-950"><?php echo esc_html__('Recent events', 'zebracode-blog-ai'); ?></h2></div><span class="text-sm text-slate-500"><?php echo esc_html__('Retention policy will be configurable.', 'zebracode-blog-ai'); ?></span></div>
            <?php if (empty($events)) : ?>
                <div class="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600"><?php echo esc_html__('No events have been recorded yet.', 'zebracode-blog-ai'); ?></div>
            <?php else : ?>
                <div class="mt-6 overflow-x-auto"><table class="min-w-full divide-y divide-slate-200 text-start text-sm"><thead><tr class="text-xs uppercase tracking-wide text-slate-400"><th class="px-3 py-3 font-semibold"><?php echo esc_html__('Event', 'zebracode-blog-ai'); ?></th><th class="px-3 py-3 font-semibold"><?php echo esc_html__('Status', 'zebracode-blog-ai'); ?></th><th class="px-3 py-3 font-semibold"><?php echo esc_html__('Details', 'zebracode-blog-ai'); ?></th><th class="px-3 py-3 font-semibold"><?php echo esc_html__('Time', 'zebracode-blog-ai'); ?></th></tr></thead><tbody class="divide-y divide-slate-100"><?php foreach ($events as $event) : ?><tr><td class="px-3 py-4 font-semibold text-slate-800"><span class="zc-log-label"><?php echo esc_html($this->event_label($event['event'])); ?></span></td><td class="px-3 py-4"><span class="zc-log-status"><?php echo $this->badge($this->event_status_label($event['status']), $event['status'] === 'failed' ? 'amber' : ($event['status'] === 'completed' ? 'green' : 'slate')); ?></span></td><td class="max-w-lg px-3 py-4 text-xs text-slate-500"><span class="zc-log-value" dir="ltr"><?php echo esc_html($this->event_summary($event['data'])); ?></span></td><td class="whitespace-nowrap px-3 py-4 text-xs text-slate-500"><time class="zc-log-value" dir="ltr"><?php echo esc_html($event['timestamp']); ?></time></td></tr><?php endforeach; ?></tbody></table></div>
            <?php endif; ?>
        </section>
        <?php
        $this->close_page();
    }

    public function render_prompt_lab()
    {
        $result = null;
        $feedback = null;
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $feedback = $this->handle_prompt_test($result);
        }

        $system_default = implode("\n", array(
            'You are a careful Persian technical editor for the ZebraCode developer blog.',
            'The blog language is Persian (fa-IR). Write title, excerpt, article prose, FAQ, and metadata in natural Persian. Keep code, identifiers, API names, and URLs in their original technical form.',
            'Return only one valid JSON object with exactly these fields: title, slug, excerpt, content, category, tags, meta_description, faq, related_tools.',
            'Use safe WordPress HTML in content. Every code example must be complete and syntactically valid. Do not use undeclared generic placeholders such as T1, T2, or T3.',
            'SEO/AEO/GEO: begin content with a direct 40-70 word answer, use descriptive h2/h3 questions, write a natural 120-160 character meta description, include 3-5 useful FAQ items, name entities precisely, and never invent facts or sources.',
        ));
        $system_value = isset($_POST['prompt_system']) && !is_array($_POST['prompt_system']) ? wp_unslash($_POST['prompt_system']) : $system_default;
        $user_value = isset($_POST['prompt_user']) && !is_array($_POST['prompt_user']) ? wp_unslash($_POST['prompt_user']) : '{"topic":"مدیریت generic های وابسته در TypeScript","category":"Development","audience":"Intermediate","tone":"Clear and practical","brief":"یک مقاله فارسی با مثال‌های کامل و قابل کامپایل بنویس.","faq":true,"seo":true,"links":true}';

        $this->open_page('prompt-lab', __('Prompt lab', 'zebracode-blog-ai'), __('Test the exact provider prompt without creating a Draft or queue job.', 'zebracode-blog-ai'));
        if ($feedback !== null) {
            echo $feedback;
        }
        ?>
        <div class="grid gap-6 xl:grid-cols-[1fr_420px]">
            <section class="zc-card">
                <div class="mb-6 border-b border-slate-200 pb-5"><p class="zc-kicker"><?php echo esc_html__('Manual provider test', 'zebracode-blog-ai'); ?></p><h2 class="mt-2 text-xl font-semibold text-slate-950"><?php echo esc_html__('Inspect the raw model response', 'zebracode-blog-ai'); ?></h2><p class="mt-2 text-sm leading-6 text-slate-600"><?php echo esc_html__('This test uses the saved Provider and API key, but it never creates a post, job, or activity log entry. Do not paste secrets into either prompt.', 'zebracode-blog-ai'); ?></p></div>
                <form action="<?php echo esc_url($this->page_url('zebracode-blog-ai-prompt-lab')); ?>" method="post" class="space-y-5">
                    <?php wp_nonce_field('zebracode_blog_ai_prompt_test', 'zebracode_blog_ai_prompt_nonce'); ?><input type="hidden" name="zebracode_blog_ai_action" value="test_prompt" />
                    <?php echo $this->form_textarea('System prompt', 'prompt_system', 'Instructions for the model', 12, $system_value); ?>
                    <?php echo $this->form_textarea('User prompt', 'prompt_user', 'Article brief or test input', 10, $user_value); ?>
                    <button type="submit" class="zc-button zc-button-primary"><?php echo esc_html__('Send prompt', 'zebracode-blog-ai'); ?></button>
                </form>
            </section>
            <aside class="space-y-6">
                <section class="zc-card zc-card-muted"><p class="zc-kicker"><?php echo esc_html__('Diagnostics', 'zebracode-blog-ai'); ?></p><?php if ($result !== null) : ?><div class="mt-4 grid gap-3 sm:grid-cols-2"><?php echo $this->diagnostic_tile(__('JSON', 'zebracode-blog-ai'), $result['json_valid'] ? __('Valid', 'zebracode-blog-ai') : __('Invalid', 'zebracode-blog-ai'), $result['json_valid'] ? 'green' : 'amber'); ?><?php echo $this->diagnostic_tile(__('Article contract', 'zebracode-blog-ai'), $result['article_valid'] ? __('Valid', 'zebracode-blog-ai') : __('Invalid', 'zebracode-blog-ai'), $result['article_valid'] ? 'green' : 'amber'); ?><?php echo $this->diagnostic_tile(__('Model', 'zebracode-blog-ai'), $result['model'] !== '' ? $result['model'] : __('Unknown', 'zebracode-blog-ai'), 'slate'); ?><?php echo $this->diagnostic_tile(__('Finish reason', 'zebracode-blog-ai'), $result['finish_reason'] !== '' ? $result['finish_reason'] : __('Not provided', 'zebracode-blog-ai'), 'slate'); ?></div><div class="mt-4 rounded-xl bg-white p-4 text-xs leading-5 text-slate-600"><?php echo esc_html($result['article_error'] !== '' ? $result['article_error'] : ($result['json_error'] !== '' ? $result['json_error'] : __('The response matches the article contract.', 'zebracode-blog-ai'))); ?></div><?php else : ?><p class="mt-4 text-sm leading-6 text-slate-600"><?php echo esc_html__('Send a prompt to see JSON parsing, schema validation, model, usage, and finish diagnostics.', 'zebracode-blog-ai'); ?></p><?php endif; ?></section>
                <?php if ($result !== null) : ?><section class="zc-card"><div class="flex items-center justify-between gap-3"><h2 class="text-base font-semibold text-slate-950"><?php echo esc_html__('Raw response', 'zebracode-blog-ai'); ?></h2><span class="text-xs text-slate-500"><?php echo esc_html(sprintf(__('%d characters', 'zebracode-blog-ai'), $result['raw_length'])); ?></span></div><pre class="mt-4 max-h-[520px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100" dir="ltr"><?php echo esc_html($result['raw']); ?></pre></section><?php endif; ?>
            </aside>
        </div>
        <?php
        $this->close_page();
    }

    public function render_settings()
    {
        $settings = $this->settings->get();
        $configured = $settings['model'] !== '' && $settings['api_key'] !== '';
        $feedback = $this->handle_connection_test();
        $diagnostic_result = $this->handle_transport_diagnostics();

        $this->open_page('settings', __('Settings', 'zebracode-blog-ai'), __('Keep provider credentials on the server and make the generation layer replaceable.', 'zebracode-blog-ai'));
        if ($feedback !== null) {
            echo $feedback;
        }
        ?>
        <div class="grid gap-6 xl:grid-cols-[1fr_340px]">
            <section class="zc-card">
                <div class="mb-6 flex items-center justify-between gap-4 border-b border-slate-200 pb-5"><div><p class="zc-kicker"><?php echo esc_html__('Connection', 'zebracode-blog-ai'); ?></p><h2 class="mt-2 text-xl font-semibold text-slate-950"><?php echo esc_html__('AI provider', 'zebracode-blog-ai'); ?></h2></div><?php echo $this->badge($configured ? __('Configured', 'zebracode-blog-ai') : __('Not configured', 'zebracode-blog-ai'), $configured ? 'green' : 'amber'); ?></div>
                <form action="options.php" method="post" class="zc-settings-form">
                    <?php settings_fields(Settings::OPTION_GROUP); do_settings_sections('zebracode-blog-ai'); submit_button(__('Save settings', 'zebracode-blog-ai'), 'primary', 'submit', true, array('class' => 'zc-button zc-button-primary')); ?>
                </form>
                <div id="zc-model-picker" class="mt-6 border-t border-slate-200 pt-5" data-empty-label="<?php echo esc_attr__('No models loaded yet.', 'zebracode-blog-ai'); ?>">
                    <div class="flex flex-wrap items-end justify-between gap-3"><div class="min-w-0 flex-1"><span class="mb-2 block text-sm font-semibold text-slate-800"><?php echo esc_html__('Available models', 'zebracode-blog-ai'); ?></span><p class="text-sm text-slate-600"><?php echo esc_html__('Load models to populate the Model dropdown above.', 'zebracode-blog-ai'); ?></p></div><button type="button" class="zc-button zc-button-secondary" data-load-models><?php echo esc_html__('Load models', 'zebracode-blog-ai'); ?></button></div>
                    <p class="mt-2 text-xs leading-5 text-slate-500" data-model-status><?php echo esc_html__('The request uses the current form values. The API key is resolved server-side from WordPress Connectors, environment configuration, or the legacy plugin setting.', 'zebracode-blog-ai'); ?></p>
                </div>
            </section>
            <aside class="space-y-6">
                <section class="zc-card zc-card-muted"><div class="flex items-center gap-3"><span class="zc-icon-box">⌁</span><h2 class="text-base font-semibold text-slate-950"><?php echo esc_html__('Server-side by design', 'zebracode-blog-ai'); ?></h2></div><p class="mt-4 text-sm leading-6 text-slate-600"><?php echo esc_html__('The browser never receives your provider key. Requests use WordPress HTTP APIs with timeouts, retries, and response validation.', 'zebracode-blog-ai'); ?></p></section>
                <section class="zc-card"><p class="zc-kicker"><?php echo esc_html__('Provider health', 'zebracode-blog-ai'); ?></p><h2 class="mt-2 text-base font-semibold text-slate-950"><?php echo esc_html__('Connection test', 'zebracode-blog-ai'); ?></h2><p class="mt-3 text-sm leading-6 text-slate-600"><?php echo esc_html__('Tests the current endpoint, model, and server-side API key. The key is never sent to the browser.', 'zebracode-blog-ai'); ?></p><form class="mt-4" action="<?php echo esc_url($this->page_url('zebracode-blog-ai-settings')); ?>" method="post" data-test-connection-form><?php wp_nonce_field('zebracode_blog_ai_test_connection', 'zebracode_blog_ai_test_nonce'); ?><input type="hidden" name="zebracode_blog_ai_action" value="test_connection" /><button type="submit" class="zc-button zc-button-secondary" data-test-connection><?php echo esc_html__('Test connection', 'zebracode-blog-ai'); ?></button><p class="mt-3 text-xs leading-5 text-slate-500" data-connection-status><?php echo esc_html__('The test uses the saved endpoint, model, and server-side key.', 'zebracode-blog-ai'); ?></p></form></section>
                <section class="zc-card"><p class="zc-kicker"><?php echo esc_html__('Shared hosting diagnostics', 'zebracode-blog-ai'); ?></p><h2 class="mt-2 text-base font-semibold text-slate-950"><?php echo esc_html__('Test server cURL', 'zebracode-blog-ai'); ?></h2><p class="mt-3 text-sm leading-6 text-slate-600"><?php echo esc_html__('Runs DNS, WordPress HTTP API, and native PHP cURL tests from this server. It never displays or stores your API key.', 'zebracode-blog-ai'); ?></p><form class="mt-4" action="<?php echo esc_url($this->page_url('zebracode-blog-ai-settings')); ?>" method="post"><?php wp_nonce_field('zebracode_blog_ai_transport_diagnostics', 'zebracode_blog_ai_diagnostics_nonce'); ?><input type="hidden" name="zebracode_blog_ai_action" value="transport_diagnostics" /><button type="submit" class="zc-button zc-button-secondary"><?php echo esc_html__('Run server test', 'zebracode-blog-ai'); ?></button></form><?php if (is_array($diagnostic_result)) : ?><div class="mt-5 space-y-3"><?php echo $this->diagnostic_result_row(__('DNS', 'zebracode-blog-ai'), $diagnostic_result['dns']); ?><?php echo $this->diagnostic_result_row(__('WordPress HTTP', 'zebracode-blog-ai'), $diagnostic_result['wordpress_http']); ?><?php echo $this->diagnostic_result_row(__('Native cURL', 'zebracode-blog-ai'), $diagnostic_result['native_curl']); ?><p class="text-xs text-slate-500"><?php echo esc_html(sprintf(__('PHP %1$s · %2$s · cURL: %3$s', 'zebracode-blog-ai'), $diagnostic_result['php'], $diagnostic_result['openssl'], $diagnostic_result['curl'])); ?></p></div><?php endif; ?></section>
            </aside>
        </div>
        <?php
        $this->close_page();
    }

    public function render_studio()
    {
        $this->open_page('studio', __('AI Studio', 'zebracode-blog-ai'), __('Stream a secure AI response without exposing provider credentials to the browser.', 'zebracode-blog-ai'));
        echo '<div id="zebracode-blog-ai-studio" class="zc-card" data-zebracode-studio></div>';
        $this->close_page();
    }

    /**
     * Return provider models for the authenticated Settings screen.
     *
     * Provider credentials are resolved on the server and never accepted from
     * browser JavaScript.
     */
    public function ajax_list_models()
    {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('You do not have permission to list models.', 'zebracode-blog-ai')), 403);
        }

        check_ajax_referer('zebracode_blog_ai_models', 'nonce');

        $provider_name = isset($_POST['provider']) && !is_array($_POST['provider']) ? sanitize_key(wp_unslash($_POST['provider'])) : '';
        $endpoint = isset($_POST['endpoint']) && !is_array($_POST['endpoint']) ? esc_url_raw(wp_unslash($_POST['endpoint'])) : '';

        if (!in_array($provider_name, array('openai-compatible', 'gemini'), true)) {
            wp_send_json_error(array('message' => __('Select a supported provider first.', 'zebracode-blog-ai')), 400);
        }

        try {
            $provider = $provider_name === 'gemini'
                ? new Providers\GeminiProvider($this->settings)
                : new Providers\OpenAICompatibleProvider($this->settings);
            $overrides = array('endpoint' => $endpoint);
            $models = $provider->list_models($overrides);
            wp_send_json_success(array('models' => $models));
        } catch (\Throwable $exception) {
            wp_send_json_error(array('message' => __('Could not load models. Check the provider, endpoint, and API key.', 'zebracode-blog-ai')), 400);
        }
    }

    /**
     * Test the saved provider credentials and the values currently visible in
     * Settings without persisting the endpoint or model.
     *
     * @return void
     */
    public function ajax_test_connection()
    {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('You do not have permission to test the provider.', 'zebracode-blog-ai')), 403);
        }

        check_ajax_referer('zebracode_blog_ai_test_connection', 'nonce');

        $provider_name = isset($_POST['provider']) && !is_array($_POST['provider']) ? sanitize_key(wp_unslash($_POST['provider'])) : '';
        $endpoint = isset($_POST['endpoint']) && !is_array($_POST['endpoint']) ? esc_url_raw(wp_unslash($_POST['endpoint'])) : '';
        $model = isset($_POST['model']) && !is_array($_POST['model']) ? sanitize_text_field(wp_unslash($_POST['model'])) : '';

        if (!in_array($provider_name, array('openai-compatible', 'gemini'), true)) {
            wp_send_json_error(array('message' => __('Select a supported provider first.', 'zebracode-blog-ai')), 400);
        }

        try {
            $provider = $provider_name === 'gemini'
                ? new Providers\GeminiProvider($this->settings)
                : new Providers\OpenAICompatibleProvider($this->settings);
            $overrides = array('endpoint' => $endpoint, 'model' => $model);
            $result = $provider->test_connection($overrides);
            $this->activity->log('connection_test', array('status' => 'completed', 'model' => $result['model'], 'models' => $result['models'], 'provider' => $provider_name));
            wp_send_json_success(array(
                'message' => sprintf(__('Connection succeeded for %1$s. The provider reported %2$d model(s).', 'zebracode-blog-ai'), $result['model'], $result['models']),
            ));
        } catch (\Throwable $exception) {
            $safe_message = sanitize_text_field($exception->getMessage());
            $this->activity->log('connection_test', array('status' => 'failed', 'message' => $safe_message, 'provider' => $provider_name));
            wp_send_json_error(array('message' => $safe_message !== '' ? $safe_message : __('Connection failed.', 'zebracode-blog-ai')), 400);
        }
    }

    /**
     * Queue a conservative refresh candidate from the WordPress post list.
     * The original post is never updated by this action.
     *
     * @return void
     */
    public function handle_refresh_request()
    {
        $post_id = isset($_POST['post_id']) && !is_array($_POST['post_id']) ? absint($_POST['post_id']) : 0;
        $redirect = wp_get_referer();
        if (!$redirect) {
            $redirect = admin_url('edit.php?post_type=post');
        }

        if (!current_user_can('edit_posts') || $post_id < 1 || !current_user_can('edit_post', $post_id)) {
            $this->redirect_refresh_result($redirect, 'error', __('You do not have permission to refresh this article.', 'zebracode-blog-ai'));
        }

        $nonce = isset($_POST['_zebracode_refresh_nonce']) && !is_array($_POST['_zebracode_refresh_nonce']) ? sanitize_text_field(wp_unslash($_POST['_zebracode_refresh_nonce'])) : '';
        if (!wp_verify_nonce($nonce, 'zebracode_blog_ai_refresh_' . $post_id)) {
            $this->redirect_refresh_result($redirect, 'error', __('The refresh form expired. Please try again.', 'zebracode-blog-ai'));
        }

        if (!get_post_meta($post_id, DraftRepository::GENERATED_META_KEY, true)) {
            $this->redirect_refresh_result($redirect, 'error', __('Only ZebraCode-generated articles can be refreshed safely from this list.', 'zebracode-blog-ai'));
        }

        $audit = $this->seo->audit($post_id);
        $score = isset($audit['summary']['score']) ? absint($audit['summary']['score']) : 100;
        if (!$audit['ok'] || $score >= 50) {
            $this->redirect_refresh_result($redirect, 'error', __('This article is not below the safe refresh threshold.', 'zebracode-blog-ai'));
        }

        try {
            $job = $this->queue->enqueue_refresh($post_id, get_current_user_id(), $audit);
            $candidate_id = isset($job['candidate_post_id']) ? absint($job['candidate_post_id']) : 0;
            $status = isset($job['status']) ? sanitize_key($job['status']) : 'queued';
            $message = $status === 'completed'
                ? __('A refresh candidate already exists for this article.', 'zebracode-blog-ai')
                : sprintf(__('A safe refresh was queued for this article. The original remains unchanged. Job: %s', 'zebracode-blog-ai'), isset($job['id']) ? $job['id'] : '');
            $this->redirect_refresh_result($redirect, $status, $message, $candidate_id);
        } catch (\Throwable $exception) {
            $this->redirect_refresh_result($redirect, 'error', __('The refresh could not be queued. Please check the provider settings and try again.', 'zebracode-blog-ai'));
        }
    }

    /**
     * Show the result of a refresh request after returning to the post list.
     *
     * @return void
     */
    public function render_refresh_notice()
    {
        if (!isset($_GET['zebracode_blog_ai_refresh']) || is_array($_GET['zebracode_blog_ai_refresh'])) {
            return;
        }

        $status = sanitize_key(wp_unslash($_GET['zebracode_blog_ai_refresh']));
        $message = isset($_GET['zebracode_blog_ai_refresh_message']) && !is_array($_GET['zebracode_blog_ai_refresh_message'])
            ? sanitize_text_field(wp_unslash($_GET['zebracode_blog_ai_refresh_message']))
            : '';
        $candidate_id = isset($_GET['zebracode_blog_ai_candidate']) && !is_array($_GET['zebracode_blog_ai_candidate']) ? absint($_GET['zebracode_blog_ai_candidate']) : 0;
        $class = $status === 'error' ? 'notice-error' : 'notice-success';
        $content = $message !== '' ? $message : __('Refresh request accepted. The original article remains unchanged.', 'zebracode-blog-ai');
        if ($candidate_id > 0 && current_user_can('edit_post', $candidate_id)) {
            $edit_url = get_edit_post_link($candidate_id, '');
            if ($edit_url) {
                $content .= ' ' . sprintf(__('Open candidate: %s', 'zebracode-blog-ai'), '<a href="' . esc_url($edit_url) . '">' . esc_html__('Review draft', 'zebracode-blog-ai') . '</a>');
            }
        }

        echo '<div class="notice ' . esc_attr($class) . ' is-dismissible"><p>' . wp_kses_post($content) . '</p></div>';
    }

    /**
     * Generate a featured image for an existing generated post without
     * changing its title or article content.
     *
     * @return void
     */
    public function handle_featured_image_request()
    {
        $post_id = isset($_POST['post_id']) && !is_array($_POST['post_id']) ? absint($_POST['post_id']) : 0;
        $redirect = wp_get_referer() ?: admin_url('edit.php?post_type=post');
        $nonce = isset($_POST['_zebracode_image_nonce']) && !is_array($_POST['_zebracode_image_nonce']) ? sanitize_text_field(wp_unslash($_POST['_zebracode_image_nonce'])) : '';

        if (!current_user_can('edit_posts') || $post_id < 1 || !current_user_can('edit_post', $post_id) || !wp_verify_nonce($nonce, 'zebracode_blog_ai_featured_image_' . $post_id)) {
            $this->redirect_refresh_result($redirect, 'error', __('You do not have permission to generate an image for this article.', 'zebracode-blog-ai'));
        }
        if (!get_post_meta($post_id, DraftRepository::GENERATED_META_KEY, true)) {
            $this->redirect_refresh_result($redirect, 'error', __('Only ZebraCode-generated articles can receive an automatic featured image.', 'zebracode-blog-ai'));
        }
        if (!$this->featured_image_generator || !method_exists($this->featured_image_generator, 'attach')) {
            $this->redirect_refresh_result($redirect, 'error', __('The featured image service is not available.', 'zebracode-blog-ai'));
        }

        try {
            $post = get_post($post_id);
            $article = array(
                'title' => $post ? $post->post_title : '',
                'excerpt' => $post ? $post->post_excerpt : '',
            );
            $brief = array(
                'topic' => $post ? $post->post_title : '',
                'category' => '',
                'featured_image' => true,
            );
            $attachment_id = $this->featured_image_generator->attach($post_id, $article, $brief, $this->settings->get()['model']);
            update_post_meta($post_id, '_zebracode_blog_ai_featured_image_status', 'completed');
            $this->activity->log('featured_image_completed', array('status' => 'completed', 'post_id' => $post_id, 'attachment_id' => $attachment_id, 'manual' => true));
            $this->redirect_refresh_result($redirect, 'success', __('The featured image was created and attached without changing the article content.', 'zebracode-blog-ai'));
        } catch (\Throwable $exception) {
            update_post_meta($post_id, '_zebracode_blog_ai_featured_image_status', 'failed');
            $this->activity->log('featured_image_failed', array('status' => 'failed', 'post_id' => $post_id, 'message' => sanitize_text_field($exception->getMessage()), 'manual' => true));
            $this->redirect_refresh_result($redirect, 'error', __('The featured image could not be created. Check the image model and provider settings.', 'zebracode-blog-ai'));
        }
    }

    /**
     * @param string $redirect
     * @param string $status
     * @param string $message
     * @param int    $candidate_id
     * @return void
     */
    private function redirect_refresh_result($redirect, $status, $message, $candidate_id = 0)
    {
        $args = array(
            'zebracode_blog_ai_refresh' => sanitize_key($status),
            'zebracode_blog_ai_refresh_message' => sanitize_text_field($message),
        );
        if ($candidate_id > 0) {
            $args['zebracode_blog_ai_candidate'] = absint($candidate_id);
        }

        wp_safe_redirect(add_query_arg($args, $redirect));
        exit;
    }

    private function handle_transport_diagnostics()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['zebracode_blog_ai_action']) || is_array($_POST['zebracode_blog_ai_action']) || sanitize_key(wp_unslash($_POST['zebracode_blog_ai_action'])) !== 'transport_diagnostics') {
            return null;
        }
        if (!current_user_can('manage_options')) {
            return null;
        }
        $nonce = isset($_POST['zebracode_blog_ai_diagnostics_nonce']) ? sanitize_text_field(wp_unslash($_POST['zebracode_blog_ai_diagnostics_nonce'])) : '';
        if (!wp_verify_nonce($nonce, 'zebracode_blog_ai_transport_diagnostics')) {
            return null;
        }
        return $this->diagnostics->run();
    }

    private function diagnostic_result_row($label, $result)
    {
        $result = is_array($result) ? $result : array('status' => 'fail', 'message' => 'No result.');
        $tone = isset($result['status']) && $result['status'] === 'pass' ? 'green' : (isset($result['status']) && $result['status'] === 'warning' ? 'amber' : 'violet');
        $message = isset($result['message']) ? $result['message'] : '';
        return '<div class="flex items-start justify-between gap-3 border-b border-slate-200 pb-3"><span class="text-sm font-medium text-slate-700">' . esc_html($label) . '<small class="mt-1 block text-xs font-normal text-slate-500">' . esc_html($message) . '</small></span>' . $this->badge(isset($result['http_status']) ? (string) $result['http_status'] : (isset($result['status']) ? $result['status'] : 'unknown'), $tone) . '</div>';
    }

    /**
     * Create a reusable content template from the Templates screen.
     *
     * @return string|null
     */
    private function handle_template_action()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['zebracode_blog_ai_action']) || is_array($_POST['zebracode_blog_ai_action'])) {
            return null;
        }

        if (sanitize_key(wp_unslash($_POST['zebracode_blog_ai_action'])) !== 'create_template') {
            return null;
        }

        if (!current_user_can('manage_options')) {
            return $this->notice(__('You do not have permission to create templates.', 'zebracode-blog-ai'), 'error');
        }

        $nonce = isset($_POST['zebracode_blog_ai_template_nonce']) ? sanitize_text_field(wp_unslash($_POST['zebracode_blog_ai_template_nonce'])) : '';
        if (!wp_verify_nonce($nonce, 'zebracode_blog_ai_template')) {
            return $this->notice(__('The template form expired. Please try again.', 'zebracode-blog-ai'), 'error');
        }

        $sections = preg_split('/\r\n|\r|\n/', $this->post_text('template_sections'));
        $result = $this->templates->create_template(array(
            'title' => $this->post_text('template_title'),
            'type' => $this->post_text('template_type'),
            'description' => $this->post_text('template_description'),
            'prompt' => $this->post_text('template_prompt'),
            'sections' => is_array($sections) ? $sections : array(),
            'defaults' => array('category' => 'Development', 'audience' => 'Intermediate', 'tone' => 'Clear and practical', 'faq' => true, 'seo' => true, 'links' => true),
        ));

        if (is_wp_error($result)) {
            return $this->notice($result->get_error_message(), 'error');
        }

        $this->activity->log('template_created', array('status' => 'completed', 'template_id' => $result['id']));
        return $this->notice(__('Template saved successfully. You can use it from the template list.', 'zebracode-blog-ai'), 'success');
    }

    private function handle_prompt_test(&$result)
    {
        if (!isset($_POST['zebracode_blog_ai_action']) || is_array($_POST['zebracode_blog_ai_action']) || sanitize_key(wp_unslash($_POST['zebracode_blog_ai_action'])) !== 'test_prompt') {
            return null;
        }
        if (!current_user_can('manage_options')) {
            return $this->notice(__('You do not have permission to run prompt tests.', 'zebracode-blog-ai'), 'error');
        }
        $nonce = isset($_POST['zebracode_blog_ai_prompt_nonce']) ? sanitize_text_field(wp_unslash($_POST['zebracode_blog_ai_prompt_nonce'])) : '';
        if (!wp_verify_nonce($nonce, 'zebracode_blog_ai_prompt_test')) {
            return $this->notice(__('The prompt test form expired. Please try again.', 'zebracode-blog-ai'), 'error');
        }
        $system = isset($_POST['prompt_system']) && !is_array($_POST['prompt_system']) ? wp_unslash($_POST['prompt_system']) : '';
        $user = isset($_POST['prompt_user']) && !is_array($_POST['prompt_user']) ? wp_unslash($_POST['prompt_user']) : '';
        try {
            $result = $this->prompt_tester->test($system, $user);
            return null;
        } catch (\Throwable $exception) {
            return $this->notice($exception->getMessage(), 'error');
        }
    }

    /**
     * Run a local SEO audit for a selected generated post.
     *
     * @return array|null
     */
    private function handle_seo_audit()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['zebracode_blog_ai_action']) || is_array($_POST['zebracode_blog_ai_action'])) {
            return null;
        }

        if (sanitize_key(wp_unslash($_POST['zebracode_blog_ai_action'])) !== 'audit_seo') {
            return null;
        }

        if (!current_user_can('edit_posts')) {
            return array('error' => __('You do not have permission to audit this article.', 'zebracode-blog-ai'));
        }

        $nonce = isset($_POST['zebracode_blog_ai_seo_nonce']) ? sanitize_text_field(wp_unslash($_POST['zebracode_blog_ai_seo_nonce'])) : '';
        if (!wp_verify_nonce($nonce, 'zebracode_blog_ai_seo_audit')) {
            return array('error' => __('The SEO audit form expired. Please try again.', 'zebracode-blog-ai'));
        }

        $post_id = isset($_POST['seo_post_id']) && !is_array($_POST['seo_post_id']) ? absint($_POST['seo_post_id']) : 0;
        if ($post_id < 1 || !current_user_can('edit_post', $post_id)) {
            return array('error' => __('Select a valid editable generated article.', 'zebracode-blog-ai'));
        }

        $audit = $this->seo->audit($post_id);
        if (!$audit['ok']) {
            return array('error' => $audit['error'], 'post_id' => $post_id);
        }

        $this->activity->log('seo_audit', array('status' => $audit['summary']['status'], 'post_id' => $post_id, 'score' => $audit['summary']['score']));

        return $audit;
    }

    /**
     * Run the non-generating provider health check from the Settings screen.
     *
     * @return string|null
     */
    private function handle_connection_test()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['zebracode_blog_ai_action']) || is_array($_POST['zebracode_blog_ai_action'])) {
            return null;
        }

        if (sanitize_key(wp_unslash($_POST['zebracode_blog_ai_action'])) !== 'test_connection') {
            return null;
        }

        if (!current_user_can('manage_options')) {
            return $this->notice(__('You do not have permission to test the provider.', 'zebracode-blog-ai'), 'error');
        }

        $nonce = isset($_POST['zebracode_blog_ai_test_nonce']) ? sanitize_text_field(wp_unslash($_POST['zebracode_blog_ai_test_nonce'])) : '';
        if (!wp_verify_nonce($nonce, 'zebracode_blog_ai_test_connection')) {
            return $this->notice(__('The connection test form expired. Please try again.', 'zebracode-blog-ai'), 'error');
        }

        try {
            $result = $this->provider->test_connection();
            $this->activity->log('connection_test', array('status' => 'completed', 'model' => $result['model'], 'models' => $result['models']));

            return $this->notice(sprintf(__('Connection succeeded for %1$s. The provider reported %2$d model(s).', 'zebracode-blog-ai'), $result['model'], $result['models']), 'success');
        } catch (\Throwable $exception) {
            $safe_message = sanitize_text_field($exception->getMessage());
            $this->activity->log('connection_test', array('status' => 'failed', 'message' => $safe_message));

            return $this->notice(sprintf(__('Connection failed: %s', 'zebracode-blog-ai'), $safe_message), 'error');
        }
    }

    /**
     * Handle the draft-only generation form.
     *
     * The provider and generator return content only. This method is the
     * WordPress boundary that validates the request and persists a Draft.
     *
     * @return string|null
     */
    private function handle_generation_request()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['zebracode_blog_ai_action']) || is_array($_POST['zebracode_blog_ai_action'])) {
            return null;
        }

        if (sanitize_key(wp_unslash($_POST['zebracode_blog_ai_action'])) !== 'generate_draft') {
            return null;
        }

        if (!current_user_can('edit_posts')) {
            return $this->notice(__('You do not have permission to generate drafts.', 'zebracode-blog-ai'), 'error');
        }

        $nonce = isset($_POST['zebracode_blog_ai_nonce']) ? sanitize_text_field(wp_unslash($_POST['zebracode_blog_ai_nonce'])) : '';
        if (!wp_verify_nonce($nonce, 'zebracode_blog_ai_generate')) {
            return $this->notice(__('The form expired. Please try again.', 'zebracode-blog-ai'), 'error');
        }

        $brief = array(
            'topic' => $this->post_text('topic'),
            'primary_keyword' => $this->post_text('primary_keyword'),
            'secondary_keywords' => $this->post_text('secondary_keywords'),
            'category' => $this->post_text('category'),
            'audience' => $this->post_text('audience'),
            'tone' => $this->post_text('tone'),
            'brief' => $this->post_text('brief'),
            'faq' => isset($_POST['faq']),
            'seo' => isset($_POST['seo']),
            'links' => isset($_POST['links']),
            'featured_image' => isset($_POST['featured_image']),
        );

        try {
            $job = $this->queue->enqueue($brief, get_current_user_id());
        } catch (\Throwable $exception) {
            return $this->notice(__('The generation job could not be queued. Please try again.', 'zebracode-blog-ai'), 'error');
        }

        $jobs_link = $this->page_url('zebracode-blog-ai-jobs');
        $message = sprintf(__('Generation queued as job %s. WordPress Cron will process it and create a Draft.', 'zebracode-blog-ai'), $job['id']);
        $message .= ' ' . sprintf('<a href="%s">%s</a>', esc_url($jobs_link), esc_html__('View jobs', 'zebracode-blog-ai'));

        return $this->notice($message, 'success', true);
    }

    /**
     * Persist the normalized article as a reviewable WordPress Draft.
     *
     * @param array $article
     * @param array $brief
     * @return int
     */
    private function create_draft(array $article, array $brief)
    {
        $post_id = wp_insert_post(
            array(
                'post_type' => 'post',
                'post_status' => 'draft',
                'post_author' => get_current_user_id(),
                'post_title' => sanitize_text_field($article['title']),
                'post_name' => sanitize_title($article['slug']),
                'post_excerpt' => sanitize_textarea_field($article['excerpt']),
                'post_content' => wp_kses_post($article['content']),
            ),
            true
        );

        if (is_wp_error($post_id)) {
            throw new \RuntimeException(__('WordPress could not create the draft.', 'zebracode-blog-ai'));
        }

        update_post_meta($post_id, '_zebracode_blog_ai_meta_description', sanitize_textarea_field($article['meta_description']));
        update_post_meta($post_id, '_zebracode_blog_ai_category', sanitize_text_field($article['category']));
        update_post_meta($post_id, '_zebracode_blog_ai_faq', wp_json_encode($article['faq'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        update_post_meta($post_id, '_zebracode_blog_ai_related_tools', wp_json_encode($article['related_tools'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        update_post_meta($post_id, '_zebracode_blog_ai_generated', current_time('mysql'));
        update_post_meta($post_id, '_zebracode_blog_ai_model', sanitize_text_field($this->settings->get()['model']));
        update_post_meta($post_id, '_zebracode_blog_ai_brief', wp_json_encode($brief, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        if (!empty($article['tags'])) {
            wp_set_post_tags($post_id, array_map('sanitize_text_field', $article['tags']), false);
        }

        $category_slug = sanitize_title($article['category']);
        $category = get_term_by('slug', $category_slug, 'category');
        if (!$category) {
            $category = get_term_by('name', $article['category'], 'category');
        }
        if ($category && !is_wp_error($category)) {
            wp_set_post_categories($post_id, array((int) $category->term_id), false);
        }

        return (int) $post_id;
    }

    /**
     * Read a bounded text field from the current POST request.
     *
     * @param string $key
     * @return string
     */
    private function post_text($key)
    {
        if (!isset($_POST[$key]) || is_array($_POST[$key])) {
            return '';
        }

        return sanitize_textarea_field(wp_unslash($_POST[$key]));
    }

    private function notice($message, $type = 'info', $allow_html = false)
    {
        $class = $type === 'success' ? 'notice-success' : ($type === 'error' ? 'notice-error' : 'notice-info');
        $content = $allow_html ? wp_kses_post($message) : esc_html($message);

        return '<div class="notice ' . esc_attr($class) . ' inline mb-6"><p>' . $content . '</p></div>';
    }

    private function event_summary($data)
    {
        if (!is_array($data) || empty($data)) {
            return __('No additional details', 'zebracode-blog-ai');
        }

        $summary = array();
        foreach (array('job_id', 'post_id', 'source_post_id', 'candidate_post_id', 'attempt', 'template_id', 'model', 'models', 'score', 'title', 'topic', 'message', 'reason') as $key) {
            if (isset($data[$key]) && is_scalar($data[$key]) && (string) $data[$key] !== '') {
                $summary[] = $key . ': ' . (string) $data[$key];
            }
        }

        return $summary ? implode(' · ', $summary) : __('No additional details', 'zebracode-blog-ai');
    }

    private function event_label($event)
    {
        $labels = array(
            'generation_queued' => __('Generation queued', 'zebracode-blog-ai'),
            'generation_retrying' => __('Generation retrying', 'zebracode-blog-ai'),
            'generation_completed' => __('Generation completed', 'zebracode-blog-ai'),
            'generation_failed' => __('Generation failed', 'zebracode-blog-ai'),
            'refresh_queued' => __('Refresh queued', 'zebracode-blog-ai'),
            'refresh_processing' => __('Refresh processing', 'zebracode-blog-ai'),
            'refresh_completed' => __('Refresh completed', 'zebracode-blog-ai'),
            'refresh_retrying' => __('Refresh retrying', 'zebracode-blog-ai'),
            'refresh_failed' => __('Refresh failed', 'zebracode-blog-ai'),
            'refresh_stale' => __('Refresh stale', 'zebracode-blog-ai'),
            'seo_audit' => __('SEO audit', 'zebracode-blog-ai'),
            'connection_test' => __('Connection test', 'zebracode-blog-ai'),
            'featured_image_completed' => __('Featured image completed', 'zebracode-blog-ai'),
            'featured_image_failed' => __('Featured image failed', 'zebracode-blog-ai'),
        );

        return isset($labels[$event]) ? $labels[$event] : (string) $event;
    }

    private function event_status_label($status)
    {
        $labels = array(
            'queued' => __('Queued', 'zebracode-blog-ai'),
            'processing' => __('Processing', 'zebracode-blog-ai'),
            'retrying' => __('Retrying', 'zebracode-blog-ai'),
            'completed' => __('Completed', 'zebracode-blog-ai'),
            'failed' => __('Failed', 'zebracode-blog-ai'),
            'stale' => __('Stale', 'zebracode-blog-ai'),
        );

        return isset($labels[$status]) ? $labels[$status] : (string) $status;
    }

    private function diagnostic_tile($label, $value, $tone)
    {
        return '<div class="rounded-xl border border-slate-200 bg-white p-3"><p class="text-xs font-semibold text-slate-500">' . esc_html($label) . '</p><div class="mt-2">' . $this->badge($value, $tone) . '</div></div>';
    }

    private function open_page($active, $title, $subtitle)
    {
        $rtl = function_exists('is_rtl') && is_rtl();
        $direction = $rtl ? 'rtl' : 'ltr';
        echo '<div dir="' . esc_attr($direction) . '" class="zc-admin-shell -mx-5 -my-2 min-h-screen bg-slate-50 px-5 py-7 text-slate-900 md:px-8 lg:px-10">';
        echo '<div class="zc-admin-container mx-auto max-w-7xl">';
        echo '<header class="zc-page-header mb-7 flex flex-wrap items-end justify-between gap-4">';
        echo '<div><div class="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400"><span>ZebraCode</span><span>/</span><span>Blog AI</span></div>';
        echo '<h1 class="text-3xl font-bold tracking-tight text-slate-950">' . esc_html($title) . '</h1>';
        echo '<p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">' . esc_html($subtitle) . '</p></div>';
        echo '<div class="flex items-center gap-2">' . $this->badge(__('Private workspace', 'zebracode-blog-ai'), 'slate') . '</div></header>';
        echo '<nav class="zc-page-nav mb-6 flex gap-1 overflow-x-auto border-b border-slate-200" aria-label="Blog AI sections">';
        $items = array(
            'dashboard' => array(__('Overview', 'zebracode-blog-ai'), 'zebracode-blog-ai'),
            'generate' => array(__('Generate', 'zebracode-blog-ai'), 'zebracode-blog-ai-generate'),
            'templates' => array(__('Templates', 'zebracode-blog-ai'), 'zebracode-blog-ai-templates'),
            'drafts' => array(__('Drafts', 'zebracode-blog-ai'), 'zebracode-blog-ai-drafts'),
            'seo' => array(__('SEO', 'zebracode-blog-ai'), 'zebracode-blog-ai-seo'),
            'jobs' => array(__('Jobs & logs', 'zebracode-blog-ai'), 'zebracode-blog-ai-jobs'),
            'prompt-lab' => array(__('Prompt lab', 'zebracode-blog-ai'), 'zebracode-blog-ai-prompt-lab'),
            'settings' => array(__('Settings', 'zebracode-blog-ai'), 'zebracode-blog-ai-settings'),
        );
        foreach ($items as $key => $item) {
            $class = $key === $active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900';
            echo '<a class="whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition ' . esc_attr($class) . '" href="' . esc_url($this->page_url($item[1])) . '">' . esc_html($item[0]) . '</a>';
        }
        echo '</nav>';
    }

    private function close_page()
    {
        echo '</div></div>';
    }

    private function page_url($page)
    {
        return admin_url('admin.php?page=' . rawurlencode($page));
    }

    private function metric_card($label, $value, $description, $tone)
    {
        $tones = array('green' => 'bg-emerald-50 text-emerald-700', 'amber' => 'bg-amber-50 text-amber-700', 'blue' => 'bg-blue-50 text-blue-700', 'violet' => 'bg-violet-50 text-violet-700', 'slate' => 'bg-slate-100 text-slate-600');
        return '<div class="zc-card zc-metric-card"><div class="flex items-start justify-between gap-3"><span class="text-sm font-medium text-slate-500">' . esc_html($label) . '</span><span class="rounded-full px-2.5 py-1 text-xs font-semibold ' . esc_attr(isset($tones[$tone]) ? $tones[$tone] : $tones['slate']) . '">●</span></div><p class="zc-metric-value mt-5 text-2xl font-bold tracking-tight text-slate-950">' . esc_html($value) . '</p><p class="mt-2 text-xs leading-5 text-slate-500">' . esc_html($description) . '</p></div>';
    }

    private function badge($label, $tone = 'slate')
    {
        $tones = array('green' => 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', 'amber' => 'bg-amber-50 text-amber-700 ring-amber-600/20', 'blue' => 'bg-blue-50 text-blue-700 ring-blue-600/20', 'violet' => 'bg-violet-50 text-violet-700 ring-violet-600/20', 'slate' => 'bg-slate-100 text-slate-600 ring-slate-500/20');
        return '<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ' . esc_attr(isset($tones[$tone]) ? $tones[$tone] : $tones['slate']) . '">' . esc_html($label) . '</span>';
    }

    private function button($label, $url, $variant = 'primary')
    {
        $classes = $variant === 'primary' ? 'zc-button zc-button-primary' : 'zc-button zc-button-secondary';
        return '<a class="' . esc_attr($classes) . '" href="' . esc_url($url) . '">' . esc_html($label) . '</a>';
    }

    private function workflow_item($number, $title, $status, $complete)
    {
        return '<li class="flex items-center gap-3"><span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ' . ($complete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500') . ' text-xs font-bold">' . esc_html($complete ? '✓' : $number) . '</span><span class="min-w-0 flex-1 text-sm font-medium text-slate-700">' . esc_html($title) . '</span><span class="text-xs text-slate-400">' . esc_html($status) . '</span></li>';
    }

    private function info_tile($icon, $title, $description)
    {
        return '<div class="rounded-xl border border-slate-200 bg-slate-50 p-4"><span class="text-lg text-blue-600">' . esc_html($icon) . '</span><h3 class="mt-3 text-sm font-semibold text-slate-900">' . esc_html($title) . '</h3><p class="mt-1 text-xs leading-5 text-slate-500">' . esc_html($description) . '</p></div>';
    }

    private function form_field($label, $name, $placeholder, $type = 'text', $classes = '', $value = '')
    {
        return '<label class="block ' . esc_attr($classes) . '"><span class="mb-2 block text-sm font-semibold text-slate-800">' . esc_html($label) . '</span><input class="zc-input" type="' . esc_attr($type) . '" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '" placeholder="' . esc_attr($placeholder) . '" /></label>';
    }

    private function form_select($label, $name, $options, $selected = '')
    {
        $html = '<label class="block"><span class="mb-2 block text-sm font-semibold text-slate-800">' . esc_html($label) . '</span><select class="zc-input" name="' . esc_attr($name) . '">';
        foreach ($options as $option) {
            $html .= '<option value="' . esc_attr($option) . '"' . selected($selected, $option, false) . '>' . esc_html($option) . '</option>';
        }
        return $html . '</select></label>';
    }

    private function form_textarea($label, $name, $placeholder, $rows = 5, $value = '')
    {
        return '<label class="block"><span class="mb-2 block text-sm font-semibold text-slate-800">' . esc_html($label) . '</span><textarea class="zc-input min-h-[' . absint($rows * 24) . 'px] resize-y" name="' . esc_attr($name) . '" rows="' . absint($rows) . '" placeholder="' . esc_attr($placeholder) . '">' . esc_textarea($value) . '</textarea></label>';
    }

    private function checkbox($name, $label, $checked)
    {
        return '<label class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"><input class="h-4 w-4 rounded border-slate-300 text-blue-600" type="checkbox" name="' . esc_attr($name) . '"' . ($checked ? ' checked' : '') . ' /><span>' . esc_html($label) . '</span></label>';
    }

    private function filter_pill($label, $active = false)
    {
        return '<button type="button" class="rounded-full border px-3 py-1.5 text-xs font-semibold ' . ($active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600') . '"' . ($active ? '' : ' disabled') . '>' . esc_html($label) . '</button>';
    }

    private function template_card($eyebrow, $title, $description, $count, $tone)
    {
        return '<article class="zc-card flex flex-col"><div class="flex items-center justify-between gap-3">' . $this->badge($eyebrow, $tone) . '<span class="text-xs text-slate-400">' . esc_html($count) . '</span></div><h2 class="mt-5 text-lg font-semibold text-slate-950">' . esc_html($title) . '</h2><p class="mt-2 flex-1 text-sm leading-6 text-slate-600">' . esc_html($description) . '</p><button type="button" class="zc-button zc-button-secondary mt-6 w-full" disabled>' . esc_html__('Use template', 'zebracode-blog-ai') . '</button></article>';
    }

    private function quality_row($label, $status, $tone)
    {
        $status_labels = array('pass' => __('Pass', 'zebracode-blog-ai'), 'warning' => __('Review', 'zebracode-blog-ai'), 'fail' => __('Needs work', 'zebracode-blog-ai'));
        $status_tones = array('pass' => 'green', 'warning' => 'amber', 'fail' => 'violet');
        $display_status = isset($status_labels[$status]) ? $status_labels[$status] : $status;
        $display_tone = isset($status_tones[$status]) ? $status_tones[$status] : $tone;

        return '<div class="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 last:border-0 last:pb-0"><span class="text-sm font-medium text-slate-700">' . esc_html($label) . '</span>' . $this->badge($display_status, $display_tone) . '</div>';
    }
}
