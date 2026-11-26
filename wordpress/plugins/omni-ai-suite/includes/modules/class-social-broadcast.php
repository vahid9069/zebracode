<?php
namespace OmniAI\Modules;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Social Broadcast Module: Auto-publishes newly deployed articles to Telegram and Bale channels.
 * Supports post-deploy webhooks, manual 1-click broadcast, and optional delete-on-draft cleanup.
 */
class Social_Broadcast implements Module_Interface {
    public const OPTION_SETTINGS = 'omni_ai_social_settings';
    public const META_POSTED     = '_omni_ai_social_posted';
    public const META_MESSAGES   = '_omni_ai_social_messages';

    public function get_id(): string {
        return 'social_broadcast';
    }

    public function get_title(): string {
        $is_fa = str_starts_with(get_user_locale(), 'fa') || is_rtl();
        return $is_fa ? 'انتشار خودکار در تلگرام، بله و روبیکا' : 'Social Broadcast (Telegram, Bale & Rubika)';
    }

    public function get_description(): string {
        $is_fa = str_starts_with(get_user_locale(), 'fa') || is_rtl();
        return $is_fa
            ? 'ارسال خودکار مقالات جدید پس از بیلد موفق وبلاگ به کانال‌های تلگرام، بله و روبیکا، با امکان ارسال تستی، دستی و حذف خودکار هنگام پیش‌نویس شدن.'
            : 'Automatically broadcast newly deployed blog articles to Telegram, Bale, and Rubika channels with test send, manual trigger, and optional delete-on-draft.';
    }

    public function is_active(): bool {
        $states = get_option('omni_ai_modules', []);
        return !isset($states[$this->get_id()]) || (bool) $states[$this->get_id()];
    }

    public function register(): void {
        add_action('transition_post_status', [$this, 'on_post_status_transition'], 10, 3);
    }

    /**
     * Get settings with defaults and auto-generated webhook secret.
     */
    public static function get_settings(): array {
        $saved = get_option(self::OPTION_SETTINGS, []);
        if (!is_array($saved)) {
            $saved = [];
        }

        if (empty($saved['webhook_secret'])) {
            $saved['webhook_secret'] = wp_generate_password(32, false, false);
            update_option(self::OPTION_SETTINGS, $saved, false);
        }

        return wp_parse_args($saved, [
            'webhook_secret'     => '',
            'blog_base_url'      => 'https://zebracode.ir/blog',
            'telegram_enabled'   => false,
            'telegram_bot_token' => '',
            'telegram_chat_id'   => '',
            'bale_enabled'       => false,
            'bale_bot_token'     => '',
            'bale_chat_id'       => '',
            'rubika_enabled'     => false,
            'rubika_bot_token'   => '',
            'rubika_chat_id'     => '',
            'delete_on_draft'    => false,
            'verify_live_url'    => true,
        ]);
    }

    /**
     * Handle post status transitions: optionally delete channel message when a published post moves back to draft/trash.
     */
    public function on_post_status_transition(string $new_status, string $old_status, \WP_Post $post): void {
        if ($post->post_type !== 'post') {
            return;
        }

        if ($old_status === 'publish' && in_array($new_status, ['draft', 'pending', 'private', 'trash'], true)) {
            $settings = self::get_settings();
            if (empty($settings['delete_on_draft'])) {
                return;
            }

            $messages = get_post_meta($post->ID, self::META_MESSAGES, true);
            if (!is_array($messages) || empty($messages)) {
                return;
            }

            if (!empty($messages['telegram']['message_id']) && !empty($settings['telegram_bot_token'])) {
                $chat_id = $messages['telegram']['chat_id'] ?? $settings['telegram_chat_id'];
                self::delete_from_channel('telegram', $settings['telegram_bot_token'], (string) $chat_id, (int) $messages['telegram']['message_id']);
            }

            if (!empty($messages['bale']['message_id']) && !empty($settings['bale_bot_token'])) {
                $chat_id = $messages['bale']['chat_id'] ?? $settings['bale_chat_id'];
                self::delete_from_channel('bale', $settings['bale_bot_token'], (string) $chat_id, (int) $messages['bale']['message_id']);
            }

            if (!empty($messages['rubika']['message_id']) && !empty($settings['rubika_bot_token'])) {
                $chat_id = $messages['rubika']['chat_id'] ?? $settings['rubika_chat_id'];
                self::delete_from_rubika($settings['rubika_bot_token'], (string) $chat_id, (string) $messages['rubika']['message_id']);
            }

            delete_post_meta($post->ID, self::META_POSTED);
            delete_post_meta($post->ID, self::META_MESSAGES);
        }
    }

