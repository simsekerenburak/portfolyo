// Koleksiyonları okuyan ince katman. `astro:content` yalnızca Astro içinde (build/dev) vardır, Vitest'te
// yoktur; bu yüzden okuma burada, dönüştürme saf modüllerde (src/pafta/*.ts) durur.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection, getEntry } from 'astro:content';
import type { Dil } from '../i18n';
import { METINLER } from '../i18n';
import { kimlikCoz, siraliProjeler, type ProjeKaydi } from '../pafta/projeler';
import type { BelgelerDosyasi, StajlarDosyasi, YetkinliklerDosyasi } from './sema';

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

/** Bir dilin yetkinlikler dosyası (src/content/yetkinlikler/<dil>.json). */
export async function yetkinliklerDosyasi(dil: Dil): Promise<YetkinliklerDosyasi> {
  const kayit = await getEntry('yetkinlikler', dil);
  if (!kayit) throw new Error(`src/content/yetkinlikler/${dil}.json bulunamadı`);
  return kayit.data;
}

/** Bir dilin belgeler dosyası (src/content/belgeler/<dil>.json). */
export async function belgelerDosyasi(dil: Dil): Promise<BelgelerDosyasi> {
  const kayit = await getEntry('belgeler', dil);
  if (!kayit) throw new Error(`src/content/belgeler/${dil}.json bulunamadı`);
  return kayit.data;
}

/**
 * public/ altında dosya var mı? ("/cv/burak-eren-simsek-cv-tr.pdf" → public/cv/burak-eren-simsek-cv-tr.pdf)
 * Build proje kökünden çalışır (npm betikleri), bu yüzden kök process.cwd(). Yalnızca build sırasında çağrılır;
 * sonuç statik HTML'e yazılır, tarayıcıda dosya sistemi erişimi yoktur.
 */
export function publicDosyasiVar(yol: string): boolean {
  return existsSync(join(process.cwd(), 'public', yol));
}

/** Ana sayfanın bütün içeriği, tek yerden. Sayfa ve paftalar aynı veriyi kullanır. */
export async function sayfaVerisi(dil: Dil) {
  const [projeler, stajlar, yetkinlikler, belgeler] = await Promise.all([
    projeKayitlari(dil),
    stajlarDosyasi(dil),
    yetkinliklerDosyasi(dil),
    belgelerDosyasi(dil),
  ]);
  return {
    projeler,
    stajlar: stajlar.stajlar,
    alanlar: yetkinlikler.alanlar,
    belgeler: belgeler.belgeler,
    // Sayfadaki herhangi bir içerik kaba çeviriyse sayfa taslaktır (kontrol.mjs M1–M5 uyarır, M6'da kırar).
    taslak:
      METINLER[dil].taslak ||
      projeler.some((p) => p.veri.taslak) ||
      stajlar.taslak ||
      yetkinlikler.taslak ||
      belgeler.taslak,
  };
}

/** sayfaVerisi'nin döndürdüğü veri (YedekSayfa bütün bölümlere bunu dağıtır). */
export type SayfaVerisi = Awaited<ReturnType<typeof sayfaVerisi>>;
