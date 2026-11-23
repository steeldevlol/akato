/* =========================================================
   Acatto AI Handout Simulator
   You are acatto. You have infinite AI. Give it out right.
   ========================================================= */
'use strict';
(() => {

// ---------------------------------------------------------
// helpers
// ---------------------------------------------------------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('en-US');
const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => (k in v ? v[k] : ''));
const store = {
  get(k, d) { try { const v = localStorage.getItem('acatto.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('acatto.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};
const isTouch = window.matchMedia('(hover: none)').matches;
const isMobile = () => window.matchMedia('(max-width: 760px)').matches;
const AV_SRC = 'assets/acatto.webp';
const timeStr = (prefix = 'Today at') => prefix + ' ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// ---------------------------------------------------------
// game data
// ---------------------------------------------------------
const AI = {
  code:  { name: 'code AI',    short: 'Code',  emoji: '⌨️', color: '#5865F2' },
  image: { name: 'image AI',   short: 'Image', emoji: '🎨', color: '#EB459E' },
  write: { name: 'writing AI', short: 'Write', emoji: '📝', color: '#23A55A' },
  voice: { name: 'voice AI',   short: 'Voice', emoji: '🎤', color: '#F0B232' },
};
const TYPES = Object.keys(AI);
const TOOL_ORDER = ['code', 'image', 'write', 'voice', 'ban'];

const REQ = {
  code: [
    "my python script keeps crashing pls help",
    "can u give me ai to code my discord bot",
    "i need ai to fix this javascript bug",
    "make me a website plsss",
    "how do i center a div 😭 need code help",
    "need ai for my roblox lua code",
    "my minecraft mod won't compile",
    "can ai do my c++ programming assignment",
    "my app keeps crashing, need ai to debug it",
    "i need an ai that writes SQL queries",
    "my html page looks broken send help",
    "need ai to code a calculator app",
    "my unity game keeps throwing errors",
    "can u make me a chrome extension",
  ],
  image: [
    "can u make me an anime pfp",
    "need a logo for my clan",
    "draw me a cat wearing sunglasses",
    "i need a wallpaper for my phone",
    "can ai make my server banner",
    "make a meme picture of fasfas",
    "need a thumbnail for my youtube vid",
    "generate a picture of a dragon",
    "i need fan art of my oc",
    "make me a pixel art sprite",
    "can ai draw my dog as a superhero",
    "need a custom emoji for this server",
    "make me a cool profile banner",
  ],
  write: [
    "can ai write my english essay",
    "need ai to write an email to my teacher",
    "write me a poem for my gf",
    "i need a short story for class",
    "summarize this book for me i didn't read it",
    "write my apology letter 😭",
    "need a funny bio for my profile",
    "help me write a speech for tomorrow",
    "translate my homework to spanish",
    "write a fanfic about fasfas",
    "need ai to write my cover letter",
    "can u write my history report",
    "write a text to get my ex back 💀",
  ],
  voice: [
    "i need ai to make a beat",
    "can ai sing happy birthday for my mom",
    "need a voice changer for vc",
    "make me a song about pizza",
    "i need text to speech for my video",
    "can u make a lofi track",
    "need ai to make a ringtone",
    "i want ai to narrate my tiktok",
    "make my voice sound like a movie trailer guy",
    "i need background music for my game",
    "can ai do a podcast voice for me",
    "need a sound effect for my stream alerts",
    "make my cat meow in auto-tune",
  ],
};
const MULTI = [
  { w: ['code', 'image'], t: ["make me a website AND a logo for it", "code my game and draw the main character", "need a discord bot and a pfp for it"] },
  { w: ['write', 'voice'], t: ["write lyrics and turn them into a song", "write a story and narrate it for my tiktok"] },
  { w: ['write', 'image'], t: ["write a story and draw a cover for it", "need an essay and a poster for my presentation"] },
  { w: ['code', 'voice'], t: ["fix my game code and make music for it", "code a discord bot and give it a voice"] },
  { w: ['image', 'voice'], t: ["make a thumbnail and an intro song for my channel", "draw my oc and give them a voice"] },
  { w: ['code', 'write'], t: ["build me a blog website and write the first post", "code my bot and write its welcome message"] },
];

const NAMES = ['zyroo', 'kxra', 'lilbyte', 'toastyy', 'voidwalker', 'mangoo', 'ghostie', 'frxst', 'nebula', 'cheeseburger', 'sk8r', 'yuki', 'bloop', 'ducky', 'neon', 'pebble', 'cosmo', 'lucid', 'wavy', 'fizz', 'jellyfish', 'tako', 'noodle', 'sushi', 'pixelbean', 'oreo', 'kirbo', 'mxlk', 'sparky', 'blaze', 'zeph', 'rin', 'nova', 'echo', 'juno', 'milo', 'pip', 'raven', 'sage', 'tofu', 'waffle', 'zuko', 'luna', 'ash', 'kai', 'bean', 'glitch', 'turbo', 'chillguy', 'lemon', 'vortex', 'dusk', 'orbit', 'pancake', 'kiwi', 'bubbles', 'static', 'sprout', 'mochaa', 'crumb'];
const NAME_SFX = ['', '', '', '', '_', 'x', '123', '.exe', 'ttv', '07', '_irl', 'yt', '2k', 'z', '.dev', '_', '99'];
const AV_EMOJI = ['🐸', '🐱', '🐶', '🦊', '🐼', '🐵', '🐧', '🦄', '🐙', '🐢', '🦖', '👾', '💀', '🍕', '🌮', '🐻', '🐨', '🐯', '🦁', '🐷', '🐰', '🐹', '🦉', '🐝', '🍩', '🌵', '🍄', '⚡', '🔥', '🌙', '⭐', '🎮', '🧃', '🥑'];
const AV_BG = ['#5865f2', '#eb459e', '#3ba55c', '#faa61a', '#ed4245', '#9b59b6', '#1abc9c', '#e67e22', '#747f8d', '#4e5d94'];
const ROLE_COLORS = ['#f2f3f5', '#f2f3f5', '#f2f3f5', '#f2f3f5', '#e91e63', '#3498db', '#2ecc71', '#9b59b6', '#1abc9c', '#e67e22', '#ff73fa', '#a5b4fc', '#ff8a65'];

const FED_NAMES_OBVIOUS = ['definitely_not_a_fed', 'FBI_Open_Up', 'agent_smith_47', 'TrustAndSafety_Intern', 'officer_dave', 'NotACop2009', 'hello.fellow.kids', 'gov_employee_19', 'undercover_ted'];
const FED_NAMES_SUBTLE = ['john.smith.official', 'regular_teen_user', 'user84712093', 'normal.gamer', 'concerned_citizen', 'mr.anderson', 'jeff_from_hr', 'totally_14'];
const FED_TEXT = [
  "Greetings. I would like to acquire one (1) free {ai}. For legal reasons.",
  "hello fellow young person. may i have the free {ai}? asking for a friend (not the government)",
  "do you have a license to distribute AI? anyway can i have some {ai}",
  "hello. i am a normal 15 year old who likes video games. please send {ai}.",
  "I require {ai}. This conversation is being recorded for quality assurance.",
  "please state your full name and home address. also i want free {ai}",
  "can i get {ai}? i will NOT be reporting this to anyone 🙂",
  "Good afternoon. Requesting {ai} for an ongoing... uh... school project.",
  "yo what's good fellow gamers. how does one obtain {ai}. for evidence. i mean fun",
  "where are your servers physically located? unrelated, can i have {ai}",
  "Hello. Kindly provide the {ai}. Thank you for your cooperation, citizen.",
];
const FED_GOTCHA = ["thank you. this will be useful as evidence.", "gotcha 🙂", "this has been forwarded to the appropriate authorities.", "noted. 📝", "appreciate your cooperation, acatto 🕶️"];

const SCAM_NAMES = ['Nitro Giveaway', 'Discord Staff', 'Steam Support', 'free robux bot', 'Giveaway Bot', 'Moderator Team'];
const SCAMS = [
  { pre: "🎁 FREE NITRO for 3 months!! claim here →", link: "dlscord-gift.ru/claim" },
  { pre: "im quitting cs2, giving away all my skins", link: "steamcommunnity.ru/trade" },
  { pre: "my friend made a game can u test it?", link: "game-test-free.exe.zip" },
  { pre: "omg is this you in this video?? →", link: "yuotube.co/watch?v=you" },
  { pre: "FREE Fasfas AI premium →", link: "fasfas-ai.claim-now.ru" },
  { pre: "$50 steam gift card 🎁 first 10 only", link: "steampowered.gifts/50" },
  { pre: "free robux generator 100% legit", link: "robIox.com.free-robux.ru" },
  { pre: "i accidentally reported you, talk to this admin →", link: "discord-staff-help.xyz" },
];

const CHATTER = [
  "lol", "who wants to vc", "acatto is goated fr", "fasfas when update", "bro my wifi is cooked", "gm chat", "gn chat",
  "first", "is acatto a real person or an ai", "how does acatto have infinite ai 😭", "brb", "💀💀💀", "w server",
  "who pinged me", "im bored", "anyone play minecraft", "my mom is calling me brb", "the free ai is actually good wtf",
  "skill issue", "W", "chat is moving so fast nobody will see i like pineapple pizza", "can we get a #free-ai-2 channel",
  "pls dont ping everyone", "acatto never sleeps", "what is this server even about", "just got here what did i miss",
  "touch grass", "this chat is unhinged", "🗿", "real", "nah thats crazy", "who is fasfas", "average fasfas ai moment",
  "bro the feds are watching this chat 👀", "acatto typing at 300 wpm", "lmaooo", "this server is so active",
  "i got free ai yesterday it was fire", "imagine paying for ai 😂", "anyone got the minecraft server ip", "ratio",
];
const THANKS = ["ty acatto 🙏", "W acatto", "acatto is goated fr", "it works!!", "infinite ai man strikes again", "bro this ai is insane", "ok this is actually fire 🔥", "thank u king 👑", "acatto never misses"];
const WRONG = ["bro i asked for {want}, not {got} 💀", "why did u send me {got} 😭 i wanted {want}", "acatto can't read 💀", "this is not what i asked for 👎", "{got}?? i said {want} bro", "bro thinks i wanted {got} 😭"];
const UNASKED = ["i didn't ask for ai?? 😭", "bro why u giving me {got}", "uh thanks? i didn't ask", "acatto is spamming ai again 💀"];
const EXPIRED = ["nvm acatto ignored me 😐", "guess i'll pay for chatgpt then 🙄", "bro left me on read", "acatto ignoring me fr", "ok nvm 😒", "wow ok acatto"];
const SCAMMED_REPLIES = ["bro i clicked the link 😭", "my account got hacked wtf", "why didn't anyone ban that bot", "i just lost my nitro 💀", "WHO SENT THAT LINK"];
const BAN_REPLIES = ["W ban", "get that bot outta here", "acatto the mod 🫡", "clean chat 🧹"];
const FED_BAN_REPLIES = ["W ban, that was 100% a fed", "the feds are scared of acatto now", "fed down 🕵️🔨", "bro really thought he was slick"];
const INNOCENT_BAN_REPLIES = ["why did acatto ban them??", "acatto power tripping 💀", "free them 😭", "bro got banned for nothing"];
const LAPTOP_LINES = ["laptop online. BOOST MODE 😈", "ok laptop time. typing with 10 fingers now", "found my laptop charger 🔌 lets go", "laptop > phone. infinite ai x2"];

const DROPS = {
  laptop:   { name: 'Laptop',      icon: '💻', color: '#23A55A', desc: 'BOOST: no cooldown + ×2 points', w: 34 },
  slowmode: { name: 'Slowmode',    icon: '🐢', color: '#F0B232', desc: 'the chat slows down for 10s', w: 16 },
  everyone: { name: '@everyone',   icon: '📢', color: '#EB459E', desc: 'everyone waiting gets their AI', w: 13 },
  shield:   { name: 'Mod Shield',  icon: '🛡️', color: '#5865F2', desc: 'blocks your next 2 mistakes', w: 18 },
  router:   { name: 'Auto-Router', icon: '🧠', color: '#B47CFF', desc: 'any AI you give is the right one (10s)', w: 19 },
};

const PERKS = [
  { id: 'thumbs',    icon: '👍', name: 'Fast Thumbs',    desc: 'Phone cooldown −30%', max: 3, apply() { S.cdBase *= 0.7; } },
  { id: 'charger',   icon: '🔌', name: 'Laptop Charger', desc: 'Laptop BOOST lasts +4s', max: 3 },
  { id: 'chill',     icon: '🧊', name: 'Chill Server',   desc: 'Everyone waits 20% longer', max: 3, apply() { S.patMult *= 1.2; } },
  { id: 'saver',     icon: '🧷', name: 'Combo Saver',    desc: 'Your first mistake each wave keeps your combo', max: 1 },
  { id: 'nitro',     icon: '💎', name: 'Nitro Boost',    desc: '+20% score from everything', max: 5, apply() { S.scoreMult *= 1.2; } },
  { id: 'radar',     icon: '📡', name: 'Fed Radar',      desc: 'Feds get a red outline', max: 1, apply() { $$('.msg.fed').forEach(e => e.classList.add('radar')); } },
  { id: 'vibe',      icon: '✨', name: 'Vibe Check',     desc: '+20 max vibe and full heal', max: 99, apply() { S.maxVibe += 20; S.vibe = S.maxVibe; } },
  { id: 'magnet',    icon: '🧲', name: 'Drop Magnet',    desc: 'Drops come 25% more often and stay longer', max: 1 },
  { id: 'copypaste', icon: '📋', name: 'Ctrl+C Ctrl+V',  desc: 'On laptop, each handout also serves 1 more person who wants that AI', max: 1 },
  { id: 'modrole',   icon: '🛡️', name: 'Mod Role',       desc: 'Start every wave with +1 shield', max: 3 },
];

const WAVE_NAMES = ['Morning chill', 'After school rush', 'Feds in the chat', 'Homework deadline', 'Raid night', 'Viral TikTok', 'Finals week', 'Server boosted', 'Infinite demand'];
const WAVE_SUBS = [
  isTouch ? 'Tap an AI below, then tap whoever @\'d you' : 'Pick an AI (1–4), then click whoever @\'d you',
  'Scam bots incoming 🔨', "Don't feed the feds 🕵️", 'Double requests 📚', 'Raids enabled 🚨',
];
const waveName = n => WAVE_NAMES[n - 1] || `Infinite demand ×${n - 8}`;
const waveSub = n => WAVE_SUBS[n - 1] || 'Faster. Meaner. More AI.';

const TIPS = {
  1: [
    '👋 welcome to <b>Fasfas AI</b>! people will <span class="ping">@acatto</span> you asking for free AI.',
    isTouch
      ? '👉 tap the right AI in the bar at the bottom, then tap the person. match what they asked for!'
      : '👉 pick the right AI at the bottom (keys <b>1–4</b>), then click the person. match what they asked for!',
  ],
  2: ['⚠️ <b>scam bots</b> spotted! select the 🔨 <b>Ban</b> hammer' + (isTouch ? '' : ' (<b>B</b>, or right-click)') + ' and ban anyone posting sketchy links before they scam people.'],
  3: ['🕵️ <b>feds</b> have joined the chat. NEVER give them AI. sus names, 🐣 new accounts, weirdly formal messages: <b>ban them</b> for big points.'],
  4: ['📚 homework season: some people want <b>two</b> AIs now. give them both.', '👀 people are getting lazy with the emoji tags. <b>read what they ask</b>.'],
  5: ['🚨 raids can happen from now on. keep the ban hammer ready.'],
};

// difficulty curves (w = wave number)
const D = {
  reqInterval: w => Math.max(0.7, 2.3 * Math.pow(0.87, w - 1)),
  patience: w => Math.max(6, 12.5 - 0.65 * (w - 1)),
  chip: w => (w <= 2 ? 1 : Math.max(0.12, 1 - 0.2 * (w - 2))),
  multi: w => (w < 4 ? 0 : Math.min(0.3, 0.12 + 0.03 * (w - 4))),
  scam: w => (w < 2 ? 0 : Math.min(0.15, 0.09 + 0.012 * (w - 2))),
  fed: w => (w < 3 ? 0 : Math.min(0.16, 0.1 + 0.012 * (w - 3))),
  scamTime: w => Math.max(4.5, 8 - 0.4 * (w - 2)),
};
const comboMult = c => (c >= 35 ? 4 : c >= 20 ? 3 : c >= 10 ? 2 : c >= 5 ? 1.5 : 1);

const ACATTO = { name: 'acatto', color: '#f0b232', img: true, role: true };
const BOT = { name: 'FasfasBot', color: '#f2f3f5', fasfas: true, bot: true };

// ---------------------------------------------------------
// sound (tiny WebAudio synth, no files)
// ---------------------------------------------------------
const Sfx = (() => {
  let ctx = null, master = null, noiseBuf = null, muted = store.get('muted', false), lastPing = 0;
  function ensure() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { /* no audio */ }
  }
  function tone(f, d, o = {}) {
    const t0 = ctx.currentTime + (o.at || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + d);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.v || 0.15, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + d + 0.03);
  }
  function noise(d, v, freq) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t0 = ctx.currentTime;
    src.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    src.connect(f); f.connect(g); g.connect(master); src.start(t0); src.stop(t0 + d);
  }
  const lib = {
    ping() { const n = performance.now(); if (n - lastPing < 250) return; lastPing = n; tone(1046, 0.07, { type: 'triangle', v: 0.07 }); tone(1568, 0.1, { type: 'triangle', v: 0.05, at: 0.06 }); },
    good() { tone(660, 0.08, { type: 'square', v: 0.05 }); tone(990, 0.14, { type: 'square', v: 0.05, at: 0.07 }); },
    combo() { tone(880, 0.07, { type: 'square', v: 0.05 }); tone(1320, 0.07, { type: 'square', v: 0.05, at: 0.06 }); tone(1760, 0.14, { type: 'square', v: 0.05, at: 0.12 }); },
    bad() { tone(220, 0.3, { type: 'sawtooth', v: 0.11, to: 80 }); },
    ban() { tone(150, 0.22, { type: 'square', v: 0.13, to: 40 }); noise(0.16, 0.3, 1400); },
    power() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, { type: 'triangle', v: 0.09, at: i * 0.06 })); },
    click() { tone(1500, 0.03, { type: 'square', v: 0.025 }); },
    deny() { tone(190, 0.07, { type: 'square', v: 0.045 }); },
    wave() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, { type: 'triangle', v: 0.09, at: i * 0.09 })); },
    over() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.34, { type: 'sawtooth', v: 0.07, at: i * 0.22 })); },
    alert() { for (let i = 0; i < 4; i++) tone(i % 2 ? 900 : 620, 0.17, { type: 'square', v: 0.05, at: i * 0.18 }); },
    shield() { tone(700, 0.18, { type: 'sine', v: 0.12, to: 1600 }); },
    msg() { tone(784, 0.06, { type: 'triangle', v: 0.06 }); },
  };
  return {
    ensure,
    play(n) { if (muted || !ctx || ctx.state !== 'running') return; try { lib[n] && lib[n](); } catch (e) { /* ignore */ } },
    toggle() { muted = !muted; store.set('muted', muted); return muted; },
    get muted() { return muted; },
  };
})();
const buzz = ms => { if (isTouch && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* ignore */ } } };