    /**
     * Build public Next.js article URL for a post.
     */
    public static function get_article_url(\WP_Post $post, string $blog_base_url): string {
        $base = rtrim(trim($blog_base_url), '/');
        if (empty($base)) {
            $base = 'https://zebracode.ir/blog';
        }
        $slug = rawurlencode($post->post_name);
        return "{$base}/articles/{$slug}/";
    }

    /**
     * Verify that the live static page returns HTTP 200 before broadcasting.
     */
    public static function is_url_live(string $url): bool {
        $res = wp_remote_head($url, [
            'timeout'     => 10,
            'redirection' => 3,
            'sslverify'   => apply_filters('https_ssl_verify', true),
        ]);

        if (is_wp_error($res)) {
            return false;
        }

        $code = (int) wp_remote_retrieve_response_code($res);
        if ($code === 405) {
            $get_res = wp_remote_get($url, [
                'timeout'     => 10,
                'redirection' => 3,
                'sslverify'   => apply_filters('https_ssl_verify', true),
            ]);
            if (is_wp_error($get_res)) {
                return false;
            }
            $code = (int) wp_remote_retrieve_response_code($get_res);
        }

        return $code >= 200 && $code < 300;
    }

    /**
     * Build rich HTML-formatted caption for Telegram/Bale.
     */
    public static function format_caption(\WP_Post $post, string $utm_url): string {
        $title = esc_html(wp_strip_all_tags($post->post_title));

        $raw_desc = (string) get_post_meta($post->ID, '_omni_ai_meta_description', true);
        if (empty($raw_desc)) {
            $raw_desc = (string) get_post_meta($post->ID, 'rank_math_description', true);
        }
        if (empty($raw_desc)) {
            $raw_desc = has_excerpt($post) ? $post->post_excerpt : wp_strip_all_tags($post->post_content);
        }

        $clean_desc = trim(preg_replace('/\s+/u', ' ', wp_strip_all_tags($raw_desc)));
        if (mb_strlen($clean_desc, 'UTF-8') > 240) {
            $clean_desc = mb_substr($clean_desc, 0, 237, 'UTF-8') . '...';
        }
        $safe_desc = esc_html($clean_desc);

        $tags = wp_get_post_tags($post->ID, ['fields' => 'names']);
        $hashtags = [];
        if (is_array($tags)) {
            foreach (array_slice($tags, 0, 4) as $tag) {
                $t = preg_replace('/[^\p{L}\p{N}_]+/u', '_', trim((string) $tag));
                $t = trim($t, '_');
                if (!empty($t)) {
                    $hashtags[] = '#' . $t;
                }
            }
        }
        if (empty($hashtags)) {
            $hashtags[] = '#زبراکد';
        } else {
            $hashtags[] = '#زبراکد';
        }
        $hashtags_line = implode(' ', array_unique($hashtags));

        $caption = "📢 <b>{$title}</b>\n\n";
        if (!empty($safe_desc)) {
            $caption .= "{$safe_desc}\n\n";
        }
        $caption .= "🔗 <a href=\"" . esc_url($utm_url) . "\">مطالعه مقاله کامل در وبلاگ زبراکد</a>\n\n";
        $caption .= $hashtags_line;

        return $caption;
    }

