// Kameranın yolu (CLAUDE.md §5.8): köşeleri dairesel yayla yumuşatılmış, yay uzunluğuyla parametrelenmiş kırık çizgi.
// Saf: DOM ve Three.js yok (tests/yol.test.ts).
//
// Neden yay uzunluğu (arc length)? Kaydırma "yolda kaç birim ilerledin" sorusudur. Yol s ∈ [0, L] ile
// parametrelenirse aynı Δs her yerde aynı mesafe demektir: düzlükte de virajda da kamera aynı hızda ilerler.
//
// Köşe yumuşatma (fillet): kırık çizginin P köşesinde gelen yön d₁, giden yön d₂, dönüş açısı φ (0 < φ < π).
// Köşeye r yarıçaplı, iki kenara teğet bir daire yayı oturtulur:
//   teğet uzaklığı  t = r·tan(φ/2)     (yay köşeden t önce başlar, t sonra biter)
//   yay uzunluğu    r·φ
// t, kenarın yarısını aşamaz (komşu köşenin yayıyla çakışmasın); aşarsa r küçültülür: r = t / tan(φ/2).
// Sonuç: konum ve teğet her yerde süreklidir (kamera virajda sarsılmaz). r = 0 → keskin köşe.

import { capraz, nokta, nokta2, topla, type Nokta } from './geometri';

interface DuzParca {
  tur: 'duz';
  /** parçanın yol üstündeki başlangıcı */
  s0: number;
  uzunluk: number;
  bas: Nokta;
  /** birim yön */
  yon: Nokta;
}

interface YayParca {
  tur: 'yay';
  s0: number;
  uzunluk: number;
  merkez: Nokta;
  r: number;
  /** başlangıç noktasının merkeze göre açısı: (bas − merkez) = r·(cos a0, sin a0), x–z düzleminde */
  a0: number;
  /** dönüş yönü: +1 saat yönü tersi (x'ten z'ye), −1 saat yönü */
  isaret: 1 | -1;
}

export type Parca = DuzParca | YayParca;

export interface Yol {
  parcalar: readonly Parca[];
  /** toplam uzunluk L */
  uzunluk: number;
}

/** Yolun s noktası: konum (x, z) ve birim teğet (tx, tz) = gidiş yönü. */
export interface YolNoktasi {
  x: number;
  z: number;
  tx: number;
  tz: number;
}

/** Bu açıdan küçük dönüşler düz sayılır (yay eklenmez). */
const DUZ_ESIK = 1e-9;

/**
 * Noktalardan yumuşatılmış yol kurar.
 * Girdi: en az 2 nokta (ardışık iki nokta aynı olamaz, geri dönüş (≈180°) olamaz) ve köşe yarıçapı r ≥ 0.
 * Çıktı: düz ve yay parçalarının listesi, her birinin yoldaki başlangıcı s0 ve toplam uzunluk.
 */
