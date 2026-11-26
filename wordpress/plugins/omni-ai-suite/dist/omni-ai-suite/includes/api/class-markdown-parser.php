<?php
namespace OmniAI\Api;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Parses Markdown and Mermaid blocks into native WordPress Gutenberg block comments & HTML.
 * Includes styled callout placeholders for diagrams and visual assets without external API sideloading.
 */
class Markdown_Parser {

    /**
     * Renders a clean, modern dark-themed Gutenberg callout placeholder block for diagrams.
     *
     * @param string $code_or_prompt
     * @return string
     */
    public static function render_diagram_placeholder_block(string $code_or_prompt = ''): string {
        $clean = trim(html_entity_decode(strip_tags($code_or_prompt), ENT_QUOTES, 'UTF-8'));
        if (empty($clean)) {
            $clean = 'Technical architecture diagram or flowchart illustrating the concept above.';
        }
        $safe_code = esc_html($clean);
        $upload_url = admin_url('upload.php');

        return "\n<!-- wp:html -->\n" .
            "<div class=\"omni-diagram-callout-card\" style=\"margin:24px 0;padding:16px 20px;background:#0f172a;border:1px dashed #38bdf8;border-radius:10px;color:#f8fafc;direction:rtl;text-align:right;font-family:sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.2);\">\n" .
            "  <div style=\"display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;border-bottom:1px solid #1e293b;padding-bottom:10px;\">\n" .
            "    <div style=\"display:flex;align-items:center;gap:8px;\">\n" .
            "      <span style=\"font-size:18px;\">📊</span>\n" .
            "      <strong style=\"color:#38bdf8;font-size:14px;\">جایگاه دیاگرام / اینفوگرافیک معماری (Diagram Placeholder)</strong>\n" .
            "    </div>\n" .
            "    <div style=\"display:flex;gap:8px;flex-wrap:wrap;direction:ltr;align-items:center;\">\n" .
            "      <a href=\"#omni-media\" class=\"omni-open-media-btn\" data-type=\"diagram\" style=\"cursor:pointer;display:inline-flex;align-items:center;gap:6px;background:#0284c7;color:#ffffff;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;line-height:1.4;\">🖼️ باز کردن رسانه (انتخاب یا آپلود عکس)</a>\n" .
            "      <a href=\"#omni-copy\" class=\"omni-copy-btn\" data-prompt=\"{$safe_code}\" style=\"cursor:pointer;display:inline-flex;align-items:center;gap:6px;background:#1e293b;color:#38bdf8;border:1px solid #38bdf8;text-decoration:none;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:600;line-height:1.4;\">📋 کپی پرامپت</a>\n" .
            "    </div>\n" .
            "  </div>\n" .
            "  <p style=\"margin:0 0 8px 0;font-size:12px;color:#94a3b8;line-height:1.6;\">پرامپت تخصصی دیاگرام معماری (یک کلیک روی کادر زیر متن را برای کپی سریع انتخاب می‌کند):</p>\n" .
            "  <pre style=\"margin:0;font-size:12px;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:12px;direction:ltr;text-align:left;line-height:1.5;overflow-x:auto;white-space:pre-wrap;word-break:break-word;user-select:all;-webkit-user-select:all;\"><code>{$safe_code}</code></pre>\n" .
            "</div>\n<!-- /wp:html -->\n";
    }

