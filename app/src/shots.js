// Fixed scenes for screenshots: ?shot=editor shows the editor with sample photos
// loaded; ?shot=cover shows the finished cover alone; ?shot=wide shows a wide
// 1920x1080 cover. `photo`/`photo2` pick samples, `caption` the title,
// `layout` and `grade` pick the look. window.__shotReady is set once painted.
import { loadImage } from './main.js';

function sampleUrl(name) {
  return `samples/${name || 'pier'}.jpg`;
}

export async function runShot(shot, query, apply) {
  const title = query.get('caption') ?? 'Sunset Heist';
  const photoA = await loadImage(sampleUrl(query.get('photo')));
  const photoB = await loadImage(sampleUrl(query.get('photo2') ?? 'boulevard'));
  if (shot === 'cover' || shot === 'wide') document.body.classList.add('shot-cover');
  const photos = [photoA, photoB, photoA, photoB];
  await apply(photos, title);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
