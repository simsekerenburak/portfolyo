// src/pafta/bicim.ts: ay hassasiyetli tarihler ve tekil/çoğul etiket.
import { describe, expect, it } from 'vitest';
import { METINLER } from '../src/i18n';
import { ayCoz, ayYil, cogul, tarihAraligi } from '../src/pafta/bicim';

describe('ay adları (i18n)', () => {
  it.each(['tr', 'en'] as const)('%s: 12 uzun ve 12 kısa ad, hiçbiri boş değil', (dil) => {
    const { uzun, kisa } = METINLER[dil].aylar;
    expect(uzun).toHaveLength(12);
    expect(kisa).toHaveLength(12);
    expect([...uzun, ...kisa].filter((a) => a.trim() === '')).toEqual([]);
  });
});

describe('ayCoz', () => {
  it('"2026-09" → yıl 2026, ay 9', () => {
    expect(ayCoz('2026-09')).toEqual({ yil: 2026, ay: 9 });
  });

  it.each(['2026-9', '2026-13', '2026-00', '26-09', '2026/09', ''])('geçersiz: "%s"', (t) => {
    expect(() => ayCoz(t)).toThrow(/Geçersiz ay tarihi/);
  });
});

describe('ayYil ve tarihAraligi (taslaktaki biçimler)', () => {
  it('ayYil', () => {
    expect(ayYil('2026-09', 'tr')).toBe('Eylül 2026');
    expect(ayYil('2026-08', 'en')).toBe('August 2026');
  });

  it.each([
    ['2026-09', undefined, 'tr', 'Eylül 2026 →'],
    ['2026-08', '2026-09', 'tr', 'Ağu – Eyl 2026'],
    ['2026-07', '2026-08', 'tr', 'Tem – Ağu 2026'],
    ['2026-09', '2026-09', 'tr', 'Eylül 2026'],
    ['2025-12', '2026-01', 'tr', 'Ara 2025 – Oca 2026'],
    ['2026-09', undefined, 'en', 'September 2026 →'],
    ['2026-08', '2026-09', 'en', 'Aug – Sep 2026'],
  ] as const)('%s → %s (%s) = "%s"', (bas, bit, dil, beklenen) => {
    expect(tarihAraligi(bas, bit, dil)).toBe(beklenen);
  });
});

describe('cogul', () => {
  it('1 → tekil, diğerleri → çoğul (0 dahil)', () => {
    const e = { bir: 'city', cok: 'cities' };
    expect([0, 1, 2].map((n) => cogul(n, e))).toEqual(['cities', 'city', 'cities']);
  });
});
