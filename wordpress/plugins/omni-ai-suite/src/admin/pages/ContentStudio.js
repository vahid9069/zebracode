import { createElement, useState, useEffect, useRef } from '@wordpress/element';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  TextareaControl,
  SelectControl,
  RangeControl,
  Notice,
  Flex,
  FlexItem,
  FlexBlock,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useAiStream } from '../hooks/useAiStream';

export default function ContentStudio() {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [postDraftNotice, setPostDraftNotice] = useState(null);
  const [copied, setCopied] = useState(false);

  const { streaming, output, error, startStream, stopStream, setOutput } = useAiStream();
  const previewRef = useRef(null);

  // Auto-scroll output while streaming
  useEffect(() => {
    if (previewRef.current && streaming) {
      previewRef.current.scrollTop = previewRef.current.scrollHeight;
    }
  }, [output, streaming]);

  const templates = [
    {
      label: __('Article Outline', 'omni-ai-suite'),
      prompt: __('Write a comprehensive, engaging article outline with H2 and H3 subheadings for: [Enter Topic]', 'omni-ai-suite'),
      sys: __('You are an expert content strategist. Organize with logical flow and compelling headings.', 'omni-ai-suite'),
    },
    {
      label: __('SEO Meta Description', 'omni-ai-suite'),
      prompt: __('Write 3 compelling SEO meta descriptions under 160 characters with call-to-actions for: [Enter Topic/URL]', 'omni-ai-suite'),
      sys: __('You are an SEO copywriter. Keep each meta description strictly under 155-160 characters.', 'omni-ai-suite'),
    },
    {
      label: __('Blog Post Full Draft', 'omni-ai-suite'),
      prompt: __('Write an informative, well-researched 800-word blog post about: [Enter Topic]. Include intro, actionable tips, and conclusion.', 'omni-ai-suite'),
      sys: __('You are an expert copywriter. Use conversational tone, clear markdown formatting and bullet points.', 'omni-ai-suite'),
    },
    {
      label: __('Product Description', 'omni-ai-suite'),
      prompt: __('Create a captivating eCommerce product description highlighting benefits, craftsmanship, and key specs for: [Enter Product]', 'omni-ai-suite'),
      sys: __('You are a persuasive eCommerce conversion copywriter.', 'omni-ai-suite'),
    },
  ];

  const handleApplyTemplate = (tpl) => {
    setPrompt(tpl.prompt);
    setSystemPrompt(tpl.sys);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setPostDraftNotice(null);
    startStream({
      prompt,
      provider,
      model,
      systemPrompt,
      temperature,
      maxTokens,
    });
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCreateDraft = async () => {
    if (!output) return;
    try {
      const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiData?.nonce || '';
      const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;

      const res = await fetch(`${restUrl}bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: JSON.stringify({
          prompts: [{ prompt: output, title }],
          provider,
          model,
          post_status: 'draft',
          post_type: 'post',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPostDraftNotice(__('Draft post created successfully! Check your Posts menu.', 'omni-ai-suite'));
      }
    } catch (err) {
      setPostDraftNotice(__('Failed to save draft post.', 'omni-ai-suite'));
    }
  };

  return (
    <div>
      {/* Template chips */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1d2327', marginRight: '8px' }}>
          {__('Quick Templates:', 'omni-ai-suite')}
        </span>
        <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '6px' }}>
          {templates.map((tpl, i) => (
            <button
              key={i}
              type="button"
              className="button button-small"
              onClick={() => handleApplyTemplate(tpl)}
              style={{ borderRadius: '12px', fontSize: '12px' }}
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1.2fr)', gap: '24px' }}>
        {/* Left Column: Prompt Controls */}
        <Card>
          <CardHeader>
            <strong>{__('Prompt & Generation Settings', 'omni-ai-suite')}</strong>
          </CardHeader>
          <CardBody>
            <div style={{ marginBottom: '14px' }}>
              <TextareaControl
                label={__('User Prompt', 'omni-ai-suite')}
                value={prompt}
                onChange={setPrompt}
                rows={6}
                placeholder={__('What would you like the AI to generate or analyze?', 'omni-ai-suite')}
                disabled={streaming}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <TextareaControl
                label={__('System Instructions (Optional)', 'omni-ai-suite')}
                value={systemPrompt}
                onChange={setSystemPrompt}
                rows={2}
                placeholder={__('e.g., Tone of voice, formatting instructions...', 'omni-ai-suite')}
                disabled={streaming}
              />
            </div>

            <Flex style={{ marginBottom: '14px' }}>
              <FlexItem isBlock>
                <SelectControl
                  label={__('AI Provider', 'omni-ai-suite')}
                  value={provider}
                  options={[
                    { label: 'Google Gemini', value: 'gemini' },
                    { label: 'OpenAI', value: 'openai' },
                    { label: 'Anthropic Claude', value: 'claude' },
                  ]}
                  onChange={(val) => {
                    setProvider(val);
                    if (val === 'gemini') setModel('gemini-1.5-flash');
                    if (val === 'openai') setModel('gpt-4o-mini');
                    if (val === 'claude') setModel('claude-3-5-sonnet-20241022');
                  }}
                  disabled={streaming}
                />
              </FlexItem>
              <FlexItem isBlock>
                <SelectControl
                  label={__('Model', 'omni-ai-suite')}
                  value={model}
                  options={
                    provider === 'gemini'
                      ? [
                          { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
                          { label: 'Gemini 1.5 Flash (Latest)', value: 'gemini-1.5-flash-latest' },
                          { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
                          { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
                        ]
                      : provider === 'openai'
                      ? [
                          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
                          { label: 'GPT-4o', value: 'gpt-4o' },
                          { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
                        ]
                      : [
                          { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
                          { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
                          { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
                        ]
                  }
                  onChange={setModel}
                  disabled={streaming}
                />
              </FlexItem>
            </Flex>

            <RangeControl
              label={__('Creativity (Temperature)', 'omni-ai-suite')}
              value={temperature}
              onChange={setTemperature}
              min={0}
              max={1}
              step={0.1}
              disabled={streaming}
            />

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              {!streaming ? (
                <Button
                  variant="primary"
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {__('⚡ Stream Generate (SSE)', 'omni-ai-suite')}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  isDestructive
                  onClick={stopStream}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {__('⏹ Stop Streaming', 'omni-ai-suite')}
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Right Column: Real-Time Streaming Output */}
        <Card>
          <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{__('Live Output', 'omni-ai-suite')}</strong>
              {streaming && (
                <span style={{ marginLeft: '8px', fontSize: '11px', color: '#2271b1', fontWeight: 600 }}>
                  ● {__('Streaming chunks...', 'omni-ai-suite')}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="tertiary"
                onClick={handleCopy}
                disabled={!output}
                size="small"
              >
                {copied ? __('Copied! ✓', 'omni-ai-suite') : __('Copy Text', 'omni-ai-suite')}
              </Button>
              <Button
                variant="tertiary"
                onClick={() => setOutput('')}
                disabled={!output || streaming}
                size="small"
              >
                {__('Clear', 'omni-ai-suite')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {error && (
              <div style={{ marginBottom: '12px' }}>
                <Notice status="error" isDismissible={false}>
                  {error}
                </Notice>
              </div>
            )}

            {postDraftNotice && (
              <div style={{ marginBottom: '12px' }}>
                <Notice status="success" onDismiss={() => setPostDraftNotice(null)}>
                  {postDraftNotice}
                </Notice>
              </div>
            )}

            <div ref={previewRef} className="omni-ai-stream-preview">
              {output ? (
                <>
                  {output}
                  {streaming && <span className="omni-ai-stream-cursor" />}
                </>
              ) : error ? (
                <div style={{ color: '#d63638', padding: '12px 14px', background: '#fcf0f1', border: '1px solid #f5c6cb', borderRadius: '4px', fontSize: '13px', lineHeight: '1.5' }}>
                  <strong style={{ display: 'block', marginBottom: '6px' }}>⚠️ {__('AI Provider Error:', 'omni-ai-suite')}</strong>
                  <span>{error}</span>
                </div>
              ) : (
                <span style={{ color: '#8c8f94', fontStyle: 'italic' }}>
                  {__('Generated text will stream here in real-time chunk-by-chunk...', 'omni-ai-suite')}
                </span>
              )}
            </div>

            {output && !streaming && (
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <Button
                  variant="secondary"
                  onClick={handleCreateDraft}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span className="dashicons dashicons-admin-post" />
                  {__('Save As Draft Post', 'omni-ai-suite')}
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