// ---------------------------------------------------------
// DOM refs
// ---------------------------------------------------------
const app = $('#app');
const chat = $('#chat');
const chatInner = $('#chatInner');
const fxLayer = $('#fx');
const toastsEl = $('#toasts');
const effectsEl = $('#effects');
const bannerEl = $('#banner');
const deviceEl = $('#device');
const devIcon = $('#devIcon');
const upStatus = $('#upStatus');
const overlay = $('#overlay');
const scoreEl = $('#score');
const scoreBox = $('.score-box');
const vibeFill = $('#vibeFill');
const vibeNum = $('#vibeNum');
const waveLabel = $('#waveLabel');
const waveFill = $('#waveFill');
const comboBox = $('#comboBox');
const comboNum = $('#comboNum');
const comboMultEl = $('#comboMult');
const typingEl = $('#typing');
const typingText = $('#typingText');
const toolsEl = $('#tools');
const slowTag = $('#slowTag');

// ---------------------------------------------------------
// state
// ---------------------------------------------------------
function freshState() {
  return {
    state: 'menu',            // menu | play | paused | countdown | between | over
    pausedBy: null,
    wave: 0, waveLeft: 0, waveLen: 45,
    time: 0,
    score: 0, combo: 0, maxCombo: 0,
    vibe: 100, maxVibe: 100,
    tool: 'code',
    cdUntil: 0, cdBase: 0.55, cdLen: 0.55,
    fx: { laptop: 0, slowmode: 0, router: 0 },
    shield: 0,
    perks: {},
    scoreMult: 1, patMult: 1,
    saverReady: false,
    timers: { req: 0, chat: 0, drop: 0, typing: 0 },
    events: [],
    pending: [],
    lastType: null,
    lastReason: '',
    stats: { served: 0, wrong: 0, expired: 0, feds: 0, scams: 0, badBans: 0, fedFails: 0, drops: 0 },
    waveStats: { served: 0, bans: 0 },
    perkOpts: [],
    perkReadyAt: 0,
  };
}
const S = freshState();
const msgs = new Map();
let nextId = 1;
let lastShift = { t: 0, h: 0 };
const recentNames = [];

