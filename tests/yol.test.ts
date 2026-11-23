// src/pcb/yol.ts: yay uzunluğuyla parametrelenmiş, köşeleri yumuşatılmış yol (CLAUDE.md §5.8, §10).
import { describe, expect, it } from 'vitest';
import { nokta } from '../src/pcb/geometri';
import { noktaAl, yolKur, type Yol } from '../src/pcb/yol';

const L_SEKLI = [nokta(0, 0), nokta(0, 10), nokta(10, 10)]; // 90° sola (x+ yönüne) dönüş
const SAPAK = [nokta(0, 0), nokta(0, 26), nokta(2.1213, 28.1213), nokta(30, 28.1213)]; // ana hat → 45° → 90°

/** s ∈ [0, L] aralığından n + 1 eşit aralıklı örnek */
const ornekler = (yol: Yol, n = 2000) => Array.from({ length: n + 1 }, (_, i) => (yol.uzunluk * i) / n);

describe('yolKur: yay uzunluğu', () => {
  it('düz çizgi: L = kenar boyu', () => {
    expect(yolKur([nokta(0, -12), nokta(0, 98)], 2).uzunluk).toBeCloseTo(110, 12);
  });

  it('keskin köşe (r = 0): L = kenarların toplamı', () => {
    expect(yolKur(L_SEKLI, 0).uzunluk).toBeCloseTo(20, 12);
  });

  it('90° köşe, r = 2: L = (10 − 2) + (10 − 2) + 2·π/2', () => {
    expect(yolKur(L_SEKLI, 2).uzunluk).toBeCloseTo(16 + Math.PI, 12);
  });

  it('45° köşe, r = 4: t = r·tan(22,5°), L = 2·(10 − t) + r·π/4', () => {
    const k = Math.SQRT1_2 * 10;
    const t = 4 * Math.tan(Math.PI / 8);
    expect(yolKur([nokta(0, 0), nokta(0, 10), nokta(k, 10 + k)], 4).uzunluk).toBeCloseTo(2 * (10 - t) + Math.PI, 12);
  });

  it('büyük yarıçap kenarın yarısına sıkıştırılır (komşu yaylar çakışmaz)', () => {
    // 90° köşede t = r; kenar 10 → t en fazla 5 → r = 5
    const yol = yolKur(L_SEKLI, 100);
    expect(yol.uzunluk).toBeCloseTo(5 * Math.PI / 2 + 10, 12);
    const yaylar = yol.parcalar.filter((p) => p.tur === 'yay');
    expect(yaylar).toHaveLength(1);
  });

  it('düz devam eden köşe (0°) yay eklemez', () => {
    const yol = yolKur([nokta(0, 0), nokta(0, 5), nokta(0, 9)], 3);
    expect(yol.parcalar.every((p) => p.tur === 'duz')).toBe(true);
    expect(yol.uzunluk).toBeCloseTo(9, 12);
  });

  it('parçalar ardışık: her parçanın s0\'ı öncekinin sonu', () => {
    const yol = yolKur(SAPAK, 2);
    let s = 0;
    for (const p of yol.parcalar) {
      expect(p.s0).toBeCloseTo(s, 12);
      s += p.uzunluk;
    }
    expect(s).toBeCloseTo(yol.uzunluk, 12);
  });

  it.each([
    ['tek nokta', [nokta(0, 0)]],
    ['aynı iki nokta', [nokta(1, 1), nokta(1, 1)]],
    ['geri dönüş', [nokta(0, 0), nokta(0, 5), nokta(0, 1)]],
  ])('geçersiz girdi: %s → hata', (_ad, noktalar) => {
    expect(() => yolKur(noktalar, 1)).toThrow(RangeError);
  });

  it('negatif yarıçap → hata', () => {
    expect(() => yolKur(L_SEKLI, -1)).toThrow(RangeError);
  });
});

