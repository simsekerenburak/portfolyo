// Kaydırma döngüsü (CLAUDE.md §5.8, §2.2): girdi → hedef s → kamera yayla izler → kare çizilir.
// İsteğe bağlı çizim: kamera hareket etmiyorsa döngü durur (pil); yeni girdi gelince yeniden başlar.
// Girdinin mantığı saf modüllerde (kaydirma.ts, yay.ts, yol.ts); burası yalnızca DOM olaylarını onlara bağlar.
// M2: yalnızca ana hat (sapaklara giriş M3'te, kamera durum makinesiyle).
import type { Object3D, PerspectiveCamera } from 'three';
import { oturdu, SERTLIK, yay } from '../../hareket/yay';
import { KAMERA } from '../lens';
import {
  ataletAdim,
  dokunmaBasla,
  dokunmaHareket,
  dokunmaHizi,
  hedefIlerlet,
  KAYDIRMA,
  klavyeAdimi,
  tekerlekPikseli,
  type Dokunma,
} from '../kaydirma';
import { noktaAl, type Yol } from '../yol';

/** Hakkımda paneli kameranın bu aralığında söner (s, birim): çip z = 10'da, kamera onun üstünden geçerken biter. */
const PANEL_SONUM = { bas: 1.5, son: 7 };
/** İleri bakış: kamera yolun bu kadar ilerisine bakar (düz yolda yön değişmez; M3 virajlarında yumuşatır). */
const ILERI_BAKIS = 10;

export interface DonguSecenekleri {
  kamera: PerspectiveCamera;
  yol: Yol;
  ciz: () => void;
  /** kamerayla birlikte z'de taşınan nesneler (ufuk silüetleri) */
  takipciler: Object3D[];
  /** Hakkımda paneli (HTML): kamera ilerledikçe söner */
  panel: HTMLElement | null;
  /** s değerinin yazıldığı öğe: data-s (durunca), data-hareket (hareket ederken); uçtan uca deneme okur */
  kok: HTMLElement;
}

