/* ================================================================
   MEMORIES — Ultra-Premium Cinematic Interactive Script
   Features: Procedural Music Box, Canvas FX, 6 Puzzles, Parallax
   Fully offline · GitHub Pages compatible · localStorage
   ================================================================ */

// ===== CONFIGURATION =====
const PHOTO_URLS = [
    'assets/photo1.jpg', 'assets/photo2.jpg', 'assets/photo3.jpg',
    'assets/photo4.jpg', 'assets/photo5.jpg', 'assets/photo6.jpg'
];
const MESSAGES = [
    "Every beautiful story starts with a single moment.\nOurs started with you.",
    "Every smile of yours became one of my favorite memories.",
    "No matter where life takes us,\nmy heart always finds its way back to you.",
    "You turned ordinary days into unforgettable memories.",
    "If I had to choose again,\nI would still choose you.",
    "You are my favorite place,\nmy safest feeling,\nand my happiest adventure."
];
const PUZZLE_INFO = [
    { title: 'The Beginning',           inst: 'Drag the missing star into its correct place.' },
    { title: 'Our Puzzle',              inst: 'Tap two pieces to swap them and complete the image.' },
    { title: 'Galaxy Rhythm',           inst: 'Watch the sequence, then repeat it.' },
    { title: 'Constellation Journey',   inst: 'Connect the stars in order to draw the constellation.' },
    { title: 'Perfect Alignment',       inst: 'Tap pieces to rotate them until the image is correct.' },
    { title: 'The Final Star',          inst: 'Find the hidden glowing star inside the galaxy.' }
];

// ===== STATE =====
let progress = [false, false, false, false, false, false];
let puzzleCleanup = null;
let typewriterAbort = false;

// ===== DOM REFERENCES =====
const $ = id => document.getElementById(id);
const loadingScreen   = $('loading-screen'),   homeScreen   = $('home-screen');
const puzzleScreen    = $('puzzle-screen'),     revealScreen = $('reveal-screen');
const finalScreen     = $('final-screen');
const loadingFill     = $('loading-bar-fill'),  loadingTap   = $('loading-tap');
const starsGrid       = $('stars-grid'),        progressCount = $('progress-count');
const puzzleTitle     = $('puzzle-title'),      puzzleInstruction = $('puzzle-instruction');
const puzzleArea      = $('puzzle-area'),       puzzleBack   = $('puzzle-back');
const revealPhotoWrap = $('reveal-photo-wrap'), revealPhoto  = $('reveal-photo');
const revealText      = $('reveal-text'),       revealNextBtn = $('reveal-next-btn');
const finalHeart      = $('final-heart'),       finalText    = $('final-text');
const restartBtn      = $('restart-btn');
const cursorGlow      = $('cursor-glow'),       effectsContainer = $('effects-container');
const fireworksCanvas = $('fireworks-canvas'),  starCanvas   = $('star-canvas');
const musicBtn        = $('music-btn'),         musicIcon    = $('music-icon');

// ===== UTILITIES =====
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand  = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b + 1));

// ===== LOCAL STORAGE =====
function saveProgress() {
    try { localStorage.setItem('memories_v3', JSON.stringify(progress)); } catch (e) { /* silent */ }
}
function loadProgress() {
    try {
        const s = localStorage.getItem('memories_v3');
        if (s) progress = JSON.parse(s);
    } catch (e) { /* silent */ }
}

// ===== SCREEN MANAGEMENT =====
function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

/* ================================================================
   AUDIO SYSTEM — "Fairytale" Procedural Music Box
   Generates a romantic melody using Web Audio API oscillators.
   No external audio files needed.
   ================================================================ */