    /**
     * Build clean plain-text caption for Rubika (Rubika Bot API v3 renders plain text).
     */
    public static function format_plain_caption(\WP_Post $post, string $utm_url): string {
        $title = trim(wp_strip_all_tags($post->post_title));

        $raw_desc = (string) get_post_meta($post->ID, '_omni_ai_meta_description', true);
        if (empty($raw_desc)) {
            $raw_desc = (string) get_post_meta($post->ID, 'rank_math_description', true);
        }
        if (empty($raw_desc)) {
            $raw_desc = has_excerpt($post) ? $post->post_excerpt : wp_strip_all_tags($post->post_content);
        }

        $clean_desc = trim(preg_replace('/\s+/u', ' ', wp_strip_all_tags($raw_desc)));
        if (mb_strlen($clean_desc, 'UTF-8') > 240) {
            $clean_desc = mb_substr($clean_desc, 0, 237, 'UTF-8') . '...';
        }

        $tags = wp_get_post_tags($post->ID, ['fields' => 'names']);
        $hashtags = [];
        if (is_array($tags)) {
            foreach (array_slice($tags, 0, 4) as $tag) {
                $t = preg_replace('/[^\p{L}\p{N}_]+/u', '_', trim((string) $tag));
                $t = trim($t, '_');
                if (!empty($t)) {
                    $hashtags[] = '#' . $t;
                }
            }
        }
        $hashtags[] = '#زبراکد';
        $hashtags_line = implode(' ', array_unique($hashtags));

        $text = "📢 {$title}\n\n";
        if (!empty($clean_desc)) {
            $text .= "{$clean_desc}\n\n";
        }
        $text .= "🔗 مطالعه مقاله کامل در وبلاگ زبراکد:\n{$utm_url}\n\n";
        $text .= $hashtags_line;

        return $text;
    }

    /**
     * Send message via Rubika Bot API v3.
     */
    public static function send_to_rubika(string $token, string $chat_id, string $text): array {
        $token = trim($token);
        $chat_id = trim($chat_id);
        if (empty($token) || empty($chat_id)) {
            return ['success' => false, 'error' => 'توکن یا شناسه کانال روبیکا تنظیم نشده است.'];
        }

        $url = "https://botapi.rubika.ir/v3/{$token}/sendMessage";
        $res = wp_remote_post($url, [
            'timeout' => 20,
            'headers' => ['Content-Type' => 'application/json'],
            'body'    => wp_json_encode([
                'chat_id' => $chat_id,
                'text'    => $text,
            ]),
        ]);

        if (is_wp_error($res)) {
            return ['success' => false, 'error' => $res->get_error_message()];
        }

        $body = json_decode(wp_remote_retrieve_body($res), true);
        $status = $body['status'] ?? '';
        $msg_id = $body['data']['message_id'] ?? ($body['result']['message_id'] ?? '');

        if ($status === 'OK' || !empty($msg_id)) {
            return [
                'success'    => true,
                'message_id' => (string) $msg_id,
                'chat_id'    => $chat_id,
                'method'     => 'rubika_sendMessage',
            ];
        }

        $err = $body['status_det'] ?? ($body['message'] ?? ('HTTP ' . wp_remote_retrieve_response_code($res)));
        return ['success' => false, 'error' => (string) $err];
    }

    /**
     * Delete message via Rubika Bot API v3.
     */
    public static function delete_from_rubika(string $token, string $chat_id, string $message_id): bool {
        $token = trim($token);
        $chat_id = trim($chat_id);
        if (empty($token) || empty($chat_id) || empty($message_id)) {
            return false;
        }

        $url = "https://botapi.rubika.ir/v3/{$token}/deleteMessage";
        $res = wp_remote_post($url, [
            'timeout' => 15,
            'headers' => ['Content-Type' => 'application/json'],
            'body'    => wp_json_encode([
                'chat_id'    => $chat_id,
                'message_id' => $message_id,
            ]),
        ]);

        if (is_wp_error($res)) {
            return false;
        }

        $body = json_decode(wp_remote_retrieve_body($res), true);
        return ($body['status'] ?? '') === 'OK';
    }

