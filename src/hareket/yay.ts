// Kritik sönümlü yay (CLAUDE.md §5.3): kolun eksenleri ve kamera hedefe bu yayla gider.
// Gerçek bir motor gibi: hedef değişince değer hemen sıçramaz, hızlanır, yavaşlayarak oturur; salınım yapmaz.
//
// Diferansiyel denklem (birim kütle):   ẍ = k·(h − x) − c·ẋ
//   k: sertlik (büyük k → hızlı), c: sönüm. c = 2√k "kritik sönüm": salınımsız oturmanın en hızlısı
//   (daha az sönüm hedefi aşıp salınır, daha çok sönüm gereksiz yavaşlar).
//
// Bu denklemin TAM çözümü bilindiği için adımı sayısal yaklaşımla (Euler) değil, kapalı formülle atıyoruz.
// Hata e = x − h, ω = √k, B = v₀ + ω·e₀ olmak üzere:
//   e(t) = (e₀ + B·t) · e^(−ωt)
//   v(t) = (v₀ − ω·B·t) · e^(−ωt)
// Kanıt: e(t)'nin türevi (B − ω·e₀ − ω·B·t)·e^(−ωt) = v(t) ✓; ikinci türev −2ω·v − ω²·e ✓ (denklemle aynı).
// Neden Euler değil: Euler'in hatası kare hızına bağlı (30 fps'te k = 12 yayı 2 sn'de hedefin %1'ine giremiyordu,
// 144 fps'te giriyordu). Tam çözüm her kare hızında aynı yolu çizer ve hiçbir dt'de kararsızlaşmaz.
// Durgun başlangıçta (v₀ = 0) e(t) = e₀·(1 + ωt)·e^(−ωt): e₀ ile aynı işaretli ve tekdüze azalır → hedefi aşmaz.
// (tests/yay.test.ts)

/** Bir karede izin verilen en büyük zaman adımı (s). Sekme uykudan dönünce kol/kamera bir karede ışınlanmasın. */
export const DT_UST = 0.033;

/** CLAUDE.md §5.3 sertlikleri (1/s²). Kamera değerleri M2'de denenip §5.3'e yazılacak. */
export const SERTLIK = {
  tasiyici: 18,
  direk: 30,
  uc: 70,
  gripper: 40,
  kameraIlerleme: 12,
  kameraBakis: 20,
} as const;

/**
 * Yayı dt kadar ilerletir (yukarıdaki tam çözüm).
 * Girdi: konum x, hız v, hedef h, sertlik k (1/s²), zaman adımı dt (s; [0, DT_UST] aralığına sıkıştırılır).
 * Çıktı: [x', v'] = [h + e(dt), v(dt)].
 */
export function yay(x: number, v: number, hedef: number, k: number, dt: number): [number, number] {
  const t = Math.min(Math.max(dt, 0), DT_UST);
  const w = Math.sqrt(k);
  const e = x - hedef;
  const B = v + w * e;
  const sonum = Math.exp(-w * t);
  return [hedef + (e + B * t) * sonum, (v - w * B * t) * sonum];
}

/**
 * Yay "durdu" mu: hedefe uzaklık ve hız ikisi de eşiğin altında.
 * İsteğe bağlı çizim (CLAUDE.md §2.2) bunu kullanır: hiçbir yay hareket etmiyorsa kare çizilmez.
 */
export function oturdu(x: number, v: number, hedef: number, esik = 1e-3): boolean {
  return Math.abs(hedef - x) < esik && Math.abs(v) < esik;
}
