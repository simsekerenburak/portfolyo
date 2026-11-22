// Ortak içerik paftasının (CLAUDE.md §3.2) veri sözleşmesi.
// Projeler, Stajlar, Yetkinlikler ve Belgeler aynı Pafta bileşeninden üretilir; her biri kendi verisini
// bu iki biçime çevirir (ör. src/pafta/projeler.ts). Bileşenler yalnızca bu tipleri tanır.

/** Destedeki bir kart ve banttaki karşılığı olan kutu. */
export interface PaftaOgesi {
  /** Sayfa içi kimlik: "projeler-yildiz-takip". Bant kutusu `#<id>` adresine bağlanır (JS'siz de çalışır). */
  id: string;
  /** Bant kutusu ve arkadaki kartın şeridi: "Yıldız Takip" */
  kisaAd: string;
  /** Kartın üst satırı (mono): "2026 · takım projesi" */
  ustSatir: string;
  /** Varsa üst satırın yanındaki etiket hapı: "Yapım aşamasında" */
  etiket?: string;
  /** Kart başlığı (27px) */
  baslik: string;
  /** Başlığın altındaki satır */
  altSatir: string;
  aciklama: string;
  /** Teknoloji hapları */
  haplar: string[];
  /** Varsa dış bağlantı (ör. canlı demo) */
  baglanti?: { metin: string; adres: string };
}

/** Özet menüsünün en iç satırı: "Yıldız Takip / gömülü · takım" */
export interface OzetSatiri {
  baslik: string;
  aciklama: string;
}

/** Alt açılır menü: "3 tamamlanan" ve altındaki satırlar */
export interface OzetGrubu {
  sayi: number;
  etiket: string;
  satirlar: OzetSatiri[];
}

/** Sağdaki özet açılır menüsü: "4 proje" ve alt grupları */
export interface Ozet {
  sayi: number;
  etiket: string;
  gruplar: OzetGrubu[];
}
