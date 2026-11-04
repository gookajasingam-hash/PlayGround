(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  const FRUITS = {
    watermelon: { r: 41, skin: '#2f8f4e', dark: '#17582c', light: '#6cc97d', flesh: '#f3485c', fleshLight: '#ff96a1', juice: '#ff4a62', seeds: '#22101a' },
    orange:     { r: 33, skin: '#f28a1f', dark: '#b45a06', light: '#ffbe5c', flesh: '#ffab2e', fleshLight: '#ffdc8c', juice: '#ffa41f', seeds: '#c97e10' },
    apple:      { r: 34, skin: '#d93a44', dark: '#8e1a27', light: '#ff7d7a', flesh: '#ffe7ba', fleshLight: '#fff9e8', juice: '#ff6b6b', seeds: '#4a2a17' },
    lemon:      { r: 30, skin: '#f4c51c', dark: '#b58c05', light: '#ffec80', flesh: '#ffeb8f', fleshLight: '#fffcd2', juice: '#ffe34d', seeds: '#e6d47a' },
    kiwi:       { r: 31, skin: '#8a5a33', dark: '#59351b', light: '#bd8653', flesh: '#91c93d', fleshLight: '#d8f39a', juice: '#a5d84a', seeds: '#1d140c' },
    dragon:     { r: 35, skin: '#d63384', dark: '#90134c', light: '#ff83c0', flesh: '#fff6fa', fleshLight: '#ffffff', juice: '#ff5fae', seeds: '#2a1320' },
    golden:     { r: 29, skin: '#ffc93c', dark: '#bd8303', light: '#fff4b0', flesh: '#ffe066', fleshLight: '#fff9d0', juice: '#ffd84d', seeds: '#c99500' }
  };
  const FRUIT_KEYS = ['watermelon', 'orange', 'apple', 'lemon', 'kiwi', 'dragon'];

  function bodyGrad(g, d, r) {
    const gr = g.createRadialGradient(-r * 0.32, -r * 0.38, r * 0.05, 0, 0, r * 1.12);
    gr.addColorStop(0, d.light);
    gr.addColorStop(0.55, d.skin);
    gr.addColorStop(1, d.dark);
    return gr;
  }

  function drawStar(g, x, y, size, color, rot = 0, points = 4) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.fillStyle = color;
    g.beginPath();
    const inner = size * 0.32;
    for (let i = 0; i < points * 2; i++) {
      const rr = i % 2 ? inner : size;
      const a = (i * Math.PI) / points - Math.PI / 2;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
    g.restore();
  }

  function applePath(g, r) {
    g.beginPath();
    g.moveTo(0, -r * 0.7);
    g.bezierCurveTo(r * 0.42, -r * 1.06, r * 1.06, -r * 0.58, r * 0.92, r * 0.12);
    g.bezierCurveTo(r * 0.8, r * 0.88, r * 0.22, r * 1.03, 0, r * 0.94);
    g.bezierCurveTo(-r * 0.22, r * 1.03, -r * 0.8, r * 0.88, -r * 0.92, r * 0.12);
    g.bezierCurveTo(-r * 1.06, -r * 0.58, -r * 0.42, -r * 1.06, 0, -r * 0.7);
    g.closePath();
  }

  function leaf(g, x, y, size, rot, color) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.fillStyle = color || '#3d8a45';
    g.beginPath();
    g.ellipse(0, 0, size, size * 0.42, 0, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(15, 45, 18, .4)';
    g.lineWidth = Math.max(0.7, size * 0.09);
    g.beginPath();
    g.moveTo(-size * 0.8, 0);
    g.lineTo(size * 0.8, 0);
    g.stroke();
    g.restore();
  }

  function drawWatermelon(g, r) {
    g.beginPath(); g.arc(0, 0, r, 0, TAU);
    g.fillStyle = bodyGrad(g, FRUITS.watermelon, r); g.fill();
    g.save();
    g.beginPath(); g.arc(0, 0, r * 0.98, 0, TAU); g.clip();
    g.strokeStyle = 'rgba(9, 54, 25, .55)';
    g.lineWidth = r * 0.13;
    g.lineCap = 'round';
    for (let i = -2; i <= 2; i++) {
      const x = i * r * 0.34;
      g.beginPath();
      g.moveTo(x * 0.72, -r * 1.05);
      g.quadraticCurveTo(x * 1.75, 0, x * 0.72, r * 1.05);
      g.stroke();
    }
    g.fillStyle = 'rgba(255,255,255,.07)';
    for (let i = 0; i < 9; i++) {
      const a = i * 2.3;
      const rr = ((i * 13) % 10) / 10 * r * 0.8;
      g.beginPath(); g.arc(Math.cos(a) * rr, Math.sin(a) * rr, r * 0.035, 0, TAU); g.fill();
    }
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.2)';
    g.beginPath(); g.ellipse(-r * 0.33, -r * 0.4, r * 0.3, r * 0.15, -0.55, 0, TAU); g.fill();
    g.strokeStyle = '#385f2a'; g.lineWidth = r * 0.09; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-r * 0.04, -r * 0.97); g.quadraticCurveTo(r * 0.2, -r * 1.2, r * 0.34, -r * 1.06); g.stroke();
  }

  function drawOrange(g, r) {
    const d = FRUITS.orange;
    g.beginPath(); g.arc(0, 0, r, 0, TAU);
    g.fillStyle = bodyGrad(g, d, r); g.fill();
    g.save(); g.beginPath(); g.arc(0, 0, r * 0.97, 0, TAU); g.clip();
    g.fillStyle = 'rgba(120, 52, 0, .16)';
    for (let i = 0; i < 34; i++) {
      const a = i * 2.39996;
      const rr = Math.sqrt(((i * 7) % 34) / 34) * r * 0.88;
      g.beginPath(); g.arc(Math.cos(a) * rr, Math.sin(a) * rr, r * 0.028, 0, TAU); g.fill();
    }
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.22)';
    g.beginPath(); g.ellipse(-r * 0.34, -r * 0.42, r * 0.26, r * 0.14, -0.6, 0, TAU); g.fill();
    g.fillStyle = '#7a3f12';
    g.beginPath(); g.arc(0, -r * 0.96, r * 0.075, 0, TAU); g.fill();
    leaf(g, r * 0.34, -r * 0.98, r * 0.3, -0.42, '#3f8c3d');
  }

  function drawApple(g, r) {
    const d = FRUITS.apple;
    applePath(g, r);
    g.fillStyle = bodyGrad(g, d, r); g.fill();
    g.save(); applePath(g, r); g.clip();
    g.fillStyle = 'rgba(255,255,255,.2)';
    g.beginPath(); g.ellipse(-r * 0.34, -r * 0.34, r * 0.26, r * 0.38, -0.5, 0, TAU); g.fill();
    g.fillStyle = 'rgba(105, 9, 20, .22)';
    g.beginPath(); g.ellipse(r * 0.45, r * 0.2, r * 0.35, r * 0.6, 0.25, 0, TAU); g.fill();
    g.restore();
    g.strokeStyle = '#4a2a17'; g.lineWidth = r * 0.08; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, -r * 0.72); g.quadraticCurveTo(r * 0.08, -r * 1.08, r * 0.16, -r * 1.16); g.stroke();
    leaf(g, r * 0.42, -r * 1.02, r * 0.3, -0.38, '#398b40');
  }

  function drawLemon(g, r) {
    const d = FRUITS.lemon;
    g.beginPath();
    g.moveTo(-r * 0.98, 0);
    g.bezierCurveTo(-r * 0.68, -r * 0.88, r * 0.62, -r * 0.88, r * 0.98, 0);
    g.bezierCurveTo(r * 0.62, r * 0.88, -r * 0.68, r * 0.88, -r * 0.98, 0);
    g.closePath();
    g.fillStyle = bodyGrad(g, d, r); g.fill();
    g.save(); g.clip();
    g.fillStyle = 'rgba(150, 110, 0, .16)';
    for (let i = 0; i < 22; i++) {
      const a = i * 2.39996;
      const rr = Math.sqrt(((i * 5) % 22) / 22) * r * 0.8;
      g.beginPath(); g.arc(Math.cos(a) * rr * 1.05, Math.sin(a) * rr * 0.8, r * 0.03, 0, TAU); g.fill();
    }
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.26)';
    g.beginPath(); g.ellipse(-r * 0.3, -r * 0.32, r * 0.28, r * 0.11, -0.38, 0, TAU); g.fill();
    g.fillStyle = '#8a6b10';
    g.beginPath(); g.arc(r * 0.92, -r * 0.06, r * 0.06, 0, TAU); g.fill();
    leaf(g, -r * 0.08, -r * 0.78, r * 0.28, -0.7, '#4e913f');
  }

  function drawKiwi(g, r) {
    const d = FRUITS.kiwi;
    g.beginPath(); g.arc(0, 0, r, 0, TAU);
    g.fillStyle = bodyGrad(g, d, r); g.fill();
    g.save(); g.beginPath(); g.arc(0, 0, r * 0.96, 0, TAU); g.clip();
    for (let i = 0; i < 52; i++) {
      const a = i * 2.39996;
      const rr = Math.sqrt(((i * 11) % 52) / 52) * r * 0.95;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      g.strokeStyle = i % 3 ? 'rgba(58, 35, 16, .45)' : 'rgba(220, 180, 130, .3)';
      g.lineWidth = r * 0.018;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + r * 0.045, y - r * 0.035); g.stroke();
    }
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.16)';
    g.beginPath(); g.ellipse(-r * 0.35, -r * 0.4, r * 0.24, r * 0.12, -0.55, 0, TAU); g.fill();
  }

  function drawDragon(g, r) {
    const d = FRUITS.dragon;
    g.beginPath(); g.arc(0, 0, r, 0, TAU);
    g.fillStyle = bodyGrad(g, d, r); g.fill();
    for (let i = 0; i < 7; i++) {
      const a = i * (TAU / 7) + 0.22;
      const bx = Math.cos(a) * r * 0.72;
      const by = Math.sin(a) * r * 0.72;
      const tx = Math.cos(a) * r * 1.12;
      const ty = Math.sin(a) * r * 1.12;
      const px = Math.cos(a + Math.PI / 2) * r * 0.24;
      const py = Math.sin(a + Math.PI / 2) * r * 0.24;
      g.fillStyle = i % 2 ? '#79b94a' : '#5a9e37';
      g.beginPath();
      g.moveTo(bx + px, by + py);
      g.quadraticCurveTo((bx + tx) / 2 + px * 0.6, (by + ty) / 2 + py * 0.6, tx, ty);
      g.quadraticCurveTo((bx + tx) / 2 - px * 0.2, (by + ty) / 2 - py * 0.2, bx - px, by - py);
      g.closePath();
      g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,.22)';
    g.beginPath(); g.ellipse(-r * 0.32, -r * 0.42, r * 0.26, r * 0.14, -0.6, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.08)';
    for (let i = 0; i < 8; i++) {
      const a = i * 2.39996;
      const rr = r * (0.2 + ((i * 7) % 10) / 10 * 0.55);
      g.beginPath(); g.arc(Math.cos(a) * rr, Math.sin(a) * rr, r * 0.04, 0, TAU); g.fill();
    }
  }

  function drawGolden(g, r, time) {
    const d = FRUITS.golden;
    const pulse = 0.5 + 0.5 * Math.sin(time * 4);
    g.save();
    g.shadowColor = `rgba(255, 205, 80, ${0.55 + pulse * 0.3})`;
    g.shadowBlur = 20 + pulse * 12;
    g.beginPath(); g.arc(0, 0, r, 0, TAU);
    g.fillStyle = bodyGrad(g, d, r); g.fill();
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.5)';
    g.beginPath(); g.ellipse(-r * 0.32, -r * 0.4, r * 0.26, r * 0.13, -0.6, 0, TAU); g.fill();
    g.strokeStyle = `rgba(255, 235, 150, ${0.35 + pulse * 0.3})`;
    g.lineWidth = Math.max(1.2, r * 0.05);
    g.beginPath(); g.arc(0, 0, r * 1.16, 0, TAU); g.stroke();
    for (let i = 0; i < 4; i++) {
      const a = time * 2.2 + i * (TAU / 4);
      drawStar(g, Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45, r * (0.12 + 0.04 * pulse), '#fff3b8', a, 4);
    }
  }

  function drawFruitBody(g, type, r, time = 0) {
    switch (type) {
      case 'watermelon': drawWatermelon(g, r); break;
      case 'orange': drawOrange(g, r); break;
      case 'apple': drawApple(g, r); break;
      case 'lemon': drawLemon(g, r); break;
      case 'kiwi': drawKiwi(g, r); break;
      case 'dragon': drawDragon(g, r); break;
      case 'golden': drawGolden(g, r, time); break;
      default: drawOrange(g, r);
    }
  }

  function drawBomb(g, r, time) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 6);
    g.save();
    g.shadowColor = `rgba(255, 58, 40, ${0.35 + pulse * 0.3})`;
    g.shadowBlur = 18 + pulse * 12;
    const gr = g.createRadialGradient(-r * 0.4, -r * 0.45, r * 0.08, 0, 0, r * 1.1);
    gr.addColorStop(0, '#5b5662');
    gr.addColorStop(0.5, '#26212c');
    gr.addColorStop(1, '#09070e');
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = gr; g.fill();
    g.restore();
    g.strokeStyle = 'rgba(255, 90, 70, .35)';
    g.lineWidth = Math.max(1, r * 0.05);
    g.beginPath(); g.arc(0, 0, r * 1.1, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.14)';
    g.lineWidth = r * 0.06;
    g.beginPath(); g.arc(0, 0, r * 0.94, Math.PI * 1.05, Math.PI * 1.65); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.2)';
    g.beginPath(); g.ellipse(-r * 0.35, -r * 0.4, r * 0.2, r * 0.1, -0.6, 0, TAU); g.fill();
    g.strokeStyle = '#a97b45'; g.lineWidth = Math.max(1.5, r * 0.09); g.lineCap = 'round';
    g.beginPath();
    g.moveTo(r * 0.24, -r * 0.88);
    g.bezierCurveTo(r * 0.5, -r * 1.08, r * 0.35, -r * 1.32, r * 0.6, -r * 1.42);
    g.stroke();
    const sx = r * 0.62;
    const sy = -r * 1.45;
    const flick = 0.7 + Math.random() * 0.6;
    g.save();
    g.shadowColor = '#ffb42e'; g.shadowBlur = 14 * flick;
    drawStar(g, sx, sy, r * 0.2 * flick, '#ffe58a', time * 3, 4);
    g.fillStyle = '#ff8c1a';
    g.beginPath(); g.arc(sx, sy, r * 0.07 * flick, 0, TAU); g.fill();
    g.restore();
    g.fillStyle = 'rgba(255, 70, 50, .65)';
    g.fillRect(-r * 0.09, -r * 0.3, r * 0.18, r * 0.52);
    g.fillRect(-r * 0.09, r * 0.32, r * 0.18, r * 0.14);
  }

  function drawCutFace(g, type, r, dir, time) {
    const d = FRUITS[type];
    g.beginPath(); g.ellipse(0, 0, r * 0.94, r * 0.37, 0, 0, TAU);
    g.fillStyle = d.dark; g.fill();
    if (type === 'watermelon') {
      g.beginPath(); g.ellipse(0, 0, r * 0.87, r * 0.32, 0, 0, TAU);
      g.fillStyle = '#e9f3d5'; g.fill();
    }
    const gr = g.createRadialGradient(0, dir * r * 0.06, r * 0.04, 0, 0, r * 0.86);
    gr.addColorStop(0, d.fleshLight);
    gr.addColorStop(0.62, d.flesh);
    gr.addColorStop(1, d.flesh);
    g.beginPath(); g.ellipse(0, 0, r * 0.83, r * 0.29, 0, 0, TAU);
    g.fillStyle = gr; g.fill();
    g.save();
    g.beginPath(); g.ellipse(0, 0, r * 0.82, r * 0.28, 0, 0, TAU); g.clip();

    if (type === 'orange' || type === 'lemon') {
      g.strokeStyle = 'rgba(255,255,255,.3)';
      g.lineWidth = Math.max(0.8, r * 0.018);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        g.beginPath(); g.moveTo(0, 0);
        g.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.27); g.stroke();
      }
      g.fillStyle = 'rgba(255,255,255,.4)';
      g.beginPath(); g.ellipse(0, 0, r * 0.08, r * 0.035, 0, 0, TAU); g.fill();
    } else if (type === 'watermelon') {
      for (let i = 0; i < 5; i++) {
        const x = (i - 2) * r * 0.26;
        const y = dir * r * (0.13 + (i % 2) * 0.045);
        g.save(); g.translate(x, y); g.rotate(i * 0.7 + dir);
        g.fillStyle = d.seeds;
        g.beginPath(); g.ellipse(0, 0, r * 0.028, r * 0.05, 0, 0, TAU); g.fill();
        g.restore();
      }
    } else if (type === 'apple') {
      for (const sx of [-1, 1]) {
        g.save(); g.translate(sx * r * 0.12, dir * r * 0.12); g.rotate(sx * 0.4);
        g.fillStyle = d.seeds;
        g.beginPath(); g.ellipse(0, 0, r * 0.032, r * 0.055, 0, 0, TAU); g.fill();
        g.restore();
      }
    } else if (type === 'kiwi') {
      g.fillStyle = '#f5f7d8';
      g.beginPath(); g.ellipse(0, dir * r * 0.045, r * 0.18, r * 0.08, 0, 0, TAU); g.fill();
      g.fillStyle = d.seeds;
      for (let i = 0; i < 7; i++) {
        const x = (i - 3) * r * 0.19;
        const y = dir * r * 0.16 + Math.cos(i) * r * 0.02;
        g.beginPath(); g.ellipse(x, y, r * 0.022, r * 0.038, 0.3, 0, TAU); g.fill();
      }
    } else if (type === 'dragon') {
      g.fillStyle = d.seeds;
      for (let i = 0; i < 12; i++) {
        const a = i * 2.39996;
        const rr = Math.sqrt(((i * 5) % 12) / 12) * r * 0.72;
        g.beginPath(); g.arc(Math.cos(a) * rr, Math.sin(a) * rr * 0.32 + dir * r * 0.02, r * 0.022, 0, TAU); g.fill();
      }
    } else if (type === 'golden') {
      for (let i = 0; i < 5; i++) {
        const a = i * 1.9 + time;
        drawStar(g, Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.16 + dir * r * 0.02, r * 0.07, '#fff8d0', a, 4);
      }
    }
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.12)';
    g.lineWidth = Math.max(0.7, r * 0.02);
    g.beginPath(); g.ellipse(0, 0, r * 0.9, r * 0.335, 0, 0, TAU); g.stroke();
  }

  function drawHalf(g, type, r, side, time) {
    g.save();
    g.beginPath();
    if (side < 0) g.rect(-r * 1.5, -r * 1.55, r * 3, r * 1.55);
    else g.rect(-r * 1.5, 0, r * 3, r * 1.55);
    g.clip();
    drawFruitBody(g, type, r, time);
    drawCutFace(g, type, r, side, time);
    g.restore();
  }

  /* -------- animated night-dojo background -------- */

  function buildBackground(W, H, dpr) {
    const M = 44;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round((W + M * 2) * dpr));
    c.height = Math.max(1, Math.round((H + M * 2) * dpr));
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    g.translate(M, M);

    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#140b23');
    sky.addColorStop(0.32, '#231027');
    sky.addColorStop(0.62, '#2a1525');
    sky.addColorStop(0.86, '#150b19');
    sky.addColorStop(1, '#08050d');
    g.fillStyle = sky;
    g.fillRect(-M, -M, W + M * 2, H + M * 2);

    // stars
    for (let i = 0; i < 110; i++) {
      const x = rand(-M, W + M);
      const y = rand(-M, H * 0.58);
      const s = rand(0.5, 1.5);
      g.fillStyle = `rgba(255, 242, 215, ${rand(0.08, 0.5)})`;
      g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
    }

    // moon
    const mx = W * 0.76;
    const my = H * 0.19;
    const mr = Math.min(W, H) * 0.1;
    const glow = g.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 4.4);
    glow.addColorStop(0, 'rgba(255, 228, 178, .22)');
    glow.addColorStop(0.35, 'rgba(255, 190, 130, .08)');
    glow.addColorStop(1, 'rgba(255, 160, 90, 0)');
    g.fillStyle = glow;
    g.beginPath(); g.arc(mx, my, mr * 4.4, 0, TAU); g.fill();
    const moon = g.createRadialGradient(mx - mr * 0.3, my - mr * 0.35, mr * 0.1, mx, my, mr);
    moon.addColorStop(0, '#fff8de');
    moon.addColorStop(0.7, '#ffe9bd');
    moon.addColorStop(1, '#e8c58c');
    g.fillStyle = moon;
    g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill();
    g.fillStyle = 'rgba(190, 150, 100, .12)';
    g.beginPath(); g.arc(mx - mr * 0.28, my + mr * 0.2, mr * 0.2, 0, TAU); g.fill();
    g.beginPath(); g.arc(mx + mr * 0.3, my - mr * 0.12, mr * 0.13, 0, TAU); g.fill();
    g.beginPath(); g.arc(mx + mr * 0.05, my + mr * 0.45, mr * 0.09, 0, TAU); g.fill();

    // soft clouds
    for (let i = 0; i < 5; i++) {
      const y = H * (0.14 + i * 0.07);
      const x = W * (0.12 + i * 0.21);
      g.fillStyle = `rgba(80, 40, 70, ${0.05 + i * 0.012})`;
      g.beginPath();
      g.ellipse(x, y, W * 0.22, H * 0.018, 0.01, 0, TAU);
      g.fill();
    }

    // mountain layers
    function ridge(baseY, amp, color, seed) {
      g.beginPath();
      g.moveTo(-M, H + M);
      g.lineTo(-M, baseY);
      const steps = 9;
      for (let i = 0; i <= steps; i++) {
        const x = -M + ((W + M * 2) / steps) * i;
        const y = baseY - (Math.sin(i * 1.7 + seed) * 0.5 + 0.5) * amp - Math.sin(i * 0.6 + seed * 2) * amp * 0.18;
        if (i === 0) g.lineTo(x, y);
        else {
          const px = -M + ((W + M * 2) / steps) * (i - 1);
          const py = baseY - (Math.sin((i - 1) * 1.7 + seed) * 0.5 + 0.5) * amp - Math.sin((i - 1) * 0.6 + seed * 2) * amp * 0.18;
          g.quadraticCurveTo((px + x) / 2, Math.min(py, y) - amp * 0.12, x, y);
        }
      }
      g.lineTo(W + M, H + M);
      g.closePath();
      g.fillStyle = color;
      g.fill();
    }
    ridge(H * 0.66, H * 0.13, '#231126', 1.4);
    ridge(H * 0.74, H * 0.11, '#1a0c1f', 3.2);
    ridge(H * 0.84, H * 0.08, '#110811', 5.7);

    // torii gate silhouette
    const tx = W * 0.17;
    const ty = H * 0.76;
    const th = H * 0.1;
    g.fillStyle = 'rgba(33, 13, 24, .85)';
    g.fillRect(tx - th * 0.36, ty - th, th * 0.11, th);
    g.fillRect(tx + th * 0.25, ty - th, th * 0.11, th);
    g.fillRect(tx - th * 0.52, ty - th * 0.98, th * 1.04, th * 0.07);
    g.fillRect(tx - th * 0.44, ty - th * 0.78, th * 0.88, th * 0.05);
    g.beginPath();
    g.moveTo(tx - th * 0.6, ty - th * 1.02);
    g.quadraticCurveTo(tx, ty - th * 1.12, tx + th * 0.6, ty - th * 1.02);
    g.lineTo(tx + th * 0.54, ty - th * 0.95);
    g.quadraticCurveTo(tx, ty - th * 1.03, tx - th * 0.54, ty - th * 0.95);
    g.closePath(); g.fill();

    // bamboo silhouettes
    function bamboo(x, scale, alpha) {
      g.strokeStyle = `rgba(14, 38, 27, ${alpha})`;
      for (let s = 0; s < 3; s++) {
        const bx = x + (s - 1) * 16 * scale;
        const lean = (s - 1) * 12;
        g.lineWidth = (5 + s * 2) * scale;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(bx, H + M);
        g.quadraticCurveTo(bx + lean * 0.3, H * 0.55, bx + lean, -M);
        g.stroke();
        for (let n = 0; n < 5; n++) {
          const yy = H * (0.2 + n * 0.15);
          const xx = bx + lean * (1 - yy / H) * 0.5;
          g.lineWidth = 1.6 * scale;
          g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx - 20 * scale, yy - 8 * scale); g.stroke();
          g.beginPath(); g.moveTo(xx, yy + 4); g.lineTo(xx + 22 * scale, yy - 4 * scale); g.stroke();
          g.fillStyle = `rgba(17, 45, 31, ${alpha})`;
          g.beginPath();
          g.ellipse(xx - 26 * scale, yy - 10 * scale, 15 * scale, 3.6 * scale, -0.4, 0, TAU);
          g.fill();
          g.beginPath();
          g.ellipse(xx + 27 * scale, yy - 6 * scale, 15 * scale, 3.6 * scale, 0.35, 0, TAU);
          g.fill();
        }
      }
    }
    bamboo(W * 0.035, 1.05, 0.75);
    bamboo(W * 0.965, 1.15, 0.72);

    // hanging lanterns
    function lantern(x, y, s, hue) {
      g.strokeStyle = 'rgba(15, 8, 16, .8)';
      g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x, -M); g.lineTo(x, y - s * 0.5); g.stroke();
      const glow = g.createRadialGradient(x, y, s * 0.15, x, y, s * 2.6);
      glow.addColorStop(0, `rgba(255, 170, 80, ${hue})`);
      glow.addColorStop(0.5, `rgba(255, 120, 50, ${hue * 0.35})`);
      glow.addColorStop(1, 'rgba(255, 90, 40, 0)');
      g.fillStyle = glow;
      g.beginPath(); g.arc(x, y, s * 2.6, 0, TAU); g.fill();
      g.fillStyle = '#2a1114';
      g.fillRect(x - s * 0.2, y - s * 0.56, s * 0.4, s * 0.12);
      g.fillRect(x - s * 0.2, y + s * 0.44, s * 0.4, s * 0.12);
      const lg = g.createRadialGradient(x - s * 0.2, y - s * 0.2, s * 0.1, x, y, s * 0.6);
      lg.addColorStop(0, '#ffd9a0');
      lg.addColorStop(0.45, '#ff9b4d');
      lg.addColorStop(1, '#b8402a');
      g.fillStyle = lg;
      g.beginPath();
      g.ellipse(x, y, s * 0.44, s * 0.55, 0, 0, TAU);
      g.fill();
      g.strokeStyle = 'rgba(80, 20, 15, .35)';
      g.lineWidth = 1;
      for (let i = -1; i <= 1; i++) {
        g.beginPath(); g.ellipse(x, y, s * 0.44 * (0.55 + i * 0.22), s * 0.55, 0, 0, TAU); g.stroke();
      }
    }
    lantern(W * 0.11, H * 0.13, Math.min(W, H) * 0.028, 0.5);
    lantern(W * 0.9, H * 0.1, Math.min(W, H) * 0.023, 0.42);

    // bottom haze
    const haze = g.createLinearGradient(0, H * 0.62, 0, H + M);
    haze.addColorStop(0, 'rgba(7, 4, 11, 0)');
    haze.addColorStop(0.72, 'rgba(7, 4, 11, .5)');
    haze.addColorStop(1, 'rgba(4, 2, 7, .92)');
    g.fillStyle = haze;
    g.fillRect(-M, H * 0.62, W + M * 2, H * 0.38 + M);

    // foreground grass
    for (let i = 0; i < 40; i++) {
      const x = rand(-M, W + M);
      const h = rand(8, 34);
      g.strokeStyle = `rgba(9, 20, 14, ${rand(0.4, 0.8)})`;
      g.lineWidth = rand(1, 2.4);
      g.beginPath();
      g.moveTo(x, H + M);
      g.quadraticCurveTo(x + rand(-8, 8), H + M - h * 0.6, x + rand(-16, 16), H + M - h);
      g.stroke();
    }

    // grain
    for (let i = 0; i < 380; i++) {
      const x = rand(-M, W + M);
      const y = rand(-M, H + M);
      g.fillStyle = `rgba(255, 240, 220, ${rand(0.01, 0.035)})`;
      g.fillRect(x, y, 1, 1);
    }

    // vignette
    const vig = g.createRadialGradient(W * 0.5, H * 0.46, Math.min(W, H) * 0.28, W * 0.5, H * 0.46, Math.max(W, H) * 0.78);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(0.7, 'rgba(2, 1, 5, .26)');
    vig.addColorStop(1, 'rgba(2, 1, 5, .7)');
    g.fillStyle = vig;
    g.fillRect(-M, -M, W + M * 2, H + M * 2);

    return { canvas: c, margin: M };
  }

  window.Art = {
    TAU, clamp, rand, pick, FRUITS, FRUIT_KEYS,
    bodyGrad, drawStar, drawFruitBody, drawBomb, drawHalf, drawCutFace,
    buildBackground
  };
})();
