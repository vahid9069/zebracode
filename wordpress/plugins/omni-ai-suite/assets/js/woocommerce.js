/**
 * WooCommerce AI Product Description Generator
 */
(function ($) {
  'use strict';

  $(document).ready(function () {
    const $btn = $('#omni-ai-wc-generate-btn');
    if (!$btn.length) return;

    $btn.on('click', async function () {
      const keywords = $('#omni_ai_wc_keywords').val();
      const productTitle = $('#title').val() || $('input[name="post_title"]').val() || '';

      if (!productTitle && !keywords) {
        alert('Please provide a product title or keywords to generate copy.');
        return;
      }

      const $spinner = $('#omni-ai-wc-spinner');
      const $msg = $('#omni-ai-wc-msg');

      $spinner.addClass('is-active');
      $btn.prop('disabled', true);
      $msg.text('Generating product description...').css('color', '#2271b1');

      const prompt = `Write a compelling, high-converting eCommerce product description for:\nProduct: "${productTitle}"\nKey Features/Keywords: "${keywords}"\nInclude: an engaging hook, key benefit bullet points, and specifications.`;

      try {
        const restUrl = window.omniAiWc?.restUrl || '/wp-json/omni-ai/v1/ask';
        const nonce = window.omniAiWc?.nonce || '';

        const res = await fetch(restUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': nonce,
          },
          body: JSON.stringify({ prompt }),
        });

        const data = await res.json();
        if (data.success && data.data?.text) {
          const generatedCopy = data.data.text.trim();

          // Try injecting into TinyMCE main content editor if available
          if (typeof tinyMCE !== 'undefined' && tinyMCE.get('content')) {
            tinyMCE.get('content').setContent(generatedCopy);
          } else if ($('#content').length) {
            $('#content').val(generatedCopy);
          }

          // Also set excerpt/short description if empty
          if ($('#excerpt').length && !$('#excerpt').val()) {
            const shortSnippet = generatedCopy.split('\n')[0] || generatedCopy.substring(0, 160);
            $('#excerpt').val(shortSnippet);
          }

          $msg.text('Product copy generated and inserted! ✓').css('color', '#1a7f37');
        } else {
          throw new Error(data.message || 'Generation failed.');
        }
      } catch (err) {
        $msg.text('Error: ' + err.message).css('color', '#d63638');
      } finally {
        $spinner.removeClass('is-active');
        $btn.prop('disabled', false);
      }
    });
  });
})(jQuery);
