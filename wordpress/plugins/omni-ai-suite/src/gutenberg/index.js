import { createElement, useState, useEffect, Fragment } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/edit-post';
import {
  Button,
  TextControl,
  TextareaControl,
  SelectControl,
  Spinner,
  Notice,
} from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { select, dispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

// کلمات ربط و اتصال استاندارد فارسی جهت بررسی سریع در فرانت‌اند
const PERSIAN_TRANSITIONS = [
  'بنابراین', 'در نتیجه', 'همچنین', 'هم‌چنین', 'علاوه بر این', 'علاوه‌براین',
  'با این حال', 'اگرچه', 'به عنوان مثال', 'به‌عنوان مثال', 'برای نمونه', 'در واقع',
  'از سوی دیگر', 'به طور خلاصه', 'به‌طور خلاصه', 'به علاوه', 'به‌علاوه', 'به ویژه', 'به‌ویژه',
  'اما', 'زیرا', 'چرا که', 'از این رو', 'در نهایت', 'بدین ترتیب', 'البته', 'چون', 'بلکه'
];

// تابع هوشمند استخراج متن تمیز از هر نوع بلوک گوتنبرگ (جدول، پاراگراف، لیست، تیتر، نقل‌قول و...)
function extractBlockText(block) {
  if (!block) return '';

  // ۱. بلوک‌های متن استاندارد (پاراگراف، سرتیتر)
  if (typeof block.attributes?.content === 'string' && block.attributes.content.trim()) {
    return block.attributes.content.replace(/<[^>]+>/g, '').trim();
  }

  // ۲. بلوک جدول (core/table) - استخراج خانه‌های هدر و بدنه
  if (block.name === 'core/table') {
    const cellsText = [];
    const head = block.attributes?.head || [];
    const body = block.attributes?.body || [];

    head.forEach((row) => {
      (row.cells || []).forEach((c) => {
        const txt = (c.content || '').replace(/<[^>]+>/g, '').trim();
        if (txt) cellsText.push(txt);
      });
    });

    body.forEach((row) => {
      (row.cells || []).forEach((c) => {
        const txt = (c.content || '').replace(/<[^>]+>/g, '').trim();
        if (txt) cellsText.push(txt);
      });
    });

    if (cellsText.length) {
      return cellsText.join(' | ');
    }
  }

  // ۳. بلوک لیست (core/list)
  if (block.name === 'core/list' && Array.isArray(block.innerBlocks) && block.innerBlocks.length) {
    return block.innerBlocks
      .map((b) => (b.attributes?.content || '').replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .join('\n');
  }

  // ۴. بلوک نقل‌قول و بیت (core/quote / core/verse)
  if (typeof block.attributes?.value === 'string' && block.attributes.value.trim()) {
    return block.attributes.value.replace(/<[^>]+>/g, '').trim();
  }
  if (typeof block.attributes?.citation === 'string' && block.attributes.citation.trim()) {
    return block.attributes.citation.replace(/<[^>]+>/g, '').trim();
  }

  // ۵. استفاده از متن رندرشده بلوک در DOM به عنوان پشتیبان نهایی (پشتیبانی از iframe)
  if (block.clientId) {
    const canvas = document.querySelector('iframe[name="editor-canvas"]');
    const doc = canvas?.contentDocument || document;
    const el =
      doc.querySelector(`[data-block="${block.clientId}"]`) ||
      doc.getElementById(`block-${block.clientId}`);
    if (el) {
      const domText = el.innerText ? el.innerText.trim() : '';
      if (domText) return domText;
    }
  }

  return '';
}

function OmniAiGutenbergSidebar() {
  const [activeTab, setActiveTab] = useState('readability');
  const [prompt, setPrompt] = useState('');
  const [instruction, setInstruction] = useState('rephrase');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [fixingAllReadability, setFixingAllReadability] = useState(false);
  const [notice, setNotice] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [sentenceFixes, setSentenceFixes] = useState({});
  const [fixingSentence, setFixingSentence] = useState(null);
  const [showIssuesList, setShowIssuesList] = useState(false);

  // دریافت شناسه نوشته و متاها از استور گوتنبرگ
  const postId = useSelect((selectData) => {
    return selectData('core/editor').getCurrentPostId() || window.omniAiGutenberg?.postId || 0;
  }, []);

  const meta = useSelect((selectData) => {
    return selectData('core/editor').getEditedPostAttribute('meta') || {};
  }, []);

  const selectedBlock = useSelect((selectData) => {
    return selectData('core/block-editor').getSelectedBlock();
  }, []);

  const focusKeyword = meta._omni_ai_focus_keyword || '';
  const seoTitle = meta._omni_ai_seo_title || '';
  const metaDescription = meta._omni_ai_meta_description || '';

  // متن تمیز استخراج شده از بلوک جاری
  const extractedBlockText = selectedBlock ? extractBlockText(selectedBlock) : '';

  // بارگذاری اولیه ارزیابی رتبه‌بندی هنگام باز شدن سایدبار
  useEffect(() => {
    if (!postId) return;
    const fetchRatings = async () => {
      try {
        const formData = new FormData();
        formData.append('action', 'omni_ai_reanalyze_post_ratings');
        formData.append('security', window.omniAiGutenberg?.nonce || '');
        formData.append('post_id', postId);

        const res = await fetch(window.omniAiGutenberg?.ajaxUrl || '/wp-admin/admin-ajax.php', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data && data.success && data.data && data.data.ratings) {
          setRatings(data.data.ratings);
        }
      } catch (_) {}
    };
    fetchRatings();
  }, [postId]);

  // بروزرسانی کلمه کلیدی کانونی در استور گوتنبرگ
  const handleKeywordChange = (newKw) => {
    dispatch('core/editor').editPost({
      meta: {
        ...meta,
        _omni_ai_focus_keyword: newKw,
      },
    });
  };

  // تحلیل مجدد و محاسبه زنده امتیازات
  const handleRecalculate = async () => {
    if (!postId) return;
    setAnalyzing(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append('action', 'omni_ai_reanalyze_post_ratings');
      formData.append('security', window.omniAiGutenberg?.nonce || '');
      formData.append('post_id', postId);

      const res = await fetch(window.omniAiGutenberg?.ajaxUrl || '/wp-admin/admin-ajax.php', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data && data.success && data.data && data.data.ratings) {
        setRatings(data.data.ratings);
        setNotice({ type: 'success', message: 'امتیازهای سئو و خوانایی با موفقیت به‌روزرسانی شدند.' });
      } else {
        throw new Error(data?.data?.message || 'خطا در ارزیابی محتوا');
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'خطا در ارتباط با سرور' });
    } finally {
      setAnalyzing(false);
    }
  };

  // اجرای رفع خودکار با AI در تب سئو
  const handleAutoFix = async () => {
    if (!postId) return;
    setGenerating(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append('action', 'omni_ai_optimize_post_content');
      formData.append('security', window.omniAiGutenberg?.nonce || '');
      formData.append('post_id', postId);

      const res = await fetch(window.omniAiGutenberg?.ajaxUrl || '/wp-admin/admin-ajax.php', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data || !data.success || !data.data?.suggestions) {
        throw new Error(data?.data?.message || 'پاسخ معتبری از هوش مصنوعی دریافت نشد.');
      }

      const sug = data.data.suggestions;
      const applyData = new FormData();
      applyData.append('action', 'omni_ai_apply_optimization');
      applyData.append('security', window.omniAiGutenberg?.nonce || '');
      applyData.append('post_id', postId);
      applyData.append('focus_keyword', sug.focus_keyword || focusKeyword);
      applyData.append('seo_title', sug.seo_title || seoTitle);
      applyData.append('direct_answer', sug.direct_answer || '');
      applyData.append('faq_section', sug.faq_section || '');
      applyData.append('conclusion_section', sug.conclusion_section || '');
      applyData.append('meta_description', sug.meta_description || metaDescription);

      const applyRes = await fetch(window.omniAiGutenberg?.ajaxUrl || '/wp-admin/admin-ajax.php', {
        method: 'POST',
        body: applyData,
      });
      const applyJson = await applyRes.json();
      if (applyJson && applyJson.success) {
        setNotice({
          type: 'success',
          message: '✅ بهینه‌سازی جامع هوش مصنوعی (AEO، GEO، کلمه کلیدی، Alt و اسنیپت) با موفقیت اعمال شد.',
        });
        if (applyJson.data?.ratings) {
          setRatings(applyJson.data.ratings);
        }
      } else {
        throw new Error(applyJson?.data?.message || 'خطا در ذخیره‌سازی محتوا.');
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'خطا در بهینه‌سازی هوش مصنوعی' });
    } finally {
      setGenerating(false);
    }
  };

  // اسکرول و انتخاب بلوک حاوی جمله مورد نظر در ویرایشگر گوتنبرگ با تطابق هوشمند
  const handleScrollToSentence = (sentence) => {
    if (!sentence) return;
    const allBlocks = select('core/block-editor').getBlocks();
    const cleanSent = sentence.replace(/[«»"'.,،؛:!?؟\s]+/g, ' ').trim();
    const sentWords = cleanSent.split(' ').filter((w) => w.length >= 2);

    const findBlock = (blocks) => {
      for (const b of blocks) {
        const text = extractBlockText(b).replace(/[«»"'.,،؛:!?؟\s]+/g, ' ').trim();
        if (text && (text.includes(cleanSent) || cleanSent.includes(text))) {
          return b;
        }
        if (sentWords.length >= 2) {
          const matchCount = sentWords.filter((w) => text.includes(w)).length;
          if (matchCount / sentWords.length >= 0.7) {
            return b;
          }
        }
        if (b.innerBlocks?.length) {
          const found = findBlock(b.innerBlocks);
          if (found) return found;
        }
      }
      return null;
    };

    const targetBlock = findBlock(allBlocks);
    if (targetBlock) {
      dispatch('core/block-editor').selectBlock(targetBlock.clientId);
      const canvas = document.querySelector('iframe[name="editor-canvas"]');
      const doc = canvas?.contentDocument || document;
      const el =
        doc.querySelector(`[data-block="${targetBlock.clientId}"]`) ||
        doc.getElementById(`block-${targetBlock.clientId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setNotice({ type: 'info', message: 'بخش مربوطه در صفحه انتخاب و نمایش داده شد.' });
    } else {
      setNotice({ type: 'warning', message: 'بلوک مربوط به این جمله در ویرایشگر پیدا نشد.' });
    }
  };

  // اعمال مستقیم و قطعی جمله اصلاح‌شده در پاراگراف مربوطه در استور گوتنبرگ
  const handleApplySentenceFix = (oldSent, newSent) => {
    const allBlocks = select('core/block-editor').getBlocks();
    const cleanOld = oldSent.replace(/[«»"'.,،؛:!?؟\s]+/g, ' ').trim();
    const oldWords = cleanOld.split(' ').filter((w) => w.length >= 2);

    const updateBlock = (blocks) => {
      for (const b of blocks) {
        if (b.name === 'core/paragraph' && b.attributes?.content) {
          const raw = b.attributes.content;

          // ۱. تطابق مستقیم کاراکتر به کاراکتر
          if (raw.includes(oldSent.trim())) {
            const updated = raw.replace(oldSent.trim(), newSent.trim());
            dispatch('core/block-editor').updateBlockAttributes(b.clientId, { content: updated });
            return true;
          }

          // ۲. تطابق بدون تگ‌های HTML (حذف تگ‌های <strong> یا <code>)
          const cleanRaw = raw.replace(/<[^>]+>/g, '').replace(/[«»"'.,،؛:!?؟\s]+/g, ' ').trim();
          if (cleanRaw.includes(cleanOld) || cleanOld.includes(cleanRaw)) {
            dispatch('core/block-editor').updateBlockAttributes(b.clientId, { content: newSent.trim() });
            return true;
          }

          // ۳. تطابق فازی بر اساس کلمات کلیدی جمله
          if (oldWords.length >= 2) {
            const matchCount = oldWords.filter((w) => cleanRaw.includes(w)).length;
            if (matchCount / oldWords.length >= 0.7) {
              dispatch('core/block-editor').updateBlockAttributes(b.clientId, { content: newSent.trim() });
              return true;
            }
          }
        }

        if (b.innerBlocks?.length) {
          if (updateBlock(b.innerBlocks)) return true;
        }
      }
      return false;
    };

    const success = updateBlock(allBlocks);
    if (success) {
      setNotice({ type: 'success', message: '✅ جمله اصلاح‌شده با موفقیت در پاراگراف جایگزین شد.' });
      setSentenceFixes((prev) => {
        const copy = { ...prev };
        delete copy[oldSent];
        return copy;
      });
      setTimeout(() => {
        handleRecalculate();
      }, 600);
    } else {
      // اگر پاراگراف مستقیم پیدا نشد، یک پاراگراف تازه درست زیر بلوک فعال ایجاد کن
      const selected = select('core/block-editor').getSelectedBlock();
      if (selected) {
        const newBlock = createBlock('core/paragraph', { content: newSent.trim() });
        const idx = select('core/block-editor').getBlockIndex(selected.clientId);
        dispatch('core/block-editor').insertBlocks(newBlock, idx + 1);
        setNotice({ type: 'success', message: '✅ متن اصلاح‌شده به صورت پاراگراف جدید به نوشته اضافه شد.' });
        setTimeout(() => handleRecalculate(), 600);
      } else {
        setNotice({
          type: 'warning',
          message: 'پاراگراف این جمله پیدا نشد؛ لطفاً از دکمه «✨ اصلاح خودکار خوانایی متن» در بالای سایدبار استفاده فرمایید.',
        });
      }
    }
  };

  // اصلاح سریع یک جمله فاقد کلمه ربط با هوش مصنوعی
  const handleQuickFixTransition = async (sentence) => {
    setFixingSentence(sentence);
    try {
      const restUrl = window.omniAiGutenberg?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiGutenberg?.restNonce || window.omniAiGutenberg?.nonce || '';

      const promptText = `جمله زیر را طوری بازنویسی کن که به طور طبیعی با یکی از کلمات ربط مناسب زبان فارسی (مانند: همچنین، علاوه بر این، بنابراین، به عنوان مثال، در نتیجه، در واقع) آغاز یا پیوند داده شود. لحن متن حفظ شود و فقط و فقط جمله بازنویسی‌شده را بدون هیچ توضیح اضافی یا نقل‌قول بنویس:\n"${sentence}"`;

      const res = await fetch(`${restUrl}ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data?.text) {
        const cleaned = data.data.text.trim().replace(/^["'«]+|["'»]+$/g, '');
        setSentenceFixes((prev) => ({
          ...prev,
          [sentence]: cleaned,
        }));
      }
    } catch (_) {
    } finally {
      setFixingSentence(null);
    }
  };

  // اصلاح خودکار و هوشمند کل خوانایی و افزودن کلمات ربط به متن نوشته
  const handleAutoFixAllReadability = async () => {
    setFixingAllReadability(true);
    setNotice(null);
    try {
      // ۱. ابتدا فراخوانی ایجکس بهینه سرور برای پایداری دیتا در دیتابیس
      let serverFixed = false;
      try {
        const formData = new FormData();
        formData.append('action', 'omni_ai_fix_readability');
        formData.append('security', window.omniAiGutenberg?.nonce || '');
        formData.append('post_id', postId);

        const res = await fetch(window.omniAiGutenberg?.ajaxUrl || '/wp-admin/admin-ajax.php', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data && data.success) {
          serverFixed = true;
          if (data.data?.ratings) {
            setRatings(data.data.ratings);
          }
        }
      } catch (_) {}

      // ۲. اسکن پاراگراف‌های استور گوتنبرگ و اعمال بلادرنگ در ادیتور
      const allBlocks = select('core/block-editor').getBlocks();
      const paragraphBlocks = [];

      const findParagraphs = (blocks) => {
        for (const b of blocks) {
          if (b.name === 'core/paragraph' && b.attributes?.content) {
            const raw = b.attributes.content.replace(/<[^>]+>/g, '').trim();
            if (raw.length > 25) {
              paragraphBlocks.push(b);
            }
          }
          if (b.innerBlocks && b.innerBlocks.length) {
            findParagraphs(b.innerBlocks);
          }
        }
      };
      findParagraphs(allBlocks);

      if (paragraphBlocks.length === 0) {
        setNotice({
          type: 'warning',
          message: 'هیچ بلوک پاراگراف متنی در نوشته یافت نشد. برای بهبود خوانایی حداقل یک پاراگراف اضافه کنید.',
        });
        return;
      }

      // فیلتر پاراگراف‌های فاقد کلمه ربط
      const needy = paragraphBlocks.filter((b) => {
        const text = b.attributes.content.replace(/<[^>]+>/g, '');
        return !PERSIAN_TRANSITIONS.some((tw) => text.includes(tw));
      });

      const targets = needy.length > 0 ? needy.slice(0, 3) : paragraphBlocks.slice(0, 2);
      let updatedCount = 0;

      const restUrl = window.omniAiGutenberg?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiGutenberg?.restNonce || window.omniAiGutenberg?.nonce || '';

      for (const b of targets) {
        const originalText = b.attributes.content.replace(/<[^>]+>/g, '').trim();
        const promptText = `پاراگراف زیر را به گونه‌ای بازنویسی و اصلاح کن که به شکل طبیعی، سلیس و روان از کلمات ربط و اتصال فارسی (مانند «همچنین»، «علاوه بر این»، «در نتیجه»، «بنابراین»، «برای نمونه» یا «در واقع») در متن یا ابتدای جملات آن استفاده شود. تمام نکات، آمار و اطلاعات حفظ شوند. فقط و فقط متن نهایی پاراگراف بازنویسی‌شده را بدون هیچ توضیح اضافه یا علامت نقل‌قول برگردان:\n"${originalText}"`;

        const res = await fetch(`${restUrl}ask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': nonce,
          },
          body: JSON.stringify({ prompt: promptText }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.data?.text) {
          const fixedText = data.data.text.trim().replace(/^["'«]+|["'»]+$/g, '');
          if (
            fixedText &&
            !fixedText.includes('لطفاً متنی') &&
            !fixedText.includes('متنی ارائه نشده') &&
            fixedText.length >= 20
          ) {
            dispatch('core/block-editor').updateBlockAttributes(b.clientId, {
              content: fixedText,
            });
            updatedCount++;
          }
        }
      }

      if (updatedCount > 0 || serverFixed) {
        setNotice({
          type: 'success',
          message: '✅ کلمات ربط و روانی متن با موفقیت توسط هوش مصنوعی در نوشته اعمال شد.',
        });
        setTimeout(() => {
          handleRecalculate();
        }, 800);
      } else {
        setNotice({
          type: 'info',
          message: 'تمام پاراگراف‌های نوشته از لحاظ کلمات ربط و ساختار خوانایی بررسی شدند.',
        });
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'خطا در اصلاح خودکار خوانایی' });
    } finally {
      setFixingAllReadability(false);
    }
  };

  // اعمال هوش مصنوعی روی هر نوع بلوک انتخاب‌شده
  const handleApplyToBlock = async () => {
    if (!selectedBlock) {
      setNotice({ type: 'warning', message: 'لطفاً ابتدا یک بلوک (پاراگراف، تیتر یا جدول) را در ویرایشگر انتخاب کنید.' });
      return;
    }

    const currentContent = extractedBlockText;
    if (!currentContent || currentContent.trim().length < 5) {
      setNotice({
        type: 'warning',
        message: 'متن کافی در این بلوک یافت نشد. لطفاً یک بلوک حاوی متن یا پاراگراف را انتخاب کنید.',
      });
      return;
    }

    let finalPrompt = '';
    const isTable = selectedBlock.name === 'core/table';

    if (isTable) {
      finalPrompt = `بر اساس داده‌ها و ستون‌های جدول زیر، یک پاراگراف تحلیلی، بسیار روان و خوانا بنویس که محتوای این جدول را با استفاده از کلمات ربط استاندارد (مانند بنابراین، همچنین، در نتیجه) توضیح دهد. فقط و فقط متن پاراگراف تحلیلی را بدون هیچ توضیح اضافی برگردان:\n\nداده‌های جدول:\n"${currentContent}"`;
    } else if (instruction === 'rephrase') {
      finalPrompt = `متن زیر را با لحنی شیوا، کاملاً روان و با استفاده از کلمات ربط مناسب (مثل بنابراین، همچنین، در نتیجه) بازنویسی کن و بدون افزودن هیچ توضیح اضافی فقط متن بازنویسی شده را برگردان:\n"${currentContent}"`;
    } else if (instruction === 'expand') {
      finalPrompt = `متن زیر را با توضیحات کاربردی، داده‌های دقیق و کلمات ربط بسط بده و طولانی‌تر کن:\n"${currentContent}"`;
    } else if (instruction === 'summarize') {
      finalPrompt = `نکات اصلی متن زیر را در یک پاراگراف کوتاه، صریح و شفاف خلاصه کن:\n"${currentContent}"`;
    } else if (instruction === 'direct_answer') {
      finalPrompt = `بر اساس موضوع متن زیر، یک پاراگراف پاسخ صریح (Direct Answer Snippet) بین ۴۰ تا ۶۰ کلمه مناسب برای Featured Snippet بنویس:\n"${currentContent}"`;
    } else if (instruction === 'faq') {
      finalPrompt = `بر اساس متن زیر، ۳ سوال و پاسخ متداول کوتاه و کاربردی طراحی کن:\n"${currentContent}"`;
    } else {
      finalPrompt = `${prompt}\n\nمتن مبنا:\n"${currentContent}"`;
    }

    setLoading(true);
    setNotice(null);

    try {
      const restUrl = window.omniAiGutenberg?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiGutenberg?.restNonce || window.omniAiGutenberg?.nonce || '';

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
        const transformedText = data.data.text.trim().replace(/^["'«]+|["'»]+$/g, '');

        // جلوگیری از درج پاسخ‌های اشتباه و نامعتبر هوش مصنوعی
        if (
          transformedText.includes('لطفاً متنی') ||
          transformedText.includes('متنی ارائه نشده') ||
          transformedText.length < 10
        ) {
          throw new Error('متن کافی در بلوک انتخابی شناسایی نشد. لطفاً یک پاراگراف متنی انتخاب کنید.');
        }

        // اگر بلوک پاراگراف یا سرتیتر است، مستقیم جایگزین کن
        if (selectedBlock.name === 'core/paragraph' || selectedBlock.name === 'core/heading') {
          dispatch('core/block-editor').updateBlockAttributes(selectedBlock.clientId, {
            content: transformedText,
          });
          setNotice({ type: 'success', message: 'محتوای بلوک با موفقیت توسط هوش مصنوعی ارتقا یافت!' });
        } else {
          // برای بلوک‌های ساختاریافته مثل جدول، پاراگراف تحلیلی جدید زیر آن اضافه می‌شود
          const newBlock = createBlock('core/paragraph', { content: transformedText });
          const blockIndex = select('core/block-editor').getBlockIndex(selectedBlock.clientId);
          const rootClientId = select('core/block-editor').getBlockRootClientId(selectedBlock.clientId);
          dispatch('core/block-editor').insertBlocks(newBlock, blockIndex + 1, rootClientId);
          setNotice({
            type: 'success',
            message: 'تحلیل هوشمند جدول به عنوان یک پاراگراف جدید درست زیر آن اضافه شد.',
          });
        }
      } else {
        throw new Error(data.message || 'تولید محتوا ناموفق بود.');
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#16a34a';
    if (score >= 50) return '#d97706';
    return '#dc2626';
  };

  const seoScore = ratings?.seo?.score ?? 0;
  const aeoScore = ratings?.aeo?.score ?? 0;
  const geoScore = ratings?.geo?.score ?? 0;
  const readScore = ratings?.readability?.score ?? 0;
  const avgScore = ratings?.avg_score ?? 0;

  // جمع‌آوری جملات دارای مشکل از داده‌های ارزیابی
  const transitionIssues = ratings?.readability?.issues?.transition_sentences || [];

  return (
    <PluginSidebar
      name="omni-ai-sidebar"
      title="Omni AI Suite | دستیار هوشمند و سئو"
      icon="superhero"
    >
      <div style={{ padding: '14px', fontFamily: 'inherit', direction: 'rtl', textAlign: 'right' }}>
        {notice && (
          <div style={{ marginBottom: '12px' }}>
            <Notice status={notice.type} onDismiss={() => setNotice(null)}>
              {notice.message}
            </Notice>
          </div>
        )}

        {/* جعبه شاخص‌های زنده ۴ گانه */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ fontSize: '13px', color: '#1e293b' }}>شاخص آمادگی محتوا:</strong>
            <span
              style={{
                background: getScoreColor(avgScore),
                color: '#fff',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            >
              میانگین: {avgScore}%
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 2px' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: getScoreColor(seoScore) }}>{seoScore}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>SEO</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 2px' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: getScoreColor(aeoScore) }}>{aeoScore}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>AEO</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 2px' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: getScoreColor(geoScore) }}>{geoScore}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>GEO</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 2px' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: getScoreColor(readScore) }}>{readScore}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>خوانایی</div>
            </div>
          </div>
        </div>

        {/* ناوبری تب‌های سایدبار */}
        <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', marginBottom: '14px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('readability')}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'readability' ? '2px solid #2563eb' : 'none',
              color: activeTab === 'readability' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'readability' ? '700' : '500',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            خوانایی متن
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'seo' ? '2px solid #2563eb' : 'none',
              color: activeTab === 'seo' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'seo' ? '700' : '500',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            سئو و رتبه
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assistant')}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'assistant' ? '2px solid #2563eb' : 'none',
              color: activeTab === 'assistant' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'assistant' ? '700' : '500',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            دستیار بلوک
          </button>
        </div>

        {/* تب ۲: خوانایی و روانی متن همراه با نمایش بخش‌های دارای مشکل و اصلاح خودکار */}
        {activeTab === 'readability' && (
          <div>
            {/* کارت شاخص خوانایی با نوار پیشرفت */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>شاخص خوانایی و روانی:</strong>
                <span
                  style={{
                    background: getScoreColor(readScore),
                    color: '#fff',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                >
                  {readScore} از ۱۰۰
                </span>
              </div>

              {/* نوار پیشرفت بصری */}
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${readScore}%`,
                    background: getScoreColor(readScore),
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                {readScore >= 80
                  ? '✅ متن بسیار روان، خوش‌خوان و استاندارد است.'
                  : readScore >= 50
                  ? '⚠️ خوانایی متن خوب است اما با افزودن چند کلمه ربط روان‌تر می‌شود.'
                  : '❌ متن سنگین است و نیاز به ساده‌سازی و کلمات پیونددهنده دارد.'}
              </div>
            </div>

            {/* دکمه اصلی اصلاح خودکار کل خوانایی متن */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              <Button
                variant="primary"
                onClick={handleAutoFixAllReadability}
                disabled={fixingAllReadability || analyzing}
                style={{
                  flex: 2,
                  justifyContent: 'center',
                  background: '#4f46e5',
                  borderColor: '#4338ca',
                  fontWeight: '600',
                  fontSize: '12px',
                }}
              >
                {fixingAllReadability ? (
                  <>
                    <Spinner /> در حال افزودن کلمات ربط...
                  </>
                ) : (
                  '✨ اصلاح خودکار خوانایی متن'
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={handleRecalculate}
                disabled={analyzing || fixingAllReadability}
                style={{ flex: 1, justifyContent: 'center', fontSize: '11px' }}
              >
                {analyzing ? <Spinner /> : 'تحلیل مجدد'}
              </Button>
            </div>

            {/* چک‌لیست ۴ گانه خوانایی متن به شکل فشرده و تفکیک‌شده */}
            {ratings?.readability?.checklist && (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', marginBottom: '12px' }}>
                <strong style={{ fontSize: '12px', color: '#334155', display: 'block', marginBottom: '8px' }}>
                  وضعیت معیارهای خوانایی:
                </strong>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {ratings.readability.checklist.map((item, idx) => (
                    <li
                      key={idx}
                      style={{
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '6px',
                        color:
                          item.status === 'pass'
                            ? '#16a34a'
                            : item.status === 'warning'
                            ? '#d97706'
                            : '#dc2626',
                      }}
                    >
                      <span style={{ fontWeight: '700' }}>{item.status === 'pass' ? '✓' : '⚠️'}</span>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* آکاردئون هوشمند بررسی جملات فاقد کلمه ربط بدون شلوغی رابط کاربری */}
            {transitionIssues.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <Button
                  variant="secondary"
                  onClick={() => setShowIssuesList(!showIssuesList)}
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    borderColor: '#fed7aa',
                    background: showIssuesList ? '#fff7ed' : '#ffffff',
                    color: '#9a3412',
                  }}
                >
                  <span>🔍 مشاهده جملات نیازمند کلمه ربط ({transitionIssues.length} مورد)</span>
                  <span>{showIssuesList ? '▲ بستن' : '▼ باز کردن'}</span>
                </Button>

                {showIssuesList && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderTop: 'none',
                      borderBottomLeftRadius: '6px',
                      borderBottomRightRadius: '6px',
                      padding: '10px 8px',
                    }}
                  >
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                      می‌توانید کلمه ربط هر جمله را با یک کلیک اصلاح نمایید:
                    </p>

                    {transitionIssues.map((sent, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '10px',
                          marginBottom: '10px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#1e293b',
                            lineHeight: '1.6',
                            marginBottom: '8px',
                            wordBreak: 'break-word',
                          }}
                        >
                          «{sent}»
                        </div>

                        {sentenceFixes[sent] ? (
                          <div
                            style={{
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              borderRadius: '6px',
                              padding: '8px',
                              marginBottom: '6px',
                              fontSize: '11px',
                              color: '#065f46',
                              lineHeight: '1.5',
                            }}
                          >
                            <div style={{ fontWeight: '700', marginBottom: '4px', color: '#047857' }}>
                              🪄 پیشنهاد اصلاح‌شده:
                            </div>
                            <div
                              style={{
                                margin: '4px 0 8px 0',
                                background: '#ffffff',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                border: '1px solid #d1fae5',
                                color: '#1f2937',
                                wordBreak: 'break-word',
                              }}
                            >
                              {sentenceFixes[sent]}
                            </div>
                            <Button
                              variant="primary"
                              onClick={() => handleApplySentenceFix(sent, sentenceFixes[sent])}
                              style={{
                                width: '100%',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: '700',
                                background: '#059669',
                                borderColor: '#047857',
                                minHeight: '32px',
                              }}
                            >
                              ✅ جایگزینی در متن
                            </Button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <Button
                              variant="primary"
                              onClick={() => handleQuickFixTransition(sent)}
                              disabled={fixingSentence === sent}
                              style={{
                                width: '100%',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: '600',
                                background: '#3b82f6',
                                borderColor: '#2563eb',
                                minHeight: '30px',
                              }}
                            >
                              {fixingSentence === sent ? <Spinner /> : '✨ پیشنهاد کلمه ربط با AI'}
                            </Button>
                            <Button
                              variant="tertiary"
                              isSmall
                              onClick={() => handleScrollToSentence(sent)}
                              style={{
                                width: '100%',
                                justifyContent: 'center',
                                fontSize: '10px',
                                color: '#64748b',
                                minHeight: '26px',
                              }}
                            >
                              🎯 نمایش این بخش در متن
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {ratings?.readability?.recommendations?.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', padding: '10px' }}>
                <strong style={{ fontSize: '11px', color: '#92400e', display: 'block', marginBottom: '4px' }}>
                  💡 راهکار سریع خوانایی:
                </strong>
                <ul style={{ margin: 0, paddingRight: '14px', fontSize: '11px', color: '#b45309' }}>
                  {ratings.readability.recommendations.map((rec, idx) => (
                    <li key={idx} style={{ marginBottom: '2px' }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* تب ۱: سئو و رتبه‌بندی */}
        {activeTab === 'seo' && (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <TextControl
                label="🔑 کلیدواژه کانونی (Focus Keyword)"
                value={focusKeyword}
                onChange={handleKeywordChange}
                placeholder="مثال: ابزارهای خط فرمان"
                help="کلمه کلیدی محوری که برای سئوی مقاله در نظر گرفته‌اید."
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <Button
                variant="primary"
                onClick={handleRecalculate}
                disabled={analyzing}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {analyzing ? <Spinner /> : 'تحلیل مجدد'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleAutoFix}
                disabled={generating}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {generating ? <Spinner /> : '✨ رفع خودکار با AI'}
              </Button>
            </div>

            {ratings?.seo?.checklist && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                <strong style={{ fontSize: '12px', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  چک‌لیست فوری سئو:
                </strong>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {ratings.seo.checklist.slice(0, 5).map((item, idx) => (
                    <li
                      key={idx}
                      style={{
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                        color:
                          item.status === 'pass'
                            ? '#16a34a'
                            : item.status === 'warning'
                            ? '#d97706'
                            : '#dc2626',
                      }}
                    >
                      <span>{item.status === 'pass' ? '✓' : '⚠️'}</span>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* تب ۳: دستیار بلوک متنی همراه با پیش‌نمایش هوشمند محتوا */}
        {activeTab === 'assistant' && (
          <div>
            {/* پیش‌نمایش هوشمند بلوک انتخاب‌شده */}
            {selectedBlock ? (
              <div
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                    fontSize: '11px',
                    color: '#475569',
                  }}
                >
                  <strong>بلوک انتخاب‌شده:</strong>
                  <span style={{ direction: 'ltr', fontFamily: 'monospace', fontSize: '10px', background: '#e2e8f0', padding: '1px 5px', borderRadius: '3px' }}>
                    {selectedBlock.name}
                  </span>
                </div>

                {selectedBlock.name === 'core/table' && (
                  <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '4px', padding: '4px 6px', marginBottom: '6px', fontSize: '10px', color: '#0369a1' }}>
                    ℹ️ بلوک جدول انتخاب شده است؛ هوش مصنوعی پاراگراف توضیحی و تحلیلی برای این جدول خواهد نوشت.
                  </div>
                )}

                <div
                  style={{
                    fontSize: '11px',
                    color: '#1e293b',
                    maxHeight: '80px',
                    overflowY: 'auto',
                    background: '#fff',
                    padding: '6px',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                    lineHeight: '1.4',
                  }}
                >
                  {extractedBlockText ? extractedBlockText : '⚠️ متنی در این بلوک شناسایی نشد.'}
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '6px',
                  padding: '10px',
                  marginBottom: '12px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#92400e',
                }}
              >
                👈 روی یک بلوک (پاراگراف، تیتر یا جدول) در ویرایشگر کلیک کنید تا متن آن اینجا قرار بگیرد.
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <SelectControl
                label="⚡ عملیات هوشمند روی بلوک انتخابی"
                value={instruction}
                options={[
                  { label: '🪄 بازنویسی و بهبود نگارش', value: 'rephrase' },
                  { label: '🔍 بسط و افزودن جزئیات فنی', value: 'expand' },
                  { label: '✂️ خلاصه‌سازی صریح و کوتاه', value: 'summarize' },
                  { label: '🎯 تبدیل به پاسخ مستقیم AEO', value: 'direct_answer' },
                  { label: '❓ تولید ۳ پرسش و پاسخ متداول (FAQ)', value: 'faq' },
                  { label: '💬 دستور و پرامپت سفارشی...', value: 'custom' },
                ]}
                onChange={setInstruction}
              />
            </div>

            {instruction === 'custom' && (
              <div style={{ marginBottom: '14px' }}>
                <TextareaControl
                  label="دستور سفارشی برای هوش مصنوعی"
                  value={prompt}
                  onChange={setPrompt}
                  rows={3}
                  placeholder="مثال: ترجمه به انگلیسی، اصلاح ایرادات دستوری، اضافه کردن آمار..."
                />
              </div>
            )}

            <Button
              variant="primary"
              onClick={handleApplyToBlock}
              disabled={loading || !selectedBlock || !extractedBlockText}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? (
                <>
                  <Spinner /> در حال تبدیل...
                </>
              ) : (
                '🚀 اعمال هوش مصنوعی روی بلوک'
              )}
            </Button>
          </div>
        )}
      </div>
    </PluginSidebar>
  );
}

registerPlugin('omni-ai-gutenberg', {
  render: () => (
    <Fragment>
      <PluginSidebarMoreMenuItem target="omni-ai-sidebar" icon="superhero">
        دستیار هوشمند و سئو Omni AI
      </PluginSidebarMoreMenuItem>
      <OmniAiGutenbergSidebar />
    </Fragment>
  ),
});
