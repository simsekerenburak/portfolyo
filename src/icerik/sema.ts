// İçerik şemaları (Zod). content.config.ts koleksiyonları bunlarla tanımlar; testler de doğrudan bunları
// kullanır. Bu yüzden dosya yalnızca `astro/zod`'a bağlı (o da düz `zod/v4`'ün yeniden dışa aktarımı):
// `astro:content` gibi sanal modüller Vitest'te yok, şema burada durursa test edilebilir.
//
// Zod şeması ne işe yarar? Markdown dosyasının başındaki YAML bloğu (frontmatter) serbest metindir;
// yazım hatası (ör. `durm:`), eksik alan veya yanlış tür sessizce siteye geçebilir. Astro build sırasında
// her dosyayı bu şemadan geçirir: uymayan dosya build'i durdurur. Şemadan ayrıca TypeScript tipi
// çıkar (`Proje`), bileşenler `entry.data.yil`'in sayı olduğunu bilir.
import { z } from 'astro/zod';

/** Proje kimin işi: takım projesi mi, tek kişilik mi. Bilinmiyorsa alan hiç yazılmaz. */
export const TURLER = ['takim', 'tek-kisilik'] as const;
export type Tur = (typeof TURLER)[number];

/** Projenin durumu. Özet menüsü projeleri bu alana göre gruplar ("3 tamamlanan", "1 yapım aşamasında"). */
export const DURUMLAR = ['tamamlandi', 'yapim-asamasinda'] as const;
export type Durum = (typeof DURUMLAR)[number];

/** Bant kutusuna sığması gereken kısa ad için üst sınır (taslakta en uzunu "Yıldız Takip", 12). */
export const KISA_AD_EN_FAZLA = 16;

/**
 * Bir projenin frontmatter'ı. Her proje iki dosyadır: `projeler/tr/<slug>.md` ve `projeler/en/<slug>.md`.
 * Dil klasörden gelir; çevrilmeyen alanlar (yil, tur, durum, sira, demo) iki dosyada aynı olmalı
 * (tests/icerik.test.ts denetler). Markdown gövdesi M6'daki proje detay sayfasının uzun metnidir.
 *
 * `.strict()`: şemada olmayan bir anahtar hata verir. Böylece `etiketlr:` gibi bir yazım hatası
 * "opsiyonel alan boş kalmış" diye sessizce geçmez.
 */
export const projeSemasi = z
  .object({
    /** Kart başlığı (27px): "Otonom Yıldız Takip Sistemi" */
    baslik: z.string().trim().min(1),
    /** Bant kutusu, arkadaki kartın şeridi ve özet satırı için kısa ad: "Yıldız Takip" */
    kisaAd: z.string().trim().min(1).max(KISA_AD_EN_FAZLA),
    /** Kartın alt satırı: "Gömülü Sistemler dersi final projesi" */
    altBaslik: z.string().trim().min(1),
    /** Karttaki kısa açıklama (kart sabit boyda, uzun metin detay sayfasına). */
    aciklama: z.string().trim().min(1).max(240),
    /** Takım projesinde Burak'ın payı: "sensör verilerinin hesaplanması". Kartta "Rolüm: …" diye çıkar. */
    rol: z.string().trim().min(1).optional(),
    /** Özet menüsündeki satırın kategorisi: "gömülü", "yapay zekâ", "IoT" */
    alan: z.string().trim().min(1),
    /** Tamamlanma (veya teslim) yılı. Sıralama ve iki dil arasındaki eşleşme için sayı. */
    yil: z.number().int().min(2020).max(2035),
    /** Yıl yerine gösterilecek metin: "Bahar 2027 teslim". İçinde `yil` geçmek zorunda (aşağıda). */
    zaman: z.string().trim().min(1).optional(),
    tur: z.enum(TURLER).optional(),
    durum: z.enum(DURUMLAR),
    /** Teknoloji hapları: "STM32F401RE", "PyQt6" … */
    etiketler: z.array(z.string().trim().min(1)).min(1).max(8),
    /** Canlı demo adresi. Yalnızca https: `javascript:` gibi adresler href'e hiç ulaşamaz. */
    demo: z.url({ protocol: /^https$/ }).optional(),
    /** Destedeki sıra (1 = en önde). */
    sira: z.number().int().min(1),
    /** Kaba çeviri mi? EN içerik M6'ya kadar `true` (kontrol.mjs sayfa düzeyinde uyarır). */
    taslak: z.boolean().default(false),
  })
  .strict()
  .refine((p) => p.zaman === undefined || p.zaman.includes(String(p.yil)), {
    message: '`zaman` metni `yil` değerini içermeli (ör. yil: 2027 → "Bahar 2027 teslim")',
    path: ['zaman'],
  });

