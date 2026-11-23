// Sanal kaydırma (CLAUDE.md §5.8): tekerlek, dokunma ve klavye "hedef s"yi değiştirir; kamera o hedefi
// kritik sönümlü yayla (src/hareket/yay.ts) izler. Sayfanın kendisi kaymaz. Saf: DOM yok (tests/kaydirma.test.ts).
//
// Neden "hedef" ve "kamera" ayrı? Tekerlek olayları kesik kesik gelir (bir çentik ≈ 100 px). Kamerayı doğrudan
// oynatsaydık her çentikte zıplardı. Olaylar yalnızca hedefi taşır, kamera yayla yumuşakça arkasından gelir.

/** Kaydırma sabitleri. Birim: dünya birimi (≈ metre), piksel, saniye. */
export const KAYDIRMA = {
  /** 1 piksellik tekerlek/sürükleme kaç birim ilerletir: bir çentik (~100 px) → 3 birim; kavşak arası (18) ≈ 6 çentik */
  birimPx: 0.03,
  /** deltaMode = 1 (satır; Firefox): bir satır kaç piksel sayılır */
  satirPx: 40,
  /** tek bir tekerlek olayının en büyük etkisi (px). Dev bir olay (hızlı touchpad, sayfa modu) kamerayı ışınlamasın. */
  olayUstPx: 240,
  /** hedef, kameranın en fazla bu kadar önünde/arkasında olabilir (birim). Art arda gelen olaylar birikip kamerayı fırlatmasın. */
  ondeUst: 12,
  /** dokunma hızı son kaç saniyedeki hareketten ölçülür */
  dokunmaPencere: 0.1,
  /** parmak kalkınca atalet: hız e^(−t/τ) ile söner, toplam yol v·τ */
  ataletTau: 0.325,
  /** atalet bu hızın altına inince durur (birim/s) */
  ataletEsik: 0.05,
  /** klavye adımları (birim): ok tuşu ve sayfa tuşu (PageDown / Space) */
  okAdim: 3,
  sayfaAdim: 12,
} as const;

/**
 * Tekerlek olayını piksele çevirir ve sınırlar.
 * deltaMode: 0 piksel (Chrome, Safari), 1 satır (Firefox), 2 sayfa. Sonuç: clamp(Δ·çarpan, ±olayUstPx).
 */
export function tekerlekPikseli(deltaY: number, deltaMode: number, sayfaYuksekligi: number): number {
  if (!Number.isFinite(deltaY)) return 0;
  const carpan = deltaMode === 1 ? KAYDIRMA.satirPx : deltaMode === 2 ? sayfaYuksekligi : 1;
  return Math.min(KAYDIRMA.olayUstPx, Math.max(-KAYDIRMA.olayUstPx, deltaY * carpan));
}

/**
 * Hedefi Δ birim taşır. İki sıkıştırma:
 *   1) hedef ∈ [s − ondeUst, s + ondeUst]  (s: kameranın şu anki yeri)
 *   2) hedef ∈ [0, L]                       (yolun uçları)
 */
export function hedefIlerlet(hedef: number, s: number, delta: number, L: number): number {
  if (!Number.isFinite(delta)) return Math.min(L, Math.max(0, hedef));
  const yeni = Math.min(s + KAYDIRMA.ondeUst, Math.max(s - KAYDIRMA.ondeUst, hedef + delta));
  return Math.min(L, Math.max(0, yeni));
}

// ── Dokunma ──────────────────────────────────────────────────────────────────

/** Parmağın son konumları (y: piksel, t: saniye). Hız bunlardan ölçülür. */
export interface Dokunma {
  ornekler: readonly { y: number; t: number }[];
}

export function dokunmaBasla(y: number, t: number): Dokunma {
  return { ornekler: [{ y, t }] };
}

/**
 * Parmak hareket etti. Parmak YUKARI giderse (y azalır) ileri gidilir, sayfa kaydırmadaki gibi.
 * Çıktı: yeni durum ve Δ birim = (y_önceki − y)·birimPx.
 */
export function dokunmaHareket(d: Dokunma, y: number, t: number): { durum: Dokunma; delta: number } {
  const onceki = d.ornekler.at(-1);
  const delta = onceki ? (onceki.y - y) * KAYDIRMA.birimPx : 0;
  // Pencereden eski örnekler atılır (en az bir eski örnek kalır ki hız ölçülebilsin)
  const ornekler = [...d.ornekler, { y, t }];
  while (ornekler.length > 2 && t - ornekler[1]!.t > KAYDIRMA.dokunmaPencere) ornekler.shift();
  return { durum: { ornekler }, delta };
}

/**
 * Parmak kalktığında hız (birim/s, ileri pozitif): v = −(y_son − y_ilk)/(t_son − t_ilk)·birimPx, son pencerede.
 * Parmak kalkmadan önce bir süre durduysa (son örnek pencereden eski) hız 0: atalet yok.
 */
export function dokunmaHizi(d: Dokunma, simdi: number): number {
  const ilk = d.ornekler[0];
  const son = d.ornekler.at(-1);
  if (!ilk || !son || son === ilk) return 0;
  if (simdi - son.t > KAYDIRMA.dokunmaPencere) return 0;
  const dt = son.t - ilk.t;
  if (!(dt > 1e-4)) return 0;
  return (-(son.y - ilk.y) / dt) * KAYDIRMA.birimPx;
}

/**
 * Ataletin bir adımı. Hız üstel söner: v(t) = v₀·e^(−t/τ).
 * dt boyunca alınan yol, hızın integrali: Δ = v₀·τ·(1 − e^(−dt/τ)). (Toplam, t → ∞: v₀·τ.)
 * Kare hızından bağımsızdır (tam integral). Hız eşiğin altına inince v = 0.
 */
export function ataletAdim(v: number, dt: number): { v: number; delta: number } {
  if (!Number.isFinite(v) || Math.abs(v) < KAYDIRMA.ataletEsik || !(dt > 0)) return { v: 0, delta: 0 };
  const sonum = Math.exp(-dt / KAYDIRMA.ataletTau);
  const yeniV = v * sonum;
  return { v: Math.abs(yeniV) < KAYDIRMA.ataletEsik ? 0 : yeniV, delta: v * KAYDIRMA.ataletTau * (1 - sonum) };
}

// ── Klavye ───────────────────────────────────────────────────────────────────

/**
 * Klavyenin ilerleme etkisi (CLAUDE.md §3.5 tablosunun kaydırma satırları).
 * Çıktı: Δ birim, 'bas' / 'son' (Home / End) ya da null (bu tuş kaydırma tuşu değil: ← → Tab Enter Esc M3'te).
 */
export function klavyeAdimi(tus: string, shift: boolean): number | 'bas' | 'son' | null {
  switch (tus) {
    case 'ArrowDown':
      return KAYDIRMA.okAdim;
    case 'ArrowUp':
      return -KAYDIRMA.okAdim;
    case 'PageDown':
      return KAYDIRMA.sayfaAdim;
    case 'PageUp':
      return -KAYDIRMA.sayfaAdim;
    case ' ':
      return shift ? -KAYDIRMA.sayfaAdim : KAYDIRMA.sayfaAdim;
    case 'Home':
      return 'bas';
    case 'End':
      return 'son';
    default:
      return null;
  }
}
