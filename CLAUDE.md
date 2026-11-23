# Burak Eren Şimşek — Kişisel Portfolyo Sitesi

Bu dosya, bu repodaki her Claude Code oturumunun ana talimatıdır. Projenin tüm kararları, mimarisi, tasarım sistemi, algoritmaları, içerikleri ve yol haritası burada. Bir karar burada yazıyorsa tartışılmış ve verilmiştir; değiştirmeden önce Burak'a sor.

Görsel referans (tasarım taslakları): https://claude.ai/artifact/CpnHDC12EXRFrqReVNZnbM
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

---

## 1. Proje özeti

- **Ne:** Burak'ın kendini, projelerini, stajlarını, yetkinliklerini ve belgelerini anlatan kişisel portfolyo sitesi.
- **Kimin için:** Genel portfolyo (işverenler, staj/burs başvuruları, LinkedIn ziyaretçileri).
- **Fikir:** Site bir **endüstriyel otomasyon hattı** gibi çalışır. Tavan rayına asılı bir **gantry robot kol** imleci takip eder. İçerik **üst üste duran paftalar (deste)** halindedir; her paftada öğeler **yürüyen bant** üzerinde kutu olarak durur ve kol bunları alıp **kart destesine** koyar. Robot kol, Burak'ın bitirme projesinin (uç değiştirebilen robot kol) dijital ikizidir.
- **Diller:** Türkçe (varsayılan) ve İngilizce.
- **Barındırma:** Cloudflare Pages, ücretsiz; `wrangler` ile doğrudan yükleme. Proje adı `burakerensimsek` → `burakerensimsek.pages.dev`. Kalıcı adres ücretsiz is-a.dev alt alan adı: `burakerensimsek.is-a.dev` (M7). GitHub yalnızca kod yedeği.

---

## 2. Teknoloji ve altyapı

| Konu | Karar |
|---|---|
| Site üretici | **Astro** (güncel kararlı sürüm), TypeScript |
| Etkileşim | Astro **island** mimarisi; kol/bant/deste mantığı saf TypeScript + SVG. React vb. framework yok |
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

---

## 3. Bilgi mimarisi

### 3.1 Paftalar (üst üste deste)

Site dikey kaymaz. **Beş pafta üst üste durur**, en önde Hakkımda vardır. Arkadaki paftaların üst kenarları hafifçe görünür.

| Sıra | Pafta | Hash | Düzen |
|---|---|---|---|
| 01 | Hakkımda | `#hakkimda` | Giriş paftası, sade (bant/deste yok) |
| 02 | Projeler | `#projeler` | Bant + deste + kol |
| 03 | Stajlar | `#stajlar` | Bant + deste + kol |
| 04 | Yetkinlikler | `#yetkinlikler` | Bant + deste + kol |
| 05 | Belgeler | `#belgeler` | Bant + deste + kol |

- **Gezinme:** üstte pafta sekmeleri, altta pafta göstergesi (5 nokta, aktif olan turuncu uzun çubuk), sağ altta "← önceki / sonraki →" linkleri, klavyede ← → tuşları, telefonda yatay kaydırma (swipe).
- **Geçiş:** Kol öndeki paftanın kenarını gripper ile tutar, kaldırır ve destenin **en arkasına** koyar (~0,7 sn). Geri giderken en arkadakini alıp öne getirir. Sekmeye tıklayınca doğrudan o paftaya geçilir (kol animasyonu kısaltılmış).
- **Döngü:** Belgeler'den sonra ileri → Hakkımda (deste döner).
- Her paftanın kendi hash'i vardır; `burakerensimsek.is-a.dev/#stajlar` doğrudan Stajlar'ı açar. `hashchange` dinlenir.
- Proje detay sayfaları ayrıca: `/projeler/[slug]` ve `/en/projeler/[slug]` (tam sayfa, link paylaşılabilir).