// schedule in *game* time (pauses with the game)
const later = (fn, delay) => S.events.push({ at: S.time + delay, fn });

// ---------------------------------------------------------
// chat messages
// ---------------------------------------------------------
function newUser(opts = {}) {
  let name;
  for (let i = 0; i < 6; i++) {
    name = pick(NAMES) + pick(NAME_SFX);
    if (!S.pending.some(m => m.user && m.user.name === name)) break;
  }
  return { name, color: pick(ROLE_COLORS), av: pick(AV_EMOJI), bg: pick(AV_BG), newbie: !!opts.newbie };
}
function userAv(u) {
  if (u.img) return `<div class="av"><img src="${AV_SRC}" alt=""></div>`;
  if (u.fasfas) return '<div class="av fasfas-av">FA</div>';
  return `<div class="av" style="background:${u.bg}">${u.av}</div>`;
}
function userTags(u) {
  let s = '';
  if (u.bot) s += '<span class="bot-tag">BOT</span>';
  if (u.role) s += '<span class="tag role">♾️ INFINITE AI</span>';
  if (u.newbie) s += '<span class="tag new">🐣 NEW</span>';
  return s;
}
function addMsg(o) {
  const id = nextId++;
  const el = document.createElement('div');
  el.className = 'msg ' + (o.cls || '');
  el.dataset.id = id;
  el.innerHTML = userAv(o.user)
    + `<div class="body"><div class="meta"><span class="name" style="color:${o.user.color}">${esc(o.user.name)}</span>${userTags(o.user)}<span class="time">${timeStr()}</span></div>`
    + `<div class="text">${o.html}</div>${o.extra || ''}<div class="reacts"></div></div>`
    + (o.timed ? '<div class="pbar"><i></i></div>' : '');
  chatInner.appendChild(el);
  const m = Object.assign({ id, el, kind: o.kind, user: o.user, state: o.state || 'idle' }, o.data || {});
  m.body = el.querySelector('.body');
  m.reacts = el.querySelector('.reacts');
  m.bar = el.querySelector('.pbar i');
  msgs.set(id, m);
  // remember how far the chat just jumped (used to forgive clicks that land a frame late)
  const h = el.offsetHeight + 6, now = performance.now();
  lastShift = { t: now, h: (now - lastShift.t < 320 ? lastShift.h : 0) + h };
  if (!o.user.img && !o.user.bot) { recentNames.push(o.user.name); if (recentNames.length > 10) recentNames.shift(); }
  prune();
  return m;
}
// drop old messages once the chat overflows, but never drop anything still waiting on you
function prune() {
  const max = chat.clientHeight;
  if (!max) return;
  let i = 0;
  while (chatInner.offsetHeight > max && i < chatInner.children.length) {
    const el = chatInner.children[i];
    const m = msgs.get(+el.dataset.id);
    if (m && m.state === 'pending') { i++; continue; }
    if (m) msgs.delete(m.id);
    el.remove();
  }
}
function hasRoom() {
  const max = chat.clientHeight;
  let h = 16;
  for (const m of S.pending) h += m.el.offsetHeight + 6;
  return h + 100 <= max;
}
function trySpawn(fn, tries = 8) {
  if (S.state !== 'play') return;
  if (hasRoom()) fn();
  else if (tries > 0) later(() => trySpawn(fn, tries - 1), 0.5);
}
const mentionWrap = t => (Math.random() < 0.7 ? `<span class="ping">@acatto</span> ${esc(t)}` : `${esc(t)} <span class="ping">@acatto</span>`);
function chipsHTML(wants, show) {
  if (!show) return '<div class="chips"></div>';
  return `<div class="chips">${wants.map(w => `<span class="chip" data-t="${w}" style="--c:${AI[w].color}">${AI[w].emoji} ${AI[w].short}</span>`).join('')}</div>`;
}
function markChip(m, t) {
  const chips = m.el.querySelector('.chips');
  if (!chips) return;
  let c = chips.querySelector(`.chip[data-t="${t}"]`);
  if (!c) {
    chips.insertAdjacentHTML('beforeend', `<span class="chip" data-t="${t}" style="--c:${AI[t].color}">${AI[t].emoji} ${AI[t].short}</span>`);
    c = chips.lastElementChild;
  }
  c.classList.add('done');
  c.textContent = `✅ ${AI[t].short}`;
}
function addNote(m, cls, html) {
  let n = m.body.querySelector('.note');
  if (!n) { n = document.createElement('div'); m.body.insertBefore(n, m.reacts); }
  n.className = 'note ' + cls;
  n.innerHTML = html;
}
function addReact(m, emoji, count = 1, cls = '') {
  const r = document.createElement('span');
  r.className = 'react ' + cls;
  r.innerHTML = `${emoji} <span>${count}</span>`;
  m.reacts.appendChild(r);
}
function resolveEl(m, ...cls) {
  m.el.classList.remove('mention', 'urgent');
  m.el.classList.add('resolved', ...cls);
}
function removePending(m) {
  const i = S.pending.indexOf(m);
  if (i >= 0) S.pending.splice(i, 1);
}
function msgPos(m) {
  const r = m.el.getBoundingClientRect();
  return [r.left + Math.min(r.width / 2, 180), r.top + r.height / 2];
}

const reply = (user, text) => addMsg({ kind: 'chat', user, html: esc(text), cls: 'chatter' });
const botSay = html => addMsg({ kind: 'bot', user: BOT, html, cls: 'botmsg' });
const acattoSay = html => addMsg({ kind: 'self', user: ACATTO, html, cls: 'self' });
function spawnChatter() { reply(newUser({ newbie: Math.random() < 0.06 }), pick(CHATTER)); }

function pickType() {
  let t = pick(TYPES);
  if (t === S.lastType) t = pick(TYPES); // soft anti-repeat
  S.lastType = t;
  return t;
}
function spawnRequest() {
  const w = S.wave, r = Math.random(), sc = D.scam(w), fc = D.fed(w);
  if (r < sc) return spawnScam();
  if (r < sc + fc) return spawnFed();
  let wants, text;
  if (Math.random() < D.multi(w)) { const mm = pick(MULTI); wants = mm.w.slice(); text = pick(mm.t); }
  else { const t = pickType(); wants = [t]; text = pick(REQ[t]); }
  const user = newUser({ newbie: w >= 5 && Math.random() < 0.15 });
  const p = D.patience(w) * (wants.length > 1 ? 1.5 : 1) * S.patMult;
  const m = addMsg({
    kind: 'req', user, html: mentionWrap(text), extra: chipsHTML(wants, Math.random() < D.chip(w)),
    cls: 'mention req', timed: true, state: 'pending', data: { wants, got: [], t: p, max: p },
  });
  S.pending.push(m);
  Sfx.play('ping');
}
function spawnFed(obviousForce) {
  const w = S.wave;
  const obvious = obviousForce || w <= 4 || Math.random() < 0.4;
  const user = obvious
    ? { name: pick(FED_NAMES_OBVIOUS), color: '#f2f3f5', av: pick(['🕶️', '🕵️', '👔', '📋']), bg: '#4e5058', newbie: true }
    : { name: pick(FED_NAMES_SUBTLE), color: pick(ROLE_COLORS), av: pick(AV_EMOJI), bg: pick(AV_BG), newbie: Math.random() < 0.6 };
  const bait = pick(TYPES);
  const p = D.patience(w) * 1.1 * S.patMult;
  const html = mentionWrap(fill(pick(FED_TEXT), { ai: AI[bait].name }));
  const m = addMsg({
    kind: 'fed', user, html, extra: chipsHTML([bait], Math.random() < D.chip(w)),
    cls: 'mention fed' + (S.perks.radar ? ' radar' : ''), timed: true, state: 'pending', data: { wants: [bait], t: p, max: p },
  });
  S.pending.push(m);
  Sfx.play('ping');
}
function spawnScam(obviousForce) {
  const w = S.wave;
  const compromised = !obviousForce && w >= 5 && Math.random() < 0.5;
  const user = compromised ? newUser() : { name: pick(SCAM_NAMES), color: '#f2f3f5', av: '🎁', bg: '#2b2d31', newbie: true };
  const s = pick(SCAMS);
  const html = `<span class="ping">@everyone</span> ${esc(s.pre)} <span class="link">${esc(s.link)}</span>`;
  const p = D.scamTime(Math.max(2, w));
  const m = addMsg({ kind: 'scam', user, html, cls: 'mention everyone scam', timed: true, state: 'pending', data: { t: p, max: p } });
  S.pending.push(m);
  Sfx.play('ping');
}
function spawnDrop(type) {
  if (!type) {
    const tot = Object.values(DROPS).reduce((a, d) => a + d.w, 0);
    let r = Math.random() * tot;
    for (const k in DROPS) { r -= DROPS[k].w; if (r <= 0) { type = k; break; } }
    type = type || 'laptop';
  }
  const d = DROPS[type];
  const life = S.perks.magnet ? 8.5 : 6;
  const extra = `<div class="drop-card" style="--c:${d.color}"><span class="drop-ico">${d.icon}</span><div class="drop-txt"><div class="drop-name">${d.name}</div><div class="drop-desc">${d.desc}</div></div><span class="drop-btn">Claim</span></div>`;
  const m = addMsg({
    kind: 'drop', user: BOT, html: pick(['🎁 a drop just spawned! first to claim gets it', '📦 loot drop! quick', '👀 something dropped in chat']),
    extra, cls: 'drop botmsg', timed: true, state: 'pending', data: { type, t: life, max: life },
  });
  S.pending.push(m);
  Sfx.play('msg');
}
function raid() {
  if (S.state !== 'play') return;
  botSay('🚨 <b>RAID DETECTED</b>: scam bots incoming! get the 🔨 ban hammer ready');
  banner('🚨 RAID', 'Scam bots incoming', 'ban them before they scam everyone');
  Sfx.play('alert');
  const n = 3 + Math.min(4, Math.floor(S.wave / 3));
  for (let i = 0; i < n; i++) later(() => trySpawn(() => spawnScam()), 1 + i * 0.75);
}

