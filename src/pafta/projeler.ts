// Projeler koleksiyonunu ortak paftanın veri biçimine çevirir (PaftaOgesi[] + Ozet).
// Saf fonksiyonlar: koleksiyonu okumaz (o iş src/icerik/koleksiyonlar.ts'te), yalnızca veri dönüştürür.
// tests/projeler.test.ts kartlarda ve özet menüsünde ne yazacağını buradan sınar.
import { DURUMLAR, type Proje } from '../icerik/sema';
import { METINLER, type Dil } from '../i18n';
import { cogul } from './bicim';
import type { Ozet, PaftaOgesi } from './tipler';

/** Koleksiyondan gelen bir proje: dosya adından slug + şemadan geçmiş veri. */
export interface ProjeKaydi {
  slug: string;
  veri: Proje;
}

/**
 * Koleksiyon kimliğini dil ve slug'a ayırır: "tr/yildiz-takip" → { dil: 'tr', slug: 'yildiz-takip' }.
 * Beklenmeyen bir yol (ör. dil klasörü dışında bir dosya) sessizce yutulmaz, build'i durdurur.
 */
export function kimlikCoz(id: string): { dil: Dil; slug: string } {
  const m = /^(tr|en)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(id);
  if (!m) throw new Error(`Beklenmeyen proje kimliği "${id}": dosya src/content/projeler/<tr|en>/<slug>.md olmalı`);
  return { dil: m[1] as Dil, slug: m[2]! };
}

/** Destedeki sıraya göre (sira: 1 en önde). Girdiyi değiştirmez. */
export function siraliProjeler(kayitlar: readonly ProjeKaydi[]): ProjeKaydi[] {
  return [...kayitlar].sort((a, b) => a.veri.sira - b.veri.sira);
}

/** Kartın üst satırı: zaman (yoksa yıl) ve varsa tür. "2026 · takım projesi", "Bahar 2027 teslim" */
function ustSatir(p: Proje, dil: Dil): string {
  const m = METINLER[dil].projeler;
  const parcalar = [p.zaman ?? String(p.yil)];
  if (p.tur) parcalar.push(m.tur[p.tur]);
  return parcalar.join(' · ');
}

/** Özet satırının açıklaması: alan, varsa kısa tür, yapım aşamasındaysa teslim zamanı. "gömülü · takım" */
function ozetAciklamasi(p: Proje, dil: Dil): string {
  const m = METINLER[dil].projeler;
  const parcalar = [p.alan];
  if (p.tur) parcalar.push(m.turKisa[p.tur]);
  if (p.durum === 'yapim-asamasinda') parcalar.push(p.zaman ?? String(p.yil));
  return parcalar.join(' · ');
}

/** Bir projenin kartı ve bant kutusu. */
export function projeOgesi({ slug, veri: p }: ProjeKaydi, dil: Dil): PaftaOgesi {
  const m = METINLER[dil].projeler;
  return {
    id: `projeler-${slug}`,
    kisaAd: p.kisaAd,
    ustSatir: ustSatir(p, dil),
    ...(p.durum === 'yapim-asamasinda' && { etiket: m.etiket['yapim-asamasinda'] }),
    baslik: p.baslik,
    altSatir: p.altBaslik,
    aciklama: p.rol ? `${p.aciklama} ${m.rol}: ${p.rol}.` : p.aciklama,
    haplar: p.etiketler,
    ...(p.demo && { baglantilar: [{ metin: m.demo, adres: p.demo }] }),
  };
}

/** Destedeki tüm kartlar, sıralı. */
export function projeOgeleri(kayitlar: readonly ProjeKaydi[], dil: Dil): PaftaOgesi[] {
  return siraliProjeler(kayitlar).map((k) => projeOgesi(k, dil));
}

/**
 * Sağdaki özet menüsü: "4 proje" → durum grupları ("3 tamamlanan", "1 yapım aşamasında") → satırlar.
 * Sayılar veriden hesaplanır, elle yazılmaz: proje eklenince menü kendiliğinden güncellenir.
 * Boş grup gösterilmez ("0 yapım aşamasında" yazmaz).
 */
export function projeOzeti(kayitlar: readonly ProjeKaydi[], dil: Dil): Ozet {
  const m = METINLER[dil].projeler;
  const sirali = siraliProjeler(kayitlar);
  const gruplar = DURUMLAR.map((durum) => {
    const grup = sirali.filter((k) => k.veri.durum === durum);
    return {
      sayi: grup.length,
      etiket: m.durum[durum],
      satirlar: grup.map((k) => ({ baslik: k.veri.kisaAd, aciklama: ozetAciklamasi(k.veri, dil) })),
    };
  }).filter((g) => g.sayi > 0);

  return { sayi: sirali.length, etiket: cogul(sirali.length, m.ozet), gruplar };
}
