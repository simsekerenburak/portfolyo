// 3D sahnenin paleti (CLAUDE.md §4.2 "3D sahne renkleri"). Bütün 3D renkleri yalnızca burada.
// tests/renk.test.ts "mavi ve soğuk gri yok" kuralını bu değerlere de uygular. Işıklar da sıcak.
// Değerler #RRGGBB metni: Three.js `new Color('#D9893F')` okur, renk testi de aynı metni ölçer.

export const RENK_3D = {
  /** gökyüzü ve sis: koyu zemin yeşili (--zemin) */
  zemin: '#0B241B',
  /** lehim maskesi (tahta) */
  maske: '#12392B',
  /** tabela levhası: açık maske yeşili */
  tabela: '#18503C',
  /** bakır yol (ton ~29°); mat malzemeyle çizilir (§4.2) */
  bakir: '#D9893F',
  /** ana hattın iki yanındaki koyu yollar */
  bakirKoyu: '#7A4E26',
  /** çip gövdesi: sıcak grafit (R > B) */
  grafit: '#1F1C1A',
  /** çip bacakları: kalaylı, sıcak gümüş */
  kalay: '#C9B79C',
  /** dağınık via'lar ve pad'ler */
  altin: '#C9A55A',
  /** tabela çerçevesi, kavşak via'sı (--turuncu) */
  turuncu: '#FF7A1A',
  /** serigrafi (krem) */
  krem: '#F3EBDD',
  /** büyük turuncu yazı (--turuncu-yazi, koyu tema) */
  turuncuYazi: '#FF8A3D',
  /** ışıklar: gökyüzü (yarı küre) ve tek yönlü "güneş" */
  isikGok: '#FFE9C9',
  isikGunes: '#FFE2B8',
} as const;

export type Renk3d = keyof typeof RENK_3D;
