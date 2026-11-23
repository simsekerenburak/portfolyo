// Tahta (lehim maskesi), serigrafi ızgarası (5 birim) ve dağınık via'lar (CLAUDE.md §3.1 "Zemin").
// Tahta yerleşimden çok büyük çizilir: ufka kadar uzanır, uzak kısmı siste kaybolur.
import {
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  Object3D,
  PlaneGeometry,
} from 'three';
import type { Duzen } from '../duzen';
import { RENK_3D } from '../renkler';
import type { Malzemeler } from './malzeme';

/** Tahtanın yerleşim kutusundan taşan payı: yanlara ve ileriye (ufka) */
const PAY = { yan: 160, ileri: 200, geri: 30 };
const IZGARA = 5;

export function tahtaKur(duzen: Duzen, m: Malzemeler): Group {
  const grup = new Group();
  const s = duzen.sinir;
  const x0 = s.x0 - PAY.yan;
  const x1 = s.x1 + PAY.yan;
  const z0 = s.z0 - PAY.geri;
  const z1 = s.z1 + PAY.ileri;

  const tahta = new Mesh(new PlaneGeometry(x1 - x0, z1 - z0), m.maske);
  tahta.rotation.x = -Math.PI / 2;
  tahta.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
  tahta.receiveShadow = true;
  grup.add(tahta);

  // Serigrafi ızgarası: krem, çok saydam çizgiler (tek çizim çağrısı). Yerleşim kutusunun biraz dışına kadar.
  const iz: number[] = [];
  const ix0 = Math.floor((s.x0 - 40) / IZGARA) * IZGARA;
  const ix1 = Math.ceil((s.x1 + 40) / IZGARA) * IZGARA;
  const iz0 = Math.floor((s.z0 - 10) / IZGARA) * IZGARA;
  const iz1 = Math.ceil((s.z1 + 60) / IZGARA) * IZGARA;
  for (let x = ix0; x <= ix1; x += IZGARA) iz.push(x, 0.003, iz0, x, 0.003, iz1);
  for (let z = iz0; z <= iz1; z += IZGARA) iz.push(ix0, 0.003, z, ix1, 0.003, z);
  const izgaraGeo = new BufferGeometry();
  izgaraGeo.setAttribute('position', new Float32BufferAttribute(iz, 3));
  grup.add(new LineSegments(izgaraGeo, new LineBasicMaterial({ color: RENK_3D.krem, transparent: true, opacity: 0.06 })));

  // Dağınık via'lar (duzen.ts deterministik yerleştirdi; kavşak via'ları yollar.ts'te turuncu çizilir)
  const dag = duzen.vialar.filter((v) => v.id.startsWith('dag-'));
  const vialar = new InstancedMesh(new CylinderGeometry(1, 1, 1, 16), m.altin, dag.length);
  const o = new Object3D();
  dag.forEach((v, i) => {
    o.position.set(v.merkez.x, 0.025, v.merkez.z);
    o.scale.set(v.yaricap, 0.05, v.yaricap);
    o.updateMatrix();
    vialar.setMatrixAt(i, o.matrix);
  });
  grup.add(vialar);
  return grup;
}
