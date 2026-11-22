// İçerik koleksiyonu denetimi: src/icerik/sema.ts (Zod şeması) ve src/content/projeler/{tr,en}/*.md.
//   1) Önce ölçüm aleti: şema hatalı veriyi gerçekten reddediyor mu?
//   2) Her dosya şemadan geçiyor mu?
//   3) TR ve EN aynı projeleri, aynı çevrilmeyen alanlarla taşıyor mu?
//   4) İçerik CLAUDE.md §7 ile uyuşuyor mu (4 proje: 3 tamamlanan, 1 yapım aşamasında)?
//
// Astro build de her dosyayı şemadan geçirir; bu test aynı hatayı build'den önce, hangi dosyada
// olduğunu söyleyerek yakalar ve build'in denetleyemediği kuralları (dil eşleşmesi) ekler.
// Frontmatter Astro'nun kullandığı aynı YAML ayrıştırıcısıyla (yaml@2) okunur (tests/yardimci/icerik.ts).
import { describe, expect, it } from 'vitest';
import { KISA_AD_EN_FAZLA, projeSemasi, type Proje } from '../src/icerik/sema';
import { hamProjeler, projeler } from './yardimci/icerik';

const DILLER = ['tr', 'en'] as const;
const HAM = { tr: hamProjeler('tr'), en: hamProjeler('en') };

// Şemaya uyan en küçük örnek; negatif testler bunu tek bir noktada bozar ("tek bozma → tek hata").
const ORNEK = {
  baslik: 'Örnek Proje',
  kisaAd: 'Örnek',
  altBaslik: 'Ders projesi',
  aciklama: 'Kısa açıklama.',
  alan: 'gömülü',
  yil: 2026,
  durum: 'tamamlandi',
  etiketler: ['C'],
  sira: 1,
};

// ─── 1) Ölçüm aleti ────────────────────────────────────────────────────────
describe('proje şeması (önce şemanın kendisini doğrula)', () => {
  it('geçerli örnek geçiyor; taslak verilmezse false', () => {
    const r = projeSemasi.parse(ORNEK);
    expect(r.taslak).toBe(false);
  });

  it.each([
    ['zorunlu alan eksik', { ...ORNEK, baslik: undefined }],
    ['boş başlık', { ...ORNEK, baslik: '   ' }],
    ['bilinmeyen anahtar (yazım hatası)', { ...ORNEK, durm: 'tamamlandi' }],
    ['geçersiz tür', { ...ORNEK, tur: 'grup' }],
    ['geçersiz durum', { ...ORNEK, durum: 'bitti' }],
    ['yıl metin', { ...ORNEK, yil: '2026' }],
    ['yıl kesirli', { ...ORNEK, yil: 2026.5 }],
    ['etiket yok', { ...ORNEK, etiketler: [] }],
    ['kısa ad bant kutusuna sığmıyor', { ...ORNEK, kisaAd: 'x'.repeat(KISA_AD_EN_FAZLA + 1) }],
    ['demo http (https değil)', { ...ORNEK, demo: 'http://ornek.dev' }],
    ['demo javascript: adresi', { ...ORNEK, demo: 'javascript:alert(1)' }],
    ['zaman metninde yıl yok', { ...ORNEK, yil: 2027, zaman: 'Bahar teslim' }],
    ['sıra sıfır', { ...ORNEK, sira: 0 }],
  ])('reddediyor: %s', (_, veri) => {
    expect(projeSemasi.safeParse(veri).success).toBe(false);
  });

  it.each([
    ['opsiyonel alanlar dolu', { ...ORNEK, tur: 'takim', rol: 'sensörler', demo: 'https://ornek.dev/' }],
    ['zaman metni yılı içeriyor', { ...ORNEK, yil: 2027, zaman: 'Bahar 2027 teslim' }],
  ])('kabul ediyor: %s', (_, veri) => {
    expect(projeSemasi.safeParse(veri).success).toBe(true);
  });
});

