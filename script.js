/* =============================================
   OUR GALAXY OF MEMORIES — Main Script
   Includes: Fairytale Synth (Web Audio API)
   ============================================= */

// ===== NOTE FREQUENCY MAP =====
const NOTES = {
    'C2':65.41,'D2':73.42,'E2':82.41,'F2':87.31,'G2':98.00,'A2':110.00,'B2':123.47,
    'C3':130.81,'D3':146.83,'E3':164.81,'F3':174.61,'G3':196.00,'A3':220.00,'B3':246.94,
    'C4':261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392.00,'A4':440.00,'B4':493.88,
    'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99,'A5':880.00,'B5':987.77,
    'C6':1046.50,'D6':1174.66,'E6':1318.51
};

// ===== FAIRYTALE SYNTHESIZER =====
// Generates a dreamy music-box fairytale melody using Web Audio API
// No external audio file needed
class FairytaleSynth {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.playing = false;
        this.muted = true;
        this.timeoutIds = [];
        this.loopTimeout = null;

        // Fairytale melody — dreamy, music-box style in C major
        this.melody = [
            // Phrase 1: Ascending dream (Once upon a time...)
            {n:'E5',d:0.38},{n:'G5',d:0.38},{n:'C6',d:0.55},{n:'B5',d:0.32},
            {n:'A5',d:0.38},{n:'G5',d:0.38},{n:'E5',d:0.55},{n:'D5',d:0.32},
            // Phrase 2: Gentle descent
            {n:'C5',d:0.38},{n:'E5',d:0.38},{n:'G5',d:0.55},{n:'A5',d:0.32},
            {n:'G5',d:0.38},{n:'E5',d:0.38},{n:'D5',d:0.55},{n:'C5',d:0.32},
            // Phrase 3: Emotional peak
            {n:'E5',d:0.30},{n:'G5',d:0.30},{n:'A5',d:0.30},{n:'B5',d:0.30},
            {n:'C6',d:0.65},{n:'A5',d:0.30},{n:'G5',d:0.38},{n:'E5',d:0.38},
            // Phrase 4: Tender resolution
            {n:'D5',d:0.42},{n:'C5',d:0.42},{n:'B4',d:0.35},{n:'C5',d:0.90},
            // Rest to breathe
            {n:null,d:0.5},{n:null,d:0.5},
            // Phrase 5: Second verse — warmth
            {n:'A4',d:0.35},{n:'C5',d:0.35},{n:'E5',d:0.55},{n:'D5',d:0.30},
            {n:'C5',d:0.38},{n:'A4',d:0.38},{n:'G4',d:0.55},{n:'A4',d:0.30},
            // Phrase 6: Rising hope
            {n:'C5',d:0.35},{n:'D5',d:0.35},{n:'E5',d:0.55},{n:'G5',d:0.30},
            {n:'A5',d:0.38},{n:'G5',d:0.38},{n:'E5',d:0.55},{n:'D5',d:0.30},
            // Phrase 7: Bridge — delicate
            {n:'F5',d:0.32},{n:'E5',d:0.32},{n:'D5',d:0.50},{n:'E5',d:0.30},
            {n:'G5',d:0.38},{n:'F5',d:0.38},{n:'E5',d:0.50},{n:'D5',d:0.30},
            // Phrase 8: Final resolution
            {n:'C5',d:0.42},{n:'E5',d:0.42},{n:'G5',d:0.42},{n:'C6',d:1.0},
            {n:null,d:0.6},{n:null,d:0.4},
        ];

        // Soft bass notes (one per phrase group)
        this.bass = [
            {n:'C3',d:3.0},{n:'G2',d:3.0},
            {n:'A2',d:2.2},{n:'E3',d:2.2},
            {n:'F2',d:2.2},{n:'C3',d:2.2},
            {n:'G2',d:2.2},{n:'C3',d:3.0},
        ];

