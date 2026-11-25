<?php
namespace OmniAI\Modules;

use OmniAI\Providers\Provider_Factory;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Google Search Console Module
 * Handles Service Account authentication via pure PHP JWT,
 * multi-property Search Analytics fetching, and AI-driven diagnostic fix recommendations.
 */
class Search_Console_Module implements Module_Interface {
    const OPTION_CREDENTIALS = 'omni_ai_gsc_credentials';
    const TRANSIENT_TOKEN   = 'omni_ai_gsc_access_token';
    const GSC_SCOPE         = 'https://www.googleapis.com/auth/webmasters.readonly';

    public function get_id(): string {
        return 'search_console';
    }

    public function get_title(): string {
        return __('Google Search Console', 'omni-ai-suite');
    }

    public function get_description(): string {
        return __('اتصال به سرچ کنسول، گزارش عملکرد کلمات و صفحات به تفکیک هر پراپرتی و تحلیل و رفع عیوب با هوش مصنوعی', 'omni-ai-suite');
    }

    public function is_active(): bool {
        return true;
    }

    public function register(): void {
        // Module hooks if any
    }

    /**
     * Check if GSC Service Account is configured and valid.
     */
    public static function is_configured(): bool {
        $creds = get_option(self::OPTION_CREDENTIALS, []);
        return !empty($creds['client_email']) && !empty($creds['private_key']);
    }

    /**
     * Get the configured service account email.
     */
    public static function get_service_account_email(): ?string {
        $creds = get_option(self::OPTION_CREDENTIALS, []);
        return $creds['client_email'] ?? null;
    }

    /**
     * Save and validate Google Service Account JSON credentials.
     */
    public static function save_credentials(array $json_data): array {
        if (empty($json_data['client_email']) || empty($json_data['private_key'])) {
            return [
                'success' => false,
                'message' => __('فایل کلید نامعتبر است. فیلدهای client_email و private_key یافت نشدند.', 'omni-ai-suite'),
            ];
        }

        // Test private key format with openssl
        $pk = openssl_pkey_get_private($json_data['private_key']);
        if (!$pk) {
            return [
                'success' => false,
                'message' => __('کلید خصوصی (private_key) نامعتبر است و توسط OpenSSL خوانده نشد.', 'omni-ai-suite'),
            ];
        }

        update_option(self::OPTION_CREDENTIALS, [
            'client_email' => sanitize_email($json_data['client_email']),
            'private_key'  => $json_data['private_key'],
            'project_id'   => sanitize_text_field($json_data['project_id'] ?? ''),
            'connected_at' => current_time('mysql'),
        ]);

        delete_transient(self::TRANSIENT_TOKEN);

        // Verify token generation immediately
        $token = self::get_access_token(true);
        if (!$token) {
            return [
                'success' => false,
                'message' => __('اطلاعات ذخیره شد اما دریافت توکن از گوگل با خطا مواجه شد. لطفاً دسترسی‌های سرویس‌اکانت و ساعت سرور را بررسی کنید.', 'omni-ai-suite'),
            ];
        }

        return [
            'success'      => true,
            'client_email' => $json_data['client_email'],
            'message'      => __('اتصال با موفقیت برقرار شد.', 'omni-ai-suite'),
        ];
    }

    /**
     * Clear credentials (disconnect).
     */
    public static function clear_credentials(): bool {
        delete_transient(self::TRANSIENT_TOKEN);
        return delete_option(self::OPTION_CREDENTIALS);
    }

