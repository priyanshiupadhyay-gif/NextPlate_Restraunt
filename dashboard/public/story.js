/* ═══ STITCH AI NARRATION ═══ */
const STITCH_LINES = {
    ch0: "Hey. I'm Stitch. I'll walk you through this. Ready?",
    ch1: "This isn't a supply problem. The food exists. It just never reaches the people who need it. That's the gap we fix.",
    ch2: "Think of it as Uber Eats — but instead of ordering new food, you're rescuing food that would've been thrown away. At a fraction of the cost. Or free, if you're an NGO.",
    ch3: "The restaurant spends 60 seconds. An NGO volunteer spends 10 minutes. 30 people eat. That's the math we're proud of.",
    ch4: "These aren't estimates. Every number is calculated using WRAP methodology — the same standard used by the UK government for food waste reporting. We take this seriously.",
    ch5: "",
    ch6: "Thanks for reading. Now go eat something rescued. 🍛"
};

let currentChapter = null;
let typeTimer = null;
let bubbleOpen = false;

const stitchOrb = document.getElementById('stitch-orb');
const stitchBubble = document.getElementById('stitch-bubble');
const stitchText = document.getElementById('stitch-text');

function typewrite(text, el) {
    clearInterval(typeTimer);
    el.innerHTML = '';
    if (!text) { el.innerHTML = '<span style="opacity:.4;font-style:italic">…</span>'; return; }
    let i = 0;
    const cursor = '<span class="cursor"></span>';
    typeTimer = setInterval(() => {
        el.innerHTML = text.slice(0, i + 1) + cursor;
        i++;
        if (i >= text.length) { clearInterval(typeTimer); setTimeout(() => { el.innerHTML = text; }, 1500); }
    }, 35);
}

stitchOrb.addEventListener('click', () => {
    bubbleOpen = !bubbleOpen;
    stitchBubble.classList.toggle('open', bubbleOpen);
    if (bubbleOpen && currentChapter) typewrite(STITCH_LINES[currentChapter] || '', stitchText);
});

function triggerStitch(chId) {
    if (currentChapter === chId) return;
    currentChapter = chId;
    stitchOrb.classList.remove('stitch-bounce');
    void stitchOrb.offsetWidth;
    stitchOrb.classList.add('stitch-bounce');
    if (bubbleOpen) typewrite(STITCH_LINES[chId] || '', stitchText);
}

/* ═══ SCROLL PROGRESS ═══ */
const progressBar = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (window.scrollY / h * 100) + '%';
}, { passive: true });

/* ═══ INTERSECTION OBSERVER — CHAPTERS ═══ */
const chapters = document.querySelectorAll('.chapter');
const chapterObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            triggerStitch(e.target.id);
            // Sync body mood for nav styling
            document.body.dataset.mood = e.target.dataset.mood;
        }
    });
}, { threshold: 0.5 });
chapters.forEach(ch => chapterObs.observe(ch));

/* ═══ ANIM-IN (scroll reveal) ═══ */
const animEls = document.querySelectorAll('.anim-in');
const animObs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
        if (e.isIntersecting) {
            const idx = Array.from(e.target.parentElement.children).indexOf(e.target);
            setTimeout(() => e.target.classList.add('visible'), idx * 200);
            animObs.unobserve(e.target);
        }
    });
}, { threshold: 0.15 });
animEls.forEach(el => animObs.observe(el));

/* ═══ MANIFESTO LINES ═══ */
const mLines = document.querySelectorAll('.manifesto-line');
const mObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            const idx = Array.from(mLines).indexOf(e.target);
            setTimeout(() => e.target.classList.add('visible'), idx * 400);
            mObs.unobserve(e.target);
        }
    });
}, { threshold: 0.2 });
mLines.forEach(l => mObs.observe(l));

/* ═══ COUNTER ANIMATION ═══ */
function animateCounter(el) {
    const tgt = parseInt(el.dataset.target);
    if (el.querySelector('.counter-static')) return;
    const numEl = el.querySelector('.counter-num');
    const dur = 2000;
    const start = performance.now();
    function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        numEl.textContent = Math.floor(tgt * ease).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}
const counterCards = document.querySelectorAll('.counter-card');
const cObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); cObs.unobserve(e.target); } });
}, { threshold: 0.4 });
counterCards.forEach(c => cObs.observe(c));

/* ═══ IMPACT NUMBERS ═══ */
function animateImpact(el) {
    const tgt = parseInt(el.dataset.target);
    const numEl = el;
    const dur = 2500;
    const start = performance.now();
    function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        numEl.textContent = Math.floor(tgt * ease).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}
