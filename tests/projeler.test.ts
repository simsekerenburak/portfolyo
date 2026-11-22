// src/pafta/projeler.ts: projeler koleksiyonu → kartlar (PaftaOgesi) ve özet menüsü (Ozet).
// Gerçek içerik dosyalarıyla sınanır: beklenen değerler tasarım taslağındaki ("E · Premium: Projeler") metinler.
import { describe, expect, it } from 'vitest';
import type { Proje } from '../src/icerik/sema';
import { kimlikCoz, projeOgeleri, projeOgesi, projeOzeti, type ProjeKaydi } from '../src/pafta/projeler';
import { projeKayitlari } from './yardimci/icerik';

const TR = projeKayitlari('tr');
const EN = projeKayitlari('en');

describe('kimlikCoz: koleksiyon kimliği → dil + slug', () => {
  it('tr/yildiz-takip ve en/robot-kol', () => {
    expect(kimlikCoz('tr/yildiz-takip')).toEqual({ dil: 'tr', slug: 'yildiz-takip' });
    expect(kimlikCoz('en/robot-kol')).toEqual({ dil: 'en', slug: 'robot-kol' });
  });

  it.each(['yildiz-takip', 'fr/yildiz-takip', 'tr/', 'tr/alt/yildiz', 'tr/Yildiz', 'tr/-yildiz'])(
    'beklenmeyen kimlik build’i durdurur: %s',
    (id) => {
      expect(() => kimlikCoz(id)).toThrow(/Beklenmeyen proje kimliği/);
    },
  );
});

describe('kartlar (TR)', () => {
  const ogeler = projeOgeleri(TR, 'tr');

  it('sıra: Yıldız Takip, Şimşek, MediTrack, Robot Kol', () => {
    expect(ogeler.map((o) => o.kisaAd)).toEqual(['Yıldız Takip', 'Şimşek', 'MediTrack', 'Robot Kol']);
  });

  it('girdi sırası önemli değil (sira alanına göre dizilir)', () => {
    expect(projeOgeleri([...TR].reverse(), 'tr')).toEqual(ogeler);
  });

  it('üst satırlar taslaktaki gibi', () => {
    expect(ogeler.map((o) => o.ustSatir)).toEqual([
      '2026 · takım projesi',
      '2026 · tek kişilik',
      '2026',
      'Bahar 2027 teslim',
    ]);
  });

  it('etiket hapı yalnızca yapım aşamasındaki projede', () => {
    expect(ogeler.map((o) => o.etiket)).toEqual([undefined, undefined, undefined, 'Yapım aşamasında']);
  });

  it('takım projesinde rol açıklamanın sonuna eklenir', () => {
    expect(ogeler[0]!.aciklama).toMatch(/kilitlenir\. Rolüm: sensör verilerinin hesaplanması\.$/);
    expect(ogeler[1]!.aciklama).not.toContain('Rolüm');
  });

  it('id’ler benzersiz ve "projeler-" önekli (bant kutuları #id ile bağlanır)', () => {
    const idler = ogeler.map((o) => o.id);
    expect(new Set(idler).size).toBe(idler.length);
    expect(idler).toEqual(['projeler-yildiz-takip', 'projeler-simsek', 'projeler-meditrack', 'projeler-robot-kol']);
  });

  it('demo yoksa bağlantı yok; varsa yalnızca https adresiyle', () => {
    expect(ogeler.every((o) => o.baglantilar === undefined)).toBe(true);
    const demolu: ProjeKaydi = { ...TR[0]!, veri: { ...TR[0]!.veri, demo: 'https://ornek.dev/' } };
    expect(projeOgesi(demolu, 'tr').baglantilar).toEqual([{ metin: 'Canlı demo', adres: 'https://ornek.dev/' }]);
  });
});

describe('kartlar (EN)', () => {
  it('aynı sıra ve aynı id’ler (TR ile eşleşir), metinler İngilizce', () => {
    const tr = projeOgeleri(TR, 'tr');
    const en = projeOgeleri(EN, 'en');
    expect(en.map((o) => o.id)).toEqual(tr.map((o) => o.id));
    expect(en.map((o) => o.ustSatir)).toEqual(['2026 · team project', '2026 · solo', '2026', 'Due spring 2027']);
    expect(en[3]!.etiket).toBe('In progress');
    expect(en[0]!.aciklama).toMatch(/My role: computing the sensor data\.$/);
  });
});

describe('özet menüsü', () => {
  it('TR: 4 proje → 3 tamamlanan / 1 yapım aşamasında, satırlar taslaktaki gibi', () => {
    expect(projeOzeti(TR, 'tr')).toEqual({
      sayi: 4,
      etiket: 'proje',
      gruplar: [
        {
          sayi: 3,
          etiket: 'tamamlanan',
          satirlar: [
            { baslik: 'Yıldız Takip', aciklama: 'gömülü · takım' },
            { baslik: 'Şimşek', aciklama: 'yapay zekâ · tek kişilik' },
            { baslik: 'MediTrack', aciklama: 'IoT' },
          ],
        },
        {
          sayi: 1,
          etiket: 'yapım aşamasında',
          satirlar: [{ baslik: 'Robot Kol', aciklama: 'robotik · Bahar 2027 teslim' }],
        },
      ],
    });
  });

  it('EN: 4 projects → 3 completed / 1 in progress', () => {
    const o = projeOzeti(EN, 'en');
    expect([o.sayi, o.etiket]).toEqual([4, 'projects']);
    expect(o.gruplar.map((g) => [g.sayi, g.etiket])).toEqual([
      [3, 'completed'],
      [1, 'in progress'],
    ]);
  });

  it('sayılar veriden: grup toplamı ana sayıya eşit', () => {
    for (const [kayitlar, dil] of [[TR, 'tr'], [EN, 'en']] as const) {
      const o = projeOzeti(kayitlar, dil);
      expect(o.gruplar.reduce((t, g) => t + g.sayi, 0)).toBe(o.sayi);
      for (const g of o.gruplar) expect(g.satirlar).toHaveLength(g.sayi);
    }
  });

  it('boş grup gösterilmez; tek proje tekil yazılır ("1 project")', () => {
    const tek: ProjeKaydi[] = [TR[1]!]; // Şimşek, tamamlandı
    const o = projeOzeti(tek, 'en');
    expect(o.etiket).toBe('project');
    expect(o.gruplar.map((g) => g.etiket)).toEqual(['completed']);
  });

  it('yapım aşamasındaki projede zaman metni yoksa yıl yazılır', () => {
    const veri: Proje = { ...TR[3]!.veri };
    delete veri.zaman;
    const o = projeOzeti([{ slug: 'robot-kol', veri }], 'tr');
    expect(o.gruplar[0]!.satirlar[0]!.aciklama).toBe('robotik · 2027');
  });
});
