// Astro içerik koleksiyonları (content collections).
// Koleksiyon = aynı şemaya uyan içerik dosyaları kümesi. Astro build sırasında dosyaları okur, her birini
// şemadan geçirir ve sayfalara `getCollection('projeler')` ile tipli veri olarak verir.
// Şemaların kendisi src/icerik/sema.ts'te (testler oradan kullanır).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { projeSemasi } from './icerik/sema';

// glob yükleyicisi: klasördeki her .md bir kayıt. Kaydın kimliği (id) dosya yolundan üretilir:
//   src/content/projeler/tr/yildiz-takip.md → "tr/yildiz-takip"
// Dil ve slug bu id'den ayrılır (src/pafta/projeler.ts → kimlikCoz).
const projeler = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/projeler' }),
  schema: projeSemasi,
});

export const collections = { projeler };
