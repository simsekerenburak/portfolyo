// Testler için içerik okuyucu: src/content/projeler/<dil>/*.md dosyalarının frontmatter'ı.
// Astro'nun kullandığı aynı YAML ayrıştırıcısı (yaml@2); `astro:content` Vitest'te olmadığı için diskten okunur.
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { projeSemasi, type Proje } from '../../src/icerik/sema';
import { siraliProjeler, type ProjeKaydi } from '../../src/pafta/projeler';

const KOK = new URL('../../src/content/projeler/', import.meta.url);

/** Markdown dosyasının baştaki `---` blokları arasındaki YAML'ı nesneye çevirir. */
export function frontmatter(metin: string): unknown {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(metin);
  if (!m) throw new Error('frontmatter bulunamadı');
  return parse(m[1]!);
}

/** Bir dil klasöründeki tüm projeler, şemadan GEÇMEDEN: slug → ham frontmatter */
export function hamProjeler(dil: string): Map<string, unknown> {
  const klasor = new URL(`${dil}/`, KOK);
  const sonuc = new Map<string, unknown>();
  for (const dosya of readdirSync(klasor).filter((d) => d.endsWith('.md')).sort()) {
    sonuc.set(dosya.replace(/\.md$/, ''), frontmatter(readFileSync(new URL(dosya, klasor), 'utf8')));
  }
  return sonuc;
}

/** Şemadan geçen projeler (geçmeyen atlanır; onu tests/icerik.test.ts ayrıca yakalar). */
export function projeler(dil: string): Map<string, Proje> {
  const sonuc = new Map<string, Proje>();
  for (const [slug, ham] of hamProjeler(dil)) {
    const r = projeSemasi.safeParse(ham);
    if (r.success) sonuc.set(slug, r.data);
  }
  return sonuc;
}

/** JSON koleksiyonunun bir dil dosyası, şemadan GEÇMEDEN: src/content/<koleksiyon>/<dil>.json */
export function jsonIcerik(koleksiyon: string, dil: string): unknown {
  return JSON.parse(readFileSync(new URL(`../../src/content/${koleksiyon}/${dil}.json`, import.meta.url), 'utf8'));
}

/** Sayfanın kullandığı kayıtlar: src/icerik/koleksiyonlar.ts → projeKayitlari gibi, destedeki sırayla. */
export function projeKayitlari(dil: string): ProjeKaydi[] {
  return siraliProjeler([...projeler(dil)].map(([slug, veri]) => ({ slug, veri })));
}
