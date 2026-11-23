// PCB yerleşimi (CLAUDE.md §3.1): içerikten (sapaklar ve öğeleri) tahtanın üstündeki her parçanın yeri.
// Saf ve deterministik: aynı girdi → aynı yerleşim. DOM ve Three.js yok (tests/duzen.test.ts).
// Three.js sahnesi (src/pcb/sahne3d/) ve kamera yolu (yol.ts) bu çıktıyı okur.
//
// Koordinatlar (geometri.ts): tahta y = 0, ana hat +z yönünde. Kamera +z'ye bakarken ekranın SOLU +x'tir,
// bu yüzden "sol" sapak +x'e (isaret = +1), "sağ" sapak −x'e (isaret = −1) gider.
//
// Ana hat:   z = anaBasZ ... sonZ boyunca 0,9 genişlikte bakır yol, iki yanında (x = ±0,9) 0,35'lik koyu yollar.
//            Başında Hakkımda çipi (z = 10, yolun üstünde), sonunda konnektör (İletişim).
// Sapak k:   kavşak K = (0, z_k). K'den 45° ile 3 birim çapraz → D, sonra 90° (ana hatta dik) düz → E.
//            Öğeler düz kısımda her 6 birimde bir, sırayla iki yana kısa bir yolla bağlı küçük çipler.
//            Düz kısmın ucunda bölüm çipi; kavşakta turuncu via; kavşağın 3 birim yanında tabela.
// Kavşak aralığı 18; bir sapağın parçaları öncekilere boşluktan fazla yaklaşırsa aralık 1'er birim açılır.
// Yollar yalnızca 0° / 45° / 90° doğrultularında.

import {
  kutu,
  kutuKutuUzakligi,
  nokta,
  noktaKutuUzakligi,
  noktaParcaUzakligi,
  parcaKutuUzakligi,
  parcaParcaUzakligi,
  uzaklik,
  type Kutu,
  type Nokta,
} from './geometri';

/** Prototip ölçüleri (Burak, 2026-11-23; CLAUDE.md §3.1). Birim: dünya birimi (≈ metre). */
export const OLCU = {
  /** ana hat ve sapak yolu genişliği */
  anaGenislik: 0.9,
  /** ana hattın iki yanındaki koyu yollar: genişlik ve merkezin ana hattan uzaklığı */
  yanGenislik: 0.35,
  yanOfset: 0.9,
  /** ana hat kameranın arkasından başlar (kamera z = 0'da) */
  anaBasZ: -12,
  kameraBasZ: 0,
  hakkimdaZ: 10,
  hakkimdaYariX: 3.4,
  hakkimdaYariZ: 2.0,
  ilkKavsakZ: 26,
  kavsakAralik: 18,
  /** kavşaktaki turuncu via (prototipte 0,62; yan yolla arasında boşluk kalsın diye 0,55) */
  viaYaricap: 0.55,
  /** 45° çapraz kısmın boyu */
  caprazBoy: 3,
  /** düz kısmın en kısa boyu (öğe yokken / az öğede) */
  duzEnAz: 11,
  /** ilk öğenin düz kısmın başından (D) uzaklığı ve öğe aralığı */
  ilkOge: 6,
  ogeAralik: 6,
  /** son öğeden düz kısmın ucuna (E) kalan */
  sonPay: 3,
  /** bölüm çipi: sapak yönünde yarı boy, enine yarı en */
  bolumYariBoy: 3.2,
  bolumYariEn: 2.2,
  /** yollar çipin altına bu kadar girer (lehim pedi gibi): bölüm çipi, konnektör, öğe bağı */
  gomulu: 0.6,
  /** öğe çipi: yarı genişlik ve merkezinin sapak ekseninden uzaklığı */
  ogeYari: 1.4,
  ogeYan: 3.05,
  /** öğe çipini sapağa bağlayan kısa yolun genişliği */
  bagGenislik: 0.35,
  /** tabela: kavşaktan yana uzaklık, kavşağın ne kadar önünde (−z), levha yarıçapı, levha merkezinin yüksekliği */
  tabelaYan: 3,
  tabelaGeri: 0.3,
  tabelaYaricap: 1,
  tabelaYukseklik: 1.9,
  /** konnektör (İletişim): yarı boyutlar; son kavşaktan uzaklığı */
  konnektorYariX: 3.0,
  konnektorYariZ: 1.6,
  konnektorAralik: 18,
  /** kamera, yolun ucundaki çipe bu kadar kala durur (ana hatta konnektör, sapakta bölüm çipi) */
  kameraDurmaPayi: 6,
  /** kamera yolunun köşe yarıçapı (yol.ts) */
  kameraYaricap: 2.5,
  /** kasıtlı olarak değmeyen iki parça arasındaki en az boşluk */
  bosluk: 0.15,
  /** dağınık via'lar: yarıçap, sayı, rastgele tohum */
  dagViaYaricap: 0.16,
  dagViaSayi: 260,
  dagViaTohum: 42,
};
export type Olcu = typeof OLCU;

