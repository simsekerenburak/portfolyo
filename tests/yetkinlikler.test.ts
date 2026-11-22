// Yetkinlikler: şema, içerik (src/content/yetkinlikler/{tr,en}.json), referans bütünlüğü (kullanım →
// projeler/stajlar) ve dönüşüm (src/pafta/yetkinlikler.ts).
import { describe, expect, it } from 'vitest';
import { stajlarDosyasiSemasi, yetkinlikSemasi, yetkinliklerDosyasiSemasi, type Yetkinlik } from '../src/icerik/sema';
import { kullanimAdi, yetkinlikOgeleri, yetkinlikOzeti, type Kaynaklar } from '../src/pafta/yetkinlikler';
import { jsonIcerik, projeKayitlari } from './yardimci/icerik';

const DILLER = ['tr', 'en'] as const;
type D = (typeof DILLER)[number];
const ham = { tr: jsonIcerik('yetkinlikler', 'tr'), en: jsonIcerik('yetkinlikler', 'en') };
const alanlar = (dil: D) => yetkinliklerDosyasiSemasi.parse(ham[dil]).alanlar;
const kaynak = (dil: D): Kaynaklar => ({
  projeler: projeKayitlari(dil),
  stajlar: stajlarDosyasiSemasi.parse(jsonIcerik('stajlar', dil)).stajlar,
});

const ORNEK = {
  id: 'ornek',
  kisaAd: 'Örnek',
  ad: 'Örnek alan',
  altBaslik: 'alt',
  aciklama: 'açıklama',
  kullanim: ['proje:yildiz-takip'],
  araclar: ['C'],
};

describe('yetkinlik şeması', () => {
  it('geçerli örnek geçiyor', () => {
    expect(yetkinlikSemasi.safeParse(ORNEK).success).toBe(true);
    expect(yetkinlikSemasi.safeParse({ ...ORNEK, kullanim: ['staj:kapsam', 'egitim'] }).success).toBe(true);
  });

  it.each([
    ['kullanım öneki yanlış', { ...ORNEK, kullanim: ['proj:yildiz-takip'] }],
    ['kullanım slug’ı büyük harf', { ...ORNEK, kullanim: ['proje:Yildiz'] }],
    ['egitim’e ek', { ...ORNEK, kullanim: ['egitim:huawei'] }],
    ['aynı kullanım iki kez', { ...ORNEK, kullanim: ['egitim', 'egitim'] }],
    ['kullanım yok', { ...ORNEK, kullanim: [] }],
    ['aynı araç iki kez', { ...ORNEK, araclar: ['C', 'C'] }],
    ['araç yok', { ...ORNEK, araclar: [] }],
    ['yüzdelik alan (CLAUDE.md: çubuk yok)', { ...ORNEK, yuzde: 80 }],
  ])('reddediyor: %s', (_, veri) => {
    expect(yetkinlikSemasi.safeParse(veri).success).toBe(false);
  });
});

describe('yetkinlikler içeriği', () => {
  it.each(DILLER)('%s.json şemadan geçiyor', (dil) => {
    const r = yetkinliklerDosyasiSemasi.safeParse(ham[dil]);
    const mesaj = r.success ? '' : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    expect(r.success, mesaj).toBe(true);
  });

  it('CLAUDE.md §7: 5 alan, 21 araç, hiçbir araç iki alanda tekrar etmiyor', () => {
    for (const dil of DILLER) {
      const a = alanlar(dil);
      expect(a.map((x) => x.id)).toEqual(['gomulu', 'yazilim', 'backend', 'mobil', 'yapay-zeka']);
      const araclar = a.flatMap((x) => x.araclar);
      expect(araclar, dil).toHaveLength(21);
      expect(new Set(araclar).size, dil).toBe(21);
    }
  });

  it('TR ve EN: aynı id’ler, aynı kullanım referansları, alan başına aynı araç sayısı', () => {
    const ortak = (a: Yetkinlik) => ({ id: a.id, kullanim: a.kullanim, aracSayisi: a.araclar.length });
    expect(alanlar('en').map(ortak)).toEqual(alanlar('tr').map(ortak));
  });

  it('TR asıl dil: taslak değil; düz kesme işareti yok', () => {
    expect(yetkinliklerDosyasiSemasi.parse(ham.tr).taslak).toBe(false);
    for (const dil of DILLER) expect(JSON.stringify(ham[dil]), dil).not.toContain("'");
  });
});