        // Gentle arpeggio accompaniment
        this.arp = [
            {n:'C4',d:0.75},{n:'E4',d:0.75},{n:'G4',d:0.75},{n:'E4',d:0.75},
            {n:'G3',d:0.75},{n:'B3',d:0.75},{n:'D4',d:0.75},{n:'B3',d:0.75},
            {n:'A3',d:0.75},{n:'C4',d:0.75},{n:'E4',d:0.75},{n:'C4',d:0.75},
            {n:'F3',d:0.75},{n:'A3',d:0.75},{n:'C4',d:0.75},{n:'A3',d:0.75},
            {n:'G3',d:0.75},{n:'B3',d:0.75},{n:'D4',d:0.75},{n:'B3',d:0.75},
            {n:'C3',d:0.75},{n:'E3',d:0.75},{n:'G3',d:0.75},{n:'E3',d:0.75},
            {n:'C4',d:0.75},{n:'E4',d:0.75},{n:'G4',d:0.75},{n:'C5',d:1.5},
            {n:null,d:1.0},
        ];
    }

    _init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.35;

        // Soft delay for atmosphere
        this.delay = this.ctx.createDelay(1.0);
        this.delay.delayTime.value = 0.35;
        this.delayFeedback = this.ctx.createGain();
        this.delayFeedback.gain.value = 0.25;
        this.delayWet = this.ctx.createGain();
        this.delayWet.gain.value = 0.2;

        this.delay.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delay);
        this.delay.connect(this.delayWet);
        this.delayWet.connect(this.masterGain);

        // Dry path
        this.dryGain = this.ctx.createGain();
        this.dryGain.gain.value = 0.8;
        this.dryGain.connect(this.masterGain);

        this.masterGain.connect(this.ctx.destination);
    }

    // Play a single music-box note
    _playNote(freq, startTime, duration, volume, type) {
        if (!freq || !this.ctx) return;
        const t = startTime;

        // Fundamental
        const osc1 = this.ctx.createOscillator();
        osc1.type = type || 'sine';
        osc1.frequency.value = freq;

        // 2nd harmonic for warmth
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2;

        // 3rd harmonic — very subtle
        const osc3 = this.ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.value = freq * 3;

        const g1 = this.ctx.createGain();
        const g2 = this.ctx.createGain();
        const g3 = this.ctx.createGain();

        // ADSR envelope — music box: quick attack, fast decay, low sustain
        g1.gain.setValueAtTime(0, t);
        g1.gain.linearRampToValueAtTime(volume, t + 0.008);
        g1.gain.exponentialRampToValueAtTime(Math.max(volume * 0.3, 0.001), t + 0.15);
        g1.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.95);

        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(volume * 0.3, t + 0.005);
        g2.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.6);

        g3.gain.setValueAtTime(0, t);
        g3.gain.linearRampToValueAtTime(volume * 0.1, t + 0.003);
        g3.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.4);

        osc1.connect(g1); g1.connect(this.dryGain); g1.connect(this.delay);
        osc2.connect(g2); g2.connect(this.dryGain);
        osc3.connect(g3); g3.connect(this.dryGain);

        osc1.start(t); osc1.stop(t + duration);
        osc2.start(t); osc2.stop(t + duration);
        osc3.start(t); osc3.stop(t + duration);
    }

    // Schedule an entire sequence
    _scheduleSequence(seq, startTime, volume, type) {
        let t = startTime;
        for (const note of seq) {
            if (note.n && NOTES[note.n]) {
                this._playNote(NOTES[note.n], t, note.d * 1.1, volume, type);
            }
            t += note.d;
        }
        return t - startTime; // total duration
    }

    // Start the fairytale loop
    start() {
        if (this.playing) return;
        this._init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.playing = true;
        this.muted = false;
        this._scheduleLoop();
    }

    _scheduleLoop() {
        if (!this.playing) return;
        const now = this.ctx.currentTime + 0.05;

        // Schedule melody, bass, and arpeggio
        this._scheduleSequence(this.melody, now, 0.18, 'sine');
        this._scheduleSequence(this.bass, now, 0.08, 'triangle');
        this._scheduleSequence(this.arp, now, 0.04, 'sine');

        // Calculate total melody duration for loop timing
        let totalDur = 0;
        for (const n of this.melody) totalDur += n.d;

        // Schedule next loop
        this.loopTimeout = setTimeout(() => this._scheduleLoop(), totalDur * 1000 - 100);
    }

    stop() {
        this.playing = false;
        if (this.loopTimeout) clearTimeout(this.loopTimeout);
        if (this.ctx) {
            this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
            setTimeout(() => {
                if (this.masterGain) this.masterGain.gain.value = 0.35;
            }, 600);
        }
    }

    setMuted(m) {
        this.muted = m;
        if (!this.ctx) return;
        if (m) {
            this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        } else {
            this.masterGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.3);
        }
    }

    destroy() {
        this.stop();
        if (this.ctx) this.ctx.close();
        this.ctx = null;
    }
}