    /**
     * Send article message (with photo if available, falling back to text) to Telegram or Bale.
     */
    public static function send_to_channel(
        string $platform,
        string $token,
        string $chat_id,
        string $photo_url,
        string $caption,
        string $utm_url
    ): array {
        $token = trim($token);
        $chat_id = trim($chat_id);
        if (empty($token) || empty($chat_id)) {
            return ['success' => false, 'error' => 'توکن یا شناسه کانال تنظیم نشده است.'];
        }

        $api_base = ($platform === 'bale')
            ? "https://tapi.bale.me/bot{$token}/"
            : "https://api.telegram.org/bot{$token}/";

        $reply_markup = wp_json_encode([
            'inline_keyboard' => [
                [
                    [
                        'text' => 'مطالعه مقاله کامل 🔗',
                        'url'  => $utm_url,
                    ],
                ],
            ],
        ]);

        // 1. Try sendPhoto if featured image exists
        if (!empty($photo_url)) {
            $photo_payload = [
                'chat_id'      => $chat_id,
                'photo'        => $photo_url,
                'caption'      => $caption,
                'parse_mode'   => 'HTML',
                'reply_markup' => $reply_markup,
            ];

            $res = wp_remote_post($api_base . 'sendPhoto', [
                'timeout' => 20,
                'headers' => ['Content-Type' => 'application/json'],
                'body'    => wp_json_encode($photo_payload),
            ]);

            if (!is_wp_error($res)) {
                $body = json_decode(wp_remote_retrieve_body($res), true);
                if (!empty($body['ok']) && !empty($body['result']['message_id'])) {
                    return [
                        'success'    => true,
                        'message_id' => (int) $body['result']['message_id'],
                        'chat_id'    => $chat_id,
                        'method'     => 'sendPhoto',
                    ];
                }
            }
        }

        // 2. Fallback to sendMessage
        $msg_payload = [
            'chat_id'                  => $chat_id,
            'text'                     => $caption,
            'parse_mode'               => 'HTML',
            'disable_web_page_preview' => false,
            'reply_markup'             => $reply_markup,
        ];

        $res = wp_remote_post($api_base . 'sendMessage', [
            'timeout' => 20,
            'headers' => ['Content-Type' => 'application/json'],
            'body'    => wp_json_encode($msg_payload),
        ]);

        if (is_wp_error($res)) {
            return ['success' => false, 'error' => $res->get_error_message()];
        }

        $body = json_decode(wp_remote_retrieve_body($res), true);
        if (!empty($body['ok']) && !empty($body['result']['message_id'])) {
            return [
                'success'    => true,
                'message_id' => (int) $body['result']['message_id'],
                'chat_id'    => $chat_id,
                'method'     => 'sendMessage',
            ];
        }

        $err_desc = $body['description'] ?? ('HTTP ' . wp_remote_retrieve_response_code($res));
        return ['success' => false, 'error' => $err_desc];
    }

    /**
     * Delete an existing message from Telegram or Bale channel.
     */
    public static function delete_from_channel(string $platform, string $token, string $chat_id, int $message_id): bool {
        $token = trim($token);
        $chat_id = trim($chat_id);
        if (empty($token) || empty($chat_id) || $message_id <= 0) {
            return false;
        }

        $api_base = ($platform === 'bale')
            ? "https://tapi.bale.me/bot{$token}/"
            : "https://api.telegram.org/bot{$token}/";

        $res = wp_remote_post($api_base . 'deleteMessage', [
            'timeout' => 15,
            'headers' => ['Content-Type' => 'application/json'],
            'body'    => wp_json_encode([
                'chat_id'    => $chat_id,
                'message_id' => $message_id,
            ]),
        ]);

        if (is_wp_error($res)) {
            return false;
        }

        $body = json_decode(wp_remote_retrieve_body($res), true);
        return !empty($body['ok']);
    }