export function donguKur(sec: DonguSecenekleri) {
  const { kamera, yol, ciz, takipciler, panel, kok } = sec;
  const L = yol.uzunluk;
  const hareketAzalt = window.matchMedia('(prefers-reduced-motion: reduce)');
  let s = 0;
  let v = 0;
  let hedef = 0;
  let atalet = 0;
  let dokunma: Dokunma | null = null;
  let calisiyor = false;
  let onceki = 0;
  let panelOpaklik = -1;

  /** Kamerayı yolun s noktasına koyar: yükseklik 1,6, yolun ilerisine bakar (eğim yok, yuvarlanma yok). */
  const kameraKoy = () => {
    const p = noktaAl(yol, s);
    const ileri = noktaAl(yol, s + ILERI_BAKIS);
    kamera.position.set(p.x, KAMERA.yukseklik, p.z);
    // Yolun ucunda ileri bakış noktası kameraya yaklaşır: teğet yönünde uzat
    const kalan = Math.hypot(ileri.x - p.x, ileri.z - p.z);
    const uzat = ILERI_BAKIS - kalan;
    kamera.lookAt(ileri.x + ileri.tx * uzat, KAMERA.yukseklik, ileri.z + ileri.tz * uzat);
    for (const t of takipciler) t.position.z = p.z;
    // Hakkımda paneli: opaklık = 1 − (s − baş)/(son − baş), [0, 1]
    if (panel) {
      const o = Math.min(1, Math.max(0, 1 - (s - PANEL_SONUM.bas) / (PANEL_SONUM.son - PANEL_SONUM.bas)));
      if (o !== panelOpaklik) {
        panelOpaklik = o;
        panel.style.opacity = String(o);
        // Görünmeyen panelin linkleri Tab ile odaklanmasın, ekran okuyucu okumasın
        panel.inert = o < 0.05;
        panel.style.visibility = o === 0 ? 'hidden' : '';
      }
    }
  };

  const kare = (zaman: number) => {
    const dt = onceki ? (zaman - onceki) / 1000 : 1 / 60;
    onceki = zaman;
    if (atalet !== 0) {
      const a = ataletAdim(atalet, dt);
      atalet = a.v;
      hedef = hedefIlerlet(hedef, s, a.delta, L);
    }
    if (hareketAzalt.matches) {
      // Hareket azaltma + "3D'yi yine de aç": animasyon yok, kamera hedefe anında konur (§3.2)
      s = hedef;
      v = 0;
    } else {
      [s, v] = yay(s, v, hedef, SERTLIK.kameraIlerleme, dt);
    }
    const durdu = atalet === 0 && oturdu(s, v, hedef, 1e-3);
    if (durdu) {
      s = hedef;
      v = 0;
    }
    kameraKoy();
    ciz();
    if (durdu) {
      calisiyor = false;
      onceki = 0;
      kok.dataset.s = s.toFixed(2);
      delete kok.dataset.hareket;
    } else {
      requestAnimationFrame(kare);
    }
  };

  const uyandir = () => {
    if (calisiyor) return;
    calisiyor = true;
    // Kamera hareket ederken işaret (uçtan uca deneme durmasını bekler; data-s yalnızca durunca yazılır)
    kok.dataset.hareket = '';
    onceki = 0;
    requestAnimationFrame(kare);
  };
  const ilerle = (delta: number) => {
    hedef = hedefIlerlet(hedef, s, delta, L);
    uyandir();
  };

  // ── Tekerlek: sayfa kaymaz, kamera ilerler (yalnızca 3D açıkken; dinleyici yokEt'te kalkar) ──
  const tekerlek = (e: WheelEvent) => {
    if (e.ctrlKey) return; // Ctrl + tekerlek: tarayıcı yakınlaştırması
    e.preventDefault();
    atalet = 0;
    ilerle(tekerlekPikseli(e.deltaY, e.deltaMode, window.innerHeight) * KAYDIRMA.birimPx);
  };

  // ── Dokunma: dikey sürükleme ilerletir, parmak kalkınca atalet. Pencerede dinlenir: parmak Hakkımda panelinin
  //    üstünde de olsa kaydırır (telefonda panel ekranın büyük kısmını kaplar). Dokunup bırakma (tıklama) etkilenmez. ──
  const dokunmaBaslat = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t || e.touches.length > 1) return;
    atalet = 0;
    dokunma = dokunmaBasla(t.clientY, e.timeStamp / 1000);
  };
  const dokunmaSurdur = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!dokunma || !t) return;
    e.preventDefault();
    const r = dokunmaHareket(dokunma, t.clientY, e.timeStamp / 1000);
    dokunma = r.durum;
    ilerle(r.delta);
  };
  const dokunmaBitir = (e: TouchEvent) => {
    if (!dokunma) return;
    atalet = dokunmaHizi(dokunma, e.timeStamp / 1000);
    dokunma = null;
    if (atalet !== 0) uyandir();
  };

  // ── Klavye: ↓ ↑ PageDown PageUp Space Home End (§3.5). Yazı alanları ve değiştirici tuşlar tarayıcıya kalır. ──
  const klavye = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
    const hedefOge = e.target instanceof HTMLElement ? e.target : null;
    if (hedefOge?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
    // Odak bir düğme ya da linkteyse Space ve Enter onu çalıştırır
    if (e.key === ' ' && hedefOge?.closest('button, a[href], summary')) return;
    const adim = klavyeAdimi(e.key, e.shiftKey);
    if (adim === null) return;
    e.preventDefault();
    atalet = 0;
    if (adim === 'bas' || adim === 'son') {
      // Home / End: hattın başı / sonu (§3.5). "Önde en fazla 12" sınırı burada uygulanmaz; yol boyunca yay taşır.
      hedef = adim === 'bas' ? 0 : L;
      uyandir();
    } else ilerle(adim);
  };

  const boyut = () => uyandir();

  window.addEventListener('wheel', tekerlek, { passive: false });
  window.addEventListener('touchstart', dokunmaBaslat, { passive: true });
  window.addEventListener('touchmove', dokunmaSurdur, { passive: false });
  window.addEventListener('touchend', dokunmaBitir);
  window.addEventListener('touchcancel', dokunmaBitir);
  window.addEventListener('keydown', klavye);
  window.addEventListener('resize', boyut);

  kameraKoy();
  kok.dataset.s = s.toFixed(2);

  return {
    /** bir kare çizdirir (boyut değişince, dokular hazır olunca) */
    uyandir,
    yokEt() {
      window.removeEventListener('wheel', tekerlek);
      window.removeEventListener('touchstart', dokunmaBaslat);
      window.removeEventListener('touchmove', dokunmaSurdur);
      window.removeEventListener('touchend', dokunmaBitir);
      window.removeEventListener('touchcancel', dokunmaBitir);
      window.removeEventListener('keydown', klavye);
      window.removeEventListener('resize', boyut);
      if (panel) {
        panel.style.opacity = '';
        panel.style.visibility = '';
        panel.inert = false;
      }
      delete kok.dataset.s;
      delete kok.dataset.hareket;
    },
  };
}
