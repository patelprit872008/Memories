/* ================================================================
   MEMORIES — Main Script
   
   NO MP3 NEEDED! 
   This file contains a beautiful procedural "Fairytale" melody
   generated using the Web Audio API. Just add your photos!
   ================================================================ */

// ===== PHOTO URLS (Your local photos) =====
var PHOTO_URLS = [
    'assets/photo1.jpg',
    'assets/photo2.jpg',
    'assets/photo3.jpg',
    'assets/photo4.jpg',
    'assets/photo5.jpg',
    'assets/photo6.jpg'
];

// ===== MESSAGES FOR EACH PUZZLE =====
var MESSAGES = [
    "Every beautiful story starts with a single moment.\nOurs started with you.",
    "Every smile of yours became one of my favorite memories.",
    "No matter where life takes us,\nmy heart always finds its way back to you.",
    "You turned ordinary days into unforgettable memories.",
    "If I had to choose again,\nI would still choose you.",
    "You are my favorite place,\nmy safest feeling,\nand my happiest adventure."
];

// ===== PUZZLE TITLES AND INSTRUCTIONS =====
var PUZZLE_INFO = [
    { title: 'Constellation Puzzle', instruction: 'Drag the star to complete the constellation' },
    { title: 'Jigsaw Puzzle', instruction: 'Tap two pieces to swap them and complete the image' },
    { title: 'Memory Sequence', instruction: 'Watch the stars glow, then repeat the sequence' },
    { title: 'Connect the Stars', instruction: 'Click the stars in order to draw a constellation' },
    { title: 'Rotate Puzzle', instruction: 'Tap each piece to rotate it until the image is complete' },
    { title: 'Find the Hidden Star', instruction: 'One star is different. Find it.' }
];

var STAR_LABELS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

// ===== APP STATE =====
var progress = [false, false, false, false, false, false];
var currentPuzzle = -1;
var puzzleCleanup = null;
var typewriterAbort = false;

// ===== DOM REFERENCES =====
function $(id) { return document.getElementById(id); }
var loadingScreen = $('loading-screen');
var homeScreen = $('home-screen');
var puzzleScreen = $('puzzle-screen');
var revealScreen = $('reveal-screen');
var finalScreen = $('final-screen');
var loadingFill = $('loading-bar-fill');
var loadingTap = $('loading-tap');
var starsGrid = $('stars-grid');
var progressCount = $('progress-count');
var puzzleTitle = $('puzzle-title');
var puzzleInstruction = $('puzzle-instruction');
var puzzleArea = $('puzzle-area');
var puzzleBack = $('puzzle-back');
var revealPhotoWrap = $('reveal-photo-wrap');
var revealPhoto = $('reveal-photo');
var revealText = $('reveal-text');
var revealNextBtn = $('reveal-next-btn');
var finalHeart = $('final-heart');
var finalText = $('final-text');
var restartBtn = $('restart-btn');
var cursorGlow = $('cursor-glow');
var effectsContainer = $('effects-container');
var fireworksCanvas = $('fireworks-canvas');
var starCanvas = $('star-canvas');
var musicBtn = $('music-btn');
var musicIcon = $('music-icon');

// ===== UTILITY FUNCTIONS =====
function sleep(ms) { return new Promise(function(resolve) { setTimeout(resolve, ms); }); }
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

// ===== LOCAL STORAGE =====
function saveProgress() {
    try { localStorage.setItem('memories_progress', JSON.stringify(progress)); } catch(e) {}
}
function loadProgress() {
    try {
        var saved = localStorage.getItem('memories_progress');
        if (saved) {
            var parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length === 6) progress = parsed;
        }
    } catch(e) {}
}

// ===== SCREEN MANAGEMENT =====
function showScreen(screen) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
        screens[i].classList.remove('active');
    }
    screen.classList.add('active');
}

/* ================================================================
   FAIRYTALE MUSIC GENERATOR (Web Audio API)
   A soft, romantic, music-box style melody
   ================================================================ */
