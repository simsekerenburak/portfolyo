// src/pcb/duzen.ts: içerikten PCB yerleşimi (CLAUDE.md §3.1, §10).
import { describe, expect, it } from 'vitest';
import { cakismalar, duzenKur, elemanlar, mulberry32, OLCU, sekilBoslugu, type DuzenGirdisi } from '../src/pcb/duzen';
import { nokta } from '../src/pcb/geometri';
import { noktaAl, yolKur } from '../src/pcb/yol';

/** Sitenin bugünkü içeriğiyle aynı sayılar: 4 proje, 3 staj, 5 alan, 4 belge (kimlikler M1'deki gibi). */
const SITE: DuzenGirdisi = {
  sapaklar: [
    { id: 'projeler', ogeler: ['yildiz-takip', 'simsek', 'meditrack', 'robot-kol'].map((s) => ({ id: `projeler-${s}`, kisaAd: s })) },
    { id: 'stajlar', ogeler: ['kapsam', 'dogaka', 'demircan'].map((s) => ({ id: `stajlar-${s}`, kisaAd: s })) },
    { id: 'yetkinlikler', ogeler: ['gomulu', 'yazilim', 'backend', 'mobil', 'yapay-zeka'].map((s) => ({ id: `yetkinlikler-${s}`, kisaAd: s })) },
    { id: 'belgeler', ogeler: ['ozgecmis', 'ai', 'huawei', 'udemy'].map((s) => ({ id: `belgeler-${s}`, kisaAd: s })) },
  ],
};

/** n öğeli sahte sapaklar: [3, 0, 12] → üç sapak */
const sahte = (sayilar: number[]): DuzenGirdisi => ({
  sapaklar: sayilar.map((n, k) => ({ id: `s${k}`, ogeler: Array.from({ length: n }, (_, i) => ({ id: `s${k}-o${i}`, kisaAd: `Öğe ${i}` })) })),
});

const GIRDILER: [string, DuzenGirdisi][] = [
  ['site', SITE],
  ['boş sapaklar', sahte([0, 0, 0, 0])],
  ['tek öğe', sahte([1, 1, 1, 1])],
  ['çok öğe', sahte([12, 9, 15, 7])],
  ['tek sapak', sahte([4])],
  ['altı sapak', sahte([2, 5, 1, 6, 3, 4])],
];

describe('duzenKur: sapaklar', () => {
  it('sıra ve yön: Projeler sol, Stajlar sağ, Yetkinlikler sol, Belgeler sağ (§3.1)', () => {
    const d = duzenKur(SITE);
    expect(d.sapaklar.map((s) => `${s.id}:${s.yon}`)).toEqual(['projeler:sol', 'stajlar:sag', 'yetkinlikler:sol', 'belgeler:sag']);
    // sol = +x (kamera +z'ye bakarken ekranın solu)
    expect(d.sapaklar.map((s) => s.isaret)).toEqual([1, -1, 1, -1]);
  });

  it('prototip ölçüleri: kavşaklar z = 26 / 44 / 62 / 80, Hakkımda z = 10', () => {
    const d = duzenKur(SITE);
    expect(d.sapaklar.map((s) => s.kavsak.z)).toEqual([26, 44, 62, 80]);
    expect(d.cipler.find((c) => c.id === 'hakkimda')?.merkez).toEqual(nokta(0, 10));
    expect(d.anaHat.sonZ).toBe(98);
  });

  it.each(GIRDILER)('%s: her öğenin bir çipi ve bağı var, sıra içerikle aynı', (_ad, g) => {
    const d = duzenKur(g);
    g.sapaklar.forEach((s, k) => {
      const ds = d.sapaklar[k]!;
      expect(ds.ogeler.map((o) => o.id)).toEqual(s.ogeler.map((o) => o.id));
      expect(ds.ogeler.map((o) => o.kisaAd)).toEqual(s.ogeler.map((o) => o.kisaAd));
      // sapak boyunca her 6 birimde bir, iki yana dönüşümlü
      ds.ogeler.forEach((o, i) => {
        expect(o.u).toBe(OLCU.ilkOge + OLCU.ogeAralik * i);
        expect(o.taraf).toBe(i % 2 === 0 ? 1 : -1);
      });
    });
    // her öğe çipi cipler listesinde
    const cipKimlikleri = new Set(d.cipler.map((c) => c.id));
    for (const s of g.sapaklar) for (const o of s.ogeler) expect(cipKimlikleri.has(`${o.id}-cip`)).toBe(true);
  });

  it('sapak öğe sayısıyla uzar (6 birim × öğe), en az 11', () => {
    const d = duzenKur(sahte([0, 1, 4, 10]));
    const duzBoy = (k: number) => Math.abs(d.sapaklar[k]!.noktalar[2].x - d.sapaklar[k]!.noktalar[1].x);
    expect(duzBoy(0)).toBe(11);
    expect(duzBoy(1)).toBe(11);
    expect(duzBoy(2)).toBe(OLCU.ilkOge + 6 * 3 + OLCU.sonPay);
    expect(duzBoy(3)).toBe(OLCU.ilkOge + 6 * 9 + OLCU.sonPay);
  });

  it('yinelenen kimlik → hata', () => {
    expect(() => duzenKur({ sapaklar: [{ id: 'a', ogeler: [{ id: 'x', kisaAd: 'x' }] }, { id: 'b', ogeler: [{ id: 'x', kisaAd: 'y' }] }] })).toThrow(/yinelenen/);
  });
});

