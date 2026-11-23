// src/pcb/kaydirma.ts: tekerlek / dokunma / klavye → hedef s, atalet (CLAUDE.md §5.8, §10).
import { describe, expect, it } from 'vitest';
import { SERTLIK, yay } from '../src/hareket/yay';
import {
  KAYDIRMA,
  ataletAdim,
  dokunmaBasla,
  dokunmaHareket,
  dokunmaHizi,
  hedefIlerlet,
  klavyeAdimi,
  tekerlekPikseli,
} from '../src/pcb/kaydirma';

describe('tekerlekPikseli: deltaMode dönüşümü', () => {
  it.each([
    [100, 0, 100], // piksel (Chrome bir çentik)
    [3, 1, 120], // satır (Firefox bir çentik: 3 satır × 40)
    [-3, 1, -120],
    [0.25, 2, 200], // sayfa: çeyrek sayfa × 800 px
  ])('Δ = %d, mod %d → %d px', (delta, mod, beklenen) => {
    expect(tekerlekPikseli(delta, mod, 800)).toBe(beklenen);
  });

  it('tek bir dev olay sınırlanır (ışınlanma yok)', () => {
    expect(tekerlekPikseli(100000, 0, 800)).toBe(KAYDIRMA.olayUstPx);
    expect(tekerlekPikseli(-5, 2, 900)).toBe(-KAYDIRMA.olayUstPx);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])('Δ = %s → 0', (d) => {
    expect(tekerlekPikseli(d, 0, 800)).toBe(0);
  });
});

describe('hedefIlerlet: sınırlarda sıkıştırma', () => {
  it('yolun uçları: [0, L]', () => {
    expect(hedefIlerlet(1, 1, -5, 100)).toBe(0);
    expect(hedefIlerlet(99, 99, 5, 100)).toBe(100);
    expect(hedefIlerlet(50, 50, 3, 100)).toBe(53);
  });

  it('hedef kameranın en fazla ondeUst önünde', () => {
    let hedef = 10;
    for (let i = 0; i < 100; i++) hedef = hedefIlerlet(hedef, 10, 3, 1000);
    expect(hedef).toBe(10 + KAYDIRMA.ondeUst);
    for (let i = 0; i < 100; i++) hedef = hedefIlerlet(hedef, 30, -3, 1000);
    expect(hedef).toBe(30 - KAYDIRMA.ondeUst);
  });

  it('NaN Δ hedefi bozmaz', () => {
    expect(hedefIlerlet(5, 5, Number.NaN, 10)).toBe(5);
  });

  it('art arda dev tekerlek olayları: kamera bir karede en fazla birkaç birim gider (ışınlanmıyor)', () => {
    // 60 fps, her karede bir dev olay; kamera yayla hedefi izler
    let s = 0;
    let v = 0;
    let hedef = 0;
    let enBuyukAdim = 0;
    for (let k = 0; k < 120; k++) {
      hedef = hedefIlerlet(hedef, s, tekerlekPikseli(1e6, 0, 900) * KAYDIRMA.birimPx, 110);
      const once = s;
      [s, v] = yay(s, v, hedef, SERTLIK.kameraIlerleme, 1 / 60);
      enBuyukAdim = Math.max(enBuyukAdim, Math.abs(s - once));
    }
    // ondeUst = 12, k = 12: en hızlı anda bile bir karede ~0,6 birimden az
    expect(enBuyukAdim).toBeLessThan(1);
    expect(s).toBeGreaterThan(20); // ama ilerliyor
  });
});

describe('dokunma', () => {
  it('parmak yukarı → ileri (pozitif Δ), aşağı → geri', () => {
    let d = dokunmaBasla(500, 0);
    let r = dokunmaHareket(d, 400, 0.016);
    expect(r.delta).toBeCloseTo(100 * KAYDIRMA.birimPx, 12);
    d = r.durum;
    r = dokunmaHareket(d, 450, 0.032);
    expect(r.delta).toBeCloseTo(-50 * KAYDIRMA.birimPx, 12);
  });

  it('hız: son pencerede ölçülür (birim/s)', () => {
    // 1000 px/s yukarı, 60 Hz örnekler
    let d = dokunmaBasla(800, 0);
    for (let i = 1; i <= 30; i++) d = dokunmaHareket(d, 800 - (1000 * i) / 60, i / 60).durum;
    expect(dokunmaHizi(d, 30 / 60)).toBeCloseTo(1000 * KAYDIRMA.birimPx, 6);
    // pencere dışındaki eski örnekler atıldı
    expect(d.ornekler.length).toBeLessThanOrEqual(8);
  });

  it('parmak durup sonra kalkarsa hız 0 (atalet yok)', () => {
    let d = dokunmaBasla(800, 0);
    d = dokunmaHareket(d, 600, 0.05).durum;
    expect(dokunmaHizi(d, 0.05 + KAYDIRMA.dokunmaPencere + 0.01)).toBe(0);
  });

  it('tek örnek → hız 0', () => {
    expect(dokunmaHizi(dokunmaBasla(10, 0), 0)).toBe(0);
  });
});

describe('atalet sönüyor', () => {
  it('toplam yol v·τ, hız tekdüze azalıp 0 oluyor (kare hızından bağımsız)', () => {
    for (const dt of [1 / 144, 1 / 60, 1 / 20]) {
      let v = 30;
      let yol = 0;
      let once = v;
      let kare = 0;
      while (v !== 0 && kare < 10000) {
        const r = ataletAdim(v, dt);
        yol += r.delta;
        expect(Math.abs(r.v)).toBeLessThanOrEqual(Math.abs(once));
        once = v = r.v;
        kare++;
      }
      expect(v).toBe(0);
      expect(kare * dt).toBeLessThan(5); // birkaç saniyede biter
      expect(yol).toBeCloseTo(30 * KAYDIRMA.ataletTau, 1);
    }
  });

  it('geri yönde de çalışır; eşik altı hız hemen durur', () => {
    expect(ataletAdim(-10, 0.016).delta).toBeLessThan(0);
    expect(ataletAdim(KAYDIRMA.ataletEsik / 2, 0.016)).toEqual({ v: 0, delta: 0 });
    expect(ataletAdim(Number.NaN, 0.016)).toEqual({ v: 0, delta: 0 });
  });
});

describe('klavyeAdimi (CLAUDE.md §3.5)', () => {
  it.each([
    ['ArrowDown', false, KAYDIRMA.okAdim],
    ['ArrowUp', false, -KAYDIRMA.okAdim],
    ['PageDown', false, KAYDIRMA.sayfaAdim],
    ['PageUp', false, -KAYDIRMA.sayfaAdim],
    [' ', false, KAYDIRMA.sayfaAdim],
    [' ', true, -KAYDIRMA.sayfaAdim],
    ['Home', false, 'bas'],
    ['End', false, 'son'],
    ['ArrowLeft', false, null],
    ['Enter', false, null],
    ['a', false, null],
  ] as const)('%j (shift %s) → %s', (tus, shift, beklenen) => {
    expect(klavyeAdimi(tus, shift)).toBe(beklenen);
  });
});
