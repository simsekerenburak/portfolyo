// src/i18n/{tr,en}.json denetimi.
// `astro check` EN'de EKSİK anahtarı yakalar (Metinler = typeof tr), ama FAZLA anahtarı yakalamaz;
// bu test ikisini de yakalar ve boş kalmış metin bırakmaz.
import { describe, expect, it } from 'vitest';
import en from '../src/i18n/en.json';
import tr from '../src/i18n/tr.json';

/** İç içe nesnenin yaprak yolları: { a: { b: 'x' } } → ['a.b'] */
function yapraklar(nesne: unknown, onek = ''): string[] {
  if (nesne === null || typeof nesne !== 'object' || Array.isArray(nesne)) return [onek];
  return Object.entries(nesne).flatMap(([k, v]) => yapraklar(v, onek ? `${onek}.${k}` : k));
}

/** Yoldaki değeri getirir: deger(tr, 'site.baslik') */
function deger(nesne: unknown, yol: string): unknown {
  return yol.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], nesne);
}

describe('i18n: TR ve EN aynı şemada', () => {
  it('iki dosya tam olarak aynı anahtarları taşıyor', () => {
    expect(yapraklar(en).sort()).toEqual(yapraklar(tr).sort());
  });

  it.each([
    ['tr', tr],
    ['en', en],
  ] as const)('%s: boş metin yok', (_, metinler) => {
    const bos = yapraklar(metinler).filter((y) => {
      const d = deger(metinler, y);
      return typeof d === 'string' && d.trim() === '';
    });
    expect(bos).toEqual([]);
  });

  it('TR asıl dil: taslak değil', () => {
    expect(tr.taslak).toBe(false);
  });

  it('metinlerde düz kesme işareti yok (tipografik ’ kullanılır)', () => {
    for (const [dil, metinler] of [['tr', tr], ['en', en]] as const) {
      const duz = yapraklar(metinler).filter((y) => String(deger(metinler, y)).includes("'"));
      expect(duz, dil).toEqual([]);
    }
  });
});
