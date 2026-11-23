// tokens.css renk denetimi:
//   1) ölçüm aletinin (renk matematiği) doğruluğu,
//   2) "mavi ve soğuk gri yok" kuralı (CLAUDE.md §4.2),
//   3) metin/yüzey çiftlerinde WCAG kontrastı (kullanım tablosuna göre, iki temada).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  SIMGE_ESIGI,
  kompozit,
  kontrast,
  kontrastEsigi,
  renkCoz,
  sogukRenkSebebi,
  tonVeKroma,
  type RGB,
  type RGBA,
} from './yardimci/renk';
import { TEMALAR, renkLiteralleri, tokenlariOku, type Tema } from './yardimci/tokenlar';
import { RENK_3D } from '../src/pcb/renkler';

// Dosya diskten okunur. (`?raw` içe aktarma KULLANMA: Vitest CSS dosyalarını varsayılan olarak
// boş metne çevirir, testler boş dosyayı ölçüp yanıltıcı sonuç verir.)
const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const rgb = (r: RGBA): RGB => [r[0], r[1], r[2]];
const tokenlar = tokenlariOku(css);

function tokenRengi(ad: string, tema: Tema): RGBA {
  const t = tokenlar.get(ad);
  if (!t) throw new Error(`tokens.css içinde ${ad} tanımlı değil`);
  return renkCoz(t[tema]);
}

function opakRenk(ad: string, tema: Tema): RGB {
  const r = tokenRengi(ad, tema);
  if (r[3] !== 1) throw new Error(`${ad} (${tema}) opak olmalı, alfa = ${r[3]}`);
  return rgb(r);
}

// ─── 1) Ölçüm aleti ────────────────────────────────────────────────────────
describe('renk matematiği (önce ölçüm aletini doğrula)', () => {
  it('siyah/beyaz 21:1, aynı renk 1:1', () => {
    expect(kontrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 6);
    expect(kontrast([24, 80, 60], [24, 80, 60])).toBeCloseTo(1, 6);
  });

  it('bilinen değer: #767676 beyaz üstünde 4.54:1 (AA sınırını geçen en açık gri)', () => {
    expect(kontrast(rgb(renkCoz('#767676')), [255, 255, 255])).toBeCloseTo(4.54, 2);
  });

  it('kontrast simetrik: sıra önemli değil', () => {
    const a = rgb(renkCoz('#FF8A3D'));
    const b = rgb(renkCoz('#18503C'));
    expect(kontrast(a, b)).toBe(kontrast(b, a));
  });

  it('kompozit: %50 beyaz siyah üstünde orta gri olur', () => {
    expect(kompozit([255, 255, 255, 0.5], [0, 0, 0])).toEqual([127.5, 127.5, 127.5]);
    expect(kompozit([10, 20, 30, 1], [200, 200, 200])).toEqual([10, 20, 30]);
    expect(kompozit([10, 20, 30, 0], [200, 200, 200])).toEqual([200, 200, 200]);
  });

  it('ton: kırmızı 0°, yeşil 120°, mavi 240°; gri kroma 0', () => {
    expect(tonVeKroma([255, 0, 0]).ton).toBe(0);
    expect(tonVeKroma([0, 255, 0]).ton).toBe(120);
    expect(tonVeKroma([0, 0, 255]).ton).toBe(240);
    expect(tonVeKroma([128, 128, 128]).kroma).toBe(0);
  });

  it('renk ayrıştırma: #RGB, #RRGGBB, #RRGGBBAA, rgb(), rgba()', () => {
    expect(renkCoz('#abc')).toEqual([170, 187, 204, 1]);
    expect(renkCoz('#FF7A1A')).toEqual([255, 122, 26, 1]);
    expect(renkCoz('#FF000080')[3]).toBeCloseTo(128 / 255, 6);
    expect(renkCoz('rgb(1, 2, 3)')).toEqual([1, 2, 3, 1]);
    expect(renkCoz('rgba(243, 235, 221, 0.08)')).toEqual([243, 235, 221, 0.08]);
    expect(() => renkCoz('blue')).toThrow();
  });

  it('eşik: 24px+ veya 18.66px+kalın → 3:1, diğerleri 4.5:1', () => {
    expect(kontrastEsigi(24, 400)).toBe(3);
    expect(kontrastEsigi(56, 600)).toBe(3);
    expect(kontrastEsigi(18.66, 700)).toBe(3);
    expect(kontrastEsigi(18.66, 600)).toBe(4.5); // 600 WCAG'ye göre "kalın" değil
    expect(kontrastEsigi(23.9, 500)).toBe(4.5);
    expect(kontrastEsigi(12, 400)).toBe(4.5);
  });

  it('token okuyucu: light-dark() içindeki rgba() virgülleri bölmeyi bozmaz', () => {
    const t = tokenlariOku(':root{ --x: light-dark(rgba(1, 2, 3, 0.5), #FFFFFF); --y: #000; }');
    expect(t.get('--x')).toEqual({ acik: 'rgba(1, 2, 3, 0.5)', koyu: '#FFFFFF' });
    expect(t.get('--y')).toEqual({ acik: '#000', koyu: '#000' });
  });
});