// ── Girdi ve çıktı tipleri ───────────────────────────────────────────────────

export interface DuzenGirdisi {
  /** Sapaklar yol sırasıyla (Projeler, Stajlar, Yetkinlikler, Belgeler). Yönler sol/sağ dönüşümlü atanır. */
  sapaklar: readonly { id: string; ogeler: readonly { id: string; kisaAd: string }[] }[];
}

export type Yon = 'sol' | 'sag';

/** Bakır yol parçası: a'dan b'ye, uçları yuvarlak (kapsül). */
export interface Iz {
  id: string;
  tur: 'ana' | 'yan' | 'sapak' | 'bag';
  a: Nokta;
  b: Nokta;
  genislik: number;
}

export interface Cip {
  id: string;
  tur: 'hakkimda' | 'bolum' | 'oge' | 'konnektor';
  merkez: Nokta;
  yariX: number;
  yariZ: number;
}

/** Tabela: direğin yerdeki noktası; levha +z'ye dik durur, yüzü ana hattaki kameraya (−z) bakar. */
export interface Tabela {
  id: string;
  sapakId: string;
  direk: Nokta;
  yukseklik: number;
  yaricap: number;
}

export interface Via {
  id: string;
  merkez: Nokta;
  yaricap: number;
}

export interface OgeDuzeni {
  id: string;
  kisaAd: string;
  /** düz kısmın başından (D) uzaklık */
  u: number;
  /** sapağın gidiş yönüne göre: +1 sol, −1 sağ */
  taraf: 1 | -1;
  cip: Cip;
  bag: Iz;
}

export interface SapakDuzeni {
  id: string;
  yon: Yon;
  /** x yönü: sol +1, sağ −1 */
  isaret: 1 | -1;
  kavsak: Nokta;
  /** kavşağın ana hattaki kamera yolu üstündeki yeri (s) */
  anaS: number;
  /** bakır yolun köşeleri: [K, D, E] */
  noktalar: [Nokta, Nokta, Nokta];
  /** sapaktaki kamera yolunun köşeleri: [K, D, durma noktası] */
  kameraNoktalari: [Nokta, Nokta, Nokta];
  ogeler: OgeDuzeni[];
  bolumCipi: Cip;
  tabela: Tabela;
  via: Via;
}

export interface Duzen {
  anaHat: { basZ: number; sonZ: number; kameraNoktalari: [Nokta, Nokta] };
  sapaklar: SapakDuzeni[];
  /** bütün bakır yollar (ana hat, yan yollar, sapaklar, öğe bağları) */
  izler: Iz[];
  /** bütün çipler (Hakkımda, bölüm, öğe, konnektör) */
  cipler: Cip[];
  tabelalar: Tabela[];
  /** kavşak via'ları + dağınık via'lar */
  vialar: Via[];
  /** kasıtlı değmeler (kimlik çiftleri): çipin altından geçen yol, yolların birleştiği yer, kavşak via'sı */
  temaslar: [string, string][];
  /** her şeyi içeren kutu (tahta bundan biraz büyük çizilir) */
  sinir: Kutu;
}

// ── Çakışma ölçümü ───────────────────────────────────────────────────────────

/** Bir parçanın tahta düzlemindeki izdüşümü: kapsül (yol), kutu (çip, tabela) ya da daire (via). */
export type Sekil =
  | { tur: 'kapsul'; a: Nokta; b: Nokta; r: number }
  | { tur: 'kutu'; k: Kutu }
  | { tur: 'daire'; m: Nokta; r: number };

