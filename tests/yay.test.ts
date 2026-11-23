// src/hareket/yay.ts: kritik sönümlü yay (CLAUDE.md §5.3, §10).
import { describe, expect, it } from 'vitest';
import { DT_UST, SERTLIK, oturdu, yay } from '../src/hareket/yay';

/** Yayı `sure` saniye boyunca sabit dt ile çalıştırır; her adımın konumunu döndürür. */
function calistir(x0: number, hedef: number, k: number, dt: number, sure: number, v0 = 0): number[] {
  let x = x0;
  let v = v0;
  const yol: number[] = [];
  for (let t = 0; t < sure - 1e-9; t += dt) {
    [x, v] = yay(x, v, hedef, k, dt);
    yol.push(x);
  }
  return yol;
}

const SERTLIKLER = Object.values(SERTLIK);
const ADIMLAR = [1 / 144, 1 / 60, 1 / 30, DT_UST];

describe('yay: kritik sönüm', () => {
  it.each(SERTLIKLER)('k = %i: hedefi aşmıyor (her dt için), hep hedefe doğru ilerliyor', (k) => {
    for (const dt of ADIMLAR) {
      for (const [x0, hedef] of [
        [0, 10],
        [10, 0],
        [-3, 250],
      ] as const) {
        const yol = calistir(x0, hedef, k, dt, 4);
        const yon = Math.sign(hedef - x0);
        let once: number = x0;
        for (const x of yol) {
          // hedefi aşmaz: (hedef − x) işareti başlangıçtakiyle aynı kalır (ya da 0 olur)
          expect(Math.sign(hedef - x) * yon).toBeGreaterThanOrEqual(0);
          // geri dönmez: hedefe uzaklık hiç artmaz
          expect(Math.abs(hedef - x)).toBeLessThanOrEqual(Math.abs(hedef - once) + 1e-12);
          once = x;
        }
      }
    }
  });

  it.each(SERTLIKLER)('k = %i: 2 sn içinde hedefe yüzde 1 yakınsıyor', (k) => {
    for (const dt of ADIMLAR) {
      const yol = calistir(0, 100, k, dt, 2);
      expect(Math.abs(100 - yol.at(-1)!)).toBeLessThan(1);
    }
  });

  it('tam çözüm: kare hızından bağımsız (aynı süre → aynı konum)', () => {
    // Kritik sönümün tam çözümü (durgun başlangıç): e(t) = e0·(1 + ωt)·e^(−ωt), ω = √k
    const k = SERTLIK.kameraIlerleme;
    const w = Math.sqrt(k);
    const tam = (t: number) => 10 - 10 * (1 + w * t) * Math.exp(-w * t);
    for (const dt of [1 / 144, 1 / 60, 0.03]) { // hepsi DT_UST'un altında (sıkıştırılmasın)
      const yol = calistir(0, 10, k, dt, 0.5);
      expect(yol.at(-1)!).toBeCloseTo(tam(yol.length * dt), 9);
    }
  });

  it('başlangıç hızı korunur: hareket hâlindeyken hedef değişince sıçrama yok', () => {
    // Küçük dt'de Taylor açılımı: x' ≈ x + v·dt + a·dt²/2, v' ≈ v + a·dt, a = k·(h − x) − 2√k·v (denklemin kendisi)
    const [x0, v0, h, k, dt] = [2, 5, -10, SERTLIK.uc, 1e-4];
    const a = k * (h - x0) - 2 * Math.sqrt(k) * v0;
    const [x, v] = yay(x0, v0, h, k, dt);
    expect(x).toBeCloseTo(x0 + v0 * dt + (a * dt * dt) / 2, 7); // kalan hata O(dt³)
    expect(v).toBeCloseTo(v0 + a * dt, 3);
  });

  it('dt sıkıştırılır: dev bir dt (sekme uykudan döndü) sistemi patlatmaz', () => {
    const [x1, v1] = yay(0, 0, 10, SERTLIK.uc, 5);
    const [x2, v2] = yay(0, 0, 10, SERTLIK.uc, DT_UST);
    expect([x1, v1]).toEqual([x2, v2]);
    expect(yay(3, 1, 10, 30, -1)).toEqual([3, 1]); // negatif dt → adım yok
  });

  it('hedefteyken durur; oturdu() eşiği', () => {
    expect(yay(5, 0, 5, 40, 0.016)).toEqual([5, 0]);
    expect(oturdu(5, 0, 5)).toBe(true);
    expect(oturdu(5, 0.01, 5)).toBe(false);
    expect(oturdu(4.99, 0, 5)).toBe(false);
  });

  it('NaN üretmez (uç değerler)', () => {
    for (const [x, v, h] of [
      [1e6, 0, -1e6],
      [0, 1e3, 0],
    ]) {
      const yol = calistir(x, h, 70, DT_UST, 3, v);
      expect(yol.every(Number.isFinite)).toBe(true);
    }
  });
});