// ---------------------------------------------------------
// player actions
// ---------------------------------------------------------
function targetAt(x, y) {
  const hit = document.elementFromPoint(x, y);
  const el = hit && hit.closest('#chatInner .msg');
  const m = el ? msgs.get(+el.dataset.id) : null;
  // a message popped in right as you clicked: aim where your target was a moment ago
  if ((!m || m.state !== 'pending') && lastShift.h && performance.now() - lastShift.t < 280) {
    const hit2 = document.elementFromPoint(x, y - lastShift.h);
    const el2 = hit2 && hit2.closest('#chatInner .msg');
    const m2 = el2 ? msgs.get(+el2.dataset.id) : null;
    if (m2 && m2.state === 'pending') return m2;
  }
  return m;
}
function act(m, tool, x, y) {
  if (S.state !== 'play' || !m) return;
  if (m.kind === 'drop') { if (m.state === 'pending') claimDrop(m, x, y); return; }
  if (m.kind === 'bot' || m.kind === 'self') return;
  if (m.kind !== 'chat' && m.state !== 'pending') return;
  if (m.kind === 'chat' && m.banned) return;
  if (S.time < S.cdUntil) { deny(); return; }
  S.cdLen = S.fx.laptop > 0 ? 0.06 : S.cdBase;
  S.cdUntil = S.time + S.cdLen;
  fly(tool, x, y);
  if (tool === 'ban') ban(m, x, y);
  else give(m, tool, x, y);
}
let lastDeny = 0;
function deny() {
  const n = performance.now();
  if (n - lastDeny < 200) return;
  lastDeny = n;
  Sfx.play('deny');
  deviceEl.classList.remove('deny'); void deviceEl.offsetWidth; deviceEl.classList.add('deny');
}
function comboUp() {
  S.combo++;
  if (S.combo > S.maxCombo) S.maxCombo = S.combo;
  comboBox.classList.remove('cpop'); void comboBox.offsetWidth; comboBox.classList.add('cpop');
  if ([5, 10, 20, 35].includes(S.combo)) { Sfx.play('combo'); toast('🔥', `${S.combo} combo!`, `points ×${comboMult(S.combo)}`, '#F0B232', 1.4); }
}
function award(base, x, y, label = '') {
  const cm = comboMult(S.combo), boost = S.fx.laptop > 0 ? 2 : 1;
  const pts = Math.round(base * cm * boost * S.scoreMult);
  S.score += pts;
  const tags = [label, boost > 1 ? 'BOOST ×2' : '', cm > 1 ? `combo ×${cm}` : ''].filter(Boolean).join(' · ');
  pop(x, y, '+' + fmt(pts), cm * boost >= 4 ? 'gold' : '', tags);
  scoreBox.classList.remove('bump'); void scoreBox.offsetWidth; scoreBox.classList.add('bump');
  return pts;
}
// returns true if the penalty landed, false if a shield ate it
function mistake({ vibe, score, x, y, label, reason }) {
  if (S.shield > 0) {
    S.shield--;
    pop(x, y, '🛡️ BLOCKED', 'info', 'mod shield');
    Sfx.play('shield');
    return false;
  }
  S.vibe = Math.max(0, S.vibe - vibe);
  S.score = Math.max(0, S.score - score);
  if (S.combo > 0) {
    if (S.saverReady) { S.saverReady = false; toast('🧷', 'Combo Saver used', 'your combo survived', '#EB459E', 1.6); }
    else S.combo = 0;
  }
  S.lastReason = reason || S.lastReason;
  pop(x, y, `-${score}`, 'bad', label);
  Sfx.play('bad'); buzz(70); shake();
  if (S.vibe <= 0) setTimeout(gameOver, 450);
  return true;
}
function give(m, tool, x, y) {
  if (m.kind === 'chat') {
    if (m.asked) return;
    m.asked = true;
    pop(x, y, '🤨', 'info', "they didn't ask");
    Sfx.play('deny');
    if (Math.random() < 0.5) later(() => reply(m.user, fill(pick(UNASKED), { got: AI[tool].name })), 0.5);
    return;
  }
  if (m.kind === 'scam') {
    if (mistake({ vibe: 6, score: 40, x, y, label: "that's a scam bot 🤡", reason: 'you fed the scam bots' })) {
      addNote(m, 'bad', '🤡 acatto gave AI to a scam bot. ban it!');
      prune();
    }
    return;
  }
  if (m.kind === 'fed') return fedServed(m, x, y);
  // a real request
  let t = tool;
  if (S.fx.router > 0) t = m.wants.find(w => !m.got.includes(w));
  if (m.wants.includes(t) && !m.got.includes(t)) return serveOK(m, t, x, y, false);
  const need = m.wants.find(w => !m.got.includes(w));
  if (!mistake({ vibe: 12, score: 80, x, y, label: 'wrong AI 👎', reason: 'you kept giving people the wrong AI' })) {
    addNote(m, 'mod', '🛡️ Mod Shield deleted your wrong AI. try again');
    prune();
    return;
  }
  m.state = 'failed';
  removePending(m);
  resolveEl(m);
  m.el.classList.add('shake');
  addReact(m, '👎', 1, 'bad');
  if (Math.random() < 0.5) addReact(m, '💀', randi(2, 5));
  addNote(m, 'bad', `👎 wanted ${AI[need].emoji} ${AI[need].name}, got ${AI[tool].emoji} ${AI[tool].name}`);
  S.stats.wrong++;
  later(() => reply(m.user, fill(pick(WRONG), { want: AI[need].name, got: AI[tool].name })), 0.45);
  prune();
}
function serveOK(m, t, x, y, isCopy) {
  m.got.push(t);
  markChip(m, t);
  const done = m.got.length === m.wants.length;
  const frac = clamp(m.t / m.max, 0, 1);
  comboUp();
  let base = (m.wants.length > 1 ? 70 : 100) + Math.round(60 * frac);
  if (done && m.wants.length > 1) base += 100;
  award(base, x, y, isCopy ? 'CTRL+V' : frac > 0.7 ? 'FAST' : '');
  S.vibe = Math.min(S.maxVibe, S.vibe + 2);
  Sfx.play('good');
  if (done) completeReq(m);
  else { addNote(m, 'ok', `✅ ${AI[t].emoji} ${AI[t].short} sent · they want 1 more`); prune(); }
  // Ctrl+C Ctrl+V perk: on laptop, also hand the same AI to one more person who wants it
  if (!isCopy && S.perks.copypaste && S.fx.laptop > 0) {
    const other = S.pending.find(o => o !== m && o.kind === 'req' && o.wants.includes(t) && !o.got.includes(t));
    if (other) { const [ox, oy] = msgPos(other); fly(t, ox, oy); serveOK(other, t, ox, oy, true); }
  }
}
function completeReq(m) {
  m.state = 'done';
  removePending(m);
  resolveEl(m);
  addReact(m, '👍', 1, 'me');
  addReact(m, pick(['🔥', '🙏', '❤️', '🐐', '💯']), randi(1, 4));
  addNote(m, 'ok', `✅ got ${m.wants.map(w => AI[w].emoji + ' ' + AI[w].name).join(' + ')} from acatto`);
  S.stats.served++;
  S.waveStats.served++;
  if (Math.random() < 0.3) later(() => reply(m.user, pick(THANKS)), rand(0.6, 1.4));
  prune();
}
function fedServed(m, x, y) {
  if (!mistake({ vibe: 25, score: 250, x, y, label: '🚨 THAT WAS A FED', reason: 'you gave free AI to a fed 🚨' })) {
    addNote(m, 'mod', '🛡️ Mod Shield stopped you. that was a fed 👀');
    prune();
    return;
  }
  m.state = 'failed';
  removePending(m);
  resolveEl(m);
  addReact(m, '🚨', 1, 'bad');
  addNote(m, 'bad', '🚨 you gave AI to a fed. reported to Trust &amp; Safety.');
  flashRed();
  toast('🚨', 'You gave AI to a fed', 'ban them next time 🔨', '#F23F43');
  S.stats.fedFails++;
  later(() => reply(m.user, pick(FED_GOTCHA)), 0.5);
  prune();
}
function ban(m, x, y) {
  if (m.kind === 'scam' || m.kind === 'fed') {
    const fed = m.kind === 'fed';
    m.state = 'banned';
    removePending(m);
    resolveEl(m, 'banned');
    addNote(m, 'mod', fed ? '🔨 acatto banned a fed. W mod 🫡' : '🔨 scam bot banned');
    comboUp();
    award(fed ? 220 : 120, x, y, fed ? 'FED BANNED 🕵️' : 'SCAM BANNED');
    S.vibe = Math.min(S.maxVibe, S.vibe + 3);
    S.stats[fed ? 'feds' : 'scams']++;
    S.waveStats.bans++;
    Sfx.play('ban'); buzz(25);
    if (Math.random() < 0.35) later(() => reply(newUser(), pick(fed ? FED_BAN_REPLIES : BAN_REPLIES)), 0.6);
    prune();
    return;
  }
  // banning a real member
  if (!mistake({ vibe: 18, score: 150, x, y, label: 'banned a real one 😭', reason: 'you banned innocent members' })) {
    addNote(m, 'mod', '🛡️ Mod Shield undid that ban');
    prune();
    return;
  }
  if (m.kind === 'req') { m.state = 'failed'; removePending(m); }
  m.banned = true;
  resolveEl(m, 'banned');
  addNote(m, 'bad', '🔨 acatto banned a real member 😭');
  Sfx.play('ban');
  S.stats.badBans++;
  later(() => reply(newUser(), pick(INNOCENT_BAN_REPLIES)), 0.6);
  prune();
}
function claimDrop(m, x, y) {
  m.state = 'claimed';
  removePending(m);
  resolveEl(m);
  const b = m.el.querySelector('.drop-btn');
  if (b) b.textContent = 'Claimed ✓';
  const d = DROPS[m.type];
  pop(x, y, `${d.icon} ${d.name}!`, 'info');
  Sfx.play('power'); buzz(20);
  S.stats.drops++;
  switch (m.type) {
    case 'laptop':
      S.fx.laptop = 10 + 4 * (S.perks.charger || 0);
      S.cdUntil = S.time;
      document.body.classList.add('boost');
      later(() => acattoSay(esc(pick(LAPTOP_LINES))), 0.2);
      break;
    case 'slowmode': S.fx.slowmode = 10; break;
    case 'everyone': massServe(); break;
    case 'shield': S.shield += 2; break;
    case 'router': S.fx.router = 10; break;
  }
}
function massServe() {
  const list = S.pending.filter(m => m.kind === 'req');
  if (!list.length) { toast('📢', '@everyone', 'nobody was waiting... wasted 💀', '#EB459E'); return; }
  for (const m of list) {
    const [x, y] = msgPos(m);
    m.wants.forEach(w => { if (!m.got.includes(w)) { m.got.push(w); markChip(m, w); } });
    comboUp();
    award(110, x, y, '📢');
    S.vibe = Math.min(S.maxVibe, S.vibe + 2);
    completeReq(m);
  }
  Sfx.play('good');
  later(() => acattoSay('<span class="ping">@everyone</span> free ai for everyone 📢'), 0.3);
}
function expire(m) {
  removePending(m);
  resolveEl(m);
  const [x, y] = msgPos(m);
  if (m.kind === 'req') {
    m.state = 'failed';
    const hit = mistake({ vibe: 10, score: 25, x, y, label: 'ignored ⌛', reason: 'you left too many people on read' });
    addNote(m, hit ? 'bad' : 'mod', hit ? '⌛ acatto left them on read' : '🛡️ shield saved you · ⌛ left on read');
    m.el.classList.add('fadeout');
    S.stats.expired++;
    later(() => reply(m.user, pick(EXPIRED)), 0.3);
  } else if (m.kind === 'scam') {
    m.state = 'failed';
    const hit = mistake({ vibe: 12, score: 60, x, y, label: 'members scammed 💸', reason: 'you let the scam bots run wild' });
    addNote(m, hit ? 'bad' : 'mod', hit ? `💸 ${randi(2, 6)} members got scammed` : '🛡️ Mod Shield auto-deleted the scam');
    if (hit) later(() => reply(newUser(), pick(SCAMMED_REPLIES)), 0.5);
  } else if (m.kind === 'fed') {
    m.state = 'gone';
    m.el.classList.add('fadeout');
    addNote(m, 'mod', '🕵️ the fed got bored and left');
  } else if (m.kind === 'drop') {
    m.state = 'gone';
    m.el.classList.add('fadeout');
    const b = m.el.querySelector('.drop-btn');
    if (b) b.textContent = 'Expired';
  }
  prune();
}

