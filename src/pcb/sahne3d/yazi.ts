// Serigrafi yazıları (CLAUDE.md §3.3): çip ve tabela üstündeki yazılar bir <canvas>'a çizilip doku (texture) olur.
// Aynı self-host fontlar kullanılır; çizmeden önce document.fonts.load ile yüklenmeleri beklenir (yoksa tarayıcı
// yedek fontla çizer ve doku öyle kalır). Yazılar süstür: anlamları DOM'dadır (yedek sayfa, M3'te düğmeler).
import { CanvasTexture, SRGBColorSpace, type WebGLRenderer } from 'three';

export const FONT = {
  baslik: '"Inter Tight", "Segoe UI", system-ui, sans-serif',
  govde: 'Inter, "Segoe UI", system-ui, sans-serif',
  mono: '"JetBrains Mono", Consolas, monospace',
};

/** Serigrafide kullanılan fontları yükler; en fazla `ms` bekler (yavaş ağda sahne yazısız kalmasın, yedek fontla çizer). */
export async function fontlariBekle(ms = 1500): Promise<void> {
  if (!('fonts' in document)) return;
  const yukle = Promise.all([
    document.fonts.load(`600 64px ${FONT.baslik}`, 'ŞİĞÜÖÇ'),
    document.fonts.load(`500 32px ${FONT.govde}`, 'ŞİĞÜÖÇ'),
    document.fonts.load(`400 24px ${FONT.mono}`),
  ]).catch(() => undefined);
  await Promise.race([yukle, new Promise((r) => setTimeout(r, ms))]);
}

export interface Satir {
  metin: string;
  /** CSS font kısaltması: "600 76px <aile>" */
  font: string;
  /** satırın dikey ortası (piksel, canvas'ın üstünden) */
  y: number;
  renk: string;
  /** harf aralığı (px) */
  aralik?: number;
}

/**
 * Satırları en × boy piksellik saydam bir canvas'a ortalayarak çizer ve dokuya çevirir.
 * Metin genişliği canvas'ı aşarsa yatayda sıkıştırılır (uzun ad taşmasın).
 */
export function yaziDokusu(
  renderer: WebGLRenderer,
  satirlar: readonly Satir[],
  en: number,
  boy: number,
  zemin?: string,
): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = en;
  c.height = boy;
  const g = c.getContext('2d');
  if (g) {
    if (zemin) {
      g.fillStyle = zemin;
      g.fillRect(0, 0, en, boy);
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const s of satirlar) {
      g.font = s.font;
      g.fillStyle = s.renk;
      if ('letterSpacing' in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${s.aralik ?? 0}px`;
      const genislik = g.measureText(s.metin).width;
      const sigan = en * 0.92;
      g.save();
      g.translate(en / 2, s.y);
      if (genislik > sigan) g.scale(sigan / genislik, 1);
      g.fillText(s.metin, 0, 0);
      g.restore();
    }
  }
  const doku = new CanvasTexture(c);
  doku.colorSpace = SRGBColorSpace;
  doku.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return doku;
}
