// @ts-check
// Build sonrası dist/ denetimi (CLAUDE.md §2.1, §10).
// `npm run yayinla` zincirinde build'den SONRA çalışır: tek bir HATA bile çıkış kodunu 1 yapar ve
// wrangler'a sıra gelmez (site son sağlam sürümde kalır). UYARI yazdırılır ama yayını durdurmaz.
//
// Yapı: çekirdek saf fonksiyonlardır, diske dokunmaz. Girdisi dist'in bellekteki kopyasıdır:
//   Map<"en/index.html", içerik>   (yollar dist'e göreli ve "/" ayraçlı; yalnızca .html/.css/.js okunur)
// Böylece testler (tests/kontrol.test.ts) sahte bir dist'i birkaç satırla kurar. Dosyanın sonundaki
// küçük bölüm yalnızca `node scripts/kontrol.mjs` ile doğrudan çalıştırılınca devreye girer.
//
// HTML'i tam bir ayrıştırıcıyla değil düzenli ifadelerle okuyoruz: girdi kendi build çıktımız
// (tırnaklı nitelikler, düzgün kapanmış etiketler); bunun için bağımlılık eklemeye değmez.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

/**
 * M1–M5: `data-taslak` işaretli sayfa (kaba EN çevirisi) UYARI verir.
 * M6'dan itibaren `true` yapılır → HATA, yani taslak kaldıkça yayın olmaz (Burak'ın kararı).
 */
export const TASLAK_HATA = false;

/**
 * JS bütçesi (CLAUDE.md §2.2), gzip'li bayt. Hedef aşılırsa UYARI, sınır aşılırsa HATA (yayın durur).
 *   yedek:   bir sayfanın hemen indirdiği JS (satır içi betikler + <script src> + statik import zinciri)
 *   ucBoyut: yalnızca dinamik import() ile inen JS (Three.js + sahne kodu)
 */
export const BUTCE = {
  yedek: { hedef: 15 * 1024, sinir: 25 * 1024 },
  ucBoyut: { hedef: 170 * 1024, sinir: 200 * 1024 },
};

/** 3D katmanının JSON adasının kimliği (src/pcb/veri.ts → PCB_VERI_KIMLIGI ile aynı). */
const ADA_KIMLIGI = 'pcb-veri';

/** Göreli adresleri çözmek için sahte köken. `.invalid` gerçek bir alan adıyla asla çakışmaz. */
const TABAN = 'https://dist.invalid';

/** @typedef {Map<string, string>} Dist  dist'e göreli yol → içerik (.html/.css dışındakiler boş metin) */
/** @typedef {{ ad: string, nit: Record<string, string> }} Etiket  küçük harfli etiket adı + nitelikleri */
/** @typedef {{ hatalar: string[], uyarilar: string[] }} Sonuc */
/** @typedef {{ site?: string, taslakHata?: boolean }} Secenekler */

/** @type {Record<string, string>} */
const VARLIKLAR = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };

/**
 * HTML karakter göndermelerini (entity) çözer: `&amp;` → `&`, `&#39;` → `'`, `&#x2F;` → `/`.
 * Nitelik değerleri için yeterli alt küme.
 * @param {string} metin
 */
function varlikCoz(metin) {
  return metin.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (butun, ondalik, onaltilik, ad) => {
    if (ondalik) return String.fromCodePoint(Number(ondalik));
    if (onaltilik) return String.fromCodePoint(parseInt(onaltilik, 16));
    return VARLIKLAR[String(ad).toLowerCase()] ?? butun;
  });
}