// ---------------------------------------------------------
// juice
// ---------------------------------------------------------
function pop(x, y, text, cls = '', sub = '') {
  const el = document.createElement('div');
  el.className = 'pop ' + cls;
  el.style.left = clamp(x, 70, window.innerWidth - 70) + 'px';
  el.style.top = clamp(y, 40, window.innerHeight - 20) + 'px';
  el.innerHTML = esc(text) + (sub ? `<small>${esc(sub)}</small>` : '');
  fxLayer.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}
function fly(tool, x, y) {
  if (!fxLayer.animate) return;
  const r = deviceEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'fly';
  el.textContent = tool === 'ban' ? '🔨' : AI[tool].emoji;
  el.style.left = '0px'; el.style.top = '0px';
  fxLayer.appendChild(el);
  const sx = r.left + r.width / 2, sy = r.top + r.height / 2;
  const a = el.animate([
    { transform: `translate(${sx}px,${sy}px) translate(-50%,-50%) scale(.5)`, opacity: 1 },
    { transform: `translate(${x}px,${y}px) translate(-50%,-50%) scale(1.25)`, opacity: 1, offset: 0.75 },
    { transform: `translate(${x}px,${y}px) translate(-50%,-50%) scale(.3)`, opacity: 0 },
  ], { duration: 280, easing: 'cubic-bezier(.2,.7,.3,1)' });
  a.onfinish = () => el.remove();
}
function shake() {
  app.classList.remove('shake'); void app.offsetWidth; app.classList.add('shake');
}
function flashRed() {
  const f = document.createElement('div');
  f.className = 'flash-red';
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 600);
}
function toast(icon, title, sub = '', color = '#5865F2', dur = 2.4) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.setProperty('--c', color);
  el.style.setProperty('--d', dur + 's');
  el.innerHTML = `<span class="t-ico">${icon}</span><div>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
  toastsEl.appendChild(el);
  while (toastsEl.children.length > 3) toastsEl.firstElementChild.remove();
  setTimeout(() => el.remove(), (dur + 0.5) * 1000);
}
function banner(b1, b2, b3) {
  bannerEl.innerHTML = `<div class="b1">${b1}</div><div class="b2">${esc(b2)}</div><div class="b3">${esc(b3 || '')}</div>`;
  bannerEl.classList.remove('show'); void bannerEl.offsetWidth; bannerEl.classList.add('show');
}

// ---------------------------------------------------------
// waves
// ---------------------------------------------------------
function startWave(n) {
  S.wave = n;
  S.waveLen = n === 1 ? 40 : 45;
  S.waveLeft = S.waveLen;
  S.timers.req = n === 1 ? 1.6 : 1;
  S.timers.chat = 0.6;
  S.timers.drop = n === 1 ? 999 : rand(7, 11);
  S.events = [];
  S.saverReady = !!S.perks.saver;
  if (S.perks.modrole) S.shield += S.perks.modrole;
  S.waveStats = { served: 0, bans: 0 };
  S.state = 'play';
  banner(`WAVE ${n}`, waveName(n), waveSub(n));
  Sfx.play('wave');
  (TIPS[n] || []).forEach((t, i) => later(() => botSay(t), 0.3 + i * 1.4));
  if (n === 1) later(() => { botSay('💻 psst: <b>laptop drops</b> = BOOST mode. no cooldown, ×2 points. grab it!'); spawnDrop('laptop'); S.timers.drop = rand(12, 16); }, 14);
  if (n === 2) later(() => trySpawn(() => spawnScam(true)), 3.5);
  if (n === 3) later(() => trySpawn(() => spawnFed(true)), 4);
  if (n >= 5) later(raid, rand(12, 28));
}
function endWave() {
  S.state = 'between';
  for (const m of S.pending) { m.state = 'gone'; resolveEl(m, 'fadeout'); }
  S.pending = [];
  S.events = [];
  S.fx.laptop = S.fx.slowmode = S.fx.router = 0;
  document.body.classList.remove('boost');
  const bonus = Math.round(S.vibe * 4 * S.wave * S.scoreMult);
  S.score += bonus;
  S.vibe = Math.min(S.maxVibe, S.vibe + 10);
  Sfx.play('wave');
  banner('WAVE CLEARED', `+${fmt(bonus)}`, 'vibe bonus');
  setTimeout(() => showPerks(bonus), 1100);
}
function choosePerks() {
  const avail = PERKS.filter(p => (S.perks[p.id] || 0) < p.max);
  let opts = shuffle(avail.slice()).slice(0, 3);
  if (S.vibe / S.maxVibe < 0.5 && !opts.some(p => p.id === 'vibe')) opts[2] = PERKS.find(p => p.id === 'vibe');
  return opts;
}
function showPerks(bonus) {
  if (S.state !== 'between') return;
  $('#waveDoneTitle').textContent = `Wave ${S.wave} cleared!`;
  $('#waveSum').innerHTML = `Helped <b>${S.waveStats.served}</b> people · Bans <b>${S.waveStats.bans}</b> · Vibe bonus <b>+${fmt(bonus)}</b>`;
  S.perkOpts = choosePerks();
  $('#perkCards').innerHTML = S.perkOpts.map((p, i) => {
    const lv = S.perks[p.id] || 0;
    const lvl = !lv ? 'NEW' : p.max < 99 ? `LV ${lv} → ${lv + 1}` : `×${lv + 1}`;
    return `<button class="perk-card" data-id="${p.id}"><span class="pc-ico">${p.icon}</span><span class="pc-txt"><span class="pc-name">${p.name}</span><span class="pc-desc">${p.desc}</span><span class="pc-lvl">${lvl}</span></span>${isTouch ? '' : `<kbd>${i + 1}</kbd>`}</button>`;
  }).join('');
  S.perkReadyAt = performance.now() + 650; // don't let a frantic click pick for you
  showModal('mPerks');
}
function choosePerk(id) {
  if (S.state !== 'between' || performance.now() < S.perkReadyAt) return;
  const p = PERKS.find(q => q.id === id);
  if (!p) return;
  S.perks[id] = (S.perks[id] || 0) + 1;
  if (p.apply) p.apply();
  renderPerkList();
  Sfx.play('power');
  toast(p.icon, p.name, p.desc, '#EB459E', 1.8);
  countdown(() => startWave(S.wave + 1));
}
function renderPerkList() {
  const el = $('#perkList');
  const owned = PERKS.filter(p => S.perks[p.id]);
  el.innerHTML = owned.length
    ? owned.map(p => `<div class="perk-pill"><span class="pi">${p.icon}</span><span class="pn">${p.name}</span><span class="pc">${S.perks[p.id] > 1 ? '×' + S.perks[p.id] : ''}</span></div>`).join('')
    : '<div class="muted small">none yet, clear a wave</div>';
}

// ---------------------------------------------------------
// flow: menu / pause / countdown / game over
// ---------------------------------------------------------
function showModal(id) {
  overlay.classList.add('show');
  overlay.classList.toggle('clear', id === 'mCount');
  $$('.modal, .countdown', overlay).forEach(m => m.classList.toggle('show', m.id === id));
}
function hideModals() {
  overlay.classList.remove('show', 'clear');
  $$('.modal, .countdown', overlay).forEach(m => m.classList.remove('show'));
}
const modalOpen = id => $('#' + id).classList.contains('show');

let counting = false;
function countdown(cb) {
  if (counting) return;
  counting = true;
  S.state = 'countdown';
  const num = $('#countNum');
  showModal('mCount');
  let n = 3;
  const step = () => {
    if (n === 0) { counting = false; hideModals(); cb(); return; }
    num.textContent = n;
    num.style.animation = 'none'; void num.offsetWidth; num.style.animation = '';
    Sfx.play('click');
    n--;
    setTimeout(step, 430);
  };
  step();
}
function newGame() {
  Sfx.ensure();
  chatInner.innerHTML = '';
  msgs.clear();
  Object.assign(S, freshState());
  document.body.classList.remove('boost');
  setTool('code', true);
  renderPerkList();
  hideModals();
  for (let i = 0; i < 4; i++) spawnChatter();
  startWave(1);
}
function pauseGame() {
  if (S.state !== 'play') return;
  S.state = 'paused';
  S.pausedBy = 'menu';
  syncMuteLabels();
  showModal('mPause');
}
function resumeGame() {
  if (S.state !== 'paused') return;
  S.pausedBy = null;
  countdown(() => { S.state = 'play'; });
}
function softPause(by) {
  if (S.state === 'play') { S.state = 'paused'; S.pausedBy = by; }
}
function toMenu() {
  S.state = 'menu';
  document.body.classList.remove('boost');
  renderBest();
  showModal('mStart');
}
function gameOver() {
  if (S.state === 'over' || S.state === 'menu') return;
  S.state = 'over';
  document.body.classList.remove('boost', 'drawer-open');
  const best = store.get('best', 0);
  const isBest = S.score > best;
  if (isBest) store.set('best', S.score);
  Sfx.play('over');
  $('#overReason').textContent = `Reason: ${S.lastReason || 'the server vibe hit 0'}.`;
  $('#overScore').textContent = fmt(S.score);
  $('#overBest').textContent = isBest ? '🏆 NEW BEST!' : `best: ${fmt(best)}`;
  const st = S.stats;
  $('#overStats').innerHTML = [
    [S.wave, '🌊 wave'], [st.served, '🤖 AI given'], [S.maxCombo, '🔥 max combo'],
    [st.feds, '🕵️ feds banned'], [st.scams, '🔨 scams banned'], [st.wrong + st.expired + st.fedFails + st.badBans, '💀 mistakes'],
  ].map(([v, l]) => `<div><b>${fmt(v)}</b><span>${l}</span></div>`).join('');
  showModal('mOver');
}
function renderBest() {
  const best = store.get('best', 0);
  const ach = store.get('downbad', false);
  $('#bestLine').innerHTML = (best ? `Best score: <b>${fmt(best)}</b><br>` : '')
    + (ach ? '🏆 Achievement: <b>Down Bad</b>' : '🔒 1 secret achievement');
}
async function copyScore() {
  const txt = `I scored ${fmt(S.score)} in the Acatto AI handout simulator (wave ${S.wave}, gave AI to ${S.stats.served} people, banned ${S.stats.feds} feds) 🤖 https://acatto.ai/`;
  let ok = false;
  try { await navigator.clipboard.writeText(txt); ok = true; } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    ta.remove();
  }
  toast(ok ? '📋' : '❌', ok ? 'Copied!' : "Couldn't copy", ok ? 'paste it in #general' : '', ok ? '#23A55A' : '#F23F43', 1.6);
}