export interface Eleman {
  id: string;
  sekil: Sekil;
}

/**
 * İki şekil arasındaki boşluk (kenardan kenara; üst üste biniyorsa ≤ 0).
 * Kapsül = r kalınlaştırılmış doğru parçası, daire = r kalınlaştırılmış nokta: önce çekirdekler (parça, nokta, kutu)
 * arası uzaklık bulunur, sonra yarıçaplar çıkarılır.
 */
export function sekilBoslugu(a: Sekil, b: Sekil): number {
  if (a.tur === 'kutu' && b.tur !== 'kutu') return sekilBoslugu(b, a);
  if (a.tur === 'daire' && b.tur === 'kapsul') return sekilBoslugu(b, a);
  if (a.tur === 'kapsul') {
    if (b.tur === 'kapsul') return parcaParcaUzakligi(a.a, a.b, b.a, b.b) - a.r - b.r;
    if (b.tur === 'daire') return noktaParcaUzakligi(b.m, a.a, a.b) - a.r - b.r;
    return parcaKutuUzakligi(a.a, a.b, b.k) - a.r;
  }
  if (a.tur === 'daire') {
    if (b.tur === 'daire') return uzaklik(a.m, b.m) - a.r - b.r;
    if (b.tur === 'kutu') return noktaKutuUzakligi(a.m, b.k) - a.r;
  }
  if (a.tur === 'kutu' && b.tur === 'kutu') return kutuKutuUzakligi(a.k, b.k);
  throw new Error('bilinmeyen şekil çifti');
}

const izElemani = (iz: Iz): Eleman => ({ id: iz.id, sekil: { tur: 'kapsul', a: iz.a, b: iz.b, r: iz.genislik / 2 } });
const cipElemani = (c: Cip): Eleman => ({ id: c.id, sekil: { tur: 'kutu', k: kutu(c.merkez, c.yariX, c.yariZ) } });
const viaElemani = (v: Via): Eleman => ({ id: v.id, sekil: { tur: 'daire', m: v.merkez, r: v.yaricap } });
/** Tabelanın yerdeki izdüşümü: x'te levha çapı kadar, z'de ince bir şerit (levha +z'ye dik). */
const tabelaElemani = (t: Tabela): Eleman => ({ id: t.id, sekil: { tur: 'kutu', k: kutu(t.direk, t.yaricap, 0.06) } });

/** Yerleşimdeki bütün parçalar, çakışma ölçümü için. */
export function elemanlar(d: Pick<Duzen, 'izler' | 'cipler' | 'tabelalar' | 'vialar'>): Eleman[] {
  return [...d.izler.map(izElemani), ...d.cipler.map(cipElemani), ...d.tabelalar.map(tabelaElemani), ...d.vialar.map(viaElemani)];
}

const ciftAnahtari = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Kasıtlı değmeler dışında boşluğu `bosluk`tan az olan çiftler (boşsa yerleşim temiz). */
export function cakismalar(d: Duzen, bosluk = OLCU.bosluk): { a: string; b: string; bosluk: number }[] {
  const izinli = new Set(d.temaslar.map(([a, b]) => ciftAnahtari(a, b)));
  const liste = elemanlar(d);
  const sonuc: { a: string; b: string; bosluk: number }[] = [];
  for (let i = 0; i < liste.length; i++) {
    for (let j = i + 1; j < liste.length; j++) {
      const a = liste[i]!;
      const b = liste[j]!;
      if (izinli.has(ciftAnahtari(a.id, b.id))) continue;
      const b0 = sekilBoslugu(a.sekil, b.sekil);
      if (b0 < bosluk - 1e-9) sonuc.push({ a: a.id, b: b.id, bosluk: b0 });
    }
  }
  return sonuc;
}

// ── Kurulum ──────────────────────────────────────────────────────────────────

interface SapakParcalari {
  sapak: SapakDuzeni;
  izler: Iz[];
  cipler: Cip[];
  temaslar: [string, string][];
}

