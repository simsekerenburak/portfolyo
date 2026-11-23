// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Sitemap, canonical link ve tam URL üretimi için sitenin KALICI kök adresi.
  // Site Cloudflare Pages'te barınır (burakerensimsek.pages.dev); M7'de bu alan adı ona bağlanır.
  // Site alan adının kökünden yayınlandığı için `base` gerekmez.
  site: 'https://burakerensimsek.is-a.dev',

  // Cloudflare Pages `en/index.html` dosyasını `/en/` adresinde sunar ve
  // `/en/index.html` isteğini `/en/`'e yönlendirir. `directory` çıktısı + `always` ile:
  //  - sitedeki tüm linkler zaten `/` ile biter → ziyaretçi gereksiz yönlendirme yaşamaz,
  //  - dev sunucusu `/`'sız linki yakalar → yayındaki davranışla aynı.
  // (`format: 'file'` → `en.html` olsaydı Pages adresi `/en` yapardı; `always` ile çelişirdi.)
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },

  vite: {
    build: {
      // Vite 4 KB'den küçük dosyaları CSS'e gömer. Fontlar için bu ters işler: gömülü bir alt küme
      // (ör. JetBrains Mono Kiril/Vietnam) unicode-range eşleşmese de CSS'le birlikte HER ZAMAN iner.
      // Ayrı dosya olursa tarayıcı yalnızca gereken alt kümeyi ister. Diğer dosyalarda varsayılan kalır.
      assetsInlineLimit: (dosya) => (/\.woff2?$/.test(dosya) ? false : undefined),
      // 3D parçası (Three.js) küçültülmüş ~540 KB: Vite'ın 500 KB uyarısı her build'de boşuna çıkmasın.
      // Asıl bütçe sıkıştırılmış boyuttur (≤ 200 KB gz) ve onu scripts/kontrol.mjs denetler (CLAUDE.md §2.2).
      chunkSizeWarningLimit: 600,
    },
  },

  // Türkçe varsayılan ve öneksiz (`/`), İngilizce `/en/` altında.
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