// ---------------------------------------------------------
// tools + input
// ---------------------------------------------------------
function setTool(t, silent) {
  if (!TOOL_ORDER.includes(t)) return;
  const changed = S.tool !== t;
  S.tool = t;
  $$('.tool', toolsEl).forEach(b => b.classList.toggle('active', b.dataset.tool === t));
  if (changed && !silent) Sfx.play('click');
}
function cycleTool(dir) {
  const i = TOOL_ORDER.indexOf(S.tool);
  setTool(TOOL_ORDER[(i + dir + TOOL_ORDER.length) % TOOL_ORDER.length]);
}
toolsEl.addEventListener('pointerdown', e => {
  const b = e.target.closest('.tool');
  if (!b) return;
  e.preventDefault();
  Sfx.ensure();
  setTool(b.dataset.tool);
});

let lastPointerType = 'mouse';
chat.addEventListener('pointerdown', e => {
  lastPointerType = e.pointerType;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  act(targetAt(e.clientX, e.clientY), S.tool, e.clientX, e.clientY);
});
chat.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (lastPointerType !== 'mouse') return; // long-press on phones shouldn't ban people
  act(targetAt(e.clientX, e.clientY), 'ban', e.clientX, e.clientY);
});
let wheelAt = 0;
chat.addEventListener('wheel', e => {
  if (S.state !== 'play') return;
  e.preventDefault();
  const n = performance.now();
  if (n - wheelAt < 110 || Math.abs(e.deltaY) < 4) return;
  wheelAt = n;
  cycleTool(e.deltaY > 0 ? 1 : -1);
}, { passive: false });

const KEYMAP = { 1: 'code', 2: 'image', 3: 'write', 4: 'voice', 5: 'ban', b: 'ban' };
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  Sfx.ensure();
  const k = e.key.toLowerCase();
  if (modalOpen('mPerks') && ['1', '2', '3'].includes(k)) {
    const p = S.perkOpts[+k - 1];
    if (p) choosePerk(p.id);
    return;
  }
  if (k === 'escape' || k === 'p') {
    if (document.body.classList.contains('dm-mode')) { leaveDM(); return; }
    if (modalOpen('mHow')) { closeHow(); return; }
    if (S.state === 'play') pauseGame();
    else if (S.state === 'paused' && modalOpen('mPause')) { hideModals(); resumeGame(); }
    return;
  }
  if (k === 'enter' && modalOpen('mStart')) { newGame(); return; }
  if (k === 'm') { toggleMute(); return; }
  if (S.state !== 'play' && S.state !== 'countdown') return;
  if (KEYMAP[k]) { setTool(KEYMAP[k]); e.preventDefault(); }
  else if (k === 'q' || k === 'arrowleft') cycleTool(-1);
  else if (k === 'e' || k === 'arrowright' || k === 'tab') { e.preventDefault(); cycleTool(1); }
});
window.addEventListener('pointerdown', () => Sfx.ensure(), { capture: true });
document.addEventListener('visibilitychange', () => { if (document.hidden && S.state === 'play') pauseGame(); });
window.addEventListener('resize', () => prune());

function toggleMute() {
  Sfx.toggle();
  syncMuteLabels();
  toast(Sfx.muted ? '🔇' : '🔊', Sfx.muted ? 'Sound off' : 'Sound on', '', '#5865F2', 1.1);
}
function syncMuteLabels() {
  $('#muteBtn').textContent = Sfx.muted ? '🔇' : '🔊';
  $('#pauseMute').textContent = 'Sound: ' + (Sfx.muted ? 'off' : 'on');
}
let howReturn = 'mStart';
function openHow(from) { howReturn = from; showModal('mHow'); }
function closeHow() { showModal(howReturn); }

$('#playBtn').addEventListener('click', newGame);
$('#howBtn').addEventListener('click', () => openHow('mStart'));
$('#howClose').addEventListener('click', closeHow);
$('#pauseBtn').addEventListener('click', () => { Sfx.ensure(); pauseGame(); });
$('#gearBtn').addEventListener('click', () => { if (isMobile()) closeDrawer(true); pauseGame(); });
$('#muteBtn').addEventListener('click', toggleMute);
$('#pauseMute').addEventListener('click', toggleMute);
$('#pauseHow').addEventListener('click', () => openHow('mPause'));
$('#resumeBtn').addEventListener('click', () => { hideModals(); resumeGame(); });
$('#quitBtn').addEventListener('click', toMenu);
$('#againBtn').addEventListener('click', newGame);
$('#menuBtn2').addEventListener('click', toMenu);
$('#copyBtn').addEventListener('click', copyScore);
$('#perkCards').addEventListener('click', e => { const c = e.target.closest('.perk-card'); if (c) choosePerk(c.dataset.id); });

// decorative buttons
$$('.rail .deco').forEach(b => b.addEventListener('click', () => toast('😤', 'acatto is busy', 'giving out AI in Fasfas AI rn', '#949ba4', 1.6)));
$$('.channels .deco').forEach(b => b.addEventListener('click', () => toast('🙅', 'no time', 'people in #general need AI', '#949ba4', 1.4)));
$('#chanGeneral').addEventListener('click', () => closeDrawer());

// tooltips (desktop)
const tipEl = $('#tooltip');
if (!isTouch) {
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-tip]');
    if (!t) { tipEl.classList.remove('show'); return; }
    tipEl.textContent = t.dataset.tip;
    const r = t.getBoundingClientRect();
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let x, y;
    if (t.closest('.rail')) { x = r.right + 12; y = r.top + r.height / 2 - h / 2; }
    else { x = r.left + r.width / 2 - w / 2; y = r.top - h - 8; }
    tipEl.style.left = clamp(x, 4, window.innerWidth - w - 4) + 'px';
    tipEl.style.top = clamp(y, 4, window.innerHeight - h - 4) + 'px';
    tipEl.classList.add('show');
  });
}

// mobile drawer
function openDrawer() {
  if (S.state === 'countdown') return;
  softPause('drawer');
  document.body.classList.add('drawer-open');
}
function closeDrawer(silent) {
  document.body.classList.remove('drawer-open');
  if (!silent && !document.body.classList.contains('dm-mode') && S.state === 'paused' && S.pausedBy === 'drawer') resumeGame();
}
$('#menuBtn').addEventListener('click', openDrawer);
$('#dmMenuBtn').addEventListener('click', openDrawer);
$('#scrim').addEventListener('click', () => closeDrawer());

