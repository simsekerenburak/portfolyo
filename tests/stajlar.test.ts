// Stajlar: şema (src/icerik/sema.ts), içerik (src/content/stajlar/{tr,en}.json), dönüşüm (src/pafta/stajlar.ts)
// ve Kapsam gizlilik kuralı (CLAUDE.md §0.7).
import { describe, expect, it } from 'vitest';
import { stajSemasi, stajlarDosyasiSemasi, type Staj } from '../src/icerik/sema';
import { stajOgeleri, stajOzeti } from '../src/pafta/stajlar';
import { jsonIcerik } from './yardimci/icerik';

const DILLER = ['tr', 'en'] as const;
const ham = { tr: jsonIcerik('stajlar', 'tr'), en: jsonIcerik('stajlar', 'en') };
const dosya = (dil: (typeof DILLER)[number]) => stajlarDosyasiSemasi.parse(ham[dil]);

const ORNEK = {
  id: 'ornek',
  kisaAd: 'Örnek',
  ad: 'Örnek A.Ş.',
  sehir: 'Sivas',
  tanim: 'yaz stajı',
  baslangic: '2026-07',
  bitis: '2026-08',
  etiketler: ['C'],
};

// ─── 1) Şema ───────────────────────────────────────────────────────────────
describe('staj şeması', () => {
  it('geçerli örnek geçiyor; bitişsiz (devam eden) de geçiyor', () => {
    expect(stajSemasi.safeParse(ORNEK).success).toBe(true);
    const { bitis: _, ...devam } = ORNEK;
    expect(stajSemasi.safeParse(devam).success).toBe(true);
  });

  it.each([
    ['id büyük harf', { ...ORNEK, id: 'Ornek' }],
    ['bilinmeyen anahtar', { ...ORNEK, sehr: 'Sivas' }],
    ['tarih biçimi', { ...ORNEK, baslangic: '2026-7' }],
    ['ay 13', { ...ORNEK, bitis: '2026-13' }],
    ['bitiş başlangıçtan önce', { ...ORNEK, baslangic: '2026-09', bitis: '2026-08' }],
    ['etiket yok', { ...ORNEK, etiketler: [] }],
    ['boş şehir', { ...ORNEK, sehir: ' ' }],
  ])('reddediyor: %s', (_, veri) => {
    expect(stajSemasi.safeParse(veri).success).toBe(false);
  });

  it('dosya: aynı id iki kez → hata; bilinmeyen üst anahtar → hata', () => {
    expect(stajlarDosyasiSemasi.safeParse({ stajlar: [ORNEK, ORNEK] }).success).toBe(false);
    expect(stajlarDosyasiSemasi.safeParse({ stajlar: [ORNEK], taslk: true }).success).toBe(false);
    expect(stajlarDosyasiSemasi.parse({ stajlar: [ORNEK] }).taslak).toBe(false);
  });
});

// ─── 2) İçerik ─────────────────────────────────────────────────────────────
describe('stajlar içeriği', () => {
  it.each(DILLER)('%s.json şemadan geçiyor', (dil) => {
    const r = stajlarDosyasiSemasi.safeParse(ham[dil]);
    const mesaj = r.success ? '' : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    expect(r.success, mesaj).toBe(true);
  });

  it('CLAUDE.md §7: Kapsam, DOĞAKA, Demircan (yeniden eskiye)', () => {
    const s = dosya('tr').stajlar;
    expect(s.map((x) => x.id)).toEqual(['kapsam', 'dogaka', 'demircan']);
    const baslangiclar = s.map((x) => x.baslangic);
    expect(baslangiclar).toEqual([...baslangiclar].sort().reverse());
  });

  it('TR ve EN aynı stajlar: id, şehir, tarihler, açıklama/etiket varlığı aynı', () => {
    const ortak = (s: Staj) => ({
      id: s.id,
      sehir: s.sehir,
      baslangic: s.baslangic,
      bitis: s.bitis,
      aciklamaVar: s.aciklama !== undefined,
      etiketSayisi: s.etiketler.length,
    });
    expect(dosya('en').stajlar.map(ortak)).toEqual(dosya('tr').stajlar.map(ortak));
  });

  it('TR asıl dil: taslak değil', () => {
    expect(dosya('tr').taslak).toBe(false);
  });

  it('metinlerde düz kesme işareti yok', () => {
    for (const dil of DILLER) expect(JSON.stringify(ham[dil]), dil).not.toContain("'");
  });
});