var FairytaleMusic = (function() {
    function FM() {
        this.audioCtx = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.loopTimeout = null;
    }

    FM.prototype.init = function() {
        // Initialize Audio Context (Requires user interaction first)
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0.3; // Keep it soft and romantic
        this.masterGain.connect(this.audioCtx.destination);
    };

    // Play a single crystalline note
    FM.prototype.playNote = function(freq, startTime, duration, type) {
        if (!this.audioCtx || this.isMuted) return;

        var osc = this.audioCtx.createOscillator();
        var gainNode = this.audioCtx.createGain();
        
        // Use sine or triangle for a soft music box feel
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        // Quick attack, long decay
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.02); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration);
    };

    // Play a soft chord
    FM.prototype.playChord = function(freqs, startTime, duration) {
        for (var i = 0; i < freqs.length; i++) {
            this.playNote(freqs[i], startTime, duration, 'triangle');
        }
    };

    // The Fairytale Melody Sequence
    FM.prototype.playMelody = function() {
        if (!this.isPlaying) return;
        var now = this.audioCtx.currentTime + 0.1;
        var bpm = 100;
        var beat = 60 / bpm;

        // A beautiful, ethereal romantic progression (Cmaj7 -> Am -> Fmaj7 -> G)
        // Using high octave frequencies for a "music box" timbre
        
        // Bar 1: Cmaj7 sparkle
        this.playNote(523.25, now, beat * 2); // C5
        this.playNote(659.25, now + beat * 0.5, beat * 1.5); // E5
        this.playChord([523.25, 659.25, 783.99], now, beat * 3); // Underlying chord

        // Bar 2: Am dreaminess
        this.playNote(783.99, now + beat * 2, beat * 2); // G5
        this.playNote(659.25, now + beat * 3, beat); // E5
        this.playChord([440.00, 523.25, 659.25], now + beat * 2, beat * 2); // Am chord

        // Bar 3: Fmaj7 lift
        this.playNote(698.46, now + beat * 4, beat * 2); // F5
        this.playNote(523.25, now + beat * 5, beat); // C5
        this.playChord([349.23, 440.00, 523.25], now + beat * 4, beat * 2); // Fmaj7 chord

        // Bar 4: G resolution
        this.playNote(783.99, now + beat * 6, beat); // G5
        this.playNote(659.25, now + beat * 7, beat); // E5
        this.playChord([392.00, 493.88, 587.33], now + beat * 6, beat * 2); // G chord

        // Bar 5: High octave sparkle (C)
        this.playNote(1046.50, now + beat * 8, beat * 1.5); // C6
        this.playNote(783.99, now + beat * 9, beat * 0.5); // G5
        this.playNote(659.25, now + beat * 9.5, beat * 0.5); // E5

        // Bar 6: Descending dream (Am)
        this.playNote(880.00, now + beat * 10, beat); // A5
        this.playNote(783.99, now + beat * 11, beat); // G5

        // Bar 7: Gentle landing (F)
        this.playNote(698.46, now + beat * 12, beat * 2); // F5

        // Bar 8: Final soft resolve (G to C)
        this.playNote(587.33, now + beat * 14, beat); // D5
        this.playNote(523.25, now + beat * 15, beat); // C5
        this.playChord([261.63, 329.63, 392.00], now + beat * 14, beat * 2); // Cmaj underlying

        // Loop the melody seamlessly
        var self = this;
        this.loopTimeout = setTimeout(function() {
            self.playMelody();
        }, (beat * 16) * 1000);
    };

    FM.prototype.start = function() {
        if (!this.audioCtx) this.init();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        this.isPlaying = true;
        this.playMelody();
    };

    FM.prototype.stop = function() {
        this.isPlaying = false;
        if (this.loopTimeout) clearTimeout(this.loopTimeout);
    };

    FM.prototype.toggleMute = function() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.3;
        }
        return this.isMuted;
    };

    return FM;
})();

var fairytaleMusic = new FairytaleMusic();

// Music button click handler
musicBtn.addEventListener('click', function(e) {
    e.stopPropagation(); // Prevent triggering loading screen click
    var isMuted = fairytaleMusic.toggleMute();
    if (isMuted) {
        musicIcon.className = 'fas fa-volume-xmark';
        musicBtn.classList.remove('playing');
    } else {
        musicIcon.className = 'fas fa-volume-high';
        musicBtn.classList.add('playing');
    }
});


// ===== STAR FIELD (Canvas Rendering) =====
var StarField = (function() {
    function SF(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        this.shootingStars = [];
        this.intensified = false;
        this.resize();
        this.createStars(200);
        this.animate();
        var self = this;
        window.addEventListener('resize', function() { self.resize(); });
        setInterval(function() { self.addShootingStar(); }, 4000);
        setTimeout(function() { self.addShootingStar(); }, 2000);
    }
    SF.prototype.resize = function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    };
    SF.prototype.createStars = function(count) {
        this.stars = [];
        for (var i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                r: Math.random() * 1.5 + 0.3,
                opacity: Math.random() * 0.7 + 0.2,
                speed: Math.random() * 0.015 + 0.005,
                phase: Math.random() * Math.PI * 2
            });
        }
    };
    SF.prototype.intensify = function() {
        this.intensified = true;
        this.createStars(800);
    };
    SF.prototype.addShootingStar = function() {
        var w = this.canvas.width;
        var h = this.canvas.height;
        this.shootingStars.push({
            x: rand(0, w * 0.7),
            y: rand(0, h * 0.3),
            len: rand(60, 120),
            speed: rand(7, 12),
            angle: Math.PI / 4 + rand(-0.2, 0.2),
            life: 1
        });
    };
    SF.prototype.animate = function() {
        var self = this;
        var ctx = this.ctx;
        var w = this.canvas.width;
        var h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);
        var t = Date.now() * 0.001;
        
        for (var i = 0; i < this.stars.length; i++) {
            var s = this.stars[i];
            var tw = Math.sin(t * s.speed * 50 + s.phase);
            var a = s.opacity * (0.5 + 0.5 * tw);
            ctx.beginPath();
            ctx.arc(s.x, s.y, Math.max(0.1, s.r), 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
            ctx.fill();
            if (s.r > 1.2) {
                ctx.beginPath();
                ctx.arc(s.x, s.y, Math.max(0.1, s.r * 3), 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,' + (a * 0.08) + ')';
                ctx.fill();
            }
        }
        
        for (var j = this.shootingStars.length - 1; j >= 0; j--) {
            var ss = this.shootingStars[j];
            var dx = Math.cos(ss.angle) * ss.len;
            var dy = Math.sin(ss.angle) * ss.len;
            var grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - dx, ss.y - dy);
            grad.addColorStop(0, 'rgba(255,255,255,' + ss.life + ')');
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
            if (ss.life <= 0) this.shootingStars.splice(j, 1);
        }
        requestAnimationFrame(function() { self.animate(); });
    };
    return SF;
})();