describe('referans bütünlüğü: her kullanım gerçek bir kayda gidiyor', () => {
  for (const dil of DILLER) {
    it(dil, () => {
      const k = kaynak(dil);
      const kirik = alanlar(dil)
        .flatMap((a) => a.kullanim)
        .filter((r) => {
          try {
            kullanimAdi(r, k, dil);
            return false;
          } catch {
            return true;
          }
        });
      expect(kirik).toEqual([]);
    });
  }

  it('kırık referans hata fırlatır (build durur)', () => {
    expect(() => kullanimAdi('proje:olmayan', kaynak('tr'), 'tr')).toThrow(/hiçbir kayda karşılık gelmiyor/);
    expect(() => kullanimAdi('staj:olmayan', kaynak('tr'), 'tr')).toThrow();
    const kirikAlan = { ...alanlar('tr')[0]!, kullanim: ['proje:olmayan'] };
    expect(() => yetkinlikOzeti([kirikAlan], kaynak('tr'), 'tr')).toThrow();
  });
});

describe('yetkinlikler → kartlar ve özet', () => {
  it('üst satırlar taslaktaki gibi (adlar referanslardan)', () => {
    expect(yetkinlikOgeleri(alanlar('tr'), kaynak('tr'), 'tr').map((o) => o.ustSatir)).toEqual([
      'Yıldız Takip · MediTrack',
      'Demircan · Yıldız Takip',
      'MediTrack · Şimşek',
      'Şimşek · Kapsam',
      'Şimşek · eğitimler',
    ]);
  });

  it('EN üst satırları İngilizce proje adlarıyla', () => {
    expect(yetkinlikOgeleri(alanlar('en'), kaynak('en'), 'en').map((o) => o.ustSatir)[0]).toBe('Star Tracker · MediTrack');
    expect(yetkinlikOgeleri(alanlar('en'), kaynak('en'), 'en').map((o) => o.ustSatir)[4]).toBe('Şimşek · training');
  });

  it('TR özet: 5 alan → 21 araç / 3 proje', () => {
    const o = yetkinlikOzeti(alanlar('tr'), kaynak('tr'), 'tr');
    expect([o.sayi, o.etiket]).toEqual([5, 'alan']);
    expect(o.gruplar.map((g) => `${g.sayi} ${g.etiket}`)).toEqual(['21 araç', '3 proje']);
    expect(o.gruplar[0]!.satirlar[0]).toEqual({ baslik: 'Gömülü sistemler', aciklama: 'STM32, ESP32, Arduino, C, I2C, UART' });
    expect(o.gruplar[1]!.satirlar).toEqual([
      { baslik: 'Yıldız Takip', aciklama: 'Gömülü, Yazılım' },
      { baslik: 'Şimşek', aciklama: 'Backend, Mobil, Yapay zekâ' },
      { baslik: 'MediTrack', aciklama: 'Gömülü, Backend' },
    ]);
  });

  it('EN özet: 5 areas → 21 tools / 3 projects', () => {
    const o = yetkinlikOzeti(alanlar('en'), kaynak('en'), 'en');
    expect(`${o.sayi} ${o.etiket}`).toBe('5 areas');
    expect(o.gruplar.map((g) => `${g.sayi} ${g.etiket}`)).toEqual(['21 tools', '3 projects']);
  });
});
