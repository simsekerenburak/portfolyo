// Koleksiyonları okuyan ince katman. `astro:content` yalnızca Astro içinde (build/dev) vardır, Vitest'te
// yoktur; bu yüzden okuma burada, dönüştürme saf modüllerde (src/pafta/*.ts) durur.
import { getCollection, getEntry } from 'astro:content';
import type { Dil } from '../i18n';
import { METINLER } from '../i18n';
import { kimlikCoz, siraliProjeler, type ProjeKaydi } from '../pafta/projeler';
import type { StajlarDosyasi } from './sema';

/** Bir dilin projeleri, destedeki sırayla. */
export async function projeKayitlari(dil: Dil): Promise<ProjeKaydi[]> {
  const kayitlar = (await getCollection('projeler')).flatMap((kayit) => {
    const { dil: kayitDili, slug } = kimlikCoz(kayit.id);
    return kayitDili === dil ? [{ slug, veri: kayit.data }] : [];
  });
  return siraliProjeler(kayitlar);
}

/** Bir dilin stajlar dosyası (src/content/stajlar/<dil>.json). Dosya yoksa build durur. */
export async function stajlarDosyasi(dil: Dil): Promise<StajlarDosyasi> {
  const kayit = await getEntry('stajlar', dil);
  if (!kayit) throw new Error(`src/content/stajlar/${dil}.json bulunamadı`);
  return kayit.data;
}

/** Ana sayfanın bütün içeriği, tek yerden. Sayfa ve paftalar aynı veriyi kullanır. */
export async function sayfaVerisi(dil: Dil) {
  const [projeler, stajlar] = await Promise.all([projeKayitlari(dil), stajlarDosyasi(dil)]);
  return {
    projeler,
    stajlar: stajlar.stajlar,
    // Sayfadaki herhangi bir içerik kaba çeviriyse sayfa taslaktır (kontrol.mjs M1–M5 uyarır, M6'da kırar).
    taslak: METINLER[dil].taslak || projeler.some((p) => p.veri.taslak) || stajlar.taslak,
  };
}
