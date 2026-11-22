// Paftalarda ortak biçimlendirme: ay hassasiyetli tarihler ve sayıya göre tekil/çoğul etiket.
// Ay adları i18n dosyalarında (aylar.uzun / aylar.kisa): tarayıcının ya da Node'un Intl verisine
// bağlı kalmasın diye (ICU sürümü değişince "Eyl" → "Eylül" gibi sessiz kaymalar olmasın).
import { METINLER, type Dil } from '../i18n';

/** "2026-09" → { yil: 2026, ay: 9 } (ay 1..12). Biçim şemada da denetlenir; burada ikinci emniyet. */
export function ayCoz(tarih: string): { yil: number; ay: number } {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(tarih);
  if (!m) throw new Error(`Geçersiz ay tarihi "${tarih}": "YYYY-AA" biçiminde olmalı`);
  return { yil: Number(m[1]), ay: Number(m[2]) };
}

function ayAdi(ay: number, dil: Dil, bicim: 'uzun' | 'kisa'): string {
  return METINLER[dil].aylar[bicim][ay - 1]!;
}

/** "2026-09" → "Eylül 2026" / "September 2026" */
export function ayYil(tarih: string, dil: Dil): string {
  const { yil, ay } = ayCoz(tarih);
  return `${ayAdi(ay, dil, 'uzun')} ${yil}`;
}

/**
 * Tarih aralığı, kartın üst satırı için:
 *   bitiş yok        → "Eylül 2026 →"        (devam ediyor)
 *   aynı ay          → "Eylül 2026"
 *   aynı yıl         → "Ağu – Eyl 2026"      (yıl bir kez)
 *   farklı yıllar    → "Ara 2025 – Oca 2026"
 */
export function tarihAraligi(baslangic: string, bitis: string | undefined, dil: Dil): string {
  if (bitis === undefined) return `${ayYil(baslangic, dil)} →`;
  const a = ayCoz(baslangic);
  const b = ayCoz(bitis);
  if (a.yil === b.yil && a.ay === b.ay) return ayYil(baslangic, dil);
  if (a.yil === b.yil) return `${ayAdi(a.ay, dil, 'kisa')} – ${ayAdi(b.ay, dil, 'kisa')} ${a.yil}`;
  return `${ayAdi(a.ay, dil, 'kisa')} ${a.yil} – ${ayAdi(b.ay, dil, 'kisa')} ${b.yil}`;
}

/** Sayıya göre etiket: Türkçede sayıdan sonra isim tekil kalır ("3 staj"), İngilizcede çoğul olur ("3 internships"). */
export function cogul(n: number, etiket: { bir: string; cok: string }): string {
  return n === 1 ? etiket.bir : etiket.cok;
}
