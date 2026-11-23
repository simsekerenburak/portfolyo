// Ufkun üstü (Burak, 2026-11-23; CLAUDE.md §3.1): uzakta, sisin içinde kartın diğer parçalarının silüetleri:
// elektrolitik kondansatörler, büyük QFP çipler, bir USB-C ve bir pin header konnektörü, birkaç direnç.
// Yakına gelmezler: grup her karede kameranın z'sine taşınır (kamera ilerledikçe onlar da ufukta kalır).
// Işıksız düz renkler (malzeme.ts): yalnızca derinlik hissi verirler. Yerleşim sabit ve deterministik.
import { BoxGeometry, CylinderGeometry, Group, InstancedMesh, Object3D, type Material } from 'three';
import type { Malzemeler } from './malzeme';

/** Silüet şeridinin kameradan uzaklığı (sisin bitişinden — 95 — ötede) */
const UZAKLIK = 120;

interface Parca {
  /** kameraya göre: x yana, z ileri; y tabandan */
  x: number;
  z: number;
  /** boyutlar: kutu en/yükseklik/derinlik ya da silindir yarıçap/yükseklik */
  en: number;
  boy: number;
  derin?: number;
  /** silindiri yatır (direnç) */
  yatik?: boolean;
}

// Elle seçilmiş sabit yerleşim: ortadaki ana hat koridoru (|x| < 14) boş kalır, uzak ufuk açık görünsün.
const KONDANSATOR: Parca[] = [
  { x: -62, z: 6, en: 5, boy: 13 },
  { x: -48, z: -4, en: 3.5, boy: 9 },
  { x: 38, z: 2, en: 4.5, boy: 12 },
  { x: 74, z: 10, en: 6, boy: 15 },
  { x: -96, z: 14, en: 4, boy: 10 },
];
const QFP: Parca[] = [
  { x: -30, z: 8, en: 20, boy: 2.2, derin: 20 },
  { x: 58, z: -2, en: 16, boy: 2, derin: 16 },
  { x: 108, z: 18, en: 24, boy: 2.6, derin: 24 },
];
const USB_C: Parca[] = [{ x: 20, z: -6, en: 9, boy: 3.4, derin: 7 }];
const DIRENC: Parca[] = [
  { x: -18, z: -10, en: 0.9, boy: 4.2, yatik: true },
  { x: 26, z: 12, en: 0.9, boy: 4.2, yatik: true },
  { x: -78, z: -8, en: 1, boy: 5, yatik: true },
];
/** pin header: 2 × 8 ince dikey pim + plastik gövde */
const HEADER = { x: -16, z: 14, adim: 0.9 };

export function siluetlerKur(m: Malzemeler): Group {
  const grup = new Group();
  const o = new Object3D();
  const ornekler = (geo: CylinderGeometry | BoxGeometry, malzeme: Material, liste: Parca[], yerlestir: (p: Parca) => void) => {
    const mesh = new InstancedMesh(geo, malzeme, liste.length);
    liste.forEach((p, i) => {
      o.rotation.set(0, 0, 0);
      yerlestir(p);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    grup.add(mesh);
  };

  // Kondansatör gövdesi (açık yeşil) + üst kapak (kararmış bakır, ince)
  ornekler(new CylinderGeometry(1, 1, 1, 24), m.siluetAcik, KONDANSATOR, (p) => {
    o.position.set(p.x, p.boy / 2, UZAKLIK + p.z);
    o.scale.set(p.en, p.boy, p.en);
  });
  ornekler(new CylinderGeometry(1, 1, 1, 24), m.siluetBakir, KONDANSATOR, (p) => {
    o.position.set(p.x, p.boy + 0.15, UZAKLIK + p.z);
    o.scale.set(p.en * 0.92, 0.3, p.en * 0.92);
  });
  // QFP çipler ve USB-C (koyu)
  ornekler(new BoxGeometry(1, 1, 1), m.siluetKoyu, [...QFP, ...USB_C], (p) => {
    o.position.set(p.x, p.boy / 2, UZAKLIK + p.z);
    o.scale.set(p.en, p.boy, p.derin ?? p.en);
  });
  // Dirençler: yatık silindirler (kararmış bakır)
  ornekler(new CylinderGeometry(1, 1, 1, 16), m.siluetBakir, DIRENC, (p) => {
    o.position.set(p.x, p.en + 0.4, UZAKLIK + p.z);
    o.rotation.set(0, 0, Math.PI / 2);
    o.scale.set(p.en, p.boy, p.en);
  });
  // Pin header: koyu gövde + 16 pim
  const pimler: Parca[] = [];
  for (let sira = 0; sira < 2; sira++) {
    for (let k = 0; k < 8; k++) pimler.push({ x: HEADER.x + (k - 3.5) * HEADER.adim, z: HEADER.z + sira * HEADER.adim, en: 0.18, boy: 4.4 });
  }
  ornekler(new BoxGeometry(1, 1, 1), m.siluetKoyu, [{ x: HEADER.x, z: HEADER.z + HEADER.adim / 2, en: 8 * HEADER.adim, boy: 1.6, derin: 2 * HEADER.adim + 0.4 }], (p) => {
    o.position.set(p.x, p.boy / 2, UZAKLIK + p.z);
    o.scale.set(p.en, p.boy, p.derin ?? p.en);
  });
  ornekler(new BoxGeometry(1, 1, 1), m.siluetBakir, pimler, (p) => {
    o.position.set(p.x, p.boy / 2, UZAKLIK + p.z);
    o.scale.set(p.en, p.boy, p.en);
  });
  return grup;
}