    /**
     * Convert basic Markdown (Headings, Bold, Lists, Code, Tables) and Mermaid code blocks into native Gutenberg HTML blocks.
     *
     * @param string $text
     * @return string
     */
    public static function parse(string $text, string $diagram_prompt = ''): string {
        $text = trim($text);
        if (empty($text)) return '';

        $text = str_replace(["\r\n", "\r"], "\n", $text);

        // 1. Mermaid Code Blocks & [DIAGRAM_PLACEHOLDER] -> Styled Gutenberg Diagram Block (No external HTTP calls)
        $diagram_blocks = [];
        $text = preg_replace_callback('/```mermaid[\r\n]+([\s\S]*?)```/iu', function ($matches) use (&$diagram_blocks) {
            $inner = trim($matches[1]);
            $token = '%%DIAGRAM_DIV_' . count($diagram_blocks) . '%%';
            $diagram_blocks[$token] = self::render_diagram_placeholder_block($inner);
            return $token;
        }, $text);

        $text = preg_replace_callback('/\[DIAGRAM_PLACEHOLDER(?::\s*([^\]]+))?\]/iu', function ($matches) use (&$diagram_blocks, $diagram_prompt) {
            $prompt = !empty($matches[1]) ? trim($matches[1]) : trim($diagram_prompt);
            $token = '%%DIAGRAM_DIV_' . count($diagram_blocks) . '%%';
            $diagram_blocks[$token] = self::render_diagram_placeholder_block($prompt);
            return $token;
        }, $text);

        // 2. Generic Code Blocks (```python, ```js, etc.) -> Gutenberg Code
        $text = preg_replace_callback('/```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/u', function ($matches) {
            $lang = trim($matches[1]);
            $code = esc_html(trim($matches[2]));
            $class_attr = $lang ? " class=\"language-" . esc_attr($lang) . "\"" : '';
            return "<!-- wp:code -->\n<pre class=\"wp-block-code\"><code{$class_attr}>{$code}</code></pre>\n<!-- /wp:code -->";
        }, $text);

        // 3. Headings -> Gutenberg Headings
        $text = preg_replace('/^[ \t]*####[ \t]+([^\n]+)$/m', "<!-- wp:heading {\"level\":4} -->\n<h4>$1</h4>\n<!-- /wp:heading -->", $text);
        $text = preg_replace('/^[ \t]*###[ \t]+([^\n]+)$/m', "<!-- wp:heading {\"level\":3} -->\n<h3>$1</h3>\n<!-- /wp:heading -->", $text);
        $text = preg_replace('/^[ \t]*##[ \t]+([^\n]+)$/m', "<!-- wp:heading {\"level\":2} -->\n<h2>$1</h2>\n<!-- /wp:heading -->", $text);
        $text = preg_replace('/^[ \t]*#[ \t]+([^\n]+)$/m', "<!-- wp:heading {\"level\":2} -->\n<h2>$1</h2>\n<!-- /wp:heading -->", $text);

        // 4. Horizontal Separators
        $text = preg_replace('/^[ \t]*(\-{3,}|\*{3,}|_{3,})[ \t]*$/m', "<!-- wp:separator -->\n<hr class=\"wp-block-separator has-alpha-channel-opacity\"/>\n<!-- /wp:separator -->", $text);

        // 5. Blockquotes (> quote) -> Gutenberg Quote
        $text = preg_replace_callback('/(?:(?:^[ \t]*>[ \t]*.+?(?:\n|$))+)/m', function ($matches) {
            $lines = array_map(function ($l) {
                return trim(preg_replace('/^[ \t]*>[ \t]*/', '', $l));
            }, explode("\n", trim($matches[0])));
            $quote_body = nl2br(implode("\n", array_filter($lines)));
            return "<!-- wp:quote -->\n<blockquote class=\"wp-block-quote\"><p>{$quote_body}</p></blockquote>\n<!-- /wp:quote -->";
        }, $text);

        // 6. Tables -> Gutenberg Tables (Lenient Pipe Matching)
        $text = preg_replace_callback('/((?:(?:.*?[|].*?)[\n]+)+)/m', function ($matches) {
            $lines = array_filter(array_map('trim', explode("\n", trim($matches[0]))));
            $has_separator = false;
            foreach ($lines as $line) {
                if (preg_match('/^[|\s\-:]+$/', $line) && strpos($line, '-') !== false) {
                    $has_separator = true;
                    break;
                }
            }
            if (!$has_separator || count($lines) < 2) return $matches[0];

            $html = "<!-- wp:table -->\n<figure class=\"wp-block-table\"><table>\n";
            $is_head = true;
            foreach ($lines as $line) {
                if (preg_match('/^[|\s\-:]+$/', $line) && strpos($line, '-') !== false) {
                    $is_head = false;
                    $html .= "<tbody>\n";
                    continue;
                }
                $html .= $is_head ? "<thead><tr>" : "<tr>";
                $cells = explode('|', trim($line, '|'));
                foreach ($cells as $cell) {
                    $cell = preg_replace('/\*\*(.+?)\*\*/us', '<strong>$1</strong>', trim($cell));
                    $html .= $is_head ? "<th>$cell</th>" : "<td>$cell</td>";
                }
                $html .= $is_head ? "</tr></thead>\n" : "</tr>\n";
            }
            $html .= "</tbody>\n</table></figure>\n<!-- /wp:table -->";
            return $html;
        }, $text);

        // 7. Ordered Lists (1. 2. 3.) -> Gutenberg Ordered List
        $text = preg_replace_callback('/(?:(?:^[ \t]*\d+[\.\)][ \t]+.+?(?:\n|$))+)/m', function ($matches) {
            $lines = array_filter(array_map('trim', explode("\n", trim($matches[0]))));
            $html = "<!-- wp:list {\"ordered\":true} -->\n<ol>\n";
            foreach ($lines as $line) {
                $item = preg_replace('/^\d+[\.\)][ \t]+/u', '', $line);
                $item = preg_replace('/\*\*(.+?)\*\*/us', '<strong>$1</strong>', $item);
                $html .= "<li>$item</li>\n";
            }
            return $html . "</ol>\n<!-- /wp:list -->";
        }, $text);

        // 8. Unordered Lists (- or *) -> Gutenberg List
        $text = preg_replace_callback('/(?:(?:^[ \t]*[-*•][ \t]+.+?(?:\n|$))+)/m', function ($matches) {
            $lines = array_filter(array_map('trim', explode("\n", trim($matches[0]))));
            $html = "<!-- wp:list -->\n<ul>\n";
            foreach ($lines as $line) {
                $item = preg_replace('/^[-*•][ \t]+/u', '', $line);
                $item = preg_replace('/\*\*(.+?)\*\*/us', '<strong>$1</strong>', $item);
                $html .= "<li>$item</li>\n";
            }
            return $html . "</ul>\n<!-- /wp:list -->";
        }, $text);

        // 9. Inline Markdown: Links, Code, and Bold
        $text = preg_replace('/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/u', '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>', $text);
        $text = preg_replace('/`([^`\n]+)`/u', '<code>$1</code>', $text);
        $text = preg_replace('/\*\*(.+?)\*\*/us', '<strong>$1</strong>', $text);

        // 10. Paragraphs -> Gutenberg Paragraphs
        $blocks = explode("\n\n", $text);
        $parsed_blocks = [];
        foreach ($blocks as $block) {
            $block = trim($block);
            if (empty($block)) continue;

            // If it's already a Gutenberg block, keep it intact
            if (str_starts_with($block, '<!-- wp:')) {
                $parsed_blocks[] = $block;
            } elseif (preg_match('/^\[IMAGE(?:_PLACEHOLDER)?.*?\]$/isu', $block)) {
                // Standalone Image Placeholder: keep outside <p>
                $parsed_blocks[] = $block;
            } else {
                $block = nl2br($block);
                $parsed_blocks[] = "<!-- wp:paragraph -->\n<p>$block</p>\n<!-- /wp:paragraph -->";
            }
        }
        $text = implode("\n\n", $parsed_blocks);

        // 11. Restore Diagram Blocks
        if (!empty($diagram_blocks)) {
            $text = strtr($text, $diagram_blocks);
        }

        return $text;
    }

