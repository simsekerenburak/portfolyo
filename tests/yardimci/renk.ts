// Renk hesapları: ayrıştırma, alfa kompoziti, WCAG kontrastı, ton/kroma.
// Testlerde "ölçüm aleti" olarak kullanılır; doğruluğu renk.test.ts'in ilk bölümünde sınanır.

/** 0..255 kanallı opak renk */
export type RGB = [number, number, number];
/** 0..255 kanallar + 0..1 alfa */
export type RGBA = [number, number, number, number];

/**
 * "#RGB" | "#RRGGBB" | "#RRGGBBAA" | "rgb(r, g, b)" | "rgba(r, g, b, a)" → [r, g, b, a].
 * Tanımadığı biçimde hata fırlatır (sessizce yanlış renk üretmesin).
 */
export function renkCoz(metin: string): RGBA {
  const s = metin.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s);
  if (hex) {
    let h = hex[1]!;
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a];
  }
  const fn = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(s);
  if (fn) {
    return [Number(fn[1]), Number(fn[2]), Number(fn[3]), fn[4] === undefined ? 1 : Number(fn[4])];
  }
  throw new Error(`Tanınmayan renk biçimi: "${metin}"`);
}

/**
 * Alfa kompoziti ("source-over"): yarı saydam üst renk opak alt yüzeyin üstünde.
 *   C = a·C_üst + (1 − a)·C_alt   (her kanal için ayrı)
 * Ekranda gerçekte görünen rengi verir; kontrast bu renge göre ölçülür.
 */
export function kompozit(ust: RGBA, alt: RGB): RGB {
  const a = ust[3];
  return [0, 1, 2].map((i) => a * ust[i]! + (1 - a) * alt[i]!) as RGB;
}

/**
 * WCAG 2.x göreli parlaklık (relative luminance), 0 (siyah) .. 1 (beyaz).
 * Her sRGB kanalı c = v/255 önce doğrusallaştırılır:
 *   c ≤ 0.04045 → c / 12.92,   değilse ((c + 0.055) / 1.055)^2.4
 * Sonra gözün kanallara duyarlılığıyla ağırlıklandırılır:
 *   L = 0.2126·R + 0.7152·G + 0.0722·B   (göz en çok yeşile duyarlı)
 */
export function goreliParlaklik([r, g, b]: RGB): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * WCAG kontrast oranı: (L_açık + 0.05) / (L_koyu + 0.05).
 * 1 (aynı renk) .. 21 (siyah/beyaz). +0.05 ekran yansımasını temsil eder.
 */
export function kontrast(a: RGB, b: RGB): number {
  const [la, lb] = [goreliParlaklik(a), goreliParlaklik(b)];
  const [acik, koyu] = la > lb ? [la, lb] : [lb, la];
  return (acik + 0.05) / (koyu + 0.05);
}

/**
 * HSV tonu (derece, 0..360) ve kroma (max − min, 0..255).
 * Kroma "ne kadar renkli": 0 = tam gri. Kroma çok küçükken ton anlamsızlaşır.
 *   max = R → ton = 60·((G − B)/kroma mod 6)
 *   max = G → ton = 60·((B − R)/kroma + 2)
 *   max = B → ton = 60·((R − G)/kroma + 4)
 */
export function tonVeKroma([r, g, b]: RGB): { ton: number; kroma: number } {
  const mx = Math.max(r, g, b);
  const kroma = mx - Math.min(r, g, b);
  if (kroma === 0) return { ton: 0, kroma: 0 };
  const h = mx === r ? ((g - b) / kroma) % 6 : mx === g ? (b - r) / kroma + 2 : (r - g) / kroma + 4;
  return { ton: (h * 60 + 360) % 360, kroma };
}

/** "Mavi yok" kuralı (CLAUDE.md §4.2): camgöbeği → mavi → mavi-mor bandı */
export const MAVI_BANDI = { min: 170, max: 270 } as const;
/** Bu kromanın altındaki renkler "neredeyse nötr" sayılır; tonları güvenilmez */
export const NOTR_KROMA = 5;

/**
 * Rengin yasak (mavi veya soğuk gri) olup olmadığını söyler.
 *  (a) kroma ≥ NOTR_KROMA ise ton MAVI_BANDI dışında olmalı,
 *  (b) kroma < NOTR_KROMA ise (neredeyse gri) sıcak tarafa yatmalı: R > B.
 * Yasaksa sebebi döndürür, uygunsa null.
 */
export function sogukRenkSebebi(rgb: RGB): string | null {
  const { ton, kroma } = tonVeKroma(rgb);
  if (kroma >= NOTR_KROMA) {
    return ton >= MAVI_BANDI.min && ton <= MAVI_BANDI.max
      ? `ton ${ton.toFixed(0)}° mavi bandında (${MAVI_BANDI.min}°–${MAVI_BANDI.max}°)`
      : null;
  }
  return rgb[0] > rgb[2] ? null : `neredeyse gri (kroma ${kroma}) ama sıcak değil: R=${rgb[0]} ≤ B=${rgb[2]}`;
}

/**
 * WCAG 1.4.3 metin kontrast eşiği.
 * Büyük metin: ≥ 24px, ya da ≥ 18.66px ve kalın (font-weight ≥ 700) → 3:1. Diğerleri → 4.5:1.
 */
export function kontrastEsigi(px: number, kalinlik: number): number {
  const buyuk = px >= 24 || (px >= 18.66 && kalinlik >= 700);
  return buyuk ? 3 : 4.5;
}

/** WCAG 1.4.11: anlam taşıyan simge/arayüz grafiği (ok, düğme glifi) → 3:1 */
export const SIMGE_ESIGI = 3;
