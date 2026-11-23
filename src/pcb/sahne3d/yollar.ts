// Bakır yollar ve kavşak via'ları (CLAUDE.md §3.1). Her yol parçası bir kapsül: ince kutu + iki yuvarlak uç.
// Tekrarlayan parçalar InstancedMesh (§2.2): tek geometri, örnek başına matris → malzeme başına 2 çizim çağrısı.
import { BoxGeometry, CylinderGeometry, Group, InstancedMesh, Object3D, type Material } from 'three';
import type { Duzen, Iz } from '../duzen';
import type { Malzemeler } from './malzeme';

/** Bakır kalınlığı (tahtadan yükseklik) */
export const YOL_KALINLIK = 0.035;

/** Yol parçalarını tek bir malzemeyle çizer: kutular (gövde) + silindirler (yuvarlak uçlar). */
function izler(liste: readonly Iz[], malzeme: Material): InstancedMesh[] {
  const govde = new InstancedMesh(new BoxGeometry(1, 1, 1), malzeme, liste.length);
  const uclar = new InstancedMesh(new CylinderGeometry(0.5, 0.5, 1, 20), malzeme, liste.length * 2);
  const o = new Object3D();
  liste.forEach((iz, i) => {
    const dx = iz.b.x - iz.a.x;
    const dz = iz.b.z - iz.a.z;
    // Kutu: merkez ortada, uzun kenar yol yönünde (y ekseni etrafında atan2(dx, dz) döner)
    o.position.set((iz.a.x + iz.b.x) / 2, YOL_KALINLIK / 2, (iz.a.z + iz.b.z) / 2);
    o.rotation.set(0, Math.atan2(dx, dz), 0);
    o.scale.set(iz.genislik, YOL_KALINLIK, Math.hypot(dx, dz));
    o.updateMatrix();
    govde.setMatrixAt(i, o.matrix);
    // Uçlar: çapı yol genişliği kadar disk
    o.rotation.set(0, 0, 0);
    o.scale.set(iz.genislik, YOL_KALINLIK, iz.genislik);
    for (const [k, p] of [iz.a, iz.b].entries()) {
      o.position.set(p.x, YOL_KALINLIK / 2, p.z);
      o.updateMatrix();
      uclar.setMatrixAt(i * 2 + k, o.matrix);
    }
  });
  for (const x of [govde, uclar]) x.receiveShadow = true;
  return [govde, uclar];
}

export function yollarKur(duzen: Duzen, m: Malzemeler): Group {
  const grup = new Group();
  grup.add(...izler(duzen.izler.filter((i) => i.tur !== 'yan'), m.bakir));
  grup.add(...izler(duzen.izler.filter((i) => i.tur === 'yan'), m.bakirKoyu));

  // Kavşaklardaki turuncu via'lar (yolun biraz üstünde)
  const kavsak = duzen.sapaklar.map((s) => s.via);
  const vialar = new InstancedMesh(new CylinderGeometry(1, 1, 1, 32), m.turuncu, kavsak.length);
  const o = new Object3D();
  kavsak.forEach((v, i) => {
    o.position.set(v.merkez.x, 0.04, v.merkez.z);
    o.scale.set(v.yaricap, 0.07, v.yaricap);
    o.updateMatrix();
    vialar.setMatrixAt(i, o.matrix);
  });
  grup.add(vialar);
  return grup;
}
