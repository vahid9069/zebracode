import { createElement, useState, useEffect, useRef } from '@wordpress/element';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  TextareaControl,
  TextControl,
  SelectControl,
  RangeControl,
  ToggleControl,
  Notice,
  Modal,
  Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useAiStream } from '../hooks/useAiStream';
import { apiFetch } from '../utils/api';

// --- Modal for Managing Custom Prompt Templates ---
function PromptTemplateModal({ isOpen, onClose, customTemplates, onSaveTemplates, onSelectTemplate }) {
  if (!isOpen) return null;

  const [templates, setTemplates] = useState([...customTemplates]);
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const handleAdd = () => {
    if (!newTitle.trim() || !newPrompt.trim()) return;
    const updated = [
      ...templates,
      { id: 'custom_' + Date.now(), title: newTitle.trim(), prompt: newPrompt.trim() },
    ];
    setTemplates(updated);
    setNewTitle('');
    setNewPrompt('');
    saveToServer(updated);
  };

  const handleDelete = (id) => {
    const updated = templates.filter((tpl) => tpl.id !== id);
    setTemplates(updated);
    saveToServer(updated);
  };

  const saveToServer = async (list) => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await apiFetch('prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts: list }),
      });
      const data = await res.json();
      if (data && data.success) {
        onSaveTemplates(list);
        setNotice({ type: 'success', text: __('Template saved successfully.', 'omni-ai-suite') });
      }
    } catch (e) {
      setNotice({ type: 'error', text: __('Error saving template.', 'omni-ai-suite') });
    } finally {
      setSaving(false);
    }
  };

  return (
      <Modal title={__('Manage Quick Prompt Templates & Skills', 'omni-ai-suite')} onRequestClose={onClose} style={{ maxWidth: '640px', width: '92%' }}>
        {notice && <Notice status={notice.type} isDismissible onDismiss={() => setNotice(null)} style={{ marginBottom: '14px' }}>{notice.text}</Notice>}
        <h3 style={{ fontSize: '14px', margin: '0 0 10px 0' }}>{__('Your Custom Templates', 'omni-ai-suite')}</h3>
        {templates.length === 0 ? (
            <p style={{ color: '#646970', fontStyle: 'italic', marginBottom: '16px' }}>{__('No custom templates yet.', 'omni-ai-suite')}</p>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
              {templates.map((tpl) => (
                  <div key={tpl.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f6f7f7', border: '1px solid #dcdcde', borderRadius: '4px' }}>
                    <div style={{ flex: 1, minWidth: 0, marginInlineEnd: '10px' }}>
                      <strong style={{ display: 'block', fontSize: '13px' }}>{tpl.title}</strong>
                      <span style={{ fontSize: '11px', color: '#646970', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.prompt}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button variant="secondary" size="small" onClick={() => { onSelectTemplate(tpl.prompt); onClose(); }}>{__('Use', 'omni-ai-suite')}</Button>
                      <Button variant="tertiary" isDestructive size="small" onClick={() => handleDelete(tpl.id)}>{__('Delete', 'omni-ai-suite')}</Button>
                    </div>
                  </div>
              ))}
            </div>
        )}
        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #dcdcde' }} />
        <h3 style={{ fontSize: '14px', margin: '0 0 10px 0' }}>{__('+ Add New Template', 'omni-ai-suite')}</h3>
        <TextControl label={__('Template Title', 'omni-ai-suite')} value={newTitle} onChange={setNewTitle} />
        <TextareaControl label={__('Prompt Content', 'omni-ai-suite')} value={newPrompt} onChange={setNewPrompt} rows={4} />
        <Button variant="primary" onClick={handleAdd} disabled={!newTitle.trim() || !newPrompt.trim() || saving} style={{ marginTop: '10px' }}>
          {saving ? <Spinner /> : __('Save Template', 'omni-ai-suite')}
        </Button>
      </Modal>
  );
}

// --- Main Content Studio Page ---
export default function ContentStudio({ modelsMap }) {
  // New Topic State for Keyword Injection & Dup Check
  const [topic, setTopic] = useState('');

  // 1. Resolve actual models checking props and global WP localized object
  const actualModels = modelsMap || window.omniAiData?.modelsMap || window.omniAiData?.models || window.omniAiData?.models_map;

  // Ensure safe fallback if actualModels is not provided or empty
  const safeModelsMap = (actualModels && Object.keys(actualModels).length > 0) ? actualModels : {
    gemini: [
      { label: 'Gemini 3.8 Flash', value: 'gemini-3.8-flash' },
      { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
      { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' }
    ],
    openai: [
      { label: 'GPT-4o', value: 'gpt-4o' },
      { label: 'GPT-4o Mini', value: 'gpt-4o-mini' }
    ],
    claude: [
      { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
      { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' }
    ]
  };

  const availableProviders = Object.keys(safeModelsMap).map((key) => ({
    label: key === 'gemini' ? 'Google Gemini' : key === 'openai' ? 'OpenAI' : key === 'claude' ? 'Anthropic Claude' : key,
    value: key,
  }));

  // Advanced States from assets/js/admin.js
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState(() => Object.keys(safeModelsMap)[0] || 'gemini');
  const [model, setModel] = useState(() => {
    const initialProv = Object.keys(safeModelsMap)[0] || 'gemini';
    return safeModelsMap[initialProv]?.[0]?.value || 'gemini-1.5-flash';
  });
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(8192);
  const [postDraftNotice, setPostDraftNotice] = useState(null);
  const [draftResult, setDraftResult] = useState(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [copied, setCopied] = useState(false);

  // Publishing Settings States
  const [customTitle, setCustomTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [customExcerpt, setCustomExcerpt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [postStatus, setPostStatus] = useState('draft');
  const [scheduledDate, setScheduledDate] = useState('');
  const [generateImage, setGenerateImage] = useState(false);
  const [imageProvider, setImageProvider] = useState('gemini');
  const [imageStyle, setImageStyle] = useState('isometric_3d');
  const [imagePromptCustom, setImagePromptCustom] = useState('');

  // Modals & Templates
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);

  const { streaming, output, error, startStream, stopStream, setOutput } = useAiStream();
  const previewRef = useRef(null);

  useEffect(() => {
    const fetchCustomPrompts = async () => {
      try {
        const res = await apiFetch('prompts');
        const data = await res.json();
        if (data && Array.isArray(data.prompts)) setCustomTemplates(data.prompts);
      } catch (e) {}
    };
    fetchCustomPrompts();
  }, []);

  // Synchronize provider & model state if actualModels updates asynchronously
  useEffect(() => {
    if (actualModels && Object.keys(actualModels).length > 0) {
      if (!actualModels[provider]) {
        const firstProv = Object.keys(actualModels)[0];
        setProvider(firstProv);
        if (actualModels[firstProv]?.length > 0) {
          setModel(actualModels[firstProv][0].value);
        }
      } else if (!actualModels[provider].some((m) => m.value === model)) {
        if (actualModels[provider].length > 0) {
          setModel(actualModels[provider][0].value);
        }
      }
    }
  }, [actualModels]);

  useEffect(() => {
    if (previewRef.current && streaming) {
      previewRef.current.scrollTop = previewRef.current.scrollHeight;
    }
  }, [output, streaming]);

  // English SEO/GEO Templates with {{TOPIC}}
  const DEFAULT_TEMPLATES = [
    {
      id: 'seo_geo_article',
      label: __('✍️ Comprehensive Article (SEO/GEO/AEO)', 'omni-ai-suite'),
      prompt: `You are an elite SEO/GEO content strategist, senior technical writer, and web researcher. Write a deeply researched, comprehensive, and up-to-date article in fluent Persian (Farsi) about the following topic:
**Topic:** {{TOPIC}}

### Metadata Structure (Mandatory first 3 lines):
**عنوان مقاله:** [Catchy, SEO-optimized Persian title]
**اسلاگ انگلیسی:** [Clean, short English slug with hyphens, e.g., react-seo-guide]
**چکیده مقاله:** [Compelling 130-150 character Persian meta description containing the core keyword]
---

### Content Generation Guidelines (Strictly Follow):
1. Up-to-Date Real-Time Web Intelligence: Do NOT rely on static, outdated pre-trained assumptions or legacy data. You must write as an active web researcher reflecting the latest state of the internet (2025/2026 standards, latest ecosystem updates, newly released versions, and modern industry consensus). Explicitly cite modern tool versions, recent industry developments, and current best practices.
2. Direct Answer: Immediately after the intro, include a highlighted section named "پاسخ سریع در یک نگاه" that provides a clear, concise answer to the main topic in 2-3 sentences (AEO standard). Do NOT include the English acronym "TL;DR".
3. Rich & Creative Mermaid Diagrams: Wherever explaining architecture, concepts, flowcharts, or relationships, include at least one visually engaging Mermaid code block (\`\`\`mermaid ... \`\`\`). Do NOT produce plain, boring 2-node flowcharts. Choose the most creative and visually compelling diagram type suited for the topic:
   - Modern styled flowcharts with subgraphs, descriptive labels, and emoji-tagged nodes (\`flowchart TD\` or \`flowchart LR\`) using shapes like \`([شروع])\`, \`[(دیتابیس)]\`, or \`{شرط}\`.
   - Rich Concept Mindmaps (\`mindmap\`) breaking down topic hierarchies and key pillars.
   - Priority Matrix / Comparison Quadrant charts (\`quadrantChart\`) or Roadmaps (\`timeline\`).
   - Sequence diagrams (\`sequenceDiagram\`) with autonumbering for workflows and interactions.
   Ensure all node labels inside the diagram are in clear Persian with appropriate emojis (e.g., [🚀 شروع فرآیند], [(🗄️ ذخیره‌سازی داده)]).
4. Smart Image Placeholders: In two strategic locations within the article, insert an image placeholder. Format EXACTLY like this on a new line: [IMAGE: Detailed English prompt for this specific section]
5. Comparison Tables: Include at least one rich Markdown table (| ستون ۱ | ستون ۲ |) comparing modern alternatives, pros/cons, or performance metrics.
6. Structure & Readability: Use proper Markdown headings (H2, H3), bullet points, and bold text (**keywords**) for easy scanning (GEO optimization).
7. FAQ Section: At the end of the article, add 3 frequently asked questions (Long-tail keywords) with precise, concise answers.
8. Tone & Language: Professional, conversational, and direct. The entire article body MUST be in natural Persian (Farsi).

CRITICAL RULE FOR IMAGES: Whenever you need to insert an image placeholder to support the content, you MUST use EXACTLY this syntax on a new line:
[IMAGE: your detailed image prompt in English]
Do NOT use markdown blockquotes, emojis, HTML, or conversational text like "جایگاه تصویر پیشنهادی". Output ONLY the exact bracket format. Example:
[IMAGE: A futuristic server room with neon blue lights, isometric 3D]`
    },
    {
      id: 'step_tutorial',
      label: __('📚 Step-by-Step Guide', 'omni-ai-suite'),
      prompt: `You are an expert technical instructor and researcher. Write a comprehensive, step-by-step practical tutorial in fluent Persian (Farsi) about:
**Topic:** {{TOPIC}}

### Metadata Structure (Mandatory first 3 lines):
**عنوان مقاله:** [Persian Title]
**اسلاگ انگلیسی:** [english-slug-with-hyphens]
**چکیده مقاله:** [Persian Meta Description]
---

### Content Generation Guidelines:
1. Up-to-Date Internet Information: Base this tutorial on the latest active documentation, current software/tool releases, and 2025/2026 web best practices. Avoid deprecated methods, obsolete configs, or outdated code patterns.
2. "پاسخ سریع در یک نگاه" section at the beginning (AEO standard direct answer).
3. Creative Mermaid Visuals: Include at least one creative and visually appealing Mermaid diagram (\`\`\`mermaid ... \`\`\`) illustrating the step-by-step pipeline, architecture, or flow (e.g. \`flowchart TD\` with subgraphs, \`timeline\`, or \`mindmap\`). Use Persian labels and emojis.
4. Requirements/Prerequisites using bullet points.
5. Numbered step-by-step instructions with practical real-world context.
6. Include clean, modern code blocks or commands if applicable.
7. Include one Smart Image Placeholder EXACTLY using this syntax on a new line: [IMAGE: your detailed image prompt in English]
8. Troubleshooting table for common errors and their modern solutions.
9. All output body text MUST be in Persian.

CRITICAL RULE FOR IMAGES: Whenever you need to insert an image placeholder to support the content, you MUST use EXACTLY this syntax on a new line:
[IMAGE: your detailed image prompt in English]
Do NOT use markdown blockquotes, emojis, HTML, or conversational text like "جایگاه تصویر پیشنهادی". Output ONLY the exact bracket format. Example:
[IMAGE: A developer typing code on a laptop, modern office, cinematic lighting]`
    }
  ];

  useEffect(() => {
    if (!prompt) setPrompt(DEFAULT_TEMPLATES[0].prompt);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() && !topic.trim()) return;
    setPostDraftNotice(null);

    // 1. Native WP REST API call to check if a post with the exact topic already exists
    if (topic.trim()) {
      try {
        const searchRes = await apiFetch('wp/v2/posts', {}, {
          search: topic.trim(),
          _fields: 'id,title',
          per_page: 10,
        });
        const searchData = await searchRes.json();

        if (Array.isArray(searchData) && searchData.length > 0) {
          const trimmedTopic = topic.trim().toLowerCase();
          const exactMatch = searchData.find(
            (p) => (p.title?.rendered || '').trim().toLowerCase() === trimmedTopic
          );

          if (exactMatch || searchData.length > 0) {
            const existingTitle = (exactMatch || searchData[0]).title?.rendered || topic.trim();
            const confirmContinue = window.confirm(
              `⚠️ SEO Keyword Cannibalization Warning: A post with a similar or exact title ("${existingTitle}") already exists.\n\nPublishing duplicate content on the same keyword/topic can harm search engine rankings.\n\nDo you want to proceed anyway?`
            );
            if (!confirmContinue) return;
          }
        }
      } catch (e) {
        console.warn('Duplicate post check failed:', e);
      }
    }

    // 2. Dynamic Injection: Replace {{TOPIC}} in prompt with topic state value before passing to startStream
    const finalPrompt = prompt.replace(/\{\{TOPIC\}\}/g, topic.trim());

    startStream({
      prompt: finalPrompt,
      provider,
      model,
      temperature,
      maxTokens,
    });
  };

  // Auto-extract metadata when stream finishes
  useEffect(() => {
    if (output && !streaming) {
      try {
        const titleMatch = output.match(/^[ \t]*(?:#{1,4}|[-*•]|\d+[\.\)])?[ \t]*\*{0,2}عنوان(?: مقاله)?[:\s]*\*{0,2}\s*([^\n\r]+)/mu) || output.match(/^#\s+([^\n\r]+)/m);
        if (titleMatch && titleMatch[1]) setCustomTitle(titleMatch[1].replace(/[*#]/g, '').trim());

        const slugMatch = output.match(/^[ \t]*(?:#{1,4}|[-*•]|\d+[\.\)])?[ \t]*\*{0,2}(?:اسلاگ|نامک)(?: انگلیسی)?[:\s]*\*{0,2}\s*([^\n\r]+)/mu);
        if (slugMatch && slugMatch[1]) {
          const cleanSlug = slugMatch[1].replace(/[*#]/g, '').trim().toLowerCase().replace(/[^a-z0-9\- ]/g, '').replace(/\s+/g, '-');
          setCustomSlug(cleanSlug);
        }

        const excerptMatch = output.match(/^[ \t]*(?:#{1,4}|[-*•]|\d+[\.\)])?[ \t]*\*{0,2}(?:چکیده(?: مقاله)?|متا\s*توضیحات(?: \(Meta Description\))?)[:\s]*\*{0,2}\s*([^\n\r]+)/mu);
        if (excerptMatch && excerptMatch[1]) setCustomExcerpt(excerptMatch[1].replace(/[*#]/g, '').trim());
      } catch (e) {}
    }
  }, [output, streaming]);

  const handleCreateDraft = async () => {
    if (!output || isCreatingDraft) return;
    setIsCreatingDraft(true);
    setPostDraftNotice(null);
    setDraftResult(null);

    try {
      const res = await apiFetch('create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: output,
          prompt: topic || prompt.substring(0, 50),
          title: customTitle.trim(),
          slug: customSlug.trim(),
          excerpt: customExcerpt.trim(),
          category_id: selectedCategory,
          status: postStatus,
          scheduled_date: scheduledDate,
          generate_image: generateImage,
          image_provider: imageProvider,
          image_style: imageStyle,
          image_prompt_custom: imagePromptCustom,
          provider,
          model,
          tokens: Math.round(output.split(/\s+/).length * 1.3),
          post_type: 'post',
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        setPostDraftNotice(data.message || __('Draft post created successfully!', 'omni-ai-suite'));
        setDraftResult(data);
      } else {
        throw new Error(data?.message || __('Failed to save draft post.', 'omni-ai-suite'));
      }
    } catch (err) {
      setPostDraftNotice(err.message);
    } finally {
      setIsCreatingDraft(false);
    }
  };

  return (
      <div>
        {/* Templates Bar */}
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1d2327' }}>{__('Quick Templates:', 'omni-ai-suite')}</span>
          {DEFAULT_TEMPLATES.map((tpl) => (
              <button key={tpl.id} type="button" className="button button-small" style={{ borderRadius: '14px', fontSize: '12px', background: prompt === tpl.prompt ? '#2271b1' : '#f0f0f1', color: prompt === tpl.prompt ? '#fff' : '#1d2327', border: prompt === tpl.prompt ? '1px solid #2271b1' : '1px solid #c3c4c7' }} onClick={() => setPrompt(tpl.prompt)}>
                {tpl.label}
              </button>
          ))}
          {customTemplates.map((tpl) => (
              <button key={tpl.id} type="button" className="button button-small" style={{ borderRadius: '14px', fontSize: '12px', background: prompt === tpl.prompt ? '#2271b1' : '#f0f0f1', color: prompt === tpl.prompt ? '#fff' : '#1d2327', border: prompt === tpl.prompt ? '1px solid #2271b1' : '1px solid #c3c4c7' }} onClick={() => setPrompt(tpl.prompt)}>
                ⭐ {tpl.title}
              </button>
          ))}
          <button type="button" className="button button-small" style={{ borderRadius: '14px', fontSize: '12px', borderColor: '#2271b1', color: '#2271b1', marginInlineStart: 'auto' }} onClick={() => setIsTemplateModalOpen(true)}>
            {__('⚙️ Manage Prompt Templates', 'omni-ai-suite')}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1.2fr)', gap: '24px' }}>
          {/* Left Card: Input Controls */}
          <Card>
            <CardHeader><strong>{__('Prompt & Model Settings', 'omni-ai-suite')}</strong></CardHeader>
            <CardBody>
              <div style={{ marginBottom: '14px' }}>
                <TextControl
                    label={__('Article Topic / Focus Keyword', 'omni-ai-suite')}
                    value={topic}
                    onChange={setTopic}
                    placeholder={__('e.g. WordPress Security Best Practices', 'omni-ai-suite')}
                    help={__('Replaces {{TOPIC}} in the prompt template and checks for SEO keyword cannibalization.', 'omni-ai-suite')}
                    disabled={streaming}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <TextareaControl
                    label={__('Prompt Template (contains {{TOPIC}})', 'omni-ai-suite')}
                    value={prompt}
                    onChange={setPrompt}
                    rows={9}
                    disabled={streaming}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <SelectControl
                    label={__('Provider', 'omni-ai-suite')}
                    value={provider}
                    options={availableProviders}
                    onChange={(newProvider) => {
                      setProvider(newProvider);
                      if (safeModelsMap[newProvider] && safeModelsMap[newProvider].length > 0) {
                        setModel(safeModelsMap[newProvider][0].value);
                      }
                    }}
                    disabled={streaming}
                />
                <SelectControl
                    label={__('Model', 'omni-ai-suite')}
                    value={model}
                    options={safeModelsMap[provider] || []}
                    onChange={setModel}
                    disabled={streaming}
                />
              </div>
              <RangeControl
                  label={__('Creativity (Temperature)', 'omni-ai-suite')}
                  value={temperature}
                  onChange={setTemperature}
                  min={0} max={1} step={0.1}
                  disabled={streaming}
              />
              <div style={{ marginTop: '20px' }}>
                {!streaming ? (
                    <Button variant="primary" onClick={handleGenerate} disabled={!prompt.trim() && !topic.trim()} style={{ width: '100%', justifyContent: 'center' }}>
                      {__('⚡ Stream Generate (SSE)', 'omni-ai-suite')}
                    </Button>
                ) : (
                    <Button variant="secondary" isDestructive onClick={() => { if (stopStream) stopStream(); }} style={{ width: '100%', justifyContent: 'center' }}>
                      {__('⏹ Stop Streaming', 'omni-ai-suite')}
                    </Button>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Right Card: Output & Publishing */}
          <Card>
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{__('Live Output', 'omni-ai-suite')}</strong>
                {streaming && <span style={{ marginInlineStart: '8px', fontSize: '11px', color: '#2271b1', fontWeight: 600 }}>● {__('Streaming chunks...', 'omni-ai-suite')}</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="tertiary" size="small" disabled={!output} onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                  {copied ? __('Copied! ✓', 'omni-ai-suite') : __('Copy Text', 'omni-ai-suite')}
                </Button>
                <Button variant="tertiary" size="small" disabled={!output || streaming} onClick={() => { setOutput(''); setCustomTitle(''); setCustomSlug(''); setCustomExcerpt(''); }}>
                  {__('Clear', 'omni-ai-suite')}
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {error && <Notice status="error" isDismissible onDismiss={() => {}}>{error}</Notice>}
              {postDraftNotice && (
                  <Notice status={draftResult ? 'success' : 'error'} isDismissible onDismiss={() => { setPostDraftNotice(null); setDraftResult(null); }}>
                    {postDraftNotice}
                    {draftResult && draftResult.edit_url && (
                        <a href={draftResult.edit_url} target="_blank" rel="noreferrer" style={{ marginInlineStart: '12px', fontWeight: 600, textDecoration: 'underline' }}>
                          {__('Edit Post in WordPress →', 'omni-ai-suite')}
                        </a>
                    )}
                  </Notice>
              )}

              <div ref={previewRef} className="omni-ai-stream-preview">
                {output ? (
                    <>
                      {output}
                      {streaming && <span className="omni-ai-stream-cursor" />}
                    </>
                ) : (
                    <span style={{ color: '#8c8f94', fontStyle: 'italic' }}>{__('Generated text will stream here in real-time chunk-by-chunk...', 'omni-ai-suite')}</span>
                )}
              </div>

              {/* Advanced Publishing Settings Panel */}
              {output && !streaming && (
                  <div style={{ marginTop: '20px', padding: '18px', background: '#ffffff', border: '1px solid #c3c4c7', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1d2327', marginBottom: '14px', paddingBottom: '8px', borderBottom: '2px solid #2271b1' }}>
                      {__('🚀 WordPress Publishing & Draft Settings', 'omni-ai-suite')}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <TextControl label={__('Article Title (Auto-extracted)', 'omni-ai-suite')} value={customTitle} onChange={setCustomTitle} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '12px' }}>
                      <TextControl label={__('English Slug (Permalink)', 'omni-ai-suite')} value={customSlug} onChange={setCustomSlug} />
                      <SelectControl
                          label={__('Post Category', 'omni-ai-suite')}
                          value={selectedCategory}
                          options={[
                            { label: __('Default Site Category', 'omni-ai-suite'), value: '' },
                            ...(window.omniAiData?.categories || []).map((c) => ({ label: c.name, value: String(c.id) })),
                          ]}
                          onChange={setSelectedCategory}
                      />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <TextareaControl label={__('Article Excerpt (Meta Description)', 'omni-ai-suite')} value={customExcerpt} onChange={setCustomExcerpt} rows={2} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: postStatus === 'future' ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '14px' }}>
                      <SelectControl
                          label={__('Publication Status', 'omni-ai-suite')}
                          value={postStatus}
                          options={[
                            { label: __('Draft (Default)', 'omni-ai-suite'), value: 'draft' },
                            { label: __('Publish Immediately', 'omni-ai-suite'), value: 'publish' },
                            { label: __('Schedule for Future', 'omni-ai-suite'), value: 'future' },
                          ]}
                          onChange={setPostStatus}
                      />
                      {postStatus === 'future' && (
                          <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600 }}>{__('Scheduled Date & Time', 'omni-ai-suite')}</label>
                            <input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid #8c8f94', borderRadius: '4px', background: '#fff' }} />
                          </div>
                      )}
                    </div>

                    {/* AI Featured Image Generator */}
                    <div style={{ marginBottom: '16px', padding: '12px', background: '#f6f7f7', border: '1px solid #dcdcde', borderRadius: '6px' }}>
                      <ToggleControl label={__('Generate & attach AI featured image to post', 'omni-ai-suite')} checked={generateImage} onChange={setGenerateImage} />
                      {generateImage && (
                          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <SelectControl
                                label={__('Image Model', 'omni-ai-suite')}
                                value={imageProvider}
                                options={[
                                  { label: __('Google Gemini (Flash Image / Nano Banana)', 'omni-ai-suite'), value: 'gemini' },
                                  { label: __('OpenAI DALL-E 3', 'omni-ai-suite'), value: 'dall-e' },
                                ]}
                                onChange={setImageProvider}
                              />
                              <SelectControl label={__('Visual Style', 'omni-ai-suite')} value={imageStyle} options={[{ label: 'Modern 3D Isometric', value: 'isometric_3d' }, { label: 'Flat Vector', value: 'flat_vector' }, { label: 'Photorealistic', value: 'photoreal' }, { label: 'Cyber Tech', value: 'cyber_tech' }, { label: 'Corporate', value: 'corporate' }]} onChange={setImageStyle} />
                            </div>
                            <TextControl label={__('Custom Visual Prompt (Optional)', 'omni-ai-suite')} value={imagePromptCustom} onChange={setImagePromptCustom} placeholder={__('Leave empty to auto-generate based on article title...', 'omni-ai-suite')} />
                          </div>
                      )}
                    </div>

                    <Button variant={postStatus === 'publish' ? 'primary' : 'secondary'} onClick={handleCreateDraft} disabled={isCreatingDraft} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      {isCreatingDraft ? <Spinner /> : <span className={postStatus === 'publish' ? 'dashicons dashicons-yes' : 'dashicons dashicons-edit'} />}
                      {isCreatingDraft ? (generateImage ? __('Saving & generating image...', 'omni-ai-suite') : __('Saving...', 'omni-ai-suite')) : (postStatus === 'publish' ? __('Publish Post', 'omni-ai-suite') : postStatus === 'future' ? __('Schedule Post', 'omni-ai-suite') : __('Save Draft Post', 'omni-ai-suite'))}
                    </Button>
                  </div>
              )}
            </CardBody>
          </Card>
        </div>

        <PromptTemplateModal
            isOpen={isTemplateModalOpen}
            onClose={() => setIsTemplateModalOpen(false)}
            customTemplates={customTemplates}
            onSaveTemplates={setCustomTemplates}
            onSelectTemplate={(tplPrompt) => setPrompt(tplPrompt)}
        />
      </div>
  );
}