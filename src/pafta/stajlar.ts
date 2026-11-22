// Stajlar koleksiyonunu ortak paftanın veri biçimine çevirir (PaftaOgesi[] + Ozet). Saf fonksiyonlar.
import type { Staj } from '../icerik/sema';
import { METINLER, type Dil } from '../i18n';
import { cogul, tarihAraligi } from './bicim';
import type { Ozet, PaftaOgesi } from './tipler';

/** Bir stajın kartı ve bant kutusu. Bitiş yoksa "Devam ediyor" etiketi alır. */
export function stajOgesi(s: Staj, dil: Dil): PaftaOgesi {
  const m = METINLER[dil].stajlar;
  return {
    id: `stajlar-${s.id}`,
    kisaAd: s.kisaAd,
    ustSatir: tarihAraligi(s.baslangic, s.bitis, dil),
    ...(s.bitis === undefined && { etiket: m.devamEdiyor }),
    baslik: s.ad,
    altSatir: `${s.sehir} · ${s.tanim}`,
    ...(s.aciklama && { aciklama: s.aciklama }),
    haplar: s.etiketler,
  };
}

/** Destedeki kartlar: JSON dosyasındaki sırayla. */
export function stajOgeleri(stajlar: readonly Staj[], dil: Dil): PaftaOgesi[] {
  return stajlar.map((s) => stajOgesi(s, dil));
}

/**
 * Özet menüsü: "3 staj" → "2 şehir" (her şehirde hangi stajlar) ve "1 devam eden".
 * Şehirler stajların sırasıyla ilk görüldükleri yere göre dizilir (en güncel staj başta).
 */
export function stajOzeti(stajlar: readonly Staj[], dil: Dil): Ozet {
  const m = METINLER[dil].stajlar;
  const sehirler = [...new Set(stajlar.map((s) => s.sehir))];
  const devamEdenler = stajlar.filter((s) => s.bitis === undefined);

  const gruplar = [
    {
      sayi: sehirler.length,
      etiket: cogul(sehirler.length, m.sehir),
      satirlar: sehirler.map((sehir) => ({
        baslik: sehir,
        aciklama: stajlar
          .filter((s) => s.sehir === sehir)
          .map((s) => s.ad)
          .join(', '),
      })),
    },
    {
      sayi: devamEdenler.length,
      etiket: m.devamEden,
      satirlar: devamEdenler.map((s) => ({
        baslik: s.ad,
        aciklama: `${tarihAraligi(s.baslangic, s.bitis, dil)} · ${s.tanim}`,
      })),
    },
  ].filter((g) => g.sayi > 0);

  return { sayi: stajlar.length, etiket: cogul(stajlar.length, m.ozet), gruplar };
}