// ─── 2) Mavi ve soğuk gri yok ─────────────────────────────────────────────
describe('"mavi ve soğuk gri yok" kuralı', () => {
  it('negatif kontrol: kural gerçek mavileri ve soğuk grileri yakalıyor', () => {
    // mavi, camgöbeği, slate griler, soğuk gri, tam nötr gri
    for (const r of ['#3B82F6', '#06B6D4', '#94A3B8', '#64748B', '#6B7280', '#808080']) {
      expect(sogukRenkSebebi(rgb(renkCoz(r))), r).not.toBeNull();
    }
  });

  it('pozitif kontrol: paletin yeşilleri, sıcak grisi, kremi ve turuncusu geçiyor', () => {
    for (const r of ['#1E5C45', '#154434', '#13110F', '#F3EBDD', '#FF7A1A']) {
      expect(sogukRenkSebebi(rgb(renkCoz(r))), r).toBeNull();
    }
  });

  const literaller = renkLiteralleri(css);

  it('tokens.css içinde renkler bulundu (tarayıcı boş dönmüyor)', () => {
    expect(literaller.length).toBeGreaterThan(30);
  });

  it.each(literaller)('%s mavi değil, gri ise sıcak', (lit) => {
    expect(sogukRenkSebebi(rgb(renkCoz(lit))), lit).toBeNull();
  });

  // 3D sahnenin paleti (src/pcb/renkler.ts, CLAUDE.md §4.2): ışıklar dahil hepsi aynı kurala uyar.
  it.each(Object.entries(RENK_3D))('3D: %s (%s) mavi değil, gri ise sıcak', (_ad, deger) => {
    expect(sogukRenkSebebi(rgb(renkCoz(deger))), deger).toBeNull();
  });
});

// ─── 3) Kontrast ──────────────────────────────────────────────────────────
// Metnin durabileceği opak yüzeyler. Gradyanların iki ucu ayrı ölçülür (metin iki uçta da durabilir).
// zemin-isik (radyal merkez) ve pafta-arka-* listede yok: üstlerinde metin yok, paftalar onları örtüyor.
const PAFTA = ['--pafta-1', '--pafta-2'] as const;
const KART_ON = ['--kart-on-1', '--kart-on-2'] as const;
const KREM = ['--krem-kutu-1', '--krem-kutu-2'] as const;
const STANDART = [...PAFTA, ...KART_ON, '--kart-orta', '--kart-arka', '--zemin'] as const;

interface Kullanim {
  /** nerede, ne (taslaktaki karşılığı) */
  ne: string;
  /** metnin (veya simgenin / durum çizgisinin) renk token'ı */
  metin: string;
  /** altındaki opak yüzey(ler) */
  yuzey: readonly string[];
  /** varsa aradaki yarı saydam yüzey: önce alttaki yüzeyle kompozit edilir */
  ust?: string;
  px: number;
  kalinlik: number;
  /** metin değil, anlam taşıyan simge (ok, düğme glifi) → WCAG 1.4.11, 3:1 */
  simge?: true;
  /** yalnızca bu temada geçerliyse */
  tema?: Tema;
  /** WCAG eşiğinden daha sıkı özel alt sınır */
  enAz?: number;
}

