// @ts-check
// Build sonrası dist/ denetimi (CLAUDE.md §2.1, §10).
// `npm run yayinla` zincirinde build'den SONRA çalışır: tek bir HATA bile çıkış kodunu 1 yapar ve
// wrangler'a sıra gelmez (site son sağlam sürümde kalır). UYARI yazdırılır ama yayını durdurmaz.
//
// Yapı: çekirdek saf fonksiyonlardır, diske dokunmaz. Girdisi dist'in bellekteki kopyasıdır:
//   Map<"en/index.html", içerik>   (yollar dist'e göreli ve "/" ayraçlı; yalnızca .html/.css okunur)
// Böylece testler (tests/kontrol.test.ts) sahte bir dist'i birkaç satırla kurar. Dosyanın sonundaki
// küçük bölüm yalnızca `node scripts/kontrol.mjs` ile doğrudan çalıştırılınca devreye girer.
//
// HTML'i tam bir ayrıştırıcıyla değil düzenli ifadelerle okuyoruz: girdi kendi build çıktımız
// (tırnaklı nitelikler, düzgün kapanmış etiketler); bunun için bağımlılık eklemeye değmez.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * M1–M5: `data-taslak` işaretli sayfa (kaba EN çevirisi) UYARI verir.
 * M6'dan itibaren `true` yapılır → HATA, yani taslak kaldıkça yayın olmaz (Burak'ın kararı).
 */
export const TASLAK_HATA = false;

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
 * @returns {{ etiketler: Etiket[], stiller: string[] }}
 */
export function htmlParcala(html) {
  /** @type {string[]} */
  const stiller = [];
  const sade = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2\s*>)/gi, (_, ac, ad, govde, kapa) => {
      if (String(ad).toLowerCase() === 'style') stiller.push(govde);
      return ac + kapa;
    });

  /** @type {Etiket[]} */
  const etiketler = [];
  for (const [, ad, nitelikler] of sade.matchAll(ETIKET)) {
    /** @type {Record<string, string>} */
    const nit = {};
    for (const [, n, cift, tek, ciplak] of (nitelikler ?? '').matchAll(NITELIK)) {
      nit[String(n).toLowerCase()] = varlikCoz(cift ?? tek ?? ciplak ?? '');
    }
    etiketler.push({ ad: String(ad).toLowerCase(), nit });
  }
  return { etiketler, stiller };
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

  return sonuc;
}

/**
 * Gerçek dist klasörünü okur. Yalnızca .html/.css içeriği okunur; diğer dosyaların (font, görsel) varlığı yeter.
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
    dosyalar.set(yol, /\.(html|css)$/i.test(yol) ? readFileSync(tam, 'utf8') : '');
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