    /**
     * Convert clean Markdown text into native WordPress Gutenberg block comments & HTML.
     */
    public static function markdown_to_gutenberg(string $text): string {
        $text = trim($text);
        if (empty($text)) {
            return '';
        }

        $text = str_replace(["\r\n", "\r"], "\n", $text);
        $lines = explode("\n", $text);
        $blocks = [];
        $cur_list = [];
        $list_type = 'ul';
        $cur_table = [];
        $cur_para = [];
        $in_code = false;
        $code_buf = [];

        $flush_para = function () use (&$cur_para, &$blocks) {
            if (!empty($cur_para)) {
                $p_text = trim(implode("\n", $cur_para));
                if (!empty($p_text)) {
                    $p_html = self::format_inline_markdown($p_text);
                    $blocks[] = "<!-- wp:paragraph -->\n<p>{$p_html}</p>\n<!-- /wp:paragraph -->";
                }
                $cur_para = [];
            }
        };

        $flush_list = function () use (&$cur_list, &$list_type, &$blocks) {
            if (!empty($cur_list)) {
                $tag = ($list_type === 'ol') ? 'ol' : 'ul';
                $attrs = ($list_type === 'ol') ? ' {"ordered":true}' : '';
                $items_html = '';
                foreach ($cur_list as $li) {
                    $items_html .= "<li>" . self::format_inline_markdown($li) . "</li>\n";
                }
                $blocks[] = "<!-- wp:list{$attrs} -->\n<{$tag}>\n{$items_html}</{$tag}>\n<!-- /wp:list -->";
                $cur_list = [];
            }
        };

        $flush_table = function () use (&$cur_table, &$blocks) {
            if (!empty($cur_table)) {
                $table_html = self::render_markdown_table($cur_table);
                if (!empty($table_html)) {
                    $blocks[] = $table_html;
                }
                $cur_table = [];
            }
        };

        foreach ($lines as $line) {
            $trimmed = trim($line);

            // Code block delimiter
            if (str_starts_with($trimmed, '```')) {
                if ($in_code) {
                    $code_content = esc_html(implode("\n", $code_buf));
                    $lang_attr = !empty($in_code_lang) ? ' class="language-' . esc_attr($in_code_lang) . '"' : '';

                    if (!empty($in_code_lang) && $in_code_lang === 'mermaid') {
                        $blocks[] = self::render_diagram_placeholder_block(implode("\n", $code_buf));
                    } else {
                        $blocks[] = "<!-- wp:code -->\n<pre class=\"wp-block-code\"><code{$lang_attr}>{$code_content}</code></pre>\n<!-- /wp:code -->";
                    }

                    $in_code = false;
                    $code_buf = [];
                    $in_code_lang = '';
                } else {
                    $flush_para();
                    $flush_list();
                    $flush_table();
                    $in_code = true;
                    $in_code_lang = trim(substr($trimmed, 3));
                    $code_buf = [];
                }
                continue;
            }

            if ($in_code) {
                $code_buf[] = $line;
                continue;
            }

            // Headings
            if (preg_match('/^(#{1,6})\s+(.+)$/', $trimmed, $m)) {
                $flush_para();
                $flush_list();
                $flush_table();
                $level = strlen($m[1]);
                $h_text = self::format_inline_markdown(trim($m[2]));
                $blocks[] = "<!-- wp:heading {\"level\":{$level}} -->\n<h{$level}>{$h_text}</h{$level}>\n<!-- /wp:heading -->";
                continue;
            }

            // Horizontal Rule
            if (preg_match('/^(\*{3,}|-{3,}|_{3,})$/', $trimmed)) {
                $flush_para();
                $flush_list();
                $flush_table();
                $blocks[] = "<!-- wp:separator -->\n<hr class=\"wp-block-separator has-alpha-channel-opacity\"/>\n<!-- /wp:separator -->";
                continue;
            }

            // Blockquote
            if (str_starts_with($trimmed, '>')) {
                $flush_para();
                $flush_list();
                $flush_table();
                $q_text = self::format_inline_markdown(trim(substr($trimmed, 1)));
                $blocks[] = "<!-- wp:quote -->\n<blockquote class=\"wp-block-quote\"><p>{$q_text}</p></blockquote>\n<!-- /wp:quote -->";
                continue;
            }

            // Tables (lines starting or containing pipes)
            if (str_starts_with($trimmed, '|') || (str_contains($trimmed, '|') && !str_starts_with($trimmed, '-') && !str_starts_with($trimmed, '*'))) {
                $flush_para();
                $flush_list();
                $cur_table[] = $line;
                continue;
            } else {
                $flush_table();
            }

            // Unordered list items
            if (preg_match('/^[-*+]\s+(.+)$/', $trimmed, $m)) {
                $flush_para();
                $flush_table();
                if (!empty($cur_list) && $list_type !== 'ul') {
                    $flush_list();
                }
                $list_type = 'ul';
                $cur_list[] = $m[1];
                continue;
            }

            // Ordered list items
            if (preg_match('/^\d+\.\s+(.+)$/', $trimmed, $m)) {
                $flush_para();
                $flush_table();
                if (!empty($cur_list) && $list_type !== 'ol') {
                    $flush_list();
                }
                $list_type = 'ol';
                $cur_list[] = $m[1];
                continue;
            }

            // Diagram placeholder inline
            if (preg_match('/^\[DIAGRAM_PLACEHOLDER(?::\s*([^\]]+))?\]$/i', $trimmed, $m)) {
                $flush_para();
                $flush_list();
                $flush_table();
                $blocks[] = self::render_diagram_placeholder_block($m[1] ?? '');
                continue;
            }

            // Empty line
            if (empty($trimmed)) {
                $flush_para();
                $flush_list();
                $flush_table();
                continue;
            }

            // Regular paragraph line
            $cur_para[] = $line;
        }

        $flush_para();
        $flush_list();
        $flush_table();

        return implode("\n\n", $blocks);
    }