const AudioSystem = (function () {
    let ctx, masterGain, delayNode, delayFeedback, isPlaying = false, isMuted = true, loopId;

    /* Initialize audio context and routing */
    function init() {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0; // Start silent
        masterGain.connect(ctx.destination);

        // Simple feedback delay for spaciousness
        delayNode = ctx.createDelay();
        delayNode.delayTime.value = 0.35;
        delayFeedback = ctx.createGain();
        delayFeedback.gain.value = 0.18;
        const delayFilter = ctx.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.value = 1800;

        delayNode.connect(delayFilter);
        delayFilter.connect(delayFeedback);
        delayFeedback.connect(delayNode);
        delayNode.connect(masterGain);
    }

    /* Play a single music-box note with harmonics for timbre */
    function playMusicBoxNote(freq, time, dur) {
        if (!ctx) return;
        // Fundamental + 2nd + 3rd harmonics (music box character)
        const harmonics = [
            { mult: 1, vol: 0.20, type: 'sine' },
            { mult: 2, vol: 0.05, type: 'sine' },
            { mult: 3, vol: 0.015, type: 'sine' }
        ];
        harmonics.forEach(h => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = h.type;
            o.frequency.value = freq * h.mult;
            // Music box envelope: instant attack, quick exponential decay
            g.gain.setValueAtTime(0, time);
            g.gain.linearRampToValueAtTime(h.vol, time + 0.004);
            g.gain.exponentialRampToValueAtTime(Math.max(0.0001, h.vol * 0.08), time + dur * 0.6);
            g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
            o.connect(g);
            g.connect(masterGain);
            g.connect(delayNode); // Route through delay for spaciousness
            o.start(time);
            o.stop(time + dur + 0.05);
        });
    }

    /* Play a soft pad chord underneath the melody */
    function playPadChord(freqs, time, dur, vol) {
        if (!ctx) return;
        freqs.forEach(f => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'triangle';
            o.frequency.value = f;
            g.gain.setValueAtTime(0, time);
            g.gain.linearRampToValueAtTime(vol, time + 0.3);
            g.gain.setValueAtTime(vol, time + dur - 0.5);
            g.gain.linearRampToValueAtTime(0.0001, time + dur);
            o.connect(g);
            g.connect(masterGain);
            o.start(time);
            o.stop(time + dur + 0.1);
        });
    }

    /* Main loop — plays a 32-beat romantic melody then schedules next */
    function loop() {
        if (!isPlaying) return;
        const t = ctx.currentTime + 0.05;
        const b = 60 / 72; // 72 BPM — slow, romantic

        // --- Melody: [frequency, startBeat, durationBeats] ---
        const melody = [
            // Phrase A — Cmaj7 (bars 1-2)
            [659.25, 0,    0.9],   // E5
            [783.99, 1,    0.45],  // G5
            [1046.50, 1.5, 1.4],  // C6
            [987.77, 3,    0.9],   // B5
            // Am7 (bars 3-4)
            [440.00, 4,    0.9],   // A4
            [523.25, 5,    0.45],  // C5
            [659.25, 5.5,  1.4],  // E5
            [587.33, 7,    0.9],   // D5
            // Phrase B — Fmaj7 (bars 5-6)
            [523.25, 8,    0.9],   // C5
            [698.46, 9,    0.45],  // F5
            [880.00, 9.5,  1.4],  // A5
            [783.99, 11,   0.9],   // G5
            // G (bars 7-8)
            [587.33, 12,   0.9],   // D5
            [783.99, 13,   0.45],  // G5
            [987.77, 13.5, 1.4],   // B5
            [880.00, 15,   0.9],   // A5
            // Phrase C — Cmaj7 (bars 9-10)
            [659.25, 16,   1.3],   // E5
            [1046.50, 17.5, 0.45], // C6
            [783.99, 18,   0.9],   // G5
            [659.25, 19,   0.9],   // E5
            // Dm7 (bars 11-12)
            [587.33, 20,   0.9],   // D5
            [698.46, 21,   0.45],  // F5
            [880.00, 21.5, 1.4],   // A5
            [783.99, 23,   0.9],   // G5
            // G7 → C (bars 13-16)
            [493.88, 24,   0.45],  // B4
            [587.33, 24.5, 0.45],  // D5
            [783.99, 25,   1.4],   // G5
            [698.46, 26.5, 0.45],  // F5
            [659.25, 27,   0.9],   // E5
            [523.25, 28,   1.3],   // C5
            [659.25, 29.5, 0.45],  // E5
            [783.99, 30,   0.9],   // G5
            [1046.50, 31, 0.9],    // C6 (held)
        ];

        // Schedule every melody note
        melody.forEach(([freq, startBeat, durBeats]) => {
            playMusicBoxNote(freq, t + startBeat * b, durBeats * b);
        });

        // --- Pad chords: [frequencies, startBeat, durationBeats, volume] ---
        const chords = [
            [[130.81, 164.81, 196.00, 246.94], 0,  8, 0.045],  // Cmaj7
            [[110.00, 130.81, 164.81, 196.00], 8,  8, 0.04],   // Am7
            [[87.31,  110.00, 130.81, 164.81], 16, 8, 0.04],   // Fmaj7
            [[98.00,  123.47, 146.83, 174.61], 24, 4, 0.04],   // G
            [[130.81, 164.81, 196.00, 246.94], 28, 4, 0.045],  // Cmaj7
        ];
        chords.forEach(([freqs, start, dur, vol]) => {
            playPadChord(freqs, t + start * b, dur * b, vol);
        });

        // Schedule next loop slightly before current one ends
        const loopDurationMs = 32 * b * 1000;
        loopId = setTimeout(loop, loopDurationMs - 150);
    }

    return {
        start() {
            if (!ctx) init();
            if (ctx.state === 'suspended') ctx.resume();
            isPlaying = true;
            loop();
        },
        stop() {
            isPlaying = false;
            clearTimeout(loopId);
        },
        toggleMute() {
            isMuted = !isMuted;
            if (masterGain) {
                masterGain.gain.linearRampToValueAtTime(
                    isMuted ? 0 : 0.38,
                    ctx.currentTime + 0.3
                );
            }
            return isMuted;
        }
    };
})();

// Music button handler
musicBtn.addEventListener('click', e => {
    e.stopPropagation();
    const muted = AudioSystem.toggleMute();
    musicIcon.className = muted ? 'fas fa-volume-xmark' : 'fas fa-volume-high';
    musicBtn.classList.toggle('playing', !muted);
});


/* ================================================================
   VISUAL EFFECTS — Canvas Star Field, Parallax, Particles
   ================================================================ */