/** k. sapağı z kavşağında kurar (henüz çakışma denetimi yok). */
function sapakKur(g: DuzenGirdisi['sapaklar'][number], k: number, z: number, o: Olcu): SapakParcalari {
  const isaret: 1 | -1 = k % 2 === 0 ? 1 : -1;
  const a = o.caprazBoy / Math.SQRT2; // 45°: x'te ve z'de eşit
  const K = nokta(0, z);
  const D = nokta(isaret * a, z + a);
  const n = g.ogeler.length;
  const sonU = n > 0 ? o.ilkOge + o.ogeAralik * (n - 1) : 0;
  const duzBoy = Math.max(o.duzEnAz, n > 0 ? sonU + o.sonPay : 0);
  const E = nokta(isaret * (a + duzBoy), D.z);
  /** düz kısımda D'den u uzaklıktaki nokta */
  const duzde = (u: number) => nokta(D.x + isaret * u, D.z);

  const capraz: Iz = { id: `${g.id}-capraz`, tur: 'sapak', a: K, b: D, genislik: o.anaGenislik };
  const duz: Iz = { id: `${g.id}-duz`, tur: 'sapak', a: D, b: E, genislik: o.anaGenislik };
  const bolumCipi: Cip = {
    id: `${g.id}-cip`,
    tur: 'bolum',
    merkez: duzde(duzBoy + o.bolumYariBoy - o.gomulu),
    yariX: o.bolumYariBoy,
    yariZ: o.bolumYariEn,
  };
  const via: Via = { id: `${g.id}-via`, merkez: K, yaricap: o.viaYaricap };
  const tabela: Tabela = {
    id: `${g.id}-tabela`,
    sapakId: g.id,
    direk: nokta(isaret * o.tabelaYan, z - o.tabelaGeri),
    yukseklik: o.tabelaYukseklik,
    yaricap: o.tabelaYaricap,
  };

  const temaslar: [string, string][] = [
    [capraz.id, 'ana'],
    [capraz.id, via.id],
    [via.id, 'ana'],
    [capraz.id, duz.id],
    [duz.id, bolumCipi.id],
  ];
  const ogeler: OgeDuzeni[] = g.ogeler.map((oge, i) => {
    const u = o.ilkOge + o.ogeAralik * i;
    const taraf: 1 | -1 = i % 2 === 0 ? 1 : -1;
    // Gidiş yönü (isaret, 0); onun solu (z, −x) = (0, −isaret). Öğe tarafa göre: enine birim = −isaret·taraf (z'de)
    const enine = -isaret * taraf;
    const kok = duzde(u);
    const cip: Cip = { id: `${oge.id}-cip`, tur: 'oge', merkez: nokta(kok.x, kok.z + enine * o.ogeYan), yariX: o.ogeYari, yariZ: o.ogeYari };
    const bag: Iz = {
      id: `${oge.id}-bag`,
      tur: 'bag',
      a: kok,
      b: nokta(kok.x, kok.z + enine * (o.ogeYan - o.ogeYari + o.gomulu)),
      genislik: o.bagGenislik,
    };
    temaslar.push([bag.id, duz.id], [bag.id, cip.id]);
    return { id: oge.id, kisaAd: oge.kisaAd, u, taraf, cip, bag };
  });

  const kameraU = Math.max(0.5, duzBoy - o.gomulu - o.kameraDurmaPayi);
  const sapak: SapakDuzeni = {
    id: g.id,
    yon: isaret === 1 ? 'sol' : 'sag',
    isaret,
    kavsak: K,
    anaS: z - o.kameraBasZ,
    noktalar: [K, D, E],
    kameraNoktalari: [K, D, duzde(kameraU)],
    ogeler,
    bolumCipi,
    tabela,
    via,
  };
  return {
    sapak,
    izler: [capraz, duz, ...ogeler.map((x) => x.bag)],
    cipler: [bolumCipi, ...ogeler.map((x) => x.cip)],
    temaslar,
  };
}

/** Sapağın parçaları (ana hatla birleşen çapraz yol ve kavşak via'sı hariç: onlar ana hatta değer) öncekilerle çakışıyor mu? */
function cakisiyor(yeni: SapakParcalari, onceki: Eleman[], o: Olcu): boolean {
  const adaylar = elemanlar({ izler: yeni.izler, cipler: yeni.cipler, tabelalar: [yeni.sapak.tabela], vialar: [yeni.sapak.via] });
  return adaylar.some((a) => onceki.some((b) => sekilBoslugu(a.sekil, b.sekil) < o.bosluk - 1e-9));
}