describe('duzenKur: çakışma yok', () => {
  it.each(GIRDILER)('%s: kasıtlı değmeler dışında her parça arasında en az boşluk var', (_ad, g) => {
    expect(cakismalar(duzenKur(g))).toEqual([]);
  });

  it('kasıtlı değmeler gerçekten değiyor (liste uydurma değil)', () => {
    const d = duzenKur(SITE);
    const harita = new Map(elemanlar(d).map((e) => [e.id, e]));
    for (const [a, b] of d.temaslar) {
      const ea = harita.get(a);
      const eb = harita.get(b);
      expect(ea, a).toBeDefined();
      expect(eb, b).toBeDefined();
      expect(sekilBoslugu(ea!.sekil, eb!.sekil), `${a} ↔ ${b}`).toBeLessThanOrEqual(1e-9);
    }
  });

  it('yan yol, sapağın çıktığı tarafta kavşakta kesilir; öteki tarafta kesintisiz', () => {
    const d = duzenKur(SITE);
    // sol tarafta 2 sapak (Projeler, Yetkinlikler) → 3 parça; sağda 2 sapak → 3 parça
    expect(d.izler.filter((i) => i.id.startsWith('yan-sol-'))).toHaveLength(3);
    expect(d.izler.filter((i) => i.id.startsWith('yan-sag-'))).toHaveLength(3);
    const tek = duzenKur(sahte([3]));
    expect(tek.izler.filter((i) => i.id.startsWith('yan-sag-'))).toHaveLength(1);
  });

  it('parçalar büyürse kavşak aralığı açılır (18 yetmezse)', () => {
    // Bölüm çipi enine çok genişse aynı taraftaki sapaklar (36 birim arayla) çakışırdı
    const d = duzenKur(SITE, { bolumYariEn: 20 });
    expect(cakismalar(d)).toEqual([]);
    const aralar = d.sapaklar.slice(1).map((s, k) => s.kavsak.z - d.sapaklar[k]!.kavsak.z);
    expect(Math.max(...aralar)).toBeGreaterThan(18);
    expect(Math.min(...aralar)).toBeGreaterThanOrEqual(18);
    // normal ölçülerde aralık 18'de kalır
    const normal = duzenKur(SITE);
    expect(normal.sapaklar.slice(1).map((s, k) => s.kavsak.z - normal.sapaklar[k]!.kavsak.z)).toEqual([18, 18, 18]);
  });
});

describe('duzenKur: yalnızca 0° / 45° / 90° açılar', () => {
  it.each(GIRDILER)('%s: her bakır yolun doğrultusu 45°\'nin katı', (_ad, g) => {
    for (const iz of duzenKur(g).izler) {
      const aci = (Math.atan2(iz.b.z - iz.a.z, iz.b.x - iz.a.x) * 180) / Math.PI;
      const kalan = ((aci % 45) + 45) % 45;
      expect(Math.min(kalan, 45 - kalan), iz.id).toBeLessThan(1e-9);
    }
  });
});

describe('duzenKur: determinizm', () => {
  it('aynı girdi → aynı yerleşim (kopya girdiyle de)', () => {
    expect(duzenKur(structuredClone(SITE))).toEqual(duzenKur(SITE));
  });

  it('dağınık via\'lar her seferinde aynı yerde; yeterince var', () => {
    const a = duzenKur(SITE).vialar.filter((v) => v.id.startsWith('dag-'));
    const b = duzenKur(SITE).vialar.filter((v) => v.id.startsWith('dag-'));
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(OLCU.dagViaSayi * 0.8);
  });

  it('mulberry32: aynı tohum aynı dizi, [0, 1) aralığında', () => {
    const r1 = mulberry32(7);
    const r2 = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const x = r1();
      expect(x).toBe(r2());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('duzenKur: kamera yolları', () => {
  it('ana hat: kamera z = 0\'dan konnektöre 6 birim kalaya', () => {
    const d = duzenKur(SITE);
    const [bas, son] = d.anaHat.kameraNoktalari;
    expect(bas).toEqual(nokta(0, 0));
    const konnektor = d.cipler.find((c) => c.id === 'konnektor')!;
    expect(konnektor.merkez.z - konnektor.yariZ - son.z).toBeCloseTo(OLCU.kameraDurmaPayi, 12);
    // kavşağın ana hattaki s'i = kavşak z'si (kamera z = 0'dan başlar)
    expect(d.sapaklar.map((s) => s.anaS)).toEqual([26, 44, 62, 80]);
  });

  it.each(GIRDILER)('%s: sapak kamera yolu yol.ts ile kurulabiliyor; bölüm çipine 6 kala bitiyor', (_ad, g) => {
    const d = duzenKur(g);
    for (const s of d.sapaklar) {
      const yol = yolKur(s.kameraNoktalari, OLCU.kameraYaricap);
      const son = noktaAl(yol, yol.uzunluk);
      expect(son.tx).toBeCloseTo(s.isaret, 12); // ana hatta dik, sapak yönünde
      const yakinKenar = s.bolumCipi.merkez.x - s.isaret * s.bolumCipi.yariX;
      // öğe yokken düz kısım kısa: durma noktası en az 0,5 birim içeride
      expect(Math.abs(yakinKenar - son.x)).toBeGreaterThanOrEqual(Math.min(OLCU.kameraDurmaPayi, OLCU.duzEnAz - OLCU.gomulu - 0.5) - 1e-9);
      expect(Math.abs(yakinKenar - son.x)).toBeLessThanOrEqual(OLCU.kameraDurmaPayi + 1e-9);
    }
  });

  it('site: son öğe, durma noktasından görülecek kadar önde (≥ 3 birim)', () => {
    const d = duzenKur(SITE);
    for (const s of d.sapaklar) {
      const durma = s.kameraNoktalari[2];
      const sonOge = s.ogeler.at(-1)!;
      expect(s.isaret * (sonOge.cip.merkez.x - durma.x)).toBeGreaterThanOrEqual(3);
    }
  });
});