var starField;

// ===== CURSOR GLOW =====
function initCursorGlow() {
    document.addEventListener('mousemove', function(e) {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
    });
}

// ===== AMBIENT FLOATING HEARTS =====
function spawnFloatingHeart() {
    var heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.innerHTML = ['\u2764', '\uD83D\uDC95', '\u2728', '\uD83D\uDC96'][randInt(0, 3)];
    heart.style.left = rand(5, 95) + '%';
    heart.style.fontSize = rand(10, 18) + 'px';
    heart.style.animationDuration = rand(6, 12) + 's';
    document.body.appendChild(heart);
    setTimeout(function() { heart.remove(); }, 13000);
}
function startFloatingHearts() {
    setInterval(spawnFloatingHeart, 3000);
    setTimeout(spawnFloatingHeart, 500);
}

// ===== CELEBRATION EFFECTS =====
function createHeartBurst(x, y, count) {
    count = count || 24;
    for (var i = 0; i < count; i++) {
        var h = document.createElement('div');
        h.className = 'heart-particle';
        h.innerHTML = ['\u2764', '\uD83D\uDC95', '\uD83D\uDC96', '\uD83D\uDC97'][randInt(0, 3)];
        h.style.left = x + 'px';
        h.style.top = y + 'px';
        var angle = (Math.PI * 2 * i) / count + rand(-0.2, 0.2);
        var dist = rand(60, 180);
        h.style.setProperty('--tx', (Math.cos(angle) * dist) + 'px');
        h.style.setProperty('--ty', (Math.sin(angle) * dist) + 'px');
        h.style.setProperty('--rot', rand(-180, 180) + 'deg');
        h.style.fontSize = rand(12, 22) + 'px';
        effectsContainer.appendChild(h);
        (function(el) { setTimeout(function() { el.remove(); }, 1300); })(h);
    }
}

function createConfetti(count) {
    count = count || 60;
    var colors = ['#ff6b9d', '#ffd700', '#ff9a56', '#c084fc', '#4ade80', '#38bdf8', '#fb923c'];
    for (var i = 0; i < count; i++) {
        var c = document.createElement('div');
        c.className = 'confetti-piece';
        c.style.left = rand(0, 100) + '%';
        c.style.backgroundColor = colors[randInt(0, colors.length - 1)];
        c.style.width = rand(5, 10) + 'px';
        c.style.height = rand(5, 10) + 'px';
        c.style.borderRadius = rand(0, 1) ? '50%' : '2px';
        c.style.animationDelay = rand(0, 0.8) + 's';
        c.style.animationDuration = rand(2.5, 4.5) + 's';
        c.style.setProperty('--rot', rand(360, 1080) + 'deg');
        effectsContainer.appendChild(c);
        (function(el) { setTimeout(function() { el.remove(); }, 5500); })(c);
    }
}

function createStarburst(x, y, rays) {
    rays = rays || 14;
    for (var i = 0; i < rays; i++) {
        var ray = document.createElement('div');
        ray.className = 'starburst-ray';
        ray.style.transform = 'rotate(' + ((360 / rays) * i) + 'deg)';
        ray.style.left = x + 'px';
        ray.style.top = y + 'px';
        effectsContainer.appendChild(ray);
        (function(el) { setTimeout(function() { el.remove(); }, 900); })(ray);
    }
}

function playCelebrationEffects() {
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    createHeartBurst(cx, cy, 28);
    createConfetti(70);
    createStarburst(cx, cy, 16);
}

// ===== TYPEWRITER EFFECT =====
async function typewriter(element, text, speed) {
    speed = speed || 38;
    typewriterAbort = false;
    element.innerHTML = '<span class="cursor-blink"></span>';
    await sleep(400);
    var cursor = element.querySelector('.cursor-blink');
    for (var i = 0; i < text.length; i++) {
        if (typewriterAbort) break;
        var ch = text[i];
        if (ch === '\n') {
            element.insertBefore(document.createElement('br'), cursor);
            await sleep(280);
        } else if ('.!?'.indexOf(ch) !== -1) {
            element.insertBefore(document.createTextNode(ch), cursor);
            await sleep(speed * 6);
        } else if (',;:'.indexOf(ch) !== -1) {
            element.insertBefore(document.createTextNode(ch), cursor);
            await sleep(speed * 3);
        } else if (ch === ' ') {
            element.insertBefore(document.createTextNode(' '), cursor);
            await sleep(speed * 0.4);
        } else {
            element.insertBefore(document.createTextNode(ch), cursor);
            await sleep(speed);
        }
    }
    await sleep(600);
    if (cursor && cursor.parentNode) cursor.remove();
}