// ─── 3) Gizlilik: Kapsam ───────────────────────────────────────────────────
// Sitede Kapsam için yalnızca "uzun dönem staj, gömülü sistemler ve mobil" yazar. Kayda alan eklenirse
// (açıklama, başka etiket) bu test kırılır: bilinçli bir karar olmadan detay sızmasın.
describe('gizlilik: Kapsam kaydı tam olarak bu kadar', () => {
  it.each([
    ['tr', 'uzun dönem staj', ['Gömülü sistemler', 'Mobil']],
    ['en', 'long-term internship', ['Embedded systems', 'Mobile']],
  ] as const)('%s', (dil, tanim, etiketler) => {
    const kapsam = (ham[dil] as { stajlar: Record<string, unknown>[] }).stajlar.find((s) => s.id === 'kapsam');
    expect(kapsam).toEqual({
      id: 'kapsam',
      kisaAd: 'Kapsam',
      ad: 'Kapsam Elektromekanik',
      sehir: 'Sivas',
      tanim,
      baslangic: '2026-09',
      etiketler,
    });
  });

  it('Kapsam kartında açıklama yok', () => {
    const kart = stajOgeleri(dosya('tr').stajlar, 'tr').find((o) => o.id === 'stajlar-kapsam');
    expect(kart?.aciklama).toBeUndefined();
  });
});

// ─── 4) Kartlar ve özet ────────────────────────────────────────────────────
describe('stajlar → kartlar', () => {
  const tr = stajOgeleri(dosya('tr').stajlar, 'tr');

  it('üst satırlar ve etiket taslaktaki gibi', () => {
    expect(tr.map((o) => o.ustSatir)).toEqual(['Eylül 2026 →', 'Ağu – Eyl 2026', 'Tem – Ağu 2026']);
    expect(tr.map((o) => o.etiket)).toEqual(['Devam ediyor', undefined, undefined]);
  });

  it('alt satır: şehir · tanım', () => {
    expect(tr.map((o) => o.altSatir)).toEqual([
      'Sivas · uzun dönem staj',
      'Antakya · Doğu Akdeniz Kalkınma Ajansı',
      'Antakya · elektrik taahhüt',
    ]);
  });

  it('id’ler "stajlar-" önekli ve benzersiz', () => {
    expect(tr.map((o) => o.id)).toEqual(['stajlar-kapsam', 'stajlar-dogaka', 'stajlar-demircan']);
  });

  it('EN üst satırları', () => {
    expect(stajOgeleri(dosya('en').stajlar, 'en').map((o) => o.ustSatir)).toEqual([
      'September 2026 →',
      'Aug – Sep 2026',
      'Jul – Aug 2026',
    ]);
  });
});

describe('stajlar → özet menüsü', () => {
  it('TR: 3 staj → 2 şehir (Sivas, Antakya) / 1 devam eden', () => {
    expect(stajOzeti(dosya('tr').stajlar, 'tr')).toEqual({
      sayi: 3,
      etiket: 'staj',
      gruplar: [
        {
          sayi: 2,
          etiket: 'şehir',
          satirlar: [
            { baslik: 'Sivas', aciklama: 'Kapsam Elektromekanik' },
            { baslik: 'Antakya', aciklama: 'DOĞAKA, Demircan İnşaat Elektrik' },
          ],
        },
        {
          sayi: 1,
          etiket: 'devam eden',
          satirlar: [{ baslik: 'Kapsam Elektromekanik', aciklama: 'Eylül 2026 → · uzun dönem staj' }],
        },
      ],
    });
  });

  it('EN: 3 internships → 2 cities / 1 ongoing', () => {
    const o = stajOzeti(dosya('en').stajlar, 'en');
    expect([o.sayi, o.etiket]).toEqual([3, 'internships']);
    expect(o.gruplar.map((g) => [g.sayi, g.etiket])).toEqual([
      [2, 'cities'],
      [1, 'ongoing'],
    ]);
  });

  it('devam eden staj yoksa o grup gösterilmez; tek şehir tekil ("1 city")', () => {
    const bitmis = dosya('en').stajlar.filter((s) => s.bitis !== undefined);
    const o = stajOzeti(bitmis, 'en');
    expect(o.gruplar.map((g) => `${g.sayi} ${g.etiket}`)).toEqual(['1 city']);
  });
});
