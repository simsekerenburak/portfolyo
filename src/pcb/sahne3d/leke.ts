// Hazır yumuşak gölge lekeleri (CLAUDE.md §2.2, §8): gölge haritasının olmadığı Orta ve Düşük kademede çiplerin
// altına düşen yumuşak koyu leke. Tek bir küçük radyal gradyan dokusu, bütün çipler için tek InstancedMesh
// (1 çizim çağrısı). Işık kameranın arkasından geldiği için leke çipin biraz ilerisine kayar.
import { CanvasTexture, InstancedMesh, MeshBasicMaterial, Object3D, PlaneGeometry } from 'three';
import type { Duzen } from '../duzen';
import { RENK_3D } from '../renkler';

/** Lekenin çipten taşma payı (birim) ve ışık yönünde (ileri) kayması */
const PAY = 0.9;
const KAYMA = 0.35;

export function lekelerKur(duzen: Duzen): { mesh: InstancedMesh; yokEt(): void } {
  // 64 × 64 radyal gradyan: ortada koyu, kenarda saydam (renk malzemeden gelir, doku yalnızca saydamlık)
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    const r = g.createRadialGradient(32, 32, 4, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,0.75)');
    r.addColorStop(0.55, 'rgba(255,255,255,0.4)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
  }
  const doku = new CanvasTexture(c);
  const malzeme = new MeshBasicMaterial({ color: RENK_3D.golge, alphaMap: doku, transparent: true, depthWrite: false, toneMapped: false });
  const geo = new PlaneGeometry(1, 1);
  geo.rotateX(-Math.PI / 2);
  const mesh = new InstancedMesh(geo, malzeme, duzen.cipler.length);
  const o = new Object3D();
  duzen.cipler.forEach((cip, i) => {
    // Yolların (0,035) hemen üstünde; çizim sırası çiplerden önce (renderOrder) ve derinliğe yazmaz
    o.position.set(cip.merkez.x, 0.038, cip.merkez.z + KAYMA);
    o.scale.set((cip.yariX + PAY) * 2, 1, (cip.yariZ + PAY) * 2);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  });
  mesh.renderOrder = -1;
  return {
    mesh,
    yokEt() {
      geo.dispose();
      malzeme.dispose();
      doku.dispose();
    },
  };
}