// ===== LOADING SCREEN =====
async function runLoading() {
    var starsEl = $('loading-stars');
    for (var i = 0; i < 30; i++) {
        var dot = document.createElement('div');
        dot.className = 'loading-star-dot';
        dot.style.left = rand(5, 95) + '%';
        dot.style.top = rand(5, 95) + '%';
        dot.style.animationDelay = rand(0, 2) + 's';
        dot.style.animationDuration = rand(1.5, 3) + 's';
        var sz = rand(1, 3) + 'px';
        dot.style.width = sz;
        dot.style.height = sz;
        starsEl.appendChild(dot);
    }
    
    var progressVal = 0;
    return new Promise(function(resolve) {
        var interval = setInterval(function() {
            progressVal += rand(1.5, 4);
            if (progressVal >= 100) {
                progressVal = 100;
                loadingFill.style.width = '100%';
                clearInterval(interval);
                loadingTap.classList.add('visible'); // Show "Tap to enter"
                resolve();
            } else {
                loadingFill.style.width = progressVal + '%';
            }
        }, 80);
    });
}

// ===== HOME SCREEN =====
function buildHomeScreen() {
    starsGrid.innerHTML = '';
    var completedCount = 0;

    for (var i = 0; i < 6; i++) {
        var star = document.createElement('div');
        star.className = 'home-star';
        star.setAttribute('role', 'button');
        star.setAttribute('tabindex', '0');

        if (progress[i]) {
            star.classList.add('completed');
            star.innerHTML = '\uD83C\uDF1F';
            completedCount++;
        } else {
            var isFirst = (i === 0);
            var prevDone = (i > 0 && progress[i - 1]);
            if (isFirst || prevDone) {
                star.innerHTML = '\u2B50';
            } else {
                star.classList.add('locked');
                star.innerHTML = '\u2B50';
            }
        }

        var label = document.createElement('span');
        label.className = 'star-label';
        label.textContent = STAR_LABELS[i];
        star.appendChild(label);

        (function(idx, el) {
            el.addEventListener('click', function() { handleStarClick(idx); });
            el.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStarClick(idx); }
            });
        })(i, star);

        starsGrid.appendChild(star);
    }
    progressCount.textContent = completedCount;
}

function handleStarClick(index) {
    var isFirst = (index === 0);
    var prevDone = (index > 0 && progress[index - 1]);
    if (!isFirst && !prevDone && !progress[index]) return;

    if (progress[index]) {
        showReveal(index);
    } else {
        startPuzzle(index);
    }
}

// ===== PUZZLE MANAGEMENT =====
function startPuzzle(index) {
    currentPuzzle = index;
    puzzleTitle.textContent = PUZZLE_INFO[index].title;
    puzzleInstruction.textContent = PUZZLE_INFO[index].instruction;
    puzzleArea.innerHTML = '';

    var inits = [initPuzzle1, initPuzzle2, initPuzzle3, initPuzzle4, initPuzzle5, initPuzzle6];
    puzzleCleanup = inits[index](puzzleArea);
    showScreen(puzzleScreen);
}

puzzleBack.addEventListener('click', function() {
    if (puzzleCleanup) { puzzleCleanup(); puzzleCleanup = null; }
    showScreen(homeScreen);
});

async function completePuzzle(index) {
    progress[index] = true;
    saveProgress();
    await sleep(600);
    playCelebrationEffects();
    await sleep(800);
    showReveal(index);
}

// ===== REVEAL SCREEN =====
async function showReveal(index) {
    revealNextBtn.classList.remove('visible');
    revealPhotoWrap.classList.remove('visible');
    revealText.innerHTML = '';
    revealPhoto.src = PHOTO_URLS[index];
    showScreen(revealScreen);

    await sleep(300);
    revealPhotoWrap.classList.add('visible');
    await sleep(500);

    await typewriter(revealText, MESSAGES[index], 36);
    await sleep(400);
    revealNextBtn.classList.add('visible');

    var allDone = true;
    for(var i=0; i<progress.length; i++) { if(!progress[i]) allDone = false; }

    if (allDone) {
        revealNextBtn.innerHTML = 'See Our Universe <i class="fas fa-heart"></i>';
    } else {
        revealNextBtn.innerHTML = 'Continue <i class="fas fa-arrow-right"></i>';
    }
}

revealNextBtn.addEventListener('click', function() {
    typewriterAbort = true;
    var allDone = true;
    for(var i=0; i<progress.length; i++) { if(!progress[i]) allDone = false; }
    
    if (allDone) {
        showFinalScene();
    } else {
        buildHomeScreen();
        showScreen(homeScreen);
    }
});

