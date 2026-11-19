// samples.js — four sample photos drawn procedurally on canvas.
//
// These are original illustrations made by this file's own drawing code, so
// the screenshots can show a loaded photo without using a real person's
// picture or any game artwork. Each returns an HTMLCanvasElement sized
// 900 x 900 that the editor treats exactly like an uploaded photo.

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function palm(ctx, x, y, s, lean = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = '#1d0f2e';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -70, 6, -140);
  ctx.stroke();
  // Fronds: drooping blades fanning out from the crown.
  ctx.fillStyle = '#1d0f2e';
  for (let i = 0; i < 8; i++) {
    const ang = -Math.PI * (0.05 + i * 0.115);
    const len = 62 + (i % 3) * 9;
    const tx = Math.cos(ang) * len;
    const ty = Math.sin(ang) * len * 0.55 - 14;
    ctx.save();
    ctx.translate(6, -140);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(tx * 0.5, ty - 28, tx, ty);
    ctx.quadraticCurveTo(tx * 0.5, ty + 12, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Coconuts at the crown.
  ctx.beginPath();
  ctx.arc(-2, -132, 7, 0, Math.PI * 2);
  ctx.arc(12, -128, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function sun(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 2.2);
  g.addColorStop(0, 'rgba(255,214,120,0.95)');
  g.addColorStop(0.35, 'rgba(255,150,80,0.55)');
  g.addColorStop(1, 'rgba(255,120,90,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function skyline(ctx, w, y0, h, colour) {
  ctx.fillStyle = colour;
  let x = 0;
  while (x < w) {
    const bw = 46 + Math.random() * 90;
    const bh = h * (0.35 + Math.random() * 0.6);
    ctx.fillRect(x, y0 - bh, bw, bh);
    // Lit windows.
    ctx.fillStyle = 'rgba(255,214,120,0.85)';
    for (let wy = y0 - bh + 12; wy < y0 - 14; wy += 22) {
      for (let wx = x + 8; wx < x + bw - 10; wx += 20) {
        if (Math.random() > 0.55) ctx.fillRect(wx, wy, 7, 10);
      }
    }
    ctx.fillStyle = colour;
    x += bw + 6;
  }
}

// 1. Boulevard: a vintage convertible on a palm-lined boulevard at golden hour.
export function sampleBoulevard() {
  const c = canvas(900, 900);
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.45, '#ff5e7a');
  sky.addColorStop(0.8, '#ff9a3d');
  sky.addColorStop(1, '#ffd166');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 900, 400);
  sun(ctx, 450, 280, 85);
  // Distant palms along the horizon.
  palm(ctx, 90, 400, 1.1, -0.08);
  palm(ctx, 830, 410, 1.25, 0.1);
  palm(ctx, 690, 390, 0.8, -0.05);
  // Road.
  ctx.fillStyle = '#241533';
  ctx.fillRect(0, 400, 900, 500);
  ctx.fillStyle = '#ffd166';
  for (let x = 20; x < 900; x += 120) ctx.fillRect(x, 745, 62, 8);
  // Convertible silhouette, centred vertically so wide crops keep it.
  ctx.fillStyle = '#c1123b';
  ctx.beginPath();
  ctx.moveTo(150, 500);
  ctx.lineTo(210, 440);
  ctx.lineTo(430, 428);
  ctx.lineTo(560, 440);
  ctx.lineTo(760, 460);
  ctx.lineTo(780, 500);
  ctx.lineTo(760, 512);
  ctx.lineTo(170, 512);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1d0f2e';
  ctx.beginPath();
  ctx.arc(290, 512, 52, 0, Math.PI * 2);
  ctx.arc(640, 512, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(290, 512, 20, 0, Math.PI * 2);
  ctx.arc(640, 512, 20, 0, Math.PI * 2);
  ctx.fill();
  // Driver silhouette with sunglasses.
  ctx.fillStyle = '#1d0f2e';
  ctx.beginPath();
  ctx.arc(420, 360, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(392, 392, 58, 52);
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(396, 352, 18, 8);
  ctx.fillRect(424, 352, 18, 8);
  return c;
}

// 2. Rooftop: a figure on a hotel rooftop at dusk, city skyline behind.
export function sampleRooftop() {
  const c = canvas(900, 900);
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 900);
  sky.addColorStop(0, '#0b1035');
  sky.addColorStop(0.5, '#7b2fbe');
  sky.addColorStop(0.8, '#ff5e7a');
  sky.addColorStop(1, '#ff9a3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 900, 900);
  sun(ctx, 690, 260, 55);
  skyline(ctx, 900, 640, 420, '#160a2e');
  palm(ctx, 120, 640, 1.0, -0.06);
  // Rooftop floor.
  ctx.fillStyle = '#1d0f2e';
  ctx.fillRect(0, 640, 900, 260);
  ctx.fillStyle = '#ff5e7a';
  ctx.fillRect(0, 640, 900, 6);
  // Figure: open shirt, gold chain, arms relaxed.
  ctx.fillStyle = '#0a0616';
  ctx.beginPath();
  ctx.arc(450, 420, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(450, 462);
  ctx.lineTo(360, 500);
  ctx.lineTo(350, 640);
  ctx.lineTo(550, 640);
  ctx.lineTo(540, 500);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(450, 500, 26, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Neon sign glow behind.
  ctx.fillStyle = '#ff2ea6';
  ctx.shadowColor = '#ff2ea6';
  ctx.shadowBlur = 34;
  ctx.font = 'italic 800 74px "Liberation Sans", "DejaVu Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ROOFTOP', 450, 240);
  ctx.shadowBlur = 0;
  return c;
}

// 3. Neon street: two friends laughing outside a diner, wet pavement.
export function sampleNeon() {
  const c = canvas(900, 900);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0b1035';
  ctx.fillRect(0, 0, 900, 900);
  // Diner facade.
  ctx.fillStyle = '#1d0f2e';
  ctx.fillRect(0, 0, 900, 520);
  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 30;
  ctx.fillRect(60, 90, 780, 14);
  ctx.fillRect(60, 420, 780, 14);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ff2ea6';
  ctx.shadowColor = '#ff2ea6';
  ctx.shadowBlur = 34;
  ctx.font = 'italic 800 92px "Liberation Sans", "DejaVu Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DINER', 450, 290);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffd166';
  ctx.font = '800 34px "Liberation Sans", "DejaVu Sans", sans-serif';
  ctx.fillText('OPEN ALL NIGHT', 450, 360);
  // Wet pavement with neon reflections.
  const wet = ctx.createLinearGradient(0, 520, 0, 900);
  wet.addColorStop(0, '#241533');
  wet.addColorStop(1, '#0b1035');
  ctx.fillStyle = wet;
  ctx.fillRect(0, 520, 900, 380);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ff2ea6';
  ctx.fillRect(180, 560, 60, 300);
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(660, 560, 60, 300);
  ctx.globalAlpha = 1;
  // Two laughing friends, silhouettes.
  for (const [x, tilt] of [[330, -0.12], [570, 0.12]]) {
    ctx.save();
    ctx.translate(x, 700);
    ctx.rotate(tilt);
    ctx.fillStyle = '#0a0616';
    ctx.beginPath();
    ctx.arc(0, -120, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -80);
    ctx.lineTo(-58, -40);
    ctx.lineTo(-48, 120);
    ctx.lineTo(48, 120);
    ctx.lineTo(58, -40);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  return c;
}

// 4. Pier: a fisherman on a wooden pier over turquoise water at sunrise.
export function samplePier() {
  const c = canvas(900, 900);
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 560);
  sky.addColorStop(0, '#ffd166');
  sky.addColorStop(0.55, '#ff8c42');
  sky.addColorStop(1, '#2ec4b6');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 900, 560);
  sun(ctx, 450, 300, 70);
  // Sea.
  const sea = ctx.createLinearGradient(0, 560, 0, 900);
  sea.addColorStop(0, '#2ec4b6');
  sea.addColorStop(1, '#073b4c');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 560, 900, 340);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 3;
  for (let y = 600; y < 880; y += 46) {
    ctx.beginPath();
    ctx.moveTo(60 + (y % 90), y);
    ctx.quadraticCurveTo(300 + (y % 120), y - 8, 840 - (y % 70), y);
    ctx.stroke();
  }
  // Pier planks.
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(330, 520, 240, 380);
  ctx.fillStyle = '#7a5230';
  for (let y = 520; y < 900; y += 34) ctx.fillRect(330, y, 240, 6);
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(310, 520, 18, 380);
  ctx.fillRect(572, 520, 18, 380);
  // Fisherman with bucket hat and rod.
  ctx.strokeStyle = '#1d0f2e';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(450, 430);
  ctx.quadraticCurveTo(620, 300, 700, 180);
  ctx.stroke();
  ctx.fillStyle = '#1d0f2e';
  ctx.beginPath();
  ctx.arc(450, 380, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(408, 352, 84, 10); // bucket hat brim
  ctx.fillRect(424, 322, 52, 32);
  ctx.beginPath();
  ctx.moveTo(450, 408);
  ctx.lineTo(400, 440);
  ctx.lineTo(396, 520);
  ctx.lineTo(504, 520);
  ctx.lineTo(500, 440);
  ctx.closePath();
  ctx.fill();
  return c;
}

export const SAMPLES = [
  { id: 'boulevard', label: 'Boulevard', make: sampleBoulevard },
  { id: 'rooftop', label: 'Rooftop', make: sampleRooftop },
  { id: 'neon', label: 'Neon street', make: sampleNeon },
  { id: 'pier', label: 'Pier', make: samplePier },
];
