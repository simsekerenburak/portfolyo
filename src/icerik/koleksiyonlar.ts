// Koleksiyonları okuyan ince katman. `astro:content` yalnızca Astro içinde (build/dev) vardır, Vitest'te
// yoktur; bu yüzden okuma burada, dönüştürme saf modüllerde (src/pafta/projeler.ts) durur.
import { getCollection } from 'astro:content';
import type { Dil } from '../i18n';
import { kimlikCoz, siraliProjeler, type ProjeKaydi } from '../pafta/projeler';

/** Bir dilin projeleri, destedeki sırayla. */
export async function projeKayitlari(dil: Dil): Promise<ProjeKaydi[]> {
  const kayitlar = (await getCollection('projeler')).flatMap((kayit) => {
    const { dil: kayitDili, slug } = kimlikCoz(kayit.id);
    return kayitDili === dil ? [{ slug, veri: kayit.data }] : [];
  });
  return siraliProjeler(kayitlar);
}
