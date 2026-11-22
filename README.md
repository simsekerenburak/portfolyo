# Burak Eren Şimşek · Portfolyo

Bilgisayar mühendisliği öğrencisi Burak Eren Şimşek'in kişisel sitesi: projeler, stajlar, yetkinlikler ve belgeler.

Site bir **endüstriyel otomasyon hattı** gibi tasarlandı. İçerik üst üste duran paftalarda, her paftada öğeler yürüyen bant üzerinde kutu ve kart destesi olarak durur. İleride tavan rayındaki bir gantry robot kol imleci takip edip kutuları desteye taşıyacak. Bu kol, bitirme projem olan uç değiştirebilen robot kolun dijital ikizi.

**Canlı:** https://burakerensimsek.pages.dev
(Kalıcı adres yakında: `burakerensimsek.is-a.dev`. Türkiye'de bazı internet sağlayıcıları `*.pages.dev` adreslerine erişimi engelliyor.)

## Teknolojiler

- **[Astro](https://astro.build) + TypeScript** (strict): statik site, etkileşim için küçük betikler (island mimarisi), framework yok
- **Saf CSS + tasarım token'ları**: iki tema (koyu/açık) `light-dark()` ile; mavi ve soğuk gri yok, kontrast WCAG'a göre test ediliyor
- **Astro content collections + Zod**: içerik Markdown/JSON dosyalarında, her dosya build sırasında şemadan geçer
- **Vitest**: renk/kontrast kuralları, içerik şemaları, deste mantığı, build sonrası denetim
- **Cloudflare Pages**: `wrangler` ile doğrudan yükleme
- **Fontlar**: Inter, Inter Tight, JetBrains Mono (`@fontsource`, kendi sunucumuzdan, Türkçe karakterler dahil)

JavaScript kapalıyken de bütün içerik okunur: paftalar alt alta bölümler, desteler düz liste olarak görünür.

## Komutlar

Gereksinim: Node.js 24 veya üstü.

| Komut | Ne yapar |
|---|---|
| `npm ci` | Bağımlılıkları `package-lock.json`'daki sürümlerle kurar |
| `npm run dev` | Geliştirme sunucusu (`http://localhost:4321`) |
| `npm test` | Birim testleri (Vitest) |
| `npm run build` | Tip denetimi (`astro check`) + statik site üretimi (`dist/`) |
| `npm run preview` | Üretilen `dist/` klasörünü yerelde sunar |
| `npm run kontrol` | `dist/` denetimi: kırık link, TR/EN eşleşmesi, 404 sayfası, fontlar |
| `npm run yayinla` | test → build → kontrol → Cloudflare Pages; bir adım hata verirse yayın yapılmaz |

## İçerik nerede?

| Ne | Dosya |
|---|---|
| Projeler | `src/content/projeler/{tr,en}/*.md` |
| Stajlar | `src/content/stajlar/{tr,en}.json` |
| Yetkinlikler | `src/content/yetkinlikler/{tr,en}.json` |
| Belgeler | `src/content/belgeler/{tr,en}.json` |
| Arayüz ve Hakkımda metinleri | `src/i18n/{tr,en}.json` |
| Renkler (iki tema) | `src/styles/tokens.css` |

Türkçe varsayılan dil (`/`), İngilizce `/en/` altında.
