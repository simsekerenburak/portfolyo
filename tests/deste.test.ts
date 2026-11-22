// src/pafta/deste.ts: kart destesinin döngüsel durum mantığı (CLAUDE.md §3.2).
import { describe, expect, it } from 'vitest';
import { dongu, konumAdi, onceki, sonraki, type Konum } from '../src/pafta/deste';

/** Öndeki kart `on` iken bütün kartların konumları. */
const konumlar = (on: number, n: number): Konum[] => Array.from({ length: n }, (_, k) => konumAdi(k, on, n));

describe('dongu: i mod n, her zaman 0..n−1', () => {
  it.each([
    [0, 4, 0],
    [3, 4, 3],
    [4, 4, 0],
    [5, 4, 1],
    [-1, 4, 3], // JS'de −1 % 4 = −1; düzeltilmiş hâli 3
    [-5, 4, 3],
    [7, 1, 0],
  ])('dongu(%i, %i) = %i', (i, n, beklenen) => {
    expect(dongu(i, n)).toBe(beklenen);
  });

  it.each([0, -1, 2.5, Number.NaN])('geçersiz kart sayısı (n = %s) hata verir', (n) => {
    expect(() => dongu(0, n)).toThrow(RangeError);
  });
});

describe('sonraki / önceki', () => {
  it('uçlarda başa / sona sarar', () => {
    expect(sonraki(3, 4)).toBe(0);
    expect(onceki(0, 4)).toBe(3);
  });

  it('önceki, sonrakinin tersi (her durumda)', () => {
    for (let n = 1; n <= 6; n++) {
      for (let on = 0; on < n; on++) {
        expect(onceki(sonraki(on, n), n)).toBe(on);
        expect(sonraki(onceki(on, n), n)).toBe(on);
      }
    }
  });

  it('n kez sonraki → başa döner (deste tam tur atar)', () => {
    let on = 2;
    for (let i = 0; i < 5; i++) on = sonraki(on, 5);
    expect(on).toBe(2);
  });
});

describe('konumAdi: hangi kart nerede', () => {
  it('başlangıç (4 kart): ilk kart önde, sonraki ikisi arkada görünür, dördüncü gizli', () => {
    expect(konumlar(0, 4)).toEqual(['on', 'orta', 'arka', 'gizli']);
  });

  it('→ sonrası: öndeki kart destenin en arkasına (gizli) gider, ortadaki öne gelir', () => {
    expect(konumlar(sonraki(0, 4), 4)).toEqual(['gizli', 'on', 'orta', 'arka']);
  });

  it('← sonrası: en arkadaki kart öne gelir', () => {
    expect(konumlar(onceki(0, 4), 4)).toEqual(['orta', 'arka', 'gizli', 'on']);
  });

  it('her durumda tam bir kart önde ve en fazla 3 kart görünür', () => {
    for (let n = 1; n <= 7; n++) {
      for (let on = 0; on < n; on++) {
        const k = konumlar(on, n);
        expect(k.filter((x) => x === 'on'), `n=${n} on=${on}`).toHaveLength(1);
        expect(k[on]).toBe('on');
        expect(k.filter((x) => x !== 'gizli').length).toBe(Math.min(n, 3));
      }
    }
  });

  it('az kartlı deste: 1 kart yalnızca önde, 2 kartta gizli yok', () => {
    expect(konumlar(0, 1)).toEqual(['on']);
    expect(konumlar(1, 2)).toEqual(['orta', 'on']);
  });
});