/**
 * Yan yolun bir sapağın çapraz yoluna yaklaşmaması için kesilmesi gereken z aralığı.
 * Yan yol x = isaret·f doğrusunda; çapraz yol K'den (isaret, 1)/√2 yönünde. (isaret·f, ζ) noktasının çapraz doğruya
 * uzaklığı |f − (ζ − z_K)| / √2. Gereken: ≥ m = r_ana + r_yan + boşluk  →  ζ ∉ (z_K + f − m√2, z_K + f + m√2).
 * (Doğruya uzaklık parçaya uzaklıktan küçük ya da eşit olduğu için bu kesim güvenli tarafta kalır.)
 */
function yanKesimi(zK: number, o: Olcu): [number, number] {
  const m = o.anaGenislik / 2 + o.yanGenislik / 2 + o.bosluk;
  return [zK + o.yanOfset - m * Math.SQRT2, zK + o.yanOfset + m * Math.SQRT2];
}

/** mulberry32: 32 bitlik küçük, hızlı, deterministik rastgele sayı üreteci → [0, 1) */
export function mulberry32(tohum: number): () => number {
  let a = tohum | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * İçerikten PCB yerleşimi.
 * Girdi: sapaklar ve öğeleri (kimlik + kısa ad), isteğe bağlı ölçü değişiklikleri (testler için).
 * Çıktı: Duzen (bütün yollar, çipler, tabelalar, via'lar, kamera yollarının köşeleri, kasıtlı değmeler).
 */
export function duzenKur(girdi: DuzenGirdisi, olcuDegisikligi: Partial<Olcu> = {}): Duzen {
  const o: Olcu = { ...OLCU, ...olcuDegisikligi };
  const kimlikler = new Set<string>();
  for (const s of girdi.sapaklar) {
    for (const id of [s.id, ...s.ogeler.map((x) => x.id)]) {
      if (kimlikler.has(id)) throw new Error(`yinelenen kimlik: ${id}`);
      kimlikler.add(id);
    }
  }

  const hakkimda: Cip = {
    id: 'hakkimda',
    tur: 'hakkimda',
    merkez: nokta(0, o.hakkimdaZ),
    yariX: o.hakkimdaYariX,
    yariZ: o.hakkimdaYariZ,
  };

  // Sapaklar sırayla; her biri öncekilerin 18 ilerisinde, çakışırsa 1'er birim daha ileride
  const parcalar: SapakParcalari[] = [];
  const onceki: Eleman[] = [cipElemani(hakkimda)];
  let z = o.ilkKavsakZ;
  girdi.sapaklar.forEach((g, k) => {
    if (k > 0) z = parcalar[k - 1]!.sapak.kavsak.z + o.kavsakAralik;
    let aday = sapakKur(g, k, z, o);
    for (let deneme = 0; cakisiyor(aday, onceki, o); deneme++) {
      if (deneme > 1000) throw new Error(`${g.id} sapağına yer bulunamadı`);
      z += 1;
      aday = sapakKur(g, k, z, o);
    }
    parcalar.push(aday);
    onceki.push(...elemanlar({ izler: aday.izler, cipler: aday.cipler, tabelalar: [aday.sapak.tabela], vialar: [aday.sapak.via] }));
  });

  const sonKavsak = parcalar.at(-1)?.sapak.kavsak.z ?? o.hakkimdaZ;
  const sonZ = sonKavsak + o.konnektorAralik;
  const konnektor: Cip = {
    id: 'konnektor',
    tur: 'konnektor',
    merkez: nokta(0, sonZ + o.konnektorYariZ - o.gomulu),
    yariX: o.konnektorYariX,
    yariZ: o.konnektorYariZ,
  };

  // Ana hat ve yan yollar (yan yol, sapağın çıktığı tarafta kavşak yakınında kesilir)
  const ana: Iz = { id: 'ana', tur: 'ana', a: nokta(0, o.anaBasZ), b: nokta(0, sonZ), genislik: o.anaGenislik };
  const izler: Iz[] = [ana];
  const temaslar: [string, string][] = [
    ['ana', hakkimda.id],
    ['ana', konnektor.id],
  ];
  for (const isaret of [1, -1] as const) {
    const ad = isaret === 1 ? 'sol' : 'sag';
    const kesimler = parcalar.filter((p) => p.sapak.isaret === isaret).map((p) => yanKesimi(p.sapak.kavsak.z, o));
    let bas = o.anaBasZ;
    const araliklar: [number, number][] = [];
    for (const [k0, k1] of kesimler) {
      araliklar.push([bas, k0]);
      bas = k1;
    }
    araliklar.push([bas, sonZ]);
    araliklar.forEach(([z0, z1], i) => {
      const iz: Iz = { id: `yan-${ad}-${i}`, tur: 'yan', a: nokta(isaret * o.yanOfset, z0), b: nokta(isaret * o.yanOfset, z1), genislik: o.yanGenislik };
      izler.push(iz);
      // yan yollar Hakkımda çipinin ve konnektörün altından geçer (yalnızca o çipe uzanan parça değer)
      for (const c of [hakkimda, konnektor]) {
        if (sekilBoslugu(izElemani(iz).sekil, cipElemani(c).sekil) <= 0) temaslar.push([iz.id, c.id]);
      }
    });
  }

  for (const p of parcalar) {
    izler.push(...p.izler);
    temaslar.push(...p.temaslar);
  }
  const cipler = [hakkimda, ...parcalar.flatMap((p) => p.cipler), konnektor];
  const tabelalar = parcalar.map((p) => p.sapak.tabela);
  const kavsakVialari = parcalar.map((p) => p.sapak.via);

  // Her şeyi içeren kutu
  const hepsi = elemanlar({ izler, cipler, tabelalar, vialar: kavsakVialari });
  const sinir: Kutu = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
  for (const e of hepsi) {
    const s = e.sekil;
    const k = s.tur === 'kutu' ? s.k : s.tur === 'daire' ? kutu(s.m, s.r, s.r) : { x0: Math.min(s.a.x, s.b.x) - s.r, x1: Math.max(s.a.x, s.b.x) + s.r, z0: Math.min(s.a.z, s.b.z) - s.r, z1: Math.max(s.a.z, s.b.z) + s.r };
    sinir.x0 = Math.min(sinir.x0, k.x0);
    sinir.x1 = Math.max(sinir.x1, k.x1);
    sinir.z0 = Math.min(sinir.z0, k.z0);
    sinir.z1 = Math.max(sinir.z1, k.z1);
  }

  // Dağınık via'lar: sınır kutusunun biraz dışına kadar, hiçbir parçaya ve birbirine değmeden (deterministik)
  const rastgele = mulberry32(o.dagViaTohum);
  const dagVialar: Via[] = [];
  const alan = { x0: sinir.x0 - 4, x1: sinir.x1 + 4, z0: sinir.z0, z1: sinir.z1 + 8 };
  for (let deneme = 0; dagVialar.length < o.dagViaSayi && deneme < o.dagViaSayi * 20; deneme++) {
    const v: Via = {
      id: `dag-via-${dagVialar.length}`,
      merkez: nokta(alan.x0 + rastgele() * (alan.x1 - alan.x0), alan.z0 + rastgele() * (alan.z1 - alan.z0)),
      yaricap: o.dagViaYaricap,
    };
    const e = viaElemani(v);
    const bos =
      hepsi.every((h) => sekilBoslugu(e.sekil, h.sekil) >= o.bosluk * 2) &&
      dagVialar.every((w) => uzaklik(w.merkez, v.merkez) >= 2 * o.dagViaYaricap + o.bosluk * 2);
    if (bos) dagVialar.push(v);
  }

  const anaKameraSonu = Math.max(o.kameraBasZ + 1, konnektor.merkez.z - konnektor.yariZ - o.kameraDurmaPayi);
  return {
    anaHat: { basZ: o.anaBasZ, sonZ, kameraNoktalari: [nokta(0, o.kameraBasZ), nokta(0, anaKameraSonu)] },
    sapaklar: parcalar.map((p) => p.sapak),
    izler,
    cipler,
    tabelalar,
    vialar: [...kavsakVialari, ...dagVialar],
    temaslar,
    sinir,
  };
}