// Kaynak: tasarım taslağı (E · Premium paftaları). Bileşenler bu tabloya uymalı.
const KULLANIMLAR: Kullanim[] = [
  // Pafta üstü
  { ne: 'İsim (Hakkımda)', metin: '--metin', yuzey: PAFTA, px: 76, kalinlik: 600 },
  { ne: 'Pafta başlığı', metin: '--metin', yuzey: PAFTA, px: 52, kalinlik: 600 },
  { ne: 'Unvan (Hakkımda)', metin: '--turuncu-yazi', yuzey: PAFTA, px: 24, kalinlik: 500 },
  { ne: 'Pafta giriş cümlesi', metin: '--metin-2', yuzey: PAFTA, px: 16, kalinlik: 400 },
  { ne: 'Tanıtım paragrafı (Hakkımda)', metin: '--metin-3', yuzey: PAFTA, px: 17, kalinlik: 400 },
  { ne: 'İletişim satırı (Hakkımda)', metin: '--metin-3', yuzey: PAFTA, px: 14, kalinlik: 400 },
  { ne: 'Pasif sekme', metin: '--metin-3', yuzey: PAFTA, px: 14, kalinlik: 400 },
  { ne: 'Aktif sekme', metin: '--vurgu-metin', ust: '--sekme-zemin', yuzey: PAFTA, px: 14, kalinlik: 500 },
  { ne: 'Dil / tema düğmesi', metin: '--hap-metin', yuzey: PAFTA, px: 13, kalinlik: 500 },
  { ne: 'Dil / tema düğmesi (üzerine gelince)', metin: '--hap-metin', ust: '--hap-zemin', yuzey: PAFTA, px: 13, kalinlik: 500 },
  // JS kapalıyken sahnenin üst şeridi (sekmeler + dil düğmesi) paftanın değil, sayfa zemininin üstünde durur.
  { ne: 'Dil düğmesi (JS kapalı, zemin üstünde)', metin: '--hap-metin', yuzey: ['--zemin'], px: 13, kalinlik: 500 },
  { ne: 'Pasif sekme (JS kapalı, zemin üstünde)', metin: '--metin-3', yuzey: ['--zemin'], px: 14, kalinlik: 400 },
  { ne: 'İletişim linki (üzerine gelince)', metin: '--vurgu-metin', yuzey: PAFTA, px: 14, kalinlik: 400 },
  { ne: 'İkincil düğme (İletişime geç)', metin: '--metin', yuzey: PAFTA, px: 15, kalinlik: 500 },
  { ne: 'Önceki / sonraki linkleri', metin: '--metin-2', yuzey: PAFTA, px: 14, kalinlik: 400 },
  { ne: 'Özet sayısı', metin: '--turuncu-yazi', yuzey: PAFTA, px: 56, kalinlik: 600 },
  { ne: 'Özet etiketi', metin: '--metin', yuzey: PAFTA, px: 17, kalinlik: 400 },
  { ne: 'Özet oku (⌄)', metin: '--turuncu-yazi', yuzey: PAFTA, px: 15, kalinlik: 400, simge: true },

  // Özet açılır menü kutusu (yarı saydam, pafta üstünde)
  { ne: 'Menü alt sayısı', metin: '--turuncu-yazi', ust: '--menu-zemin', yuzey: PAFTA, px: 30, kalinlik: 600 },
  { ne: 'Menü alt etiketi', metin: '--metin-2', ust: '--menu-zemin', yuzey: PAFTA, px: 15, kalinlik: 400 },
  { ne: 'Menü satır başlığı', metin: '--metin', ust: '--menu-zemin', yuzey: PAFTA, px: 14, kalinlik: 500 },
  { ne: 'Menü satır açıklaması', metin: '--metin-3', ust: '--menu-zemin', yuzey: PAFTA, px: 13, kalinlik: 400 },
  { ne: 'Menü oku (⌄)', metin: '--turuncu-yazi', ust: '--menu-zemin', yuzey: PAFTA, px: 13, kalinlik: 400, simge: true },

  // Öndeki kart
  { ne: 'Kart üst satırı (mono, önünde turuncu nokta)', metin: '--metin-2', yuzey: KART_ON, px: 13, kalinlik: 400 },
  { ne: 'Kart başlığı', metin: '--metin', yuzey: KART_ON, px: 27, kalinlik: 600 },
  { ne: 'Kart alt satırı', metin: '--metin-3', yuzey: KART_ON, px: 14, kalinlik: 400 },
  { ne: 'Kart açıklaması', metin: '--metin-2', yuzey: KART_ON, px: 15, kalinlik: 400 },
  { ne: 'Kart sayacı (i / n)', metin: '--metin-3', yuzey: KART_ON, px: 12, kalinlik: 400 },
  { ne: 'Önceki düğmesi oku (←)', metin: '--metin', yuzey: KART_ON, px: 18, kalinlik: 400, simge: true },
  { ne: 'Teknoloji hapı', metin: '--hap-metin', ust: '--hap-zemin', yuzey: KART_ON, px: 12, kalinlik: 400 },
  { ne: 'Etiket hapı (Devam ediyor)', metin: '--vurgu-metin', ust: '--etiket-zemin', yuzey: KART_ON, px: 12, kalinlik: 400 },

  // Arkadaki kartların üst şeridi
  { ne: 'Ortadaki kart şeridi', metin: '--metin-2', yuzey: ['--kart-orta'], px: 12, kalinlik: 400 },
  { ne: 'Arkadaki kart şeridi', metin: '--metin-3', yuzey: ['--kart-arka'], px: 12, kalinlik: 400 },

  // Bant kutuları
  { ne: 'Krem kutu yazısı', metin: '--kutu-metin', yuzey: KREM, px: 14, kalinlik: 500 },

  // Durum çizgileri (WCAG 1.4.11): çerçeve kutudan 2px açıkta durur, çevresi pafta; kutular bandın hemen üstünde.
  { ne: 'Seçili kutu çerçevesi', metin: '--turuncu-cizgi', yuzey: [...PAFTA, '--bant'], px: 2, kalinlik: 400, simge: true },
  // Bant kutusunun odak halkası kutudan 6px açıkta: alt kenarı bandın üstüne düşer (Bant.astro).
  { ne: 'Bant kutusu odak halkası', metin: '--turuncu-cizgi', yuzey: [...PAFTA, '--bant'], px: 2, kalinlik: 400, simge: true },
  { ne: 'Aktif pafta göstergesi', metin: '--turuncu-cizgi', yuzey: PAFTA, px: 6, kalinlik: 400, simge: true },
  { ne: 'Klavye odak halkası (temel.css)', metin: '--turuncu-cizgi', yuzey: STANDART, px: 2, kalinlik: 400, simge: true },

  // Turuncu dolgu üstü
  { ne: 'Ana düğme yazısı (CV’yi indir)', metin: '--turuncu-ustu', yuzey: ['--turuncu'], px: 15, kalinlik: 500 },
  { ne: 'Sonraki düğmesi oku (→)', metin: '--turuncu-ustu', yuzey: ['--turuncu'], px: 18, kalinlik: 400, simge: true },

  // Genel güvence: ana metin renkleri her standart yüzeyde küçük metin olarak okunur
  // (JS kapalı düzen, telefon görünümü, ileride eklenecek bölümler için).
  { ne: 'Genel: ana metin', metin: '--metin', yuzey: STANDART, px: 14, kalinlik: 400 },
  { ne: 'Genel: ikincil metin', metin: '--metin-2', yuzey: STANDART, px: 14, kalinlik: 400 },
  { ne: 'Genel: üçüncül metin', metin: '--metin-3', yuzey: STANDART, px: 14, kalinlik: 400 },
  // Burak'ın kararı: açık temada turuncu yazı her yüzeyde en az 4.6 (4.5 sınırında kalmasın).
  // Not: koyu temada --turuncu-yazi küçük metinde KULLANILMAZ (pafta üstünde ~3.98); orada --vurgu-metin var.
  { ne: 'Açık tema: küçük turuncu yazı', metin: '--turuncu-yazi', yuzey: STANDART, px: 14, kalinlik: 400, tema: 'acik', enAz: 4.6 },
];

