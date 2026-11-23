// src/pcb/lens.ts: lens kaydırma (CLAUDE.md §5.8).
import { describe, expect, it } from 'vitest';
import { KAMERA, lensKaydirma } from '../src/pcb/lens';

/**
 * Tam çerçevenin perspektif izdüşümünü elle yapar: kameradan ileri d, yukarı y'deki nokta, görünen pencerenin
 * üstünden kaç pencere boyu aşağıda görünür? (0 = üst kenar, 1 = alt kenar)
 */
function ekranY(d: number, y: number, fov: number, ufuk: number): number {
  const l = lensKaydirma(fov, ufuk);
  const yariTan = Math.tan(((l.tamFov / 2) * Math.PI) / 180);
  const ndc = y / d / yariTan; // tam çerçevede −1 (alt) .. +1 (üst)
  const tamUsttenOran = ((1 - ndc) / 2) * l.tamOran; // tam çerçevenin üstünden, pencere boyu cinsinden
  return tamUsttenOran - l.ofsetOran;
}

describe('lensKaydirma', () => {
  it('prototip: 54° ve %34 → tam çerçeve ≈ 67,8°, oran 1,32, ofset 0,32', () => {
    const l = lensKaydirma(KAMERA.gorunenFov, KAMERA.ufuk);
    expect(l.tamFov).toBeCloseTo(67.8, 1);
    expect(l.tamOran).toBeCloseTo(1.32, 12);
    expect(l.ofsetOran).toBeCloseTo(0.32, 12);
  });

  it('ufuk (sonsuzdaki göz hizası) ekranın üstten %34\'ünde', () => {
    expect(ekranY(1e9, 0, 54, 0.34)).toBeCloseTo(0.34, 9);
  });

  it('görünen dikey açı 54°: pencerenin üst ve alt kenarı', () => {
    // üst kenar: ufkun r·h üstü, alt kenar: (1 − r)·h altı (tanjant uzayında, d = 1)
    const h = 2 * Math.tan((27 * Math.PI) / 180);
    expect(ekranY(1, 0.34 * h, 54, 0.34)).toBeCloseTo(0, 9);
    expect(ekranY(1, -0.66 * h, 54, 0.34)).toBeCloseTo(1, 9);
  });

  it('ufuk ortadaysa (0,5) kaydırma yok: sıradan kamera', () => {
    const l = lensKaydirma(54, 0.5);
    expect(l.tamFov).toBeCloseTo(54, 9);
    expect(l.tamOran).toBe(1);
    expect(l.ofsetOran).toBe(0);
  });

  it.each([0, -0.1, 0.6, Number.NaN])('geçersiz ufuk (%s) → hata', (u) => {
    expect(() => lensKaydirma(54, u)).toThrow(RangeError);
  });
});
