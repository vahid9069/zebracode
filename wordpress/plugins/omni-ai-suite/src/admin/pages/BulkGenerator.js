import { createElement, useState } from '@wordpress/element';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  TextareaControl,
  SelectControl,
  Notice,
  Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function BulkGenerator() {
  const [promptsInput, setPromptsInput] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [postStatus, setPostStatus] = useState('draft');
  const [postType, setPostType] = useState('post');
  const [systemPrompt, setSystemPrompt] = useState(
    'Write a comprehensive, SEO-optimized article with headings (H2, H3), bullet points, and actionable tips.'
  );
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawLines = promptsInput
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (rawLines.length === 0) {
      setFeedback({ type: 'error', message: __('Please enter at least one topic or prompt.', 'omni-ai-suite') });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiData?.nonce || '';

      const promptsList = rawLines.map((line) => ({
        title: line,
        prompt: `Write a complete blog post on the topic: ${line}`,
      }));

      const res = await fetch(`${restUrl}bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: JSON.stringify({
          prompts: promptsList,
          provider,
          model,
          system_prompt: systemPrompt,
          post_status: postStatus,
          post_type: postType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: data.message || `${rawLines.length} tasks successfully enqueued into background worker!`,
        });
        setPromptsInput('');
      } else {
        throw new Error(data.message || 'Failed to enqueue tasks.');
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error occurred while scheduling background tasks.' });
    } finally {
      setLoading(false);
    }
  };

  const lineCount = promptsInput
    .split('\n')
    .filter((l) => l.trim().length > 0).length;

  return (
    <div style={{ maxWidth: '800px' }}>
      <Card>
        <CardHeader>
          <div>
            <strong>{__('⚡ Asynchronous Bulk Content Generation', 'omni-ai-suite')}</strong>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#646970' }}>
              {__(
                'Powered by Action Scheduler: jobs are dispatched asynchronously in background workers, completely eliminating HTTP 504 timeouts.',
                'omni-ai-suite'
              )}
            </p>
          </div>
        </CardHeader>
        <CardBody>
          {feedback && (
            <div style={{ marginBottom: '16px' }}>
              <Notice status={feedback.type} onDismiss={() => setFeedback(null)}>
                {feedback.message}
              </Notice>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <TextareaControl
                label={__('Article Titles or Topics (One per line)', 'omni-ai-suite')}
                value={promptsInput}
                onChange={setPromptsInput}
                rows={8}
                placeholder={__(
                  "Top 10 Web Development Trends in 2026\nHow to Optimize Next.js Performance\nBeginner Guide to Tailwind CSS\nCybersecurity Best Practices for WordPress",
                  'omni-ai-suite'
                )}
                help={
                  lineCount > 0
                    ? sprintf(__('%d articles detected to generate.', 'omni-ai-suite'), lineCount)
                    : __('Enter one topic per line. Each will become a dedicated draft post.', 'omni-ai-suite')
                }
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <TextareaControl
                label={__('System Instructions Template', 'omni-ai-suite')}
                value={systemPrompt}
                onChange={setSystemPrompt}
                rows={2}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <SelectControl
                label={__('AI Provider', 'omni-ai-suite')}
                value={provider}
                options={[
                  { label: 'Google Gemini', value: 'gemini' },
                  { label: 'OpenAI', value: 'openai' },
                  { label: 'Anthropic Claude', value: 'claude' },
                ]}
                onChange={setProvider}
              />

              <SelectControl
                label={__('Model', 'omni-ai-suite')}
                value={model}
                options={
                  provider === 'gemini'
                    ? [
                        { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
                        { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
                      ]
                    : provider === 'openai'
                    ? [
                        { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
                        { label: 'GPT-4o', value: 'gpt-4o' },
                      ]
                    : [
                        { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
                        { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
                      ]
                }
                onChange={setModel}
              />

              <SelectControl
                label={__('Created Post Status', 'omni-ai-suite')}
                value={postStatus}
                options={[
                  { label: __('Draft (Recommended)', 'omni-ai-suite'), value: 'draft' },
                  { label: __('Pending Review', 'omni-ai-suite'), value: 'pending' },
                  { label: __('Private', 'omni-ai-suite'), value: 'private' },
                ]}
                onChange={setPostStatus}
              />

              <SelectControl
                label={__('Post Type', 'omni-ai-suite')}
                value={postType}
                options={[
                  { label: __('Posts (Blog)', 'omni-ai-suite'), value: 'post' },
                  { label: __('Pages', 'omni-ai-suite'), value: 'page' },
                ]}
                onChange={setPostType}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button
                variant="primary"
                type="submit"
                disabled={loading || lineCount === 0}
              >
                {loading ? (
                  <>
                    <Spinner /> {__('Queueing Jobs...', 'omni-ai-suite')}
                  </>
                ) : (
                  sprintf(__('🚀 Enqueue %d Articles to Background Queue', 'omni-ai-suite'), Math.max(1, lineCount))
                )}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
