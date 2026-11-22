// Font kurulumu denetimi (CLAUDE.md §4.3 ve Burak'ın kararı):
//   - yalnızca izinli aile/ağırlıklar yüklenir,
//   - her @font-face kendi unicode-range'ini taşır (alt kümeler birbirini ezmesin),
//   - Türkçe harflerin hepsi latin ∪ latin-ext alt kümelerinde,
//   - preload edilen dosyalar başlık fontunun (Inter Tight 600) latin + latin-ext dosyaları.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { yorumlariSil } from './yardimci/tokenlar';

const require = createRequire(import.meta.url);
const oku = (yol: string) => readFileSync(new URL(yol, import.meta.url), 'utf8');

const IZINLI = [
  '@fontsource/inter/400.css',
  '@fontsource/inter/500.css',
  '@fontsource/inter-tight/500.css',
  '@fontsource/inter-tight/600.css',
  '@fontsource/jetbrains-mono/400.css',
];
const PRELOAD = [
  '@fontsource/inter-tight/files/inter-tight-latin-600-normal.woff2',
  '@fontsource/inter-tight/files/inter-tight-latin-ext-600-normal.woff2',
];
const TURKCE = [...'ÇçĞğİıÖöŞşÜü'];

/** "U+0000-00FF,U+0131" → [[0x0000, 0x00FF], [0x0131, 0x0131]] */
function araliklariCoz(metin: string): Array<[number, number]> {
  return metin.split(',').map((parca) => {
    const [bas, son] = parca.trim().replace(/^U\+/i, '').split('-');
    const a = parseInt(bas!, 16);
    return [a, son ? parseInt(son, 16) : a];
  });
}

interface Yuz {
  /** paketin yorum satırındaki ad, ör. "inter-tight-latin-ext-600-normal" */
  ad: string;
  aralik: Array<[number, number]> | null;
  woff2: string | null;
}

/** Paket CSS'indeki her @font-face bloğunu, üstündeki ad yorumuyla birlikte okur */
function yuzleriOku(css: string): Yuz[] {
  return [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)].map(([, ad, govde]) => {
    const aralik = /unicode-range:\s*([^;]+);/.exec(govde!)?.[1];
    return {
      ad: ad!,
      aralik: aralik ? araliklariCoz(aralik) : null,
      woff2: /url\(([^)]+\.woff2)\)/.exec(govde!)?.[1] ?? null,
    };
  });
}

const altKume = (y: Yuz) => (/-latin-ext-\d/.test(y.ad) ? 'latin-ext' : /-latin-\d/.test(y.ad) ? 'latin' : 'diger');

describe('fontlar.css', () => {
  const iceAktarilan = [...yorumlariSil(oku('../src/styles/fontlar.css')).matchAll(/@import\s+['"]([^'"]+)['"]/g)].map(
    (m) => m[1]!,
  );

  it('yalnızca izinli aile ve ağırlıkları içe aktarıyor', () => {
    expect([...iceAktarilan].sort()).toEqual([...IZINLI].sort());
  });

  it('negatif kontrol: alt kümeye özel dosyada unicode-range yok (bu yüzden kullanılmıyor)', () => {
    const tekAltKume = yuzleriOku(readFileSync(require.resolve('@fontsource/inter-tight/latin-600.css'), 'utf8'));
    expect(tekAltKume.length).toBeGreaterThan(0);
    expect(tekAltKume.every((y) => y.aralik === null)).toBe(true);
  });

  describe.each(IZINLI)('%s', (paket) => {
    const yol = require.resolve(paket);
    const yuzler = yuzleriOku(readFileSync(yol, 'utf8'));

    it('her @font-face unicode-range taşıyor (alt kümeler birbirini ezmez)', () => {
      expect(yuzler.length).toBeGreaterThan(0);
      expect(yuzler.filter((y) => y.aralik === null).map((y) => y.ad)).toEqual([]);
    });

    it('latin ve latin-ext alt kümelerinin ikisi de var', () => {
      const kumeler = new Set(yuzler.map(altKume));
      expect(kumeler.has('latin')).toBe(true);
      expect(kumeler.has('latin-ext')).toBe(true);
    });

    it('Türkçe harflerin hepsi latin ∪ latin-ext aralıklarında', () => {
      const araliklar = yuzler.filter((y) => altKume(y) !== 'diger').flatMap((y) => y.aralik ?? []);
      const eksik = TURKCE.filter((h) => !araliklar.some(([a, b]) => h.codePointAt(0)! >= a && h.codePointAt(0)! <= b));
      expect(eksik).toEqual([]);
    });

    it('latin ve latin-ext woff2 dosyaları diskte var', () => {
      for (const y of yuzler.filter((y) => altKume(y) !== 'diger')) {
        expect(y.woff2, y.ad).not.toBeNull();
        expect(existsSync(resolve(dirname(yol), y.woff2!)), y.woff2!).toBe(true);
      }
    });
  });
});

describe('başlık fontu preload', () => {
  const duzen = oku('../src/layouts/Duzen.astro');
  const preloadEdilen = [...duzen.matchAll(/from\s+['"](@fontsource\/[^'"]+\.woff2)\?url['"]/g)].map((m) => m[1]!);

  it('Inter Tight 600 latin + latin-ext dosyaları preload ediliyor', () => {
    expect([...preloadEdilen].sort()).toEqual([...PRELOAD].sort());
  });

  it('preload edilen dosyalar paket içinde gerçekten var', () => {
    for (const dosya of PRELOAD) expect(existsSync(require.resolve(dosya)), dosya).toBe(true);
  });

  it('preload etiketleri crossorigin taşıyor (yoksa font iki kez indirilir)', () => {
    const etiketler = duzen.match(/<link[^>]*rel="preload"[^>]*>/g) ?? [];
    expect(etiketler.length).toBe(PRELOAD.length);
    for (const e of etiketler) expect(e).toMatch(/\bcrossorigin\b/);
  });
});