// ===== STATE =====
const state = {
    unlocked: JSON.parse(localStorage.getItem('galaxy_unlocked') || '[]'),
    currentPuzzle: -1,
    transitioning: false,
    musicMuted: localStorage.getItem('galaxy_muted') !== 'false' // default muted
};

const MEMORIES = [
    "Every beautiful story starts with a single moment. Ours started with you.",
    "Every smile of yours became one of my favorite memories.",
    "No matter where life takes us, my heart always finds its way back to you.",
    "You turned ordinary days into unforgettable memories.",
    "If I had to choose again, I would still choose you.",
    "You are my favorite place, my safest feeling, and my happiest adventure."
];

const PUZZLES = [
    { title: 'Complete the Constellation', instruction: 'Drag the star to its missing place in the constellation', init: initPuzzle1 },
    { title: 'Piece Together the Memory', instruction: 'Tap two pieces to swap them until the picture is complete', init: initPuzzle2 },
    { title: 'Remember the Sequence', instruction: 'Watch the stars light up, then repeat the sequence', init: initPuzzle3 },
    { title: 'Connect the Stars', instruction: 'Tap the stars in order: 1 → 2 → 3 → 4 → 5', init: initPuzzle4 },
    { title: 'Rotate to Reveal', instruction: 'Tap each piece to rotate it until the picture is whole', init: initPuzzle5 },
    { title: 'Find the Hidden Star', instruction: 'One star glows differently — find it', init: initPuzzle6 }
];

const STAR_POSITIONS = [
    { x: 15, y: 22 }, { x: 78, y: 15 }, { x: 52, y: 42 },
    { x: 20, y: 72 }, { x: 80, y: 65 }, { x: 46, y: 85 }
];

const $ = (id) => document.getElementById(id);
let puzzleCleanup = null;

