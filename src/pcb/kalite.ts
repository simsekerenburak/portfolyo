// Kalite kademeleri (CLAUDE.md §8, §2.2): Yüksek · Orta · Düşük. Saf karar mantığı (tests/kalite.test.ts);
// kademeyi sahneye uygulayan kod src/pcb/sahne3d/ altında (gölge haritası, piksel oranı, ayrıntı).
//
//   Yüksek: gölge haritası, piksel oranı ≤ 2
//   Orta:   gölge haritası yok → çiplerin altında hazır yumuşak lekeler, piksel oranı ≤ 1,5
//   Düşük:  lekeler, piksel oranı 1, daha az ayrıntı (ızgara, dağınık via ve ufuk silüetleri çizilmez)
//
// Başlangıç kademesi ekrandan tahmin edilir; sonra kamera hareket ederken ölçülen kare sürelerine göre gerekirse
// düşürülür (yükseltilmez: iki kademe arasında gidip gelmesin). Düşük kademede de yavaşsa "Düz görünüm" önerilir.

export type Kademe = 'yuksek' | 'orta' | 'dusuk';

export interface KademeAyari {
  golgeHaritasi: boolean;
  /** gölge haritası yoksa çiplerin altına hazır yumuşak leke */
  leke: boolean;
  pikselOraniUst: number;
  /** ızgara, dağınık via ve ufuk silüetleri */
  ayrinti: boolean;
}

export const KADEMELER: Record<Kademe, KademeAyari> = {
  yuksek: { golgeHaritasi: true, leke: false, pikselOraniUst: 2, ayrinti: true },
  orta: { golgeHaritasi: false, leke: true, pikselOraniUst: 1.5, ayrinti: true },
  dusuk: { golgeHaritasi: false, leke: true, pikselOraniUst: 1, ayrinti: false },
};

const SIRA: readonly Kademe[] = ['yuksek', 'orta', 'dusuk'];

export interface Ekran {
  /** CSS pikseli */
  en: number;
  boy: number;
  dpr: number;
  /** birincil işaretçi dokunmatik mi (pointer: coarse) */
  dokunmatik: boolean;
}

/** Çizilen piksel sayısı bunu aşarsa (≈ 1440 × 900 × 2² ≈ 5,2 M) başlangıç Orta: 4K / yüksek dpr'li büyük ekran. */
const YUKSEK_PIKSEL_UST = 5.5e6;

/**
 * Başlangıç kademesi: dokunmatik (telefon/tablet) → Orta; çizilecek piksel (en·boy·min(dpr, 2)²) çok fazla → Orta;
 * aksi hâlde Yüksek. Düşük yalnızca ölçümle seçilir (§8: telefonda önce tam hâl denenir, sonra sadeleştirilir).
 */
export function baslangicKademesi(e: Ekran): Kademe {
  if (e.dokunmatik) return 'orta';
  const d = Math.min(e.dpr, 2);
  return e.en * e.boy * d * d > YUKSEK_PIKSEL_UST ? 'orta' : 'yuksek';
}

/** Ölçüm penceresi ve eşikler (ms). 60 fps → 16,7 ms; 24 fps → 41,7 ms. */
export const OLCUM = {
  /** karar için gereken kare sayısı (yalnızca kamera hareket ederken çizilen kareler) */
  kareSayisi: 60,
  /** kare sürelerinin %90'lık değeri bunu aşarsa bir kademe düş (≈ 45 fps altı) */
  dusurEsik: 22,
  /** Düşük kademede ortalama bunu aşarsa (24 fps altı) "Düz görünüm" öner */
  duzEsik: 1000 / 24,
} as const;

/** Sıralı dizinin p yüzdeliği (0..1), en yakın sıra yöntemi. */
export function yuzdelik(sirali: readonly number[], p: number): number {
  if (sirali.length === 0) return Number.NaN;
  const i = Math.min(sirali.length - 1, Math.max(0, Math.ceil(p * sirali.length) - 1));
  return sirali[i]!;
}

export type KademeKarari = { tur: 'kal' } | { tur: 'dusur'; yeni: Kademe } | { tur: 'duz-oner' };

/**
 * Ölçülen kare sürelerine (ms) göre karar. Yeterli örnek yoksa (< kareSayisi) 'kal'.
 * Aşırı uzun tek kareler (> 250 ms: sekme gizlendi, sayfa takıldı) sayılmaz.
 *   p90 > dusurEsik ve daha düşük kademe var → bir kademe düş
 *   Düşük kademede ortalama > duzEsik → "Düz görünüm" öner
 */
export function kademeKarari(simdiki: Kademe, sureler: readonly number[]): KademeKarari {
  const gecerli = sureler.filter((s) => Number.isFinite(s) && s > 0 && s <= 250);
  if (gecerli.length < OLCUM.kareSayisi) return { tur: 'kal' };
  const sirali = [...gecerli].sort((a, b) => a - b);
  const p90 = yuzdelik(sirali, 0.9);
  const ortalama = gecerli.reduce((t, s) => t + s, 0) / gecerli.length;
  const i = SIRA.indexOf(simdiki);
  if (simdiki === 'dusuk') return ortalama > OLCUM.duzEsik ? { tur: 'duz-oner' } : { tur: 'kal' };
  if (p90 > OLCUM.dusurEsik) return { tur: 'dusur', yeni: SIRA[i + 1]! };
  return { tur: 'kal' };
}