    /**
     * Generate or return cached Google OAuth2 Access Token via pure PHP JWT.
     */
    public static function get_access_token(bool $force_refresh = false): ?string {
        if (!$force_refresh) {
            $cached = get_transient(self::TRANSIENT_TOKEN);
            if (!empty($cached)) {
                return $cached;
            }
        }

        $creds = get_option(self::OPTION_CREDENTIALS, []);
        if (empty($creds['client_email']) || empty($creds['private_key'])) {
            return null;
        }

        $now = time();
        $header = ['alg' => 'RS256', 'typ' => 'JWT'];
        $claims = [
            'iss'   => $creds['client_email'],
            'scope' => self::GSC_SCOPE,
            'aud'   => 'https://oauth2.googleapis.com/token',
            'exp'   => $now + 3600,
            'iat'   => $now,
        ];

        $b64_header = self::base64_url_encode(wp_json_encode($header));
        $b64_claims = self::base64_url_encode(wp_json_encode($claims));
        $signature_input = $b64_header . '.' . $b64_claims;

        $private_key = openssl_pkey_get_private($creds['private_key']);
        if (!$private_key) {
            return null;
        }

        $signature = '';
        $success = openssl_sign($signature_input, $signature, $private_key, OPENSSL_ALGO_SHA256);
        if (!$success) {
            return null;
        }

        $jwt = $signature_input . '.' . self::base64_url_encode($signature);

        $response = wp_remote_post('https://oauth2.googleapis.com/token', [
            'timeout' => 20,
            'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
            'body'    => http_build_query([
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]),
        ]);

        if (is_wp_error($response)) {
            error_log('OmniAI GSC Token Error: ' . $response->get_error_message());
            return null;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        if (empty($body['access_token'])) {
            error_log('OmniAI GSC Token Response: ' . wp_remote_retrieve_body($response));
            return null;
        }

        $token = $body['access_token'];
        $expires_in = intval($body['expires_in'] ?? 3600);
        // Cache token slightly less than expiry (e.g. 50 minutes)
        set_transient(self::TRANSIENT_TOKEN, $token, max(300, $expires_in - 300));

        return $token;
    }

    private static function base64_url_encode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * List all sites/properties available to this service account in Google Search Console.
     */
    public static function get_sites(): array {
        $token = self::get_access_token();
        if (!$token) {
            return ['error' => 'not_authenticated', 'message' => __('عدم احراز هویت با گوگل.', 'omni-ai-suite')];
        }

        $response = wp_remote_get('https://www.googleapis.com/webmasters/v3/sites', [
            'timeout' => 20,
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Accept'        => 'application/json',
            ],
        ]);

        if (is_wp_error($response)) {
            return ['error' => 'network_error', 'message' => $response->get_error_message()];
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);
        $entries = $data['siteEntry'] ?? [];

        $formatted = [];
        foreach ($entries as $site) {
            $url = $site['siteUrl'] ?? '';
            $permission = $site['permissionLevel'] ?? '';
            $label = $url;
            $type = 'url';
            if (str_starts_with($url, 'sc-domain:')) {
                $label = substr($url, 10) . ' (Domain Property)';
                $type = 'domain';
            }

            $formatted[] = [
                'siteUrl'         => $url,
                'label'           => $label,
                'type'            => $type,
                'permissionLevel' => $permission,
            ];
        }

        // Merge custom manually added properties
        $custom_sites = get_option('omni_ai_gsc_custom_sites', []);
        if (is_array($custom_sites)) {
            foreach ($custom_sites as $c_url) {
                $c_url = trim((string) $c_url);
                if (empty($c_url)) continue;
                $exists = false;
                foreach ($formatted as $f) {
                    if (rtrim($f['siteUrl'], '/') === rtrim($c_url, '/')) {
                        $exists = true;
                        break;
                    }
                }
                if (!$exists) {
                    $is_domain = str_starts_with($c_url, 'sc-domain:');
                    $formatted[] = [
                        'siteUrl'         => $c_url,
                        'label'           => ($is_domain ? substr($c_url, 10) : $c_url) . ' (دستی)',
                        'type'            => $is_domain ? 'domain' : 'url',
                        'permissionLevel' => 'custom',
                        'is_custom'       => true,
                    ];
                }
            }
        }

        return ['success' => true, 'sites' => $formatted];
    }

