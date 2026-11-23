// Uçtan uca deneme (CLAUDE.md §10): gerçek Chrome'da (headless, GPU açık) siteyi açar ve 3D / yedek sayfa
// davranışını CDP (Chrome DevTools Protocol) ile sınar. Vitest'in dışında: tarayıcı ve çalışan bir sunucu ister.
//
// Kullanım (PowerShell, proje klasörü):
//   npx astro preview --port 4400            (ayrı pencerede, önce `npm run build`)
//   node scripts/uctan-uca.mjs http://localhost:4400 [görüntü klasörü] [ad öneki]
// Görüntü klasörü verilirse ekran görüntüleri oraya <önek>-<ne>.png adıyla yazılır.
// Her denetim ✓ / ✗ yazar; bir tane bile ✗ varsa çıkış kodu 1.
//
// Ortam: CHROME değişkeni Chrome'un yolunu değiştirir (varsayılan Windows yolu).

import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SITE = (process.argv[2] ?? 'http://localhost:4400').replace(/\/$/, '');
const GORSEL = process.argv[3];
const ONEK = process.argv[4] ?? 'uctan-uca';
const CHROME = process.env.CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9371;

// ── Ölçütler (CLAUDE.md §2.2, §4.2) ──
const CLS_SINIR = 0.05;
const MAVI_ORAN_SINIR = 0.001; // kroma ≥ 5 piksellerin en fazla %0,1'i 170°–270° bandında
const BAKIR = { ton: [23, 35], aciklik: [40, 62] }; // ana yolun ekran rengi: ton 29° ± 6°, açıklık %40–62

let basarisiz = 0;
/** @param {boolean} kosul @param {string} ad @param {unknown} [ayrinti] */
function denetle(kosul, ad, ayrinti) {
  if (!kosul) basarisiz++;
  console.log(`${kosul ? '✓' : '✗'} ${ad}${ayrinti === undefined ? '' : ` · ${typeof ayrinti === 'string' ? ayrinti : JSON.stringify(ayrinti)}`}`);
}

