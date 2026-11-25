<?php
namespace OmniAI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles frontend asset loading and styling for Omni AI Suite.
 */
class Assets {
    public static function init(): void {
        add_action('wp_enqueue_scripts', [self::class, 'enqueue_frontend_scripts']);
        add_action('wp_head', [self::class, 'inject_frontend_styles'], 100);
        add_filter('the_content', [self::class, 'filter_content_markup'], 20);
    }

    /**
     * Enqueue frontend scripts and styles if needed.
     */
    public static function enqueue_frontend_scripts(): void {
        // Enqueue if needed
    }

    /**
     * Filter content to make tables responsive and ensure proper table borders.
     */
    public static function filter_content_markup(string $content): string {
        if (is_admin() || !str_contains($content, '<table')) {
            return $content;
        }

        // Wrap raw tables in responsive container if not already wrapped
        if (!str_contains($content, 'omni-table-responsive')) {
            $content = preg_replace_callback('/<table\b([^>]*)>(.*?)<\/table>/is', function ($matches) {
                $attrs = $matches[1];
                $inner = $matches[2];
                if (!str_contains($attrs, 'class=')) {
                    $attrs .= ' class="omni-article-table"';
                } elseif (!str_contains($attrs, 'omni-article-table')) {
                    $attrs = preg_replace('/class=["\']([^"\']*)["\']/i', 'class="$1 omni-article-table"', $attrs);
                }
                return '<div class="omni-table-responsive"><table' . $attrs . '>' . $inner . '</table></div>';
            }, $content);
        }

        return $content;
    }

    /**
     * Inject modern, elegant styles for tables, callouts, and blockquotes on the frontend.
     */
    public static function inject_frontend_styles(): void {
        if (is_admin()) {
            return;
        }
        ?>
        <style id="omni-ai-article-styles">
            /* Omni AI Suite - Modern Content Table & Blockquote Styles */
            .omni-table-responsive {
                width: 100%;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                margin: 2rem 0;
            }
            .entry-content table,
            .post-content table,
            .wp-block-post-content table,
            article table,
            table.omni-article-table {
                width: 100% !important;
                border-collapse: collapse !important;
                margin: 1.5rem 0 !important;
                font-size: 0.95rem !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 8px !important;
                overflow: hidden !important;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04) !important;
                direction: rtl !important;
            }
            .entry-content table th,
            .post-content table th,
            .wp-block-post-content table th,
            article table th,
            table.omni-article-table th {
                background-color: #f1f5f9 !important;
                color: #0f172a !important;
                font-weight: 700 !important;
                padding: 12px 16px !important;
                text-align: right !important;
                border: 1px solid #cbd5e1 !important;
                border-bottom: 2px solid #94a3b8 !important;
            }
            .entry-content table td,
            .post-content table td,
            .wp-block-post-content table td,
            article table td,
            table.omni-article-table td {
                padding: 12px 16px !important;
                border: 1px solid #e2e8f0 !important;
                color: #334155 !important;
                line-height: 1.6 !important;
                text-align: right !important;
            }
            .entry-content table tbody tr:nth-child(even),
            .post-content table tbody tr:nth-child(even),
            .wp-block-post-content table tbody tr:nth-child(even),
            article table tbody tr:nth-child(even),
            table.omni-article-table tbody tr:nth-child(even) {
                background-color: #f8fafc !important;
            }
            .entry-content table tbody tr:hover,
            .post-content table tbody tr:hover,
            article table tbody tr:hover,
            table.omni-article-table tbody tr:hover {
                background-color: #f1f5f9 !important;
            }
            /* Modern Blockquote Styling */
            .entry-content blockquote,
            .post-content blockquote,
            article blockquote,
            blockquote.wp-block-quote {
                border-right: 4px solid #0284c7 !important;
                border-left: none !important;
                background-color: #f0f9ff !important;
                padding: 1rem 1.5rem !important;
                margin: 1.5rem 0 !important;
                border-radius: 0 8px 8px 0 !important;
                color: #0369a1 !important;
                font-style: normal !important;
            }
            .entry-content blockquote p,
            .post-content blockquote p,
            article blockquote p {
                margin: 0 !important;
                line-height: 1.8 !important;
            }
        </style>
        <?php
    }
}