// --- Star Field (Canvas) ---
class StarField {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        this.shootingStars = [];
        this.intensified = false;
        this.resize();
        this.createStars(250);
        this.animate();
        window.addEventListener('resize', () => this.resize());
        // Spawn a shooting star every ~3.5 seconds
        setInterval(() => this.addShootingStar(), 3500);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createStars(count) {
        this.stars = [];
        const w = this.canvas.width, h = this.canvas.height;
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 1.5 + 0.3,
                o: Math.random() * 0.7 + 0.2,
                s: Math.random() * 0.02 + 0.005,   // Twinkle speed
                p: Math.random() * Math.PI * 2      // Phase offset
            });
        }
    }

    intensify() {
        this.intensified = true;
        this.createStars(1000);
    }

    addShootingStar() {
        this.shootingStars.push({
            x: rand(0, this.canvas.width * 0.7),
            y: rand(0, this.canvas.height * 0.3),
            len: rand(80, 140),
            speed: rand(8, 14),
            angle: Math.PI / 4 + rand(-0.2, 0.2),
            life: 1
        });
    }

    animate() {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        const t = Date.now() * 0.001;
        ctx.clearRect(0, 0, w, h);

        // Draw twinkling stars
        this.stars.forEach(s => {
            const alpha = s.o * (0.5 + 0.5 * Math.sin(t * s.s * 50 + s.p));
            ctx.beginPath();
            ctx.arc(s.x, s.y, Math.max(0.1, s.r), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.fill();
            // Subtle glow on brighter stars
            if (s.r > 1.2) {
                ctx.beginPath();
                ctx.arc(s.x, s.y, Math.max(0.1, s.r * 3), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${alpha * 0.08})`;
                ctx.fill();
            }
        });

        // Draw and update shooting stars
        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const ss = this.shootingStars[i];
            const dx = Math.cos(ss.angle) * ss.len;
            const dy = Math.sin(ss.angle) * ss.len;
            const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - dx, ss.y - dy);
            grad.addColorStop(0, `rgba(255,255,255,${ss.life})`);
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.beginPath();
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(ss.x - dx, ss.y - dy);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ss.x += Math.cos(ss.angle) * ss.speed;
            ss.y += Math.sin(ss.angle) * ss.speed;
            ss.life -= 0.015;
            if (ss.life <= 0) this.shootingStars.splice(i, 1);
        }

        requestAnimationFrame(() => this.animate());
    }
}

let starField;

// --- Cursor Glow & Mouse Parallax ---
function initCursorAndParallax() {
    const n1 = document.querySelector('.nebula-1');
    const n2 = document.querySelector('.nebula-2');
    document.addEventListener('mousemove', e => {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
        // Subtle parallax on nebula layers
        const xShift = (e.clientX - window.innerWidth / 2) * 0.02;
        const yShift = (e.clientY - window.innerHeight / 2) * 0.02;
        if (n1) n1.style.transform = `translate(${xShift}px, ${yShift}px)`;
        if (n2) n2.style.transform = `translate(${-xShift}px, ${-yShift}px)`;
    });
}

// --- Ambient Floating Hearts (spawned periodically) ---
function spawnFloatingHeart() {
    const h = document.createElement('div');
    h.className = 'floating-heart';
    h.innerHTML = ['❤', '💕', '✨', '💖'][randInt(0, 3)];
    h.style.left = rand(5, 95) + '%';
    h.style.fontSize = rand(12, 20) + 'px';
    h.style.animationDuration = rand(8, 15) + 's';
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 16000);
}
setInterval(spawnFloatingHeart, 2500);

// --- Heart Burst (explosion from a point) ---
function createHeartBurst(x, y, count) {
    count = count || 24;
    for (let i = 0; i < count; i++) {
        const h = document.createElement('div');
        h.className = 'heart-particle';
        h.innerHTML = ['❤', '💕', '💖', '💗'][randInt(0, 3)];
        h.style.left = x + 'px';
        h.style.top = y + 'px';
        const angle = (Math.PI * 2 * i) / count;
        const dist = rand(60, 180);
        h.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        h.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        h.style.setProperty('--rot', rand(-180, 180) + 'deg');
        effectsContainer.appendChild(h);
        setTimeout(() => h.remove(), 1300);
    }
}

// --- Confetti Shower ---
function createConfetti(count) {
    count = count || 60;
    const cols = ['#ff6b9d', '#ffd700', '#ff9a56', '#c084fc', '#4ade80', '#38bdf8'];
    for (let i = 0; i < count; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-piece';
        c.style.left = rand(0, 100) + '%';
        c.style.backgroundColor = cols[randInt(0, cols.length - 1)];
        c.style.width = rand(6, 10) + 'px';
        c.style.height = rand(6, 10) + 'px';
        c.style.borderRadius = rand(0, 1) ? '50%' : '2px';
        c.style.animationDelay = rand(0, 0.8) + 's';
        c.style.animationDuration = rand(2.5, 4.5) + 's';
        c.style.setProperty('--rot', rand(360, 1080) + 'deg');
        effectsContainer.appendChild(c);
        setTimeout(() => c.remove(), 5500);
    }
}

// --- Starburst Rays ---
function createStarburst(x, y) {
    for (let i = 0; i < 16; i++) {
        const r = document.createElement('div');
        r.className = 'starburst-ray';
        r.style.setProperty('--ray-angle', (360 / 16) * i + 'deg');
        r.style.left = x + 'px';
        r.style.top = y + 'px';
        effectsContainer.appendChild(r);
        setTimeout(() => r.remove(), 900);
    }
}

// --- Combined Celebration ---
function playCelebrationEffects() {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    createHeartBurst(cx, cy, 30);
    createConfetti(80);
    createStarburst(cx, cy);
}

// --- Achievement Popup ---
function showAchievement(text) {
    const pop = document.createElement('div');
    pop.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-20px);z-index:9999;' +
        'background:rgba(0,0,0,0.6);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);' +
        'border:1px solid rgba(255,215,0,0.3);padding:12px 28px;border-radius:50px;' +
        'color:#ffd700;font-family:"Playfair Display",serif;font-size:16px;' +
        'opacity:0;transition:all 0.5s cubic-bezier(0.16,1,0.3,1);' +
        'box-shadow:0 4px 20px rgba(255,215,0,0.15);pointer-events:none;white-space:nowrap;';
    pop.innerHTML = '\u2728 ' + text + ' Unlocked \u2728';
    document.body.appendChild(pop);
    requestAnimationFrame(() => {
        pop.style.opacity = '1';
        pop.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
        pop.style.opacity = '0';
        pop.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => pop.remove(), 500);
    }, 2500);
}


// ===== TYPEWRITER EFFECT =====
async function typewriter(element, text, speed) {
    speed = speed || 35;
    typewriterAbort = false;
    element.innerHTML = '<span class="cursor-blink"></span>';
    await sleep(400);
    const cursor = element.querySelector('.cursor-blink');
    for (let i = 0; i < text.length; i++) {
        if (typewriterAbort) break;
        const ch = text[i];
        if (ch === '\n') {
            element.insertBefore(document.createElement('br'), cursor);
            await sleep(300);
        } else if ('.!?'.includes(ch)) {
            element.insertBefore(document.createTextNode(ch), cursor);
            await sleep(speed * 6);
        } else if (',;:'.includes(ch)) {
            element.insertBefore(document.createTextNode(ch), cursor);
            await sleep(speed * 3);
        } else {
            element.insertBefore(document.createTextNode(ch), cursor);
            await sleep(speed);
        }
    }
    await sleep(500);
    if (cursor) cursor.remove();
}


// ===== LOADING SCREEN =====
async function runLoading() {
    const starsEl = $('loading-stars');
    // Create decorative loading stars
    for (let i = 0; i < 40; i++) {
        const d = document.createElement('div');
        d.className = 'loading-star-dot';
        d.style.left = rand(5, 95) + '%';
        d.style.top = rand(5, 95) + '%';
        d.style.animationDelay = rand(0, 2) + 's';
        d.style.animationDuration = rand(1.5, 3) + 's';
        starsEl.appendChild(d);
    }
    // Animate progress bar
    let val = 0;
    await new Promise(resolve => {
        const int = setInterval(() => {
            val += rand(1.5, 3.5);
            if (val >= 100) {
                val = 100;
                loadingFill.style.width = '100%';
                clearInterval(int);
                loadingTap.classList.add('visible');
                resolve();
            } else {
                loadingFill.style.width = val + '%';
            }
        }, 80);
    });
}


// ===== HOME SCREEN =====
function buildHomeScreen() {
    starsGrid.innerHTML = '';
    let done = 0;
    const labels = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    for (let i = 0; i < 6; i++) {
        const star = document.createElement('div');
        star.className = 'home-star';
        star.setAttribute('role', 'button');
        star.setAttribute('tabindex', '0');
        star.setAttribute('aria-label', 'Memory ' + labels[i]);

        if (progress[i]) {
            star.classList.add('completed');
            star.innerHTML = '\uD83C\uDF1F'; // 🌟
            done++;
        } else {
            const isOpen = (i === 0 || progress[i - 1]);
            if (!isOpen) star.classList.add('locked');
            star.innerHTML = '\u2B50'; // ⭐
        }

        const lbl = document.createElement('span');
        lbl.className = 'star-label';
        lbl.textContent = labels[i];
        star.appendChild(lbl);

        star.addEventListener('click', () => handleStarClick(i));
        star.addEventListener('keydown', e => { if (e.key === 'Enter') handleStarClick(i); });
        starsGrid.appendChild(star);
    }
    progressCount.textContent = done;
}

function handleStarClick(i) {
    const isOpen = (i === 0 || progress[i - 1]);
    if (!isOpen && !progress[i]) return;
    if (progress[i]) showReveal(i);
    else startPuzzle(i);
}


// ===== PUZZLE MANAGEMENT =====
function startPuzzle(i) {
    puzzleTitle.textContent = PUZZLE_INFO[i].title;
    puzzleInstruction.textContent = PUZZLE_INFO[i].inst;
    puzzleArea.innerHTML = '';
    const inits = [initP1, initP2, initP3, initP4, initP5, initP6];
    puzzleCleanup = inits[i](puzzleArea);
    showScreen(puzzleScreen);
}

puzzleBack.addEventListener('click', () => {
    if (puzzleCleanup) { puzzleCleanup(); puzzleCleanup = null; }
    showScreen(homeScreen);
});

async function completePuzzle(i) {
    progress[i] = true;
    saveProgress();
    showAchievement(PUZZLE_INFO[i].title);
    await sleep(800);
    playCelebrationEffects();
    await sleep(1000);
    showReveal(i);
}


// ===== REVEAL SCREEN =====
async function showReveal(i) {
    revealNextBtn.classList.remove('visible');
    revealPhotoWrap.classList.remove('visible');
    revealText.innerHTML = '';

    // Reset inline overrides from previous reveals
    revealPhotoWrap.style.padding = '';
    revealPhotoWrap.style.background = '';
    revealPhotoWrap.style.border = '';
    revealPhotoWrap.style.boxShadow = '';
    revealPhoto.style.objectFit = '';
    revealPhoto.style.aspectRatio = '';
    revealPhoto.style.maxHeight = '';
    revealPhoto.style.width = '';
    revealPhotoWrap.classList.remove('p6-special');

    revealPhoto.src = PHOTO_URLS[i];
    showScreen(revealScreen);

    // Puzzle 6: STRICT no-crop protection for the face
    if (i === 5) {
        revealPhotoWrap.classList.add('p6-special');
        // Absolute fallback inline styles as safety net
        revealPhotoWrap.style.padding = '10px';
        revealPhotoWrap.style.background = '#000';
        revealPhotoWrap.style.border = '2px solid rgba(255,215,0,0.5)';
        revealPhotoWrap.style.boxShadow = '0 0 40px rgba(255,107,157,0.4), 0 0 80px rgba(255,215,0,0.1)';
        revealPhoto.style.objectFit = 'contain';
        revealPhoto.style.aspectRatio = 'auto';
        revealPhoto.style.maxHeight = '65vh';
        revealPhoto.style.width = '100%';
    }

    await sleep(400);
    revealPhotoWrap.classList.add('visible');
    await sleep(600);
    await typewriter(revealText, MESSAGES[i], 34);

    await sleep(400);
    revealNextBtn.classList.add('visible');
    const allDone = progress.every(p => p);
    revealNextBtn.innerHTML = allDone
        ? 'See Our Universe <i class="fas fa-heart"></i>'
        : 'Continue <i class="fas fa-arrow-right"></i>';
}

revealNextBtn.addEventListener('click', () => {
    typewriterAbort = true;
    if (progress.every(p => p)) showFinalScene();
    else { buildHomeScreen(); showScreen(homeScreen); }
});


/* ================================================================
   PUZZLE IMPLEMENTATIONS
   ================================================================ */

// ---------- PUZZLE 1: Constellation Drag ----------
function initP1(area) {
    const c = document.createElement('div');
    c.className = 'p1-container';
    area.appendChild(c);

    // Star positions forming a pentagon constellation
    const pts = [
        { x: 150, y: 30 }, { x: 260, y: 100 }, { x: 220, y: 220 },
        { x: 80, y: 220 }, { x: 40, y: 100 }
    ];
    const miss = 2; // Index of missing star
    const conn = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]];
    const ns = 'http://www.w3.org/2000/svg';

    // SVG for connection lines
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '300');
    svg.setAttribute('height', '260');
    svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
    c.appendChild(svg);

    const lines = [];
    conn.forEach(([a, b]) => {
        const l = document.createElementNS(ns, 'line');
        l.setAttribute('x1', pts[a].x);
        l.setAttribute('y1', pts[a].y);
        l.setAttribute('x2', pts[b].x);
        l.setAttribute('y2', pts[b].y);
        const isDashed = a === miss || b === miss;
        l.setAttribute('stroke', isDashed ? 'rgba(255,215,0,0.15)' : 'rgba(255,215,0,0.3)');
        l.setAttribute('stroke-width', '1.5');
        if (isDashed) l.setAttribute('stroke-dasharray', '5,5');
        svg.appendChild(l);
        lines.push({ l, d: isDashed });
    });

    // Render fixed stars and the target placeholder
    pts.forEach((p, i) => {
        if (i === miss) {
            const t = document.createElement('div');
            t.className = 'star-target';
            t.style.left = p.x + 'px';
            t.style.top = p.y + 'px';
            c.appendChild(t);
        } else {
            const s = document.createElement('div');
            s.className = 'constellation-star';
            s.style.left = p.x + 'px';
            s.style.top = p.y + 'px';
            c.appendChild(s);
        }
    });

    // Draggable star (starts below constellation)
    const drag = document.createElement('div');
    drag.className = 'draggable-star';
    drag.style.left = '140px';
    drag.style.top = '270px';
    c.appendChild(drag);

    let dragging = false, ox = 0, oy = 0;

    const onMove = e => {
        if (!dragging) return;
        const r = c.getBoundingClientRect();
        drag.style.left = (e.clientX - r.left - ox) + 'px';
        drag.style.top = (e.clientY - r.top - oy) + 'px';
    };

    const onUp = () => {
        if (!dragging) return;
        dragging = false;
        const t = pts[miss];
        const dx = parseFloat(drag.style.left) - t.x;
        const dy = parseFloat(drag.style.top) - t.y;
        if (Math.sqrt(dx * dx + dy * dy) < 45) {
            drag.style.left = t.x + 'px';
            drag.style.top = t.y + 'px';
            drag.classList.add('snapped');
            // Solidify dashed lines
            lines.forEach(item => {
                if (item.d) {
                    item.l.setAttribute('stroke-dasharray', 'none');
                    item.l.setAttribute('stroke', 'rgba(255,215,0,0.3)');
                }
            });
            const tg = c.querySelector('.star-target');
            if (tg) tg.style.display = 'none';
            setTimeout(() => completePuzzle(0), 700);
        }
    };

    drag.addEventListener('pointerdown', e => {
        if (drag.classList.contains('snapped')) return;
        dragging = true;
        drag.setPointerCapture(e.pointerId);
        const r = drag.getBoundingClientRect();
        ox = e.clientX - r.left - r.width / 2;
        oy = e.clientY - r.top - r.height / 2;
    });
    drag.addEventListener('pointermove', onMove);
    drag.addEventListener('pointerup', onUp);
    drag.style.touchAction = 'none';

    return () => { dragging = false; };
}


// ---------- PUZZLE 2: Jigsaw Swap ----------
function initP2(area) {
    const g = document.createElement('div');
    g.className = 'jigsaw-grid';
    area.appendChild(g);

    const pos = [
        { bgX: '0%', bgY: '0%' }, { bgX: '100%', bgY: '0%' },
        { bgX: '0%', bgY: '100%' }, { bgX: '100%', bgY: '100%' }
    ];
    // Shuffle order, ensuring it's not already solved
    let ord = [0, 1, 2, 3];
    do {
        for (let i = 3; i > 0; i--) {
            const j = randInt(0, i);
            [ord[i], ord[j]] = [ord[j], ord[i]];
        }
    } while (ord.every((v, i) => v === i));

    const pcs = [];
    ord.forEach((pi, si) => {
        const p = document.createElement('div');
        p.className = 'jigsaw-piece';
        p.style.backgroundImage = 'url(' + PHOTO_URLS[1] + ')';
        p.style.backgroundPosition = pos[pi].bgX + ' ' + pos[pi].bgY;
        p.dataset.pi = pi;
        p.setAttribute('tabindex', '0');
        g.appendChild(p);
        pcs.push(p);
    });

    let sel = null;
    const click = p => {
        if (p.classList.contains('correct')) return;
        if (!sel) { sel = p; p.classList.add('selected'); }
        else if (sel === p) { sel.classList.remove('selected'); sel = null; }
        else {
            // Swap background positions and data
            const tBg = sel.style.backgroundPosition, tPi = sel.dataset.pi;
            sel.style.backgroundPosition = p.style.backgroundPosition;
            sel.dataset.pi = p.dataset.pi;
            p.style.backgroundPosition = tBg;
            p.dataset.pi = tPi;
            sel.classList.remove('selected');
            sel = null;
            // Check if solved
            let ok = true;
            pcs.forEach((pc, i) => {
                if (+pc.dataset.pi === i) pc.classList.add('correct');
                else { pc.classList.remove('correct'); ok = false; }
            });
            if (ok) setTimeout(() => completePuzzle(1), 600);
        }
    };
    pcs.forEach(p => {
        p.onclick = () => click(p);
        p.onkeydown = e => { if (e.key === 'Enter') click(p); };
    });
    return () => {};
}


// ---------- PUZZLE 3: Memory Sequence ----------
function initP3(area) {
    const w = document.createElement('div');
    w.style.textAlign = 'center';
    area.appendChild(w);

    const sc = document.createElement('div');
    sc.className = 'memory-stars';
    w.appendChild(sc);

    const st = document.createElement('div');
    st.className = 'memory-status';
    st.textContent = 'Watch carefully...';
    w.appendChild(st);

    const icons = ['\u2726', '\u2727', '\u27E1', '\u2736', '\u2734']; // ✦✧⟡✶✴
    const els = [];
    for (let i = 0; i < 5; i++) {
        const s = document.createElement('div');
        s.className = 'memory-star disabled';
        s.innerHTML = icons[i];
        s.dataset.i = i;
        s.setAttribute('tabindex', '0');
        sc.appendChild(s);
        els.push(s);
    }

    const seq = [2, 0, 4, 1]; // Sequence to memorize
    let inp = [], acc = false;

    const flash = (i, d) => {
        d = d || 500;
        return new Promise(r => {
            els[i].classList.add('flash');
            setTimeout(() => {
                els[i].classList.remove('flash');
                setTimeout(r, 200);
            }, d);
        });
    };

    async function play() {
        st.textContent = 'Watch carefully...';
        acc = false;
        els.forEach(e => e.classList.add('disabled'));
        await sleep(600);
        for (const i of seq) await flash(i);
        st.textContent = 'Your turn!';
        els.forEach(e => e.classList.remove('disabled'));
        inp = [];
        acc = true;
    }

    const click = i => {
        if (!acc) return;
        if (seq[inp.length] === i) {
            els[i].classList.add('flash');
            setTimeout(() => els[i].classList.remove('flash'), 400);
            inp.push(i);
            if (inp.length === seq.length) {
                acc = false;
                st.textContent = 'Perfect!';
                els.forEach(e => e.classList.add('disabled'));
                setTimeout(() => completePuzzle(2), 700);
            }
        } else {
            els[i].classList.add('wrong');
            setTimeout(() => els[i].classList.remove('wrong'), 500);
            st.textContent = 'Wrong! Watch again...';
            inp = [];
            acc = false;
            setTimeout(play, 1200);
        }
    };

    els.forEach(e => {
        e.onclick = () => click(+e.dataset.i);
        e.onkeydown = x => { if (x.key === 'Enter') click(+e.dataset.i); };
    });
    setTimeout(play, 500);
    return () => { acc = false; };
}


// ---------- PUZZLE 4: Connect Stars ----------
function initP4(area) {
    const c = document.createElement('div');
    c.className = 'p4-container';
    area.appendChild(c);

    // Hexagonal star pattern
    const pts = [
        { x: 150, y: 240 }, { x: 50, y: 130 }, { x: 60, y: 60 },
        { x: 150, y: 90 }, { x: 240, y: 60 }, { x: 250, y: 130 }
    ];
    const ord = [0, 1, 2, 3, 4, 5, 0]; // Order to connect (back to start)
    const ns = 'http://www.w3.org/2000/svg';

    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '300');
    svg.setAttribute('height', '280');
    svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
    c.appendChild(svg);

    const els = [], conn = [], lines = [];

    pts.forEach((p, i) => {
        const s = document.createElement('div');
        s.className = 'p4-star';
        s.style.left = p.x + 'px';
        s.style.top = p.y + 'px';
        s.dataset.i = i;
        s.setAttribute('tabindex', '0');
        c.appendChild(s);
        els.push(s);
    });

    const hint = document.createElement('div');
    hint.className = 'p4-hint';
    hint.textContent = 'Start from the bottom star';
    area.appendChild(hint);

    const drawLine = (a, b) => {
        const l = document.createElementNS(ns, 'line');
        l.setAttribute('x1', pts[a].x);
        l.setAttribute('y1', pts[a].y);
        l.setAttribute('x2', pts[b].x);
        l.setAttribute('y2', pts[b].y);
        l.setAttribute('stroke', 'rgba(255,215,0,0.6)');
        l.setAttribute('stroke-width', '2');
        l.setAttribute('stroke-linecap', 'round');
        svg.appendChild(l);
        return l;
    };

    const reset = () => {
        conn.length = 0;
        lines.forEach(l => l.remove());
        lines.length = 0;
        els.forEach(e => { e.classList.remove('connected', 'wrong'); });
    };

    const click = i => {
        if (i === ord[conn.length]) {
            if (conn.length > 0) lines.push(drawLine(conn[conn.length - 1], i));
            conn.push(i);
            els[i].classList.add('connected');
            if (conn.length === ord.length) setTimeout(() => completePuzzle(3), 600);
        } else {
            els[i].classList.add('wrong');
            setTimeout(() => els[i].classList.remove('wrong'), 500);
            reset();
        }
    };

    els.forEach(e => {
        e.onclick = () => click(+e.dataset.i);
        e.onkeydown = x => { if (x.key === 'Enter') click(+e.dataset.i); };
    });
    return () => { lines.forEach(l => l.remove()); };
}


// ---------- PUZZLE 5: Rotate Puzzle ----------
function initP5(area) {
    const g = document.createElement('div');
    g.className = 'rotate-grid';
    area.appendChild(g);

    const pos = [
        { bgX: '0%', bgY: '0%' }, { bgX: '100%', bgY: '0%' },
        { bgX: '0%', bgY: '100%' }, { bgX: '100%', bgY: '100%' }
    ];
    const pcs = [];
    // Random rotations (1, 2, or 3 quarter-turns — never 0)
    const rots = [randInt(1, 3), randInt(1, 3), randInt(1, 3), randInt(1, 3)];

    for (let i = 0; i < 4; i++) {
        const p = document.createElement('div');
        p.className = 'rotate-piece';
        p.style.backgroundImage = 'url(' + PHOTO_URLS[4] + ')';
        p.style.backgroundPosition = pos[i].bgX + ' ' + pos[i].bgY;
        p.style.transform = 'rotate(' + (rots[i] * 90) + 'deg)';
        p.dataset.r = rots[i];
        p.setAttribute('tabindex', '0');
        g.appendChild(p);
        pcs.push(p);
    }

    const click = p => {
        let r = (+p.dataset.r + 1) % 4;
        p.dataset.r = r;
        p.style.transform = 'rotate(' + (r * 90) + 'deg)';
        if (r === 0) p.classList.add('correct');
        else p.classList.remove('correct');
        if (pcs.every(pc => +pc.dataset.r === 0)) setTimeout(() => completePuzzle(4), 600);
    };

    pcs.forEach(p => {
        p.onclick = () => click(p);
        p.onkeydown = e => { if (e.key === 'Enter') click(p); };
    });
    return () => {};
}


// ---------- PUZZLE 6: Find Hidden Star ----------
function initP6(area) {
    const c = document.createElement('div');
    c.className = 'p6-container';
    area.appendChild(c);

    const st = document.createElement('div');
    st.className = 'p6-status';
    st.textContent = 'Look closely...';
    area.appendChild(st);

    const total = 50;
    const hid = randInt(0, total - 1); // Hidden star index
    let wrong = 0, found = false, els = [];

    for (let i = 0; i < total; i++) {
        const s = document.createElement('div');
        s.className = 'p6-star';
        let sz = (i === hid) ? 6 : rand(3, 8);
        s.style.width = sz + 'px';
        s.style.height = sz + 'px';
        s.style.left = rand(5, 95) + '%';
        s.style.top = rand(5, 95) + '%';
        s.style.opacity = rand(0.3, 0.9);
        if (i === hid) {
            s.classList.add('hidden-star');
            s.style.opacity = '0.4';
        }
        s.dataset.i = i;
        s.setAttribute('tabindex', '0');
        c.appendChild(s);
        els.push(s);
    }

    const click = i => {
        if (found) return;
        if (i === hid) {
            found = true;
            els[i].classList.add('found-star');
            st.textContent = 'You found it!';
            setTimeout(() => completePuzzle(5), 800);
        } else {
            wrong++;
            els[i].classList.add('wrong-click');
            setTimeout(() => els[i].classList.remove('wrong-click'), 400);
            if (wrong >= 4) {
                st.textContent = 'Hint: Look for the subtle pulse...';
                els[hid].classList.add('hint-active');
            } else {
                st.textContent = 'Not that one. (' + wrong + '/4)';
            }
        }
    };

    els.forEach(e => {
        e.onclick = () => click(+e.dataset.i);
        e.onkeydown = x => { if (x.key === 'Enter') click(+e.dataset.i); };
    });
    return () => { found = true; };
}


/* ================================================================
   FINAL SCENE — Fireworks, Constellation, Cinematic Message
   ================================================================ */
let fwRunning = false, fwList = [], fwCtx;

function startFireworks() {
    fwRunning = true;
    fwList = [];
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
    fwCtx = fireworksCanvas.getContext('2d');
    launchFirework();
    const int = setInterval(() => {
        if (!fwRunning) { clearInterval(int); return; }
        launchFirework();
    }, 900);
    animateFireworks();
}

function launchFirework() {
    const cols = [
        'rgba(255,107,157,1)', 'rgba(255,215,0,1)',
        'rgba(192,132,252,1)', 'rgba(74,222,128,1)', 'rgba(56,189,248,1)'
    ];
    const fw = {
        x: rand(fireworksCanvas.width * 0.1, fireworksCanvas.width * 0.9),
        y: rand(fireworksCanvas.height * 0.1, fireworksCanvas.height * 0.4),
        particles: [],
        color: cols[randInt(0, cols.length - 1)]
    };
    const pCount = randInt(40, 70);
    for (let i = 0; i < pCount; i++) {
        const angle = (Math.PI * 2 * i) / pCount + rand(-0.1, 0.1);
        const speed = rand(1.5, 5);
        fw.particles.push({
            x: fw.x, y: fw.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: rand(0.008, 0.018),
            size: rand(1.5, 3)
        });
    }
    fwList.push(fw);
}

function animateFireworks() {
    if (!fwRunning) {
        if (fwCtx) fwCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
        return;
    }
    fwCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

    for (let f = fwList.length - 1; f >= 0; f--) {
        const fw = fwList[f];
        for (let p = fw.particles.length - 1; p >= 0; p--) {
            const pt = fw.particles[p];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.vy += 0.04;   // Gravity
            pt.vx *= 0.99;    // Air resistance
            pt.life -= pt.decay;

            if (pt.life <= 0) { fw.particles.splice(p, 1); continue; }

            const al = Math.max(0, pt.life);
            // Core dot
            fwCtx.beginPath();
            fwCtx.arc(pt.x, pt.y, Math.max(0.5, pt.size * pt.life), 0, Math.PI * 2);
            fwCtx.fillStyle = fw.color.replace(',1)', ',' + al + ')');
            fwCtx.fill();
            // Glow
            fwCtx.beginPath();
            fwCtx.arc(pt.x, pt.y, Math.max(0.5, pt.size * 3 * pt.life), 0, Math.PI * 2);
            fwCtx.fillStyle = fw.color.replace(',1)', ',' + (al * 0.15) + ')');
            fwCtx.fill();
        }
        if (fw.particles.length === 0) fwList.splice(f, 1);
    }
    requestAnimationFrame(animateFireworks);
}


// ===== FINAL CINEMATIC SCENE =====
async function showFinalScene() {
    finalHeart.classList.remove('visible');
    finalText.innerHTML = '';
    restartBtn.classList.remove('visible');
    fireworksCanvas.classList.remove('active');
    showScreen(finalScreen);

    // Intensify the galaxy
    starField.intensify();

    // Start fireworks
    fireworksCanvas.classList.add('active');
    startFireworks();

    await sleep(800);
    finalHeart.classList.add('visible');
    await sleep(1500);
    createHeartBurst(window.innerWidth / 2, window.innerHeight / 2, 40);
    createConfetti(100);

    await sleep(800);

    // The final typewriter message
    const msg =
        'Congratulations \u2764\uFE0F\n\n' +
        'These six photos are only a tiny part of our story.\n\n' +
        'Every laugh,\nevery conversation,\nevery little moment with you\nhas become something I treasure.\n\n' +
        'Thank you for being the most beautiful chapter of my life.\n\n' +
        'No matter what tomorrow brings,\nI\'ll always be grateful\nthat our paths crossed.\n\n' +
        'You make my world brighter\nin ways you\'ll never truly know.\n\n' +
        'I love you more than words can ever explain.\n\n' +
        '\u2764\uFE0F Forever Yours,\nYour Beloved,\nPrit \u2764\uFE0F';

    await typewriter(finalText, msg, 30);
    await sleep(600);
    restartBtn.classList.add('visible');
}


// ===== RESTART LOGIC =====
restartBtn.addEventListener('click', () => {
    typewriterAbort = true;
    fwRunning = false;
    fireworksCanvas.classList.remove('active');
    fwList = [];

    // Reset only this website's progress
    progress = [false, false, false, false, false, false];
    saveProgress();

    starField.intensified = false;
    starField.createStars(250);

    showScreen(loadingScreen);
    loadingFill.style.width = '0%';
    loadingTap.classList.remove('visible');

    setTimeout(async () => {
        await runLoading();

        function enterSiteRestart() {
            loadingScreen.removeEventListener('click', enterSiteRestart);
            loadingScreen.removeEventListener('touchend', enterSiteRestart);
            buildHomeScreen();
            showScreen(homeScreen);
        }
        loadingScreen.addEventListener('click', enterSiteRestart);
        loadingScreen.addEventListener('touchend', enterSiteRestart);
    }, 300);
});

// Keep fireworks canvas sized correctly on resize
window.addEventListener('resize', () => {
    if (fwRunning) {
        fireworksCanvas.width = window.innerWidth;
        fireworksCanvas.height = window.innerHeight;
    }
});


// ===== INITIALIZATION =====
async function init() {
    loadProgress();
    starField = new StarField(starCanvas);
    initCursorAndParallax();

    await runLoading();

    // First interaction: unlock Web Audio, start music, enter home
    function enterSite() {
        loadingScreen.removeEventListener('click', enterSite);
        loadingScreen.removeEventListener('touchend', enterSite);

        // Start the procedural music and unmute
        AudioSystem.start();
        AudioSystem.toggleMute();
        musicIcon.className = 'fas fa-volume-high';
        musicBtn.classList.add('visible', 'playing');

        buildHomeScreen();
        showScreen(homeScreen);
    }

    loadingScreen.addEventListener('click', enterSite);
    loadingScreen.addEventListener('touchend', enterSite);
}

// Launch the application
init();
