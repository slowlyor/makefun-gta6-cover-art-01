// cover.js — the cover art engine for Vice Cover Studio.
//
// Everything here draws on a plain 2D canvas with the Node/browser standard
// library only. A cover is a set of photo panels in a layout, a colour grade,
// and a big title block with a neon subtitle. All artwork is drawn by this
// file (or by the procedural sample photos in samples.js): no Rockstar logo,
// no official artwork, no game font.

export const SIZES = {
  square: { label: 'Square · 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide · 1920 x 1080', w: 1920, h: 1080 },
};

export const LAYOUTS = {
  hero: { label: 'Hero + three', blurb: 'One big hero panel over three strips, the classic poster cover.' },
  grid: { label: 'Four panel grid', blurb: 'Two by two panels with a title band across the bottom.' },
  full: { label: 'Full bleed', blurb: 'One photo edge to edge, title block laid over it.' },
  nine: { label: 'Nine panel grid', blurb: 'Three by three panels with the title in the middle cell.' },
};

export const GRADES = {
  sunset: { label: 'Vice Sunset', sky: ['#ff9a3d', '#ff5e7a', '#7b2fbe'], tint: '#ff7a45', deep: '#2b1055' },
  neon: { label: 'Neon Night', sky: ['#ff2ea6', '#7b2ff7', '#00e5ff'], tint: '#ff2ea6', deep: '#0b1035' },
  gold: { label: 'Golden Hour', sky: ['#ffd166', '#ff8c42', '#c1440e'], tint: '#ffb347', deep: '#3d1c02' },
  noir: { label: 'Teal Noir', sky: ['#2ec4b6', '#118ab2', '#073b4c'], tint: '#2ec4b6', deep: '#04141f' },
};

// Panel rectangles for a layout, as fractions of the cover (x, y, w, h).
// kind "photo" holds a photo; kind "title" is the title block cell.
export function layoutPanels(layoutId, w, h) {
  const g = 0.012 * Math.min(w, h); // gutter in px
  const P = (x, y, pw, ph, kind = 'photo') => ({ x, y, w: pw, h: ph, kind });
  switch (layoutId) {
    case 'grid': {
      const bandH = h * 0.2;
      const cw = (w - g * 3) / 2;
      const ch = (h - bandH - g * 3) / 2;
      return [
        P(g, g, cw, ch), P(g * 2 + cw, g, cw, ch),
        P(g, g * 2 + ch, cw, ch), P(g * 2 + cw, g * 2 + ch, cw, ch),
        P(0, h - bandH, w, bandH, 'title'),
      ];
    }
    case 'full':
      return [P(0, 0, w, h), P(0, h * 0.62, w, h * 0.38, 'title')];
    case 'nine': {
      const cw = (w - g * 4) / 3;
      const ch = (h - g * 4) / 3;
      const cells = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const x = g + c * (cw + g);
          const y = g + r * (ch + g);
          cells.push(r === 1 && c === 1 ? P(x, y, cw, ch, 'title') : P(x, y, cw, ch));
        }
      }
      return cells;
    }
    case 'hero':
    default: {
      const heroH = h * 0.5;
      const stripH = h * 0.16;
      const titleH = h - heroH - stripH - g * 4;
      const sw = (w - g * 4) / 3;
      return [
        P(g, g, w - g * 2, heroH),
        P(g, heroH + g * 2, sw, stripH),
        P(g * 2 + sw, heroH + g * 2, sw, stripH),
        P(g * 3 + sw * 2, heroH + g * 2, sw, stripH),
        P(g, heroH + stripH + g * 3, w - g * 2, titleH, 'title'),
      ];
    }
  }
}

export function panelCount(layoutId) {
  return layoutPanels(layoutId, 100, 100).filter((p) => p.kind === 'photo').length;
}