export function yolKur(noktalar: readonly Nokta[], yaricap: number): Yol {
  if (noktalar.length < 2) throw new RangeError('yol en az 2 nokta içermeli');
  if (!(yaricap >= 0)) throw new RangeError(`köşe yarıçapı negatif ya da sayı değil: ${yaricap}`);

  // Kenarlar: birim yön d_i ve uzunluk l_i (P_i → P_{i+1})
  const yonler: Nokta[] = [];
  const boylar: number[] = [];
  for (let i = 0; i + 1 < noktalar.length; i++) {
    const a = noktalar[i]!;
    const b = noktalar[i + 1]!;
    const l = Math.hypot(b.x - a.x, b.z - a.z);
    if (!(l > 1e-9)) throw new RangeError(`ardışık iki nokta aynı (${i}. kenar)`);
    boylar.push(l);
    yonler.push(nokta((b.x - a.x) / l, (b.z - a.z) / l));
  }

  // Her iç köşenin teğet uzaklığı t_j ve gerçek yarıçapı (uçlarda t = 0)
  const teget: number[] = new Array(noktalar.length).fill(0);
  const yaricaplar: number[] = new Array(noktalar.length).fill(0);
  const acilar: number[] = new Array(noktalar.length).fill(0);
  for (let j = 1; j + 1 < noktalar.length; j++) {
    const d1 = yonler[j - 1]!;
    const d2 = yonler[j]!;
    const phi = Math.acos(Math.min(1, Math.max(-1, nokta2(d1, d2))));
    if (phi > Math.PI - 1e-6) throw new RangeError(`yol ${j}. köşede geri dönüyor`);
    if (phi < DUZ_ESIK || yaricap === 0) continue;
    const tanYari = Math.tan(phi / 2);
    const t = Math.min(yaricap * tanYari, boylar[j - 1]! / 2, boylar[j]! / 2);
    teget[j] = t;
    yaricaplar[j] = t / tanYari;
    acilar[j] = phi;
  }

  const parcalar: Parca[] = [];
  let s = 0;
  for (let i = 0; i + 1 < noktalar.length; i++) {
    const d = yonler[i]!;
    // Düz parça: köşe yaylarının arasında kalan kısım
    const bas = topla(noktalar[i]!, d, teget[i]!);
    const duzBoy = boylar[i]! - teget[i]! - teget[i + 1]!;
    if (duzBoy > 1e-12) {
      parcalar.push({ tur: 'duz', s0: s, uzunluk: duzBoy, bas, yon: d });
      s += duzBoy;
    }
    // Sonraki köşenin yayı
    const j = i + 1;
    if (teget[j]! > 0) {
      const d2 = yonler[j]!;
      const isaret: 1 | -1 = capraz(d, d2) > 0 ? 1 : -1;
      const r = yaricaplar[j]!;
      const yayBas = topla(noktalar[j]!, d, -teget[j]!);
      // Merkez, gidiş yönünün dönüş tarafına 90° döndürülmüş hâlinde: n = isaret·(−d.z, d.x)
      const merkez = topla(yayBas, nokta(-d.z * isaret, d.x * isaret), r);
      const a0 = Math.atan2(yayBas.z - merkez.z, yayBas.x - merkez.x);
      const uzunluk = r * acilar[j]!;
      parcalar.push({ tur: 'yay', s0: s, uzunluk, merkez, r, a0, isaret });
      s += uzunluk;
    }
  }
  return { parcalar, uzunluk: s };
}

/**
 * Yolun s noktasındaki konum ve birim teğet. s, [0, L]'ye sıkıştırılır; NaN → 0 (hiçbir zaman NaN dönmez).
 *   Düz parça: P = bas + u·yon, teğet = yon                         (u = s − s0)
 *   Yay:       α = a0 + isaret·u/r,  P = merkez + r·(cos α, sin α),  teğet = isaret·(−sin α, cos α)
 */
export function noktaAl(yol: Yol, s: number): YolNoktasi {
  const L = yol.uzunluk;
  const ss = Number.isNaN(s) ? 0 : Math.min(L, Math.max(0, s));
  // Parçalar sıralı ve az (≤ ~10): doğrusal arama yeterli. Son parça, s0'ı s'ye eşit ya da küçük olan.
  let p = yol.parcalar[0]!;
  for (const aday of yol.parcalar) {
    if (aday.s0 <= ss) p = aday;
    else break;
  }
  const u = Math.min(p.uzunluk, ss - p.s0);
  if (p.tur === 'duz') return { x: p.bas.x + p.yon.x * u, z: p.bas.z + p.yon.z * u, tx: p.yon.x, tz: p.yon.z };
  const a = p.a0 + (p.isaret * u) / p.r;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return { x: p.merkez.x + p.r * cos, z: p.merkez.z + p.r * sin, tx: -p.isaret * sin, tz: p.isaret * cos };
}