// ── Chrome + CDP ──
const profil = join(tmpdir(), `uctan-uca-${process.pid}`);
rmSync(profil, { recursive: true, force: true });
mkdirSync(profil, { recursive: true });
const chrome = spawn(
  CHROME,
  ['--headless=new', '--hide-scrollbars', '--enable-gpu', '--ignore-gpu-blocklist', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profil}`, '--no-first-run', 'about:blank'],
  { stdio: 'ignore' },
);
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
let hedef;
for (let i = 0; i < 50 && !hedef; i++) {
  await bekle(200);
  try {
    hedef = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page');
  } catch {
    /* Chrome henüz açılmadı */
  }
}
if (!hedef) throw new Error('Chrome açılamadı');
const ws = new WebSocket(hedef.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let sira = 0;
const bekleyen = new Map();
/** @type {string[]} */
let konsol = [];
let yuklendi = false;
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && bekleyen.has(m.id)) {
    bekleyen.get(m.id)(m);
    bekleyen.delete(m.id);
  }
  if (m.method === 'Page.loadEventFired') yuklendi = true;
  if (m.method === 'Runtime.exceptionThrown') konsol.push(`istisna: ${m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text}`);
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) {
    konsol.push(`${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description).join(' ')}`);
  }
});
const gonder = (method, params = {}) =>
  new Promise((r) => {
    const id = ++sira;
    bekleyen.set(id, r);
    ws.send(JSON.stringify({ id, method, params }));
  });
/** Sayfada ifade çalıştırır, değerini döndürür. */
const d = async (ifade) => {
  const r = await gonder('Runtime.evaluate', { expression: ifade, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(`${ifade}\n→ ${r.result.exceptionDetails.exception?.description}`);
  return r.result?.result?.value;
};
const git = async (yol) => {
  yuklendi = false;
  konsol = [];
  await gonder('Page.navigate', { url: `${SITE}${yol}` });
  for (let i = 0; i < 150 && !yuklendi; i++) await bekle(100);
};
/** <html data-gorunum> beklenen değere gelene kadar bekler (en fazla ms); son değeri döndürür. */
const gorunumBekle = async (beklenen, ms = 10000) => {
  let g;
  for (let t = 0; t < ms; t += 100) {
    g = await d('document.documentElement.dataset.gorunum ?? null');
    if (g === beklenen) return g;
    await bekle(100);
  }
  return g;
};
const olcu = (w, h) => gonder('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
const ortam = (ozellikler) => gonder('Emulation.setEmulatedMedia', { features: ozellikler });
const temizle = () => d('localStorage.clear(), true');
const cek = async (ad) => {
  const r = await gonder('Page.captureScreenshot', { format: 'png' });
  if (GORSEL) {
    writeFileSync(join(GORSEL, `${ONEK}-${ad}.png`), Buffer.from(r.result.data, 'base64'));
    console.log(`  görüntü: ${ONEK}-${ad}.png`);
  }
  return r.result.data;
};

/**
 * Ekran görüntüsünün piksellerini sayfada sayar (PNG'yi bir 2D canvas'a çizip okur).
 * Döner: mavi bandındaki piksel oranı (kroma ≥ 5 olanlar içinde) ve verilen dikdörtgenin ortalama rengi (ton, HSL açıklık).
 */
const pikselOlc = (png, kutu) =>
  d(`new Promise((bitti) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const v = g.getImageData(0, 0, c.width, c.height).data;
      const ton = (r, gg, b) => {
        const ust = Math.max(r, gg, b), alt = Math.min(r, gg, b), k = ust - alt;
        if (!k) return 0;
        const h = ust === r ? ((gg - b) / k) % 6 : ust === gg ? (b - r) / k + 2 : (r - gg) / k + 4;
        return (h * 60 + 360) % 360;
      };
      let renkli = 0, mavi = 0;
      for (let i = 0; i < v.length; i += 4) {
        const r = v[i], gg = v[i + 1], b = v[i + 2];
        if (Math.max(r, gg, b) - Math.min(r, gg, b) < 5) continue;
        renkli++;
        const h = ton(r, gg, b);
        if (h >= 170 && h <= 270) mavi++;
      }
      const [x0, y0, x1, y1] = ${JSON.stringify(kutu)};
      let R = 0, G = 0, B = 0, n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * c.width + x) * 4; R += v[i]; G += v[i + 1]; B += v[i + 2]; n++;
      }
      R /= n; G /= n; B /= n;
      const aciklik = (Math.max(R, G, B) + Math.min(R, G, B)) / 2 / 255 * 100;
      bitti({ maviOran: renkli ? mavi / renkli : 0, renkli, ortalama: '#' + [R, G, B].map((x) => Math.round(x).toString(16).padStart(2, '0')).join(''), ton: Math.round(ton(R, G, B)), aciklik: Math.round(aciklik) });
    };
    img.src = 'data:image/png;base64,${png}';
  })`);

await gonder('Page.enable');
await gonder('Runtime.enable');
await gonder('Network.enable');
console.log(`== ${SITE}`);

// ── 1. Masaüstü: 3D açılıyor ──
await olcu(1440, 900);
await ortam([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
await git('/');
await temizle();
await git('/');
const t0 = Date.now();
const g1 = await gorunumBekle('3d');
const hazirMs = Date.now() - t0;
denetle(g1 === '3d', '3D açılıyor (masaüstü, TR)', `${hazirMs} ms (yükleme sonrası)`);
denetle(hazirMs <= 2000, "3D 2 sn'de hazır (§2.2)", `${hazirMs} ms`);
await bekle(800); // belirme geçişi (0,6 sn) bitsin
const gpu = await d(`(() => { const gl = document.createElement('canvas').getContext('webgl2'); const e = gl?.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; })()`);
console.log(`  GPU: ${gpu}`);
denetle(await d(`document.querySelector('[data-yedek]').inert === true`), 'yedek içerik inert (çift okuma yok)');
denetle(await d(`getComputedStyle(document.querySelector('[data-yedek]')).visibility === 'hidden'`), 'yedek içerik görsel olarak gizli');
denetle(await d(`getComputedStyle(document.documentElement).overflow === 'hidden'`), '3D açıkken sayfa kaymıyor');
denetle(await d(`!!document.querySelector('[data-duz-gorunum]') && getComputedStyle(document.querySelector('[data-duz-gorunum]')).visibility === 'visible'`), '"Düz görünüm" düğmesi görünüyor');
const cls = await d(`new Promise((bitti) => { let t = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) t += e.value; }).observe({ type: 'layout-shift', buffered: true }); setTimeout(() => bitti(t), 100); })`);
denetle(cls <= CLS_SINIR, `CLS ≤ ${CLS_SINIR} (3D geçişi dahil)`, cls.toFixed(4));
const png1 = await cek('3d-1440');
const p1 = await pikselOlc(png1, [700, 860, 740, 890]);
denetle(p1.maviOran <= MAVI_ORAN_SINIR, 'mavi piksel yok (≤ %0,1)', `${(p1.maviOran * 100).toFixed(3)}% / ${p1.renkli} renkli piksel`);
denetle(
  p1.ton >= BAKIR.ton[0] && p1.ton <= BAKIR.ton[1] && p1.aciklik >= BAKIR.aciklik[0] && p1.aciklik <= BAKIR.aciklik[1],
  'ana bakır yol kameraya yakın yerde beyaza dönmüyor (ton 29° ± 6°, açıklık %40–62)',
  `${p1.ortalama} → ton ${p1.ton}°, açıklık %${p1.aciklik}`,
);
denetle(konsol.length === 0, 'konsolda hata/uyarı yok', konsol.join(' | ') || undefined);

// ── 2. "Düz görünüm" → yedek sayfa; seçim hatırlanır; "3D görünüm" geri açar ──
await d(`document.querySelector('[data-duz-gorunum]').click(), true`);
denetle((await d('document.documentElement.dataset.gorunum')) === 'yedek', '"Düz görünüm" → yedek sayfa');
denetle((await d(`localStorage.getItem('gorunum')`)) === 'duz', 'seçim kaydedildi (gorunum = duz)');
const ucDugme = `document.querySelector('[data-3d-ac]')`;
denetle(await d(`!${ucDugme}.hidden && document.activeElement === ${ucDugme}`), '"3D görünüm" düğmesi görünür ve odakta', await d(`${ucDugme}.textContent`));
denetle(await d(`document.querySelector('[data-yedek]').inert === false`), 'yedek sayfa yeniden gezilebilir');
await cek('duz-gorunum-1440');
await git('/');
await bekle(1500);
denetle((await d('document.documentElement.dataset.gorunum')) === 'yedek', 'yeniden yüklenince düz görünümde kalıyor');
await d(`${ucDugme}.click(), true`);
denetle((await gorunumBekle('3d')) === '3d', '"3D görünüm" → 3D yeniden açılıyor (yeni canvas)');
denetle((await d(`localStorage.getItem('gorunum')`)) === null, 'düz seçimi silindi');
denetle((await d(`document.querySelectorAll('[data-pcb] canvas').length`)) === 1, 'tek canvas (eski bağlam bırakıldı)');

// ── 3. Hareket azaltma → yedek + "3D'yi yine de aç" ──
await temizle();
await ortam([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await git('/');
await bekle(1500);
denetle((await d('document.documentElement.dataset.gorunum')) === 'yedek', 'prefers-reduced-motion → yedek sayfa');
denetle(await d(`!${ucDugme}.hidden`), '"3D\'yi yine de aç" düğmesi görünür', await d(`${ucDugme}.textContent`));
await cek('hareket-azalt-1440');
await d(`${ucDugme}.click(), true`);
denetle((await gorunumBekle('3d')) === '3d', '"3D\'yi yine de aç" → 3D açılıyor');
await git('/');
denetle((await gorunumBekle('3d')) === '3d', 'seçim hatırlanıyor (gorunum = 3d)');
await temizle();
await ortam([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);

// ── 4. WebGL2 yok → yedek, düğme yok ──
const { result: betik } = await gonder('Page.addScriptToEvaluateOnNewDocument', {
  source: `{ const asil = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (tur, ...a) { return tur === 'webgl2' ? null : asil.call(this, tur, ...a); }; }`,
});
await git('/');
await bekle(1500);
denetle((await d('document.documentElement.dataset.gorunum')) === 'yedek', 'WebGL2 yok → yedek sayfa');
denetle(await d(`${ucDugme}.hidden`), 'WebGL2 yokken "3D görünüm" düğmesi çıkmıyor');
await cek('webgl-yok-1440');
await gonder('Page.removeScriptToEvaluateOnNewDocument', { identifier: betik.identifier });

// ── 5. 3D parçası inemiyor → yedek, konsola tek satır uyarı ──
await gonder('Network.setBlockedURLs', { urls: ['*/_astro/kur.*'] });
await git('/');
await bekle(2500);
denetle((await d('document.documentElement.dataset.gorunum')) === 'yedek', '3D parçası inemezse yedek sayfa');
denetle(konsol.filter((k) => k.includes('3D açılamadı')).length === 1, 'konsola tek satır uyarı', konsol.join(' | '));
await gonder('Network.setBlockedURLs', { urls: [] });

// ── 6. JS kapalı → katman gizli, data-gorunum yok ──
await gonder('Emulation.setScriptExecutionDisabled', { value: true });
await git('/');
await bekle(500);
denetle(
  await d(`document.querySelector('[data-pcb]').hidden && !('gorunum' in document.documentElement.dataset)`),
  'JS kapalı → 3D katmanı gizli, yedek sayfa',
);
await gonder('Emulation.setScriptExecutionDisabled', { value: false });

// ── 7. EN ve telefon genişliği ──
await git('/en/');
denetle((await gorunumBekle('3d')) === '3d', '3D açılıyor (EN)');
await olcu(390, 844);
await git('/');
denetle((await gorunumBekle('3d')) === '3d', '3D açılıyor (390 px)');
await bekle(800);
await cek('3d-390');
denetle((await d('document.documentElement.scrollWidth - document.documentElement.clientWidth')) === 0, '390 px: yatay taşma yok');

console.log(basarisiz ? `\n✗ ${basarisiz} denetim başarısız` : '\n✓ hepsi geçti');
ws.close();
chrome.kill();
await bekle(300);
rmSync(profil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
process.exitCode = basarisiz ? 1 : 0;