const ETIKET = /<([a-zA-Z][\w:-]*)((?:\s+[^\s"'=<>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const NITELIK = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

/**
 * HTML'i parçalar. Önce yorumlar atılır ve <script>/<style> gövdeleri boşaltılır: içlerindeki metin
 * (ör. bir JS dizgisindeki `href="…"`) link sayılmasın. <style> gövdeleri ayrıca CSS olarak döner.
 * Değeri olmayan nitelik (`crossorigin`) boş metinle kaydedilir; varlığı `in` ile sınanır.
 * @param {string} html
 * @returns {{ etiketler: Etiket[], stiller: string[], betikler: Array<{ nit: Record<string, string>, govde: string }> }}
 */
export function htmlParcala(html) {
  /** @type {string[]} */
  const stiller = [];
  /** @type {Array<{ nit: Record<string, string>, govde: string }>} */
  const betikler = [];
  const sade = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2\s*>)/gi, (_, ac, ad, govde, kapa) => {
      if (String(ad).toLowerCase() === 'style') stiller.push(govde);
      else betikler.push({ nit: nitelikler(String(ac).replace(/^<script\b/i, '').replace(/>$/, '')), govde });
      return ac + kapa;
    });

  /** @type {Etiket[]} */
  const etiketler = [];
  for (const [, ad, nitMetni] of sade.matchAll(ETIKET)) etiketler.push({ ad: String(ad).toLowerCase(), nit: nitelikler(nitMetni ?? '') });
  return { etiketler, stiller, betikler };
}

/**
 * Etiketin nitelik metni → { ad: değer } (küçük harfli adlar, karakter göndermeleri çözülmüş).
 * @param {string} metin
 */
function nitelikler(metin) {
  /** @type {Record<string, string>} */
  const nit = {};
  for (const [, n, cift, tek, ciplak] of metin.matchAll(NITELIK)) nit[String(n).toLowerCase()] = varlikCoz(cift ?? tek ?? ciplak ?? '');
  return nit;
}

/**
 * JS kodundaki STATİK import / re-export hedefleri ("./a.js", "/_astro/b.js"). Dinamik import("…") sayılmaz:
 * `import` sözcüğünden hemen sonra "(" gelir, desen tırnak bekler. Küçültülmüş kod: import{a as b}from"./x.js";
 * @param {string} kod
 * @returns {string[]}
 */
export function statikIthalatlar(kod) {
  /** @type {string[]} */
  const sonuc = [];
  for (const m of kod.matchAll(/\b(?:import|export)\s*(?:[^'"`();]*?\bfrom\s*)?["']([^"']+)["']/g)) sonuc.push(String(m[1]));
  return sonuc;
}

/** Çalıştırılan betik mi (JSON adası, şablon vb. değil)? @param {Record<string, string>} nit */
const calisanBetik = (nit) => {
  const tur = (nit.type ?? '').toLowerCase();
  return tur === '' || tur === 'module' || tur === 'text/javascript' || tur === 'application/javascript';
};

/** @param {string} metin */
const gzBoyutu = (metin) => gzipSync(Buffer.from(metin, 'utf8'), { level: 9 }).length;

/** @param {number} n */
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

/**
 * JS bütçesinin ölçümü (CLAUDE.md §2.2).
 *   Sayfa başına "hemen" JS: satır içi çalışan betikler + <script src> / modulepreload dosyaları + bunların statik
 *   import zinciri. "Dinamik" JS: dist'teki hemen inmeyen bütün .js dosyaları (yalnızca import() ile iner: 3D parçası).
 * Her parça ayrı gzip'lenir (ayrı ayrı iner).
 * @param {Dist} dosyalar
 * @param {string} [site]
 * @returns {{ sayfalar: Array<{ yol: string, gz: number }>, dinamik: { dosyalar: string[], gz: number } }}
 */
export function jsButcesi(dosyalar, site) {
  /** @type {Set<string>} */
  const hemenTum = new Set();
  const sayfalar = [];
  for (const [yol, icerik] of dosyalar) {
    if (!yol.endsWith('.html') || is404(yol)) continue;
    const { etiketler, betikler } = htmlParcala(icerik);
    const temel = sunumAdresi(yol);
    /** @type {Set<string>} */
    const hemen = new Set();
    /** @type {string[]} */
    const kuyruk = [];
    /** URL'yi dist dosyasına çevirip kuyruğa ekler. @param {string} deger @param {string} taban */
    const ekle = (deger, taban) => {
      const c = adresCoz(deger, taban, site);
      if (c.tur !== 'ic') return;
      const h = hedefBul(c.yol, dosyalar);
      if ('dosya' in h && h.dosya.endsWith('.js') && !hemen.has(h.dosya)) {
        hemen.add(h.dosya);
        kuyruk.push(h.dosya);
      }
    };
    let gz = 0;
    for (const { nit, govde } of betikler) {
      if (!calisanBetik(nit)) continue;
      if (nit.src) ekle(nit.src, temel);
      else if (govde.trim()) {
        gz += gzBoyutu(govde);
        for (const i of statikIthalatlar(govde)) ekle(i, temel);
      }
    }
    for (const { ad, nit } of etiketler) {
      if (ad === 'link' && (nit.rel ?? '').toLowerCase().split(/\s+/).includes('modulepreload') && nit.href) ekle(nit.href, temel);
    }
    while (kuyruk.length > 0) {
      const dosya = /** @type {string} */ (kuyruk.shift());
      for (const i of statikIthalatlar(dosyalar.get(dosya) ?? '')) ekle(i, sunumAdresi(dosya));
    }
    for (const d of hemen) {
      gz += gzBoyutu(dosyalar.get(d) ?? '');
      hemenTum.add(d);
    }
    sayfalar.push({ yol, gz });
  }
  const dinamikDosyalar = [...dosyalar.keys()].filter((y) => y.endsWith('.js') && !hemenTum.has(y)).sort();
  return {
    sayfalar,
    dinamik: { dosyalar: dinamikDosyalar, gz: dinamikDosyalar.reduce((t, y) => t + gzBoyutu(dosyalar.get(y) ?? ''), 0) },
  };
}

/** @param {string} css */
const yorumsuzCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const URL_IFADESI = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/gi;

/**
 * CSS'teki bütün `url(...)` değerleri (yorumlar hariç, tırnaklar soyulmuş).
 * @param {string} css
 * @returns {string[]}
 */
export function cssUrlleri(css) {
  return [...yorumsuzCss(css).matchAll(URL_IFADESI)].map((m) => (m[1] ?? m[2] ?? m[3] ?? '').trim());
}

/**
 * Yalnızca `@font-face { … }` bloklarının içindeki `url(...)` değerleri: sitenin gerçekten kullandığı font dosyaları.
 * @param {string} css
 * @returns {string[]}
 */
export function fontFaceUrlleri(css) {
  return [...yorumsuzCss(css).matchAll(/@font-face\s*\{([^}]*)\}/gi)].flatMap((m) => cssUrlleri(m[1] ?? ''));
}

/**
 * Font CSS'e gömülmüş mü? Bir `@font-face` içinde `url(data:…)`, ya da herhangi bir yerde `data:font/…`.
 * Gömülü font, unicode-range eşleşmese de CSS'le birlikte HER ZAMAN iner (bkz. astro.config.mjs → assetsInlineLimit).
 * @param {string} css
 */
export function gomuluFontVar(css) {
  if (fontFaceUrlleri(css).some((u) => /^data:/i.test(u))) return true;
  return /data:(?:font\/|application\/(?:x-)?font)/i.test(yorumsuzCss(css));
}

/**
 * dist yolu → sitede sunulduğu URL yolu (Cloudflare Pages kuralı, `build.format: 'directory'`):
 *   "index.html" → "/",   "en/index.html" → "/en/",   "_astro/a.css" → "/_astro/a.css"
 * @param {string} yol
 */
export function sunumAdresi(yol) {
  return '/' + yol.replace(/(^|\/)index\.html$/, '$1');
}

/**
 * Bir adres değerini, `temel` URL yolundaki bir sayfaya göre çözer (tarayıcının yaptığı gibi, URL API ile).
 *   başka köken, mailto:, tel:, data:, javascript:  → { tur: 'dis' }   (denetlenmez)
 *   sitenin içi                                       → { tur: 'ic', yol: "/en/", parca: "stajlar" }
 * Sitenin kendi tam adresiyle yazılmış linkler (ör. canonical `https://burakerensimsek.is-a.dev/`) de iç sayılır.
 * @param {string} deger
 * @param {string} temel  ör. "/en/"
 * @param {string} [site] ör. "https://burakerensimsek.is-a.dev"
 * @returns {{ tur: 'dis' } | { tur: 'gecersiz' } | { tur: 'ic', yol: string, parca: string }}
 */
export function adresCoz(deger, temel, site) {
  let url;
  try {
    url = new URL(deger.trim(), TABAN + temel);
  } catch {
    return { tur: 'gecersiz' };
  }
  const kendiKokeni = site ? new URL(site).origin : undefined;
  if (url.origin !== TABAN && url.origin !== kendiKokeni) return { tur: 'dis' };
  try {
    return { tur: 'ic', yol: decodeURIComponent(url.pathname), parca: decodeURIComponent(url.hash.slice(1)) };
  } catch {
    return { tur: 'gecersiz' }; // bozuk %-kodlaması, ör. "%E0%A4%A"
  }
}

/**
 * URL yolunun dist'teki dosyasını bulur. Cloudflare Pages'in yönlendireceği (yani ziyaretçiye
 * fazladan bir gidiş-dönüş yaşatacak) biçimleri de hata sayar:
 *   "/en/"            → en/index.html          ✓
 *   "/en"             → sonunda "/" yok         (trailingSlash: 'always')
 *   "/en/index.html"  → Pages "/en/"'e yönlendirir
 * @param {string} yol
 * @param {Dist} dosyalar
 * @returns {{ dosya: string } | { hata: string }}
 */
export function hedefBul(yol, dosyalar) {
  const goreli = yol.replace(/^\/+/, '');
  if (goreli === '' || goreli.endsWith('/')) {
    const aday = `${goreli}index.html`;
    return dosyalar.has(aday) ? { dosya: aday } : { hata: 'böyle bir sayfa yok' };
  }
  if (goreli.endsWith('.html') && dosyalar.has(goreli)) {
    const dogru = /(^|\/)index\.html$/.test(goreli) ? sunumAdresi(goreli) : '/' + goreli.slice(0, -'.html'.length);
    return { hata: `Pages bu adresi "${dogru}" adresine yönlendirir; link öyle yazılmalı` };
  }
  if (dosyalar.has(goreli)) return { dosya: goreli };
  if (dosyalar.has(`${goreli}/index.html`)) return { hata: `sonunda "/" yok, "${yol}/" olmalı (trailingSlash: 'always')` };
  return { hata: 'böyle bir dosya yok' };
}

/**
 * Bir etiketin adres taşıyan nitelik değerleri: `href`, `src`, `poster` ve `srcset`'teki her aday.
 * @param {Record<string, string>} nit
 */
function adresDegerleri(nit) {
  /** @type {string[]} */
  const degerler = [];
  for (const n of ['href', 'src', 'poster']) {
    const d = nit[n];
    if (d !== undefined) degerler.push(d);
  }
  for (const aday of nit.srcset?.split(',') ?? []) {
    const u = aday.trim().split(/\s+/)[0];
    if (u) degerler.push(u);
  }
  return degerler;
}

/** @param {string} yol */
const is404 = (yol) => /(^|\/)404\.html$/.test(yol);

/**
 * Bütün denetimler. Saf fonksiyon: yalnızca girdiye bakar, bulduklarını döndürür.
 *   1. 404.html var (yoksa Pages siteyi SPA sanar).
 *   2. CSS (dosyalar + satır içi <style>): font gömülü değil, url() hedefleri var.
 *   3. Sayfalar: iç linkler ve #parçalar kırık değil; 404'te göreli link yok; font preload'ları
 *      bir @font-face'te kullanılıyor ve crossorigin taşıyor; <html lang> doğru; taslak işareti;
 *      her TR sayfanın EN karşılığı var ve tersi.
 * @param {Dist} dosyalar
 * @param {Secenekler} [secenekler]
 * @returns {Sonuc}
 */
export function kontrolEt(dosyalar, { site, taslakHata = TASLAK_HATA } = {}) {
  /** @type {Sonuc} */
  const sonuc = { hatalar: [], uyarilar: [] };
  /** @param {string} mesaj */
  const hata = (mesaj) => void sonuc.hatalar.push(mesaj);

  /** @type {Map<string, { etiketler: Etiket[], stiller: string[] }>} */
  const htmller = new Map();
  for (const [yol, icerik] of dosyalar) if (yol.endsWith('.html')) htmller.set(yol, htmlParcala(icerik));

  // 1) 404 sayfası
  if (!dosyalar.has('404.html')) {
    hata('404.html yok: Cloudflare Pages siteyi SPA sanar ve bilinmeyen her adrese ana sayfayı döndürür (src/pages/404.astro)');
  }

  // 2) CSS kaynakları: [ad, temel URL yolu, css]
  /** @type {Array<[string, string, string]>} */
  const cssKaynaklari = [];
  for (const [yol, icerik] of dosyalar) if (yol.endsWith('.css')) cssKaynaklari.push([yol, sunumAdresi(yol), icerik]);
  for (const [yol, { stiller }] of htmller) {
    stiller.forEach((css, i) => cssKaynaklari.push([`${yol} <style> ${i + 1}`, sunumAdresi(yol), css]));
  }

  // font-face bloklarında kullanılan font dosyalarının URL yolları (preload denetimi için)
  /** @type {Set<string>} */
  const fontAdresleri = new Set();
  for (const [ad, temel, css] of cssKaynaklari) {
    if (gomuluFontVar(css)) hata(`${ad}: font CSS'e gömülü (data:) → her ziyarette gereksiz yere iner (astro.config.mjs → assetsInlineLimit)`);
    for (const u of cssUrlleri(css)) {
      const c = adresCoz(u, temel, site);
      if (c.tur === 'gecersiz') hata(`${ad}: geçersiz adres url(${u})`);
      if (c.tur !== 'ic') continue;
      const h = hedefBul(c.yol, dosyalar);
      if ('hata' in h) hata(`${ad}: url(${u}) → ${h.hata}`);
    }
    for (const u of fontFaceUrlleri(css)) {
      const c = adresCoz(u, temel, site);
      if (c.tur === 'ic') fontAdresleri.add(c.yol);
    }
  }

  // 3) Sayfalar
  /** @type {Map<string, Set<string>>} */
  const idOnbellegi = new Map();
  /** Bir sayfadaki id="…" (ve eski usul <a name="…">) değerleri; #parça denetimi için. @param {string} dosya */
  const idler = (dosya) => {
    let kume = idOnbellegi.get(dosya);
    if (!kume) {
      kume = new Set();
      for (const { ad, nit } of htmller.get(dosya)?.etiketler ?? []) {
        if (nit.id) kume.add(nit.id);
        if (ad === 'a' && nit.name) kume.add(nit.name);
      }
      idOnbellegi.set(dosya, kume);
    }
    return kume;
  };

  for (const [yol, { etiketler }] of htmller) {
    const temel = sunumAdresi(yol);

    for (const { ad, nit } of etiketler) {
      // 3a) iç linkler
      for (const deger of adresDegerleri(nit)) {
        const c = adresCoz(deger, temel, site);
        if (c.tur === 'dis') continue;
        if (c.tur === 'gecersiz') {
          hata(`${yol}: <${ad}> geçersiz adres "${deger}"`);
          continue;
        }
        // 404.html her bilinmeyen adreste sunulur: "/a/b/c" isteğinde "en/" linki "/a/b/en/" olur.
        if (is404(yol) && deger.trim() !== '' && !/^(\/|#)/.test(deger.trim()) && !/^https?:/i.test(deger.trim())) {
          hata(`${yol}: göreli link "${deger}" → 404 sayfası her adreste sunulur, link "/" ile başlamalı`);
        }
        const h = hedefBul(c.yol, dosyalar);
        if ('hata' in h) {
          hata(`${yol}: <${ad}> "${deger}" → ${h.hata}`);
          continue;
        }
        if (c.parca && c.parca !== 'top' && h.dosya.endsWith('.html') && !idler(h.dosya).has(c.parca)) {
          hata(`${yol}: <${ad}> "${deger}" → ${h.dosya} içinde id="${c.parca}" yok`);
        }
      }

      // 3b) font preload'u
      const rel = (nit.rel ?? '').toLowerCase().split(/\s+/);
      if (ad === 'link' && rel.includes('preload') && (nit.as ?? '').toLowerCase() === 'font') {
        const c = adresCoz(nit.href ?? '', temel, site);
        if (c.tur === 'ic' && !fontAdresleri.has(c.yol)) {
          hata(`${yol}: preload edilen "${nit.href}" hiçbir @font-face'te yok → preload boşa iner, kullanılan dosya ayrıca iner`);
        }
        if (!('crossorigin' in nit)) {
          hata(`${yol}: font preload'unda crossorigin yok → tarayıcı fontu CORS ile ister, preload'u kullanamaz ve fontu iki kez indirir`);
        }
      }
    }

    // 3c) <html lang> ve taslak işareti
    const kok = etiketler.find((e) => e.ad === 'html');
    const beklenenDil = yol.startsWith('en/') ? 'en' : 'tr';
    if (!kok) {
      hata(`${yol}: <html> etiketi yok`);
    } else {
      if (kok.nit.lang !== beklenenDil) hata(`${yol}: <html lang="${kok.nit.lang ?? ''}">, "${beklenenDil}" olmalı`);
      if ('data-taslak' in kok.nit) {
        if (taslakHata) hata(`${yol}: taslak işaretli (kaba çeviri); M6'dan sonra taslakla yayın yapılmaz`);
        else sonuc.uyarilar.push(`${yol}: taslak işaretli (kaba çeviri); M6'dan itibaren yayını durdurur`);
      }
    }

    // 3d) TR/EN eşleşmesi (404 iki dilli tek sayfa, hariç)
    if (!is404(yol)) {
      const en = yol.startsWith('en/');
      const karsi = en ? yol.slice('en/'.length) : `en/${yol}`;
      if (!dosyalar.has(karsi)) hata(`${yol}: ${en ? 'TR' : 'EN'} karşılığı yok (${karsi} bekleniyordu)`);
    }
  }

  // 4) JS bütçesi
  const butce = jsButcesi(dosyalar, site);
  for (const { yol, gz } of butce.sayfalar) {
    if (gz > BUTCE.yedek.sinir) hata(`${yol}: hemen inen JS ${kb(gz)} gz > sınır ${kb(BUTCE.yedek.sinir)} (§2.2)`);
    else if (gz > BUTCE.yedek.hedef) sonuc.uyarilar.push(`${yol}: hemen inen JS ${kb(gz)} gz > hedef ${kb(BUTCE.yedek.hedef)}`);
  }
  const d3 = butce.dinamik.gz;
  if (d3 > BUTCE.ucBoyut.sinir) hata(`3D parçası (dinamik JS) ${kb(d3)} gz > sınır ${kb(BUTCE.ucBoyut.sinir)} (§2.2)`);
  else if (d3 > BUTCE.ucBoyut.hedef) sonuc.uyarilar.push(`3D parçası (dinamik JS) ${kb(d3)} gz > hedef ${kb(BUTCE.ucBoyut.hedef)}`);

  // 5) JSON adası: 3D katmanı kart metnini yedek sayfadaki <article>'dan alır; her kimliğin karşılığı olmalı
  for (const [yol, { etiketler }] of htmller) {
    const ada = htmlParcala(dosyalar.get(yol) ?? '').betikler.find((b) => b.nit.id === ADA_KIMLIGI);
    if (!ada) continue;
    /** @type {any} */
    let veri;
    try {
      veri = JSON.parse(ada.govde);
    } catch {
      hata(`${yol}: JSON adası (#${ADA_KIMLIGI}) okunamıyor`);
      continue;
    }
    if (!Array.isArray(veri?.sapaklar)) {
      hata(`${yol}: JSON adasında sapaklar listesi yok`);
      continue;
    }
    const makaleler = new Set(etiketler.filter((e) => e.ad === 'article').map((e) => e.nit['aria-labelledby']));
    for (const sapak of veri.sapaklar) {
      if (typeof sapak?.id !== 'string' || !idler(yol).has(sapak.id)) hata(`${yol}: JSON adasındaki sapak "${String(sapak?.id)}" için sayfada bölüm (id) yok`);
      for (const oge of Array.isArray(sapak?.ogeler) ? sapak.ogeler : []) {
        if (typeof oge?.id !== 'string' || !makaleler.has(`${oge.id}-baslik`)) {
          hata(`${yol}: JSON adasındaki "${String(oge?.id)}" için yedek sayfada <article aria-labelledby="${String(oge?.id)}-baslik"> yok`);
        }
      }
    }
  }

  return sonuc;
}

/**
 * Gerçek dist klasörünü okur. Yalnızca .html/.css/.js içeriği okunur; diğer dosyaların (font, görsel) varlığı yeter.
 * @param {string} kok
 * @returns {Dist}
 */
export function distOku(kok) {
  /** @type {Dist} */
  const dosyalar = new Map();
  for (const ad of readdirSync(kok, { recursive: true, encoding: 'utf8' })) {
    const tam = join(kok, ad);
    if (!statSync(tam).isFile()) continue;
    const yol = ad.split(sep).join('/');
    dosyalar.set(yol, /\.(html|css|js)$/i.test(yol) ? readFileSync(tam, 'utf8') : '');
  }
  return dosyalar;
}

// ── Komut satırı: yalnızca `node scripts/kontrol.mjs` ile doğrudan çalıştırılınca (testlerde çalışmaz) ──
if (import.meta.main) {
  const kok = fileURLToPath(new URL('../dist/', import.meta.url));
  if (!existsSync(kok)) {
    console.error('HATA   dist/ yok: önce `npm run build`.');
    process.exitCode = 1;
  } else {
    // Site adresinin tek kaynağı astro.config.mjs (iki yerde yazılıp ayrışmasın).
    const { default: ayar } = await import('../astro.config.mjs');
    const dosyalar = distOku(kok);
    const { hatalar, uyarilar } = kontrolEt(dosyalar, { site: ayar.site });
    const sayfaSayisi = [...dosyalar.keys()].filter((y) => y.endsWith('.html')).length;

    console.log(`kontrol: ${sayfaSayisi} sayfa, ${dosyalar.size} dosya tarandı`);
    const butce = jsButcesi(dosyalar, ayar.site);
    for (const { yol, gz } of butce.sayfalar) console.log(`JS     ${yol}: hemen ${kb(gz)} gz (hedef ${kb(BUTCE.yedek.hedef)}, sınır ${kb(BUTCE.yedek.sinir)})`);
    console.log(`JS     3D parçası: ${kb(butce.dinamik.gz)} gz, ${butce.dinamik.dosyalar.length} dosya (hedef ${kb(BUTCE.ucBoyut.hedef)}, sınır ${kb(BUTCE.ucBoyut.sinir)})`);
    for (const u of uyarilar) console.log(`UYARI  ${u}`);
    for (const h of hatalar) console.error(`HATA   ${h}`);
    if (hatalar.length > 0) {
      console.error(`✗ ${hatalar.length} hata: yayın yapılmayacak`);
      process.exitCode = 1;
    } else {
      console.log(`✓ hata yok${uyarilar.length > 0 ? ` (${uyarilar.length} uyarı)` : ''}`);
    }
  }
}
