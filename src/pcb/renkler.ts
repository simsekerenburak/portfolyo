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
  /** öğe çipinin krem etiketindeki yazı (--kutu-metin) */
  etiketYazi: '#0F2E22',
  /** büyük turuncu yazı (--turuncu-yazi, koyu tema) */
  turuncuYazi: '#FF8A3D',
  /** ufkun üstündeki silüetler (sisin içinde, ışıksız): gökyüzüne (zemin) yakın, hafif sıcak yeşiller ve kararmış
   *  bakır. Sisin içinde kalsınlar diye gökyüzünden yalnızca biraz açık (ilk denemede #21463A fazla parlak ve
   *  camgöbeğine kaçıyordu). */
  siluetKoyu: '#0F2D20',
  siluetAcik: '#14362A',
  siluetBakir: '#33291E',
  /** ışıklar: gökyüzü (yarı küre) ve tek yönlü "güneş" */
  isikGok: '#FFE9C9',
  isikGunes: '#FFE2B8',
} as const;

export type Renk3d = keyof typeof RENK_3D;