// Draw one photo into a panel rect, cover-fit, with the panel's zoom and pan.
export function drawPhotoPanel(ctx, img, rect, zoom, ox, oy) {
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * (zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (ox || 0);
  const dy = rect.y + (rect.h - dh) / 2 + (oy || 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// A sunset/neon colour grade: warm highlights, cool shadows, a soft tint.
export function applyGrade(ctx, rect, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = sky;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  // Vignette: darken the panel edges so the photos feel printed.
  const vg = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,5,30,0.38)');
  ctx.fillStyle = vg;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

// Film grain: a sparse scatter of light and dark specks.
export function addGrain(ctx, w, h, amount = 0.05) {
  const n = Math.floor((w * h) / 9000);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${amount})` : `rgba(0,0,0,${amount})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  ctx.restore();
}

// Halftone dots fading out of a band — the printed-poster feel.
export function addHalftone(ctx, rect, colour = 'rgba(255,255,255,0.16)') {
  ctx.save();
  ctx.fillStyle = colour;
  const step = Math.max(10, rect.h / 14);
  for (let y = rect.y + step / 2; y < rect.y + rect.h; y += step) {
    const fade = 1 - (y - rect.y) / rect.h;
    for (let x = rect.x + step / 2; x < rect.x + rect.w; x += step) {
      const r = step * 0.22 * fade + 0.6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

const HEAVY = '"Arial Black", "Liberation Sans", "DejaVu Sans", Impact, sans-serif';

// Fit a one-line title into a width by shrinking the font size.
function fitFont(ctx, text, maxW, startPx, weight = 900) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${HEAVY}`;
  while (px > 24 && ctx.measureText(text).width > maxW) {
    px -= 4;
    ctx.font = `${weight} ${px}px ${HEAVY}`;
  }
  return px;
}

// Big condensed poster lettering: gradient fill, thick dark outline, hard shadow.
export function drawTitleText(ctx, text, cx, cy, maxW, px, grade) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(cx, cy);
  ctx.scale(0.86, 1); // condense, the poster look
  const size = fitFont(ctx, text, maxW / 0.86, px);
  const grad = ctx.createLinearGradient(0, -size * 0.55, 0, size * 0.55);
  grad.addColorStop(0, '#fff7e0');
  grad.addColorStop(0.45, grade.sky[0]);
  grad.addColorStop(1, grade.sky[1]);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20,5,40,0.95)';
  ctx.lineWidth = size * 0.14;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);
  // A thin hot highlight along the top edge of the letters.
  ctx.lineWidth = size * 0.02;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.strokeText(text, 0, -size * 0.02);
  ctx.restore();
  return size;
}

// Neon script subtitle: italic, glowing, in the grade's hot colour.
export function drawSubtitleText(ctx, text, cx, cy, maxW, px, grade) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `italic 800 ${px}px "Liberation Sans", "DejaVu Sans", sans-serif`;
  let size = px;
  while (size > 18 && ctx.measureText(text).width > maxW) {
    size -= 3;
    ctx.font = `italic 800 ${size}px "Liberation Sans", "DejaVu Sans", sans-serif`;
  }
  ctx.shadowColor = grade.sky[0];
  ctx.shadowBlur = size * 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, cx, cy);
  ctx.shadowBlur = 0;
  ctx.fillStyle = grade.sky[0];
  ctx.globalAlpha = 0.9;
  ctx.fillText(text, cx, cy);
  ctx.restore();
  return size;
}

// The title block: a deep gradient band, halftone, subtitle over title,
// and a small badge ribbon naming the made-up coast.
export function drawTitleBlock(ctx, rect, title, subtitle, grade, badge) {
  const band = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  band.addColorStop(0, grade.deep);
  band.addColorStop(1, '#12041f');
  ctx.fillStyle = band;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  addHalftone(ctx, { x: rect.x, y: rect.y, w: rect.w, h: rect.h * 0.5 });
  // Neon rule lines above and below the block.
  ctx.fillStyle = grade.sky[0];
  ctx.fillRect(rect.x, rect.y, rect.w, Math.max(3, rect.h * 0.02));
  ctx.fillStyle = grade.sky[2];
  ctx.fillRect(rect.x, rect.y + rect.h - Math.max(3, rect.h * 0.02), rect.w, Math.max(3, rect.h * 0.02));

  const pad = rect.w * 0.04;
  const cx = rect.x + rect.w / 2;
  if (subtitle) {
    drawSubtitleText(ctx, subtitle, cx, rect.y + rect.h * 0.26, rect.w - pad * 2, rect.h * 0.2, grade);
  }
  const titleY = subtitle ? rect.y + rect.h * 0.62 : rect.y + rect.h * 0.52;
  drawTitleText(ctx, title, cx, titleY, rect.w - pad * 2, rect.h * (subtitle ? 0.42 : 0.55), grade);

  if (badge) {
    const bw = Math.min(rect.w * 0.34, ctx.measureText(badge).width + rect.h * 0.3);
    const bh = rect.h * 0.16;
    const bx = rect.x + rect.w - bw - pad;
    const by = rect.y + rect.h - bh - pad * 0.5;
    ctx.save();
    ctx.fillStyle = grade.sky[1];
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw - bh * 0.5, by + bh);
    ctx.lineTo(bx, by + bh);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${Math.round(bh * 0.52)}px "Liberation Sans", "DejaVu Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, bx + bw / 2 - bh * 0.2, by + bh / 2 + 1);
    ctx.restore();
  }
}

// Draw the whole cover onto ctx at the given size from the editor state.
// state: { layout, grade, title, subtitle, badge, panels: [{img, zoom, ox, oy}] }
export function drawCover(ctx, state, w, h) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const panels = layoutPanels(state.layout, w, h);
  const photoPanels = panels.filter((p) => p.kind === 'photo');
  const titlePanel = panels.find((p) => p.kind === 'title');

  // Backdrop: deep dusk so gutters read as ink, not white.
  ctx.fillStyle = '#160a2e';
  ctx.fillRect(0, 0, w, h);

  photoPanels.forEach((rect, i) => {
    const panel = state.panels[i] || {};
    if (panel.img) {
      drawPhotoPanel(ctx, panel.img, rect, panel.zoom ?? 1, panel.ox ?? 0, panel.oy ?? 0);
    } else {
      // Empty panel: a painted sunset placeholder so the cover still reads.
      const g2 = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      g2.addColorStop(0, grade.sky[0]);
      g2.addColorStop(0.6, grade.sky[1]);
      g2.addColorStop(1, grade.sky[2]);
      ctx.fillStyle = g2;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, rect.y + rect.h * 0.38, rect.w * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `800 ${Math.round(rect.h * 0.07)}px "Liberation Sans", "DejaVu Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h * 0.72);
    }
    applyGrade(ctx, rect, grade);
  });

  if (titlePanel) {
    if (state.layout === 'full') {
      // Full bleed: title sits on a translucent dusk band over the photo.
      ctx.save();
      ctx.globalAlpha = 0.82;
      drawTitleBlock(ctx, titlePanel, state.title, state.subtitle, grade, state.badge);
      ctx.restore();
    } else {
      drawTitleBlock(ctx, titlePanel, state.title, state.subtitle, grade, state.badge);
    }
  } else {
    // Hero layout has no title cell: the title rides the bottom strip area.
    const bandH = h * 0.17;
    drawTitleBlock(ctx, { x: 0, y: h - bandH, w, h: bandH }, state.title, state.subtitle, grade, state.badge);
  }

  addGrain(ctx, w, h, 0.045);
}