// ================================================================
// PUZZLE 1: CONSTELLATION DRAG
// ================================================================
function initPuzzle1(area) {
    var container = document.createElement('div');
    container.className = 'p1-container';
    area.appendChild(container);

    var points = [
        { x: 150, y: 30 }, { x: 260, y: 100 }, { x: 220, y: 220 },
        { x: 80, y: 220 }, { x: 40, y: 100 }
    ];
    var missingIdx = 2;
    var connections = [[0,1],[1,2],[2,3],[3,4],[4,0]];
    var ns = 'http://www.w3.org/2000/svg';
    
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '300'); svg.setAttribute('height', '260');
    svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
    container.appendChild(svg);

    var lines = [];
    for (var c = 0; c < connections.length; c++) {
        var a = connections[c][0], b = connections[c][1];
        var line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', points[a].x); line.setAttribute('y1', points[a].y);
        line.setAttribute('x2', points[b].x); line.setAttribute('y2', points[b].y);
        var isDash = (a === missingIdx || b === missingIdx);
        line.setAttribute('stroke', isDash ? 'rgba(255,215,0,0.12)' : 'rgba(255,215,0,0.25)');
        line.setAttribute('stroke-width', '1.5');
        if (isDash) line.setAttribute('stroke-dasharray', '5,5');
        svg.appendChild(line);
        lines.push({ line: line, dash: isDash });
    }

    for (var i = 0; i < points.length; i++) {
        if (i === missingIdx) {
            var target = document.createElement('div');
            target.className = 'star-target';
            target.style.left = points[i].x + 'px'; target.style.top = points[i].y + 'px';
            container.appendChild(target);
        } else {
            var star = document.createElement('div');
            star.className = 'constellation-star';
            star.style.left = points[i].x + 'px'; star.style.top = points[i].y + 'px';
            container.appendChild(star);
        }
    }

    var drag = document.createElement('div');
    drag.className = 'draggable-star';
    drag.style.left = '140px'; drag.style.top = '270px';
    container.appendChild(drag);

    var dragging = false, offX = 0, offY = 0;

    function onDown(e) {
        if (drag.classList.contains('snapped')) return;
        dragging = true; drag.setPointerCapture(e.pointerId);
        var rect = drag.getBoundingClientRect();
        offX = e.clientX - rect.left - rect.width / 2;
        offY = e.clientY - rect.top - rect.height / 2;
        drag.style.zIndex = '100'; drag.style.transition = 'none';
    }
    function onMove(e) {
        if (!dragging) return;
        var cRect = container.getBoundingClientRect();
        drag.style.left = (e.clientX - cRect.left - offX) + 'px';
        drag.style.top = (e.clientY - cRect.top - offY) + 'px';
    }
    function onUp() {
        if (!dragging) return; dragging = false;
        var tgt = points[missingIdx];
        var dx = parseFloat(drag.style.left) - tgt.x;
        var dy = parseFloat(drag.style.top) - tgt.y;
        if (Math.sqrt(dx * dx + dy * dy) < 45) {
            drag.style.left = tgt.x + 'px'; drag.style.top = tgt.y + 'px';
            drag.classList.add('snapped');
            for (var l = 0; l < lines.length; l++) {
                if (lines[l].dash) {
                    lines[l].line.setAttribute('stroke-dasharray', 'none');
                    lines[l].line.setAttribute('stroke', 'rgba(255,215,0,0.25)');
                }
            }
            var t = container.querySelector('.star-target'); if (t) t.style.display = 'none';
            setTimeout(function() { completePuzzle(0); }, 700);
        }
    }

    drag.addEventListener('pointerdown', onDown);
    drag.addEventListener('pointermove', onMove);
    drag.addEventListener('pointerup', onUp);
    drag.style.touchAction = 'none';
    return function() { dragging = false; };
}