    public static function format_inline_markdown(string $text): string {
        $text = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>', $text);
        $text = preg_replace('/`([^`]+)`/', '<code>$1</code>', $text);
        $text = preg_replace('/\*\*([^*]+)\*\*/', '<strong>$1</strong>', $text);
        $text = preg_replace('/\*([^*]+)\*/', '<em>$1</em>', $text);
        return $text;
    }

    public static function render_markdown_table(array $table_lines): string {
        if (count($table_lines) < 2) {
            return '';
        }

        $header_line = array_shift($table_lines);
        $separator_line = array_shift($table_lines);

        $headers = array_values(array_filter(array_map('trim', explode('|', $header_line)), function ($v) {
            return $v !== '';
        }));

        $rows = [];
        foreach ($table_lines as $tl) {
            $cells = array_values(array_filter(array_map('trim', explode('|', $tl)), function ($v) {
                return $v !== '';
            }));
            if (!empty($cells)) {
                $rows[] = $cells;
            }
        }

        $html = "<!-- wp:table -->\n<figure class=\"wp-block-table\"><table>\n";
        if (!empty($headers)) {
            $html .= "<thead><tr>\n";
            foreach ($headers as $h) {
                $html .= "<th>" . self::format_inline_markdown($h) . "</th>\n";
            }
            $html .= "</tr></thead>\n";
        }

        $html .= "<tbody>\n";
        foreach ($rows as $r) {
            $html .= "<tr>\n";
            foreach ($r as $c) {
                $html .= "<td>" . self::format_inline_markdown($c) . "</td>\n";
            }
            $html .= "</tr>\n";
        }
        $html .= "</tbody>\n</table></figure>\n<!-- /wp:table -->";

        return $html;
    }

