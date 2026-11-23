// Tabelalar (CLAUDE.md §3.1): kavşağın ~3 birim yanında, yerden 1,9 yükseklikte, turuncu çerçeveli yuvarlak yeşil
// levha; üstünde bölüm adı ve büyük sayı ("4 proje"). Levhanın yüzü ana hattaki kameraya (−z) bakar.
// M2'de tabelaya henüz tıklanamaz (sapağa giriş M3).
import {
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  TorusGeometry,
  type Texture,
  type WebGLRenderer,
} from 'three';
import type { Duzen } from '../duzen';
import { RENK_3D } from '../renkler';
import type { PcbVerisi } from '../veri';
import type { Malzemeler } from './malzeme';
import { FONT, yaziDokusu } from './yazi';

/** levha kalınlığı ve direğin levhanın arkasında kalması için öne alma */
const KALINLIK = 0.06;
const ONE = 0.1;

export function tabelalarKur(duzen: Duzen, veri: PcbVerisi, m: Malzemeler, renderer: WebGLRenderer, dil: string): { grup: Group; dokular: Texture[] } {
  const grup = new Group();
  const dokular: Texture[] = [];
  const n = duzen.tabelalar.length;
  const direkler = new InstancedMesh(new CylinderGeometry(0.05, 0.05, 1, 12), m.kalay, n);
  const levhalar = new InstancedMesh(new CylinderGeometry(1, 1, KALINLIK, 48), m.tabela, n);
  const cerceveler = new InstancedMesh(new TorusGeometry(1, 0.07, 12, 64), m.turuncu, n);
  const o = new Object3D();

  duzen.tabelalar.forEach((t, i) => {
    const { x, z } = t.direk;
    const yaricap = t.yaricap;
    // direk: yerden levhanın merkezine
    o.rotation.set(0, 0, 0);
    o.position.set(x, t.yukseklik / 2, z);
    o.scale.set(1, t.yukseklik, 1);
    o.updateMatrix();
    direkler.setMatrixAt(i, o.matrix);
    // levha: silindir x ekseni etrafında 90° döner → düz yüzü ±z'ye bakar
    o.rotation.set(Math.PI / 2, 0, 0);
    o.position.set(x, t.yukseklik, z - ONE);
    o.scale.set(yaricap, 1, yaricap);
    o.updateMatrix();
    levhalar.setMatrixAt(i, o.matrix);
    // çerçeve: halka zaten xy düzleminde
    o.rotation.set(0, 0, 0);
    o.scale.set(yaricap, yaricap, 1);
    o.updateMatrix();
    cerceveler.setMatrixAt(i, o.matrix);

    // yüz: ad, büyük sayı, birim (canvas dokusu, saydam)
    const s = veri.sapaklar.find((v) => v.id === t.sapakId);
    const doku = yaziDokusu(
      renderer,
      [
        { metin: (s?.ad ?? t.sapakId).toLocaleUpperCase(dil), font: `600 58px ${FONT.baslik}`, y: 150, renk: RENK_3D.krem, aralik: 3 },
        { metin: String(s?.sayi ?? ''), font: `600 200px ${FONT.baslik}`, y: 292, renk: RENK_3D.turuncuYazi },
        { metin: s?.birim ?? '', font: `500 50px ${FONT.govde}`, y: 410, renk: RENK_3D.krem },
      ],
      512,
      512,
    );
    dokular.push(doku);
    const yuz = new Mesh(
      new PlaneGeometry(yaricap * 1.7, yaricap * 1.7),
      new MeshStandardMaterial({ map: doku, transparent: true, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 }),
    );
    yuz.position.set(x, t.yukseklik, z - ONE - KALINLIK / 2 - 0.004);
    yuz.rotation.y = Math.PI; // düzlemin yüzü +z'ye bakar; çevir → kameraya (−z)
    grup.add(yuz);
  });
  for (const x of [direkler, levhalar, cerceveler]) x.castShadow = true;
  grup.add(direkler, levhalar, cerceveler);
  return { grup, dokular };
}
