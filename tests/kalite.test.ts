// src/pcb/kalite.ts: kalite kademeleri (CLAUDE.md §8).
import { describe, expect, it } from 'vitest';
import { KADEMELER, OLCUM, baslangicKademesi, kademeKarari, yuzdelik } from '../src/pcb/kalite';

const sabit = (ms: number, n: number = OLCUM.kareSayisi) => Array.from({ length: n }, () => ms);

describe('KADEMELER (§8)', () => {
  it('Yüksek: gölge haritası, piksel oranı ≤ 2; Orta: leke, ≤ 1,5; Düşük: leke, 1, ayrıntı yok', () => {
    expect(KADEMELER.yuksek).toEqual({ golgeHaritasi: true, leke: false, pikselOraniUst: 2, ayrinti: true });
    expect(KADEMELER.orta).toEqual({ golgeHaritasi: false, leke: true, pikselOraniUst: 1.5, ayrinti: true });
    expect(KADEMELER.dusuk).toEqual({ golgeHaritasi: false, leke: true, pikselOraniUst: 1, ayrinti: false });
  });
});

describe('baslangicKademesi', () => {
  it.each([
    ['masaüstü 1440 × 900, dpr 1', { en: 1440, boy: 900, dpr: 1, dokunmatik: false }, 'yuksek'],
    ['masaüstü 1440 × 900, dpr 2 (Retina)', { en: 1440, boy: 900, dpr: 2, dokunmatik: false }, 'yuksek'],
    ['4K masaüstü (2560 × 1440, dpr 1,5)', { en: 2560, boy: 1440, dpr: 1.5, dokunmatik: false }, 'orta'],
    ['iPhone 12 (390 × 844, dpr 3)', { en: 390, boy: 844, dpr: 3, dokunmatik: true }, 'orta'],
    ['tablet', { en: 1024, boy: 768, dpr: 2, dokunmatik: true }, 'orta'],
  ] as const)('%s → %s', (_ad, ekran, beklenen) => {
    expect(baslangicKademesi(ekran)).toBe(beklenen);
  });
});

describe('kademeKarari', () => {
  it('yeterli örnek yoksa kal', () => {
    expect(kademeKarari('yuksek', sabit(40, OLCUM.kareSayisi - 1))).toEqual({ tur: 'kal' });
  });

  it('60 fps (16,7 ms) → kal', () => {
    expect(kademeKarari('yuksek', sabit(16.7))).toEqual({ tur: 'kal' });
  });

  it('yavaşsa bir kademe düşer: Yüksek → Orta → Düşük', () => {
    expect(kademeKarari('yuksek', sabit(30))).toEqual({ tur: 'dusur', yeni: 'orta' });
    expect(kademeKarari('orta', sabit(30))).toEqual({ tur: 'dusur', yeni: 'dusuk' });
  });

  it('karar %90\'lık değere bakar: birkaç takılma tek başına düşürmez', () => {
    const sureler = [...sabit(16, 57), 80, 90, 100]; // %5 takılma
    expect(kademeKarari('yuksek', sureler)).toEqual({ tur: 'kal' });
    const cok = [...sabit(16, 50), ...sabit(30, 10)]; // %17 yavaş kare → p90 = 30
    expect(kademeKarari('yuksek', cok)).toEqual({ tur: 'dusur', yeni: 'orta' });
  });

  it('Düşük kademede 24 fps altı → Düz görünüm öner; değilse kal (yükseltme yok)', () => {
    expect(kademeKarari('dusuk', sabit(50))).toEqual({ tur: 'duz-oner' });
    expect(kademeKarari('dusuk', sabit(30))).toEqual({ tur: 'kal' });
    expect(kademeKarari('dusuk', sabit(8))).toEqual({ tur: 'kal' });
  });

  it('aşırı uzun ve geçersiz kareler sayılmaz (sekme gizlendi)', () => {
    const sureler = [...sabit(16), 5000, Number.NaN, -1, 0];
    expect(kademeKarari('yuksek', sureler)).toEqual({ tur: 'kal' });
  });
});

describe('yuzdelik', () => {
  it('en yakın sıra yöntemi', () => {
    const s = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(yuzdelik(s, 0.9)).toBe(9);
    expect(yuzdelik(s, 1)).toBe(10);
    expect(yuzdelik(s, 0)).toBe(1);
    expect(yuzdelik([], 0.5)).toBeNaN();
  });
});