    /**
     * Backward compatibility wrapper: Render raw Mermaid diagram code to styled Gutenberg callout.
     *
     * @param string $inner_mermaid
     * @return string
     */
    public static function render_mermaid_code_to_image_block(string $inner_mermaid): string {
        return self::render_diagram_placeholder_block($inner_mermaid);
    }

    /**
     * Search and convert all Mermaid occurrences in content to Gutenberg diagram placeholder blocks.
     *
     * @param string $content
     * @return string
     */
    public static function convert_all_mermaid_in_content(string $content): string {
        // 1. Match HTML tags: <code class="...mermaid...">...</code> or <pre class="...mermaid...">...
        $content = preg_replace_callback('/<(?:pre|code|div)[^>]*class=[\'"][^\'"]*mermaid[^\'"]*[\'"][^>]*>([\s\S]*?)<\/(?:pre|code|div)>/iu', function ($m) {
            return self::render_diagram_placeholder_block($m[1]);
        }, $content);

        // 2. Match Markdown code blocks: ```mermaid ... ```
        $content = preg_replace_callback('/```(?:mermaid)?[\r\n]+((?:flowchart|graph|sequenceDiagram|mindmap|classDiagram|timeline)[\s\S]*?)```/iu', function ($m) {
            return self::render_diagram_placeholder_block($m[1]);
        }, $content);

        // 3. Match generic code blocks containing mermaid flowchart/sequence/mindmap
        $content = preg_replace_callback('/<code[^>]*>[\s\r\n]*((?:flowchart|graph|sequenceDiagram|mindmap|classDiagram)\s+[\s\S]*?)<\/code>/iu', function ($m) {
            return self::render_diagram_placeholder_block($m[1]);
        }, $content);

        // 4. Match [DIAGRAM_PLACEHOLDER]
        $content = preg_replace_callback('/\[DIAGRAM_PLACEHOLDER(?::\s*([^\]]+))?\]/iu', function ($m) {
            return self::render_diagram_placeholder_block($m[1] ?? '');
        }, $content);

        return $content;
    }
}
