/**
 * Aliado AI — Embeddable Chat Widget
 * Usage: <script src="https://your-domain.com/widget/embed.js" data-agent-id="AGENT_UUID"></script>
 */
(function () {
  'use strict';

  const script = document.currentScript;
  const agentId = script?.getAttribute('data-agent-id');
  const position = script?.getAttribute('data-position') || 'bottom-right';
  const baseUrl = script?.src ? new URL(script.src).origin : window.location.origin;

  if (!agentId) {
    console.error('[Aliado AI] Missing data-agent-id attribute on embed script.');
    return;
  }

// ── Styles ──────────────────────────────────────────────
  const styles = document.createElement('style');
  styles.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

    :host {
      all: initial;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .fab {
      position: fixed;
      ${position === 'bottom-left' ? 'left: 24px;' : 'right: 24px;'}
      bottom: 24px;
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: #000000;
      color: #ffffff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.15);
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
      z-index: 999999;
    }
    .fab:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15), 0 16px 40px rgba(0,0,0,0.2);
    }
    .fab:active {
      transform: translateY(0) scale(0.95);
    }
    .fab svg {
      width: 28px;
      height: 28px;
      transition: transform 0.3s ease, opacity 0.3s ease;
      position: absolute;
    }
    .fab .icon-close {
      opacity: 0;
      transform: rotate(-90deg) scale(0.5);
    }
    .fab.open .icon-open {
      opacity: 0;
      transform: rotate(90deg) scale(0.5);
    }
    .fab.open .icon-close {
      opacity: 1;
      transform: rotate(0) scale(1);
    }

    .panel {
      position: fixed;
      ${position === 'bottom-left' ? 'left: 24px;' : 'right: 24px;'}
      bottom: 100px;
      width: 380px;
      max-width: calc(100vw - 48px);
      height: 680px;
      max-height: calc(100vh - 140px);
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 10px 40px -8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 999998;
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.95);
      transform-origin: bottom right;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
    }
    .panel.visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }

    .header {
      padding: 24px 24px 32px 24px;
      background: linear-gradient(135deg, #000000 0%, #1f1f1f 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 16px;
      background: #f9fafb;
      border-radius: 20px 20px 0 0;
    }
    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .header-icon svg {
      width: 24px;
      height: 24px;
      color: #fff;
    }
    .header-info h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }
    .header-info p {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .header-info p::before {
      content: '';
      display: block;
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 0 24px 24px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #f9fafb;
    }
    .messages::-webkit-scrollbar { width: 4px; }
    .messages::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }

    .msg-container {
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0;
      transform: translateY(8px);
    }
    @keyframes slideUp {
      to { opacity: 1; transform: translateY(0); }
    }

    .msg {
      max-width: 85%;
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.5;
      word-break: break-word;
    }
    .msg-user {
      align-self: flex-end;
      background: #000000;
      color: #ffffff;
      border-radius: 16px 16px 4px 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .msg-assistant {
      align-self: flex-start;
      background: #ffffff;
      color: #111827;
      border-radius: 16px 16px 16px 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      border: 1px solid #e5e7eb;
    }

    .typing {
      display: flex;
      gap: 4px;
      padding: 16px;
      align-self: flex-start;
      background: #ffffff;
      border-radius: 16px 16px 16px 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      border: 1px solid #e5e7eb;
    }
    .typing span {
      width: 6px;
      height: 6px;
      background: #9ca3af;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing span:nth-child(1) { animation-delay: -0.32s; }
    .typing span:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.5); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    .input-area {
      padding: 16px 20px;
      background: #ffffff;
      border-top: 1px solid #f3f4f6;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .input-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      background: #f3f4f6;
      border-radius: 24px;
      padding: 6px 6px 6px 16px;
      border: 1px solid transparent;
      transition: all 0.2s;
    }
    .input-wrapper:focus-within {
      border-color: #d1d5db;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(0,0,0,0.02);
    }
    .input-wrapper input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 8px 0;
      font-size: 14px;
      outline: none;
      color: #111827;
      min-height: 24px;
    }
    .input-wrapper input::placeholder { color: #9ca3af; }
    
    .btn-send {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #000000;
      color: #ffffff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .btn-send:hover:not(:disabled) {
      transform: scale(1.05);
    }
    .btn-send:disabled {
      background: transparent;
      color: #9ca3af;
      cursor: default;
    }
    .btn-send svg {
      width: 16px;
      height: 16px;
      margin-left: -1px;
    }

    .powered {
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      font-weight: 500;
    }
    .powered a {
      color: #6b7280;
      text-decoration: none;
      transition: color 0.2s;
    }
    .powered a:hover {
      color: #111827;
    }
  `;

  // ── Widget Container ────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'aliado-widget-root';
  
  // Create Shadow DOM
  const shadow = root.attachShadow({ mode: 'open' });
  shadow.appendChild(styles);

  // FAB Button
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.innerHTML = `
    <svg class="icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    <svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  `;
  fab.setAttribute('aria-label', 'Abrir chat');

  // Chat Panel
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="header">
      <div class="header-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div class="header-info">
        <h3 id="agent-name">Asistente</h3>
        <p>Respuesta instantánea</p>
      </div>
    </div>
    <div class="messages" id="messages-container"></div>
    <div class="input-area">
      <div class="input-wrapper">
        <input type="text" id="chat-input" placeholder="Escribe un mensaje..." autocomplete="off" />
        <button id="btn-send" class="btn-send" aria-label="Enviar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
      <div class="powered">Powered by <a href="${baseUrl}" target="_blank">Aliado AI</a></div>
    </div>
  `;

  shadow.appendChild(fab);
  shadow.appendChild(panel);
  document.body.appendChild(root);

  // ── State ───────────────────────────────────────────────
  let isOpen = false;
  let conversationId = null;
  let isSending = false;

  const messagesEl = shadow.getElementById('messages-container');
  const inputEl = shadow.getElementById('chat-input');
  const sendBtn = shadow.getElementById('btn-send');
  const agentNameEl = shadow.getElementById('agent-name');

  // ── Load Agent Config ───────────────────────────────────
  fetch(`${baseUrl}/api/widget/${agentId}`)
    .then((r) => r.json())
    .then((data) => {
      if (data.name) {
        agentNameEl.textContent = data.name;
      }
      if (data.config?.primaryColor) {
        fab.style.background = data.config.primaryColor;
      }
      const greeting = data.config?.greeting || '¡Hola! Estoy aquí para ayudarte. ¿Qué necesitas?';
      addMessage('assistant', greeting);
    })
    .catch(() => {
      addMessage('assistant', '¡Hola! Estoy aquí para ayudarte. ¿Qué necesitas?');
    });

  // ── Event Listeners ─────────────────────────────────────
  fab.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add('visible');
      fab.classList.add('open');
      inputEl.focus();
    } else {
      panel.classList.remove('visible');
      fab.classList.remove('open');
    }
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  inputEl.addEventListener('input', () => {
    sendBtn.disabled = inputEl.value.trim().length === 0;
  });
  // Initial check
  sendBtn.disabled = true;

  sendBtn.addEventListener('click', sendMessage);

  // ── Functions ───────────────────────────────────────────
  function parseMarkdown(text) {
    if (!text) return '';
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  function addMessage(role, text) {
    const container = document.createElement('div');
    container.className = 'msg-container';
    
    const el = document.createElement('div');
    el.className = `msg msg-${role}`;
    el.innerHTML = parseMarkdown(text);
    
    container.appendChild(el);
    messagesEl.appendChild(container);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function showTyping() {
    const container = document.createElement('div');
    container.className = 'msg-container';
    container.id = 'typing-indicator';
    
    const el = document.createElement('div');
    el.className = 'typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    
    container.appendChild(el);
    messagesEl.appendChild(container);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const el = shadow.getElementById('typing-indicator');
    if (el) el.remove();
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isSending) return;

    isSending = true;
    inputEl.value = '';
    sendBtn.disabled = true;
    addMessage('user', text);
    showTyping();

    try {
      const response = await fetch(`${baseUrl}/api/widget/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: text,
        }),
      });

      if (!response.ok) throw new Error('Error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let msgEl = null;

      hideTyping();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.conversation_id) conversationId = data.conversation_id;
              if (data.text) {
                fullText += data.text;
                if (!msgEl) {
                  msgEl = addMessage('assistant', fullText);
                } else {
                  msgEl.innerHTML = parseMarkdown(fullText);
                }
                messagesEl.scrollTop = messagesEl.scrollHeight;
              }
            } catch (e) { /* ignore parse errors */ }
          }
        }
      }
    } catch (error) {
      hideTyping();
      addMessage('assistant', 'Lo siento, hubo un error de conexión. Intenta de nuevo.');
    }

    isSending = false;
    inputEl.focus();
  }
})();