// ================================================================
// PUZZLE 2: JIGSAW SWAP
// ================================================================
function initPuzzle2(area) {
    var grid = document.createElement('div'); grid.className = 'jigsaw-grid'; area.appendChild(grid);
    var positions = [{bgX:'0%',bgY:'0%'},{bgX:'100%',bgY:'0%'},{bgX:'0%',bgY:'100%'},{bgX:'100%',bgY:'100%'}];
    var order = [0, 1, 2, 3];
    do { for(var i=3;i>0;i--){var j=randInt(0,i);var t=order[i];order[i]=order[j];order[j]=t;} } 
    while (order[0]===0 && order[1]===1 && order[2]===2 && order[3]===3);

    var pieces = [];
    for(var s=0; s<order.length; s++){
        var posIdx = order[s]; var piece = document.createElement('div'); piece.className='jigsaw-piece';
        piece.style.backgroundImage = 'url('+PHOTO_URLS[1]+')';
        piece.style.backgroundPosition = positions[posIdx].bgX+' '+positions[posIdx].bgY;
        piece.dataset.posIndex = posIdx; piece.setAttribute('tabindex','0');
        grid.appendChild(piece); pieces.push(piece);
    }
    var selected = null;
    function handlePieceClick(p){
        if(p.classList.contains('correct')) return;
        if(!selected){ selected=p; p.classList.add('selected'); }
        else if(selected===p){ selected.classList.remove('selected'); selected=null; }
        else {
            var tBg=selected.style.backgroundPosition, tIdx=selected.dataset.posIndex;
            selected.style.backgroundPosition=p.style.backgroundPosition; selected.dataset.posIndex=p.dataset.posIndex;
            p.style.backgroundPosition=tBg; p.dataset.posIndex=tIdx;
            selected.classList.remove('selected'); selected=null; checkSolved();
        }
    }
    function checkSolved(){
        var solved=true;
        for(var i=0;i<pieces.length;i++){
            if(parseInt(pieces[i].dataset.posIndex)===i) pieces[i].classList.add('correct');
            else { pieces[i].classList.remove('correct'); solved=false; }
        }
        if(solved) setTimeout(function(){completePuzzle(1);}, 600);
    }
    for(var p=0;p<pieces.length;p++){
        (function(el){ el.onclick=function(){handlePieceClick(el);}; el.onkeydown=function(e){if(e.key==='Enter')handlePieceClick(el);}; })(pieces[p]);
    }
    return function(){};
}

// ================================================================
// PUZZLE 3: MEMORY SEQUENCE
// ================================================================
function initPuzzle3(area) {
    var wrap=document.createElement('div'); wrap.style.textAlign='center'; area.appendChild(wrap);
    var c=document.createElement('div'); c.className='memory-stars'; wrap.appendChild(c);
    var status=document.createElement('div'); status.className='memory-status'; status.textContent='Watch carefully...'; wrap.appendChild(status);
    var icons=['\u2726','\u2727','\u27E1','\u2736','\u2734'], els=[];
    for(var i=0;i<5;i++){var s=document.createElement('div');s.className='memory-star disabled';s.innerHTML=icons[i];s.dataset.index=i;s.setAttribute('tabindex','0');c.appendChild(s);els.push(s);}
    var seq=[2,0,4,1], inp=[], accepting=false;
    function flash(idx,dur){dur=dur||500;return new Promise(function(r){els[idx].classList.add('flash');setTimeout(function(){els[idx].classList.remove('flash');setTimeout(r,200);},dur);});}
    async function playSeq(){
        status.textContent='Watch carefully...'; accepting=false;
        for(var i=0;i<els.length;i++) els[i].classList.add('disabled');
        await sleep(600); for(var j=0;j<seq.length;j++) await flash(seq[j],500);
        status.textContent='Your turn! Repeat the sequence.';
        for(var k=0;k<els.length;k++) els[k].classList.remove('disabled');
        inp=[]; accepting=true;
    }
    function click(idx){
        if(!accepting) return;
        if(seq[inp.length]===idx){
            els[idx].classList.add('correct-flash'); setTimeout(function(){els[idx].classList.remove('correct-flash');},400);
            inp.push(idx);
            if(inp.length===seq.length){ accepting=false; status.textContent='Perfect!'; for(var i=0;i<els.length;i++) els[i].classList.add('disabled'); setTimeout(function(){completePuzzle(2);},700); }
        } else {
            els[idx].classList.add('wrong'); setTimeout(function(){els[idx].classList.remove('wrong');},500);
            status.textContent='Wrong! Watch again...'; inp=[]; accepting=false; setTimeout(playSeq, 1200);
        }
    }
    for(var si=0;si<els.length;si++){(function(el){el.onclick=function(){click(parseInt(el.dataset.index));};el.onkeydown=function(e){if(e.key==='Enter')click(parseInt(el.dataset.index));};})(els[si]);}
    setTimeout(playSeq, 500);
    return function(){accepting=false;};
}