**M2'de uygulandı (2026-11-23, Burak'ın kararları):**
- **Klavye ← → odağa göre:** odak bir destenin içindeyse (kart, kart okları, bant kutusu; `data-kart-alani`) o destenin kartını çevirir, değilse paftayı değiştirir. Alt/Ctrl/Meta/Shift'li basışlar ve yazı alanları tarayıcıya bırakılır; basılı tutunca pafta tekrarlanmaz (`src/sahne/klavye.ts`).
- **Geri düğmesi siteden çıkar:** pafta geçişi adresi `history.replaceState` ile yazar, geçmişe kayıt eklemez. Elle yazılan/tıklanan #parça `hashchange` ile o paftayı (kart kimliğiyse kartı da) öne getirir; tanınmayan parça paftayı değiştirmez.
- **Kol gelene kadar geçiş (M4'te kol yapacak):** → öndeki pafta opak kalarak kendi boyu kadar yukarı çekilir, en sonda söner ("çıkan" konumu = destenin en arkası); ← oradan opak iner. Sekmeyle komşu olmayan paftaya: aynı geçiş 0,35 sn. `prefers-reduced-motion` → geçiş yok.
- Taslağa göre **Hakkımda'da "← önceki" linki yok** (kapak); Belgeler'de "Hakkımda →" var. Klavyede halka tam döner.
- İlk kare: satır içi `SAHNE_ILK_BETIK` paftaları ilk boyamadan önce adresteki paftaya göre dizer (sayfa zıplamaz); modül betiği sonra gezinmeyi bağlar. Konum kuralı iki yerde (betik metni + `paftaKonumu`), `tests/sahne.test.ts` ikisini eşit tutar.
- Dil/tema düğmeleri ve sekmeler sahnenin üst şeridinde (her paftada aynı yer); telefonda düğmeler üstte, sekmeler altta kayan şerit. Swipe M5'te.

### 3.2 İçerik paftası şablonu (tek bileşen: `Pafta`)

Projeler, Stajlar, Yetkinlikler ve Belgeler **aynı bileşenden**, sadece farklı veriyle üretilir:

- Sol üst: başlık (52px) + tek cümle giriş.
- Orta-sol: **Deste** — en fazla 3 kart görünür. Öndeki kart tam içerik (üst satır turuncu mono yazı + varsa etiket hapı, başlık 27px, alt satır, açıklama, teknoloji hapları, "i / n" sayacı, ← → düğmeleri). Arkadaki iki kartın yalnızca üst şeridi görünür ve üzerinde `ad · üst satır` yazar.
- Kol öndeki kartı üst kenarından tutar.
- Alt: **Bant** — öğeler krem renkli kutular halinde; öndeki kartın kutusu turuncu çerçeveli. Kutuya tıklamak o öğeyi öne getirir.
- Sağ: **Özet açılır menüsü** — büyük turuncu sayı + etiket (ör. "3 staj"), açılınca alt açılır menüler (ör. "2 şehir", "1 devam eden"), onlar da açılınca satırlar. **`<details>/<summary>` ile yap** (JS olmadan da çalışsın, erişilebilir olsun).
- ← → (veya kutuya tıklama) ile deste döner; gerçek sitede kol öndeki kartı kaldırıp destenin arkasına koyar.

### 3.3 Aşamalı geliştirme (progressive enhancement)

- JS kapalıyken: paftalar alt alta normal bölümler olarak görünür, her deste kartı düz bir liste olur, linkler çalışır. Google ve ekran okuyucular tüm içeriği okur.
- Sahnenin ilk karesi build sırasında statik SVG olarak üretilir; JS sonra yüklenip hareketi başlatır (`client:idle`).
- `prefers-reduced-motion: reduce` → kol animasyonları kapanır, geçişler anında olur.
- Sekme arka plandayken veya sahne görünmüyorken `requestAnimationFrame` döngüsü durur.

---

## 4. Tasarım sistemi

### 4.1 Görsel dil
Modern ve premium (ürün fotoğrafı stüdyosu hissi): tek yumuşak ışık kaynağı, derinlik, yumuşak gölgeler, metal malzeme hissi, büyük ve rahat tipografi, bol boşluk. Tematik doku (PCB, ızgara, kod) **yok**.

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

## 5. Robot kol: kinematik, hareket ve durum makinesi

Bu bölüm sitenin mühendislik kalbi. Kodu `src/kol/` altında, **DOM'dan bağımsız saf fonksiyonlar** olarak yaz (test edilebilsin).

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

### 5.4 Durum makinesi
Açık bir durum makinesi olarak yaz (if-else yığını değil). Durumlar ve geçişler:

| Durum | Ne olur | Geçiş |
|---|---|---|
| `BOSTA` | Kol katlanmış, gripper kapalı | İmleç hareket → `TAKIP` |
| `TAKIP` | Kol imleci izler, gripper açık | 1,2 sn hareketsizlik veya imleç dışarı → `KATLANIYOR`; bir kutu/kartın üstü → `HEDEFTE` |
| `KATLANIYOR` | Direk kısalır, kol **olduğu yerde** katlanır | Bitti → `BOSTA`; hareket → `TAKIP` |
| `HEDEFTE` | Kutu/kart vurgulanır, gripper açılır | Tıklama → `KAVRAMA`; uzaklaşma → `TAKIP` |
| `KAVRAMA` | Gripper kapanır, nesne kola bağlanır | → `TASIMA` |
| `TASIMA` | Nesne desteye/masaya taşınır (yumuşatılmış yol) | → `BIRAKMA` |
| `BIRAKMA` | Nesne bırakılır, deste güncellenir | → `TAKIP` |
| `PAFTA_TASIMA` | Öndeki paftayı tutup arkaya koyar (~0,7 sn) | → `TAKIP` |

Kurallar: `TASIMA`/`PAFTA_TASIMA` sırasında gelen tıklamalar kuyruğa alınmaz, yok sayılır. Katlanma gecikmesi 1,2 sn.

### 5.5 Kolun sayfayla etkileşimi
- Kol SVG'si tüm sahnenin üstünde, `pointer-events: none` (tıklamaları engellemez).
- Kol bir metnin üstünden geçerken yarı saydam olur (`opacity ≈ 0.85`). *(Açık karar: Burak onaylamadı, varsayılan bu.)*
- Telefonda: dokunulan noktaya uzanır, parmak kalkınca katlanır.

### 5.6 Telemetri ve Mühendis modu
- Küçük telemetri hapı: `durum · θ₁ · θ₂ · x` (JetBrains Mono, canlı).
- **Mühendis modu** düğmesi: kolun üstüne L₁/L₂ ölçü çizgileri, θ açı yayları, erişim sınırı (`r = L1+L2`) ve rahat mesafe (`d*`) çemberleri çizilir.

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
├─ scripts/kontrol.mjs              (build sonrası dist/ denetimi: TR/EN eşleşmesi, kırık link, 404.html, fontlar)
├─ src/
│  ├─ content.config.ts             (koleksiyon tanımları; şemalar icerik/sema.ts'te)
│  ├─ icerik/sema.ts                (Zod şemaları, yalnızca astro/zod'a bağlı → Vitest'te test edilir)
│  ├─ icerik/koleksiyonlar.ts       (astro:content okuması: sayfaVerisi(dil) = bütün koleksiyonlar + sayfa taslak bayrağı; publicDosyasiVar)
│  ├─ pafta/tipler.ts               (ortak paftanın veri sözleşmesi: PaftaOgesi, Ozet)
│  ├─ pafta/deste.ts                (deste durumu, saf: dongu, sonraki/onceki, konumAdi)
│  ├─ pafta/projeler.ts             (projeler → kartlar + özet menüsü, saf)
│  ├─ pafta/{stajlar,yetkinlikler,belgeler}.ts  (aynı dönüşüm, diğer paftalar için)
│  ├─ pafta/bicim.ts                (ay adları/tarih aralığı "Ağu – Eyl 2026", tekil/çoğul)
│  ├─ sahne/sahne.ts                (pafta destesi, saf: PAFTA_SIRASI, paftaKonumu, gecisTuru, komsular, hedefPafta)
│  ├─ sahne/ilkBetik.ts             (SAHNE_ILK_BETIK: ilk karede paftaları diken satır içi betik)
│  ├─ sahne/klavye.ts               (← → kuralı: klavyeEylemi, baglamOku)
│  ├─ content/
│  │  ├─ projeler/{tr,en}/*.md       (frontmatter = kart; gövde = M6 detay sayfasının uzun metni)
│  │  ├─ stajlar/{tr,en}.json        (dil başına tek dosya: { taslak, stajlar: [...] }; dizideki sıra = destedeki sıra)
│  │  ├─ yetkinlikler/{tr,en}.json   (kullanım = referans: "proje:<slug>", "staj:<id>", "egitim")
│  │  └─ belgeler/{tr,en}.json       (cv | sertifika; CV PDF yoksa kart "Yakında")
│  ├─ i18n/{tr,en}.json             (arayüz ve Hakkımda metinleri; EN'de `taslak`)
│  ├─ i18n/index.ts                 (METINLER, Dil tipi, anaSayfa/otekiDil)
│  ├─ kisi.ts                       (çevrilmeyen bilgiler: ad, GitHub, LinkedIn, e-posta)
│  ├─ styles/tokens.css             (§4 token'ları, iki tema)
│  ├─ tema/tema.ts                  (tema seçimi mantığı + <head> ILK_BETIK)
│  ├─ kol/
│  │  ├─ kinematik.ts  (ik2, gantry çözümü)
│  │  ├─ yay.ts
│  │  ├─ durum.ts      (durum makinesi)
│  │  ├─ ciz.ts        (SVG güncelleme)
│  │  └─ kol.ts        (island giriş noktası, rAF döngüsü)
│  ├─ components/
│  │  ├─ Sahne.astro   (5 pafta + üst şerit (sekmeler, dil/tema) + alt şerit (gösterge, önceki/sonraki); M3'te tavan rayı + kol katmanı)
│  │  ├─ Pafta.astro   (§3.2 şablonu)
│  │  ├─ Deste.astro, Bant.astro, OzetMenu.astro
│  │  ├─ Projeler.astro, Stajlar.astro, Yetkinlikler.astro, Belgeler.astro  (Pafta + o paftanın verisi)
│  │  ├─ Hakkimda.astro
│  │  ├─ PaftaCercevesi.astro  (pafta yüzeyi; sahnede data-konum'a göre yer ve kayma, tek başına sahte arka kenarlar)
│  │  ├─ KolStatik.astro  (GEÇİCİ durağan kol çizimi; M3'te canlı kol gelince silinir)
│  │  ├─ Sekmeler.astro, PaftaGostergesi.astro
│  │  └─ TemaDugmesi.astro, DilDugmesi.astro
│  └─ pages/
│     ├─ index.astro, en/index.astro
│     ├─ 404.astro      (iki dilli; Cloudflare Pages için zorunlu, bkz. §2.1)
│     └─ projeler/[slug].astro, en/projeler/[slug].astro
└─ tests/ (var olan: renk, fontlar, yedek-font, kontrol, i18n, tema, icerik, deste, projeler, bicim, stajlar, yetkinlikler, belgeler, sahne, klavye, adres; M3/M4'te: kinematik.test.ts, yay.test.ts, durum.test.ts)
```

---

## 7. İçerik (TR — EN çevirisi M6'da)

### Hakkımda
- Ad: **Burak Eren Şimşek**
- Unvan: **Bilgisayar Mühendisliği Öğrencisi**
- Tanıtım (Burak 2026-11-22'de olduğu gibi onayladı; metin `src/i18n/tr.json`'da): "Sivas Cumhuriyet Üniversitesi'nde 4. sınıftayım. STM32 ve ESP32 ile gömülü sistemler geliştiriyor, bunları yapay zekâyla buluşturan projeler üzerinde çalışıyorum. Şu an Kapsam Elektromekanik'te stajyerim."
- Düğmeler: "İletişime geç" (çerçeveli, `mailto:`). **"CV'yi indir" (turuncu, ana) M6'da** PDF'ler gelince, "İletişime geç"in soluna eklenir; o zamana kadar hiç görünmez ("Yakında" da yazmaz).
- İletişim: GitHub `github.com/simsekerenburak` · LinkedIn `linkedin.com/in/burak-eren-şimşek-` · `burakerensimsek59@gmail.com`

### Projeler — "4 proje" (3 tamamlanan, 1 yapım aşamasında)
Giriş cümlesi: "Dört proje var, biri hâlâ yapım aşamasında." (taslaktaki ilk cümle "Kol bir kutuyu bantten alıp desteye koyar." kol bunu gerçekten yapınca, M4'te geri gelecek). Kartta kısa açıklama, uzun metin md gövdesinde. MediTrack ve Robot Kol tek kişilik (Burak, 2026-11-22). Kol cümlesinin M4'e ertelenmesini Burak onayladı.
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
- Aynı sahne, ölçeklenmiş. Pafta sekmeleri yatay kaydırılabilir şerit.
- Deste kartı tam genişlik; bantta aynı anda 2 kutu görünür, bant yatay kaydırılır.
- Özet açılır menüsü destenin altına iner.
- Kol küçülür (L1, L2 ekranla ölçeklenir), dokunmayla çalışır.
- Dokunma hedefleri en az 44px. *(Detaylı mobil tasarım Faz 1'de henüz çizilmedi; M5'te önce taslak göster.)*

---

## 9. Yol haritası (milestone'lar)

Her milestone sonunda site canlıya çıkabilir durumda olmalı.

| # | Hedef | Kabul kriteri |
|---|---|---|
| **M1 İskelet** | Astro + TS kurulumu, token'lar, iki tema, TR/EN, 5 pafta statik HTML olarak (JS'siz düz hali), `npm run yayinla` ile `burakerensimsek.pages.dev` yayında, `kontrol.mjs`, `404.astro` | Build + test yeşil; site açılıyor; tema ve dil değişiyor; JS kapalıyken tüm içerik okunuyor |
| **M2 Deste ve bant** | `Pafta` şablonu: deste dönüşü, bant kutuları, `<details>` özet menüsü, pafta destesi + sekmeler + hash + klavye | Dört içerik paftası taslaklardaki gibi; ← → ve kutu tıklaması çalışıyor |
| **M3 Kol** | `kinematik.ts`, `yay.ts`, kol SVG'si, imleç takibi, katlanma, telemetri, mühendis modu | Birim testleri geçiyor (§10); kol 60 fps; reduced-motion'da animasyon yok |
| **M4 Durum makinesi** | §5.4'ün tamamı: kavrama → taşıma → bırakma, pafta taşıma | Her geçiş test edildi; kenar durumlar (taşıma sırasında tıklama) tanımlı |
| **M5 Erişim ve mobil** | Telefon görünümü, dokunma, swipe, klavye odak sırası, ekran okuyucu etiketleri | Lighthouse erişilebilirlik ≥ 95; gerçek iPhone'da test |
| **M6 İçerik ve EN** | Proje detay sayfaları, İngilizce çeviriler, CV PDF'leri + Hakkımda'ya "CV'yi indir" düğmesi, görseller (blok diyagram/foto), `kontrol.mjs`'te `TASLAK_HATA = true` | TR/EN eşleşme kontrolü yeşil |
| **M7 Alan adı** *(Burak 2026-11-23: M2'den hemen sonra; is-a.dev PR metnini Burak yazar)* | is-a.dev'e `domains/burakerensimsek.json` (CNAME → `burakerensimsek.pages.dev`) başvurusu + Cloudflare Pages'e özel alan adının API ya da `cf-pages.is-a.dev` ile eklenmesi | `https://burakerensimsek.is-a.dev` açılıyor, HTTPS sertifikası geçerli |

**İlk adım:** M1. Kod yazmadan önce Burak'a M1 planını madde madde göster, onay al.

---

## 10. Test ve doğrulama
- `kinematik.test.ts`: bilinen bir hedefte θ₁/θ₂ doğru; uç nokta hedefle çakışıyor (tolerans 1e-6); erişim dışı hedefte kol tam uzanıyor ve NaN üretmiyor; `|L1−L2|`'den yakın hedefte patlamıyor.
- `yay.test.ts`: kritik sönümde salınım yok (hedefi aşmıyor), 2 sn içinde hedefe %1 yakınsıyor.
- `durum.test.ts`: tablo §5.4'teki her geçiş; geçersiz olaylar durumu değiştirmiyor.
- `kontrol.mjs` (build sonrası `dist/` üzerinde; kuralları `tests/kontrol.test.ts` sınar, her kural için "tek bozma → tek hata"):
  - `404.html` var; içindeki linkler `/` ile başlar (404 her adreste sunulur).
  - İç linkler (`href`, `src`, `poster`, `srcset`, CSS `url()`, sitenin kendi tam adresi dahil) kırık değil; sayfa linkleri `/` ile biter, `.html` ile bitmez (Pages yönlendirmesi olmasın); `#parça` hedef sayfada `id` olarak var.
  - Font CSS'e gömülü değil (`data:`); preload edilen her font bir `@font-face`'te kullanılıyor ve `crossorigin` taşıyor.
  - Her TR sayfanın EN karşılığı var ve tersi; `<html lang>` doğru.
  - `<html data-taslak>` (Duzen `taslak` özelliği): M1–M5 uyarı, M6'dan itibaren hata (`TASLAK_HATA` sabiti).
- Elle: Windows laptop (Chrome) + iPhone; koyu/açık tema; JS kapalı.

---

## 11. Açık kararlar (Burak'a sorulacak)
1. Kol yazının üstünden geçerken yarı saydam mı olsun, içeriğin arkasında mı kalsın? (Varsayılan: yarı saydam.)
2. Hakkımda paftası sade mi kalsın? (Varsayılan: sade.)
3. Ses efektleri (bant uğultusu, gripper sesi) varsayılan kapalı, açılabilir — M3 sonrası eklenecek mi?
4. Bitirme kolunun gerçek link oranları (L1/L2).
5. İleride: IK ve durum makinesini C ile yazıp WebAssembly'ye derleme fikri (gömülü vurgusu için) — ilk sürümden sonra.
6. Siteden sonra LinkedIn yetenek listesini §7 Yetkinlikler ile eşitlemek.