// ─── 2) Dosyalar ───────────────────────────────────────────────────────────
describe('proje dosyaları şemadan geçiyor', () => {
  it.each(DILLER)('%s klasöründe proje var', (dil) => {
    expect(HAM[dil].size).toBeGreaterThan(0);
  });

  for (const dil of DILLER) {
    for (const [slug, ham] of HAM[dil]) {
      it(`${dil}/${slug}.md`, () => {
        const r = projeSemasi.safeParse(ham);
        // Hata mesajı alan yolunu gösterir: "aciklama: Too big…"
        const mesaj = r.success ? '' : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
        expect(r.success, mesaj).toBe(true);
      });
    }
  }

  it('slug yalnızca küçük harf, rakam ve tire (adres olarak kullanılacak: /projeler/<slug>/)', () => {
    for (const dil of DILLER) {
      for (const slug of HAM[dil].keys()) expect(slug, `${dil}/${slug}`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('metinlerde düz kesme işareti yok (tipografik ’ kullanılır)', () => {
    for (const dil of DILLER) {
      for (const [slug, p] of projeler(dil)) {
        const metinler = [p.baslik, p.kisaAd, p.altBaslik, p.aciklama, p.rol, p.alan, p.zaman, ...p.etiketler];
        expect(metinler.filter((m) => m?.includes("'")), `${dil}/${slug}`).toEqual([]);
      }
    }
  });
});

// ─── 3) TR ↔ EN ───────────────────────────────────────────────────────────
describe('TR ve EN aynı projeleri taşıyor', () => {
  const tr = projeler('tr');
  const en = projeler('en');

  it('iki dilde aynı slug kümesi', () => {
    expect([...en.keys()].sort()).toEqual([...tr.keys()].sort());
  });

  it.each([...tr.keys()])('%s: çevrilmeyen alanlar aynı (yil, tur, durum, sira, demo, etiket sayısı)', (slug) => {
    const a = tr.get(slug)!;
    const b = en.get(slug);
    expect(b, `en/${slug}.md yok`).toBeDefined();
    const ortak = (p: Proje) => ({
      yil: p.yil,
      tur: p.tur,
      durum: p.durum,
      sira: p.sira,
      demo: p.demo,
      etiketSayisi: p.etiketler.length,
      rolVar: p.rol !== undefined,
      zamanVar: p.zaman !== undefined,
    });
    expect(ortak(b!)).toEqual(ortak(a));
  });

  it('TR asıl dil: hiçbir TR proje taslak değil', () => {
    expect([...tr.values()].filter((p) => p.taslak)).toEqual([]);
  });

  it.each(DILLER)('%s: sıra numaraları 1..n, tekrarsız', (dil) => {
    const siralar = [...projeler(dil).values()].map((p) => p.sira).sort((x, y) => x - y);
    expect(siralar).toEqual(siralar.map((_, i) => i + 1));
  });
});

// ─── 4) CLAUDE.md §7 ──────────────────────────────────────────────────────
describe('içerik CLAUDE.md §7 ile uyuşuyor', () => {
  const tr = [...projeler('tr').values()].sort((x, y) => x.sira - y.sira);

  it('4 proje, sırasıyla: Yıldız Takip, Şimşek, MediTrack, Robot Kol', () => {
    expect(tr.map((p) => p.kisaAd)).toEqual(['Yıldız Takip', 'Şimşek', 'MediTrack', 'Robot Kol']);
  });

  it('3 tamamlanan, 1 yapım aşamasında (Robot Kol)', () => {
    expect(tr.filter((p) => p.durum === 'tamamlandi')).toHaveLength(3);
    expect(tr.filter((p) => p.durum === 'yapim-asamasinda').map((p) => p.kisaAd)).toEqual(['Robot Kol']);
  });

  it('tür: Yıldız Takip takım, diğer üçü tek kişilik (Burak, 2026-11-22)', () => {
    expect(tr.map((p) => p.tur)).toEqual(['takim', 'tek-kisilik', 'tek-kisilik', 'tek-kisilik']);
  });
});