// ===== STAR FIELD =====
class StarField {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        this.shootingStars = [];
        this.boosted = false;
        this.resize();
        this.initStars();
        this.animate();
        window.addEventListener('resize', () => { this.resize(); this.initStars(); });
    }
    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
    initStars() {
        const count = window.innerWidth < 768 ? 120 : 250;
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 1.8 + 0.4,
                phase: Math.random() * Math.PI * 2,
                speed: Math.random() * 1.5 + 0.5
            });
        }
    }
    boost() { this.boosted = true; }
    animate() {
        const { ctx, canvas } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const t = Date.now() * 0.001;
        const b = this.boosted ? 1.5 : 1;
        for (const s of this.stars) {
            const a = Math.min((0.25 + 0.75 * Math.abs(Math.sin(t * s.speed + s.phase))) * b, 1);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${a})`;
            ctx.fill();
        }
        if (Math.random() < (this.boosted ? 0.02 : 0.004)) {
            this.shootingStars.push({
                x: Math.random() * canvas.width * 0.8, y: Math.random() * canvas.height * 0.3,
                len: Math.random() * 80 + 40, speed: Math.random() * 6 + 4,
                angle: Math.PI / 4 + (Math.random() - 0.5) * 0.4, life: 1
            });
        }
        this.shootingStars = this.shootingStars.filter(s => s.life > 0);
        for (const s of this.shootingStars) {
            s.x += Math.cos(s.angle) * s.speed;
            s.y += Math.sin(s.angle) * s.speed;
            s.life -= 0.018;
            const ex = s.x - Math.cos(s.angle) * s.len;
            const ey = s.y - Math.sin(s.angle) * s.len;
            const grad = ctx.createLinearGradient(s.x, s.y, ex, ey);
            grad.addColorStop(0, `rgba(255,255,255,${s.life})`);
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(ex, ey);
            ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();
        }
        requestAnimationFrame(() => this.animate());
    }
}

// ===== CONFETTI =====
class ConfettiSystem {
    constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.running = false; this.particles = []; }
    launch(duration = 3000) {
        this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight;
        this.particles = []; this.running = true;
        const colors = ['#ffd700','#ff6b9d','#9c27b0','#ffffff','#ff69b4','#e6e6fa','#4fc3f7'];
        for (let i = 0; i < 150; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width, y: -Math.random() * this.canvas.height * 0.5 - 20,
                w: Math.random() * 10 + 4, h: Math.random() * 6 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 5, vy: Math.random() * 3 + 1.5,
                rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 12
            });
        }
        const start = Date.now();
        const loop = () => {
            if (!this.running) return;
            if (Date.now() - start > duration) { this.stop(); return; }
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const fade = Math.max(0, 1 - (Date.now() - start) / duration);
            for (const p of this.particles) {
                p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.rot += p.rotV; p.vx *= 0.99;
                this.ctx.save();
                this.ctx.translate(p.x, p.y); this.ctx.rotate(p.rot * Math.PI / 180);
                this.ctx.globalAlpha = fade; this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                this.ctx.restore();
            }
            requestAnimationFrame(loop);
        };
        loop();
    }
    stop() { this.running = false; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
}

// ===== FIREWORKS =====
class FireworksSystem {
    constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.running = false; this.particles = []; }
    launch(duration = 8000) {
        this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight;
        this.particles = []; this.running = true;
        const colors = ['#ffd700','#ff6b9d','#9c27b0','#4fc3f7','#ff69b4','#e6e6fa'];
        const start = Date.now(); let last = 0;
        const loop = () => {
            if (!this.running) return;
            if (Date.now() - start > duration) { this.stop(); return; }
            this.ctx.fillStyle = 'rgba(0,0,0,0.12)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            if (Date.now() - last > 400) {
                last = Date.now();
                const cx = Math.random() * this.canvas.width * 0.8 + this.canvas.width * 0.1;
                const cy = Math.random() * this.canvas.height * 0.4 + 40;
                const c = colors[Math.floor(Math.random() * colors.length)];
                for (let i = 0; i < 55; i++) {
                    const a = (Math.PI * 2 / 55) * i + Math.random() * 0.3;
                    const sp = Math.random() * 3.5 + 1;
                    this.particles.push({ x: cx, y: cy, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, size: Math.random()*2.5+0.8, color: c, life: 1 });
                }
            }
            this.particles = this.particles.filter(p => p.life > 0);
            for (const p of this.particles) {
                p.x += p.vx; p.y += p.vy; p.vy += 0.025; p.vx *= 0.99; p.vy *= 0.99; p.life -= 0.012;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, Math.max(0.1, p.size * p.life), 0, Math.PI * 2);
                this.ctx.fillStyle = p.color; this.ctx.globalAlpha = Math.max(0, p.life); this.ctx.fill(); this.ctx.globalAlpha = 1;
            }
            requestAnimationFrame(loop);
        };
        loop();
    }
    stop() { this.running = false; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
}

// ===== SCREENS =====
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
}

function createFloatingHearts(container, count = 25, interval = 180) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const h = document.createElement('div');
            h.className = 'floating-heart';
            h.textContent = ['❤','♥','💕','✨'][Math.floor(Math.random() * 4)];
            h.style.left = Math.random() * 100 + '%';
            h.style.animationDuration = (Math.random() * 4 + 4) + 's';
            h.style.fontSize = (Math.random() * 18 + 10) + 'px';
            container.appendChild(h);
            setTimeout(() => h.remove(), 9000);
        }, i * interval);
    }
}

// ===== LOADING =====
function initLoading() {
    const fill = document.querySelector('.loading-fill');
    let p = 0;
    const iv = setInterval(() => {
        p += Math.random() * 18 + 6;
        if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => showScreen('galaxyScreen'), 600); }
        fill.style.width = p + '%';
    }, 220);
}

// ===== MUSIC (Fairytale Synth) =====
let fairytale = null;
function initMusic() {
    fairytale = new FairytaleSynth();
    const btn = $('musicBtn');
    // Start muted by default
    btn.textContent = '🔇';
    btn.classList.remove('playing');

    btn.addEventListener('click', () => {
        if (fairytale.muted) {
            // Unmute
            fairytale.start();
            fairytale.setMuted(false);
            state.musicMuted = false;
            btn.textContent = '🎵';
            btn.classList.add('playing');
        } else {
            // Mute
            fairytale.setMuted(true);
            state.musicMuted = true;
            btn.textContent = '🔇';
            btn.classList.remove('playing');
        }
        localStorage.setItem('galaxy_muted', state.musicMuted);
    });
}

// ===== CURSOR GLOW =====
function initCursorGlow() {
    const glow = $('cursorGlow');
    if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768) { glow.style.display = 'none'; return; }
    document.addEventListener('mousemove', (e) => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });
}

// ===== GALAXY =====
function initGalaxy() {
    const container = $('starsContainer');
    STAR_POSITIONS.forEach((pos, i) => {
        const star = document.createElement('div');
        star.className = 'galaxy-star';
        star.style.left = pos.x + '%';
        star.style.top = pos.y + '%';
        star.style.animationDelay = `${i * 0.7}s, ${i * 0.9}s`;
        star.dataset.index = i;
        star.textContent = '★';
        star.setAttribute('role', 'button');
        star.setAttribute('tabindex', '0');
        star.setAttribute('aria-label', `Memory star ${i + 1}${state.unlocked.includes(i) ? ' (unlocked)' : ''}`);
        if (state.unlocked.includes(i)) star.classList.add('unlocked');
        star.addEventListener('click', () => handleStarClick(i));
        star.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStarClick(i); } });
        container.appendChild(star);
    });
    updateProgress();
}

function updateProgress() { $('progressCount').textContent = state.unlocked.length; }

function handleStarClick(index) {
    if (state.transitioning) return;
    if (state.unlocked.includes(index)) { showMemory(index); return; }
    openPuzzle(index);
}

// ===== PUZZLE MODAL =====
function openPuzzle(index) {
    state.currentPuzzle = index;
    state.transitioning = true;
    const cfg = PUZZLES[index];
    $('puzzleTitle').textContent = cfg.title;
    $('puzzleInstruction').textContent = cfg.instruction;
    $('puzzleArea').innerHTML = '';
    showScreen('puzzleModal');
    setTimeout(() => { cfg.init($('puzzleArea'), () => onPuzzleSolved(index)); state.transitioning = false; }, 350);
}

function closePuzzle() {
    if (puzzleCleanup) { puzzleCleanup(); puzzleCleanup = null; }
    $('puzzleModal').classList.remove('active');
    state.transitioning = false;
}

function onPuzzleSolved(index) {
    if (!state.unlocked.includes(index)) {
        state.unlocked.push(index);
        localStorage.setItem('galaxy_unlocked', JSON.stringify(state.unlocked));
    }
    const star = document.querySelector(`.galaxy-star[data-index="${index}"]`);
    if (star) star.classList.add('unlocked');
    updateProgress();
    closePuzzle();
    confetti.launch(3000);
    setTimeout(() => showMemory(index), 600);
}

// ===== MEMORY SCREEN =====
function showMemory(index) {
    $('memoryImage').src = `./assets/photo${index + 1}.jpg`;
    $('memoryImage').style.display = '';
    $('memoryImage').parentElement.classList.remove('img-fallback');
    $('memoryText').textContent = MEMORIES[index];
    $('heartsContainer').innerHTML = '';
    showScreen('memoryScreen');
    createFloatingHearts($('heartsContainer'));
    $('memoryNextBtn').textContent = state.unlocked.length >= 6 ? 'See Our Complete Galaxy ✨' : 'Continue ✨';
}

// ===== FINAL SCREEN =====
function showFinalScreen() {
    $('galaxyScreen').classList.add('complete');
    starField.boost();
    showScreen('galaxyScreen');
    confetti.launch(4000);
    setTimeout(() => {
        document.body.classList.add('final-active');
        showScreen('finalScreen');
        fireworks.launch(10000);
        confetti.launch(10000);
        createFloatingHearts($('finalHeartsContainer'), 40, 120);
        setTimeout(() => $('finalHeart').classList.add('visible'), 2500);
    }, 2000);
}

// ============================
// PUZZLE 1: Drag Star into Constellation
// ============================
function initPuzzle1(container, onSolve) {
    const W = container.clientWidth, H = container.clientHeight;
    container.style.position = 'relative';
    const pts = [{x:0.5,y:0.08},{x:0.15,y:0.4},{x:0.85,y:0.4},{x:0.28,y:0.78},{x:0.72,y:0.78}];
    const target = {x:0.5,y:0.48};
    const edges = [[0,1],[0,2],[1,3],[2,4],[1,5],[2,5],[3,5],[4,5]];
    const cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H;
    cvs.style.cssText = 'position:absolute;top:0;left:0;'; container.appendChild(cvs);
    const ctx = cvs.getContext('2d');
    function drawLines(a) {
        ctx.clearRect(0,0,W,H); ctx.strokeStyle=`rgba(255,215,0,${a})`; ctx.lineWidth=1;
        for(const[x,y] of edges){
            const pa=x===5?target:pts[x], pb=y===5?target:pts[y];
            ctx.beginPath(); ctx.moveTo(pa.x*W,pa.y*H); ctx.lineTo(pb.x*W,pb.y*H); ctx.stroke();
        }
    }
    drawLines(0.3);
    pts.forEach(p => { const el=document.createElement('div'); el.className='pz1-star'; el.style.left=(p.x*W)+'px'; el.style.top=(p.y*H)+'px'; el.textContent='★'; container.appendChild(el); });
    const tgt=document.createElement('div'); tgt.className='pz1-target'; tgt.style.left=(target.x*W)+'px'; tgt.style.top=(target.y*H)+'px'; container.appendChild(tgt);
    const drag=document.createElement('div'); drag.className='pz1-drag'; drag.textContent='★';
    const ox=W/2-12, oy=H-45; drag.style.left=ox+'px'; drag.style.top=oy+'px'; container.appendChild(drag);
    let dragging=false, dOffX=0, dOffY=0;
    function pp(e){const r=container.getBoundingClientRect();const t=e.touches?e.touches[0]:e;return{x:t.clientX-r.left,y:t.clientY-r.top};}
    function onD(e){e.preventDefault();dragging=true;drag.classList.add('dragging');const p=pp(e);dOffX=p.x-parseFloat(drag.style.left);dOffY=p.y-parseFloat(drag.style.top);}
    function onM(e){if(!dragging)return;e.preventDefault();const p=pp(e);drag.style.left=(p.x-dOffX)+'px';drag.style.top=(p.y-dOffY)+'px';}
    function onU(){if(!dragging)return;dragging=false;drag.classList.remove('dragging');
        const sx=parseFloat(drag.style.left),sy=parseFloat(drag.style.top),tx=target.x*W-12,ty=target.y*H-12;
        if(Math.hypot(sx-tx,sy-ty)<45){drag.style.left=tx+'px';drag.style.top=ty+'px';drag.style.pointerEvents='none';tgt.style.display='none';drawLines(0.7);setTimeout(onSolve,700);}
        else{drag.style.left=ox+'px';drag.style.top=oy+'px';}
    }
    drag.addEventListener('mousedown',onD);drag.addEventListener('touchstart',onD,{passive:false});
    document.addEventListener('mousemove',onM);document.addEventListener('touchmove',onM,{passive:false});
    document.addEventListener('mouseup',onU);document.addEventListener('touchend',onU);
    puzzleCleanup=()=>{document.removeEventListener('mousemove',onM);document.removeEventListener('touchmove',onM);document.removeEventListener('mouseup',onU);document.removeEventListener('touchend',onU);};
}

// ============================
// PUZZLE 2: Swap Pieces
// ============================
function initPuzzle2(container, onSolve) {
    let order=[0,1,2,3];
    do{for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}}while(order.every((v,i)=>v===i));
    const grid=document.createElement('div'); grid.className='pz2-grid';
    const bgP=['0% 0%','100% 0%','0% 100%','100% 100%'];
    const pieces=[];
    order.forEach((pi,si)=>{
        const el=document.createElement('div');el.className='pz2-piece';
        el.style.backgroundImage='url(./assets/photo2.jpg)';el.style.backgroundPosition=bgP[pi];
        el.dataset.piece=pi;el.setAttribute('role','button');el.setAttribute('tabindex','0');
        grid.appendChild(el);pieces.push(el);
    });
    container.appendChild(grid);
    let sel=null;
    function check(){let s=true;pieces.forEach((el,i)=>{if(parseInt(el.dataset.piece)===i)el.classList.add('correct');else{el.classList.remove('correct');s=false;}});if(s)setTimeout(onSolve,400);}
    function pick(el){
        if(!sel){sel=el;el.classList.add('selected');}
        else if(sel===el){sel.classList.remove('selected');sel=null;}
        else{const t=sel.style.backgroundPosition;const tp=sel.dataset.piece;sel.style.backgroundPosition=el.style.backgroundPosition;sel.dataset.piece=el.dataset.piece;el.style.backgroundPosition=t;el.dataset.piece=tp;sel.classList.remove('selected');sel=null;check();}
    }
    pieces.forEach(el=>{el.addEventListener('click',()=>pick(el));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(el);}});});
    puzzleCleanup=()=>{};
}

// ============================
// PUZZLE 3: Memory Sequence
// ============================
function initPuzzle3(container, onSolve) {
    const colors=['#ff6b9d','#ffd700','#4fc3f7','#9c27b0'];
    const syms=['♥','★','✦','◆'];
    const seq=[];for(let i=0;i<4;i++)seq.push(Math.floor(Math.random()*4));
    const row=document.createElement('div');row.className='pz3-row';const btns=[];
    colors.forEach((c,i)=>{
        const el=document.createElement('div');el.className='pz3-star';
        el.style.background='rgba(255,255,255,0.05)';el.style.color=c;el.textContent=syms[i];el.dataset.idx=i;
        el.setAttribute('role','button');el.setAttribute('tabindex','0');row.appendChild(el);btns.push(el);
    });
    container.appendChild(row);
    let playerSeq=[],accepting=false,showing=true;
    function flash(idx,dur=450){return new Promise(r=>{btns[idx].classList.add('flash');btns[idx].style.background=colors[idx];btns[idx].style.boxShadow=`0 0 25px ${colors[idx]}`;setTimeout(()=>{btns[idx].classList.remove('flash');btns[idx].style.background='rgba(255,255,255,0.05)';btns[idx].style.boxShadow='';setTimeout(r,200);},dur);});}
    async function showSeq(){showing=true;accepting=false;playerSeq=[];await new Promise(r=>setTimeout(r,600));for(const i of seq)await flash(i);showing=false;accepting=true;}
    function handleClick(idx){
        if(!accepting||showing)return;playerSeq.push(idx);flash(idx,250);
        if(playerSeq[playerSeq.length-1]!==seq[playerSeq.length-1]){accepting=false;btns[idx].style.color='#ff3333';setTimeout(()=>{btns[idx].style.color=colors[idx];},400);setTimeout(()=>showSeq(),800);return;}
        if(playerSeq.length===seq.length){accepting=false;setTimeout(onSolve,500);}
    }
    btns.forEach((el,i)=>{el.addEventListener('click',()=>handleClick(i));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handleClick(i);}});});
    showSeq();
    puzzleCleanup=()=>{accepting=false;};
}

// ============================
// PUZZLE 4: Connect Stars in Order
// ============================
function initPuzzle4(container, onSolve) {
    const W=container.clientWidth,H=container.clientHeight;container.style.position='relative';
    const pos=[{x:0.15,y:0.2},{x:0.82,y:0.15},{x:0.5,y:0.5},{x:0.2,y:0.8},{x:0.78,y:0.78}];
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
    container.appendChild(svg);
    const starEls=[];let connected=0;
    pos.forEach((p,i)=>{
        const el=document.createElement('div');el.className='pz4-star';el.style.left=(p.x*W)+'px';el.style.top=(p.y*H)+'px';
        el.innerHTML=`★<span class="pz4-num">${i+1}</span>`;el.dataset.idx=i;
        el.setAttribute('role','button');el.setAttribute('tabindex','0');container.appendChild(el);starEls.push(el);
    });
    function drawLine(f,t){const l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('x1',pos[f].x*W);l.setAttribute('y1',pos[f].y*H);l.setAttribute('x2',pos[t].x*W);l.setAttribute('y2',pos[t].y*H);l.setAttribute('stroke','rgba(255,215,0,0.5)');l.setAttribute('stroke-width','2');l.setAttribute('stroke-linecap','round');svg.appendChild(l);}
    function handleClick(idx){
        if(idx!==connected){starEls[idx].classList.add('wrong');setTimeout(()=>starEls[idx].classList.remove('wrong'),500);return;}
        starEls[idx].classList.add('connected');if(connected>0)drawLine(connected-1,idx);connected++;
        if(connected===5)setTimeout(onSolve,600);
    }
    starEls.forEach((el,i)=>{el.addEventListener('click',()=>handleClick(i));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handleClick(i);}});});
    puzzleCleanup=()=>{};
}

// ============================
// PUZZLE 5: Rotate Pieces
// ============================
function initPuzzle5(container, onSolve) {
    const rots=[0,90,180,270];let st;do{st=rots.map(()=>rots[Math.floor(Math.random()*4)]);}while(st.every(r=>r===0));
    const grid=document.createElement('div');grid.className='pz5-grid';
    const bgP=['0% 0%','100% 0%','0% 100%','100% 100%'];const pieces=[];
    st.forEach((r,i)=>{
        const el=document.createElement('div');el.className='pz5-piece';
        el.style.backgroundImage='url(./assets/photo5.jpg)';el.style.backgroundPosition=bgP[i];
        el.style.transform=`rotate(${r}deg)`;el.dataset.rot=r;el.dataset.idx=i;
        el.setAttribute('role','button');el.setAttribute('tabindex','0');grid.appendChild(el);pieces.push(el);
    });
    container.appendChild(grid);
    function check(){if(pieces.every(el=>parseInt(el.dataset.rot)%360===0))setTimeout(onSolve,500);}
    pieces.forEach(el=>{
        function rotate(){let r=(parseInt(el.dataset.rot)+90)%360;el.dataset.rot=r;el.style.transform=`rotate(${r}deg)`;check();}
        el.addEventListener('click',rotate);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();rotate();}});
    });
    puzzleCleanup=()=>{};
}

// ============================
// PUZZLE 6: Find Hidden Star
// ============================
function initPuzzle6(container, onSolve) {
    const total=16,hi=Math.floor(Math.random()*total);
    const grid=document.createElement('div');grid.className='pz6-grid';
    for(let i=0;i<total;i++){
        const el=document.createElement('div');el.className='pz6-star';el.textContent='★';
        if(i===hi)el.classList.add('hidden-star');
        el.setAttribute('role','button');el.setAttribute('tabindex','0');
        el.addEventListener('click',()=>{
            if(i===hi){el.style.color='#ffd700';el.style.textShadow='0 0 25px #ffd700, 0 0 50px rgba(255,215,0,0.5)';el.style.transform='scale(1.4)';setTimeout(onSolve,600);}
            else{el.classList.add('wrong-pick');el.style.animation='pz6-shake 0.4s ease';setTimeout(()=>{el.classList.remove('wrong-pick');el.style.animation='';},500);}
        });
        el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});
        grid.appendChild(el);
    }
    container.appendChild(grid);
    puzzleCleanup=()=>{};
}

// ===== INIT =====
let starField, confetti, fireworks;

document.addEventListener('DOMContentLoaded', () => {
    starField = new StarField($('starCanvas'));
    confetti = new ConfettiSystem($('confettiCanvas'));
    fireworks = new FireworksSystem($('fireworksCanvas'));
    initMusic();
    initCursorGlow();
    initLoading();
    initGalaxy();
    $('puzzleCloseBtn').addEventListener('click', closePuzzle);
    $('memoryNextBtn').addEventListener('click', () => {
        if (state.unlocked.length >= 6) showFinalScreen(); else showScreen('galaxyScreen');
    });
    $('memoryImage').addEventListener('error', function() { this.style.display='none'; this.parentElement.classList.add('img-fallback'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('puzzleModal').classList.contains('active')) closePuzzle(); });
});