// ---------------------------------------------------------
// acatto's DMs (easter egg)
// ---------------------------------------------------------
const DMS = {
  mochi: {
    name: 'mochi 🎀', user: 'm0chi.uwu', av: '🎀', bg: 'linear-gradient(135deg,#ff9ad5,#c58cff)', color: '#ff9ad5',
    status: 'off', sub: 'ty bestie 💖 sending them rn',
    banner: 'linear-gradient(135deg,#ff9ad5,#c58cff)',
    about: 'just a silly femboy :3 🎀<br>commissions open 💅<br>✨ no refunds ✨',
    since: 'yesterday',
    note: 'seems trustworthy :)',
    noteAfter: 'SCAMMED ME FOR $20 💀💀💀',
    history: [
      { day: 'Yesterday' },
      { from: 'u', text: 'hiii 👉👈', time: 'Yesterday at 11:02 PM' },
      { from: 'u', text: 'ur the acatto guy right?? the one with infinite ai' },
      { from: 'a', text: 'ye', time: 'Yesterday at 11:03 PM' },
      { from: 'u', text: 'omg thats so cool', time: 'Yesterday at 11:03 PM' },
      { from: 'u', text: 'sooo i sell pics :3' },
      { from: 'a', text: 'what kind of pics', time: 'Yesterday at 11:04 PM' },
      { from: 'u', text: 'feet pics 🦶✨', time: 'Yesterday at 11:04 PM' },
      { from: 'u', text: '$20 💅' },
      { from: 'a', text: '...', time: 'Yesterday at 11:51 PM' },
      { from: 'a', text: 'can i pay in free ai' },
      { from: 'u', text: 'no 🙄', time: 'Yesterday at 11:51 PM' },
      { from: 'u', text: '$20 or nothing bestie' },
      { from: 'a', text: 'ok fine', time: 'Yesterday at 11:52 PM' },
      { from: 'a', pay: true },
      { from: 'a', text: 'sent' },
      { from: 'u', text: 'ty bestie 💖 sending them rn', time: 'Yesterday at 11:52 PM' },
    ],
    live: [
      { day: 'Today' },
      { from: 'a', text: 'its been 6 hours', delay: 0.6 },
      { from: 'a', text: 'where pics', delay: 1.0 },
      { typing: 2.8 },
      { from: 'a', text: 'hello??', delay: 1.4 },
      { from: 'a', text: 'bro', delay: 0.9 },
      { from: 'a', text: 'i literally sent u $20', failed: true, delay: 1.2 },
      { sys: true, delay: 0.5 },
      { from: 'a', text: 'can i at least get a refund', failed: true, delay: 1.6 },
      { from: 'a', text: '😐', failed: true, delay: 1.3 },
    ],
  },
  mom: {
    name: 'mom', user: 'mom', av: '💐', bg: '#3ba55c', color: '#f2f3f5', status: 'idle', sub: 'who is m0chi',
    banner: 'linear-gradient(135deg,#3ba55c,#1abc9c)', about: 'proud mom ❤️<br>come eat', since: '2019', note: 'mom',
    history: [
      { day: 'Today' },
      { from: 'u', text: 'dinner is ready', time: 'Today at 6:30 PM' },
      { from: 'u', text: 'acatto' },
      { from: 'u', text: 'ACATTO' },
      { from: 'a', text: '5 min giving people ai', time: 'Today at 9:41 PM' },
      { from: 'u', text: 'you said that 3 hours ago', time: 'Today at 9:41 PM' },
      { from: 'u', text: 'also who is m0chi and why did you send them $20' },
      { from: 'a', text: 'nobody', time: 'Today at 9:42 PM' },
    ],
    live: [],
  },
  fasfas: {
    name: 'fasfas', user: 'fasfas', av: '👑', bg: '#5865f2', color: '#e91e63', status: 'on', sub: 'bro the server is lagging',
    banner: 'linear-gradient(135deg,#5865f2,#eb459e)', about: 'owner of Fasfas AI 👑<br>please stop giving out free ai', since: '2021', note: 'the boss',
    history: [
      { day: 'Today' },
      { from: 'u', text: 'acatto', time: 'Today at 2:12 PM' },
      { from: 'u', text: 'why is everyone in my server getting free ai' },
      { from: 'a', text: 'because i have infinite ai', time: 'Today at 2:13 PM' },
      { from: 'u', text: 'that is not how ai works', time: 'Today at 2:13 PM' },
      { from: 'a', text: 'it is now', time: 'Today at 2:13 PM' },
      { from: 'u', text: 'also there are like 3 feds in #general rn', time: 'Today at 2:14 PM' },
      { from: 'a', text: 'i ban them' },
      { from: 'u', text: 'ok W', time: 'Today at 2:14 PM' },
      { from: 'u', text: 'bro the server is lagging' },
    ],
    live: [],
  },
};
const ACATTO_DM = { name: 'acatto', color: '#f0b232' };
const dmList = $('#dmList');
const dmChat = $('#dmChat');
const dmInput = $('#dmInput');
const dmInputText = $('#dmInputText');
let dmCurrent = null;
let dmTimers = [];
let dmOpened = store.get('dmOpened', false);
let mochiDone = store.get('downbad', false);

function updateBadges() {
  $('#dmBadge').textContent = dmOpened ? '' : '1';
  $('#menuBadge').textContent = dmOpened ? '' : '1';
}
function renderDMList() {
  dmList.innerHTML = Object.entries(DMS).map(([k, d]) => {
    const unread = k === 'mochi' && !dmOpened;
    const sub = k === 'mochi' && mochiDone ? 'blocked you 💀' : d.sub;
    return `<button class="dm-item ${k === dmCurrent ? 'active' : ''}" data-dm="${k}">`
      + `<span class="dm-av" style="background:${d.bg}">${d.av}<span class="sd ${d.status}"></span></span>`
      + `<span class="dm-meta"><span class="dm-n">${esc(d.name)}</span><span class="dm-sub">${esc(sub)}</span></span>`
      + (unread ? '<span class="badge">1</span>' : '') + '</button>';
  }).join('');
}
dmList.addEventListener('click', e => { const b = e.target.closest('.dm-item'); if (b) openDM(b.dataset.dm); });

function renderProfile(k) {
  const d = DMS[k];
  const note = k === 'mochi' && mochiDone ? d.noteAfter : d.note;
  $('#dmProfile').innerHTML = `<div class="prof-banner" style="background:${d.banner}"></div>`
    + `<div class="prof-av" style="background:${d.bg}">${d.av}</div>`
    + `<div class="prof-body"><h3>${esc(d.name)}</h3><div class="u">${esc(d.user)}</div>`
    + `<div class="prof-sec"><div class="cat">ABOUT ME</div><p>${d.about}</p></div>`
    + `<div class="prof-sec"><div class="cat">MEMBER SINCE</div><p>${esc(d.since)}</p></div>`
    + (k === 'mochi' ? '<div class="prof-sec"><div class="cat">MUTUAL SERVERS</div><p>none 🙂</p></div>' : '')
    + `<div class="prof-sec"><div class="cat">NOTE (ONLY VISIBLE TO YOU)</div><p class="prof-note">${esc(note)}</p></div></div>`;
}
function dmStepHTML(d, s, ctx) {
  if (s.day) { ctx.last = null; return `<div class="day-sep">${esc(s.day)}</div>`; }
  if (s.sys) {
    ctx.last = null;
    return '<div class="sys-line"><span class="si">⚠️</span><div>Your message could not be delivered. This is usually because you don\'t share a server with the recipient or the recipient is only accepting direct messages from friends.<small>Only you can see this</small></div></div>';
  }
  const self = s.from === 'a';
  const cont = ctx.last === s.from && !s.time;
  ctx.last = s.from;
  const av = self ? `<div class="av"><img src="${AV_SRC}" alt=""></div>` : `<div class="av" style="background:${d.bg}">${d.av}</div>`;
  const name = self ? ACATTO_DM.name : d.name;
  const color = self ? ACATTO_DM.color : d.color;
  const pay = s.pay
    ? `<div class="pay-card"><div class="pay-top"><span class="pay-ico">💸</span><div><span>Payment sent</span><b>$20.00</b></div></div><div class="pay-bot">To: <b>${esc(d.user)}</b><br>Note: <b>"for the pics 🦶"</b><br>Status: <b>Completed ✓</b> · non-refundable</div></div>`
    : '';
  const text = s.text ? `<div class="text">${esc(s.text)}${s.failed ? '<i class="fail-ico">!</i>' : ''}</div>` : '';
  return `<div class="msg dm ${cont ? 'cont' : ''} ${s.failed ? 'failed' : ''}">${av}<div class="body"><div class="meta"><span class="name" style="color:${color}">${esc(name)}</span><span class="time">${esc(s.time || timeStr())}</span></div>${text}${pay}</div></div>`;
}
function dmAppend(html) {
  dmChat.insertAdjacentHTML('beforeend', html);
  dmChat.scrollTop = dmChat.scrollHeight;
}
function stopDM() {
  dmTimers.forEach(clearTimeout);
  dmTimers = [];
  const t = $('#dmTyping');
  if (t) t.remove();
}
function mochiFinished(live) {
  dmInput.classList.add('blocked');
  dmInputText.textContent = "You can't message m0chi.uwu anymore 💀";
  if (live && !mochiDone) {
    mochiDone = true;
    store.set('downbad', true);
    renderProfile('mochi');
    renderDMList();
    renderBest();
    Sfx.play('combo');
    toast('🏆', 'Achievement unlocked: Down Bad', 'paid $20, got 0 pics, got blocked', '#F0B232', 4);
  }
}
function openDM(k) {
  stopDM();
  dmCurrent = k;
  const d = DMS[k];
  if (k === 'mochi' && !dmOpened) { dmOpened = true; store.set('dmOpened', true); updateBadges(); }
  renderDMList();
  const head = $('#dmHeadAv');
  head.style.background = d.bg;
  head.textContent = d.av;
  $('#dmHeadName').textContent = d.name;
  renderProfile(k);
  dmInput.classList.remove('blocked');
  dmInputText.textContent = `Message @${d.user}`;
  dmChat.innerHTML = `<div class="dm-intro"><div class="big-av" style="background:${d.bg}">${d.av}</div><h2>${esc(d.name)}</h2><div class="u">${esc(d.user)}</div><p>This is the beginning of your direct message history with <b>${esc(d.name)}</b>.</p></div>`;
  const ctx = { last: null };
  d.history.forEach(s => dmAppend(dmStepHTML(d, s, ctx)));
  const live = k === 'mochi' && !mochiDone;
  if (!live) {
    d.live.forEach(s => dmAppend(dmStepHTML(d, s, ctx)));
    if (k === 'mochi') mochiFinished(false);
  } else {
    // play the tragic part in real time
    let t = 500;
    d.live.forEach(s => {
      if (s.typing) {
        dmTimers.push(setTimeout(() => {
          dmAppend(`<div class="dm-typing" id="dmTyping"><span class="dots"><i></i><i></i><i></i></span><b>${esc(d.name)}</b> is typing...</div>`);
        }, t));
        t += s.typing * 1000;
        dmTimers.push(setTimeout(() => { const el = $('#dmTyping'); if (el) el.remove(); }, t));
        return;
      }
      t += (s.delay || 0.9) * 1000;
      dmTimers.push(setTimeout(() => { dmAppend(dmStepHTML(d, s, ctx)); Sfx.play(s.sys ? 'bad' : 'msg'); }, t));
    });
    dmTimers.push(setTimeout(() => mochiFinished(true), t + 700));
  }
  if (isMobile()) closeDrawer(true);
}
function enterDM() {
  if (S.state === 'countdown') return;
  softPause('dm');
  document.body.classList.add('dm-mode');
  $('#homeBtn').classList.add('active');
  $('#serverBtn').classList.remove('active');
  renderDMList();
  if (!isMobile() && !dmCurrent) openDM('mochi');
}
function leaveDM() {
  stopDM();
  document.body.classList.remove('dm-mode', 'drawer-open');
  $('#homeBtn').classList.remove('active');
  $('#serverBtn').classList.add('active');
  dmCurrent = null;
  prune();
  if (S.state === 'paused' && !overlay.classList.contains('show')) resumeGame();
}
$('#homeBtn').addEventListener('click', () => { if (!document.body.classList.contains('dm-mode')) enterDM(); });
$('#serverBtn').addEventListener('click', () => {
  if (document.body.classList.contains('dm-mode')) leaveDM();
  else closeDrawer();
});
$('#backToServer').addEventListener('click', leaveDM);
$('#backToServer2').addEventListener('click', leaveDM);

