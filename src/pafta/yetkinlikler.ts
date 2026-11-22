// Yetkinlikler koleksiyonunu ortak paftanın veri biçimine çevirir. Saf fonksiyonlar.
// Kullanım referansları ("proje:yildiz-takip") burada projeler ve stajlar verisinden çözülür;
// var olmayan bir referans hata fırlatır → build durur (yanlış yazılmış slug sessizce geçmez).
import type { Staj, Yetkinlik } from '../icerik/sema';
import { METINLER, type Dil } from '../i18n';
import { cogul } from './bicim';
import { siraliProjeler, type ProjeKaydi } from './projeler';
import type { Ozet, PaftaOgesi } from './tipler';

/** Referansların çözüleceği öteki koleksiyonlar (aynı dilde). */
export interface Kaynaklar {
  projeler: readonly ProjeKaydi[];
  stajlar: readonly Staj[];
}

/** "proje:yildiz-takip" → "Yıldız Takip", "staj:demircan" → "Demircan", "egitim" → "eğitimler". */
export function kullanimAdi(ref: string, kaynak: Kaynaklar, dil: Dil): string {
  if (ref === 'egitim') return METINLER[dil].yetkinlikler.egitim;
  const [tur, kimlik] = ref.split(':');
  const ad =
    tur === 'proje'
      ? kaynak.projeler.find((p) => p.slug === kimlik)?.veri.kisaAd
      : tur === 'staj'
        ? kaynak.stajlar.find((s) => s.id === kimlik)?.kisaAd
        : undefined;
  if (ad === undefined) throw new Error(`Yetkinlik kullanımı "${ref}" (${dil}) hiçbir kayda karşılık gelmiyor`);
  return ad;
}

/** Bir alanın kartı: üst satırda nerede kullanıldığı, haplarda araçlar. */
export function yetkinlikOgesi(a: Yetkinlik, kaynak: Kaynaklar, dil: Dil): PaftaOgesi {
  return {
    id: `yetkinlikler-${a.id}`,
    kisaAd: a.kisaAd,
    ustSatir: a.kullanim.map((r) => kullanimAdi(r, kaynak, dil)).join(' · '),
    baslik: a.ad,
    altSatir: a.altBaslik,
    aciklama: a.aciklama,
    haplar: a.araclar,
  };
}

export function yetkinlikOgeleri(alanlar: readonly Yetkinlik[], kaynak: Kaynaklar, dil: Dil): PaftaOgesi[] {
  return alanlar.map((a) => yetkinlikOgesi(a, kaynak, dil));
}

/**
 * Özet menüsü: "5 alan" → "21 araç" (her alanın araçları) ve "3 proje" (her projede hangi alanlar).
 * Araç sayısı tekrarsız sayılır (aynı araç iki alanda geçse bir kez sayılır).
 * Projeler, projeler paftasındaki sırayla; yalnızca en az bir alanın referans verdiği projeler.
 */
export function yetkinlikOzeti(alanlar: readonly Yetkinlik[], kaynak: Kaynaklar, dil: Dil): Ozet {
  const m = METINLER[dil];
  // Önce bütün referansların çözüldüğünden emin ol (özet de kırık referansla üretilmesin).
  for (const a of alanlar) for (const r of a.kullanim) kullanimAdi(r, kaynak, dil);

  const aracSayisi = new Set(alanlar.flatMap((a) => a.araclar)).size;
  const kullanilanProjeler = siraliProjeler(kaynak.projeler).filter((p) =>
    alanlar.some((a) => a.kullanim.includes(`proje:${p.slug}`)),
  );

  const gruplar = [
    {
      sayi: aracSayisi,
      etiket: cogul(aracSayisi, m.yetkinlikler.arac),
      satirlar: alanlar.map((a) => ({ baslik: a.ad, aciklama: a.araclar.join(', ') })),
    },
    {
      sayi: kullanilanProjeler.length,
      etiket: cogul(kullanilanProjeler.length, m.projeler.ozet),
      satirlar: kullanilanProjeler.map((p) => ({
        baslik: p.veri.kisaAd,
        aciklama: alanlar
          .filter((a) => a.kullanim.includes(`proje:${p.slug}`))
          .map((a) => a.kisaAd)
          .join(', '),
      })),
    },
  ].filter((g) => g.sayi > 0);

  return { sayi: alanlar.length, etiket: cogul(alanlar.length, m.yetkinlikler.ozet), gruplar };
}
