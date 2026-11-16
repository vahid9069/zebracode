/**
 * Omni AI Suite - Content Ranking (SEO / AEO / GEO) Admin JavaScript
 */
(function($) {
    'use strict';

    $(document).ready(function() {
        const config = window.omniRankingConfig || {};
        const ajaxUrl = config.ajax_url || (typeof ajaxurl !== 'undefined' ? ajaxurl : '/wp-admin/admin-ajax.php');
        const nonce   = config.nonce || (window.omniAiData && window.omniAiData.nonce) || '';

        // ۱. سوئیچ بین تب‌های چک‌لیست
        $(document).on('click', '.omni-tab-btn', function(e) {
            e.preventDefault();
            const $btn = $(this);
            const targetTab = $btn.data('tab');
            const $wrap = $btn.closest('.omni-details-tabs-wrap');

            $wrap.find('.omni-tab-btn').removeClass('active');
            $wrap.find('.omni-tab-pane').removeClass('active');

            $btn.addClass('active');
            $wrap.find('#' + targetTab).addClass('active');
        });

        // ۲. تحلیل مجدد یک نوشته در جدول یا در صفحه ویرایشگر
        $(document).on('click', '.omni-recalc-btn', function(e) {
            e.preventDefault();
            const $btn = $(this);
            const postId = $btn.data('post-id');
            const $cell = $btn.closest('.omni-rating-cell');

            if ($btn.hasClass('omni-recalc-loading')) {
                return;
            }

            $btn.addClass('omni-recalc-loading');

            $.ajax({
                url: ajaxUrl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'omni_ai_reanalyze_post_ratings',
                    security: nonce,
                    post_id: postId
                },
                success: function(res) {
                    $btn.removeClass('omni-recalc-loading');
                    if (res && res.success && res.data && res.data.cell_html) {
                        if ($cell.length) {
                            const $newCell = $(res.data.cell_html);
                            $cell.replaceWith($newCell);
                            $newCell.addClass('omni-cell-updated');
                        }
                        const $mbContent = $('#omni-rmb-content');
                        if ($mbContent.length && res.data.dashboard_html) {
                            $mbContent.html(res.data.dashboard_html);
                        }
                    } else {
                        alert(res.data && res.data.message ? res.data.message : 'خطا در تحلیل محتوا.');
                    }
                },
                error: function() {
                    $btn.removeClass('omni-recalc-loading');
                    alert('خطای برقراری با سرور.');
                }
            });
        });

        // ۳. مدیریت مودال تحلیل
        const $modal = $('#omni-ranking-modal');
        const $modalTitle = $('#omni-modal-post-title');
        const $modalMeta = $('#omni-modal-post-meta');
        const $modalEditLink = $('#omni-modal-edit-link');
        const $modalArea = $('#omni-modal-content-area');

        $(document).on('click', '.omni-open-details-btn', function(e) {
            e.preventDefault();
            const postId = $(this).data('post-id');

            if (!$modal.length) {
                return;
            }

            $modalTitle.text('در حال دریافت اطلاعات...');
            $modalMeta.text('شناسه نوشته: #' + postId);
            $modalEditLink.attr('href', '#').hide();
            $modalArea.html(`
                <div class="omni-modal-loading">
                    <span class="spinner is-active"></span>
                    <span>در حال استخراج چک‌لیست و بررسی محتوا...</span>
                </div>
            `);

            $modal.fadeIn(180);

            $.ajax({
                url: ajaxUrl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'omni_ai_get_post_rating_modal',
                    security: nonce,
                    post_id: postId
                },
                success: function(res) {
                    if (res && res.success && res.data) {
                        $modalTitle.text(res.data.post_title || 'تحلیل رتبه محتوا');
                        $modalMeta.text('شناسه نوشته: #' + res.data.post_id);
                        if (res.data.edit_link) {
                            $modalEditLink.attr('href', res.data.edit_link).show();
                        }
                        $modalArea.html(res.data.html);
                    } else {
                        $modalArea.html('<div class="notice notice-error inline"><p>' + (res.data && res.data.message ? res.data.message : 'خطا در بارگذاری اطلاعات') + '</p></div>');
                    }
                },
                error: function() {
                    $modalArea.html('<div class="notice notice-error inline"><p>خطای برقراری با سرور.</p></div>');
                }
            });
        });

        $(document).on('click', '.omni-modal-close-btn, .omni-ranking-modal-overlay', function(e) {
            if (e.target === this || $(this).hasClass('omni-modal-close-btn') || $(this).closest('.omni-modal-close-btn').length) {
                $modal.fadeOut(150);
            }
        });

        $(document).keyup(function(e) {
            if (e.key === 'Escape' && $modal.is(':visible')) {
                $modal.fadeOut(150);
            }
        });

        // ۴. درخواست تولید محتوای بهینه‌ساز با AI
        $(document).on('click', '.omni-btn-ai-optimize', function(e) {
            e.preventDefault();
            const $btn = $(this);
            const postId = $btn.data('post-id');

            // جستجوی کانتینر پیش‌نمایش در همان کامپوننت (چه مودال و چه متاباکس)
            let $preview = $btn.closest('.omni-dashboard-wrap').find('.omni-ai-suggestions-preview');
            if (!$preview.length) {
                $preview = $('#omni-ai-preview-' + postId);
            }

            if ($btn.prop('disabled')) {
                return;
            }

            const origHtml = $btn.html();
            $btn.prop('disabled', true).html('<span class="omni-spinner-icon"></span> در حال تولید پیشنهادات با AI...');

            $preview.show().html(`
                <div class="omni-suggestions-loading">
                    <span class="spinner is-active"></span>
                    <span>هوش مصنوعی در حال بررسی دقیق عنوان و بدنه مقاله برای ایجاد پاسخ مستقیم، سوالات متداول و نکات کلیدی است...</span>
                </div>
            `);

            $.ajax({
                url: ajaxUrl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'omni_ai_optimize_post_content',
                    security: nonce,
                    post_id: postId
                },
                success: function(res) {
                    $btn.prop('disabled', false).html(origHtml);

                    if (res && res.success && res.data && res.data.suggestions) {
                        const sug = res.data.suggestions;
                        const html = `
                            <div class="omni-suggestions-card">
                                <div class="omni-sug-header">
                                    <div class="omni-sug-title">
                                        <span class="dashicons dashicons-yes-alt"></span>
                                        <strong>پیشنهادات بهینه‌سازی تولید شده توسط AI</strong>
                                    </div>
                                    <span class="omni-sug-badge">تیک مواردی را که می‌خواهید به نوشته افزوده شود فعال بگذارید</span>
                                </div>

                                <div class="omni-sug-sections">
                                    <!-- ۰. کلیدواژه کانونی سئو Focus Keyword -->
                                    <div class="omni-sug-item" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                                        <label class="omni-sug-label">
                                            <input type="checkbox" class="omni-cb-part" data-part="focus_keyword" checked />
                                            <strong style="color: #1d4ed8;">🔑 کلیدواژه کانونی پیشنهادی AI (Focus Keyword - رفع خطای ۳۵ امتیاز منفی سئو)</strong>
                                        </label>
                                        <p class="omni-sug-help">کلمه کلیدی محوری که برای سئوی این مقاله انتخاب شده است:</p>
                                        <input type="text" class="omni-sug-input" id="omni-inp-kw-${postId}" value="${escapeHtml(sug.focus_keyword || '')}" style="font-weight: 700; color: #1e293b;" />
                                    </div>

                                    <!-- ۰.۱. عنوان سئو استاندارد SEO Title -->
                                    <div class="omni-sug-item" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                                        <label class="omni-sug-label">
                                            <input type="checkbox" class="omni-cb-part" data-part="seo_title" checked />
                                            <strong style="color: #1d4ed8;">🏷️ عنوان استاندارد سئو (SEO Title - بهینه بین ۴۰ تا ۶۰ کاراکتر)</strong>
                                        </label>
                                        <p class="omni-sug-help">عنوان جذاب و کوتاه با نرخ کلیک بالا (CTR) حاوی کلمه کلیدی اصلی:</p>
                                        <input type="text" class="omni-sug-input" id="omni-inp-title-${postId}" value="${escapeHtml(sug.seo_title || '')}" />
                                    </div>

                                    <!-- ۱. پاسخ مستقیم AEO -->
                                    <div class="omni-sug-item">
                                        <label class="omni-sug-label">
                                            <input type="checkbox" class="omni-cb-part" data-part="direct_answer" checked />
                                            <strong>پاسخ مستقیم (Direct Answer Snippet برای AEO و جستجوی صوتی)</strong>
                                        </label>
                                        <p class="omni-sug-help">این پاسخ دقیقاً به عنوان یک کادر برجسته در ابتدای نوشته قرار می‌گیرد تا موتورهای هوش مصنوعی سریعاً آن را استخراج کنند.</p>
                                        <textarea class="omni-sug-textarea" id="omni-inp-direct-${postId}" rows="3">${escapeHtml(sug.direct_answer || '')}</textarea>
                                    </div>

                                    <!-- ۲. سوالات متداول FAQ -->
                                    <div class="omni-sug-item">
                                        <label class="omni-sug-label">
                                            <input type="checkbox" class="omni-cb-part" data-part="faq_section" checked />
                                            <strong>پرسش و پاسخ‌های متداول (FAQ برای ساختار اسنیپت AEO)</strong>
                                        </label>
                                        <p class="omni-sug-help">به انتهای مقاله اضافه می‌شود و پاسخ سوالات احتمالی کاربر را برطرف می‌سازد.</p>
                                        <textarea class="omni-sug-textarea code" id="omni-inp-faq-${postId}" rows="5">${escapeHtml(sug.faq_section || '')}</textarea>
                                    </div>

                                    <!-- ۳. نکات کلیدی و جمع‌بندی GEO -->
                                    <div class="omni-sug-item">
                                        <label class="omni-sug-label">
                                            <input type="checkbox" class="omni-cb-part" data-part="conclusion_section" checked />
                                            <strong>جمع‌بندی و نکات کلیدی (Key Takeaways برای استناد GEO در ChatGPT و Gemini)</strong>
                                        </label>
                                        <p class="omni-sug-help">خلاصه غنی از آمار، نکات اصلی و پیوند خارجی معتبر که مدل‌های زبانی از آن به عنوان منبع نقل قول استفاده می‌کنند.</p>
                                        <textarea class="omni-sug-textarea code" id="omni-inp-conclusion-${postId}" rows="5">${escapeHtml(sug.conclusion_section || '')}</textarea>
                                    </div>

                                    <!-- ۴. توضیحات متا SEO -->
                                    <div class="omni-sug-item">
                                        <label class="omni-sug-label">
                                            <input type="checkbox" class="omni-cb-part" data-part="meta_description" checked />
                                            <strong>توضیحات متای بهینه شده (Meta Description)</strong>
                                        </label>
                                        <input type="text" class="omni-sug-input" id="omni-inp-meta-${postId}" value="${escapeHtml(sug.meta_description || '')}" />
                                    </div>
                                </div>

                                <div class="omni-sug-actions">
                                    <button type="button" class="button button-primary button-large omni-btn-apply-ai" data-post-id="${postId}">
                                        <span class="dashicons dashicons-saved"></span> تأیید و اعمال در نوشته
                                    </button>
                                    <button type="button" class="button button-secondary button-large omni-btn-cancel-ai" data-post-id="${postId}">
                                        انصراف
                                    </button>
                                </div>
                            </div>
                        `;
                        $preview.html(html);
                    } else {
                        $preview.html('<div class="notice notice-error inline"><p>' + (res.data && res.data.message ? res.data.message : 'خطا در ارتباط با مدل هوش مصنوعی') + '</p></div>');
                    }
                },
                error: function() {
                    $btn.prop('disabled', false).html(origHtml);
                    $preview.html('<div class="notice notice-error inline"><p>خطا در برقراری ارتباط با سرور برای تولید محتوا.</p></div>');
                }
            });
        });

        // ۵. انصراف از پیشنهادات
        $(document).on('click', '.omni-btn-cancel-ai', function(e) {
            e.preventDefault();
            const postId = $(this).data('post-id');
            const $wrap = $(this).closest('.omni-dashboard-wrap');
            $wrap.find('.omni-ai-suggestions-preview').slideUp(150);
        });

        // ۶. تأیید و اعمال پیشنهادات در متن نوشته
        $(document).on('click', '.omni-btn-apply-ai', function(e) {
            e.preventDefault();
            const $btn = $(this);
            const postId = $btn.data('post-id');
            const $wrap = $btn.closest('.omni-suggestions-card');

            const hasKw     = $wrap.find('.omni-cb-part[data-part="focus_keyword"]').is(':checked');
            const hasTitle  = $wrap.find('.omni-cb-part[data-part="seo_title"]').is(':checked');
            const hasDirect = $wrap.find('.omni-cb-part[data-part="direct_answer"]').is(':checked');
            const hasFaq    = $wrap.find('.omni-cb-part[data-part="faq_section"]').is(':checked');
            const hasConc   = $wrap.find('.omni-cb-part[data-part="conclusion_section"]').is(':checked');
            const hasMeta   = $wrap.find('.omni-cb-part[data-part="meta_description"]').is(':checked');

            const focusKw      = hasKw ? ($wrap.find('#omni-inp-kw-' + postId).val() || '') : '';
            const seoTitle     = hasTitle ? ($wrap.find('#omni-inp-title-' + postId).val() || '') : '';
            const directAnswer = hasDirect ? ($wrap.find('#omni-inp-direct-' + postId).val() || '') : '';
            const faqSection   = hasFaq ? ($wrap.find('#omni-inp-faq-' + postId).val() || '') : '';
            const conclusion   = hasConc ? ($wrap.find('#omni-inp-conclusion-' + postId).val() || '') : '';
            const metaDesc     = hasMeta ? ($wrap.find('#omni-inp-meta-' + postId).val() || '') : '';

            $btn.prop('disabled', true).html('<span class="omni-spinner-icon"></span> در حال اعمال در متن نوشته و محاسبه مجدد رتبه...');

            $.ajax({
                url: ajaxUrl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'omni_ai_apply_optimization',
                    security: nonce,
                    post_id: postId,
                    focus_keyword: focusKw,
                    seo_title: seoTitle,
                    direct_answer: directAnswer,
                    faq_section: faqSection,
                    conclusion_section: conclusion,
                    meta_description: metaDesc
                },
                success: function(res) {
                    if (res && res.success && res.data) {
                        alert(res.data.message || 'بهینه‌سازی با موفقیت اعمال گردید.');

                        // بروزرسانی فیلدهای زنده در تب‌های متاباکس
                        if (res.data.focus_keyword) {
                            $('.omni-field-focus-kw').val(res.data.focus_keyword);
                        }
                        if (res.data.seo_title) {
                            $('.omni-field-seo-title').val(res.data.seo_title).trigger('input');
                        }
                        if (res.data.meta_description) {
                            $('.omni-field-meta-desc').val(res.data.meta_description).trigger('input');
                        }

                        // بروزرسانی سلول جدول نوشته‌ها
                        if (res.data.cell_html) {
                            const $cell = $(`.omni-rating-cell[data-post-id="${postId}"]`);
                            if ($cell.length) {
                                const $newCell = $(res.data.cell_html);
                                $cell.replaceWith($newCell);
                                $newCell.addClass('omni-cell-updated');
                            }
                        }

                        // بروزرسانی متاباکس یا مودال
                        const $mbContent = $('#omni-rmb-content');
                        const $modalArea = $('#omni-modal-content-area');
                        if (res.data.dashboard_html) {
                            if ($mbContent.length) {
                                $mbContent.html(res.data.dashboard_html);
                            }
                            if ($modalArea.length && $modalArea.is(':visible')) {
                                $modalArea.html(res.data.dashboard_html);
                            }
                        }

                        // اطلاع به پنل React رتبه‌بندی در صورت باز بودن
                        try {
                            window.dispatchEvent(new CustomEvent('omni-ranking-updated', {
                                detail: {
                                    postId: postId,
                                    ratings: res.data.ratings
                                }
                            }));
                        } catch (_) {}
                    } else {
                        $btn.prop('disabled', false).html('<span class="dashicons dashicons-saved"></span> تأیید و اعمال در نوشته');
                        alert(res.data && res.data.message ? res.data.message : 'خطا در اعمال تغییرات.');
                    }
                },
                error: function() {
                    $btn.prop('disabled', false).html('<span class="dashicons dashicons-saved"></span> تأیید و اعمال در نوشته');
                    alert('خطای سرور در ذخیره‌سازی محتوا.');
                }
            });
        });

        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // ======================================================================
        // ۵. اسنیپت زنده گوگل (Google SERP Snippet) و کلیدواژه کانونی (Focus Keyword)
        // ======================================================================

        // تغییر وضعیت پیش‌نمایش دسکتاپ و موبایل گوگل
        $(document).on('click', '.omni-preview-toggle', function(e) {
            e.preventDefault();
            const $btn = $(this);
            const device = $btn.data('device');
            const $wrap = $btn.closest('.omni-snippet-section');
            $wrap.find('.omni-preview-toggle').removeClass('active');
            $btn.addClass('active');
            const $box = $wrap.find('.omni-serp-preview-box');
            $box.removeClass('desktop mobile').addClass(device);
        });

        // بروزرسانی نوار پیشرفت کاراکترها
        function updateCharProgress($input, $counter, $bar, minOptimal, maxOptimal, maxTotal) {
            const val = $input.val() || '';
            const len = val.length;
            $counter.find('.count-num').text(len);
            const pct = Math.min(100, Math.round((len / maxTotal) * 100));
            $bar.css('width', pct + '%');
            $bar.removeClass('good warn danger');
            if (len >= minOptimal && len <= maxOptimal) {
                $bar.addClass('good');
            } else if (len > 0) {
                $bar.addClass('warn');
            } else {
                $bar.addClass('danger');
            }
        }

        // هماهنگی زنده تایپ عنوان سئو با پیش‌نمایش گوگل و نوار کاراکتر
        $(document).on('input', '.omni-field-seo-title', function() {
            const val = $(this).val();
            const $wrap = $(this).closest('.omni-snippet-section');
            $wrap.find('.omni-serp-title').text(val || 'عنوان سئو نوشته');
            updateCharProgress($(this), $wrap.find('.omni-char-meter-text[id^="omni-title-count-"]'), $wrap.find('.omni-char-progress-fill[id^="omni-title-bar-"]'), 30, 60, 65);
        });

        // هماهنگی زنده توضیحات متا با پیش‌نمایش گوگل و نوار کاراکتر
        $(document).on('input', '.omni-field-meta-desc', function() {
            const val = $(this).val();
            const $wrap = $(this).closest('.omni-snippet-section');
            $wrap.find('.omni-serp-snippet').text(val || 'توضیحات متای این نوشته در این قسمت نمایش داده خواهد شد...');
            updateCharProgress($(this), $wrap.find('.omni-char-meter-text[id^="omni-desc-count-"]'), $wrap.find('.omni-char-progress-fill[id^="omni-desc-bar-"]'), 110, 160, 165);
        });

        // تولید عنوان و متادیسکریپشن هوشمند با هوش مصنوعی
        $(document).on('click', '.omni-btn-generate-snippet', function(e) {
            e.preventDefault();
            const $btn = $(this);
            const postId = $btn.data('post-id');
            const $wrap = $btn.closest('.omni-snippet-section');
            const focusKw = $wrap.find('.omni-field-focus-kw').val() || '';

            if ($btn.hasClass('loading')) return;
            const originalHtml = $btn.html();
            $btn.addClass('loading').prop('disabled', true).html('<span class="spinner is-active" style="float:none;margin:0 4px;"></span> در حال تولید با AI...');

            $.ajax({
                url: ajaxUrl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'omni_ai_generate_seo_snippet',
                    security: nonce,
                    post_id: postId,
                    focus_keyword: focusKw
                },
                success: function(res) {
                    $btn.removeClass('loading').prop('disabled', false).html(originalHtml);
                    if (res && res.success && res.data) {
                        if (res.data.seo_title) {
                            $wrap.find('.omni-field-seo-title').val(res.data.seo_title).trigger('input');
                        }
                        if (res.data.meta_description) {
                            $wrap.find('.omni-field-meta-desc').val(res.data.meta_description).trigger('input');
                        }
                        if (res.data.focus_keyword && !$wrap.find('.omni-field-focus-kw').val()) {
                            $wrap.find('.omni-field-focus-kw').val(res.data.focus_keyword);
                        }
                    } else {
                        alert(res.data && res.data.message ? res.data.message : 'خطا در تولید عنوان و توضیحات متا با AI.');
                    }
                },
                error: function(xhr) {
                    $btn.removeClass('loading').prop('disabled', false).html(originalHtml);
                    const msg = (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) 
                        ? xhr.responseJSON.data.message 
                        : (xhr.statusText === 'timeout' ? 'مهلت زمان ارتباط به پایان رسید.' : 'خطا در برقراری ارتباط با سرور.');
                    alert(msg);
                }
            });
        });

        // ذخیره تغییرات سئو و ارزیابی مجدد
        $(document).on('click', '.omni-btn-save-seo', function(e) {
            e.preventDefault();
            const $btn = $(this);
            const postId = $btn.data('post-id');
            const $wrap = $btn.closest('.omni-dashboard-wrap');

            const focusKw   = $wrap.find('.omni-field-focus-kw').val() || '';
            const seoTitle  = $wrap.find('.omni-field-seo-title').val() || '';
            const metaDesc  = $wrap.find('.omni-field-meta-desc').val() || '';
            const canonical = $wrap.find('.omni-field-canonical').val() || '';
            const noindex   = $wrap.find('.omni-field-noindex').is(':checked') ? 1 : 0;
            const nofollow  = $wrap.find('.omni-field-nofollow').is(':checked') ? 1 : 0;

            const ogTitle   = $wrap.find('.omni-field-og-title').val() || '';
            const ogDesc    = $wrap.find('.omni-field-og-desc').val() || '';
            const ogImage   = $wrap.find('.omni-field-og-image').val() || '';

            const schemaType   = $wrap.find('.omni-field-schema-type').val() || 'article';
            const reviewItem   = $wrap.find('.omni-field-review-item').val() || '';
            const reviewRating = $wrap.find('.omni-field-review-rating').val() || '5';
            const howtoName    = $wrap.find('.omni-field-howto-name').val() || '';
            const howtoTime    = $wrap.find('.omni-field-howto-time').val() || '';

            if ($btn.hasClass('loading')) return;
            const originalHtml = $btn.html();
            $btn.addClass('loading').prop('disabled', true).html('<span class="spinner is-active" style="float:none;margin:0 4px;"></span> در حال ذخیره...');

            $.ajax({
                url: ajaxUrl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'omni_ai_save_post_seo',
                    security: nonce,
                    post_id: postId,
                    focus_keyword: focusKw,
                    seo_title: seoTitle,
                    meta_description: metaDesc,
                    canonical_url: canonical,
                    noindex: noindex,
                    nofollow: nofollow,
                    og_title: ogTitle,
                    og_description: ogDesc,
                    og_image: ogImage,
                    twitter_title: ogTitle,
                    twitter_description: ogDesc,
                    twitter_image: ogImage,
                    schema_type: schemaType,
                    review_item: reviewItem,
                    review_rating: reviewRating,
                    howto_name: howtoName,
                    howto_total_time: howtoTime
                },
                success: function(res) {
                    $btn.removeClass('loading').prop('disabled', false).html(originalHtml);
                    if (res && res.success && res.data) {
                        const $cell = $('.omni-rating-cell[data-post-id="' + postId + '"]');
                        if ($cell.length && res.data.cell_html) {
                            $cell.replaceWith($(res.data.cell_html));
                        }
                        if (res.data.dashboard_html) {
                            $('#omni-rmb-content').html(res.data.dashboard_html);
                            initProgressBars();
                        }
                        alert(res.data.message || 'تنظیمات سئو با موفقیت ذخیره شد.');
                    } else {
                        alert(res.data && res.data.message ? res.data.message : 'خطا در ذخیره سئو.');
                    }
                },
                error: function(xhr) {
                    $btn.removeClass('loading').prop('disabled', false).html(originalHtml);
                    const msg = (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) 
                        ? xhr.responseJSON.data.message 
                        : (xhr.statusText === 'timeout' ? 'مهلت زمان ارتباط به پایان رسید.' : 'خطا در برقراری ارتباط با سرور.');
                    alert(msg);
                }
            });
        });

        // ======================================================================
        // ۶. تنظیمات شبکه‌های اجتماعی (Social / Open Graph / Twitter)
        // ======================================================================

        // کپی خودکار از عنوان و توضیحات سئو به شبکه‌های اجتماعی
        $(document).on('click', '.omni-btn-sync-social', function(e) {
            e.preventDefault();
            const $wrap = $(this).closest('.omni-dashboard-wrap');
            const seoTitle = $wrap.find('.omni-field-seo-title').val() || '';
            const metaDesc = $wrap.find('.omni-field-meta-desc').val() || '';
            if (seoTitle) {
                $wrap.find('.omni-field-og-title').val(seoTitle).trigger('input');
            }
            if (metaDesc) {
                $wrap.find('.omni-field-og-desc').val(metaDesc).trigger('input');
            }
        });

        // بروزرسانی زنده عنوان و توضیحات کارت شبکه‌های اجتماعی
        $(document).on('input', '.omni-field-og-title', function() {
            const val = $(this).val();
            const $wrap = $(this).closest('.omni-social-section');
            $wrap.find('.omni-social-card-title').text(val || 'عنوان جذاب برای شبکه‌های اجتماعی');
        });

        $(document).on('input', '.omni-field-og-desc', function() {
            const val = $(this).val();
            const $wrap = $(this).closest('.omni-social-section');
            $wrap.find('.omni-social-card-desc').text(val || 'خلاصه محتوای نوشته که در هنگام اشتراک لینک در شبکه‌های اجتماعی نمایش داده خواهد شد.');
        });

        $(document).on('input change', '.omni-field-og-image', function() {
            const val = $(this).val();
            const $wrap = $(this).closest('.omni-social-section');
            const $img = $wrap.find('.omni-social-card-img');
            const $placeholder = $wrap.find('.omni-social-card-img-placeholder');
            if (val) {
                $img.attr('src', val).show();
                $placeholder.hide();
            } else {
                $img.hide();
                $placeholder.show();
            }
        });

        // باز کردن رسانه وردپرس برای انتخاب تصویر شبکه‌های اجتماعی
        $(document).on('click', '.omni-btn-upload-social-img', function(e) {
            e.preventDefault();
            const $btn = $(this);
            const $wrap = $btn.closest('.omni-social-section');
            const $input = $wrap.find('.omni-field-og-image');
            const $img = $wrap.find('.omni-social-card-img');
            const $placeholder = $wrap.find('.omni-social-card-img-placeholder');

            if (typeof wp !== 'undefined' && wp.media) {
                const frame = wp.media({
                    title: 'انتخاب تصویر اختصاصی اشتراک‌گذاری در شبکه‌های اجتماعی',
                    button: { text: 'انتخاب این تصویر' },
                    multiple: false
                });
                frame.on('select', function() {
                    const attachment = frame.state().get('selection').first().toJSON();
                    $input.val(attachment.url).trigger('input').trigger('change');
                    $img.attr('src', attachment.url).show();
                    $placeholder.hide();
                });
                frame.open();
            } else {
                const url = prompt('آدرس کامل اینترنتی تصویر را وارد کنید:');
                if (url) {
                    $input.val(url).trigger('input').trigger('change');
                    $img.attr('src', url).show();
                    $placeholder.hide();
                }
            }
        });

        // تغییر نوع اسکیما و نمایش فیلدهای شرطی
        $(document).on('change', '.omni-field-schema-type', function() {
            const type = $(this).val();
            const $box = $(this).closest('.omni-schema-seo-box');
            if (type === 'review') {
                $box.find('.omni-schema-review-fields').slideDown(150);
                $box.find('.omni-schema-howto-fields').slideUp(150);
            } else if (type === 'howto') {
                $box.find('.omni-schema-howto-fields').slideDown(150);
                $box.find('.omni-schema-review-fields').slideUp(150);
            } else {
                $box.find('.omni-schema-review-fields').slideUp(150);
                $box.find('.omni-schema-howto-fields').slideUp(150);
            }
        });

        function initProgressBars() {
            $('.omni-snippet-section').each(function() {
                const $sec = $(this);
                const $title = $sec.find('.omni-field-seo-title');
                const $desc  = $sec.find('.omni-field-meta-desc');
                if ($title.length) {
                    updateCharProgress($title, $sec.find('.omni-char-meter-text[id^="omni-title-count-"]'), $sec.find('.omni-char-progress-fill[id^="omni-title-bar-"]'), 30, 60, 65);
                }
                if ($desc.length) {
                    updateCharProgress($desc, $sec.find('.omni-char-meter-text[id^="omni-desc-count-"]'), $sec.find('.omni-char-progress-fill[id^="omni-desc-bar-"]'), 110, 160, 165);
                }
            });
        }
        initProgressBars();

    });
})(jQuery);
