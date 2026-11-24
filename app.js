// Acatto AI: chat UI. The model itself lives in worker.js (acattoBrainWorker).
// Plain script on purpose (not a module) so it also runs from a double-clicked index.html.
(() => {
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isTouch = matchMedia('(hover: none)').matches;
const AVATAR = 'assets/acatto.webp';

const SYSTEM_PROMPT =
  "Your name is Acatto AI. You are a small AI made by acatto, and you run entirely inside the user's web browser. " +
  "You are friendly, casual and a little goofy. Keep answers short and clear. " +
  "If you are not sure about something, say so instead of making things up.";

// The two "brains". Each has a GPU (WebGPU) and a CPU (WASM) version, because
// LFM2.5's quantized files use an op the CPU engine doesn't have.
// dtype on GPU depends on fp16 support; sizes are the one-time download in MB.
const SMOL_GEN = { temperature: 0.3, top_p: 0.9, max_new_tokens: 400 };
const BRAINS = {
  normal: {
    name: 'Normal brain', emoji: '🧠', desc: 'Kinda smart. Recommended.',
    gpu: {
      id: 'onnx-community/LFM2.5-350M-ONNX', label: 'LFM2.5 · 350M',
      dtype: { f16: 'q4f16', f32: 'q4' }, sizes: { q4f16: 255, q4: 294 },
      gen: { temperature: 0.3, top_k: 50, repetition_penalty: 1.05, max_new_tokens: 512 }, history: 10,
    },
    cpu: {
      id: 'HuggingFaceTB/SmolLM2-360M-Instruct', label: 'SmolLM2 · 360M',
      dtype: 'q8', sizes: { q8: 365 },
      gen: { ...SMOL_GEN, repetition_penalty: 1.15 }, history: 8,
    },
  },
  potato: {
    name: 'Potato brain', emoji: '🥔', desc: 'Tiny and fast. Dumb as a rock.',
    gpu: {
      id: 'HuggingFaceTB/SmolLM2-135M-Instruct', label: 'SmolLM2 · 135M',
      dtype: { f16: 'q4f16', f32: 'q4' }, sizes: { q4f16: 118, q4: 182 },
      gen: { ...SMOL_GEN, repetition_penalty: 1.2 }, history: 6,
    },
    cpu: {
      id: 'HuggingFaceTB/SmolLM2-135M-Instruct', label: 'SmolLM2 · 135M',
      dtype: 'q8', sizes: { q8: 137 },
      gen: { ...SMOL_GEN, repetition_penalty: 1.2 }, history: 6,
    },
  },
};
const FILE_SUFFIX = { q4f16: '_q4f16', q4: '_q4', q8: '_quantized', fp16: '_fp16', fp32: '' };
const SUGGESTIONS = ['tell me a joke 😂', "explain black holes like i'm 5", 'write a haiku about cats', 'give me a dumb business idea', 'what should i eat today?', 'rate my name: acatto'];

// ---------- state ----------
const S = {
  brain: localStorage.getItem('acattoai.brain'),
  backend: 'wasm',           // what this browser can do: webgpu16 | webgpu | wasm
  cached: {},                // brain key -> already downloaded?
  status: 'idle',            // idle | loading | ready | error
  device: null,
  loadText: '', loaded: 0, total: 0,
  messages: [],
  pending: null,             // assistant message waiting for the model to load
  cur: null,                 // assistant message being generated
  generating: false,
  stopRequested: false,
  nextId: 0,
};
let worker = null;

// ---------- DOM ----------
const chat = $('#chat');
const thread = $('#thread');
const hero = $('#hero');
const setup = $('#setup');
const brainCards = $('#brainCards');
const brainSelect = $('#brainSelect');
const startBtn = $('#startBtn');
const progress = $('#progress');
const progressFill = $('#progressFill');
const progressText = $('#progressText');
const progressPct = $('#progressPct');
const setupNote = $('#setupNote');
const suggest = $('#suggest');
const statusEl = $('#status');
const statusText = $('#statusText');
const form = $('#form');
const input = $('#input');
const sendBtn = $('#sendBtn');
const speedEl = $('#speed');

// ---------- helpers ----------
// which model + file a brain uses on this device
const onCpu = () => S.backend === 'wasm';
const variant = (key, cpu = onCpu()) => BRAINS[key][cpu ? 'cpu' : 'gpu'];
const dtypeOf = (v) => (typeof v.dtype === 'string' ? v.dtype : v.dtype[S.backend === 'webgpu16' ? 'f16' : 'f32']);
const sizeOf = (key) => { const v = variant(key); return v.sizes[dtypeOf(v)]; };
const mb = (bytes) => Math.round(bytes / 1e6);
// true while model bytes are still arriving (after that it is "warming up" etc.)
const downloading = () => S.total > 2e6 && S.loaded < S.total * 0.995;
function setStatus(kind, text) {
  statusEl.className = 'status ' + kind;
  statusText.textContent = text;
}
const nearBottom = () => chat.scrollHeight - chat.scrollTop - chat.clientHeight < 90;
const scrollBottom = () => { chat.scrollTop = chat.scrollHeight; };

async function detectBackend() {
  try {
    if (!('gpu' in navigator)) return 'wasm';
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return 'wasm';
    return adapter.features.has('shader-f16') ? 'webgpu16' : 'webgpu';
  } catch {
    return 'wasm';
  }
}
async function checkCached(key) {
  try {
    if (!('caches' in window)) return false;
    const v = variant(key);
    const file = `${v.id}/resolve/main/onnx/model${FILE_SUFFIX[dtypeOf(v)] ?? ''}.onnx`;
    const cache = await caches.open('transformers-cache');
    const keys = await cache.keys();
    return keys.some((r) => r.url.includes(file));
  } catch {
    return false;
  }
}

// tiny, safe markdown: code blocks, inline code, bold, italics, headings, bullets
function inlineMd(text) {
  let s = esc(text);
  s = s.replace(/^[ \t]*[-*•][ \t]+/gm, '• ');
  s = s.replace(/^#{1,6}[ \t]+(.+)$/gm, '<strong>$1</strong>');
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>');
  return s.replace(/\n/g, '<br>');
}
function md(src) {
  const parts = src.replace(/\n{3,}/g, '\n\n').split('```');
  return parts.map((part, i) => {
    if (i % 2 === 0) {
      // code blocks are already block-level: drop the blank lines hugging them
      if (i > 0) part = part.replace(/^\n+/, '');
      if (i < parts.length - 1) part = part.replace(/\n+$/, '');
      return inlineMd(part);
    }
    const nl = part.indexOf('\n');
    const code = nl === -1 ? part : part.slice(nl + 1);
    return `<pre><code>${esc(code.replace(/\n$/, ''))}</code></pre>`;
  }).join('');
}

// ---------- brain picker ----------
function renderBrains() {
  brainCards.innerHTML = Object.entries(BRAINS).map(([k, b]) => {
    const tag = S.cached[k] ? '<span class="tag saved">SAVED</span>' : k === 'normal' ? '<span class="tag">BEST</span>' : '';
    return `<button type="button" class="brain" role="radio" aria-checked="${k === S.brain}" data-brain="${k}">`
      + `<span class="brain-top"><span class="brain-name">${b.name}${tag}</span><span class="brain-emoji">${b.emoji}</span></span>`
      + `<span class="brain-meta">${variant(k).label} · ${S.cached[k] ? 'already downloaded' : '~' + sizeOf(k) + ' MB'}</span>`
      + `<span class="brain-desc">${b.desc}</span></button>`;
  }).join('');
  brainSelect.innerHTML = Object.entries(BRAINS).map(([k, b]) => `<option value="${k}" ${k === S.brain ? 'selected' : ''}>${b.emoji} ${b.name}</option>`).join('');
  renderSetup();
}
function renderSetup() {
  const loading = S.status === 'loading';
  const ready = S.status === 'ready';
  setup.hidden = ready;
  suggest.hidden = !ready;
  startBtn.disabled = loading;
  startBtn.textContent = loading ? 'Loading…' : S.status === 'error' ? 'Try again'
    : S.cached[S.brain] ? 'Start chatting' : `Download brain (~${sizeOf(S.brain)} MB)`;
  progress.hidden = !loading;
  if (S.status !== 'error') {
    setupNote.className = 'fine';
    setupNote.textContent = [
      location.protocol === 'file:'
        ? 'Opened from a file: works, but the brain gets re-downloaded every visit. Put the site on GitHub Pages to save it.'
        : 'One-time download. After that it lives in your browser and loads in seconds.',
      onCpu() ? 'No WebGPU in this browser, so it runs on your CPU (slower). Potato is the fast pick here.' : '',
    ].filter(Boolean).join(' ');
  }
}
function chooseBrain(key) {
  if (!BRAINS[key] || key === S.brain) return;
  if (S.generating) { brainSelect.value = S.brain; return; }
  const switchingLive = S.status === 'ready' || S.status === 'loading';
  if (switchingLive && !S.cached[key] && !confirm(`Switch to the ${BRAINS[key].name}? That's a ~${sizeOf(key)} MB download.`)) {
    brainSelect.value = S.brain;
    return;
  }
  S.brain = key;
  localStorage.setItem('acattoai.brain', key);
  if (switchingLive) {
    worker?.terminate();
    worker = null;
    S.status = 'idle';
    loadBrain();
  } else {
    setStatus('idle', 'brain not loaded');
  }
  renderBrains();
}
brainCards.addEventListener('click', (e) => { const c = e.target.closest('.brain'); if (c) chooseBrain(c.dataset.brain); });
brainSelect.addEventListener('change', () => chooseBrain(brainSelect.value));
startBtn.addEventListener('click', () => loadBrain());

// ---------- loading ----------
function loadBrain() {
  if (S.status === 'loading' || S.status === 'ready') return;
  worker?.terminate();
  worker = spawnWorker();
  worker.addEventListener('message', (e) => onWorker(e.data));
  worker.addEventListener('error', (e) => {
    e.preventDefault();
    onWorker({ type: 'error', during: 'load', message: e.message || "couldn't start the AI (check your connection)" });
  });
  S.status = 'loading';
  S.loadText = 'starting up';
  S.loaded = S.total = 0;
  S.loadStart = performance.now();
  clearInterval(S.tick);
  S.tick = setInterval(() => { if (S.status === 'loading') updateLoadUI(); else clearInterval(S.tick); }, 1000);
  const pack = (v) => ({ id: v.id, dtype: v.dtype, gen: v.gen });
  const b = BRAINS[S.brain];
  worker.postMessage({ type: 'load', config: { gpu: pack(b.gpu), cpu: pack(b.cpu) } });
  updateLoadUI();
  renderSetup();
}
function spawnWorker() {
  // build the worker from worker.js's function source, so no separate worker file has to be fetched
  const src = `(${acattoBrainWorker.toString()})();`;
  const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  // classic (not module) worker: module workers are blocked on file:// pages, and import() works in both
  const w = new Worker(url);
  w.addEventListener('message', function revoke() { URL.revokeObjectURL(url); w.removeEventListener('message', revoke); });
  return w;
}
function updateLoadUI() {
  const pct = S.total ? Math.min(100, Math.floor((S.loaded / S.total) * 100)) : 0;
  const bytes = downloading();
  const secs = Math.floor((performance.now() - (S.loadStart || performance.now())) / 1000);
  progress.querySelector('.bar').classList.toggle('indeterminate', !bytes);
  progressFill.style.width = pct + '%';
  progressText.textContent = bytes ? 'downloading brain' : `${S.loadText}… ${secs}s`;
  progressPct.textContent = bytes ? `${mb(S.loaded)} / ${mb(S.total)} MB · ${pct}%` : '';
  setStatus('loading', bytes ? `downloading brain ${pct}%` : S.loadText);
  if (S.pending) renderAI(S.pending);
}
function onReady(d) {
  S.status = 'ready';
  S.device = d.device;
  S.cached[S.brain] = true;
  localStorage.setItem('acattoai.brain', S.brain);
  setStatus('ready', `${BRAINS[S.brain].name} · ${d.device === 'webgpu' ? 'GPU' : 'CPU'}`);
  speedEl.textContent = '';
  renderBrains();
  if (S.pending) runGenerate(S.pending);
  else if (!isTouch) input.focus();
  updateSend();
}

// ---------- worker messages ----------
function onWorker(d) {
  switch (d.type) {
    case 'status':
      S.loadText = d.text;
      updateLoadUI();
      break;
    case 'progress':
      S.loaded = d.loaded;
      S.total = d.total;
      updateLoadUI();
      break;
    case 'ready':
      onReady(d);
      break;
    case 'token':
      if (S.cur && d.id === S.cur.id) { S.cur.content += d.text; queueRender(S.cur); }
      break;
    case 'stats':
      if (S.cur && d.id === S.cur.id) speedEl.textContent = `${d.tps.toFixed(1)} tok/s · ${S.device === 'webgpu' ? 'GPU' : 'CPU'}`;
      break;
    case 'done':
      finish(d);
      break;
    case 'error':
      onError(d);
      break;
  }
}
function onError(d) {
  console.error('[acatto ai]', d.message);
  if (d.during === 'load' || S.status === 'loading') {
    S.status = 'error';
    worker?.terminate();
    worker = null;
    setStatus('error', 'brain failed to load');
    setupNote.className = 'fine err';
    setupNote.textContent = `Couldn't load the brain: ${d.message}`;
    if (S.pending) {
      S.pending.error = `Couldn't load the brain (${d.message}). Send your message again to retry.`;
      renderAI(S.pending);
      S.pending = null;
    }
    renderSetup();
  } else {
    const a = S.cur;
    S.generating = false;
    S.cur = null;
    if (a) { a.error = `Something broke: ${d.message}`; renderAI(a); }
  }
  updateSend();
}

// ---------- messages ----------
function addMessage(role, content) {
  const m = { role, content, error: null, el: null, bubble: null };
  const el = document.createElement('div');
  el.className = 'msg ' + (role === 'user' ? 'user' : 'ai');
  if (role === 'user') {
    el.innerHTML = '<div class="bubble"></div>';
    el.querySelector('.bubble').textContent = content;
  } else {
    el.innerHTML = `<img class="av" src="${AVATAR}" alt=""><div class="body"><div class="bubble"></div>`
      + '<div class="msg-tools" hidden><button type="button" class="mini" data-act="copy">copy</button><button type="button" class="mini" data-act="retry">retry</button></div></div>';
  }
  m.el = el;
  m.bubble = el.querySelector('.bubble');
  el._msg = m;
  thread.appendChild(el);
  S.messages.push(m);
  return m;
}
function renderAI(m) {
  const live = m === S.cur && S.generating;
  let html;
  if (m.error) html = `<span class="err">${esc(m.error)}</span>`;
  else if (m === S.pending) {
    const pct = S.total ? Math.floor((S.loaded / S.total) * 100) : 0;
    html = downloading()
      ? `<span class="loadnote">downloading my brain… <b>${pct}%</b> (${mb(S.loaded)} / ${mb(S.total)} MB). only happens once</span>`
      : `<span class="loadnote">${esc(S.loadText || 'waking up')}…</span>`;
  } else if (!m.content && live) html = '<span class="thinking"><i></i><i></i><i></i></span>';
  else html = md(m.content) + (live ? '<span class="caret"></span>' : '');
  m.bubble.innerHTML = html;
  const tools = m.el.querySelector('.msg-tools');
  if (tools) tools.hidden = live || m === S.pending || (!m.content && !m.error);
}
let renderQueue = new Set();
let rafQueued = false;
function queueRender(m) {
  renderQueue.add(m);
  if (rafQueued) return;
  rafQueued = true;
  requestAnimationFrame(() => {
    rafQueued = false;
    const stick = nearBottom();
    renderQueue.forEach(renderAI);
    renderQueue.clear();
    if (stick) scrollBottom();
  });
}

function send(textArg) {
  const text = (textArg ?? input.value).trim();
  if (!text || S.generating || S.pending) return;
  input.value = '';
  autosize();
  hero.hidden = true;
  addMessage('user', text);
  const a = addMessage('assistant', '');
  if (S.status === 'ready') runGenerate(a);
  else {
    S.pending = a;
    renderAI(a);
    if (S.status !== 'loading') loadBrain();
  }
  scrollBottom();
  updateSend();
}
function runGenerate(a) {
  S.pending = null;
  S.generating = true;
  S.stopRequested = false;
  S.cur = a;
  a.id = ++S.nextId;
  a.content = '';
  a.error = null;
  a.filler = false;
  const v = variant(S.brain, S.device !== 'webgpu');
  const history = S.messages.filter((m) => m !== a && m.content && !m.error && !m.filler).slice(-v.history);
  while (history.length && history[0].role !== 'user') history.shift();
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history.map((m) => ({ role: m.role, content: m.content }))];
  worker.postMessage({ type: 'generate', id: a.id, messages });
  renderAI(a);
  updateSend();
}
function finish(d) {
  const a = S.cur;
  if (!a || d.id !== a.id) return;
  S.generating = false;
  S.cur = null;
  a.content = a.content.trim();
  a.filler = !a.content;
  if (!a.content) a.content = S.stopRequested ? '_(stopped)_' : '…my brain blanked. try asking again?';
  renderAI(a);
  if (d.tokens) speedEl.textContent = `${d.tokens} tokens · ${d.tps ? d.tps.toFixed(1) + ' tok/s · ' : ''}${S.device === 'webgpu' ? 'GPU' : 'CPU'}`;
  updateSend();
  if (!isTouch) input.focus();
}
function stop() {
  if (!S.generating || !worker) return;
  S.stopRequested = true;
  worker.postMessage({ type: 'stop' });
}
function newChat() {
  if (S.generating) stop();
  S.cur = null;
  S.generating = false;
  S.pending = null;
  S.messages = [];
  thread.querySelectorAll('.msg').forEach((el) => el.remove());
  hero.hidden = false;
  speedEl.textContent = '';
  renderSetup();
  updateSend();
  input.focus();
}

thread.addEventListener('click', async (e) => {
  const chip = e.target.closest('.chip');
  if (chip) { send(chip.textContent); return; }
  const btn = e.target.closest('.mini');
  if (!btn) return;
  const m = btn.closest('.msg')?._msg;
  if (!m) return;
  if (btn.dataset.act === 'copy') {
    try { await navigator.clipboard.writeText(m.content); btn.textContent = 'copied!'; }
    catch { btn.textContent = "can't copy"; }
    setTimeout(() => { btn.textContent = 'copy'; }, 1200);
  } else if (btn.dataset.act === 'retry') {
    if (S.generating || S.pending || S.messages[S.messages.length - 1] !== m) return;
    if (S.status === 'ready') runGenerate(m);
  }
});

// ---------- composer ----------
function autosize() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 180) + 'px';
}
function updateSend() {
  const busy = S.generating;
  sendBtn.classList.toggle('stop', busy);
  sendBtn.setAttribute('aria-label', busy ? 'Stop' : 'Send');
  sendBtn.disabled = !busy && (!input.value.trim() || !!S.pending);
  // hide retry everywhere except on the last answer
  const last = S.messages[S.messages.length - 1];
  thread.querySelectorAll('.msg.ai [data-act="retry"]').forEach((b) => { b.hidden = b.closest('.msg')._msg !== last; });
}
input.addEventListener('input', () => { autosize(); updateSend(); });
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !isTouch) {
    e.preventDefault();
    send();
  }
});
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (S.generating) stop();
  else send();
});
$('#newChat').addEventListener('click', newChat);

// ---------- boot ----------
(async function boot() {
  suggest.innerHTML = SUGGESTIONS.map((s) => `<button type="button" class="chip">${esc(s)}</button>`).join('');
  S.backend = await detectBackend();
  if (!BRAINS[S.brain]) S.brain = 'normal';
  const [n, p] = await Promise.all([checkCached('normal'), checkCached('potato')]);
  S.cached = { normal: n, potato: p };
  renderBrains();
  updateSend();
  // already downloaded before? just load it, it's quick
  if (S.cached[S.brain]) loadBrain();
})();
})();