// ================================================================
// PUZZLE 4: CONNECT THE STARS
// ================================================================
function initPuzzle4(area) {
    var con=document.createElement('div'); con.className='p4-container'; area.appendChild(con);
    var pts=[{x:150,y:240},{x:50,y:130},{x:60,y:60},{x:150,y:90},{x:240,y:60},{x:250,y:130}];
    var order=[0,1,2,3,4,5,0], ns='http://www.w3.org/2000/svg';
    var svg=document.createElementNS(ns,'svg'); svg.setAttribute('width','300'); svg.setAttribute('height','280');
    svg.style.cssText='position:absolute;top:0;left:0;pointer-events:none;'; con.appendChild(svg);
    var els=[], conn=[], lines=[];
    for(var i=0;i<pts.length;i++){var s=document.createElement('div');s.className='p4-star';s.style.left=pts[i].x+'px';s.style.top=pts[i].y+'px';s.dataset.index=i;s.setAttribute('tabindex','0');con.appendChild(s);els.push(s);}
    var hint=document.createElement('div');hint.className='p4-hint';hint.textContent='Start from the bottom star';area.appendChild(hint);
    function drawLine(f,t){var l=document.createElementNS(ns,'line');l.setAttribute('x1',pts[f].x);l.setAttribute('y1',pts[f].y);l.setAttribute('x2',pts[t].x);l.setAttribute('y2',pts[t].y);l.setAttribute('stroke','rgba(255,215,0,0.5)');l.setAttribute('stroke-width','2');l.setAttribute('stroke-linecap','round');svg.appendChild(l);return l;}
    function reset(){conn=[];for(var i=0;i<lines.length;i++)lines[i].remove();lines=[];for(var j=0;j<els.length;j++)els[j].classList.remove('connected','wrong-star');}
    function click(idx){
        if(idx===order[conn.length]){
            if(conn.length>0){var p=conn[conn.length-1];lines.push(drawLine(p,idx));}
            conn.push(idx); els[idx].classList.add('connected');
            if(conn.length===order.length) setTimeout(function(){completePuzzle(3);},600);
        } else { els[idx].classList.add('wrong-star'); setTimeout(function(){els[idx].classList.remove('wrong-star');},500); reset(); }
    }
    for(var si=0;si<els.length;si++){(function(el){el.onclick=function(){click(parseInt(el.dataset.index));};el.onkeydown=function(e){if(e.key==='Enter')click(parseInt(el.dataset.index));};})(els[si]);}
    return function(){for(var i=0;i<lines.length;i++)lines[i].remove();};
}

// ================================================================
// PUZZLE 5: ROTATE PUZZLE
// ================================================================
function initPuzzle5(area) {
    var grid=document.createElement('div'); grid.className='rotate-grid'; area.appendChild(grid);
    var pos=[{bgX:'0%',bgY:'0%'},{bgX:'100%',bgY:'0%'},{bgX:'0%',bgY:'100%'},{bgX:'100%',bgY:'100%'}];
    var pieces=[], rots=[];
    do{rots=[];for(var r=0;r<4;r++)rots.push(randInt(1,3));}while(false);
    for(var i=0;i<4;i++){var p=document.createElement('div');p.className='rotate-piece';p.style.backgroundImage='url('+PHOTO_URLS[4]+')';p.style.backgroundPosition=pos[i].bgX+' '+pos[i].bgY;p.style.transform='rotate('+(rots[i]*90)+'deg)';p.dataset.rotation=rots[i];p.setAttribute('tabindex','0');grid.appendChild(p);pieces.push(p);}
    function click(p){var r=(parseInt(p.dataset.rotation)+1)%4;p.dataset.rotation=r;p.style.transform='rotate('+(r*90)+'deg)';if(r===0)p.classList.add('correct-rot');else p.classList.remove('correct-rot');var ok=true;for(var j=0;j<pieces.length;j++)if(parseInt(pieces[j].dataset.rotation)!==0)ok=false;if(ok)setTimeout(function(){completePuzzle(4);},600);}
    for(var pi=0;pi<pieces.length;pi++){(function(el){el.onclick=function(){click(el);};el.onkeydown=function(e){if(e.key==='Enter')click(el);};})(pieces[pi]);}
    return function(){};
}

// ================================================================
// PUZZLE 6: FIND THE HIDDEN STAR
// ================================================================
function initPuzzle6(area) {
    var con=document.createElement('div'); con.className='p6-container'; area.appendChild(con);
    var status=document.createElement('div'); status.className='p6-status'; status.textContent='Look carefully...'; area.appendChild(status);
    var tot=45, hid=randInt(0,tot-1), wrong=0, found=false, els=[];
    for(var i=0;i<tot;i++){var s=document.createElement('div');s.className='p6-star';var sz=(i===hid)?5:rand(3,7);s.style.width=sz+'px';s.style.height=sz+'px';s.style.left=rand(8,92)+'%';s.style.top=rand(8,92)+'%';s.style.opacity=rand(0.4,0.9);if(i===hid){s.classList.add('hidden-star');s.style.width='5px';s.style.height='5px';s.style.opacity='0.4';}s.dataset.index=i;s.setAttribute('tabindex','0');con.appendChild(s);els.push(s);}
    function click(idx){if(found)return;if(idx===hid){found=true;els[idx].classList.add('found-star');status.textContent='You found it!';setTimeout(function(){completePuzzle(5);},800);}else{wrong++;els[idx].classList.add('wrong-click');(function(el){setTimeout(function(){el.classList.remove('wrong-click');},400);})(els[idx]);if(wrong>=5){status.textContent='Hint: Look for the one that pulses...';els[hid].classList.add('hint-active');}else{status.textContent='Not that one. Try again. ('+wrong+'/5)';}}}
    for(var si=0;si<els.length;si++){(function(el){el.onclick=function(){click(parseInt(el.dataset.index));};el.onkeydown=function(e){if(e.key==='Enter')click(parseInt(el.dataset.index));};})(els[si]);}
    return function(){found=true;};
}

