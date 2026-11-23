// Pafta destesinin (sahnenin) durumu: hangi pafta önde, diğerleri nerede? (CLAUDE.md §3.1)
// DOM'a dokunmaz. Sahne.astro'daki betik bu fonksiyonları çağırıp sonucu data-konum niteliğine yazar;
// görünüşü ve kaymayı CSS kurar (PaftaCercevesi.astro). Böylece mantık tests/sahne.test.ts'te sınanır.
//
// Model kart destesiyle aynı halka (src/pafta/deste.ts): n pafta, tek durum değişkeni `on`.
// Fark: destenin en arkasındaki yer (s = n − 1) "çıkan" konumudur. → ile öndeki pafta oraya gider
// (yukarı kalkıp söner = "kaldırılıp en arkaya konur"), ← ile oradan öne iner. M4'te bu hareketi kol yapacak.
import { dongu, onceki, sonraki } from '../pafta/deste';

/** Paftaların destedeki sırası (CLAUDE.md §3.1). Sekmeler, gösterge ve döngü bu sırayı izler. */
export const PAFTA_SIRASI = ['hakkimda', 'projeler', 'stajlar', 'yetkinlikler', 'belgeler'] as const;
export type PaftaKimligi = (typeof PAFTA_SIRASI)[number];

/** Paftanın destedeki yeri. Görünen üç pafta: biri tam, ikisinin yalnızca üst kenarı. */
export type PaftaKonumu = 'on' | 'orta' | 'arka' | 'gizli' | 'cikan';

const GORUNEN = ['on', 'orta', 'arka'] as const;

/**
 * Öndeki pafta `on` iken k. paftanın konumu. s = (k − on) mod n paftanın önden sırasıdır:
 *   s = 0, 1, 2      → on, orta, arka
 *   s = n − 1 (n ≥ 4) → cikan: az önce → ile önden kalkan / bir sonraki ← ile öne inecek pafta
 *   diğerleri         → gizli (arkada, görünmez)
 */
export function paftaKonumu(k: number, on: number, n: number): PaftaKonumu {
  const s = dongu(k - on, n);
  return GORUNEN[s] ?? (s === n - 1 ? 'cikan' : 'gizli');
}

/**
 * eski → yeni geçişinin türü:
 *   ileri / geri → komşu pafta: tam kayma (~0,7 sn)
 *   atla         → uzaktaki pafta (sekmeye tıklama): kısaltılmış geçiş (§3.1)
 *   null         → aynı pafta, geçiş yok
 */
export type Gecis = 'ileri' | 'geri' | 'atla';

export function gecisTuru(eski: number, yeni: number, n: number): Gecis | null {
  if (dongu(eski, n) === dongu(yeni, n)) return null;
  if (dongu(yeni, n) === sonraki(eski, n)) return 'ileri';
  if (dongu(yeni, n) === onceki(eski, n)) return 'geri';
  return 'atla';
}

/**
 * Sağ alttaki "← önceki / sonraki →" linklerinin gösterdiği paftalar.
 * Taslağa göre ilk paftada (Hakkımda) geri linki yok: orası kapak. Son paftadan ileri ise başa döner
 * (Belgeler → Hakkımda, §3.1 "deste döner"). Klavyede ← ilk paftadan da sona gider (halka).
 */
export function komsular(on: number, n: number): { onceki: number | null; sonraki: number | null } {
  if (n < 2) return { onceki: null, sonraki: null };
  return { onceki: on === 0 ? null : on - 1, sonraki: sonraki(on, n) };
}

/**
 * Adresin #parçasındaki kimlik: "#stajlar" → "stajlar". Boş parça ("", "#") → null.
 * Yüzde kodlaması çözülür ("#a%20b" → "a b"); bozuksa (çözülemiyorsa) olduğu gibi döner, hata fırlatmaz.
 */
export function parcaKimligi(hash: string): string | null {
  const ham = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!ham) return null;
  try {
    return decodeURIComponent(ham);
  } catch {
    return ham;
  }
}

/**
 * Kimliğin gösterdiği paftanın indisi:
 *   kimlik bir paftanın kendisiyse ("stajlar") o pafta,
 *   değilse onu İÇEREN pafta ("projeler-simsek" kartı, "iletisim" listesi) — `iceren` sayfaya sorar,
 *   hiçbiri değilse −1 (adres değişmiş ama bir paftaya ait değil: pafta değişmez).
 * Tarayıcıda `iceren` = document.getElementById + contains; testte sahte bir fonksiyon verilir.
 */
export function hedefPafta(
  kimlik: string | null,
  idler: readonly string[],
  iceren: (kimlik: string) => number = () => -1,
): number {
  if (kimlik === null) return -1;
  const i = idler.indexOf(kimlik);
  return i >= 0 ? i : iceren(kimlik);
}