const impactVals = document.querySelectorAll('.impact-val');
const iObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { animateImpact(e.target); iObs.unobserve(e.target); } });
}, { threshold: 0.3 });
impactVals.forEach(v => iObs.observe(v));

/* ═══ FLOATING FOOD EMOJIS ═══ */
const foodEmojis = ['🍛', '🥗', '🍞', '🥘', '🍲', '🥙', '🍜', '🧆', '🥯', '🍱'];
const emojiContainer = document.getElementById('food-emojis');
function spawnEmoji() {
    const el = document.createElement('div');
    el.className = 'food-emoji';
    el.textContent = foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
    el.style.left = Math.random() * 100 + '%';
    el.style.animationDuration = (8 + Math.random() * 12) + 's';
    el.style.animationDelay = Math.random() * 2 + 's';
    emojiContainer.appendChild(el);
    setTimeout(() => el.remove(), 22000);
}
for (let i = 0; i < 12; i++) setTimeout(spawnEmoji, i * 800);
setInterval(spawnEmoji, 2500);

/* ═══ MANIFESTO BG FOOD (parallax) ═══ */
const mbg = document.getElementById('manifesto-bg-food');
const bgFoods = ['🍛', '🥗', '🍞', '🥘', '🍲', '🧆'];
for (let i = 0; i < 15; i++) {
    const s = document.createElement('div');
    s.textContent = bgFoods[i % bgFoods.length];
    s.style.cssText = `position:absolute;font-size:${2 + Math.random() * 3}rem;left:${Math.random() * 100}%;top:${Math.random() * 100}%;transform:rotate(${Math.random() * 60 - 30}deg)`;
    mbg.appendChild(s);
}
window.addEventListener('scroll', () => {
    const ch5 = document.getElementById('ch5');
    const rect = ch5.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
        const off = (window.innerHeight - rect.top) * 0.08;
        mbg.style.transform = `translateY(${off}px)`;
    }
}, { passive: true });

/* ═══ MESH NETWORK CANVAS ═══ */
const canvas = document.getElementById('mesh-canvas');
const ctx = canvas.getContext('2d');
let meshActive = false;
const nodes = [];
const edges = [];

function initMesh() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    nodes.length = 0;
    edges.length = 0;
    const w = rect.width, h = rect.height;
    const count = Math.min(Math.floor(w / 40), 30);
    for (let i = 0; i < count; i++) {
        nodes.push({
            x: 40 + Math.random() * (w - 80),
            y: 20 + Math.random() * (h - 40),
            r: 3 + Math.random() * 4,
            type: i < count * 0.4 ? 'restaurant' : i < count * 0.7 ? 'ngo' : 'customer',
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3
        });
    }
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
            if (Math.sqrt(dx * dx + dy * dy) < 140) {
                edges.push({ a: i, b: j, pulse: Math.random() * Math.PI * 2 });
            }
        }
    }
}

function drawMesh() {
    if (!meshActive) return;
    const w = canvas.getBoundingClientRect().width, h = canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, w, h);
    const t = performance.now() / 1000;
    // Edges
    edges.forEach(e => {
        const a = nodes[e.a], b = nodes[e.b];
        const pulse = (Math.sin(t * 1.5 + e.pulse) + 1) / 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(45,155,90,${0.08 + pulse * 0.18})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        // Pulse dot
        if (pulse > 0.7) {
            const px = a.x + (b.x - a.x) * ((t * 0.3 + e.pulse) % 1);
            const py = a.y + (b.y - a.y) * ((t * 0.3 + e.pulse) % 1);
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,107,43,${pulse})`;
            ctx.fill();
        }
    });
    // Nodes
    nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 10 || n.x > w - 10) n.vx *= -1;
        if (n.y < 10 || n.y > h - 10) n.vy *= -1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        const col = n.type === 'restaurant' ? 'rgba(255,107,43,0.8)' : n.type === 'ngo' ? 'rgba(45,155,90,0.8)' : 'rgba(244,200,66,0.7)';
        ctx.fillStyle = col;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 4, 0, Math.PI * 2);
        ctx.fillStyle = col.replace(/[\d.]+\)$/, '0.15)');
        ctx.fill();
    });
    requestAnimationFrame(drawMesh);
}

const meshObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting && !meshActive) { meshActive = true; initMesh(); drawMesh(); }
        else if (!e.isIntersecting) meshActive = false;
    });
}, { threshold: 0.2 });
meshObs.observe(canvas);
window.addEventListener('resize', () => { if (meshActive) initMesh(); });

/* ═══ AUTO-OPEN STITCH on first chapter ═══ */
setTimeout(() => {
    bubbleOpen = true;
    stitchBubble.classList.add('open');
    triggerStitch('ch0');
    typewrite(STITCH_LINES.ch0, stitchText);
}, 1500);
