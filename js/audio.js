(() => {
  'use strict';

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.noiseBuffer = null;
      this.enabled = true;
    }

    ensure() {
      if (!this.enabled) return;
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
        const len = Math.floor(this.ctx.sampleRate * 1);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuffer = buf;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    }

    get ready() {
      return this.enabled && this.ctx && this.ctx.state === 'running';
    }

    setEnabled(on) {
      this.enabled = on;
      if (on) this.ensure();
      if (this.master) this.master.gain.value = on ? 0.5 : 0;
    }

    tone(freq, dur, type = 'sine', vol = 0.15, slideTo = null, delay = 0) {
      if (!this.ready) return;
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }

    noise(dur = 0.09, vol = 0.15, type = 'highpass', f0 = 2000, f1 = null, q = 1, delay = 0) {
      if (!this.ready || !this.noiseBuffer) return;
      const t0 = this.ctx.currentTime + delay;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = type;
      filter.Q.value = q;
      filter.frequency.setValueAtTime(f0, t0);
      if (f1) filter.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(t0);
      src.stop(t0 + dur + 0.03);
    }

    slice(chain = 0) {
      if (!this.ready) return;
      const c = Math.min(chain, 26);
      this.noise(0.085, 0.14, 'highpass', 1700 + c * 65, 7200 + c * 120, 0.8);
      this.tone(480 + c * 26, 0.065, 'triangle', 0.055, 1080 + c * 46);
    }

    multi(count) {
      if (!this.ready) return;
      const base = 620 + count * 95;
      this.tone(base, 0.1, 'triangle', 0.08, base * 1.6, 0.01);
      this.noise(0.12, 0.1, 'bandpass', 2600, 5200, 1.4);
    }

    milestone(chain) {
      if (!this.ready) return;
      const base = 520 + Math.min(chain, 30) * 12;
      [1, 1.25, 1.5, 2].forEach((m, i) => this.tone(base * m, 0.16, 'triangle', 0.075, null, i * 0.055));
      this.noise(0.28, 0.12, 'bandpass', 900, 5200, 1.2);
    }

    bomb() {
      if (!this.ready) return;
      this.noise(0.55, 0.45, 'lowpass', 900, 70, 0.9);
      this.tone(140, 0.6, 'sawtooth', 0.3, 36);
      this.tone(70, 0.8, 'sine', 0.35, 28);
    }

    miss() {
      if (!this.ready) return;
      this.tone(190, 0.22, 'sine', 0.16, 68);
      this.noise(0.1, 0.05, 'lowpass', 500, 120, 0.8);
    }

    gold() {
      if (!this.ready) return;
      [880, 1174, 1568, 2093].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.08, f * 1.02, i * 0.06));
      this.noise(0.2, 0.08, 'highpass', 5000, 9000, 1);
    }

    zap() {
      if (!this.ready) return;
      this.noise(0.1, 0.16, 'highpass', 3500, 1800, 0.9);
      this.tone(1500, 0.09, 'square', 0.045, 180);
    }

    storm() {
      if (!this.ready) return;
      this.noise(0.9, 0.28, 'bandpass', 260, 5200, 1.6);
      this.tone(150, 0.85, 'sawtooth', 0.13, 780);
      [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.06, null, 0.12 + i * 0.08));
    }

    gameover() {
      if (!this.ready) return;
      [392, 311, 247, 165].forEach((f, i) => this.tone(f, 0.32, 'triangle', 0.12, f * 0.94, i * 0.18));
      this.noise(0.7, 0.08, 'lowpass', 900, 90, 0.7, 0.5);
    }

    ui() {
      if (!this.ready) return;
      this.tone(760, 0.06, 'triangle', 0.06, 980);
    }

    deny() {
      if (!this.ready) return;
      this.tone(220, 0.08, 'square', 0.04, 160);
    }
  }

  window.SoundEngine = SoundEngine;
})();
