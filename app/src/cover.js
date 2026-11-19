// Vice Sunset cover engine: draws a multi-panel GTA-style poster cover onto any
// 2D canvas. All art is drawn in code (gradients, vector palms, bold system
// lettering) — no Rockstar logo, artwork or font is used anywhere.
export const LAYOUTS = {
  trio: {
    label: 'Trio — 3 panels',
    panels: [
      { x: 0.0, y: 0.0, w: 0.36, h: 0.78, slant: 0.03 },
      { x: 0.34, y: 0.0, w: 0.34, h: 0.78, slant: 0.03 },
      { x: 0.66, y: 0.0, w: 0.34, h: 0.78, slant: 0.03 },
    ],
  },
  duo: {
    label: 'Duo — 2 panels',
    panels: [
      { x: 0.0, y: 0.0, w: 0.52, h: 0.78, slant: 0.04 },
      { x: 0.48, y: 0.0, w: 0.52, h: 0.78, slant: 0.04 },
    ],
  },
  quad: {
    label: 'Quad — 4 panels',
    panels: [
      { x: 0.0, y: 0.0, w: 0.5, h: 0.39, slant: 0.02 },
      { x: 0.5, y: 0.0, w: 0.5, h: 0.39, slant: 0.02 },
      { x: 0.0, y: 0.39, w: 0.5, h: 0.39, slant: 0.02 },
      { x: 0.5, y: 0.39, w: 0.5, h: 0.39, slant: 0.02 },
    ],
  },
  hero: {
    label: 'Hero — big + 2 small',
    panels: [
      { x: 0.0, y: 0.0, w: 0.62, h: 0.78, slant: 0.03 },
      { x: 0.62, y: 0.0, w: 0.38, h: 0.39, slant: 0.03 },
      { x: 0.62, y: 0.39, w: 0.38, h: 0.39, slant: 0.03 },
    ],
  },
};

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.08) sepia(0.18) hue-rotate(-8deg)',
    top: 'rgba(255, 122, 26, 0.10)',
    bottom: 'rgba(214, 36, 120, 0.55)',
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.6) contrast(1.18) hue-rotate(18deg) brightness(0.96)',
    top: 'rgba(0, 229, 255, 0.16)',
    bottom: 'rgba(255, 0, 153, 0.55)',
  },
  palm: {
    label: 'Palm Pink',
    filter: 'saturate(1.5) contrast(1.05) sepia(0.1) hue-rotate(-25deg)',
    top: 'rgba(255, 94, 168, 0.14)',
    bottom: 'rgba(124, 58, 237, 0.5)',
  },
  noir: {
    label: 'Noir Nights',
    filter: 'saturate(0.35) contrast(1.25) brightness(0.92)',
    top: 'rgba(120, 140, 255, 0.10)',
    bottom: 'rgba(10, 10, 40, 0.6)',
  },
};

export const SIZES = {
  square: { label: '1080 × 1080 · Square post', w: 1080, h: 1080 },
  portrait: { label: '1080 × 1350 · Portrait post', w: 1080, h: 1350 },
  wide: { label: '1920 × 1080 · Wide / story', w: 1920, h: 1080 },
};

/** A fresh per-panel transform: zoom (1 = cover-fit), pan offsets in panel fractions. */
export function freshTransform() {
  return { zoom: 1, dx: 0, dy: 0 };
}

/** The polygon of a slanted panel, in canvas pixels. */
export function panelPolygon(panel, w, h) {
  const x = panel.x * w;
  const y = panel.y * h;
  const pw = panel.w * w;
  const ph = panel.h * h;
  const s = (panel.slant || 0) * w;
  return [
    [x + s, y],
    [x + pw, y],
    [x + pw - s, y + ph],
    [x, y + ph],
  ];
}

