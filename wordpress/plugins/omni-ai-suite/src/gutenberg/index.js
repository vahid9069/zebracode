import { createElement, useState, Fragment } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/edit-post';
import { Button, TextareaControl, SelectControl, Spinner, Notice } from '@wordpress/components';
import { select, dispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

function OmniAiGutenbergSidebar() {
  const [prompt, setPrompt] = useState('');
  const [instruction, setInstruction] = useState('rephrase');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const selectedBlock = useSelect((selectData) => {
    return selectData('core/block-editor').getSelectedBlock();
  }, []);

  const handleApplyToBlock = async () => {
    if (!selectedBlock) {
      setNotice({ type: 'warning', message: __('Please select a paragraph or heading block first.', 'omni-ai-suite') });
      return;
    }

    const currentContent = selectedBlock.attributes?.content || '';
    let finalPrompt = '';

    if (instruction === 'rephrase') {
      finalPrompt = `Rewrite the following text to make it more engaging and professional:\n"${currentContent}"`;
    } else if (instruction === 'expand') {
      finalPrompt = `Expand the following text with more detail and examples:\n"${currentContent}"`;
    } else if (instruction === 'summarize') {
      finalPrompt = `Summarize the following text concisely:\n"${currentContent}"`;
    } else {
      finalPrompt = `${prompt}\n\nContext text:\n"${currentContent}"`;
    }

    setLoading(true);
    setNotice(null);

    try {
      const restUrl = window.omniAiGutenberg?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiGutenberg?.nonce || '';

      const res = await fetch(`${restUrl}ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data?.text) {
        dispatch('core/block-editor').updateBlockAttributes(selectedBlock.clientId, {
          content: data.data.text.trim(),
        });
        setNotice({ type: 'success', message: __('Block content updated successfully!', 'omni-ai-suite') });
      } else {
        throw new Error(data.message || 'Generation failed.');
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PluginSidebar
      name="omni-ai-sidebar"
      title={__('Omni AI Assistant', 'omni-ai-suite')}
      icon="superhero"
    >
      <div style={{ padding: '16px' }}>
        {notice && (
          <div style={{ marginBottom: '12px' }}>
            <Notice status={notice.type} onDismiss={() => setNotice(null)}>
              {notice.message}
            </Notice>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <SelectControl
            label={__('Quick Action for Selected Block', 'omni-ai-suite')}
            value={instruction}
            options={[
              { label: __('Improve & Polish', 'omni-ai-suite'), value: 'rephrase' },
              { label: __('Expand & Elaborate', 'omni-ai-suite'), value: 'expand' },
              { label: __('Summarize Concisely', 'omni-ai-suite'), value: 'summarize' },
              { label: __('Custom Prompt', 'omni-ai-suite'), value: 'custom' },
            ]}
            onChange={setInstruction}
          />
        </div>

        {instruction === 'custom' && (
          <div style={{ marginBottom: '16px' }}>
            <TextareaControl
              label={__('Custom Prompt', 'omni-ai-suite')}
              value={prompt}
              onChange={setPrompt}
              rows={3}
              placeholder={__('e.g. Translate to Spanish, fix grammar...', 'omni-ai-suite')}
            />
          </div>
        )}

        <Button
          variant="primary"
          onClick={handleApplyToBlock}
          disabled={loading || !selectedBlock}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? (
            <>
              <Spinner /> {__('Transforming...', 'omni-ai-suite')}
            </>
          ) : (
            __('⚡ Apply AI to Selected Block', 'omni-ai-suite')
          )}
        </Button>
      </div>
    </PluginSidebar>
  );
}

registerPlugin('omni-ai-gutenberg', {
  render: () => (
    <Fragment>
      <PluginSidebarMoreMenuItem target="omni-ai-sidebar" icon="superhero">
        {__('Omni AI Assistant', 'omni-ai-suite')}
      </PluginSidebarMoreMenuItem>
      <OmniAiGutenbergSidebar />
    </Fragment>
  ),
});