// ---------------------------------------------------------
// main loop
// ---------------------------------------------------------
function update(dt) {
  S.time += dt;

  // timed effects
  for (const k in S.fx) {
    if (S.fx[k] > 0) {
      S.fx[k] -= dt;
      if (S.fx[k] <= 0) {
        S.fx[k] = 0;
        if (k === 'laptop') { document.body.classList.remove('boost'); toast('🪫', 'Laptop died', 'back to phone 📱', '#949ba4', 1.4); }
      }
    }
  }
  const slow = S.fx.slowmode > 0 ? 0.5 : 1;

  // scheduled events
  if (S.events.length) {
    const due = S.events.filter(e => e.at <= S.time);
    if (due.length) {
      S.events = S.events.filter(e => e.at > S.time);
      due.sort((a, b) => a.at - b.at).forEach(e => e.fn());
      if (S.state !== 'play') return;
    }
  }

  // wave clock
  S.waveLeft -= dt;
  if (S.waveLeft <= 0) { endWave(); return; }

  // spawning
  S.timers.req -= dt * slow;
  if (S.timers.req <= 0) {
    if (hasRoom()) { spawnRequest(); S.timers.req = D.reqInterval(S.wave) * rand(0.7, 1.3); }
    else S.timers.req = 0.3;
  }
  S.timers.chat -= dt;
  if (S.timers.chat <= 0) { spawnChatter(); S.timers.chat = rand(1.4, 3.2) / slow; }
  S.timers.drop -= dt;
  if (S.timers.drop <= 0) {
    if (hasRoom()) { spawnDrop(); S.timers.drop = rand(12, 17) * (S.perks.magnet ? 0.75 : 1); }
    else S.timers.drop = 1;
  }

  // everyone waiting on you
  for (const m of S.pending.slice()) {
    m.t -= dt * slow;
    const f = Math.max(0, m.t / m.max);
    if (m.bar) {
      m.bar.style.transform = `scaleX(${f.toFixed(3)})`;
      const cls = f < 0.25 ? 'low' : f < 0.5 ? 'mid' : '';
      if (cls !== m.barCls) {
        m.barCls = cls;
        m.bar.className = cls;
        if (m.kind === 'req' || m.kind === 'scam') m.el.classList.toggle('urgent', cls === 'low');
      }
    }
    if (m.t <= 0) expire(m);
  }

  // typing indicator + online count flavour
  S.timers.typing -= dt;
  if (S.timers.typing <= 0) { S.timers.typing = rand(2, 3.5); updateTyping(); }
}

function updateTyping() {
  const n = S.pending.length + randi(0, 2);
  const names = shuffle(recentNames.slice());
  const a = esc(names[0] || 'zyroo'), b = esc(names[1] || 'kxra');
  typingEl.classList.toggle('off', n <= 0);
  if (n === 1) typingText.innerHTML = `<b>${a}</b> is typing...`;
  else if (n === 2) typingText.innerHTML = `<b>${a}</b> and <b>${b}</b> are typing...`;
  else if (n <= 4) typingText.innerHTML = `<b>${a}</b>, <b>${b}</b>, and ${n - 2}${n - 2 === 1 ? ' other is' : ' others are'} typing...`;
  else typingText.textContent = 'Several people are typing...';
  const oc = $('#onlineCount');
  if (oc) oc.textContent = fmt(1337 + randi(-40, 60));
}

const H = {};
const effNodes = {};
function renderHUD() {
  const sc = fmt(S.score);
  if (H.sc !== sc) { H.sc = sc; scoreEl.textContent = sc; }

  const vp = Math.round(clamp(S.vibe / S.maxVibe, 0, 1) * 100);
  if (H.vp !== vp) { H.vp = vp; vibeFill.style.width = vp + '%'; vibeFill.className = vp < 30 ? 'low' : vp < 60 ? 'mid' : ''; }
  const vn = Math.ceil(S.vibe);
  if (H.vn !== vn) { H.vn = vn; vibeNum.textContent = vn; }

  const wl = S.wave ? `WAVE ${S.wave} · ${Math.max(0, Math.ceil(S.waveLeft))}s` : 'WAVE 1';
  if (H.wl !== wl) { H.wl = wl; waveLabel.textContent = wl; }
  const wp = S.wave ? (clamp(1 - S.waveLeft / S.waveLen, 0, 1) * 100).toFixed(1) : '0';
  if (H.wp !== wp) { H.wp = wp; waveFill.style.width = wp + '%'; }

  if (H.cb !== S.combo) {
    H.cb = S.combo;
    comboNum.textContent = S.combo;
    const cm = comboMult(S.combo);
    comboMultEl.textContent = '×' + cm;
    comboBox.classList.toggle('t2', cm === 1.5 || cm === 2);
    comboBox.classList.toggle('t3', cm === 3);
    comboBox.classList.toggle('t4', cm === 4);
  }

  const boost = S.fx.laptop > 0;
  if (H.boost !== boost) {
    H.boost = boost;
    devIcon.textContent = boost ? '💻' : '📱';
    upStatus.textContent = boost ? '💻 on laptop · BOOST' : '📱 on phone';
  }
  const p = S.state === 'play' && S.time < S.cdUntil ? ((S.cdUntil - S.time) / S.cdLen).toFixed(2) : '0';
  if (H.p !== p) { H.p = p; deviceEl.style.setProperty('--p', p); }

  const slow = S.fx.slowmode > 0;
  if (H.slow !== slow) { H.slow = slow; slowTag.classList.toggle('on', slow); }
  const router = S.fx.router > 0;
  if (H.router !== router) { H.router = router; $$('.tool:not(.ban)', toolsEl).forEach(b => b.classList.toggle('router', router)); }

  // effect pills
  const want = {};
  if (boost) want.laptop = ['💻', 'BOOST ×2', Math.ceil(S.fx.laptop) + 's', '#23A55A'];
  if (slow) want.slow = ['🐢', 'SLOWMODE', Math.ceil(S.fx.slowmode) + 's', '#F0B232'];
  if (router) want.router = ['🧠', 'AUTO-ROUTER', Math.ceil(S.fx.router) + 's', '#B47CFF'];
  if (S.shield > 0) want.shield = ['🛡️', 'SHIELD', '×' + S.shield, '#5865F2'];
  for (const k in effNodes) if (!want[k]) { effNodes[k].remove(); delete effNodes[k]; }
  for (const k in want) {
    const [ic, name, val, c] = want[k];
    let el = effNodes[k];
    if (!el) {
      el = document.createElement('div');
      el.className = 'eff';
      el.style.setProperty('--c', c);
      el.innerHTML = `${ic} <span class="et">${name}</span> <span class="tt"></span>`;
      effectsEl.appendChild(el);
      effNodes[k] = el;
    }
    const tt = el.lastElementChild;
    if (tt.textContent !== val) tt.textContent = val;
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (S.state === 'play') update(dt);
  renderHUD();
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------
// boot
// ---------------------------------------------------------
function buildMembers() {
  const used = new Set();
  let html = '';
  for (let i = 0; i < 16; i++) {
    const u = newUser();
    if (used.has(u.name)) continue;
    used.add(u.name);
    html += `<div class="member ${Math.random() < 0.75 ? 'on' : ''}"><span class="m-av" style="background:${u.bg}">${u.av}</span><span class="m-name" style="color:${u.color === '#f2f3f5' ? '' : u.color}">${esc(u.name)}</span></div>`;
  }
  $('#memberList').innerHTML = html;
}
function boot() {
  buildMembers();
  renderPerkList();
  renderBest();
  updateBadges();
  syncMuteLabels();
  setTool('code', true);
  // a little life in the chat behind the invite card
  for (let i = 0; i < 7; i++) spawnChatter();
  botSay('🤖 <b>acatto</b> is online. infinite AI available. form a line.');
  showModal('mStart');
  requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
}
boot();

})();