describe('kontrast: kullanım tablosundaki her metin/yüzey çifti', () => {
  for (const tema of TEMALAR) {
    describe(tema, () => {
      for (const k of KULLANIMLAR) {
        if (k.tema && k.tema !== tema) continue;
        const esik = Math.max(k.simge ? SIMGE_ESIGI : kontrastEsigi(k.px, k.kalinlik), k.enAz ?? 0);
        for (const alt of k.yuzey) {
          const yuzeyAdi = k.ust ? `${k.ust} + ${alt}` : alt;
          it(`${k.ne}: ${k.metin} / ${yuzeyAdi} ≥ ${esik}`, () => {
            const altRenk = opakRenk(alt, tema);
            const gorunenYuzey = k.ust ? kompozit(tokenRengi(k.ust, tema), altRenk) : altRenk;
            const oran = kontrast(opakRenk(k.metin, tema), gorunenYuzey);
            expect(oran, `${tema} · ${k.ne}: ${oran.toFixed(2)}:1 < ${esik}:1`).toBeGreaterThanOrEqual(esik);
          });
        }
      }
    });
  }

  it('her metin token\'ı tabloda en az bir kez ölçülüyor (test dışı metin rengi kalmasın)', () => {
    const metinTokenlari = [...tokenlar.keys()].filter((ad) => /^--metin|-metin$|^--turuncu-(yazi|ustu)$/.test(ad));
    const olculen = new Set(KULLANIMLAR.map((k) => k.metin));
    expect(metinTokenlari.filter((ad) => !olculen.has(ad))).toEqual([]);
  });

  it('her yarı saydam yüzey token\'ı tabloda bir metnin altında ölçülüyor', () => {
    const saydamYuzeyler = [...tokenlar.keys()].filter(
      (ad) => ad.endsWith('-zemin') && TEMALAR.some((t) => renkCoz(tokenlar.get(ad)![t])[3] < 1),
    );
    const olculen = new Set(KULLANIMLAR.map((k) => k.ust));
    expect(saydamYuzeyler.length).toBeGreaterThan(0);
    expect(saydamYuzeyler.filter((ad) => !olculen.has(ad))).toEqual([]);
  });
});

