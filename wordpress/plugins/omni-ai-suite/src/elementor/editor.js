/**
 * Elementor Editor AI Floating Panel
 * Loaded exclusively inside elementor editor screen via elementor/editor/before_enqueue_scripts
 */
(function ($) {
  'use strict';

  $(window).on('elementor:init', function () {
    if (typeof elementor === 'undefined') return;

    // Create floating trigger button in Elementor bottom bar or floating corner
    const $button = $(`
      <div id="omni-ai-elementor-trigger" style="
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        background: #2271b1;
        color: #fff;
        padding: 10px 16px;
        border-radius: 24px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.2s ease;
      ">
        <span>⚡ Omni AI Writer</span>
      </div>
    `);

    // Create floating modal panel
    const $panel = $(`
      <div id="omni-ai-elementor-modal" style="
        display: none;
        position: fixed;
        bottom: 74px;
        right: 24px;
        width: 360px;
        background: #ffffff;
        border: 1px solid #dcdcde;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        z-index: 999999;
        padding: 18px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <strong style="color: #1d2327; font-size: 14px;">⚡ Omni AI Assistant</strong>
          <span id="omni-ai-elementor-close" style="cursor: pointer; font-size: 18px; color: #646970;">&times;</span>
        </div>
        <textarea id="omni-ai-el-prompt" rows="3" placeholder="What should AI write for this widget?" style="
          width: 100%;
          border: 1px solid #8c8f94;
          border-radius: 4px;
          padding: 8px;
          font-size: 13px;
          margin-bottom: 10px;
          box-sizing: border-box;
        "></textarea>
        <div style="display: flex; gap: 8px;">
          <button id="omni-ai-el-generate" style="
            flex: 1;
            background: #2271b1;
            color: #ffffff;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          ">Generate & Insert</button>
        </div>
        <div id="omni-ai-el-status" style="margin-top: 8px; font-size: 12px; color: #646970;"></div>
      </div>
    `);

    $('body').append($button).append($panel);

    $button.on('click', function () {
      $panel.toggle();
    });

    $panel.find('#omni-ai-elementor-close').on('click', function () {
      $panel.hide();
    });

    $panel.find('#omni-ai-el-generate').on('click', async function () {
      const prompt = $('#omni-ai-el-prompt').val();
      if (!prompt.trim()) return;

      const $status = $('#omni-ai-el-status');
      $status.text('Generating AI copy...').css('color', '#2271b1');

      try {
        const restUrl = window.omniAiElementor?.restUrl || '/wp-json/omni-ai/v1/';
        const nonce = window.omniAiElementor?.nonce || '';

        const res = await fetch(`${restUrl}ask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': nonce,
          },
          body: JSON.stringify({ prompt }),
        });

        const data = await res.json();
        if (data.success && data.data?.text) {
          const generatedText = data.data.text.trim();

          // Use Elementor JS API to inject text into active model
          if (window.elementor && window.elementor.getPanelView) {
            const panelView = window.elementor.getPanelView();
            const currentPage = panelView && panelView.getCurrentPageView();
            if (currentPage && currentPage.model) {
              const activeModel = currentPage.model;
              // Check common Elementor text control setting names
              if (activeModel.getSetting('title') !== undefined) {
                activeModel.setSetting('title', generatedText);
              } else if (activeModel.getSetting('editor') !== undefined) {
                activeModel.setSetting('editor', generatedText);
              } else if (activeModel.getSetting('description') !== undefined) {
                activeModel.setSetting('description', generatedText);
              }
            }
          }

          $status.text('Inserted into active widget! ✓').css('color', '#1a7f37');
          setTimeout(() => {
            $panel.hide();
            $status.text('');
          }, 1500);
        } else {
          throw new Error(data.message || 'Generation failed.');
        }
      } catch (err) {
        $status.text('Error: ' + err.message).css('color', '#d63638');
      }
    });
  });
})(jQuery);
