// Lens kaydırma (shift lens, CLAUDE.md §5.8): kamera EĞİLMEDEN ufku ekranın üstten %34'üne koymak.
// Mimari fotoğraftaki shift objektif gibi: kamera dümdüz ileri bakar (dikey çizgiler dik kalır: tabela direkleri,
// çip kenarları), görüntü ise daha büyük, simetrik bir çerçevenin aşağı kaydırılmış bir dilimidir.
// Three.js'te: camera.fov = tamFov, camera.aspect = W / (H·tamOran), camera.setViewOffset(W, H·tamOran, 0, H·ofsetOran, W, H).
// Saf: Three.js yok (tests/lens.test.ts).
//
// Matematik (tanjant uzayında; ileri bakış ekseni 0, yukarı +):
//   Görünen pencerenin yüksekliği h = 2·tan(fov/2). Ufuk pencerenin üstünden r·h aşağıda (r = 0,34):
//     pencere [+r·h (üst) ... −(1 − r)·h (alt)].
//   Pencereyi içine alan, eksene SİMETRİK en küçük çerçevenin yarı boyu: y = (1 − r)·h (alt yarı büyük olan).
//     tamFov   = 2·atan(y)
//     tamOran  = 2y / h = 2·(1 − r)          (tam çerçeve / pencere yüksekliği)
//     ofsetOran = (y − r·h) / h = 1 − 2r     (pencerenin üst kenarı, tam çerçevenin üstünden, pencere boyu cinsinden)

export interface Lens {
  /** Three.js PerspectiveCamera.fov (derece): tam (simetrik) çerçevenin dikey açısı */
  tamFov: number;
  /** tam çerçeve yüksekliği / görünen pencere yüksekliği */
  tamOran: number;
  /** pencerenin üst kenarının tam çerçevedeki yeri (pencere yüksekliği cinsinden) */
  ofsetOran: number;
}

/**
 * Görünen dikey açı (derece) ve ufkun ekrandaki yeri (üstten oran, 0..0,5) → lens ayarı.
 * r > 0,5 olursa alt yarı küçük kalır; bu sitede ufuk hep üst yarıda.
 */
export function lensKaydirma(gorunenFov: number, ufuk: number): Lens {
  if (!(ufuk > 0 && ufuk <= 0.5)) throw new RangeError(`ufuk 0 ile 0,5 arasında olmalı: ${ufuk}`);
  const h = 2 * Math.tan(((gorunenFov / 2) * Math.PI) / 180);
  const y = (1 - ufuk) * h;
  return {
    tamFov: (2 * Math.atan(y) * 180) / Math.PI,
    tamOran: 2 * (1 - ufuk),
    ofsetOran: 1 - 2 * ufuk,
  };
}

/** Prototip: görünen dikey açı 54°, ufuk üstten %34 (Burak, 2026-11-23). */
export const KAMERA = {
  yukseklik: 1.6,
  gorunenFov: 54,
  ufuk: 0.34,
  yakin: 0.1,
  uzak: 160,
} as const;
