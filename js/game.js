(() => {
  'use strict';

  const { TAU, clamp, rand, pick, FRUITS, FRUIT_KEYS, buildBackground } = window.Art;

  const COMBO_WINDOW = 1.9;
  const MAX_SURGE = 100;
  const STORM_TIME = 5;
  const TRAIL_TIME = 0.28;
  const BEST_KEY = 'chainNinjaBest';
  const MUTE_KEY = 'chainNinjaMuted';

  const distToSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((px - x1) * dx + (py - y1) * dy) / len2 : 0;
    t = clamp(t, 0, 1);
    return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
  };

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : v;
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, String(value)); } catch (e) { /* ignore */ }
    }
  };

  class Game {
    constructor() {
      this.canvas = document.getElementById('game');
      this.ctx = this.canvas.getContext('2d');
      this.sound = new window.SoundEngine();

      this.muted = store.get(MUTE_KEY, '0') === '1';
      this.sound.enabled = !this.muted;
      this.best = parseInt(store.get(BEST_KEY, '0'), 10) || 0;

      this.state = 'menu';
      this.W = 1;
      this.H = 1;
      this.dpr = 1;
      this.scale = 1;
      this.time = 0;
      this.last = performance.now();

      this.pointers = new Map();
      this.cursor = { x: 0, y: 0, angle: -0.6, visible: false, type: 'mouse', px: 0, py: 0 };

      this.embers = [];
      this.bg = null;
      this.bgMargin = 44;

      this.cacheDom();
      this.buildHearts();
      this.bindUI();
      this.bindInput();
      this.resize();

      this.resetWorld();
      this.updateMuteUI();
      this.updateBestLabels();
      this.updateHud(true);

      this.frame = this.frame.bind(this);
      requestAnimationFrame(this.frame);
    }

    /* ----------------------------- DOM ----------------------------- */

    cacheDom() {
      this.hud = document.getElementById('hud');
      this.scoreEl = document.getElementById('score');
      this.bestHudEl = document.getElementById('bestHud');
      this.bestMenuEl = document.getElementById('bestMenu');
      this.comboEl = document.getElementById('combo');
      this.comboMultEl = document.getElementById('comboMult');
      this.comboCountEl = document.getElementById('comboCount');
      this.comboRingEl = document.getElementById('comboRing');
      this.heartsEl = document.getElementById('hearts');
      this.stormFillEl = document.getElementById('stormFill');
      this.stormPctEl = document.getElementById('stormPct');
      this.stormBtnEl = document.getElementById('stormBtn');
      this.stormBtnTextEl = document.getElementById('stormBtnText');
      this.stormLabelEl = document.getElementById('stormLabel');
      this.hintEl = document.getElementById('hint');

      this.menuEl = document.getElementById('menu');
      this.pauseEl = document.getElementById('pause');
      this.overEl = document.getElementById('gameover');
      this.finalScoreEl = document.getElementById('finalScore');
      this.newBestEl = document.getElementById('newBest');
      this.statBestEl = document.getElementById('statBest');
      this.statComboEl = document.getElementById('statCombo');
      this.statFruitEl = document.getElementById('statFruit');
      this.statTimeEl = document.getElementById('statTime');
    }

    buildHearts() {
      const heart = '<svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.1S4.6 16.7 2.1 12.5C.4 9.6 2.2 5.5 6.2 4.8c2.1-.4 4.1.7 5.8 2.5 1.7-1.8 3.7-2.9 5.8-2.5 4 .7 5.8 4.8 4.1 7.7C19.4 16.7 12 21.1 12 21.1z" fill="#ff5a6e"/><path d="M7.1 7.3c1-.6 2.2-.2 3.1.6" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1.2" stroke-linecap="round"/></svg>';
      this.heartsEl.innerHTML = heart + heart + heart;
    }

    bindUI() {
      const tap = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
      };
      tap('playBtn', () => { this.sound.ensure(); this.startGame(); });
      tap('againBtn', () => { this.sound.ensure(); this.startGame(); });
      tap('restartBtn', () => { this.sound.ensure(); this.startGame(); });
      tap('resumeBtn', () => { this.sound.ensure(); this.resumeGame(); });
      tap('quitBtn', () => { this.sound.ui(); this.showMenu(); });
      tap('homeBtn', () => { this.sound.ui(); this.showMenu(); });
      tap('pauseBtn', () => { this.sound.ui(); this.togglePause(); });
      tap('stormBtn', () => { this.sound.ensure(); this.activateStorm(); });

      document.querySelectorAll('.js-mute').forEach((btn) => {
        btn.addEventListener('click', () => { this.toggleMute(); });
      });

      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        if (e.code === 'Space') {
          e.preventDefault();
          if (this.state === 'playing') { this.sound.ensure(); this.activateStorm(); }
          else if (this.state === 'menu' || this.state === 'gameover') { this.sound.ensure(); this.startGame(); }
          return;
        }
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          if (this.state === 'playing' || this.state === 'paused') this.togglePause();
          return;
        }
        if (e.key === 'm' || e.key === 'M') { this.toggleMute(); return; }
        if (e.key === 'Enter' && (this.state === 'menu' || this.state === 'gameover')) {
          this.sound.ensure(); this.startGame();
        }
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.state === 'playing') this.pauseGame();
      });

      window.addEventListener('resize', () => this.resize());
    }

    bindInput() {
      this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e), { passive: false });
      window.addEventListener('pointermove', (e) => this.onPointerMove(e), { passive: false });
      window.addEventListener('pointerup', (e) => this.onPointerUp(e));
      window.addEventListener('pointercancel', (e) => this.onPointerUp(e));
      this.canvas.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse' && this.state === 'playing') this.cursor.visible = true;
      });
      this.canvas.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'mouse') this.cursor.visible = false;
      });
      this.canvas.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = this.canvas.getBoundingClientRect();
        this.cursor.px = this.cursor.x;
        this.cursor.py = this.cursor.y;
        this.cursor.x = e.clientX - r.left;
        this.cursor.y = e.clientY - r.top;
        if (this.cursor.x !== this.cursor.px || this.cursor.y !== this.cursor.py) {
          const a = Math.atan2(this.cursor.y - this.cursor.py, this.cursor.x - this.cursor.px);
          let diff = a - this.cursor.angle;
          while (diff > Math.PI) diff -= TAU;
          while (diff < -Math.PI) diff += TAU;
          this.cursor.angle += diff * 0.4;
        }
      });
      window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    resize() {
      const W = Math.max(300, window.innerWidth);
      const H = Math.max(300, window.innerHeight);
      this.W = W;
      this.H = H;
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(W * this.dpr);
      this.canvas.height = Math.round(H * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.scale = clamp(Math.min(W, H) / 700, 0.78, 1.35);
      const bg = buildBackground(W, H, this.dpr);
      this.bg = bg.canvas;
      this.bgMargin = bg.margin;
      this.initEmbers();
    }

    initEmbers() {
      const count = Math.round(clamp((this.W * this.H) / 28000, 24, 58));
      this.embers = [];
      for (let i = 0; i < count; i++) {
        this.embers.push({
          x: rand(0, this.W),
          y: rand(0, this.H),
          r: rand(0.7, 2.2),
          vy: rand(6, 22),
          vx: rand(-6, 6),
          phase: rand(0, TAU),
          alpha: rand(0.12, 0.5),
          hue: rand(20, 45)
        });
      }
    }

    /* --------------------------- lifecycle --------------------------- */

    resetWorld() {
      clearTimeout(this.hintTimer);
      clearTimeout(this.hintTimer2);
      this.fruits = [];
      this.halves = [];
      this.particles = [];
      this.bolts = [];
      this.texts = [];
      this.rings = [];
      this.slashes = [];
      this.pending = [];
      this.pointers.clear();
      this.stormLast = null;

      this.score = 0;
      this.displayScore = 0;
      this.combo = 0;
      this.comboTimer = 0;
      this.maxCombo = 0;
      this.hearts = 3;
      this.elapsed = 0;
      this.grace = 2.2;
      this.fruitsSliced = 0;
      this.surge = 0;
      this.surgeAnnounced = false;
      this.stormTime = 0;
      this.stormZapTimer = 0;
      this.stormBoltTimer = 0;
      this.spawnTimer = 2.1;
      this.dying = false;
      this.deathTimer = 0;
      this.shake = 0;
      this.flash = 0;
      this.flashColor = '255, 180, 80';
      this.lastSlice = null;
      this.newBest = false;
    }

    startGame() {
      this.resetWorld();
      this.state = 'playing';
      document.body.classList.add('playing');
      this.menuEl.classList.add('hidden');
      this.pauseEl.classList.add('hidden');
      this.overEl.classList.add('hidden');
      this.hud.classList.remove('hidden');
      this.hud.setAttribute('aria-hidden', 'false');
      this.hintEl.classList.remove('fade');
      this.hintEl.textContent = 'HOLD & SWIPE TO SLICE';
      this.hintTimer = setTimeout(() => {
        this.hintEl.textContent = 'CHAIN CUTS TO MULTIPLY';
      }, 3200);
      this.hintTimer2 = setTimeout(() => this.hintEl.classList.add('fade'), 7600);
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

      const xs = [0.2, 0.42, 0.62, 0.8];
      for (let i = 0; i < 4; i++) {
        this.spawnFruit(null, true);
        const f = this.fruits[this.fruits.length - 1];
        if (f) {
          f.x = this.W * xs[i] + rand(-18, 18);
          f.y = this.H * rand(0.6, 0.78);
        }
      }
      this.pending.push({ delay: 0.35 }, { delay: 0.75 });
      this.updateHud(true);
      this.updateMuteUI();
    }

    showMenu() {
      this.state = 'menu';
      document.body.classList.remove('playing');
      this.menuEl.classList.remove('hidden');
      this.pauseEl.classList.add('hidden');
      this.overEl.classList.add('hidden');
      this.hud.classList.add('hidden');
      this.hud.setAttribute('aria-hidden', 'true');
      this.resetWorld();
      this.updateHud(true);
      this.updateBestLabels();
    }

    pauseGame() {
      if (this.state !== 'playing') return;
      this.state = 'paused';
      document.body.classList.remove('playing');
      this.pauseEl.classList.remove('hidden');
      this.pointers.clear();
      this.cursor.visible = false;
    }

    resumeGame() {
      if (this.state !== 'paused') return;
      this.state = 'playing';
      document.body.classList.add('playing');
      this.pauseEl.classList.add('hidden');
      this.last = performance.now();
    }

    togglePause() {
      if (this.state === 'playing') this.pauseGame();
      else if (this.state === 'paused') this.resumeGame();
    }

    finishGame() {
      this.state = 'gameover';
      this.stormTime = 0;
      this.combo = 0;
      document.body.classList.remove('playing');
      this.pointers.clear();
      this.cursor.visible = false;
      this.newBest = this.score > this.best;
      if (this.newBest) {
        this.best = this.score;
        store.set(BEST_KEY, this.best);
      }
      this.updateBestLabels();
      this.finalScoreEl.textContent = this.score.toLocaleString();
      this.statBestEl.textContent = this.best.toLocaleString();
      this.statComboEl.textContent = this.maxCombo;
      this.statFruitEl.textContent = this.fruitsSliced;
      this.statTimeEl.textContent = Math.floor(this.elapsed) + 's';
      this.newBestEl.classList.toggle('hidden', !this.newBest);
      this.overEl.classList.remove('hidden');
      this.updateHud(true);
    }

    toggleMute() {
      this.muted = !this.muted;
      this.sound.setEnabled(!this.muted);
      if (!this.muted) this.sound.ui();
      store.set(MUTE_KEY, this.muted ? '1' : '0');
      this.updateMuteUI();
    }

    updateMuteUI() {
      const onIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.2v5.6h3.6L13 19V5L7.6 9.2H4z"/><path d="M16.2 8.6a4.8 4.8 0 010 6.8M18.8 6a8.4 8.4 0 010 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
      const offIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.2v5.6h3.6L13 19V5L7.6 9.2H4z"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';
      document.querySelectorAll('.js-mute').forEach((btn) => {
        if (btn.classList.contains('link-btn')) {
          btn.textContent = this.muted ? 'SOUND OFF' : 'SOUND ON';
          btn.setAttribute('aria-pressed', String(!this.muted));
        } else {
          btn.innerHTML = this.muted ? offIcon : onIcon;
          btn.setAttribute('aria-label', this.muted ? 'Enable sound' : 'Mute sound');
          btn.setAttribute('aria-pressed', String(!this.muted));
        }
      });
    }

    updateBestLabels() {
      if (this.bestMenuEl) this.bestMenuEl.textContent = this.best.toLocaleString();
      if (this.bestHudEl) this.bestHudEl.textContent = Math.max(this.best, this.score || 0).toLocaleString();
    }

    /* ----------------------------- input ----------------------------- */

    pointerPos(e) {
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      return { x, y, inside: x >= 0 && y >= 0 && x <= r.width && y <= r.height };
    }

    onPointerDown(e) {
      if (this.state !== 'playing' || this.dying) return;
      e.preventDefault();
      this.sound.ensure();
      const p = this.pointerPos(e);
      this.pointers.set(e.pointerId, {
        x: p.x, y: p.y, down: true, type: e.pointerType,
        trail: [{ x: p.x, y: p.y, t: this.time }],
        count: 0, upAt: 0
      });
      if (e.pointerType === 'mouse') {
        this.cursor.x = p.x;
        this.cursor.y = p.y;
        this.cursor.visible = true;
        this.cursor.type = 'mouse';
      }
    }

    onPointerMove(e) {
      const p = this.pointerPos(e);
      const st = this.pointers.get(e.pointerId);
      if (!st || !st.down) return;
      if (this.state !== 'playing' || this.dying) return;
      e.preventDefault();
      const px = st.x;
      const py = st.y;
      st.x = p.x;
      st.y = p.y;
      st.trail.push({ x: p.x, y: p.y, t: this.time });
      if (st.trail.length > 28) st.trail.shift();
      const dx = p.x - px;
      const dy = p.y - py;
      if (Math.hypot(dx, dy) < 1.6) return;
      this.checkSlice(px, py, p.x, p.y, st, e.pointerType);
    }

    onPointerUp(e) {
      const st = this.pointers.get(e.pointerId);
      if (st) {
        st.down = false;
        st.upAt = this.time;
      }
    }

    checkSlice(x1, y1, x2, y2, stroke, pointerType) {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      for (const f of this.fruits) {
        if (f.dead) continue;
        const hit = distToSegment(f.x, f.y, x1, y1, x2, y2) < f.r * 0.94 + 6;
        if (!hit) continue;
        let fruit = true;
        if (f.type === 'bomb') { this.sliceBomb(f, angle); fruit = false; }
        else if (f.type === 'golden') this.sliceGolden(f, angle);
        else this.sliceFruit(f, angle);

        if (fruit) {
          stroke.count++;
          if (stroke.count >= 2) {
            const labels = ['', '', 'DOUBLE', 'TRIPLE', 'QUAD', 'RAMPAGE', 'LEGENDARY'];
            const bonuses = [0, 0, 25, 60, 110, 180, 260];
            const idx = Math.min(stroke.count, 6);
            const bonus = bonuses[idx];
            this.score += bonus;
            this.addText(f.x, f.y + f.r * 0.9, `${labels[idx]} +${bonus}`, '#a9f1ff', 16, 0.95);
            this.sound.multi(stroke.count);
            this.shake = Math.max(this.shake, 3);
          }
        }
      }
      if (pointerType === 'mouse') {
        this.cursor.x = x2;
        this.cursor.y = y2;
      }
    }

    /* ----------------------------- scoring ----------------------------- */

    multiplier() {
      return Math.min(8, 1 + Math.max(0, this.combo - 1) * 0.25);
    }

    chainColor() {
      if (this.combo >= 20) return '#ff5fd2';
      if (this.combo >= 10) return '#ff9f43';
      if (this.combo >= 5) return '#ffd75e';
      return '#7fe7ff';
    }

    addSurge(amount) {
      if (this.stormTime > 0) return;
      this.surge = clamp(this.surge + amount, 0, MAX_SURGE);
      if (this.surge >= MAX_SURGE && !this.surgeAnnounced) {
        this.surgeAnnounced = true;
        this.addText(this.W * 0.5, this.H * 0.64, 'CHAIN STORM READY', '#bdf4ff', 20, 1.5);
        this.addRing(this.W * 0.5, this.H * 0.64, '#7fe7ff', 110, 3, 0.7);
        this.sound.milestone(this.combo);
      }
    }

    sliceFruit(f, angle, opts = {}) {
      if (f.dead) return;
      f.dead = true;
      const def = FRUITS[f.type] || FRUITS.apple;
      this.fruitsSliced++;
      this.combo++;
      this.comboTimer = COMBO_WINDOW;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      const mult = this.multiplier() * (this.stormTime > 0 ? 2 : 1);
      const points = Math.round((opts.points || 10) * mult);
      this.score += points;

      const color = opts.storm ? '#bdf4ff' : '#fff2cf';
      this.addText(f.x, f.y - f.r * 0.45, '+' + points, color, opts.storm ? 18 : 16, 0.85);
      if (this.combo > 1 && this.lastSlice) {
        this.addBolt(this.lastSlice, { x: f.x, y: f.y }, this.chainColor(), 3, 0.5);
      }
      this.lastSlice = { x: f.x, y: f.y };

      this.spawnHalves(f, angle);
      this.addJuice(f.x, f.y, def.juice, opts.storm ? 16 : 12);
      this.addSparks(f.x, f.y, this.chainColor(), 5);
      this.addSlash(f.x, f.y, angle, f.r * 1.7);
      this.addSurge(7);
      this.shake = Math.max(this.shake, 2.2);
      this.sound.slice(this.combo);

      if (this.combo % 5 === 0) this.chainMilestone();
    }

    sliceGolden(f, angle) {
      if (f.dead) return;
      this.sliceFruit(f, angle, { points: 75 });
      this.addText(f.x, f.y - f.r, 'GOLDEN!', '#ffe27a', 24, 1.3);
      this.addRing(f.x, f.y, '#ffd75e', 140, 5, 0.8);
      this.addJuice(f.x, f.y, '#ffd84d', 22);
      this.addSurge(30);
      this.flash = Math.max(this.flash, 0.5);
      this.flashColor = '255, 205, 90';
      if (this.hearts < 3) {
        this.hearts++;
        this.addText(f.x, f.y - f.r * 1.9, '+1 LIFE', '#ff9daa', 20, 1.4);
      } else {
        this.score += 100;
        this.addText(f.x, f.y - f.r * 1.9, 'BONUS +100', '#ffd75e', 18, 1.3);
      }
      this.sound.gold();
    }

    sliceBomb(f, angle) {
      if (f.dead) return;
      f.dead = true;
      this.addBombExplosion(f.x, f.y);
      this.loseHeart('bomb');
      this.addText(f.x, f.y - f.r, 'BOMB!', '#ff7a68', 30, 1.2);
      this.addSlash(f.x, f.y, angle, f.r * 2);
      this.flash = 1;
      this.flashColor = '255, 78, 40';
      this.shake = Math.max(this.shake, 24);
      this.sound.bomb();
    }

    chainMilestone() {
      const bonus = this.combo * 15;
      this.score += bonus;
      const at = this.lastSlice || { x: this.W / 2, y: this.H / 2 };
      this.addText(at.x, at.y - 50, `CHAIN ${this.combo}!  +${bonus}`, '#ffe27a', 23, 1.35);
      this.addRing(at.x, at.y, this.chainColor(), 105, 4, 0.65);
      this.addSurge(10);
      this.shake = Math.max(this.shake, 5.5);
      this.sound.milestone(this.combo);
    }

    loseHeart(reason) {
      if (this.hearts <= 0) return;
      this.hearts--;
      this.combo = 0;
      this.comboTimer = 0;
      this.lastSlice = null;
      this.shake = Math.max(this.shake, 12);
      this.flash = Math.max(this.flash, 0.65);
      this.flashColor = reason === 'bomb' ? '255, 80, 45' : '255, 60, 80';
      if (reason !== 'bomb') this.sound.miss();
      const hearts = this.heartsEl.querySelectorAll('.heart');
      if (hearts[this.hearts]) {
        hearts[this.hearts].classList.add('pulse');
        setTimeout(() => hearts[this.hearts] && hearts[this.hearts].classList.remove('pulse'), 500);
      }
      if (this.hearts <= 0) {
        this.dying = true;
        this.deathTimer = 1.15;
        this.sound.gameover();
      }
    }

    activateStorm() {
      if (this.state !== 'playing' || this.dying) return;
      if (this.stormTime > 0) return;
      if (this.surge < MAX_SURGE) {
        this.sound.deny();
        this.shake = Math.max(this.shake, 3);
        return;
      }
      this.surge = 0;
      this.surgeAnnounced = false;
      this.stormTime = STORM_TIME;
      this.stormZapTimer = 0.1;
      this.stormBoltTimer = 0.05;
      this.stormLast = null;
      this.flash = 0.85;
      this.flashColor = '120, 210, 255';
      this.shake = Math.max(this.shake, 10);
      this.addText(this.W / 2, this.H * 0.36, 'CHAIN STORM!', '#c8f7ff', 36, 1.6);
      this.addRing(this.W / 2, this.H * 0.52, '#7fe7ff', Math.max(this.W, this.H) * 0.6, 7, 0.9);
      this.sound.storm();
    }

    /* --------------------------- game update --------------------------- */

    get difficulty() {
      return clamp(this.elapsed / 140, 0, 1);
    }

    frame(now) {
      const dt = clamp((now - this.last) / 1000, 0, 0.05);
      this.last = now;
      this.tick(dt);
      if (window.Renderer) window.Renderer.render(this);
      requestAnimationFrame(this.frame);
    }

    tick(dt) {
      this.time += dt;
      this.updateEmbers(dt);
      this.shake = this.shake > 0.05 ? this.shake * Math.exp(-dt * 6.5) : 0;
      this.flash = Math.max(0, this.flash - dt * 2.4);

      if (this.state === 'playing') this.updateGame(dt);
      else if (this.state === 'gameover') this.updateWorld(dt * 0.55, false);

      for (const [id, st] of this.pointers) {
        if (!st.down) {
          st.trail = st.trail.filter((pt) => this.time - pt.t <= TRAIL_TIME);
          if (this.time - (st.upAt || 0) > 0.45) this.pointers.delete(id);
        }
      }
      this.updateHud(false);
    }

    updateGame(dt) {
      const worldDt = this.dying ? dt * 0.33 : dt;
      this.elapsed += dt;

      if (!this.dying) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnWave();
          this.spawnTimer = (1.25 - 0.7 * this.difficulty) * rand(0.8, 1.2);
        }
        for (const p of this.pending) p.delay -= dt;
        const ready = this.pending.filter((p) => p.delay <= 0);
        this.pending = this.pending.filter((p) => p.delay > 0);
        for (const p of ready) this.spawnFruit(p.type);
      }

      if (this.stormTime > 0 && !this.dying) this.updateStorm(dt);

      if (!this.dying && this.stormTime <= 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0 && this.combo > 0) {
          const lost = this.combo;
          const at = this.lastSlice;
          this.combo = 0;
          this.comboTimer = 0;
          this.lastSlice = null;
          if (lost >= 4 && at) {
            this.addText(at.x, at.y - 18, 'CHAIN LOST', '#9db4d8', 15, 0.9);
            this.sound.tone(330, 0.2, 'triangle', 0.05, 210);
          }
        }
      }

      this.updateWorld(worldDt, !this.dying);

      if (this.dying) {
        this.deathTimer -= dt;
        if (this.deathTimer <= 0) this.finishGame();
      }
    }

    updateStorm(dt) {
      this.stormTime -= dt;
      this.comboTimer = COMBO_WINDOW;
      this.stormZapTimer -= dt;
      this.stormBoltTimer -= dt;
      if (this.stormBoltTimer <= 0) {
        this.addBolt(
          { x: rand(0, this.W), y: -30 },
          { x: rand(0, this.W), y: rand(this.H * 0.25, this.H * 0.85) },
          '#9feeff', 1.7, 0.22
        );
        this.stormBoltTimer = rand(0.18, 0.5);
      }
      if (this.stormZapTimer <= 0) {
        this.stormZapTimer = 0.21;
        this.stormZap();
      }
      if (this.stormTime <= 0) {
        this.stormTime = 0;
        this.stormLast = null;
        this.addText(this.W / 2, this.H * 0.42, 'STORM ENDED', '#9feeff', 20, 1);
      }
    }

    stormZap() {
      const candidates = this.fruits.filter((f) => !f.dead && f.type !== 'bomb' && f.y > -60 && f.y < this.H * 1.02);
      if (candidates.length) {
        const f = pick(candidates);
        const from = this.stormLast ? { ...this.stormLast } : { x: rand(0, this.W), y: -40 };
        this.addBolt(from, { x: f.x, y: f.y }, '#a9f4ff', 3.2, 0.5);
        this.stormLast = { x: f.x, y: f.y };
        this.sliceFruit(f, rand(0, TAU), { storm: true });
        this.sound.zap();
        this.shake = Math.max(this.shake, 2);
      } else if (this.fruits.length < 4 && Math.random() < 0.7) {
        this.spawnFruit(pick(FRUIT_KEYS));
      }
    }

    updateWorld(dt, allowMiss) {
      const G = 1300 * this.scale;
      for (const f of this.fruits) {
        if (f.dead) continue;
        f.vy += G * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.rot += f.vr * dt;
        if (f.y > this.H + f.r * 2.2 && f.vy > 0) {
          f.dead = true;
          if (allowMiss && f.type !== 'bomb' && f.type !== 'golden' && this.stormTime <= 0 && this.elapsed > this.grace) {
            this.loseHeart('miss');
            this.addText(clamp(f.x, 48, this.W - 48), this.H - 78, 'MISS', '#ff8a9a', 16, 0.9);
          }
        } else if (f.y < -this.H || f.x < -this.W * 0.4 || f.x > this.W * 1.4) {
          f.dead = true;
        }
      }
      if (this.fruits.some((f) => f.dead)) this.fruits = this.fruits.filter((f) => !f.dead);

      const hg = 1150 * this.scale;
      for (const h of this.halves) {
        h.vy += hg * dt;
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        h.rot += h.vr * dt;
        h.life -= dt;
      }
      this.halves = this.halves.filter((h) => h.life > 0 && h.y < this.H + h.r * 4);

      for (const p of this.particles) {
        p.vy += p.gravity * dt;
        p.vx *= 1 - 0.6 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.shape === 'streak') p.rot = Math.atan2(p.vy, p.vx);
      }
      this.particles = this.particles.filter((p) => p.life > 0);

      for (const b of this.bolts) b.life -= dt;
      this.bolts = this.bolts.filter((b) => b.life > 0);

      for (const t of this.texts) {
        t.y += t.vy * dt;
        t.vy *= 1 - 1.4 * dt;
        t.life -= dt;
      }
      this.texts = this.texts.filter((t) => t.life > 0);

      for (const r of this.rings) {
        r.r += r.speed * dt;
        r.life -= dt;
      }
      this.rings = this.rings.filter((r) => r.life > 0);

      for (const s of this.slashes) s.life -= dt;
      this.slashes = this.slashes.filter((s) => s.life > 0);
    }

    spawnWave() {
      if (this.fruits.length > 15) return;
      const d = this.difficulty;
      let count = 1;
      if (Math.random() < 0.32 + d * 0.33) count = 2;
      if (d > 0.4 && Math.random() < 0.14 + d * 0.2) count = 3;
      for (let i = 0; i < count; i++) this.pending.push({ delay: i * rand(0.1, 0.26) });
    }

    spawnFruit(forcedType, prelaunch = false) {
      if (this.fruits.length > 18) return;
      let type = forcedType;
      if (!type) {
        const d = this.difficulty;
        const bombChance = this.elapsed < 7 ? 0 : 0.055 + d * 0.14;
        const roll = Math.random();
        if (roll < bombChance) type = 'bomb';
        else if (roll < bombChance + 0.035) type = 'golden';
        else type = pick(FRUIT_KEYS);
      }
      const baseR = type === 'bomb' ? 31 : type === 'golden' ? 28 : FRUITS[type].r;
      const r = baseR * this.scale * rand(0.94, 1.06);
      const x = rand(this.W * 0.14, this.W * 0.86);
      const y = prelaunch ? this.H * rand(0.78, 0.92) : this.H + r + 8;
      const targetY = prelaunch ? rand(this.H * 0.08, this.H * 0.24) : rand(this.H * 0.16, this.H * 0.46);
      const g = 1300 * this.scale;
      const vy = -Math.sqrt(2 * g * Math.max(70, y - targetY));
      const timeToPeak = -vy / g;
      const aimX = this.W * 0.5 + rand(-0.3, 0.3) * this.W;
      const vx = clamp((aimX - x) / timeToPeak, -560 * this.scale, 560 * this.scale);
      this.fruits.push({
        type, x, y, vx, vy, r,
        rot: rand(0, TAU), vr: rand(-2.6, 2.6), dead: false
      });
    }

    /* ----------------------------- effects ----------------------------- */

    addText(x, y, text, color = '#fff', size = 16, life = 1) {
      this.texts.push({ x, y, text, color, size, life, maxLife: life, vy: -46 });
    }

    addRing(x, y, color, maxR, width = 3, life = 0.55) {
      this.rings.push({ x, y, r: 8, maxR, color, width, life, maxLife: life, speed: maxR / life });
    }

    addBolt(a, b, color = '#7fe7ff', width = 2, life = 0.28) {
      this.bolts.push({ a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y }, color, width, life, maxLife: life });
      if (this.bolts.length > 22) this.bolts.shift();
    }

    addSlash(x, y, angle, len) {
      this.slashes.push({ x, y, angle, len, life: 0.16, maxLife: 0.16, color: this.chainColor() });
    }

    addJuice(x, y, color, count = 12) {
      for (let i = 0; i < count; i++) {
        const a = rand(0, TAU);
        const sp = rand(50, 280) * this.scale;
        this.particles.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 60 * this.scale,
          r: rand(2, 6.5) * this.scale,
          color,
          life: rand(0.38, 0.9),
          maxLife: 0.9,
          gravity: 900 * this.scale,
          shape: i % 5 === 0 ? 'streak' : 'circle',
          rot: a
        });
      }
    }

    addSparks(x, y, color, count) {
      for (let i = 0; i < count; i++) {
        const a = rand(0, TAU);
        const sp = rand(120, 400) * this.scale;
        this.particles.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          r: rand(1.5, 3.2) * this.scale,
          color,
          life: rand(0.14, 0.36),
          maxLife: 0.36,
          gravity: 240 * this.scale,
          shape: 'streak',
          rot: a
        });
      }
    }

    addBombExplosion(x, y) {
      const colors = ['#ff5a3c', '#ffb347', '#ffe28a', '#ffffff', '#ff7f50'];
      for (let i = 0; i < 34; i++) {
        const a = rand(0, TAU);
        const sp = rand(80, 520) * this.scale;
        this.particles.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          r: rand(2, 7) * this.scale,
          color: pick(colors),
          life: rand(0.35, 1.05),
          maxLife: 1.05,
          gravity: 520 * this.scale,
          shape: i % 4 === 0 ? 'streak' : 'circle',
          rot: a
        });
      }
      this.addRing(x, y, '#ff9a55', 220, 6, 0.7);
      this.addRing(x, y, '#fff0b0', 120, 3, 0.45);
    }

    spawnHalves(f, angle) {
      const def = FRUITS[f.type] || FRUITS.apple;
      const px = -Math.sin(angle);
      const py = Math.cos(angle);
      for (const side of [-1, 1]) {
        const sp = rand(145, 300) * this.scale;
        this.halves.push({
          type: f.type,
          r: f.r,
          side,
          x: f.x + px * side * f.r * 0.26,
          y: f.y + py * side * f.r * 0.26,
          vx: f.vx * 0.28 + px * side * sp,
          vy: f.vy * 0.2 + py * side * sp - 80 * this.scale,
          rot: angle,
          vr: rand(-4.2, 4.2),
          life: 3.8,
          maxLife: 3.8,
          color: def.juice
        });
      }
    }

    /* ------------------------------- HUD ------------------------------- */

    updateHud(force) {
      if (this.state === 'menu') return;

      const target = this.score || 0;
      this.displayScore += (target - this.displayScore) * 0.24;
      if (Math.abs(target - this.displayScore) < 0.7) this.displayScore = target;
      const shown = Math.round(this.displayScore);
      if (force || this._lastScoreShown !== shown) {
        this.scoreEl.textContent = shown.toLocaleString();
        this._lastScoreShown = shown;
      }
      const bestShown = Math.max(this.best, target).toLocaleString();
      if (force || this._lastBestShown !== bestShown) {
        this.bestHudEl.textContent = bestShown;
        this._lastBestShown = bestShown;
      }

      const active = this.state === 'playing' && this.combo >= 2;
      this.comboEl.classList.toggle('show', active);
      const color = this.chainColor();
      this.hud.style.setProperty('--chain', color);
      if (active) {
        const mult = this.multiplier() * (this.stormTime > 0 ? 2 : 1);
        const multText = Number.isInteger(mult) ? '×' + mult : '×' + mult.toFixed(1);
        this.comboMultEl.textContent = multText;
        this.comboCountEl.textContent = this.combo + ' CHAIN';
        const progress = this.stormTime > 0 ? 1 : clamp(this.comboTimer / COMBO_WINDOW, 0, 1);
        this.comboRingEl.style.strokeDashoffset = String(201.06 * (1 - progress));
      }

      const hearts = this.heartsEl.querySelectorAll('.heart');
      hearts.forEach((h, i) => h.classList.toggle('lost', i >= this.hearts));
      if (this._lastHearts !== this.hearts) {
        this._lastHearts = this.hearts;
        this.heartsEl.setAttribute('aria-label', this.hearts + (this.hearts === 1 ? ' life left' : ' lives left'));
      }

      const storming = this.stormTime > 0;
      const pct = storming ? (this.stormTime / STORM_TIME) * 100 : this.surge;
      this.stormFillEl.style.width = pct.toFixed(1) + '%';
      this.stormPctEl.textContent = storming ? Math.ceil(this.stormTime) + 's' : Math.floor(this.surge) + '%';
      this.stormLabelEl.textContent = storming ? 'CHAIN STORM ACTIVE' : 'CHAIN STORM';
      this.stormBtnEl.classList.toggle('ready', !storming && this.surge >= MAX_SURGE && this.state === 'playing');
      this.stormBtnEl.classList.toggle('storming', storming);
      this.stormBtnTextEl.textContent = storming ? 'STORMING' : this.surge >= MAX_SURGE ? 'UNLEASH' : 'STORM';
    }

    updateEmbers(dt) {
      for (const e of this.embers) {
        e.y -= e.vy * dt;
        e.x += (e.vx + Math.sin(this.time * 0.7 + e.phase) * 8) * dt;
        if (e.y < -10) {
          e.y = this.H + 10;
          e.x = rand(0, this.W);
        }
        if (e.x < -10) e.x = this.W + 10;
        if (e.x > this.W + 10) e.x = -10;
      }
    }
  }

  window.ChainNinja = new Game();
})();