    /**
     * Add a custom property manually.
     */
    public static function add_custom_site(string $url): array {
        $url = trim($url);
        if (empty($url)) {
            return ['error' => 'empty_url', 'message' => __('آدرس پراپرتی نمی‌تواند خالی باشد.', 'omni-ai-suite')];
        }

        // If it's a domain without protocol or sc-domain, format appropriately
        if (!str_starts_with($url, 'http://') && !str_starts_with($url, 'https://') && !str_starts_with($url, 'sc-domain:')) {
            $url = 'https://' . rtrim($url, '/') . '/';
        }

        $custom = get_option('omni_ai_gsc_custom_sites', []);
        if (!is_array($custom)) {
            $custom = [];
        }

        if (!in_array($url, $custom, true)) {
            $custom[] = $url;
            update_option('omni_ai_gsc_custom_sites', $custom);
        }

        return self::get_sites();
    }

    /**
     * Remove a custom property.
     */
    public static function remove_custom_site(string $url): array {
        $url = trim($url);
        $custom = get_option('omni_ai_gsc_custom_sites', []);
        if (is_array($custom)) {
            $custom = array_values(array_filter($custom, fn($item) => rtrim($item, '/') !== rtrim($url, '/')));
            update_option('omni_ai_gsc_custom_sites', $custom);
        }

        return self::get_sites();
    }

    /**
     * Query Search Analytics data from Google Search Console.
     */
    public static function get_search_analytics(
        string $site_url,
        string $start_date,
        string $end_date,
        string $dimension = 'query',
        int $row_limit = 100
    ): array {
        $token = self::get_access_token();
        if (!$token) {
            return ['error' => 'not_authenticated', 'message' => __('عدم احراز هویت با گوگل.', 'omni-ai-suite')];
        }

        $encoded_site = rawurlencode($site_url);
        $endpoint = "https://www.googleapis.com/webmasters/v3/sites/{$encoded_site}/searchAnalytics/query";

        // 1. Fetch dimension data (e.g. queries or pages)
        $body = [
            'startDate'  => $start_date,
            'endDate'    => $end_date,
            'dimensions' => [$dimension],
            'rowLimit'   => $row_limit,
        ];

        $response = wp_remote_post($endpoint, [
            'timeout' => 30,
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type'  => 'application/json',
                'Accept'        => 'application/json',
            ],
            'body'    => wp_json_encode($body),
        ]);

        if (is_wp_error($response)) {
            return ['error' => 'network_error', 'message' => $response->get_error_message()];
        }

        $code = wp_remote_retrieve_response_code($response);
        $raw = json_decode(wp_remote_retrieve_body($response), true);

        if ($code !== 200) {
            $msg = $raw['error']['message'] ?? __('خطا در دریافت اطلاعات از سرچ کنسول.', 'omni-ai-suite');
            return ['error' => 'api_error', 'message' => $msg];
        }

        $rows = $raw['rows'] ?? [];