// ─── 3D'de Hakkımda paneli (CLAUDE.md §3.3) ──────────────────────────────
// Panel metni 3D sahnenin üstünde, yarı saydam koyu "cam"ın (--cam-panel) üstünde durur. Sahnenin en açık renkleri
// (krem serigrafi, bakır, turuncu tabela, kalay) camın arkasına düşse bile metin okunmalı. 3D her zaman koyu tema.
describe('3D: Hakkımda paneli camın üstünde (en kötü arka plan)', () => {
  const cam = tokenRengi('--cam-panel', 'koyu');
  const ARKALAR = [RENK_3D.krem, RENK_3D.bakir, RENK_3D.turuncu, RENK_3D.kalay, RENK_3D.altin, RENK_3D.isikGok];
  const METINLER = [
    { ne: 'isim (76px)', metin: '--metin', esik: 3 },
    { ne: 'unvan (24px)', metin: '--turuncu-yazi', esik: 3 },
    { ne: 'tanıtım (17px)', metin: '--metin-3', esik: 4.5 },
    { ne: 'iletişim satırı (14px)', metin: '--metin-3', esik: 4.5 },
    { ne: 'iletişim linki üzerine gelince (14px)', metin: '--vurgu-metin', esik: 4.5 },
    { ne: 'İletişime geç düğmesi (15px)', metin: '--metin', esik: 4.5 },
  ];
  for (const arka of ARKALAR) {
    const yuzey = kompozit(cam, rgb(renkCoz(arka)));
    it.each(METINLER)(`arkada ${arka}: $ne ≥ $esik`, ({ metin, esik }) => {
      expect(kontrast(opakRenk(metin, 'koyu'), yuzey)).toBeGreaterThanOrEqual(esik);
    });
  }
});
