/**
 * Interactive Frontend Chatbot with Real-Time SSE Streaming
 * Enqueued strictly on-demand when [omni_ai_chatbot] shortcode is rendered.
 */
document.addEventListener('DOMContentLoaded', () => {
  const chatContainers = document.querySelectorAll('[data-chat-root]');

  chatContainers.forEach((container) => {
    const form = container.querySelector('[data-chat-form]');
    const input = container.querySelector('[data-chat-input]');
    const sendBtn = container.querySelector('[data-chat-btn]');
    const messagesBox = container.querySelector('[data-chat-messages]');

    if (!form || !input || !messagesBox) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userText = input.value.trim();
      if (!userText) return;

      // Append user bubble
      appendMessage(messagesBox, userText, 'user');
      input.value = '';
      sendBtn.disabled = true;

      // Prepare bot bubble for streaming text
      const botMsgDiv = appendMessage(messagesBox, '...', 'bot');

      const restUrl = window.omniAiChatbot?.restUrl || '/wp-json/omni-ai/v1/stream-ai';
      const nonce = window.omniAiChatbot?.nonce || '';
      const provider = window.omniAiChatbot?.provider || '';
      const model = window.omniAiChatbot?.model || '';

      let accumulated = '';

      try {
        const response = await fetch(restUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': nonce,
          },
          body: JSON.stringify({
            prompt: userText,
            provider,
            model,
            system_prompt: 'You are a helpful customer service chatbot assistant on our WordPress website. Answer questions clearly and helpfully.',
          }),
        });

        if (!response.ok) {
          throw new Error('Connection failed.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        botMsgDiv.innerText = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              if (!dataStr) continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulated += parsed.text;
                  botMsgDiv.innerText = accumulated;
                  messagesBox.scrollTop = messagesBox.scrollHeight;
                }
              } catch (err) {}
            }
          }
        }
      } catch (err) {
        botMsgDiv.innerText = 'Sorry, could not connect to AI service. Please try again later.';
      } finally {
        sendBtn.disabled = false;
        input.focus();
      }
    });
  });

  function appendMessage(parent, text, type) {
    const div = document.createElement('div');
    div.className = `omni-ai-msg omni-ai-msg-${type}`;
    div.innerText = text;
    parent.appendChild(div);
    parent.scrollTop = parent.scrollHeight;
    return div;
  }
});