/** Draws one photo into a panel clip, cover-fit with the panel transform applied. */
export function drawPanelPhoto(ctx, photo, panel, transform, w, h, grade) {
  const poly = panelPolygon(panel, w, h);
  ctx.save();
  ctx.beginPath();
  poly.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.closePath();
  ctx.clip();
  const x = panel.x * w;
  const y = panel.y * h;
  const pw = panel.w * w;
  const ph = panel.h * h;
  if (photo) {
    const scale = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight) * transform.zoom;
    const iw = photo.naturalWidth * scale;
    const ih = photo.naturalHeight * scale;
    ctx.filter = grade.filter;
    ctx.drawImage(
      photo,
      x + (pw - iw) / 2 + transform.dx * pw,
      y + (ph - ih) / 2 + transform.dy * ph,
      iw,
      ih,
    );
    ctx.filter = 'none';
  } else {
    const g = ctx.createLinearGradient(x, y, x + pw, y + ph);
    g.addColorStop(0, '#3b1d5a');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, pw, ph);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `700 ${Math.round(ph * 0.07)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', x + pw / 2, y + ph / 2);
  }
  const tint = ctx.createLinearGradient(0, y, 0, y + ph);
  tint.addColorStop(0, grade.top);
  tint.addColorStop(1, grade.bottom);
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, pw, ph);
  const vig = ctx.createRadialGradient(
    x + pw / 2, y + ph / 2, Math.min(pw, ph) * 0.35,
    x + pw / 2, y + ph / 2, Math.max(pw, ph) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(x, y, pw, ph);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  poly.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.closePath();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, w * 0.006);
  ctx.stroke();
  ctx.restore();
}

/** A vector palm silhouette, drawn in code — trunk plus seven fronds. */
export function drawPalm(ctx, cx, baseY, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.06;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, baseY);
  ctx.quadraticCurveTo(cx + size * 0.08, baseY - size * 0.55, cx + size * 0.22, baseY - size * 0.95);
  ctx.stroke();
  const topX = cx + size * 0.22;
  const topY = baseY - size * 0.95;
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * (0.08 + i * 0.14)) - Math.PI / 2 + Math.PI * 0.12;
    const len = size * (0.5 - Math.abs(i - 3) * 0.05);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + size * 0.22;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + (ex - topX) * 0.5, topY + (ey - topY) * 0.4 - size * 0.12, ex, ey);
    ctx.lineWidth = size * 0.045;
    ctx.stroke();
  }
  ctx.restore();
}

/** Bold poster lettering: gradient fill, dark outline, hard drop shadow. */
export function drawPosterTitle(ctx, text, cx, baselineY, maxWidth, size) {
  const words = text.trim().toUpperCase();
  if (!words) return;
  let s = size;
  const stack = '"Arial Black", "Helvetica Neue", Impact, system-ui, sans-serif';
  ctx.font = `900 ${s}px ${stack}`;
  while (ctx.measureText(words).width > maxWidth && s > 16) {
    s -= 2;
    ctx.font = `900 ${s}px ${stack}`;
  }
  const grad = ctx.createLinearGradient(0, baselineY - s, 0, baselineY);
  grad.addColorStop(0, '#fff7d6');
  grad.addColorStop(0.45, '#ffb347');
  grad.addColorStop(1, '#ff2e88');
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = s * 0.08;
  ctx.lineJoin = 'round';
  ctx.lineWidth = s * 0.09;
  ctx.strokeStyle = '#1a0526';
  ctx.strokeText(words, cx, baselineY);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = grad;
  ctx.fillText(words, cx, baselineY);
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` (any size) from the app state:
 * panels, grade, title, subtitle and tagline.
 */
export function drawCoverArt(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const layout = LAYOUTS[state.layout] || LAYOUTS.trio;
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);
  layout.panels.forEach((panel, i) => {
    drawPanelPhoto(ctx, state.photos[i] || null, panel, state.transforms[i] || freshTransform(), w, h, grade);
  });
  const bandY = h * 0.78;
  const band = ctx.createLinearGradient(0, bandY, 0, h);
  band.addColorStop(0, '#2a0a4a');
  band.addColorStop(0.45, '#7a1048');
  band.addColorStop(1, '#ff5e3a');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, h - bandY);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(0, bandY, w, Math.max(3, h * 0.004));
  const sunR = h * 0.055;
  const sunX = w * 0.88;
  const sunY = bandY + (h - bandY) * 0.42;
  const sun = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sun.addColorStop(0, '#ffe259');
  sun.addColorStop(1, '#ff7518');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(42,10,74,0.85)';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(sunX - sunR, sunY + sunR * (0.1 + i * 0.28), sunR * 2, sunR * 0.09);
  }
  drawPalm(ctx, w * 0.06, h * 0.995, h * 0.16, 'rgba(18,4,32,0.9)');
  drawPalm(ctx, w * 0.13, h * 0.995, h * 0.11, 'rgba(18,4,32,0.75)');
  const titleSize = h * 0.115;
  drawPosterTitle(ctx, state.title, w * 0.5, bandY + (h - bandY) * 0.52, w * 0.8, titleSize);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${Math.round(h * 0.024)}px system-ui, sans-serif`;
  const sub = (state.subtitle || '').trim().toUpperCase();
  if (sub) ctx.fillText(sub, w * 0.5, bandY + (h - bandY) * 0.75);
  ctx.font = `600 ${Math.round(h * 0.016)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  const tag = (state.tagline || '').trim().toUpperCase();
  if (tag) ctx.fillText(tag, w * 0.5, bandY + (h - bandY) * 0.91);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(4, w * 0.005);
  ctx.strokeRect(w * 0.008, h * 0.008, w * 0.984, h * 0.984);
}