// ================================================================
// FINAL SCENE
// ================================================================
async function showFinalScene() {
    finalHeart.classList.remove('visible'); finalText.innerHTML = ''; restartBtn.classList.remove('visible'); fireworksCanvas.classList.remove('active');
    showScreen(finalScreen);
    starField.intensify();
    fireworksCanvas.classList.add('active');
    startFireworks();
    await sleep(800); finalHeart.classList.add('visible'); await sleep(1500);
    createHeartBurst(window.innerWidth/2, window.innerHeight/2, 30); createConfetti(80);
    await sleep(800);
    var msg = 'Congratulations \u2764\uFE0F\n\nThese six photos are only a tiny part of our story.\n\nEvery laugh,\nevery conversation,\nevery little moment with you\nhas become something I treasure.\n\nThank you for being the most beautiful chapter of my life.\n\nNo matter what tomorrow brings,\nI\'ll always be grateful\nthat our paths crossed.\n\nYou make my world brighter\nin ways you\'ll never truly know.\n\nI love you more than words can ever explain.\n\n\u2764\uFE0F Forever Yours,\nYour Beloved,\nPrit \u2764\uFE0F';
    await typewriter(finalText, msg, 32);
    await sleep(600); restartBtn.classList.add('visible');
}

// ================================================================
// FIREWORKS (Canvas Particles)
// ================================================================
var fwRunning = false, fwList = [], fwCtx;
function startFireworks() {
    fwRunning = true; fwList = []; fireworksCanvas.width = window.innerWidth; fireworksCanvas.height = window.innerHeight; fwCtx = fireworksCanvas.getContext('2d');
    launchFw(); var int = setInterval(function(){ if(!fwRunning){clearInterval(int);return;} launchFw(); }, 800); animFw();
}
function launchFw() {
    var cols=['rgba(255,107,157,1)','rgba(255,215,0,1)','rgba(192,132,252,1)','rgba(74,222,128,1)','rgba(56,189,248,1)'];
    var fw={x:rand(fireworksCanvas.width*0.15,fireworksCanvas.width*0.85),y:rand(fireworksCanvas.height*0.1,fireworksCanvas.height*0.5),particles:[],color:cols[randInt(0,cols.length-1)]};
    var cnt=randInt(40,70); for(var i=0;i<cnt;i++){var a=(Math.PI*2*i)/cnt+rand(-0.1,0.1),sp=rand(1.5,5);fw.particles.push({x:fw.x,y:fw.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:rand(0.008,0.018),size:rand(1.5,3)});}
    fwList.push(fw);
}
function animFw() {
    if(!fwRunning){if(fwCtx)fwCtx.clearRect(0,0,fireworksCanvas.width,fireworksCanvas.height);return;}
    fwCtx.clearRect(0,0,fireworksCanvas.width,fireworksCanvas.height);
    for(var f=fwList.length-1;f>=0;f--){var fw=fwList[f];for(var p=fw.particles.length-1;p>=0;p--){var pt=fw.particles[p];pt.x+=pt.vx;pt.y+=pt.vy;pt.vy+=0.04;pt.vx*=0.99;pt.life-=pt.decay;if(pt.life<=0){fw.particles.splice(p,1);continue;}var al=Math.max(0,pt.life);fwCtx.beginPath();fwCtx.arc(pt.x,pt.y,Math.max(0.5,pt.size*pt.life),0,Math.PI*2);fwCtx.fillStyle=fw.color.replace(',1)',','+al+')');fwCtx.fill();fwCtx.beginPath();fwCtx.arc(pt.x,pt.y,Math.max(0.5,pt.size*3*pt.life),0,Math.PI*2);fwCtx.fillStyle=fw.color.replace(',1)',','+(al*0.15)+')');fwCtx.fill();}if(fw.particles.length===0)fwList.splice(f,1);}
    requestAnimationFrame(animFw);
}

// ===== RESTART =====
restartBtn.addEventListener('click', function() {
    typewriterAbort = true; fwRunning = false; fireworksCanvas.classList.remove('active'); fwList = [];
    progress = [false, false, false, false, false, false]; saveProgress();
    starField.intensified = false; starField.createStars(200);
    showScreen(loadingScreen); loadingFill.style.width = '0%'; loadingTap.classList.remove('visible');
    setTimeout(async function() { await runLoading(); }, 300);
});

window.addEventListener('resize', function() { if(fwRunning){fireworksCanvas.width=window.innerWidth;fireworksCanvas.height=window.innerHeight;} });

// ===== INITIALIZATION =====
async function init() {
    loadProgress();
    starField = new StarField(starCanvas);
    initCursorGlow();
    startFloatingHearts();
    
    // Run loading animation
    await runLoading();
    
    // Wait for user to click to enter (Required for Web Audio API)
    function enterSite() {
        loadingScreen.removeEventListener('click', enterSite);
        loadingScreen.removeEventListener('touchend', enterSite);
        
        // Start Fairytale Music
        fairytaleMusic.start();
        musicIcon.className = 'fas fa-volume-high';
        musicBtn.classList.add('visible', 'playing');
        
        buildHomeScreen();
        showScreen(homeScreen);
    }
    loadingScreen.addEventListener('click', enterSite);
    loadingScreen.addEventListener('touchend', enterSite);
}

init();
