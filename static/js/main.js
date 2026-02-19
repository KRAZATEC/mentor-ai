// ─── State ──────────────────────────────────────────────────────────────────
const history = []; // { role: 'user'|'assistant', content: string }

// ─── DOM refs ───────────────────────────────────────────────────────────────
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const typingEl = document.getElementById('typing-indicator');
const clearBtn = document.getElementById('btn-clear');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');

// ─── Sidebar Toggle ──────────────────────────────────────────────────────────
sidebarToggle.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('open');
    } else {
        sidebar.classList.toggle('collapsed');
    }
});

// Close sidebar on mobile when clicking outside
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && e.target !== sidebarToggle) {
            sidebar.classList.remove('open');
        }
    }
});

// ─── Auto-resize textarea ───────────────────────────────────────────────────
inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 180) + 'px';
});

// ─── Send on Enter (Shift+Enter = newline) ───────────────────────────────────
inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
sendBtn.addEventListener('click', sendMessage);

// ─── Quick-action chips ──────────────────────────────────────────────────────
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        if (prompt) {
            inputEl.value = prompt;
            inputEl.dispatchEvent(new Event('input')); // resize
            sendMessage();
            // On mobile, close sidebar after clicking chip
            sidebar.classList.remove('open');
        }
    });
});

// ─── Clear chat ──────────────────────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
    history.length = 0;
    // Remove all messages except welcome
    const msgs = messagesEl.querySelectorAll('.message:not(#welcome-msg)');
    msgs.forEach(m => m.remove());
});

// ─── Core: send message ──────────────────────────────────────────────────────
async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    // Append user bubble
    appendMessage('user', text);
    history.push({ role: 'user', content: text });

    // Reset input
    inputEl.value = '';
    inputEl.style.height = 'auto';
    setLoading(true);

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, history: history.slice(0, -1) }) // exclude last user msg, already in 'message'
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            throw new Error(data.error || `Server error ${res.status}`);
        }

        const reply = data.reply;
        history.push({ role: 'assistant', content: reply });
        appendMessage('assistant', formatMarkdown(reply));

    } catch (err) {
        showError(err.message || 'Something went wrong. Please try again.');
    } finally {
        setLoading(false);
    }
}

// ─── Append message bubble ───────────────────────────────────────────────────
function appendMessage(role, content) {
    const msg = document.createElement('div');
    msg.classList.add('message', role);

    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.textContent = role === 'user' ? '👤' : '🎓';

    const bubble = document.createElement('div');
    bubble.classList.add('bubble');

    if (role === 'assistant') {
        // Content is already HTML-formatted markdown
        bubble.innerHTML = content;
    } else {
        // User text — escape HTML
        bubble.textContent = content;
    }

    msg.appendChild(avatar);
    msg.appendChild(bubble);
    messagesEl.appendChild(msg);
    scrollToBottom();
}

// ─── Simple Markdown Formatter ───────────────────────────────────────────────
function formatMarkdown(text) {
    // Escape HTML first (for safety with user-like content in model replies)
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks (``` ```)
    html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
        `<pre><code>${code.trim()}</code></pre>`
    );

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold & italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Unordered lists (- or *)
    html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]+?<\/li>)/g, (match) => `<ul>${match}</ul>`);

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Paragraphs — split on double newlines
    html = html
        .split(/\n{2,}/)
        .map(block => {
            block = block.trim();
            if (!block) return '';
            if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<ol') || block.startsWith('<pre') || block.startsWith('<li')) return block;
            return `<p>${block.replace(/\n/g, '<br>')}</p>`;
        })
        .join('');

    return html;
}

// ─── Loading state ───────────────────────────────────────────────────────────
function setLoading(loading) {
    sendBtn.disabled = loading;
    inputEl.disabled = loading;
    typingEl.hidden = !loading;
    if (loading) scrollToBottom();
}

// ─── Scroll to bottom ────────────────────────────────────────────────────────
function scrollToBottom() {
    requestAnimationFrame(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    });
}

// ─── Error Toast ─────────────────────────────────────────────────────────────
function showError(msg) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = '⚠️ ' + msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}
