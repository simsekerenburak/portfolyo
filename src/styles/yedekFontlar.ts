// Ölçüsü ayarlanmış yedek fontlar: font yüklenirken metnin kaymasını (CLS) azaltır.
// Değerler elle yazılmaz; @capsizecss/metrics paketindeki font ölçülerinden build sırasında hesaplanır.
// Duzen.astro üretilen CSS'i <head>'e gömer; tokens.css'teki font yığınları bu aile adlarını kullanır.
import arial from '@capsizecss/metrics/arial';
import inter from '@capsizecss/metrics/inter';
import interTight from '@capsizecss/metrics/interTight';
import segoeUI from '@capsizecss/metrics/segoeUI';

/** Hesap için gereken font ölçüleri (font birimi cinsinden; upm = em karesi) */
export interface Olculer {
  fullName: string;
  postscriptName: string;
  ascent: number;
  descent: number;
  lineGap: number;
  unitsPerEm: number;
  /** İngilizce harf sıklığıyla ağırlıklı ortalama küçük harf genişliği */
  xWidthAvg: number;
}

export interface Ayarlar {
  sizeAdjust: number;
  ascentOverride: number;
  descentOverride: number;
  lineGapOverride: number;
}

/**
 * Yedek font (Y) asıl fonta (A) benzesin diye @font-face ayarlarını hesaplar (oran olarak, 1 = %100).
 *
 *   s = (A.xWidthAvg / A.upm) / (Y.xWidthAvg / Y.upm)     → ölçeklenen yedeğin ortalama harf genişliği A'ya eşit
 *
 * Tarayıcı s'yi yedeğin TÜM ölçülerine, override'lar dahil, uygular (CSS Fonts 5, size-adjust).
 * Bu yüzden dikey ölçüler s'ye bölünür ki çarpım sonunda A'nınkine eşit çıksın:
 *   ascent-override   = A.ascent    / (A.upm · s)
 *   descent-override  = |A.descent| / (A.upm · s)
 *   line-gap-override = A.lineGap   / (A.upm · s)
 */
export function yedekAyarlari(asil: Olculer, yedek: Olculer): Ayarlar {
  const s = asil.xWidthAvg / asil.unitsPerEm / (yedek.xWidthAvg / yedek.unitsPerEm);
  const olcekliEm = asil.unitsPerEm * s;
  return {
    sizeAdjust: s,
    ascentOverride: asil.ascent / olcekliEm,
    descentOverride: Math.abs(asil.descent) / olcekliEm,
    lineGapOverride: asil.lineGap / olcekliEm,
  };
}

/** 1.07123 → "107.12%" */
export const yuzde = (oran: number) => `${(oran * 100).toFixed(2)}%`;

export interface YedekTanim {
  /** CSS'te kullanılacak aile adı (tokens.css font yığınında geçer) */
  aile: string;
  asil: Olculer;
  yedek: Olculer;
}

// Sıra önemli değil; yığındaki sırayı tokens.css belirler (önce Segoe UI: Windows, sonra Arial: macOS/iOS).
// JetBrains Mono için yedek yok (Burak'ın kararı: sayı/telemetri satırları kısa, kayma önemsiz).
export const YEDEKLER: readonly YedekTanim[] = [
  { aile: 'Inter Yedek Segoe', asil: inter, yedek: segoeUI },
  { aile: 'Inter Yedek Arial', asil: inter, yedek: arial },
  { aile: 'Inter Tight Yedek Segoe', asil: interTight, yedek: segoeUI },
  { aile: 'Inter Tight Yedek Arial', asil: interTight, yedek: arial },
];

/**
 * Her yedek için bir @font-face üretir. `local()` yerel fontu tam adı ve PostScript adıyla arar;
 * cihazda yoksa bu tanım yüklenmez ve tarayıcı yığındaki bir sonraki aileye geçer.
 */
export function yedekFontCss(tanimlar: readonly YedekTanim[] = YEDEKLER): string {
  return tanimlar
    .map(({ aile, asil, yedek }) => {
      const a = yedekAyarlari(asil, yedek);
      return [
        '@font-face {',
        `  font-family: '${aile}';`,
        `  src: local('${yedek.fullName}'), local('${yedek.postscriptName}');`,
        `  size-adjust: ${yuzde(a.sizeAdjust)};`,
        `  ascent-override: ${yuzde(a.ascentOverride)};`,
        `  descent-override: ${yuzde(a.descentOverride)};`,
        `  line-gap-override: ${yuzde(a.lineGapOverride)};`,
        '}',
      ].join('\n');
    })
    .join('\n');
}
