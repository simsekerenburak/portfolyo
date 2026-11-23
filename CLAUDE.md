# Burak Eren Şimşek — Kişisel Portfolyo Sitesi

Bu dosya, bu repodaki her Claude Code oturumunun ana talimatıdır. Projenin tüm kararları, mimarisi, tasarım sistemi, algoritmaları, içerikleri ve yol haritası burada. Bir karar burada yazıyorsa tartışılmış ve verilmiştir; değiştirmeden önce Burak'a sor.

**Konsept 2026-11-23'te değişti: PCB üzerinde birinci şahıs gezinti (§1).** Prototip ölçüleri §3.1'de (Burak, 2026-11-23; başlangıç noktası, birebir değil). Plan aynı gün onaylandı.
Eski taslak (pafta konsepti; renk sistemi, tipografi ve robot kol görünüşü için hâlâ geçerli): https://claude.ai/artifact/CpnHDC12EXRFrqReVNZnbM
İlgili paftalar: `E · Premium: Hakkımda`, `Projeler`, `Stajlar`, `Yetkinlikler`, `Belgeler`, `Renk sistemi`. A–D satırları eski, kullanılmayacak yönlerdir.

---

## 0. Çalışma kuralları (çok önemli)

Burak 4. sınıf bilgisayar mühendisliği öğrencisi. Kodu **anlamak** istiyor, sadece çalışan bir site değil.

1. **Adım adım ilerle.** Her seferinde tek bir mantıklı adım yap, sonra dur. Ne yaptığını, hangi dosyaya dokunduğunu ve neden öyle yaptığını kısa ve Türkçe anlat. Burak "devam" demeden bir sonraki milestone'a geçme.
2. **Önce anlat, sonra yaz.** Yeni bir kavram (Astro island, content collection, ters kinematik, kritik sönümlü yay, durum makinesi) ilk geçtiğinde 3–5 cümleyle ne olduğunu ve neden gerektiğini açıkla. Temel programlama bilgisini tekrar anlatma.
3. **Kod yorumları Türkçe**, değişken ve fonksiyon adları İngilizce olabilir ama tutarlı olsun. Algoritma dosyalarında her fonksiyonun üstünde ne hesapladığını matematiksel olarak yaz.
4. **Komut verirken:** hangi terminal (PowerShell), hangi klasör, tek komut. 20 komutu birden verme. Burak Windows kullanıyor (Node.js kurulu, PowerShell).
5. **Hata olursa önce kök nedeni bul**, tahminle düzeltme. Düzeldiğini kanıtla (test veya build çıktısı).
6. **Her milestone sonunda:** `npm run build` ve testler geçmeli, sonra Burak'a "ne eklenebilir / ne eksik" diye 2–3 soru sor (mühendis ortak gibi davran).
7. **Kişisel bilgi:** Kapsam Elektromekanik stajındaki projelerin adı ve detayı gizlidir. Sitede yalnızca "uzun dönem staj, gömülü sistemler ve mobil" yazar. Başka detay ekleme.
8. **Mavi renk ve soğuk gri kullanma.** (Bkz. §4.) Bu Burak'ın kesin isteği.
9. Commit mesajları Türkçe, kısa: `M2: bant modülü eklendi`.
10. **Her adımın sonunda ekran görüntüleri** `C:\Users\asus\Projects\_gorseller\` klasörüne kaydedilir (repo dışında; ad: `<milestone>-<adım>-<ne>.png`, ör. `m2-1-yedek-koyu-1440.png`). Burak oradan bakar (2026-11-23).

---

## 1. Proje özeti

- **Ne:** Burak'ın kendini, projelerini, stajlarını, yetkinliklerini ve belgelerini anlatan kişisel portfolyo sitesi.
- **Kimin için:** Genel portfolyo (işverenler, staj/burs başvuruları, LinkedIn ziyaretçileri).
- **Fikir (konsept 2026-11-23'te değişti):** Site koyu yeşil bir **devre kartıdır (PCB)** ve **birinci şahıs** görünümle gezilir. Ziyaretçi, bakır bir yolda (**ana hat**) ilerleyen bir sinyaldir: kaydırdıkça (tekerlek, dokunma, klavye) kamera ana hat boyunca ilerler.
  - Ana hattın başında **Hakkımda çipi**: isim, kısa tanıtım, iletişim.
  - Ana hattan sırayla **sapaklar** ayrılır: Projeler (sol), Stajlar (sağ), Yetkinlikler (sol), Belgeler (sağ). Her sapağın başında turuncu bir **tabela** durur. Tabelaya tıklayınca kamera o yöne döner ve sapağa girer; "Ana hatta dön" ile geri gelir.
  - Sapakta her öğe (proje, staj, yetkinlik alanı, belge) sapaktan ayrılan küçük bir yolun ucundaki **küçük bir çiptir**. Sapakta da kaydırarak ilerlenir.
  - Ekranın üstündeki tavan rayına asılı **gantry robot kol** imleci izler. Bir çipe tıklayınca kartı çekip ekranın ortasına getirir (**detay kartı**); tekrar tıklayınca ya da ← → ile kartı yerine bırakıp diğerini alır; boştayken katlanır. Kol, Burak'ın bitirme projesinin (uç değiştirebilen robot kol) dijital ikizidir.
- **İptal edilen konsept:** "üst üste pafta destesi + yürüyen bant" (M1–M2'de yapıldı). Bant ve kart destesi bileşenleri yalnızca **yedek sayfada** yaşar (§3.4).
- **Diller:** Türkçe (varsayılan) ve İngilizce.
- **Barındırma:** Cloudflare Pages, ücretsiz; `wrangler` ile doğrudan yükleme. Proje adı `burakerensimsek` → `burakerensimsek.pages.dev`. Kalıcı adres ücretsiz is-a.dev alt alan adı: `burakerensimsek.is-a.dev` (M7). GitHub yalnızca kod yedeği.

---

## 2. Teknoloji ve altyapı

| Konu | Karar |
|---|---|
| Site üretici | **Astro** (güncel kararlı sürüm), TypeScript |
| Etkileşim | Astro **island** mimarisi. 3D PCB sahnesi Three.js; robot kol 2D **SVG** katmanı (§5.5). Mantık (yerleşim, yol, kaydırma, kamera ve kol durum makineleri, kinematik) DOM'suz ve Three.js'siz saf TypeScript. React vb. framework yok |
| 3D | **Three.js**, yalnızca `WebGLRenderer` (WebGL2). Tam sürüm sabit (`npm install -E`, en az ~1 haftalık sürüm). Model ya da doku dosyası indirilmez: geometri ve yazı dokuları kodla üretilir. Yalnızca `src/pcb/sahne3d/` Three.js içe aktarır |
| Stil | Saf CSS + CSS değişkenleri (tasarım token'ları). Tailwind yok |
| İçerik | Astro **content collections** + Zod şeması |
| Test | **Vitest** (algoritmalar ve durum makinesi için birim testleri) |
| Yayın | `npm run yayinla` → Cloudflare Pages (`wrangler pages deploy`, bkz. §2.1). GitHub Actions **yok** |
| Repo | `simsekerenburak/portfolyo`: yalnızca kod yedeği, barındırma Cloudflare'de. Yerel klasör şimdilik eski adıyla (`simsekerenburak.github.io`) kalıyor, değiştirilmedi |
| Alan adı | Kalıcı: `https://burakerensimsek.is-a.dev` (`site` değeri). M7'ye kadar: `https://burakerensimsek.pages.dev` |

### 2.1 Yayın (`npm run yayinla`)

Site Burak'ın bilgisayarında üretilir ve `wrangler` ile Cloudflare Pages'e doğrudan yüklenir (direct upload). `.github/workflows/` ve `public/CNAME` **yok**.

| Ayar | Değer |
|---|---|
| Cloudflare Pages projesi | `burakerensimsek` → `https://burakerensimsek.pages.dev` |
| Üretim dalı | `main`. `--branch main` açıkça verilir: klasör git reposu olmasa da yükleme üretime gider |
| `wrangler` | devDependency, tam sürüm sabit (`npm install -D -E`); en az ~1 haftalık sürüm seçilir |

`package.json` betikleri:

```json
"kontrol": "node scripts/kontrol.mjs",
"yayinla": "npm test && npm run build && npm run kontrol && wrangler pages deploy dist --project-name burakerensimsek --branch main"
```