        // 2. Fetch overall site summary (aggregate without dimensions)
        $summary_res = wp_remote_post($endpoint, [
            'timeout' => 20,
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type'  => 'application/json',
                'Accept'        => 'application/json',
            ],
            'body'    => wp_json_encode([
                'startDate' => $start_date,
                'endDate'   => $end_date,
            ]),
        ]);

        $summary = [
            'clicks'      => 0,
            'impressions' => 0,
            'ctr'         => 0,
            'position'    => 0,
        ];

        if (!is_wp_error($summary_res)) {
            $s_data = json_decode(wp_remote_retrieve_body($summary_res), true);
            if (!empty($s_data['rows'][0])) {
                $row0 = $s_data['rows'][0];
                $summary['clicks']      = intval($row0['clicks'] ?? 0);
                $summary['impressions'] = intval($row0['impressions'] ?? 0);
                $summary['ctr']         = round(($row0['ctr'] ?? 0) * 100, 2);
                $summary['position']    = round($row0['position'] ?? 0, 1);
            }
        }

        // Format dimension rows
        $formatted_rows = [];
        foreach ($rows as $r) {
            $key = $r['keys'][0] ?? '';
            $clicks = intval($r['clicks'] ?? 0);
            $impressions = intval($r['impressions'] ?? 0);
            $ctr = round(($r['ctr'] ?? 0) * 100, 2);
            $position = round($r['position'] ?? 0, 1);

            $formatted_rows[] = [
                'name'        => $key,
                'clicks'      => $clicks,
                'impressions' => $impressions,
                'ctr'         => $ctr,
                'position'    => $position,
            ];
        }

        return [
            'success'   => true,
            'siteUrl'   => $site_url,
            'dateRange' => ['start' => $start_date, 'end' => $end_date],
            'summary'   => $summary,
            'rows'      => $formatted_rows,
        ];
    }

    /**
     * Compute actionable SEO opportunities:
     * - Striking distance queries (position 11-20)
     * - High impression / low CTR queries (CTR < 2% and position <= 10)
     * - Top performing keywords
     */
    public static function analyze_opportunities(array $queries): array {
        $striking_distance = [];
        $low_ctr_opportunities = [];
        $top_performers = [];

        foreach ($queries as $q) {
            $pos = $q['position'];
            $ctr = $q['ctr'];
            $imp = $q['impressions'];
            $clicks = $q['clicks'];

            if ($pos > 10.0 && $pos <= 20.0 && $imp >= 5) {
                $striking_distance[] = $q;
            }

            if ($pos <= 10.0 && $ctr < 2.5 && $imp >= 20) {
                $low_ctr_opportunities[] = $q;
            }

            if ($clicks >= 10 || ($imp >= 50 && $pos <= 5)) {
                $top_performers[] = $q;
            }
        }

        // Sort by impressions descending
        usort($striking_distance, fn($a, $b) => $b['impressions'] <=> $a['impressions']);
        usort($low_ctr_opportunities, fn($a, $b) => $b['impressions'] <=> $a['impressions']);
        usort($top_performers, fn($a, $b) => $b['clicks'] <=> $a['clicks']);

        return [
            'striking_distance' => array_slice($striking_distance, 0, 15),
            'low_ctr'           => array_slice($low_ctr_opportunities, 0, 15),
            'top_performers'    => array_slice($top_performers, 0, 15),
        ];
    }

    /**
     * Run AI Diagnostics on Search Console performance data and generate prioritized action fixes.
     */
    public static function generate_ai_diagnosis(array $performance_data, string $site_url): array {
        $summary = $performance_data['summary'] ?? [];
        $queries = array_slice($performance_data['rows'] ?? [], 0, 30);
        $opportunities = self::analyze_opportunities($performance_data['rows'] ?? []);

        $prompt_data = [
            'site'              => $site_url,
            'total_clicks'      => $summary['clicks'] ?? 0,
            'total_impressions' => $summary['impressions'] ?? 0,
            'avg_ctr'           => ($summary['ctr'] ?? 0) . '%',
            'avg_position'      => $summary['position'] ?? 0,
            'top_queries'       => array_slice($queries, 0, 15),
            'striking_distance' => $opportunities['striking_distance'],
            'low_ctr'           => $opportunities['low_ctr'],
        ];

        $system_instruction = "شما یک متخصص ارشد سئو فنی (Technical SEO)، داده‌کاوی سرچ کنسول و الگوریتم‌های گوگل هستید. وظیفه شما تحلیل داده‌های واقعی سرچ کنسول برای یک سایت وبلاگ/ابزار فنی و ارائه گزارش آسیب‌شناسی دقیق به همراه راهکارهای گام‌به‌گام و عملیاتی برای رفع مشکلات و جهش رتبه‌ها است. خروجی فقط و فقط باید به فرمت معتبر JSON باشد.";

        $user_prompt = "داده‌های سرچ کنسول پراپرتی «{$site_url}» به شرح زیر است:
" . wp_json_encode($prompt_data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "

لطفاً یک گزارش جامع تشخیصی و برنامه عملیاتی رفع ایرادات تولید کنید. خروجی باید الزاماً یک آبجکت معتبر JSON با ساختار زیر باشد:
{
  \"health_score\": 78,
  \"health_status\": \"خوب با فرصت‌های رشد بالا\",
  \"executive_summary\": \"تحلیل خلاصه‌ای از وضعیت فعلی سایت و بیشترین پتانسیل ترافیک...\",
  \"critical_issues\": [
    {
      \"title\": \"عنوان مشکل یا آسیب\",
      \"severity\": \"high\" | \"medium\" | \"opportunity\",
      \"impact\": \"میزان اثرگذاری روی ورودی گوگل\",
      \"root_cause\": \"علت ریشه‌ای مشکل (مثلاً عنوان غیراستاندارد، محتوای کوتاه، کنیبالیزیشن...)\",
      \"action_plan\": [
        \"گام اول: ...\",
        \"گام دوم: ...\"
      ],
      \"target_queries\": [\"کلمه ۱\", \"کلمه ۲\"]
    }
  ],
  \"growth_quick_wins\": [
    \"راهکار سریع ۱ برای افزایش کلیک در هفته آینده\",
    \"راهکار سریع ۲ برای ارتقای صفحات صفحه دوم به صفحه اول\"
  ],
  \"content_expansion_topics\": [
    \"موضوع یا ابزار پیشنهادی بر اساس کوئری‌های با ایمپرشن بالا\"
  ]
}";

        // Call active AI Provider
        $provider = Provider_Factory::get_default();
        if (!$provider || !$provider->is_configured()) {
            // Return intelligent deterministic heuristic if no LLM key is configured yet
            return self::generate_heuristic_diagnosis($summary, $opportunities, $site_url, $queries);
        }

        try {
            $response = $provider->generate($user_prompt, [
                'system_prompt' => $system_instruction,
                'temperature'   => 0.3,
                'max_tokens'    => 4000,
            ]);
            $raw_response = $response['text'] ?? '';

            // Clean code fences if present
            $clean_json = preg_replace('/^```(?:json)?\s*/i', '', trim($raw_response));
            $clean_json = preg_replace('/\s*```$/', '', $clean_json);

            $parsed = json_decode($clean_json, true);
            if (is_array($parsed) && isset($parsed['health_score']) && !empty($parsed['critical_issues'])) {
                $parsed['generated_by'] = $provider->get_name();
                return $parsed;
            }
        } catch (\Throwable $e) {
            error_log('OmniAI GSC AI Diagnosis Error: ' . $e->getMessage());
        }

        // Fallback to enhanced heuristic diagnosis
        return self::generate_heuristic_diagnosis($summary, $opportunities, $site_url, $queries);
    }

    /**
     * Fallback heuristic rule-based diagnosis when AI provider is not connected or fails.
     */
    private static function generate_heuristic_diagnosis(array $summary, array $opportunities, string $site_url, array $queries = []): array {
        $ctr = floatval($summary['ctr'] ?? 0);
        $pos = floatval($summary['position'] ?? 0);
        $score = 70;
        if ($ctr > 4.0) $score += 15;
        elseif ($ctr < 2.0) $score -= 10;

        if ($pos > 0 && $pos <= 15) $score += 10;
        elseif ($pos > 30) $score -= 10;

        $issues = [];

        // 1. Check striking distance
        if (!empty($opportunities['striking_distance'])) {
            $words = array_column(array_slice($opportunities['striking_distance'], 0, 4), 'name');
            $issues[] = [
                'title'          => 'کلمات کلیدی در آستانه ورود به صفحه اول (رتبه ۱۱ تا ۲۰)',
                'severity'       => 'medium',
                'impact'         => 'پتانسیل افزایش ۳ برابری کلیک با ورود به جمع ۵ نتیجه اول',
                'root_cause'     => 'محتوای موجود توسط گوگل تأیید شده اما نیاز به عمق تخصصی بیشتر، لینک‌های داخلی قوی‌تر و سرفصل‌های سؤالی دارد.',
                'action_plan'    => [
                    'ایجاد حداقل ۲ لینک داخلی با انکرتکست دقیق از مقالات پربازدید به صفحات هدف این کلمات.',
                    'افزودن یک سرفصل H2 جدید با ماهیت سؤالی حاوی این کلیدواژه‌ها و پاسخ مستقیم ۴۰ کلمه‌ای.',
                    'به‌روزرسانی تاریخ انتشار و افزودن فکت‌های آماری و نکات تخصصی سال ۲۰۲۶.'
                ],
                'target_queries' => $words,
            ];
        }

        // 2. Check low CTR
        if (!empty($opportunities['low_ctr'])) {
            $words = array_column(array_slice($opportunities['low_ctr'], 0, 4), 'name');
            $issues[] = [
                'title'          => 'نرخ کلیک پایین (Low CTR) در کلمات با ایمپرشن بالا',
                'severity'       => 'high',
                'impact'         => 'از دست رفتن بیش از ۵۰٪ کلیک‌های بالقوه از صفحه اول نتایج گوگل',
                'root_cause'     => 'عنوان سئو (Title) و متا دیسکریپشن به اندازه کافی ترغیب‌کننده، دارای اعداد، پرانتز یا کلمات کلیدی جذاب نیستند.',
                'action_plan'    => [
                    'بازنویسی عنوان‌های سئو با افزودن سال ۲۰۲۶، اعداد (مانند ۱۰ ابزار) و عبارات جذاب (سریع، آنلاین، رایگان).',
                    'افزودن اسکیماهای FAQ و ریچ‌اسنیپت برای افزایش فضای اشغال‌شده در صفحه اول سرچ.',
                    'بررسی اسنیپت رقبا در سه رتبه اول و نوشتن توضیحات متای متمرکز بر حل فوری مشکل کاربر.'
                ],
                'target_queries' => $words,
            ];
        }

        // 3. Fallback issues if opportunities were empty due to site stage (e.g. pos ~ 36 or low clicks)
        $top_query_names = [];
        if (!empty($queries)) {
            // Sort queries by impressions descending
            $sorted_by_imp = $queries;
            usort($sorted_by_imp, fn($a, $b) => ($b['impressions'] ?? 0) <=> ($a['impressions'] ?? 0));
            $top_query_names = array_column(array_slice($sorted_by_imp, 0, 4), 'name');
        }

        if ($pos >= 20.0 || empty($issues)) {
            $issues[] = [
                'title'          => 'میانگین رتبه در صفحات فرعی نتایج سرچ (جایگاه متوسط ' . ($pos > 0 ? $pos : '۳۰+') . ')',
                'severity'       => 'high',
                'impact'         => 'نمایش در سرچ وجود دارد اما قرار گرفتن در صفحات ۳ و بعد مانع از تبدیل ایمپرشن به ورودی ارگانیک می‌شود.',
                'root_cause'     => 'محتواها ایندکس شده و واجد شرایط سرچ شناخته شده‌اند، اما عمق فنی، پوشش کامل Intent کاربر و ساختار سلسله‌مراتبی برای برتری بر رقبا نیاز به تقویت دارد.',
                'action_plan'    => [
                    'برای کلمات کلیدی با بیشترین ایمپرشن، یک بخش اختصاصی H2 با پاسخ مستقیم و جامع ایجاد کنید.',
                    'افزودن قطعه‌کدهای واقعی، جداول مقایسه‌ای و المان‌های تعاملی برای بالا بردن زمان ماندگاری کاربر (Dwell Time).',
                    'ایجاد حداقل ۲ لینک داخلی با انکرتکست هدفمند از صفحات اصلی سایت یا ابزارها به این مقالات.'
                ],
                'target_queries' => $top_query_names,
            ];
        }

        if ($ctr < 3.0 || count($issues) < 2) {
            $issues[] = [
                'title'          => 'بهینه‌سازی نرخ کلیک (CTR فعلی ' . $ctr . '٪) و اسنیپت‌های بدون ورودی',
                'severity'       => 'high',
                'impact'         => 'با ' . ($summary['impressions'] ?? 'صدها') . ' نمایش در گوگل، پتانسیل جذب چندین برابر ترافیک ورودی بدون نیاز به تولید مقاله جدید وجود دارد.',
                'root_cause'     => 'تگ‌های عنوان (Title) و توضیحات متای صفحات به اندازه کافی متمایز، کنجکاوی‌برانگیز یا ارائه‌دهنده راه‌حل سریع نیستند.',
                'action_plan'    => [
                    'بازنویسی تایتل مقالات با الگوی جذاب: «[عنوان ابزار/مطلب] + راهنمای جامع ۲۰۲۶ + (آنلاین و رایگان)»',
                    'تنظیم متای توضیحات با پاسخ کوتاه به اصلی‌ترین سؤال کاربر در ۱۵۰ کاراکتر اول.',
                    'درج استراکچردیتای FAQPage جهت اشغال ۲ برابر فضای بصری در صفحه نتایج تلفن همراه و دسکتاپ.'
                ],
                'target_queries' => array_slice($top_query_names, 0, 2),
            ];
        }

        // 4. Synergies issue
        $issues[] = [
            'title'          => 'هم‌افزایی محتوای وبلاگ و ابزارهای آنلاین (ZebraCode Toolkit Synergies)',
            'severity'       => 'opportunity',
            'impact'         => 'افزایش نرخ تبدیل کاربر وبلاگ به کاربر دائمی ابزارها و کاهش نرخ پرش (Bounce Rate)',
            'root_cause'     => 'مقالات وبلاگ و ابزارهای آنلاین به صورت مستقل عمل می‌کنند و انتقال کاربر بین این دو بخش به صورت سیستمی انجام نمی‌شود.',
            'action_plan'    => [
                'در انتهای هر مقاله آموزشی، یک باکس برجسته با دکمه مستقیم «ورود به ابزار آنلاین مرتبط» اضافه کنید.',
                'در صفحات ابزارها (مثلاً بخش کیت یا ادیتورها)، لینک مقالات راهنمای وبلاگ برای راهنمایی کاربران درج شود.',
                'بررسی گزارش خطاهای ۴۰۴ در افزونه و ریدایرکت ۳۰۱ لینک‌های ناموجود به نزدیک‌ترین ابزار یا مقاله مرتبط.'
            ],
            'target_queries' => ['ابزارهای آنلاین', 'کیت زبراکد'],
        ];

        return [
            'health_score'             => max(40, min(95, $score)),
            'health_status'            => $score >= 80 ? 'بسیار خوب و باثبات' : ($score >= 60 ? 'متوسط با پتانسیل جهش بالا' : 'نیازمند بهینه‌سازی سریع برای جهش رتبه'),
            'executive_summary'        => "پراپرتی {$site_url} در بازه انتخابی دارای {$summary['clicks']} کلیک و {$summary['impressions']} نمایش در نتایج جستجو بوده و میانگین رتبه آن {$pos} است. اولویت فوری باید روی ارتقای جایگاه کلمات با نمایش بالا و بهینه‌سازی عنوان‌ها برای افزایش نرخ کلیک (CTR) متمرکز شود.",
            'critical_issues'          => $issues,
            'growth_quick_wins'        => [
                'بازنویسی عنوان سئو و تگ‌های Title برای ۳ کوئری با بالاترین نمایش',
                'ایجاد لینک داخلی دوطرفه بین مقالات فنی وبلاگ و ابزارهای تعاملی زبراکد',
                'افزودن اسکیماهای FAQPage و HowTo برای گرفتن Rich Snippet در نتایج اول'
            ],
            'content_expansion_topics' => [
                '۱۰ ابزار ضروری و آنلاین برای توسعه‌دهندگان وب در سال ۲۰۲۶',
                'راهنمای کامل رفع خطاهای رایج برنامه‌نویسی با ابزارهای سریع تحت وب',
                'مقایسه عملکرد و بنچمارک ابزارهای مدرن کلاینت‌ساید'
            ],
            'generated_by'             => 'Omni AI Diagnostic Engine',
        ];
    }
}
