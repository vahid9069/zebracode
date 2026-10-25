/**
 * Omni AI Suite - Gutenberg Extension
 */
(function (wp) {
  'use strict';
  if (!wp || !wp.plugins || !wp.element) return;

  const { createElement: h, useState, Fragment } = wp.element;
  const { registerPlugin } = wp.plugins;
  const { PluginSidebar, PluginSidebarMoreMenuItem } = wp.editPost || {};
  const { Button, TextareaControl, SelectControl, Spinner, Notice } = wp.components || {};
  const { dispatch, useSelect } = wp.data || {};
  const { __ } = wp.i18n || { __: (s) => s };

  if (!PluginSidebar) return;

  function OmniAiSidebar() {
    const [instruction, setInstruction] = useState('rephrase');
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState(null);

    const selectedBlock = useSelect((sel) => sel('core/block-editor').getSelectedBlock(), []);

    const handleApply = async () => {
      if (!selectedBlock) {
        setNotice({ type: 'warning', message: __('Select a text block first.', 'omni-ai-suite') });
        return;
      }

      const content = selectedBlock.attributes?.content || '';
      let finalPrompt = '';
      if (instruction === 'rephrase') {
        finalPrompt = `Rewrite this text to be more engaging and professional:\n"${content}"`;
      } else if (instruction === 'expand') {
        finalPrompt = `Expand this text with additional detail and examples:\n"${content}"`;
      } else if (instruction === 'summarize') {
        finalPrompt = `Summarize this text concisely:\n"${content}"`;
      } else {
        finalPrompt = `${prompt}\n\nContext text:\n"${content}"`;
      }

      setLoading(true);
      setNotice(null);

      try {
        const restUrl = window.omniAiGutenberg?.restUrl || '/wp-json/omni-ai/v1/';
        const nonce = window.omniAiGutenberg?.nonce || '';
        const res = await fetch(`${restUrl}ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
          body: JSON.stringify({ prompt: finalPrompt }),
        });
        const data = await res.json();
        if (data.success && data.data?.text) {
          dispatch('core/block-editor').updateBlockAttributes(selectedBlock.clientId, {
            content: data.data.text.trim(),
          });
          setNotice({ type: 'success', message: __('Block updated! ✓', 'omni-ai-suite') });
        } else {
          throw new Error(data.message || 'Generation failed.');
        }
      } catch (err) {
        setNotice({ type: 'error', message: err.message });
      } finally {
        setLoading(false);
      }
    };

    return h(
      PluginSidebar,
      {
        name: 'omni-ai-sidebar',
        title: __('Omni AI Assistant', 'omni-ai-suite'),
        icon: 'superhero',
      },
      h('div', { style: { padding: '16px' } }, [
        notice && h(Notice, { key: 'n', status: notice.type, onDismiss: () => setNotice(null) }, notice.message),
        h(SelectControl, {
          key: 'sel',
          label: __('AI Action for Selected Block', 'omni-ai-suite'),
          value: instruction,
          options: [
            { label: __('Improve & Polish', 'omni-ai-suite'), value: 'rephrase' },
            { label: __('Expand & Elaborate', 'omni-ai-suite'), value: 'expand' },
            { label: __('Summarize Concisely', 'omni-ai-suite'), value: 'summarize' },
            { label: __('Custom Prompt', 'omni-ai-suite'), value: 'custom' },
          ],
          onChange: setInstruction,
        }),
        instruction === 'custom' &&
          h(TextareaControl, {
            key: 'ta',
            label: __('Custom Prompt', 'omni-ai-suite'),
            value: prompt,
            onChange: setPrompt,
            rows: 3,
            placeholder: __('e.g. Translate to Spanish...', 'omni-ai-suite'),
          }),
        h(
          Button,
          {
            key: 'btn',
            variant: 'primary',
            onClick: handleApply,
            disabled: loading || !selectedBlock,
            style: { width: '100%', justifyContent: 'center', marginTop: '14px' },
          },
          loading ? [h(Spinner, { key: 'sp' }), __('Transforming...', 'omni-ai-suite')] : __('⚡ Apply AI to Selected Block', 'omni-ai-suite')
        ),
      ])
    );
  }

  registerPlugin('omni-ai-gutenberg', {
    render: () =>
      h(Fragment, null, [
        h(
          PluginSidebarMoreMenuItem,
          { key: 'm', target: 'omni-ai-sidebar', icon: 'superhero' },
          __('Omni AI Assistant', 'omni-ai-suite')
        ),
        h(OmniAiSidebar, { key: 's' }),
      ]),
  });
})(window.wp);