    /**
     * Broadcast a single published post to all enabled channels.
     */
    public static function broadcast_single_post(int $post_id, bool $force = false, ?bool $verify_live_override = null): array {
        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'post' || $post->post_status !== 'publish') {
            return ['success' => false, 'message' => 'فقط مقالات منتشرشده (publish) قابل ارسال به کانال هستند.'];
        }

        if (!$force && !empty(get_post_meta($post_id, self::META_POSTED, true))) {
            return ['success' => false, 'skipped' => true, 'message' => 'این مقاله قبلاً ارسال شده است.'];
        }

        $settings = self::get_settings();
        $tg_active = !empty($settings['telegram_enabled']) && !empty($settings['telegram_bot_token']) && !empty($settings['telegram_chat_id']);
        $bale_active = !empty($settings['bale_enabled']) && !empty($settings['bale_bot_token']) && !empty($settings['bale_chat_id']);
        $rubika_active = !empty($settings['rubika_enabled']) && !empty($settings['rubika_bot_token']) && !empty($settings['rubika_chat_id']);

        if (!$tg_active && !$bale_active && !$rubika_active) {
            return ['success' => false, 'message' => 'هیچ کانال فعالی (تلگرام، بله یا روبیکا) تنظیم نشده است.'];
        }

        $article_url = self::get_article_url($post, $settings['blog_base_url']);
        $should_verify = $verify_live_override !== null ? $verify_live_override : !empty($settings['verify_live_url']);

        if ($should_verify && !self::is_url_live($article_url)) {
            return [
                'success' => false,
                'not_live' => true,
                'message' => "آدرس مقاله هنوز روی سایت اصلی در دسترس نیست (404): {$article_url}",
            ];
        }

        $photo_url = '';
        $thumb_id = get_post_thumbnail_id($post_id);
        if ($thumb_id) {
            $photo_url = (string) wp_get_attachment_image_url($thumb_id, 'large');
        }

        $existing_msgs = get_post_meta($post_id, self::META_MESSAGES, true);
        if (!is_array($existing_msgs)) {
            $existing_msgs = [];
        }

        $results = [];
        $any_sent = false;

        if ($tg_active) {
            $tg_url = add_query_arg(['utm_source' => 'telegram', 'utm_medium' => 'social'], $article_url);
            $tg_caption = self::format_caption($post, $tg_url);
            $tg_res = self::send_to_channel('telegram', $settings['telegram_bot_token'], $settings['telegram_chat_id'], $photo_url, $tg_caption, $tg_url);
            $results['telegram'] = $tg_res;
            if (!empty($tg_res['success'])) {
                $any_sent = true;
                $existing_msgs['telegram'] = [
                    'chat_id'    => $tg_res['chat_id'],
                    'message_id' => $tg_res['message_id'],
                    'sent_at'    => current_time('mysql'),
                ];
            }
        }

        if ($bale_active) {
            $bale_url = add_query_arg(['utm_source' => 'bale', 'utm_medium' => 'social'], $article_url);
            $bale_caption = self::format_caption($post, $bale_url);
            $bale_res = self::send_to_channel('bale', $settings['bale_bot_token'], $settings['bale_chat_id'], $photo_url, $bale_caption, $bale_url);
            $results['bale'] = $bale_res;
            if (!empty($bale_res['success'])) {
                $any_sent = true;
                $existing_msgs['bale'] = [
                    'chat_id'    => $bale_res['chat_id'],
                    'message_id' => $bale_res['message_id'],
                    'sent_at'    => current_time('mysql'),
                ];
            }
        }

