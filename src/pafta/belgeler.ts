// Belgeler koleksiyonunu ortak paftanın veri biçimine çevirir. Saf fonksiyonlar.
// CV dosyalarının var olup olmadığı dışarıdan verilir (`dosyaVar`): build'de diske bakan fonksiyon
// (src/icerik/koleksiyonlar.ts), testte sahte fonksiyon. Böylece iki durum da diske dokunmadan sınanır.
import type { Belge, Cv, Sertifika } from '../icerik/sema';
import { METINLER, type Dil } from '../i18n';
import { ayYil, cogul } from './bicim';
import type { Ozet, PaftaOgesi } from './tipler';

/** public/ altındaki bir dosya var mı? ("/cv/burak-eren-simsek-cv-tr.pdf") */
export type DosyaVar = (yol: string) => boolean;

/** CV'nin bütün PDF'leri hazır mı? Biri bile eksikse kart "Yakında" durumundadır. */
export function cvHazir(cv: Cv, dosyaVar: DosyaVar): boolean {
  return cv.dosyalar.every((d) => dosyaVar(d.yol));
}

/**
 * Özgeçmiş kartı.
 *   hazır  → hazır açıklaması + her dil için "Türkçe PDF" bağlantısı
 *   eksik  → "Yakında" etiketi + yakında açıklaması; yalnızca VAR OLAN dosyalar bağlanır (kırık link yok)
 */
function cvOgesi(cv: Cv, dil: Dil, dosyaVar: DosyaVar): PaftaOgesi {
  const m = METINLER[dil].belgeler;
  const hazir = cvHazir(cv, dosyaVar);
  const baglantilar = cv.dosyalar
    .filter((d) => dosyaVar(d.yol))
    .map((d) => ({ metin: `${m.diller[d.dil]} ${m.pdf}`, adres: d.yol }));
  return {
    id: `belgeler-${cv.id}`,
    kisaAd: cv.kisaAd,
    ustSatir: cv.dosyalar.map((d) => m.diller[d.dil]).join(' · '),
    ...(!hazir && { etiket: m.yakinda }),
    baslik: cv.ad,
    altSatir: cv.altBaslik,
    aciklama: hazir ? cv.aciklama : cv.yakindaAciklama,
    haplar: [],
    ...(baglantilar.length > 0 && { baglantilar }),
  };
}

/**
 * Sertifika kartı: tarih, kurum (varsa yanında belgedeki unvan, aynen); açıklamanın sonuna varsa rol ("Rolüm: …")
 * ve doğrulama numarası eklenir; haplar: belge türü, doğrulanabilir, varsa ek etiketler.
 */
function sertifikaOgesi(s: Sertifika, dil: Dil): PaftaOgesi {
  const m = METINLER[dil].belgeler;
  const haplar: string[] = [m.belgeTuru[s.belgeTuru], ...(s.etiketler ?? [])];
  if (s.dogrulanabilir) haplar.splice(1, 0, m.dogrulanabilir);
  let aciklama = s.aciklama;
  if (s.rol) aciklama += ` ${METINLER[dil].projeler.rol}: ${s.rol}.`;
  if (s.dogrulamaNo) aciklama += ` ${m.dogrulamaNo}: ${s.dogrulamaNo}.`;
  return {
    id: `belgeler-${s.id}`,
    kisaAd: s.kisaAd,
    ustSatir: ayYil(s.tarih, dil),
    baslik: s.ad,
    altSatir: s.unvan ? `${s.kurum} · ${s.unvan}` : s.kurum,
    aciklama,
    haplar,
    ...(s.dogrulamaAdresi && { baglantilar: [{ metin: m.dogrula, adres: s.dogrulamaAdresi }] }),
  };
}

export function belgeOgesi(b: Belge, dil: Dil, dosyaVar: DosyaVar): PaftaOgesi {
  return b.tur === 'cv' ? cvOgesi(b, dil, dosyaVar) : sertifikaOgesi(b, dil);
}

/** Destedeki kartlar: JSON dosyasındaki sırayla (özgeçmiş önde). */
export function belgeOgeleri(belgeler: readonly Belge[], dil: Dil, dosyaVar: DosyaVar): PaftaOgesi[] {
  return belgeler.map((b) => belgeOgesi(b, dil, dosyaVar));
}

/**
 * Özet menüsü: "4 belge" → "3 sertifika" (kurum / tarih) ve "2 dilde CV" (dil / PDF ya da Yakında).
 * "2 dilde CV": CV dosyalarının dil sayısı (belge sayısı değil).
 */
export function belgeOzeti(belgeler: readonly Belge[], dil: Dil, dosyaVar: DosyaVar): Ozet {
  const m = METINLER[dil].belgeler;
  const sertifikalar = belgeler.filter((b): b is Sertifika => b.tur === 'sertifika');
  const cvDosyalari = belgeler.filter((b): b is Cv => b.tur === 'cv').flatMap((cv) => cv.dosyalar);

  const gruplar = [
    {
      sayi: sertifikalar.length,
      etiket: cogul(sertifikalar.length, m.sertifika),
      satirlar: sertifikalar.map((s) => ({ baslik: s.kurum, aciklama: ayYil(s.tarih, dil) })),
    },
    {
      sayi: cvDosyalari.length,
      etiket: cogul(cvDosyalari.length, m.cvDil),
      satirlar: cvDosyalari.map((d) => ({ baslik: m.diller[d.dil], aciklama: dosyaVar(d.yol) ? m.pdf : m.yakinda })),
    },
  ].filter((g) => g.sayi > 0);

  return { sayi: belgeler.length, etiket: cogul(belgeler.length, m.ozet), gruplar };
}
