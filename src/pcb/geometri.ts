// Tahta düzleminde (x, z) 2B geometri yardımcıları. Saf; DOM ve Three.js yok.
// Yerleşim (duzen.ts) parçaların birbirine değip değmediğini bu uzaklıklarla ölçer.
// Koordinatlar: tahta y = 0 düzlemi, ana hat +z yönünde ilerler. Kamera +z'ye bakarken ekranın SOLU +x'tir.

export interface Nokta {
  x: number;
  z: number;
}

/** Eksenlere hizalı dikdörtgen: x ∈ [x0, x1], z ∈ [z0, z1] */
export interface Kutu {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

export const nokta = (x: number, z: number): Nokta => ({ x, z });
export const fark = (a: Nokta, b: Nokta): Nokta => ({ x: a.x - b.x, z: a.z - b.z });
export const topla = (a: Nokta, b: Nokta, k = 1): Nokta => ({ x: a.x + b.x * k, z: a.z + b.z * k });
export const nokta2 = (a: Nokta, b: Nokta): number => a.x * b.x + a.z * b.z;
/** 2B çapraz çarpım a × b = a.x·b.z − a.z·b.x (> 0: b, a'nın saat yönü tersinde; x–z düzleminde) */
export const capraz = (a: Nokta, b: Nokta): number => a.x * b.z - a.z * b.x;
export const boy = (a: Nokta): number => Math.hypot(a.x, a.z);
export const uzaklik = (a: Nokta, b: Nokta): number => Math.hypot(a.x - b.x, a.z - b.z);

/** Merkez ve yarı boyutlardan kutu. */
export function kutu(merkez: Nokta, yariX: number, yariZ: number): Kutu {
  return { x0: merkez.x - yariX, x1: merkez.x + yariX, z0: merkez.z - yariZ, z1: merkez.z + yariZ };
}

/**
 * P noktasının [A, B] doğru parçasına uzaklığı.
 * P'nin AB doğrusu üstündeki izdüşümü t = ((P − A)·(B − A)) / |B − A|², [0, 1]'e sıkıştırılır; uzaklık |P − (A + t·(B − A))|.
 */
export function noktaParcaUzakligi(p: Nokta, a: Nokta, b: Nokta): number {
  const ab = fark(b, a);
  const l2 = nokta2(ab, ab);
  const t = l2 === 0 ? 0 : Math.min(1, Math.max(0, nokta2(fark(p, a), ab) / l2));
  return uzaklik(p, topla(a, ab, t));
}

/**
 * İki doğru parçası kesişiyor mu (uç noktada değme dahil).
 * Yönelim testi: C ve D, AB'nin iki yanında (çapraz çarpımların işaretleri zıt) VE A ile B, CD'nin iki yanında.
 */
export function parcalarKesisir(a: Nokta, b: Nokta, c: Nokta, d: Nokta): boolean {
  const d1 = capraz(fark(b, a), fark(c, a));
  const d2 = capraz(fark(b, a), fark(d, a));
  const d3 = capraz(fark(d, c), fark(a, c));
  const d4 = capraz(fark(d, c), fark(b, c));
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  // Eşdoğrusal / uçta değme: uç noktanın öteki parçaya uzaklığı 0
  const e = 1e-12;
  return (
    noktaParcaUzakligi(c, a, b) < e ||
    noktaParcaUzakligi(d, a, b) < e ||
    noktaParcaUzakligi(a, c, d) < e ||
    noktaParcaUzakligi(b, c, d) < e
  );
}

/** İki doğru parçası arası en kısa uzaklık: kesişiyorsa 0, değilse dört uç noktanın öteki parçaya uzaklıklarının en küçüğü. */
export function parcaParcaUzakligi(a: Nokta, b: Nokta, c: Nokta, d: Nokta): number {
  if (parcalarKesisir(a, b, c, d)) return 0;
  return Math.min(
    noktaParcaUzakligi(a, c, d),
    noktaParcaUzakligi(b, c, d),
    noktaParcaUzakligi(c, a, b),
    noktaParcaUzakligi(d, a, b),
  );
}

/** Noktanın kutuya uzaklığı (içindeyse 0): dx = max(x0 − x, 0, x − x1), dz benzeri, uzaklık √(dx² + dz²). */
export function noktaKutuUzakligi(p: Nokta, k: Kutu): number {
  const dx = Math.max(k.x0 - p.x, 0, p.x - k.x1);
  const dz = Math.max(k.z0 - p.z, 0, p.z - k.z1);
  return Math.hypot(dx, dz);
}

/** İki kutu arası uzaklık (üst üste biniyorsa 0). */
export function kutuKutuUzakligi(a: Kutu, b: Kutu): number {
  const dx = Math.max(a.x0 - b.x1, 0, b.x0 - a.x1);
  const dz = Math.max(a.z0 - b.z1, 0, b.z0 - a.z1);
  return Math.hypot(dx, dz);
}

/**
 * Doğru parçasının kutuya uzaklığı. Parça kutunun içinden geçiyor ya da bir kenarını kesiyorsa 0;
 * değilse en yakın nokta ya parçanın bir ucunda ya da kutunun bir köşesinde olur.
 */
export function parcaKutuUzakligi(a: Nokta, b: Nokta, k: Kutu): number {
  if (noktaKutuUzakligi(a, k) === 0 || noktaKutuUzakligi(b, k) === 0) return 0;
  const koseler = [nokta(k.x0, k.z0), nokta(k.x1, k.z0), nokta(k.x1, k.z1), nokta(k.x0, k.z1)];
  let enAz = Math.min(noktaKutuUzakligi(a, k), noktaKutuUzakligi(b, k));
  for (let i = 0; i < 4; i++) {
    const c = koseler[i]!;
    const d = koseler[(i + 1) % 4]!;
    enAz = Math.min(enAz, parcaParcaUzakligi(a, b, c, d));
  }
  return enAz;
}
