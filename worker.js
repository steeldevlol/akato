// Acatto AI: the "brain". This function is never run on the page itself:
// app.js turns its source code into a Web Worker (through a Blob URL), so the
// model runs off the main thread and the site also works when index.html is
// opened straight from disk. Everything here runs on the visitor's device; the
// model files come from the Hugging Face hub once, then the browser caches them.
// Keep this function self-contained: it can't see anything outside itself.
function acattoBrainWorker() {
  const LIB_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2';
  const post = (msg) => self.postMessage(msg);

  let T = null;          // the transformers.js library
  let stopper = null;
  let tokenizer = null;
  let model = null;
  let cfg = null;

  async function getLib() {
    if (T) return T;
    post({ type: 'status', text: 'loading AI engine' });
    T = await import(LIB_URL);
    T.env.allowLocalModels = false;
    // pages opened from a file have no Cache Storage: download without saving
    try { await caches.open('transformers-cache'); } catch { T.env.useBrowserCache = false; }
    stopper = new T.InterruptableStoppingCriteria();
    return T;
  }

  // best backend: GPU (WebGPU, ideally with fp16) or CPU (WASM)
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

  // add up byte progress over every file being fetched
  function makeProgress() {
    const files = new Map();
    let lastSent = 0;
    return (p) => {
      if (p.status === 'progress' && p.total) {
        files.set(p.file, { loaded: p.loaded, total: p.total });
        const now = performance.now();
        if (now - lastSent < 80) return;
        lastSent = now;
        let loaded = 0, total = 0;
        for (const f of files.values()) { loaded += f.loaded; total += f.total; }
        post({ type: 'progress', loaded, total });
      } else if (p.status === 'initiate') {
        post({ type: 'status', text: `fetching ${p.file.split('/').pop()}` });
      }
    };
  }

  // config = { gpu: {id, dtype: {f16, f32}, gen}, cpu: {id, dtype, gen} }
  async function load(config, forceCpu = false) {
    const { AutoTokenizer, AutoModelForCausalLM } = await getLib();
    const kind = forceCpu ? 'wasm' : await detectBackend();
    const device = kind === 'wasm' ? 'wasm' : 'webgpu';
    const v = device === 'wasm' ? config.cpu : config.gpu;
    const dtype = device === 'wasm' ? v.dtype : v.dtype[kind === 'webgpu16' ? 'f16' : 'f32'];
    cfg = v;
    const progress_callback = makeProgress();

    post({ type: 'status', text: 'loading tokenizer' });
    tokenizer = await AutoTokenizer.from_pretrained(v.id, { progress_callback });

    post({ type: 'status', text: `downloading brain (${device === 'webgpu' ? 'GPU' : 'CPU'} version)` });
    try {
      model = await AutoModelForCausalLM.from_pretrained(v.id, { dtype, device, progress_callback });
      post({ type: 'status', text: 'warming up' });
      // one tiny run so the first real answer doesn't stall on setup work
      await model.generate({ ...tokenizer('hi'), max_new_tokens: 1 });
    } catch (err) {
      if (device === 'webgpu') {
        // some GPUs/drivers choke on WebGPU: fall back to the CPU
        post({ type: 'status', text: 'GPU said no, switching to CPU' });
        try { await model?.dispose?.(); } catch { /* ignore */ }
        model = null;
        return load(config, true);
      }
      throw err;
    }
    post({ type: 'ready', device, dtype });
  }

  async function generate(messages, id) {
    if (!model || !tokenizer) throw new Error('model not loaded');
    const inputs = tokenizer.apply_chat_template(messages, { add_generation_prompt: true, return_dict: true });

    let count = 0;
    let first = 0;
    let tps = 0;
    const streamer = new T.TextStreamer(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (text) => post({ type: 'token', id, text }),
      token_callback_function: () => {
        count++;
        const now = performance.now();
        if (!first) first = now;
        else if (count % 4 === 0) {
          tps = (count - 1) / ((now - first) / 1000);
          post({ type: 'stats', id, tps });
        }
      },
    });

    stopper.reset();
    const { temperature = 0, ...rest } = cfg.gen;
    const opts = { ...inputs, ...rest, do_sample: temperature > 0, streamer, stopping_criteria: stopper };
    if (temperature > 0) opts.temperature = temperature;
    await model.generate(opts);
    post({ type: 'done', id, tokens: count, tps });
  }

  self.addEventListener('message', async ({ data }) => {
    try {
      if (data.type === 'load') await load(data.config);
      else if (data.type === 'generate') await generate(data.messages, data.id);
      else if (data.type === 'stop') stopper?.interrupt();
    } catch (err) {
      post({ type: 'error', during: data.type, id: data.id, message: String(err?.message || err) });
    }
  });
  post({ type: 'alive' });
}
