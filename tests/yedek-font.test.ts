// Ölçüsü ayarlı yedek fontlar (src/styles/yedekFontlar.ts) denetimi.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { YEDEKLER, yedekAyarlari, yedekFontCss, yuzde, type Olculer } from '../src/styles/yedekFontlar';
import { tokenlariOku } from './yardimci/tokenlar';

const oku = (yol: string) => readFileSync(new URL(yol, import.meta.url), 'utf8');

describe('yedekAyarlari (formül)', () => {
  it('elle hesaplanabilen örnek: s = (500/1000)/(800/2000) = 1.25', () => {
    const asil: Olculer = { fullName: 'A', postscriptName: 'A', ascent: 900, descent: -200, lineGap: 50, unitsPerEm: 1000, xWidthAvg: 500 };
    const yedek: Olculer = { fullName: 'Y', postscriptName: 'Y', ascent: 1800, descent: -500, lineGap: 0, unitsPerEm: 2000, xWidthAvg: 800 };
    const a = yedekAyarlari(asil, yedek);
    expect(a.sizeAdjust).toBeCloseTo(1.25, 12);
    expect(a.ascentOverride).toBeCloseTo(900 / 1250, 12); // 0.72
    expect(a.descentOverride).toBeCloseTo(200 / 1250, 12); // 0.16 (descent negatif gelir, mutlak değer alınır)
    expect(a.lineGapOverride).toBeCloseTo(50 / 1250, 12); // 0.04
  });

  it('bağımsız referans: next/font aynı yöntemle Inter → Arial için 107.12% / 90.44% / 22.52% / 0% üretir', () => {
    const tanim = YEDEKLER.find((t) => t.aile === 'Inter Yedek Arial')!;
    const a = yedekAyarlari(tanim.asil, tanim.yedek);
    expect(yuzde(a.sizeAdjust)).toBe('107.12%');
    expect(yuzde(a.ascentOverride)).toBe('90.44%');
    expect(yuzde(a.descentOverride)).toBe('22.52%');
    expect(yuzde(a.lineGapOverride)).toBe('0.00%');
  });
});

describe.each(YEDEKLER.map((t) => [t.aile, t] as const))('%s', (_ad, t) => {
  const a = yedekAyarlari(t.asil, t.yedek);
  const em = (x: number) => x / t.asil.unitsPerEm;

  it('ölçeklenen yedeğin ortalama harf genişliği asıl fontunkine eşit', () => {
    expect(a.sizeAdjust * (t.yedek.xWidthAvg / t.yedek.unitsPerEm)).toBeCloseTo(em(t.asil.xWidthAvg), 12);
  });

  it('tarayıcı size-adjust\'ı uyguladıktan sonra dikey ölçüler asıl fontunkine eşit', () => {
    expect(a.sizeAdjust * a.ascentOverride).toBeCloseTo(em(t.asil.ascent), 12);
    expect(a.sizeAdjust * a.descentOverride).toBeCloseTo(em(Math.abs(t.asil.descent)), 12);
    expect(a.sizeAdjust * a.lineGapOverride).toBeCloseTo(em(t.asil.lineGap), 12);
  });

  it('değerler makul aralıkta (paket verisi bozuksa yakalansın)', () => {
    expect(a.sizeAdjust).toBeGreaterThan(0.8);
    expect(a.sizeAdjust).toBeLessThan(1.25);
    for (const v of [a.ascentOverride, a.descentOverride, a.lineGapOverride]) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1.5);
    }
  });
});

describe('üretilen CSS', () => {
  const css = yedekFontCss();
  const bloklar = css.match(/@font-face \{[^}]*\}/g) ?? [];

  it('her yedek için bir @font-face, dört ayarın hepsi yüzde olarak', () => {
    expect(bloklar.length).toBe(YEDEKLER.length);
    for (const b of bloklar) {
      for (const d of ['size-adjust', 'ascent-override', 'descent-override', 'line-gap-override']) {
        expect(b, d).toMatch(new RegExp(`${d}: \\d+\\.\\d{2}%;`));
      }
    }
  });

  it('yerel fontu tam adı ve PostScript adıyla arıyor', () => {
    for (const t of YEDEKLER) {
      expect(css).toContain(`font-family: '${t.aile}';\n  src: local('${t.yedek.fullName}'), local('${t.yedek.postscriptName}');`);
    }
  });

  it('JetBrains Mono için yedek yok (Burak\'ın kararı)', () => {
    expect(css).not.toMatch(/JetBrains/i);
  });

  it('Duzen.astro üretilen CSS\'i <head>\'e gömüyor', () => {
    expect(oku('../src/layouts/Duzen.astro')).toMatch(/<style is:inline set:html=\{yedekFontCss\(\)\}/);
  });
});

describe('tokens.css font yığınları yedekleri doğru sırada kullanıyor', () => {
  const tokenlar = tokenlariOku(oku('../src/styles/tokens.css'));
  const yigin = (ad: string) =>
    tokenlar
      .get(ad)!
      .koyu.split(',')
      .map((p) => p.trim().replace(/^['"]|['"]$/g, ''));

  it('gövde: Inter → Inter Yedek Segoe → Inter Yedek Arial', () => {
    expect(yigin('--font-govde').slice(0, 3)).toEqual(['Inter', 'Inter Yedek Segoe', 'Inter Yedek Arial']);
  });

  it('başlık: Inter Tight → Inter Tight Yedek Segoe → Inter Tight Yedek Arial', () => {
    expect(yigin('--font-baslik').slice(0, 3)).toEqual(['Inter Tight', 'Inter Tight Yedek Segoe', 'Inter Tight Yedek Arial']);
  });

  it('yığınlardaki her "Yedek" ailesi gerçekten üretiliyor (yazım hatası olmasın)', () => {
    const uretilen = new Set(YEDEKLER.map((t) => t.aile));
    const kullanilan = ['--font-govde', '--font-baslik', '--font-mono'].flatMap(yigin).filter((a) => a.includes('Yedek'));
    expect(kullanilan.filter((a) => !uretilen.has(a))).toEqual([]);
    expect(kullanilan.length).toBe(YEDEKLER.length);
  });
});
