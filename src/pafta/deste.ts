// Kart destesinin durumu: hangi kart önde, diğerleri nerede? (CLAUDE.md §3.2)
// DOM'a dokunmaz; Pafta.astro'daki betik bu fonksiyonları çağırıp sonucu data-konum niteliğine yazar,
// görünüşü CSS kurar. Böylece mantık tests/deste.test.ts'te tarayıcısız sınanır.
//
// Model: n kart bir halka gibi döner. Tek durum değişkeni `on`: öndeki kartın indisi (0..n−1).
//   → (sonraki): öndeki kart destenin EN ARKASINA gider, ortadaki öne gelir   → on + 1
//   ← (önceki):  en arkadaki kart öne gelir                                   → on − 1

/** Kartın destedeki yeri. En fazla 3 kart görünür (önde tam, arkada ikisinin üst şeridi). */
export type Konum = 'on' | 'orta' | 'arka' | 'gizli';

const GORUNEN: readonly Konum[] = ['on', 'orta', 'arka'];

/**
 * Döngüsel indis: i mod n, sonuç her zaman 0..n−1.
 * JS'nin % işleci negatif sayıda negatif döner (−1 % 4 = −1); ((i mod n) + n) mod n bunu düzeltir.
 */
export function dongu(i: number, n: number): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`deste en az 1 kart içermeli (n = ${n})`);
  return ((i % n) + n) % n;
}

/** → düğmesi: on' = (on + 1) mod n */
export function sonraki(on: number, n: number): number {
  return dongu(on + 1, n);
}

/** ← düğmesi: on' = (on − 1) mod n */
export function onceki(on: number, n: number): number {
  return dongu(on - 1, n);
}

/**
 * Öndeki kart `on` iken k. kartın konumu.
 * s = (k − on) mod n kartın önden kaçıncı sırada olduğudur: 0 önde, 1 ortada, 2 arkada, 3+ görünmez.
 */
export function konumAdi(k: number, on: number, n: number): Konum {
  return GORUNEN[dongu(k - on, n)] ?? 'gizli';
}