- Sıra: **test → build → kontrol → yayın**. `kontrol` `dist/` içindeki HTML/CSS'i okur, bu yüzden build'den sonra gelir.
- `&&`: önceki komut sıfırdan farklı çıkış koduyla biterse zincir durur, `wrangler` hiç çalışmaz → site son sağlam sürümde kalır. npm, Windows'ta betikleri `cmd.exe` ile çalıştırır; `&&` orada da aynı anlamdadır.
- İlk kurulum (bir kez, **2026-11-22'de yapıldı**): `npx wrangler login`, `npx wrangler pages project create burakerensimsek --production-branch main`.
- **Ajan tuzağı:** wrangler 4.16x, komutu bir yapay zekâ ajanı çalıştırınca ve proje henüz yoksa `pages project create`/`pages deploy`'u "Workers'ın parçası olan yeni Pages"e (`*.workers.dev`) yönlendirir (`maybeDelegatePagesToWorkers`). Klasik Pages projesi bu yüzden bir kez `--force` ile oluşturuldu. Proje artık var; sonraki komutlar yönlendirilmez, `--force` gerekmez.

`astro.config.mjs`: `site: 'https://burakerensimsek.is-a.dev'`, i18n: `defaultLocale: 'tr'`, `locales: ['tr', 'en']`, `prefixDefaultLocale: false` (TR `/`, EN `/en/`), `trailingSlash: 'always'` + `build.format: 'directory'`.

**Cloudflare Pages ile uyum:**
- Pages `en/index.html` dosyasını `/en/` adresinde sunar, `/en/index.html` isteğini `/en/`'e yönlendirir. `directory` çıktısı + `always` ile sitedeki tüm linkler zaten `/` ile biter → ziyaretçi yönlendirme yaşamaz. (`format: 'file'` → `en.html` olsaydı Pages adresi `/en` yapardı; `always` ile çelişirdi.)
- **`src/pages/404.astro` zorunlu.** Kökte `404.html` yoksa Pages siteyi tek sayfalık uygulama (SPA) sanar ve bilinmeyen her adrese ana sayfayı döndürür: kırık linkler gizlenir, aynı içerik sayısız adreste görünür. `kontrol.mjs` `dist/404.html`'in varlığını denetler.
- **Canlı ölçüm (2026-11-22, `burakerensimsek.pages.dev`):** `/` → 200 · `/en` → **308** → `/en/` → 200 · `/en/` → 200 · `/olmayan-adres/` → **404** (bizim 404 sayfası) · `/en/olmayan/` → 404 (kökteki 404'e düşer) · `/en/index.html` → 308 → `/en/`. Kalıcı yönlendirme 308 (301'in yöntemi koruyan hâli); sitedeki linkler `/` ile bittiği için ziyaretçi bunu görmez.

**Türkiye'den erişim sorunu (2026-11-22):** Burak'ın bağlantısında `*.pages.dev` üç katmanda engelli: sağlayıcı DNS'i sahte adres veriyor (213.14.227.50, Türk Telekom aralığı; gerçek: 172.66.44.144 / 172.66.47.112), doğru IP'ye TLS'te SNI görülünce bağlantı sıfırlanıyor, düz HTTP'de `Host` başlığında kesiliyor. Site çalışıyor: ölçüm, Chrome'da DoH + **ECH** (alan adı şifreli; dış ad `cloudflare-ech.com`) ile yapıldı. `is-a.dev` aynı bağlantıdan açılıyor. Sonuç: Türkiye'deki ziyaretçiler için **kalıcı adres (M7) şart**; `pages.dev` adresi paylaşılmamalı. M7'de dikkat: DNS cevabındaki CNAME zinciri `pages.dev`'i ele verirse sağlayıcı DNS'i özel alan adını da engelleyebilir → M7 bitince Türkiye bağlantısından ECH'siz düz `curl` ile test edilecek.

### 2.2 Performans bütçesi ve yükleme (3D)

**Yükleme sırası: yedek sayfa önce, 3D sonra.**
1. Sunucudan **yedek sayfa** gelir (tam HTML, §3.4): ilk boyama ve LCP onunla olur, içerik hemen okunur.
2. Küçük **giriş betiği** (`src/pcb/giris.ts`, ≤ 5 KB gz) 3D koşullarını denetler: JS var; `prefers-reduced-motion: reduce` değil (ya da ziyaretçi "3D'yi yine de aç"ı seçmiş); ziyaretçi "Düz görünüm"ü seçmemiş (iki seçim de localStorage'da, try/catch); WebGL2 bağlamı kurulabiliyor; `navigator.connection.saveData` değil.
3. Koşullar tutarsa 3D parçası tarayıcı boşalınca (`requestIdleCallback`, yoksa `setTimeout`) **dinamik `import()`** ile iner. Bu sırada sayfa kullanılabilir; ince bir "devre kartı yükleniyor" çizgisi görünür.
4. İlk 3D kare hazır olunca sahne yumuşakça belirir. Hakkımda paneli iki görünümde aynı yerde durduğu için içerik zıplamaz (CLS).
5. Herhangi bir adım başarısız olursa (indirme hatası, istisna, `webglcontextlost`) yedek sayfada kalınır; konsola tek satır uyarı.

**Bütçe.** `kontrol.mjs` build sonrası gz boyutlarını denetler; sınır aşılırsa yayın durur.

**Ölçüm (M2 0. adım, 2026-11-23; three 0.187.0, projenin Vite 8 / Rolldown derleyicisi, küçültülmüş):** en küçük sahne (renderer + kamera + tek kutu + ışık) 518 KB → **126,8 KB gz** (brotli 104,1): Three.js'in taban maliyeti budur, `WebGLRenderer` çekirdeğin çoğunu çeker. Prototip sahne (§3.1 ölçüleri: tahta, ana hat, Hakkımda çipi, 4 kavşak + tabela + bölüm çipi, via'lar, ızgara, gölge, `RoomEnvironment`, canvas yazı dokuları) **132,8 KB gz** (brotli 109,1): sahne kodu yalnızca ~6 KB ekliyor. Prototip 79 çizim çağrısı, ~29 bin üçgen; entegre Intel UHD'de (D3D11) headless ortalama kare 7,4 ms, en kötü %1 12,3 ms (gerçek ölçüm tarayıcıda M2 6. adımda).

| Ölçüt | Hedef | Sınır |
|---|---|---|
| Yedek sayfanın JS'si (tema, dil, kart destesi, giriş betiği) | ≤ 15 KB gz | 25 KB gz |
| 3D parçası (Three.js + sahne kodu; ölçülen taban 126,8 KB gz) | ≤ 170 KB gz | 200 KB gz *(Burak, 2026-11-23)* |
| İndirilen model/doku dosyası | 0 | 0 |
| LCP (yedek sayfa, 4G orta telefon) | ≤ 2,5 sn | — |
| CLS (3D geçişi dahil) | ≤ 0,05 | 0,1 |
| INP | ≤ 200 ms | — |
| 3D'nin hazır olması (masaüstü, geniş bant, sayfa yüklendikten sonra) | ≤ 2 sn | — |
| Kare hızı, masaüstü (entegre GPU, 1440×900) | 60 fps | en kötü %1 kare ≤ 25 ms |
| Kare hızı, telefon (iPhone 12 sınıfı) | 60 fps | 30 fps |
| Kare başına JS (mantık + çizim hazırlığı) | ≤ 4 ms | 8 ms |
| Çizim çağrısı / üçgen | ≤ 100 / ≤ 150 bin | — |
| GPU doku belleği | ≤ 32 MB | — |
| Lighthouse mobil: performans / erişilebilirlik | ≥ 90 / ≥ 95 | — |

**Çizim ilkeleri:** tekrarlayan parçalar (pad, via, yol parçaları) `InstancedMesh`; tek sıcak yönlü ışık + sıcak ortam ışığı; gölge Yüksek kademede tek gölge haritası, diğerlerinde çiplerin altında hazır yumuşak leke; `devicePixelRatio` en fazla 2 (kademeye göre 1–2); **isteğe bağlı çizim**: kamera, kol ya da vurgu değişmiyorsa kare çizilmez (pil); sekme gizliyken ve sahne ekranda değilken döngü durur. Kalite kademeleri §8'de.

---

## 3. Bilgi mimarisi ve gezinme

### 3.1 PCB yerleşimi

| Sıra | Durak | Adres | Yeri |
|---|---|---|---|
| 01 | Hakkımda çipi | `/` (ya da `#hakkimda`) | Ana hattın başı |
| 02 | Projeler | `#projeler` | 1. sapak, **sol** |
| 03 | Stajlar | `#stajlar` | 2. sapak, **sağ** |
| 04 | Yetkinlikler | `#yetkinlikler` | 3. sapak, **sol** |
| 05 | Belgeler | `#belgeler` | 4. sapak, **sağ** |
| 06 | Konnektör çipi: İletişim (M6'da CV de) | `#iletisim` | Ana hattın sonu; hat orada biter |

- Öğe çiplerinin adresi `#<sapak>-<öğe>` (ör. `#projeler-simsek`, `#stajlar-dogaka`): M1'deki kimliklerin aynısı. Yedek sayfa ve 3D aynı adresleri anlar; paylaşılan bir link iki görünümde de aynı yeri açar.
- **Yerleşim içerikten hesaplanır** (`src/pcb/duzen.ts`, saf): sapak uzunluğu öğe sayısına, öğe çiplerinin yeri sıraya göre. Yollar gerçek PCB gibi yalnızca 0° / 45° / 90° açılarla döner, köşeler pahlıdır. Kurallar (test): çipler, tabelalar ve yollar çakışmaz; yollar arasında en az boşluk var; sapaklar sol/sağ dönüşümlü; aynı içerik → aynı yerleşim (deterministik).
- Proje detay sayfaları ayrıca: `/projeler/[slug]` ve `/en/projeler/[slug]` (tam sayfa, link paylaşılabilir; M6).

**Prototip ölçüleri** (Burak, 2026-11-23). Birim: metre benzeri dünya birimi. Birebir değil, başlangıç noktası; `src/pcb/duzen.ts` bunları sabit olarak taşır, ana hat +z yönünde ilerler:
- **Kamera:** yükseklik 1,6; dikey görüş açısı ~54°; **düz bakar, eğim yok**; ufuk ekranın üstten ~%34'ünde (§5.8: lens kaydırma).
- **Ana hat:** bakır yol genişliği 0,9; iki yanında 0,35 genişliğinde daha koyu paralel yollar (merkezleri ±0,9).
- **Hakkımda çipi:** z = 10, yarı genişlik 3,4, yolun üstünde.
- **Kavşaklar:** z = 26 / 44 / 62 / 80 (her 18 birimde bir), sırayla sol / sağ. Kavşakta turuncu bir via noktası.
- **Sapak:** kavşaktan 45° ile 3 birim çapraz, sonra 90° düz ~11 birim; sonunda bölüm çipi (yarı genişlik 3,2).
- **Tabela:** kavşağın ~3 birim yanında, yerden 1,9 yükseklikte, turuncu çerçeveli yuvarlak yeşil levha; üstünde bölüm adı ve büyük sayı ("4 proje").
- **Sapak içi (B seçeneği):** öğeler sapak boyunca her 6 birimde bir, sırayla iki yana kısa bir yolla bağlı küçük çipler (yarı genişlik 1,4); çipin üstünde kısa adı yazan krem etiket.
- **Zemin:** ince serigrafi ızgarası (5 birim) ve dağınık via noktaları.
- **Ufkun üstü** (Burak, 2026-11-23): uzakta, hafif sis içinde kartın diğer parçalarının **silüetleri**: elektrolitik kondansatörler, büyük QFP çipler, bir USB-C ve bir pin header konnektörü, birkaç direnç. Yakına gelmezler (kamera ilerledikçe onlar da ufukta kalır), yalnızca derinlik verirler; koyu yeşil/bakır tonlar, mavi yok. Tavan rayı ve kol bu şeridin üstüne oturur.
- Sapak uzunluğu öğe sayısına göre uzar (6 birim × öğe); kavşak aralığı 18 birim buna yetmezse yerleşim aralığı açar (test).

### 3.2 Gezinme

- **Ana hatta:** kaydırma (tekerlek, dikey dokunma sürüklemesi, klavye) yol üzerindeki ilerlemeyi değiştirir; kamera onu yayla izler (§5.8). Kavşakların önünden kaydırarak **geçilir**; sapağa yalnızca **tabelayla** (tıklama, dokunma, Enter) girilir.
- **Sapağa giriş** (prototip): kavşağa ilerle → 90° dön → sapağa gir; her parça ~0,7 sn, ease-in-out (toplam ~2,1 sn). Kamera sapakta bölüm çipine ~6 birim kala durur. Giriş/dönüş sırasında kaydırma ve tıklama yok sayılır.
- **Sapakta:** kaydırma sapak boyunca ilerletir, sapağın sonunda durur. "Ana hatta dön" düğmesi (ve Esc) aynı üç parçayı tersinden oynatır (kavşağa geri → 90° dön → ana hat yönü); ana hatta aynı noktadan devam edilir.
- **Detay kartı:** çipe tıklayınca kol kartı ekranın ortasına getirir (§5.4); ← → komşu öğenin kartına geçer; tekrar tıklama, Esc ya da "Yerine bırak" kartı çipine geri koyar. Kart açıkken kaydırılırsa kol önce kartı bırakır, sonra kamera ilerler.
- **Adres:** ana hatta `/` (parçasız), sapakta `#<sapak>`, kart açıkken `#<sapak>-<öğe>`. `history.replaceState` ile yazılır, geçmişe kayıt eklenmez (Burak'ın kararı, 2026-11-23: Geri siteden çıkar). `hashchange` dinlenir. Derin link açılışta kamerayı doğrudan oraya koyar (ilk kare animasyonsuz); kart adresinde kart açık gelir.
- **Ana hattın sonu:** konnektör çipi, İletişim (Burak, 2026-11-23; M6'da CV de). Hat orada biter; End tuşu oraya götürür.
- **Reduced-motion + "3D'yi yine de aç":** bütün geçişler animasyonsuz kesmedir (kamera yeni yere anında konur, kol anında yerine geçer).

### 3.3 Hakkımda ve detay kartı

- **Hakkımda:** ana hattın başındaki büyük çip. İsim (h1), unvan, tanıtım, "İletişime geç" ve iletişim satırı bir **HTML paneldir** (WebGL yazısı değil); çipin yanında durur, kamera ilerledikçe söner. Yedek sayfadaki Hakkımda'yla aynı düzendedir: 3D yüklenince panel yerinde kalır, arkasında devre kartı belirir.
- **Detay kartı:** HTML'dir (okunur, seçilebilir, ekran okuyucu okur). İçerik eski kartla aynı: üst satır (mono, önünde turuncu nokta), varsa etiket hapı, başlık 27px, alt satır, açıklama, teknoloji hapları, bağlantılar, "i / n" sayacı, ← → düğmeleri ve "Yerine bırak" düğmesi.
- **Tek kaynak:** content collections → `src/pafta/*.ts` dönüşümleri (`PaftaOgesi`, `Ozet`) → hem yedek sayfa hem 3D. 3D katmanı kart içeriğini yedek sayfadaki ilgili `<article>`'dan alır. Yerleşim için gereken kısa veriyi (kimlik, kısa ad, sapak, özet sayısı) sayfadaki bir JSON adasından (`<script type="application/json">`) okur. Metin kopyalanmaz.
- **Özet:** tabelada büyük sayı ("4 proje"); açılır `<details>` özet menüsü yalnızca yedek sayfada (Burak, 2026-11-23).
- Çip ve tabela üstündeki yazılar (serigrafi) WebGL'de **canvas dokusu** olarak çizilir: aynı self-host fontlar, `document.fonts.load` sonrası. Süs sayılır; anlamı DOM'dadır (§3.5).

### 3.4 Yedek sayfa (aşamalı geliştirme)

- **Her zaman** HTML olarak üretilir ve sayfada durur (M1'in düz sayfası): üstte bölüm linkleri + dil/tema düğmeleri; Hakkımda + dört bölüm alt alta; bölümlerde kartlar (JS varken kart destesi + bant), `<details>` özet menüsü. Ortak `Pafta` şablonu burada yaşar (§3.6).
- **Gösterildiği durumlar:** JS kapalı; `prefers-reduced-motion: reduce` (varsayılan; yedek sayfada "3D'yi yine de aç" düğmesi var, seçim localStorage'da); WebGL2 yok ya da bağlam kurulamadı/kaybedildi; 3D parçası inemedi; ziyaretçi "Düz görünüm"ü seçti (üst şeritte düğme; seçim localStorage'da). Arama motorları tam içeriği bu HTML'den okur.
- 3D etkinken yedek içerik **görsel olarak** gizlenir ama DOM'da kalır (detay kartının içeriği oradan gelir). Klavye ve ekran okuyucu için 3D katmanın kendi düğmeleri vardır (§3.5); iki görünüm aynı anda gezilebilir olmaz (çift okuma olmasın).
- Eski M2'nin **pafta destesi** (beş paftayı üst üste dizen sahne, ilk kare betiği, pafta göstergesi, önceki/sonraki linkleri) yeni M2'de **kaldırılır**. JS varken yedek sayfada yalnızca kart destesi + bant ve klavye kuralı kalır (odak destedeyse ← → kartı çevirir; `src/sahne/klavye.ts`).

### 3.5 Klavye ve erişilebilirlik (3D görünüm)

- `<canvas>` `aria-hidden`. Her **tabela** ve **çip** için şeffaf bir DOM düğmesi (`<button>`) vardır; her karede o nesnenin ekran izdüşümüne taşınır. Fare, dokunma, klavye ve ekran okuyucu **aynı düğmeleri** kullanır (tek yol, ayrı ışın izleme yok). Erişilebilir adlar: "Projeler sapağı, 4 proje", "Şimşek, 2026 · tek kişilik".
- Tab sırası yol sırasıdır; odak ekran dışındaki bir nesneye giderse kamera onu görüş alanına getirir. Odak halkası her zaman görünür (`--turuncu-cizgi`, 3:1).
- Detay kartı açılınca odak kartın başlığına, kapanınca çipine döner. Önemli değişiklikler `aria-live` ile duyurulur ("Stajlar sapağı, 3 staj", "Şimşek, 2 / 4").
- Üst şeritte her zaman: dil, **"Düz görünüm"**, mühendis modu. Tema düğmesi 3D'de gizli (3D her zaman koyu, §4.2).

| Tuş | Ana hatta | Sapakta | Kart açıkken |
|---|---|---|---|
| ↓ / PageDown / Space | ileri | ileri | kartı bırakır, sonra ileri |
| ↑ / PageUp / Shift+Space | geri | geri | kartı bırakır, sonra geri |
| Home / End | ana hattın başı (Hakkımda) / sonu (konnektör) | sapağın başı / sonu | — |
| ← / → | önceki / sonraki kavşak | önceki / sonraki çip | önceki / sonraki kart (kol değiştirir) |
| Tab / Shift+Tab | sıradaki / önceki tabela | sıradaki / önceki çip, "Ana hatta dön" | kartın içindeki linkler ve düğmeler |
| Enter (odak tabela/çipte) | sapağa gir | kartı getir | — |
| Esc | — | ana hatta dön | kartı yerine bırak |

Alt/Ctrl/Meta'lı basışlar ve yazı alanları tarayıcıya bırakılır (`klavyeEylemi` ilkesi). Basılı tutunca ilerleme sürer, kavşak/çip atlaması tekrarlanmaz.

### 3.6 Ortak `Pafta` şablonu (yalnızca yedek sayfa)

Projeler, Stajlar, Yetkinlikler ve Belgeler **aynı bileşenden**, sadece farklı veriyle üretilir:

- Sol üst: başlık (52px) + tek cümle giriş.
- Orta-sol: **Deste**: en fazla 3 kart görünür. Öndeki kart tam içerik (üst satır mono yazı + varsa etiket hapı, başlık 27px, alt satır, açıklama, teknoloji hapları, "i / n" sayacı, ← → düğmeleri). Arkadaki iki kartın yalnızca üst şeridi görünür ve üzerinde `ad · üst satır` yazar.
- Alt: **Bant**: öğeler krem renkli kutular hâlinde; öndeki kartın kutusu turuncu çerçeveli. Kutuya tıklamak o öğeyi öne getirir.
- Sağ: **Özet açılır menüsü**: büyük turuncu sayı + etiket (ör. "3 staj"), açılınca alt açılır menüler (ör. "2 şehir", "1 devam eden"), onlar da açılınca satırlar. **`<details>/<summary>` ile** (JS olmadan da çalışır, erişilebilir).
- JS yokken kartlar düz liste, kutular karta atlayan linkler.

---

## 4. Tasarım sistemi

### 4.1 Görsel dil
Modern ve premium (ürün fotoğrafı stüdyosu hissi): tek yumuşak ışık kaynağı, derinlik, yumuşak gölgeler, metal malzeme hissi, büyük ve rahat tipografi, bol boşluk. **2026-11-23'ten beri sahnenin kendisi bir PCB'dir:** lehim maskesi koyu yeşil, bakır yollar, krem serigrafi yazıları, sıcak grafit çip gövdeleri; stüdyo hissi korunur (tek sıcak ışık, yumuşak gölge, sade). Zeminde ince serigrafi ızgarası (5 birim) ve dağınık via noktaları var (prototip); kod dokusu yok. Yedek sayfada doku yok.

### 4.2 Renkler — yeşil %60 · turuncu %30 · krem %10
Mavi ve soğuk gri **yasak**. Tüm griler sıcak (kahverengiye çalan) olmalı.

Kaynak dosya: `src/styles/tokens.css`. Gradyanlar renk durağı token'larından kurulur (`--pafta-1`/`-2`, `--kart-on-1`/`-2`, `--krem-kutu-1`/`-2`, `--zemin-isik`), böylece testler her durağı ayrı ölçer.

| Token | Koyu tema | Açık tema |
|---|---|---|
| `--zemin` | `#0B241B` (radyal: `#2C6A50` → `#0B241B`) | `#BFD0B6` (radyal: `#E6EEDF` → `#BFD0B6`) |
| `--pafta` | `linear-gradient(160deg,#18503C,#0E3326)` | `linear-gradient(170deg,#E4ECDC,#D5E2CC)` |
| `--pafta-arka-1` / `-2` | `#12392B` / `#0F3427` | `#C6D6BD` / `#B3C6A9` |
| `--kart-on` | `linear-gradient(170deg,#1E5C45,#164A37)` | `linear-gradient(170deg,#F4F7EF,#E6EEDD)` |
| `--kart-orta` / `-arka` | `#154434` / `#12392B` | `#D3E0CA` / `#C9D8BF` |
| `--metin` | `#F3EBDD` | `#0F2E22` |
| `--metin-2` | `#C9D2BC` | `#2E4A3A` |
| `--metin-3` | `#BFCABB` *(eski `#A9B7A3`, kontrast)* | `#43594A` *(eski `#4D6655`, kontrast)* |
| `--turuncu` | `#FF7A1A` — **yalnızca dolgu** | `#FF7A1A` — **yalnızca dolgu** |
| `--turuncu-cizgi` | `#FF7A1A` (seçili kutu çerçevesi, aktif pafta göstergesi) | `#C2410C` *(`#FF7A1A` açık paftada ~2:1 kalıyordu)* |
| `--turuncu-yazi` | `#FF8A3D` — yalnızca büyük metin/simge | `#973308` *(eski `#9A3408`, her yüzeyde ≥ 4.6)* |
| `--turuncu-ustu` | `#2A0E02` (turuncu dolgu üstündeki yazı) | aynı |
| `--led` | `#FFF1D6` | `#FF7A1A` |
| `--hap-zemin` | `rgba(243,235,221,0.08)` | `rgba(15,46,34,0.07)` |
| `--hap-metin` | `#DCE3D2` (hap, dil/tema düğmesi) | `#1F3D2F` |
| `--etiket-zemin` | `rgba(255,122,26,0.18)` | `rgba(234,90,20,0.14)` |
| `--sekme-zemin` | `rgba(255,122,26,0.2)` (aktif sekme) | `rgba(234,90,20,0.16)` |
| `--vurgu-metin` | `#FFD2B0` (etiket, aktif sekme yazısı) | `#973308` |
| `--menu-zemin` / `--menu-cizgi` | `rgba(255,122,26,0.08)` / `…0.25` | `rgba(234,90,20,0.08)` / `…0.25` |
| `--krem-kutu` | `linear-gradient(180deg,#FBF7EE,#EFE7D6)` | aynı |
| `--kutu-metin` | `#0F2E22` (krem kutu yazısı) | aynı |
| `--bant` | `#0A1E16` | `#13110F` |

Kural: Yeşil = zemin/kartlar. Turuncu = etkileşim (kolun metali, ana düğme, alt başlık, aktif sekme, seçili kutu, pafta göstergesi, sayılar). Krem = yazı, kutular, LED'ler.

**Renk kuralları (2026-11, `tests/renk.test.ts` denetler):**
- **"Mavi yok" tanımı (ton bandı):** (a) kroma ≥ 5 olan her rengin HSV tonu **170°–270° dışında** olmalı (camgöbeği → mavi → mavi-mor yasak; paletin en mavimsi yeşili 160°). (b) Kroma < 5 (neredeyse gri) ise **R > B** olmalı (sıcak gri). Kanal farkı (B − R) kullanılmaz: onaylı koyu yeşillerde B − R = 16…39 ve eşik yükseltilirse slate griler kaçar.
- **Kontrast (WCAG):** büyük metin (≥ 24px veya ≥ 18.66px ve kalınlık ≥ 700) **3:1**, diğer metin **4.5:1**, anlam taşıyan simge (ok, düğme glifi) ve durum çizgisi (seçili kutu, gösterge) **3:1**. Yarı saydam yüzeyler (hap, etiket, sekme, menü kutusu) alttaki yüzeyle kompozit edilerek ölçülür. Gradyanın iki ucu ayrı ölçülür. Ölçülen yüzeyler: pafta (iki uç), kart-on (iki uç), kart-orta, kart-arka, zemin; `zemin` ışık merkezi ve `pafta-arka-*` hariç (üstlerinde metin yok). Hangi metnin nerede durduğu testteki **kullanım tablosunda**; bileşenler ona uyar.
- **Turuncu üç rolde, üç token:** metin → `--turuncu-yazi` (büyük sayılar dahil; taslakta açık temadaki `#FF7A1A` sayı ~2.2:1 idi), durum çizgisi → `--turuncu-cizgi`, dolgu → `--turuncu` (ana düğme, nokta). Koyu temada `--turuncu-yazi` küçük metinde **kullanılmaz** (pafta üstünde ~3.98); küçük turuncu vurgu için `--vurgu-metin`.
- **Hakkımda unvanı 24px / 500** (taslakta 22px): koyu temada `--turuncu-yazi` pafta üstünde 3.98; 24px'te büyük metin sayılır (3:1).
- **Kart üst satırı** (mono, 13px): `--metin-2`, önünde **6px `--turuncu` nokta** (turuncu yazı değil).

**3D sahne renkleri (2026-11-23):** lehim maskesi = zemin yeşilleri (`#0B241B` … `#18503C`); bakır yollar `#D9893F` civarı (ton ~29°); tabela ve vurgu `--turuncu` `#FF7A1A`, tabela yazısı `--turuncu-ustu`; serigrafi krem `#F3EBDD`; çip gövdeleri sıcak grafit (R > B); pad'ler bakır/altın. Değerler `src/pcb/renkler.ts`'te tek yerde; `tests/renk.test.ts` "mavi yok" kuralını onlara da uygular. Işıklar da sıcak renkli (soğuk/mavi ortam ışığı yok). **Bakır yollar mat** (Burak, 2026-11-23: kameraya yakın yerde beyaza dönmesin): `metalness ≈ 0,35`, `roughness ≈ 0,7`, `envMapIntensity ≈ 0,6`; ton eşleme **`NeutralToneMapping`** (Khronos PBR Neutral: marka renklerini korur). Prototipte ölçüldü: ACES + parlak metalde ana yol ekranda açıklık %69–86 (beyaza yakın); Neutral + mat bakırda ton 28–29°, açıklık %47–52 (hedef `#D9893F`: 29°, %55). Uçtan uca denemede ana yolun ekran rengi ölçülür: ton 29° ± 6°, açıklık %40–62. Işık, speküler parlama ve ton eşleme (tone mapping) rengi kaydırabilir; bu yüzden uçtan uca denemede 3D ekran görüntüsünün pikselleri sayılır: kroma ≥ 5 olan piksellerin en fazla %0,1'i 170°–270° bandında olabilir. **3D her zaman koyu** (Burak, 2026-11-23): açık tema yalnızca yedek sayfada. 3D etkinken tema düğmesi gizlenir ve 3D kabı `color-scheme: dark` zorlar; böylece `light-dark()` token'ları DOM katmanlarında (Hakkımda paneli, detay kartı) koyu değerleri verir.

Tema: varsayılan cihaz ayarı (`prefers-color-scheme`), üstteki düğmeyle değiştirilir, seçim `localStorage`'da (try/catch ile) saklanır. `<html data-theme="koyu|acik">`. Uygulama: her renk `light-dark(AÇIK, KOYU)` ile tek satırda; `:root { color-scheme: light dark }` cihaza uyar, `[data-theme]` `color-scheme`'i zorlar (JS kapalıyken de cihaz ayarı çalışır). **Yapıldı (2026-11-22):** mantık `src/tema/tema.ts` (anahtar `tema`); kayıtlı seçim `<head>`'deki satır içi `ILK_BETIK` ile ilk boyamadan önce uygulanır (meta `color-scheme` de güncellenir), kayıt yoksa `data-theme` konmaz; `TemaDugmesi.astro` JS'siz gizli (`hidden`), simge hedef temayı gösterir (koyuda güneş, açıkta ay).

### 4.3 Tipografi
- Başlıklar: **Inter Tight** 600, `letter-spacing: -0.02em`. İsim 76px, pafta başlığı 52px, kart başlığı 27px. Hakkımda unvanı 24px / 500 (`--turuncu-yazi`, bkz. §4.2).
- Gövde: **Inter** 400/500, 15–17px, satır yüksekliği 1.55–1.6.
- Sayılar/telemetri/tarih: **JetBrains Mono** 12–13px.
- Google Fonts, `display=swap`, mümkünse self-host.

### 4.4 Robot kolun görünüşü
- Tavan rayı: alüminyum (dikey gradyan), sahnenin üst kenarı boyunca.
- Taşıyıcı: koyu grafit blok, rayda kayar.
- Teleskopik direk: 3 iç içe segment (metalik yatay gradyan).
- İki link: **turuncu eloksal** (`#FF9A4D → #C2410C → #EA6A1F` çapraz gradyan), uçları yuvarlak.
- Eklemler: turuncu radyal gradyan, ortada sıcak beyaz LED (`#FFF1D6`) + hafif bulanık hale.
- Gripper: koyu gövde + iki metalik parmak; açıklık 0..1 arasında animasyonlu.
- Zemine yumuşak eliptik gölge.

---

## 5. Hareket: robot kol, kamera ve kaydırma

Bu bölüm sitenin mühendislik kalbi. Kod `src/kol/`, `src/pcb/` ve `src/hareket/` altında, **DOM'dan ve Three.js'ten bağımsız saf fonksiyonlar** olarak yazılır (test edilebilsin). Three.js yalnızca `src/pcb/sahne3d/` içinde çizer; kolun SVG'sini `src/kol/ciz.ts` günceller.

### 5.1 Mekanizma (kartezyen gantry + 2 eklemli kol)
Serbestlik dereceleri: taşıyıcı X (prizmatik), direk Z (prizmatik, teleskopik), omuz θ₁ ve dirsek θ₂ (dönel). Hedef 2 boyutlu, sistem 4 serbestlik dereceli → **fazlalık (redundancy) şu kurallarla çözülür:**

1. Taşıyıcı hedef x'i bir **ofsetle** takip eder: `xTaşıyıcı* = clamp(hedef.x − 55, sınırlar)` (kol hep hafif açılı dursun, tekil konuma girmesin).
2. Direk, kolu "rahat mesafede" tutacak kadar uzar: `d* = 0.72·(L1+L2)`, `z* = hedef.y − y0 − sqrt(max(d*² − dx², 0))`, `clamp(zMin, zMax)`.
3. Kalan 2B hedefe analitik **2-link IK** (aşağıda).

Varsayılan oranlar: `L1 = 95`, `L2 = 85` birim (ekran boyutuna göre ölçeklenir). Bitirme projesindeki gerçek kolun oranları belli olunca buraya işlenecek.

### 5.2 Ters kinematik (2 link, kosinüs teoremi)

```ts
// Taban (bx,by)'den hedef (tx,ty)'ye. Dirsek "aşağı" konfigürasyon (θ2 < 0).
// d erişim aralığına sıkıştırılır: |L1−L2| < d < L1+L2 (erişim dışı hedefte kol tam uzanır, patlamaz).
export function ik2(bx, by, tx, ty, L1, L2) {
  let dx = tx - bx, dy = ty - by;
  const d0 = Math.hypot(dx, dy) || 1;
  const d = clamp(d0, Math.abs(L1 - L2) + 1, L1 + L2 - 0.5);
  dx *= d / d0; dy *= d / d0;
  const c2 = clamp((d*d - L1*L1 - L2*L2) / (2*L1*L2), -1, 1);
  const t2 = -Math.acos(c2);
  const t1 = Math.atan2(dy, dx) - Math.atan2(L2*Math.sin(t2), L1 + L2*Math.cos(t2));
  const ex = bx + L1*Math.cos(t1), ey = by + L1*Math.sin(t1);          // dirsek
  const fx = ex + L2*Math.cos(t1+t2), fy = ey + L2*Math.sin(t1+t2);    // uç
  return { t1, t2, ex, ey, fx, fy, ulasildi: d0 <= L1 + L2 };
}
```

### 5.3 Hareket: kritik sönümlü yay
Her eksen (taşıyıcı x, direk z, hedef noktanın x ve y'si, gripper açıklığı) bağımsız bir yay-sönüm sistemiyle hedefe gider. Kol imlece yapışmaz, gerçek motor gibi gecikmeli gelir.

```ts
// ẍ = k(hedef − x) − c·ẋ ,  c = 2√k  (kritik sönüm: salınım yok, en hızlı oturma)
export function yay(x, v, hedef, k, dt) {
  const c = 2 * Math.sqrt(k);
  v += (k * (hedef - x) - c * v) * dt;
  return [x + v * dt, v];
}
```
Sertlikler: taşıyıcı `k=18` (en ağır, en yavaş), direk `k=30`, uç nokta `k=70`, gripper `k=40`. `dt` en fazla 0,033 s ile sınırlanır.
Dosya `src/hareket/yay.ts`: kol ve kamera aynı yayı kullanır. Kamera sertlikleri M2'de denenip buraya yazılacak (başlangıç: ilerleme `k=12`, bakış yönü `k=20`).

### 5.4 Kol durum makinesi
Açık bir durum makinesi olarak yaz (if-else yığını değil). Durumlar ve geçişler:

| Durum | Ne olur | Geçiş |
|---|---|---|
| `BOSTA` | Kol katlanmış, gripper kapalı | İmleç hareket → `TAKIP` |
| `TAKIP` | Kol imleci izler, gripper açık | 1,2 sn hareketsizlik veya imleç dışarı → `KATLANIYOR`; bir çipin üstü → `HEDEFTE` |
| `KATLANIYOR` | Direk kısalır, kol **olduğu yerde** katlanır | Bitti → `BOSTA`; hareket → `TAKIP` |
| `HEDEFTE` | Çip vurgulanır, gripper açılır | Tıklama → `KAVRAMA`; uzaklaşma → `TAKIP` |
| `KAVRAMA` | Gripper kapanır, kart çipten ayrılır | → `TASIMA` |
| `TASIMA` | Kart çipten ekranın ortasına taşınır (yumuşatılmış yol) | → `GOSTERIM` |
| `GOSTERIM` | Kol kartı ortada tutar, kamera durur | Tıklama / Esc / "Yerine bırak" / kaydırma → `GERI_TASIMA`; ← → → `GERI_TASIMA` (hedef: komşu çip) |
| `GERI_TASIMA` | Kart çipine geri taşınır | → `BIRAKMA` |
| `BIRAKMA` | Gripper açılır, kart çipe oturur | Komşu hedef varsa → `KAVRAMA` (komşu çipte); yoksa → `TAKIP` |

Kurallar: `KAVRAMA`, `TASIMA`, `GERI_TASIMA`, `BIRAKMA` sırasında gelen tıklama ve ← → kuyruğa alınmaz, yok sayılır. Kamera geçiş durumlarındayken (§5.7) çip seçilemez. Katlanma gecikmesi 1,2 sn.

### 5.5 Kolun sayfayla etkileşimi
- **Kol 2D katmandır** *(Burak onayladı, 2026-11-23)*: SVG, 3D sahnenin üstünde, ekran koordinatlarında, `pointer-events: none`. Gerekçe: (1) ray "ekranın üstünde" sabittir, dünyayla birlikte hareket etmez; (2) IK ve yay ekran pikseliyle çalışır, §4.4 görünüşü ve testler aynen kalır; (3) taşınan detay kartı HTML'dir, kol onu ekran düzleminde tutar; (4) 3D kol modeli, ışığı ve perspektifli IK işi ve bütçeyi büyütür.
- Bağlantı: çipin 3D konumu her karede ekrana izdüşürülür (`Vector3.project`) ve kolun hedefi olur. Derinlik hissi için gripper'ın altına, PCB düzleminde yumuşak bir gölge lekesi düşer (ekran noktasından tahta düzlemine ışın).
- Kol bir metnin ya da kartın üstünden geçerken yarı saydam olur (`opacity ≈ 0.85`). *(Açık karar 1.)*
- Telefonda: dokunulan noktaya uzanır, parmak kalkınca katlanır (kart açık değilse).

### 5.6 Telemetri ve Mühendis modu
- Küçük telemetri hapı: `durum · θ₁ · θ₂ · x` (JetBrains Mono, canlı); kamera için `s` ve bulunulan yer (ana hat / sapak).
- **Mühendis modu** düğmesi: kolun üstüne L₁/L₂ ölçü çizgileri, θ açı yayları, erişim sınırı (`r = L1+L2`) ve rahat mesafe (`d*`) çemberleri; 3D'de kamera yolu ve ileri bakış noktası çizilir.

### 5.7 Kamera durum makinesi

| Durum | Ne olur | Geçiş |
|---|---|---|
| `ANA_HAT` | Kamera ana hatta `s` noktasında; kaydırma `s`'yi değiştirir | Tabela → `SAPAGA_GIRIS(sapak)` |
| `SAPAGA_GIRIS` | Üç parça: kavşağa ilerle → 90° dön → sapağa gir (her biri ~0,7 sn, ease-in-out); kamera bölüm çipine ~6 birim kala durur | Bitti → `SAPAKTA` |
| `SAPAKTA` | Kamera sapakta `s` noktasında; kaydırma ilerletir | "Ana hatta dön" / Esc → `ANA_HATTA_DONUS` |
| `ANA_HATTA_DONUS` | Aynı üç parça tersinden (~2,1 sn) | Bitti → `ANA_HAT` (kavşak noktasında) |

Kurallar: geçiş durumlarında kaydırma, tabela ve çip tıklamaları yok sayılır (kuyruk yok). Kol `GOSTERIM`'deyken kamera hareket etmez; kaydırma önce kartı bıraktırır. Adres ↔ (durum, `s`) eşlemesi saf fonksiyondur; derin link ilk karede animasyonsuz uygulanır. Geçişler süreli ve ease-in-out'tur (yay değil): başı ve sonu belli, kesilmez; reduced-motion + "3D'yi yine de aç" → süre 0.

### 5.8 Kaydırma ve kamera yolu
- **Yol:** ana hat ve sapaklar, yay uzunluğuyla (arc length) parametrelenmiş kırık çizgilerdir; köşeler kamera için yumuşatılır (pah → dairesel yay). `noktaAl(yol, s)` → konum + birim teğet; `s ∈ [0, L]` sıkıştırılır.
- **Kamera:** yolun `s` noktasında, tahtanın 1,6 üstünde; dikey görüş açısı ~54°; **düz bakar, eğim yok**. Ufuk ekranın üstten ~%34'ündedir: kamera eğilmeden projeksiyon dikey kaydırılır (*lens kaydırma*, mimari fotoğraftaki shift objektif gibi; Three.js'te `camera.setViewOffset`). Böylece tabela direkleri ve çip kenarları dik kalır. Bakış yönü yolun teğetidir (ileri bakış Δ ile yumuşatılır). **Yuvarlanma (roll) ve sallanma (bob) yok**; dönüşte açısal hız sınırlı (baş dönmesine karşı).
- **Girdi:** tekerlekte `deltaMode` (piksel / satır / sayfa) piksele çevrilir, hedef `s += c·Δ`. Dokunmada dikey sürükleme hedef `s`'yi değiştirir; parmak kalkınca son hızla atalet (`hedef += v·τ`). Klavye §3.5. Kamera hedef `s`'yi kritik sönümlü yayla izler (§5.3).
- Sayfanın kendisi kaymaz (sahne tam ekran, `overscroll-behavior: none`); tekerlek olayı yalnızca 3D etkinken `preventDefault` edilir.

---

## 6. Dosya yapısı (hedef)

```
/
├─ CLAUDE.md
├─ astro.config.mjs
├─ package.json
├─ public/
│  ├─ cv/ (burak-eren-simsek-cv-tr.pdf, ...-en.pdf)   ← Burak ekleyecek
│  └─ favicon.svg
├─ scripts/
│  ├─ kontrol.mjs                   (build sonrası dist/ denetimi: TR/EN eşleşmesi, kırık link, 404.html, fontlar, JS bütçesi)
│  └─ uctan-uca.mjs                 (M2: headless Chrome + CDP; yedek/3D seçimi, gezinme, kare süresi, mavi piksel sayımı)
├─ src/
│  ├─ content.config.ts             (koleksiyon tanımları; şemalar icerik/sema.ts'te)
│  ├─ icerik/sema.ts                (Zod şemaları, yalnızca astro/zod'a bağlı → Vitest'te test edilir)
│  ├─ icerik/koleksiyonlar.ts       (astro:content okuması: sayfaVerisi(dil) = bütün koleksiyonlar + sayfa taslak bayrağı; publicDosyasiVar)
│  ├─ pafta/tipler.ts               (ortak veri sözleşmesi: PaftaOgesi, Ozet; yedek sayfa ve 3D aynı veriyi kullanır)
│  ├─ pafta/deste.ts                (yedek sayfanın kart destesi, saf: dongu, sonraki/onceki, konumAdi)
│  ├─ pafta/{projeler,stajlar,yetkinlikler,belgeler}.ts  (koleksiyon → kartlar + özet, saf)
│  ├─ pafta/bicim.ts                (ay adları/tarih aralığı "Ağu – Eyl 2026", tekil/çoğul)
│  ├─ sahne/klavye.ts               (yedek sayfada ← → kuralı: odak destedeyse kart)
│  ├─ hareket/yay.ts                (kritik sönümlü yay: kol ve kamera ortak)
│  ├─ pcb/
│  │  ├─ duzen.ts       (içerikten PCB yerleşimi: ana hat, kavşaklar, sapaklar, öğe çipleri, tabelalar; saf)
│  │  ├─ yol.ts         (yay uzunluğu parametrelemesi, noktaAl, köşe yumuşatma; saf)
│  │  ├─ kamera.ts      (kamera durum makinesi + adres ↔ konum; saf)
│  │  ├─ kaydirma.ts    (tekerlek / dokunma / klavye → hedef s, atalet; saf)
│  │  ├─ renkler.ts     (3D palet; renk testi denetler)
│  │  ├─ giris.ts       (koşul denetimi + dinamik import; yedek sayfaya giden tek 3D betiği)
│  │  └─ sahne3d/       (Three.js yalnızca burada: kur.ts, tahta.ts, yollar.ts, cipler.ts, yazi.ts (canvas dokusu), isik.ts, kalite.ts, dongu.ts, etkilesim.ts (DOM düğmelerini izdüşüme taşır))
│  ├─ kol/
│  │  ├─ kinematik.ts  (ik2, gantry çözümü)
│  │  ├─ durum.ts      (kol durum makinesi, §5.4)
│  │  ├─ ciz.ts        (SVG güncelleme)
│  │  └─ kol.ts        (giriş noktası; döngüyü 3D ile paylaşır)
│  ├─ content/
│  │  ├─ projeler/{tr,en}/*.md       (frontmatter = kart; gövde = M6 detay sayfasının uzun metni)
│  │  ├─ stajlar/{tr,en}.json        (dil başına tek dosya: { taslak, stajlar: [...] }; dizideki sıra = sapaktaki sıra)
│  │  ├─ yetkinlikler/{tr,en}.json   (kullanım = referans: "proje:<slug>", "staj:<id>", "egitim")
│  │  └─ belgeler/{tr,en}.json       (cv | sertifika; CV PDF yoksa kart "Yakında")
│  ├─ i18n/{tr,en}.json, i18n/index.ts, i18n/adres.ts
│  ├─ kisi.ts                       (çevrilmeyen bilgiler: ad, GitHub, LinkedIn, e-posta)
│  ├─ styles/tokens.css             (§4 token'ları, iki tema)
│  ├─ tema/tema.ts                  (tema seçimi mantığı + <head> ILK_BETIK)
│  ├─ components/
│  │  ├─ YedekSayfa.astro  (bölüm linkleri + dil/tema + Hakkımda + 4 bölüm; eski Sahne'nin düz hâli)
│  │  ├─ Pcb.astro         (canvas + etkileşim düğmeleri + detay kartı + kol katmanı + JSON adası + giriş betiği)
│  │  ├─ DetayKarti.astro, HakkimdaPaneli.astro (3D'de Hakkımda; yedek sayfadakiyle aynı düzen)
│  │  ├─ Pafta.astro, Deste.astro, Bant.astro, OzetMenu.astro  (yalnızca yedek sayfa, §3.6)
│  │  ├─ Projeler.astro, Stajlar.astro, Yetkinlikler.astro, Belgeler.astro, Hakkimda.astro
│  │  ├─ PaftaCercevesi.astro, KolStatik.astro (yedek sayfada durağan kol çizimi)
│  │  ├─ Sekmeler.astro (yedek sayfanın bölüm linkleri)
│  │  └─ TemaDugmesi.astro, DilDugmesi.astro, DuzGorunumDugmesi.astro
│  └─ pages/
│     ├─ index.astro, en/index.astro
│     ├─ 404.astro      (iki dilli; Cloudflare Pages için zorunlu, bkz. §2.1)
│     └─ projeler/[slug].astro, en/projeler/[slug].astro
└─ tests/ (var olan: renk, fontlar, yedek-font, kontrol, i18n, tema, icerik, deste, projeler, bicim, stajlar, yetkinlikler, belgeler, klavye, adres;
           yeni: duzen, yol, kaydirma, kamera, yay (M2–M3); kinematik, durum (M4))
```

Yeni M2'de silinecekler (eski pafta destesi): `src/sahne/sahne.ts`, `src/sahne/ilkBetik.ts`, `tests/sahne.test.ts`, `PaftaGostergesi.astro`, `Sahne.astro`'nun deste kısmı ve `PaftaCercevesi.astro`'daki konum/kayma CSS'i.

---

## 7. İçerik (TR — EN çevirisi M6'da)

### Hakkımda
- Ad: **Burak Eren Şimşek**
- Unvan: **Bilgisayar Mühendisliği Öğrencisi**
- Tanıtım (Burak 2026-11-22'de olduğu gibi onayladı; metin `src/i18n/tr.json`'da): "Sivas Cumhuriyet Üniversitesi'nde 4. sınıftayım. STM32 ve ESP32 ile gömülü sistemler geliştiriyor, bunları yapay zekâyla buluşturan projeler üzerinde çalışıyorum. Şu an Kapsam Elektromekanik'te stajyerim."
- Düğmeler: "İletişime geç" (çerçeveli, `mailto:`). **"CV'yi indir" (turuncu, ana) M6'da** PDF'ler gelince, "İletişime geç"in soluna eklenir; o zamana kadar hiç görünmez ("Yakında" da yazmaz).
- İletişim: GitHub `github.com/simsekerenburak` · LinkedIn `linkedin.com/in/burak-eren-şimşek-` · `burakerensimsek59@gmail.com`

### Projeler — "4 proje" (3 tamamlanan, 1 yapım aşamasında)
Giriş cümlesi: "Dört proje var, biri hâlâ yapım aşamasında." (taslaktaki "Kol bir kutuyu bantten alıp desteye koyar." cümlesi bant konsepti iptal olduğu için gelmeyecek). Kartta kısa açıklama, uzun metin md gövdesinde. MediTrack ve Robot Kol tek kişilik (Burak, 2026-11-22).
1. **Otonom Yıldız Takip Sistemi** · 2026 · takım projesi · Gömülü Sistemler dersi final projesi — STM32 ile hem otonom hem manuel çalışan teleskop takip sistemi; yıldız haritası çıkarıp seçilen hedefe (GOTO) kilitlenir. Yatay eksende step, dikey eksende servo motor. Yer kontrol istasyonu Python/PyQt6, UART. **Rolüm: sensör verilerinin hesaplanması.** · STM32F401RE, MPU6050, GY-271, C, PyQt6
2. **Şimşek** · 2026 · tek kişilik · Kişisel yapay zekâ asistanı — iPhone, web ve bilgisayarı tek bir bulut beyne bağlayan asistan: kalıcı hafıza, dosya arama, görevler ve sesli komut. · React Native (Expo), Cloudflare Workers, D1, R2, Workers AI, Whisper
3. **MediTrack** · 2026 · tek kişilik · IoT ilaç takip sistemi — Arduino hatırlatıcı (LCD + buzzer), Python masaüstü uygulaması, FastAPI backend (Render) ve Firebase ile uçtan uca ilaç takip sistemi; PWA. · Arduino, Python, FastAPI, Firebase, PWA
4. **Robot Kol** · Bahar 2027 teslim · tek kişilik · **Yapım aşamasında** · Bitirme projesi — Ucu değiştirilebilen robotik kol: nesne taşıma, 3D baskı ve çizim. Gövdesi kendi 3D baskı tasarımı. · 3D baskı, Ters kinematik, Değiştirilebilir uç

### Stajlar — "3 staj" → "2 şehir" (Sivas: Kapsam · Antakya: DOĞAKA, Demircan), "1 devam eden" (Kapsam)
Burak 2026-11-22: şehirler **Sivas ve Antakya** (DOĞAKA'nın şehri de Antakya). Kapsam kartında yalnızca "Sivas · uzun dönem staj" + "Gömülü sistemler", "Mobil" hapları; açıklama YOK (`tests/stajlar.test.ts` kaydın tam içeriğini sabitler).
1. **Kapsam Elektromekanik** · Eylül 2026 → · *Devam ediyor* · Sivas · uzun dönem staj — Gömülü sistemler ve mobil uygulama geliştirme. *(Başka detay yok.)*
2. **DOĞAKA (Doğu Akdeniz Kalkınma Ajansı)** · Ağu – Eyl 2026 · Antakya — İnsan kaynakları birimi için gerçekten kullanılacak bir personel veritabanı web uygulaması geliştirdim.
3. **Demircan İnşaat Elektrik** · Tem – Ağu 2026 · Antakya · elektrik taahhüt — Trafo ve kısa devre hesaplarını otomatikleştiren bir Python aracı geliştirdim.

### Yetkinlikler — "5 alan" → "21 araç", "3 proje"
Her alan bir kart; üst satırda nerede kullanıldığı yazar. Yüzdelik çubuk **kullanma**. Kullanım yerleri JSON'da referanstır, adlar projeler/stajlar verisinden gelir; "21 araç" ve "3 proje" hesaplanır, kırık referans build'i durdurur.
1. **Gömülü sistemler** (Yıldız Takip · MediTrack) — STM32, ESP32, Arduino, C, I2C, UART
2. **Yazılım** (Demircan · Yıldız Takip) — Python, Java, Dart, PyQt6
3. **Backend ve bulut** (MediTrack · Şimşek) — FastAPI, Firebase, Cloudflare Workers, D1, R2
4. **Mobil** (Şimşek · Kapsam) — React Native, Expo, Flutter
5. **Yapay zekâ** (Şimşek · eğitimler) — LLM entegrasyonu, Whisper, Workers AI

### Belgeler — "4 belge" → "3 sertifika", "2 dilde CV"
1. **Özgeçmiş** — Türkçe / İngilizce PDF *(dosyalar henüz yok. Build `public/cv/burak-eren-simsek-cv-{tr,en}.pdf` var mı diye bakar: yoksa kart "Yakında" etiketiyle çıkar ve link basılmaz; M6'da PDF'ler konunca "Türkçe PDF / İngilizce PDF" linkleri kendiliğinden gelir — sahte PDF ile denendi, `kontrol` linkleri geçerli buldu)*
2. **Yapay Zekaya İlk Adım** · AI Business School · Eylül 2026 · Yeterlilik no: CERT-094BCBC0
3. **Data Science and Machine Learning Bootcamp** · Huawei · Ağustos 2026 · Katılım belgesi
4. **Flutter & Dart: Sıfırdan Mobil App Geliştiriciliğine** · Udemy · Temmuz 2026 · Doğrulanabilir sertifika

---

## 8. Telefon görünümü (390px)
- **Önce tam hâl** (aynı 3D sahne) gerçek iPhone'da denenir, ölçülür, sonra sadeleştirilir (Burak'ın kararı, 2026-11-23). Ölçülenler: 3D'nin hazır olma süresi, ortalama ve en kötü %1 kare süresi, 2 dakikada ısınma/kısılma, bellek.
- **Kalite kademeleri** (`src/pcb/sahne3d/kalite.ts`): Yüksek (gölge haritası, pixelRatio ≤ 2) · Orta (gölge haritası yok → hazır yumuşak lekeler, pixelRatio 1,5) · Düşük (pixelRatio 1, daha az ayrıntı). Başlangıç kademesi ekran boyutundan tahmin edilir, ilk 2 sn'nin kare sürelerine göre ayarlanır. Düşük kademede de sürekli < 24 fps → "Düz görünüm" önerilir.
- **Dokunma:** dikey sürükleme = ilerleme (ataletli); tabela/çipe dokunma = tıklama; kol dokunulan noktaya uzanır, parmak kalkınca katlanır.
- Detay kartı tam genişlik; Hakkımda paneli ekranın alt yarısında; dokunma hedefleri en az 44px; yatay sayfa kayması yok.
- Sadeleştirme adayları (ölçüme göre karar): gölge haritası, ileri bakış mesafesi, aynı anda çizilen sapak sayısı, serigrafi doku çözünürlüğü, kol ayrıntısı.

---

## 9. Yol haritası (milestone'lar)

Her milestone sonunda site canlıya çıkabilir durumda olmalı (3D hazır değilse yedek sayfa yayında kalır).

| # | Hedef | Kabul kriteri |
|---|---|---|
| **M1 İskelet** ✅ 2026-11-22 | Astro + TS, token'lar, iki tema, TR/EN, 5 bölüm statik HTML (JS'siz düz hâl), `npm run yayinla`, `kontrol.mjs`, `404.astro` | Build + test yeşil; site açılıyor; tema ve dil değişiyor; JS kapalıyken tüm içerik okunuyor |
| ~~M2 Deste ve bant~~ ✅ 2026-11-23, **iptal** | Pafta destesi + sekmeler + hash + klavye yapıldı ve yayınlandı; konsept PCB'ye dönünce iptal edildi | Kart destesi + bant yedek sayfada kalır, pafta destesi yeni M2'de silinir |
| **M2 PCB sahnesi + kaydırma** | 0) boş Three.js sahnesinin boyutunu ölç, §2.2 bütçesini kesinleştir · 1) eski pafta destesini kaldır, yedek sayfayı sadeleştir · 2) saf modüller: `duzen.ts`, `yol.ts`, `kaydirma.ts`, `hareket/yay.ts` · 3) giriş betiği, dinamik import, yedeğe düşme, "Düz görünüm" düğmesi · 4) tahta, ana hat, Hakkımda çipi + HTML paneli, sapaklar ve tabelalar (henüz girilemez), serigrafi · 5) ışık, bakır malzeme, gölge, kalite iskeleti · 6) ölç ve yayınla | duzen/yol/kaydirma/yay testleri yeşil; masaüstünde 60 fps; 3D parçası bütçe içinde (`kontrol.mjs`); JS kapalı / reduced-motion / WebGL yok → yedek sayfa; 3D ekran görüntüsünde mavi piksel yok; CLS ≤ 0,05 |
| **M3 Sapaklar + kamera geçişleri** | Kamera durum makinesi (§5.7), tabela → dönüş ve giriş, sapakta kaydırma, öğe çipleri (B seçeneği, §3.1), konnektör çipi, "Ana hatta dön", etkileşim düğmeleri (fare/klavye/ekran okuyucu), adres ↔ konum, odak yönetimi, `aria-live` | kamera.test her geçiş; tüm içerik yalnızca klavyeyle gezilebiliyor; `/#stajlar` ve `/#stajlar-dogaka` doğrudan açılıyor |
| **M4 Kol + kart taşıma** | `kinematik.ts`, kol SVG katmanı, imleç takibi, katlanma, kol durum makinesi (§5.4), detay kartı (HTML, içerik yedek sayfadan), ← → ile değiştirme, telemetri, mühendis modu | kinematik/yay/durum testleri (§10); kol + sahne 60 fps; kart içeriği yedek sayfayla aynı (tek kaynak) |
| **M5 Telefon + erişilebilirlik** | Gerçek iPhone'da ölçüm, kalite kademeleri, dokunma, sadeleştirme (§8); ekran okuyucu turu (NVDA + VoiceOver), odak sırası | Lighthouse erişilebilirlik ≥ 95 (iki görünümde); iPhone'da ≥ 30 fps (hedef 60) ya da kendiliğinden yedek sayfa |
| **M6 İçerik + EN + CV** | Proje detay sayfaları, İngilizce çeviriler, CV PDF'leri + Hakkımda'ya "CV'yi indir", görseller, `kontrol.mjs`'te `TASLAK_HATA = true` | TR/EN eşleşme kontrolü yeşil |
| **M7 Alan adı** *(is-a.dev PR #62488 Burak tarafından açıldı, 2026-11-23, incelemede; onaylanınca Cloudflare'e özel alan adı bağlanacak, o zamana kadar beklenir)* | is-a.dev'e `domains/burakerensimsek.json` (CNAME → `burakerensimsek.pages.dev`) başvurusu + Cloudflare Pages'e özel alan adı | `https://burakerensimsek.is-a.dev` açılıyor, HTTPS geçerli; Türkiye bağlantısından ECH'siz `curl` ile açılıyor |

**Sıradaki adım:** PCB planı onaylandı (2026-11-23). Yeni M2'nin 0. adımı: Three.js boyut ölçümü + prototip ölçüleriyle ilk sahne görüntüsü; sonuç Burak'a gösterilir, onayla devam.

---

## 10. Test ve doğrulama
- `duzen.test.ts`: sapak sırası ve yönü (sol/sağ dönüşümlü); öğe sayısı içerikle aynı; çip, tabela ve yol çakışması yok; yollar arası en az boşluk; yalnızca 0° / 45° / 90° açılar; aynı girdi → aynı yerleşim.
- `yol.test.ts`: bilinen şekillerde yay uzunluğu doğru; `noktaAl` uçlarda sıkıştırır ve NaN üretmez; teğet birim uzunlukta ve köşelerde sürekli; konum `s`'ye göre sürekli.
- `kaydirma.test.ts`: `deltaMode` dönüşümü; sınırlarda sıkıştırma; atalet sönüyor; büyük tek bir tekerlek olayı kamerayı ışınlamıyor (adım sınırı).
- `kamera.test.ts`: §5.7'deki her geçiş; geçiş durumlarında olaylar yok sayılıyor; adres → (durum, s) → adres gidiş-dönüşü.
- `yay.test.ts`: kritik sönümde salınım yok (hedefi aşmıyor), 2 sn içinde hedefe %1 yakınsıyor.
- `kinematik.test.ts`: bilinen bir hedefte θ₁/θ₂ doğru; uç nokta hedefle çakışıyor (tolerans 1e-6); erişim dışı hedefte kol tam uzanıyor ve NaN üretmiyor; `|L1−L2|`'den yakın hedefte patlamıyor.
- `durum.test.ts`: §5.4'teki her geçiş; geçersiz olaylar durumu değiştirmiyor; taşıma sırasında tıklama ve ← → yok sayılıyor.
- `renk.test.ts`: `tokens.css` + `src/pcb/renkler.ts` (mavi yok, kontrast).
- `kontrol.mjs` (build sonrası `dist/` üzerinde; kuralları `tests/kontrol.test.ts` sınar, her kural için "tek bozma → tek hata"):
  - `404.html` var; içindeki linkler `/` ile başlar (404 her adreste sunulur).
  - İç linkler (`href`, `src`, `poster`, `srcset`, CSS `url()`, sitenin kendi tam adresi dahil) kırık değil; sayfa linkleri `/` ile biter, `.html` ile bitmez; `#parça` hedef sayfada `id` olarak var.
  - Font CSS'e gömülü değil (`data:`); preload edilen her font bir `@font-face`'te kullanılıyor ve `crossorigin` taşıyor.
  - Her TR sayfanın EN karşılığı var ve tersi; `<html lang>` doğru.
  - `<html data-taslak>`: M1–M5 uyarı, M6'dan itibaren hata (`TASLAK_HATA` sabiti).
  - **Yeni:** JS bütçesi (yedek sayfa ve 3D parçası gz boyutu, §2.2); JSON adasındaki her kimliğin yedek sayfada bir `<article>` karşılığı var.
- **Uçtan uca** (`scripts/uctan-uca.mjs`, headless Chrome + CDP; yerel ve canlı): yedek/3D seçimi (JS yok, reduced-motion, WebGL yok); kaydırma → `s`; tabela → sapak; derin link; klavye turu; kare süresi ölçümü (`requestAnimationFrame` aralıkları); 3D ekran görüntüsünde mavi piksel sayımı (§4.2).
- Elle: Windows laptop (Chrome, Firefox) + gerçek iPhone (Safari); koyu/açık; JS kapalı; reduced-motion; NVDA + VoiceOver turu (M5).

---

## 11. Açık kararlar (Burak'a sorulacak)
1. Kol yazının ya da kartın üstünden geçerken yarı saydam mı olsun, içeriğin arkasında mı kalsın? (Varsayılan: yarı saydam.)
2. Ses efektleri (sinyal vızıltısı, gripper sesi) varsayılan kapalı, açılabilir: M4 sonrası eklenecek mi?
3. Bitirme kolunun gerçek link oranları (L1/L2).
4. İleride: IK ve durum makinelerini C ile yazıp WebAssembly'ye derleme fikri (gömülü vurgusu için): ilk sürümden sonra.
5. Siteden sonra LinkedIn yetenek listesini §7 Yetkinlikler ile eşitlemek.

PCB konsepti soruları 2026-11-23'te cevaplandı (prototip ölçüleri §3.1, M7 §9, 3D koyu §4.2, konnektör §3.2, kart açıkken kaydırma §3.2, özet §3.3, kol 2D §5.5, reduced-motion §3.4).