/** Şemadan geçmiş (varsayılanları doldurulmuş) proje verisi. */
export type Proje = z.output<typeof projeSemasi>;

// ─── Ortak parçalar (JSON koleksiyonları) ──────────────────────────────────
// Stajlar, Yetkinlikler ve Belgeler dil başına TEK JSON dosyasıdır: src/content/<ad>/{tr,en}.json.
// Dosya = { taslak, <liste> }; listedeki SIRA destedeki sıradır. Her öğenin `id`'si iki dilde aynıdır
// (sayfa içi kimlik ve TR↔EN eşleşmesi için).

/** Sayfa içi kimlikte kullanılacak kısa ad: küçük harf, rakam, tire ("dogaka", "ozgecmis"). */
const kimlik = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id yalnızca küçük harf, rakam ve tire içermeli');

/** Ay hassasiyetinde tarih: "2026-09". Bu biçimde metin karşılaştırması tarih karşılaştırmasıdır. */
export const ayTarihi = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'tarih "YYYY-AA" biçiminde olmalı (ör. 2026-09)');

const metin = z.string().trim().min(1);

/** Listede aynı id iki kez geçmesin (kart kimlikleri sayfada benzersiz olmalı). */
const benzersizIdler = (liste: { id: string }[]) => new Set(liste.map((x) => x.id)).size === liste.length;

// ─── Stajlar ───────────────────────────────────────────────────────────────

/**
 * Bir staj. Bitiş yoksa staj devam ediyor demektir ("Eylül 2026 →" + "Devam ediyor" etiketi).
 * GİZLİLİK (CLAUDE.md §0.7): Kapsam stajında yalnızca "uzun dönem staj, gömülü sistemler ve mobil"
 * yazar. Açıklama bu yüzden opsiyonel; tests/stajlar.test.ts Kapsam kaydının tam içeriğini sabitler.
 */
export const stajSemasi = z
  .object({
    id: kimlik,
    /** Bant kutusu ve şerit: "Kapsam" */
    kisaAd: metin.max(KISA_AD_EN_FAZLA),
    /** Kart başlığı: "Kapsam Elektromekanik" */
    ad: metin,
    /** Şehir: alt satırın başı ve özet menüsündeki şehir grubu */
    sehir: metin,
    /** Alt satırda şehirden sonra: "uzun dönem staj", "Doğu Akdeniz Kalkınma Ajansı" */
    tanim: metin,
    baslangic: ayTarihi,
    bitis: ayTarihi.optional(),
    aciklama: metin.max(240).optional(),
    etiketler: z.array(metin).min(1).max(8),
  })
  .strict()
  .refine((s) => s.bitis === undefined || s.bitis >= s.baslangic, {
    message: 'bitis, baslangic’tan önce olamaz',
    path: ['bitis'],
  });

export const stajlarDosyasiSemasi = z
  .object({
    taslak: z.boolean().default(false),
    stajlar: z.array(stajSemasi).min(1).refine(benzersizIdler, 'staj id’leri benzersiz olmalı'),
  })
  .strict();

export type Staj = z.output<typeof stajSemasi>;
export type StajlarDosyasi = z.output<typeof stajlarDosyasiSemasi>;
