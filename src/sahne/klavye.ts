// Klavyede ← → (Burak'ın kararı, 2026-11-23: "odağa göre"):
//   odak bir destenin içindeyse (kart, kart okları, bant kutusu) → o destenin KARTINI çevirir,
//   değilse (sekme, Hakkımda'daki linkler, özet menüsü, sayfanın boş yeri) → PAFTAYI değiştirir.
// Oklar odaktaki parçaya etki eder: ekran okuyucu kullananların ve klavyeyle gezenlerin beklediği davranış.
//
// klavyeEylemi saf bir karar fonksiyonudur (tests/klavye.test.ts). Pafta.astro ve Sahne.astro'daki betikler
// olayı ve odağın yerini (baglamOku) verir, dönen eyleme göre kartı ya da paftayı çevirir.

export type Yon = 'ileri' | 'geri';

/** KeyboardEvent'in kullandığımız alanları (testte düz nesne verilir). */
export interface Tus {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  /** tuş basılı tutuluyor (otomatik tekrar) */
  repeat?: boolean;
  /** Türkçe dışı klavyelerde harf birleştirme (IME) sürüyor */
  isComposing?: boolean;
}

/** Odağın nerede olduğu */
export interface Baglam {
  /** odak bir destenin ya da bandın içinde ([data-kart-alani]) */
  kartAlaninda: boolean;
  /** odak yazı yazılan bir alanda (input, textarea, select, contenteditable): oklar imleci yürütür */
  yaziAlaninda: boolean;
}

export interface Eylem {
  hedef: 'kart' | 'pafta';
  yon: Yon;
}

/**
 * Basılan tuşun eylemi; bizi ilgilendirmiyorsa null (tarayıcı kendi işini yapsın).
 *   - Alt/Ctrl/Meta/Shift'li basışlar tarayıcının ve sistemin: Alt+← geri gider, Shift+← metin seçer.
 *   - Yazı alanında oklar imleci yürütür.
 *   - Pafta değişimi basılı tutunca tekrarlanmaz (tek basış = tek pafta); kart çevirme tekrarlanabilir.
 */
export function klavyeEylemi(tus: Tus, baglam: Baglam): Eylem | null {
  if (tus.altKey || tus.ctrlKey || tus.metaKey || tus.shiftKey || tus.isComposing) return null;
  const yon: Yon | null = tus.key === 'ArrowRight' ? 'ileri' : tus.key === 'ArrowLeft' ? 'geri' : null;
  if (yon === null || baglam.yaziAlaninda) return null;
  if (baglam.kartAlaninda) return { hedef: 'kart', yon };
  if (tus.repeat) return null;
  return { hedef: 'pafta', yon };
}

/** Olayın hedefinden odağın yeri (yalnızca tarayıcıda çağrılır). */
export function baglamOku(hedef: EventTarget | null): Baglam {
  const oge = hedef instanceof Element ? hedef : null;
  return {
    kartAlaninda: oge?.closest('[data-kart-alani]') != null,
    yaziAlaninda:
      oge !== null && (oge.matches('input, textarea, select') || (oge instanceof HTMLElement && oge.isContentEditable)),
  };
}