        if ($rubika_active) {
            $rubika_url = add_query_arg(['utm_source' => 'rubika', 'utm_medium' => 'social'], $article_url);
            $rubika_text = self::format_plain_caption($post, $rubika_url);
            $rubika_res = self::send_to_rubika($settings['rubika_bot_token'], $settings['rubika_chat_id'], $rubika_text);
            $results['rubika'] = $rubika_res;
            if (!empty($rubika_res['success'])) {
                $any_sent = true;
                $existing_msgs['rubika'] = [
                    'chat_id'    => $rubika_res['chat_id'],
                    'message_id' => $rubika_res['message_id'],
                    'sent_at'    => current_time('mysql'),
                ];
            }
        }

        if ($any_sent) {
            update_post_meta($post_id, self::META_POSTED, current_time('mysql'));
            update_post_meta($post_id, self::META_MESSAGES, $existing_msgs);
            return [
                'success' => true,
                'post_id' => $post_id,
                'title'   => $post->post_title,
                'results' => $results,
            ];
        }

        return [
            'success' => false,
            'post_id' => $post_id,
            'title'   => $post->post_title,
            'results' => $results,
            'message' => 'ارسال به کانال‌ها با خطا مواجه شد.',
        ];
    }

    /**
     * Broadcast all newly published posts that haven't been sent yet.
     */
    public static function broadcast_pending_posts(int $limit = 10): array {
        $posts = get_posts([
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => $limit,
            'orderby'        => 'date',
            'order'          => 'ASC',
            'meta_query'     => [
                [
                    'key'     => self::META_POSTED,
                    'compare' => 'NOT EXISTS',
                ],
            ],
        ]);

        if (empty($posts)) {
            return [
                'success' => true,
                'sent'    => 0,
                'failed'  => 0,
                'details' => [],
                'message' => 'هیچ مقاله جدیدِ ارسال‌نشده‌ای یافت نشد.',
            ];
        }

        $sent = 0;
        $failed = 0;
        $details = [];

        foreach ($posts as $p) {
            $res = self::broadcast_single_post($p->ID, false);
            if (!empty($res['success'])) {
                $sent++;
            } else {
                $failed++;
            }
            $details[] = $res;
        }

        return [
            'success' => $sent > 0 || $failed === 0,
            'sent'    => $sent,
            'failed'  => $failed,
            'details' => $details,
            'message' => sprintf('%d مقاله با موفقیت به کانال‌ها ارسال شد (%d ناموفق).', $sent, $failed),
        ];
    }

    /**
     * Send a test message to a specific platform (for staging/testing verification).
     */
    public static function send_test_message(string $platform): array {
        $settings = self::get_settings();
        $site_url = home_url('/');
        $time_str = current_time('Y/m/d H:i');

        if ($platform === 'telegram') {
            $msg = "🧪 <b>پیام آزمایشی Omni AI Suite</b>\n\nاتصال ربات تلگرام به کانال با موفقیت برقرار شد.\n🌐 مبدا: {$site_url}\n🕒 زمان: {$time_str}";
            return self::send_to_channel('telegram', $settings['telegram_bot_token'], $settings['telegram_chat_id'], '', $msg, $settings['blog_base_url']);
        }

        if ($platform === 'bale') {
            $msg = "🧪 <b>پیام آزمایشی Omni AI Suite</b>\n\nاتصال ربات بله به کانال با موفقیت برقرار شد.\n🌐 مبدا: {$site_url}\n🕒 زمان: {$time_str}";
            return self::send_to_channel('bale', $settings['bale_bot_token'], $settings['bale_chat_id'], '', $msg, $settings['blog_base_url']);
        }

        if ($platform === 'rubika') {
            $msg = "🧪 پیام آزمایشی Omni AI Suite\n\nاتصال ربات روبیکا به کانال با موفقیت برقرار شد.\n🌐 مبدا: {$site_url}\n🕒 زمان: {$time_str}";
            return self::send_to_rubika($settings['rubika_bot_token'], $settings['rubika_chat_id'], $msg);
        }

        return ['success' => false, 'error' => 'پلتفرم نامعتبر است.'];
    }
}
