// src/pcb/veri.ts: 3D katmanının JSON adası (CLAUDE.md §3.3).
import { describe, expect, it } from 'vitest';
import type { Ozet, PaftaOgesi } from '../src/pafta/tipler';
import { adaMetni, pcbVerisiKur, pcbVerisiOku } from '../src/pcb/veri';

const oge = (id: string, kisaAd: string): PaftaOgesi => ({ id, kisaAd, ustSatir: '2026', baslik: kisaAd, altSatir: '', haplar: ['C'] });
const ozet = (sayi: number, etiket: string): Ozet => ({ sayi, etiket, gruplar: [] });

const ORNEK = pcbVerisiKur([
  { id: 'projeler', ad: 'Projeler', ogeler: [oge('projeler-simsek', 'Şimşek'), oge('projeler-meditrack', 'MediTrack')], ozet: ozet(2, 'proje') },
  { id: 'stajlar', ad: 'Stajlar', ogeler: [oge('stajlar-dogaka', 'DOĞAKA')], ozet: ozet(1, 'staj') },
]);

describe('pcbVerisiKur', () => {
  it('yalnızca kısa veri: kimlik, kısa ad, tabela sayısı (kart metni kopyalanmaz)', () => {
    expect(ORNEK).toEqual({
      surum: 1,
      sapaklar: [
        { id: 'projeler', ad: 'Projeler', sayi: 2, birim: 'proje', ogeler: [{ id: 'projeler-simsek', kisaAd: 'Şimşek' }, { id: 'projeler-meditrack', kisaAd: 'MediTrack' }] },
        { id: 'stajlar', ad: 'Stajlar', sayi: 1, birim: 'staj', ogeler: [{ id: 'stajlar-dogaka', kisaAd: 'DOĞAKA' }] },
      ],
    });
  });
});

describe('adaMetni / pcbVerisiOku', () => {
  it('gidiş-dönüş aynı veriyi verir', () => {
    expect(pcbVerisiOku(adaMetni(ORNEK))).toEqual(ORNEK);
  });

  it('"</script>" içeren metin etiketi kapatamaz', () => {
    const tehlikeli = pcbVerisiKur([{ id: 'a', ad: '</script><b>', ogeler: [], ozet: ozet(0, 'x') }]);
    const metin = adaMetni(tehlikeli);
    expect(metin).not.toContain('<');
    expect(pcbVerisiOku(metin)?.sapaklar[0]?.ad).toBe('</script><b>');
  });

  it.each([
    ['boş', ''],
    ['null', null],
    ['bozuk JSON', '{"surum":1,'],
    ['yanlış sürüm', JSON.stringify({ ...ORNEK, surum: 2 })],
    ['sapaklar dizi değil', '{"surum":1,"sapaklar":{}}'],
    ['sayı eksik', JSON.stringify({ surum: 1, sapaklar: [{ id: 'a', ad: 'A', birim: 'b', ogeler: [] }] })],
    ['öğe kimliği boş', JSON.stringify({ surum: 1, sapaklar: [{ id: 'a', ad: 'A', sayi: 1, birim: 'b', ogeler: [{ id: '', kisaAd: 'x' }] }] })],
    ['dizi kökü', '[]'],
  ])('bozuk ada (%s) → null, hata fırlatmaz', (_ad, metin) => {
    expect(pcbVerisiOku(metin)).toBeNull();
  });
});
