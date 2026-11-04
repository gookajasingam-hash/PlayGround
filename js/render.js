(() => {
  'use strict';

  const { TAU, clamp, FRUITS, drawFruitBody, drawBomb, drawHalf } = window.Art;

  function boltPoints(a, b, jag = 0.16) {
    const pts = [{ x: a.x, y: a.y }];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const seg = Math.max(4, Math.min(12, Math.round(len / 46)));
    for (let i = 1; i < seg; i++) {
      const t = i / seg;
      const off = (Math.random() * 2 - 1) * len * jag * (0.3 + Math.sin(t * Math.PI) * 0.9);
      pts.push({ x: a.x + dx * t + nx * off, y: a.y + dy * t + ny * off });
    }
    pts.push({ x: b.x, y: b.y });
    return pts;
  }

  function pathPoints(g, pts) {
    g.beginPath();
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) g.moveTo(pts[i].x, pts[i].y);
      else g.lineTo(pts[i].x, pts[i].y);
    }
  }

  function drawBolts(g, game) {
    if (!game.bolts.length) return;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.lineJoin = 'round';
    g.lineCap = 'round';
    for (const b of game.bolts) {
      const alpha = clamp(b.life / b.maxLife, 0, 1);
      const pts = boltPoints(b.a, b.b);
      pathPoints(g, pts);
      g.globalAlpha = alpha * 0.4;
      g.strokeStyle = b.color;
      g.lineWidth = b.width * 3.1;
      g.shadowColor = b.color;
      g.shadowBlur = 18;
      g.stroke();
      pathPoints(g, pts);
      g.globalAlpha = alpha;
      g.lineWidth = b.width;
      g.strokeStyle = 'rgba(255,255,255,.95)';
      g.shadowBlur = 9;
      g.stroke();
    }
    g.restore();
  }

  function drawEmbers(g, game) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const e of game.embers) {
      const a = e.alpha * (0.55 + 0.45 * Math.sin(game.time * 1.7 + e.phase));
      g.fillStyle = `hsla(${e.hue}, 100%, 66%, ${a})`;
      g.beginPath();
      g.arc(e.x, e.y, e.r, 0, TAU);
      g.fill();
      if (e.r > 1.6) {
        g.fillStyle = `hsla(${e.hue}, 100%, 78%, ${a * 0.25})`;
        g.beginPath();
        g.arc(e.x, e.y, e.r * 3.4, 0, TAU);
        g.fill();
      }
    }
    g.restore();
  }

  function drawFruits(g, game) {
    for (const f of game.fruits) {
      g.save();
      g.translate(f.x, f.y);
      g.rotate(f.rot);
      if (f.type === 'bomb') drawBomb(g, f.r, game.time);
      else drawFruitBody(g, f.type, f.r, game.time);
      g.restore();
    }
  }

  function drawHalves(g, game) {
    for (const h of game.halves) {
      const alpha = clamp(h.life / 0.85, 0, 1);
      g.save();
      g.globalAlpha = alpha;
      g.translate(h.x, h.y);
      g.rotate(h.rot);
      drawHalf(g, h.type, h.r, h.side, game.time);
      g.restore();
    }
  }

  function drawParticles(g, game) {
    for (const p of game.particles) {
      const a = clamp(p.life / 0.35, 0, 1);
      g.globalAlpha = a;
      if (p.shape === 'streak') {
        g.strokeStyle = p.color;
        g.lineWidth = Math.max(1, p.r * 0.75);
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(p.x, p.y);
        g.lineTo(p.x - p.vx * 0.018, p.y - p.vy * 0.018);
        g.stroke();
      } else {
        g.fillStyle = p.color;
        g.beginPath();
        g.arc(p.x, p.y, p.r, 0, TAU);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }

  function drawRings(g, game) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const r of game.rings) {
      const a = clamp(r.life / r.maxLife, 0, 1);
      g.globalAlpha = a * 0.85;
      g.strokeStyle = r.color;
      g.lineWidth = Math.max(1, r.width * a);
      g.shadowColor = r.color;
      g.shadowBlur = 16;
      g.beginPath();
      g.arc(r.x, r.y, Math.min(r.r, r.maxR), 0, TAU);
      g.stroke();
    }
    g.restore();
  }

  function drawSlashes(g, game) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    for (const s of game.slashes) {
      const a = clamp(s.life / s.maxLife, 0, 1);
      const dx = Math.cos(s.angle);
      const dy = Math.sin(s.angle);
      g.globalAlpha = a * 0.45;
      g.strokeStyle = s.color;
      g.lineWidth = 7;
      g.shadowColor = s.color;
      g.shadowBlur = 18;
      g.beginPath();
      g.moveTo(s.x - dx * s.len * 0.5, s.y - dy * s.len * 0.5);
      g.lineTo(s.x + dx * s.len * 0.5, s.y + dy * s.len * 0.5);
      g.stroke();
      g.globalAlpha = a;
      g.strokeStyle = 'rgba(255,255,255,.95)';
      g.lineWidth = 2;
      g.shadowBlur = 8;
      g.stroke();
    }
    g.restore();
  }

  function drawTexts(g, game) {
    g.save();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const t of game.texts) {
      const a = clamp(t.life / Math.min(0.5, t.maxLife), 0, 1);
      const age = 1 - t.life / t.maxLife;
      const pop = age < 0.14 ? 1 + (1 - age / 0.14) * 0.4 : 1;
      g.globalAlpha = a;
      g.save();
      g.translate(t.x, t.y);
      g.scale(pop, pop);
      g.font = `900 ${t.size}px "Trebuchet MS", "Segoe UI", sans-serif`;
      g.lineWidth = Math.max(2.5, t.size * 0.17);
      g.strokeStyle = 'rgba(10, 4, 14, .55)';
      g.lineJoin = 'round';
      g.strokeText(t.text, 0, 0);
      g.fillStyle = t.color;
      g.fillText(t.text, 0, 0);
      g.restore();
    }
    g.restore();
  }

  function drawTrail(g, game) {
    if (!game.pointers.size) return;
    const color = game.chainColor();
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const st of game.pointers.values()) {
      const pts = st.trail.filter((p) => game.time - p.t <= 0.3);
      if (pts.length < 2) continue;
      const left = [];
      const right = [];
      for (let i = 0; i < pts.length; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[Math.min(pts.length - 1, i + 1)];
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const age = clamp((game.time - pts[i].t) / 0.3, 0, 1);
        const along = pts.length > 1 ? i / (pts.length - 1) : 1;
        const w = (1 - age) * 10 * (0.35 + along * 0.65) + 1;
        left.push({ x: pts[i].x + nx * w, y: pts[i].y + ny * w });
        right.push({ x: pts[i].x - nx * w, y: pts[i].y - ny * w });
      }
      g.beginPath();
      g.moveTo(left[0].x, left[0].y);
      for (let i = 1; i < left.length; i++) g.lineTo(left[i].x, left[i].y);
      for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i].x, right[i].y);
      g.closePath();
      g.globalAlpha = 0.34;
      g.fillStyle = color;
      g.shadowColor = color;
      g.shadowBlur = 18;
      g.fill();

      g.globalAlpha = 0.9;
      g.strokeStyle = 'rgba(255,255,255,.9)';
      g.lineWidth = 2.2;
      g.shadowBlur = 10;
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.stroke();
    }
    g.restore();
  }

  function drawSword(g, game) {
    if (!game.cursor.visible || game.state !== 'playing' || game.cursor.type !== 'mouse') return;
    const c = game.cursor;
    const color = game.chainColor();
    g.save();
    g.translate(c.x, c.y);
    g.rotate(c.angle);

    g.shadowColor = color;
    g.shadowBlur = 14;
    const blade = g.createLinearGradient(-58, 0, 0, 0);
    blade.addColorStop(0, '#8fa0b5');
    blade.addColorStop(0.35, '#e8f2ff');
    blade.addColorStop(0.78, '#ffffff');
    blade.addColorStop(1, '#cfe8ff');
    g.beginPath();
    g.moveTo(1, 0);
    g.lineTo(-14, -4.2);
    g.lineTo(-50, -4.2);
    g.lineTo(-58, 0);
    g.lineTo(-50, 4.2);
    g.lineTo(-14, 4.2);
    g.closePath();
    g.fillStyle = blade;
    g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(255,255,255,.9)';
    g.lineWidth = 1;
    g.stroke();

    g.fillStyle = '#d9a33a';
    g.fillRect(-62, -10, 5, 20);
    g.fillStyle = '#3a2419';
    g.fillRect(-77, -4.5, 15, 9);
    g.fillStyle = 'rgba(255,220,160,.4)';
    for (let i = 0; i < 3; i++) g.fillRect(-74 + i * 4.4, -4.5, 1.5, 9);
    g.fillStyle = '#d9a33a';
    g.beginPath();
    g.arc(-80, 0, 4.4, 0, TAU);
    g.fill();
    g.restore();
  }

  function drawDanger(g, game) {
    if (game.hearts > 1 || game.state !== 'playing') return;
    const pulse = 0.55 + 0.45 * Math.sin(game.time * 4.2);
    const grad = g.createRadialGradient(game.W / 2, game.H / 2, Math.min(game.W, game.H) * 0.28, game.W / 2, game.H / 2, Math.max(game.W, game.H) * 0.72);
    grad.addColorStop(0, 'rgba(255, 30, 45, 0)');
    grad.addColorStop(0.75, `rgba(255, 30, 45, ${0.03 + pulse * 0.035})`);
    grad.addColorStop(1, `rgba(255, 20, 40, ${0.12 + pulse * 0.1})`);
    g.fillStyle = grad;
    g.fillRect(0, 0, game.W, game.H);
  }

  function drawStorm(g, game) {
    if (game.stormTime <= 0) return;
    const pulse = 0.5 + 0.5 * Math.sin(game.time * 9);
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = `rgba(60, 130, 255, ${0.035 + pulse * 0.02})`;
    g.fillRect(0, 0, game.W, game.H);
    const top = g.createLinearGradient(0, 0, 0, game.H * 0.5);
    top.addColorStop(0, `rgba(120, 220, 255, ${0.12 + pulse * 0.06})`);
    top.addColorStop(1, 'rgba(120, 220, 255, 0)');
    g.fillStyle = top;
    g.fillRect(0, 0, game.W, game.H * 0.5);
    g.restore();
  }

  function render(game) {
    const g = game.ctx;
    const W = game.W;
    const H = game.H;
    g.save();
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#08050d';
    g.fillRect(0, 0, W, H);

    const shake = game.shake;
    const sx = shake ? (Math.random() * 2 - 1) * shake : 0;
    const sy = shake ? (Math.random() * 2 - 1) * shake : 0;
    g.save();
    g.translate(sx, sy);
    if (game.bg) {
      g.drawImage(game.bg, -game.bgMargin, -game.bgMargin, W + game.bgMargin * 2, H + game.bgMargin * 2);
    }
    drawEmbers(g, game);
    drawStorm(g, game);
    drawFruits(g, game);
    drawHalves(g, game);
    drawParticles(g, game);
    drawBolts(g, game);
    drawSlashes(g, game);
    drawRings(g, game);
    drawTexts(g, game);
    drawTrail(g, game);
    drawSword(g, game);
    g.restore();

    drawDanger(g, game);

    if (game.flash > 0.001) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(${game.flashColor}, ${clamp(game.flash, 0, 1) * 0.3})`;
      g.fillRect(0, 0, W, H);
      g.restore();
    }
    g.restore();
  }

  window.Renderer = { render, boltPoints };
})();