describe('noktaAl', () => {
  it('uçlar ve sıkıştırma: s < 0 → baş, s > L → son, NaN → baş', () => {
    const yol = yolKur(L_SEKLI, 2);
    expect(noktaAl(yol, 0)).toMatchObject({ x: 0, z: 0, tx: 0, tz: 1 });
    expect(noktaAl(yol, -5)).toEqual(noktaAl(yol, 0));
    expect(noktaAl(yol, Number.NaN)).toEqual(noktaAl(yol, 0));
    const son = noktaAl(yol, yol.uzunluk);
    expect(son.x).toBeCloseTo(10, 12);
    expect(son.z).toBeCloseTo(10, 12);
    expect(son.tx).toBeCloseTo(1, 12);
    expect(noktaAl(yol, 1e9)).toEqual(son);
    expect(noktaAl(yol, Number.POSITIVE_INFINITY)).toEqual(son);
  });

  it('90° yayın ortası köşeden r·(√2 − 1) uzakta', () => {
    const yol = yolKur(L_SEKLI, 2);
    const orta = noktaAl(yol, 8 + Math.PI / 2); // düz 8, sonra yayın yarısı (r·φ/2 = π/2)
    expect(Math.hypot(orta.x - 0, orta.z - 10)).toBeCloseTo(2 * (Math.SQRT2 - 1), 12);
    // teğet 45° (x ve z eşit)
    expect(orta.tx).toBeCloseTo(Math.SQRT1_2, 12);
    expect(orta.tz).toBeCloseTo(Math.SQRT1_2, 12);
  });

  it('sağa dönüş de doğru: (0,0) → (0,10) → (−10,10)', () => {
    const yol = yolKur([nokta(0, 0), nokta(0, 10), nokta(-10, 10)], 2);
    const son = noktaAl(yol, yol.uzunluk);
    expect(son.x).toBeCloseTo(-10, 12);
    expect(son.tx).toBeCloseTo(-1, 12);
  });

  it.each([
    ['L şekli', L_SEKLI, 2],
    ['sapak', SAPAK, 2],
    ['sapak, keskin', SAPAK, 0],
    ['zikzak', [nokta(0, 0), nokta(0, 4), nokta(3, 7), nokta(3, 12), nokta(-2, 17)], 1.5],
  ] as const)('%s: NaN yok, teğet birim uzunlukta', (_ad, noktalar, r) => {
    const yol = yolKur(noktalar, r);
    for (const s of ornekler(yol)) {
      const p = noktaAl(yol, s);
      for (const v of Object.values(p)) expect(Number.isFinite(v)).toBe(true);
      expect(Math.hypot(p.tx, p.tz)).toBeCloseTo(1, 12);
    }
  });

  it.each([
    ['L şekli', L_SEKLI, 2],
    ['sapak', SAPAK, 2],
    ['zikzak', [nokta(0, 0), nokta(0, 4), nokta(3, 7), nokta(3, 12), nokta(-2, 17)], 1.5],
  ] as const)('%s: konum ve teğet sürekli (parça sınırları dahil)', (_ad, noktalar, r) => {
    const yol = yolKur(noktalar, r);
    const e = 1e-6;
    const sinirlar = yol.parcalar.map((p) => p.s0).filter((s) => s > 0);
    // En küçük yay yarıçapı: teğet en fazla Δs / r kadar döner
    const rMin = Math.min(...yol.parcalar.map((p) => (p.tur === 'yay' ? p.r : Number.POSITIVE_INFINITY)));
    for (const s of [...sinirlar, ...ornekler(yol, 300)]) {
      const a = noktaAl(yol, s - e);
      const b = noktaAl(yol, s + e);
      const adim = Math.min(s + e, yol.uzunluk) - Math.max(s - e, 0);
      // konum: iki nokta arası, yol boyunca mesafeden uzun olamaz
      expect(Math.hypot(b.x - a.x, b.z - a.z)).toBeLessThanOrEqual(adim + 1e-9);
      // teğet: sıçrama yok
      expect(Math.hypot(b.tx - a.tx, b.tz - a.tz)).toBeLessThanOrEqual(adim / rMin + 1e-9);
    }
  });

  it('konum s ile tekdüze ilerler: |P(s₂) − P(s₁)| ≈ s₂ − s₁ düzlükte, ≤ s₂ − s₁ her yerde', () => {
    const yol = yolKur(SAPAK, 2);
    const s = ornekler(yol, 500);
    for (let i = 1; i < s.length; i++) {
      const a = noktaAl(yol, s[i - 1]!);
      const b = noktaAl(yol, s[i]!);
      const kiris = Math.hypot(b.x - a.x, b.z - a.z);
      const ds = s[i]! - s[i - 1]!;
      expect(kiris).toBeLessThanOrEqual(ds + 1e-9);
      expect(kiris).toBeGreaterThan(ds * 0.999); // virajda kiriş yaydan çok az kısa
    }
  });
});
