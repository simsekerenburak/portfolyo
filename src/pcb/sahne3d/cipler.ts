// Çipler (CLAUDE.md §3.1): Hakkımda (ana hattın başı), bölüm çipleri (sapak uçları), öğe çipleri (sapak içi,
// B seçeneği: krem etiketli küçük çipler), konnektör (İletişim, ana hattın sonu).
// Gövdeler ve bacaklar InstancedMesh (2 çizim çağrısı); her çipin üstündeki yazı ayrı bir düzlem + canvas dokusu.
import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  type Texture,
  type WebGLRenderer,
} from 'three';
import type { Cip, Duzen } from '../duzen';
import { RENK_3D } from '../renkler';
import type { PcbVerisi } from '../veri';
import type { Malzemeler } from './malzeme';
import { FONT, yaziDokusu, type Satir } from './yazi';

/** Çip gövdesinin tahtadan yüksekliği (bacakların üstünde 0,03 boşluk) */
const TABAN = 0.03;
const YUKSEKLIK = { hakkimda: 0.45, bolum: 0.45, oge: 0.3, konnektor: 0.9 } as const;

/** Yazının "yukarısı" (okunduğu yön): ana hatta +z (ileri), sapakta sapağın gidiş yönü (±x). */
type Yukari = { x: number; z: number };

interface Kurulum {
  cip: Cip;
  yukseklik: number;
  yukari: Yukari;
  /** bacakların dizildiği kenarlar: x = ±x kenarları, z = ±z kenarları */
  bacak: 'x' | 'z' | 'hepsi';
  satirlar: Satir[];
  /** etiket zemini (öğe çiplerinde krem etiket) */
  zemin?: string;
  /** yazı düzleminin çipe oranı */
  oran: [number, number];
}

export function ciplerKur(duzen: Duzen, veri: PcbVerisi, m: Malzemeler, renderer: WebGLRenderer, dil: string): { grup: Group; dokular: Texture[] } {
  const grup = new Group();
  const dokular: Texture[] = [];
  const buyuk = (t: string) => t.toLocaleUpperCase(dil);
  const kurulumlar: Kurulum[] = [];
  const bul = (id: string) => duzen.cipler.find((c) => c.id === id);

  const hakkimda = bul('hakkimda');
  if (hakkimda) {
    kurulumlar.push({
      cip: hakkimda,
      yukseklik: YUKSEKLIK.hakkimda,
      yukari: { x: 0, z: 1 },
      bacak: 'x',
      oran: [0.9, 0.8],
      satirlar: [
        { metin: buyuk(veri.metinler.ad), font: `600 84px ${FONT.baslik}`, y: 0.42, renk: RENK_3D.krem, aralik: 4 },
        { metin: veri.metinler.unvan, font: `500 46px ${FONT.govde}`, y: 0.66, renk: RENK_3D.turuncuYazi },
      ],
    });
  }
  for (const s of duzen.sapaklar) {
    const ad = veri.sapaklar.find((v) => v.id === s.id)?.ad ?? s.id;
    const yukari = { x: s.isaret, z: 0 };
    kurulumlar.push({
      cip: s.bolumCipi,
      yukseklik: YUKSEKLIK.bolum,
      yukari,
      bacak: 'z',
      oran: [0.85, 0.7],
      satirlar: [{ metin: buyuk(ad), font: `600 96px ${FONT.baslik}`, y: 0.5, renk: RENK_3D.krem, aralik: 6 }],
    });
    for (const o of s.ogeler) {
      kurulumlar.push({
        cip: o.cip,
        yukseklik: YUKSEKLIK.oge,
        yukari,
        bacak: 'hepsi',
        oran: [0.82, 0.42],
        zemin: RENK_3D.krem,
        satirlar: [{ metin: o.kisaAd, font: `600 60px ${FONT.govde}`, y: 0.52, renk: RENK_3D.etiketYazi }],
      });
    }
  }
  const konnektor = bul('konnektor');
  if (konnektor) {
    kurulumlar.push({
      cip: konnektor,
      yukseklik: YUKSEKLIK.konnektor,
      yukari: { x: 0, z: 1 },
      bacak: 'x',
      oran: [0.85, 0.7],
      satirlar: [{ metin: buyuk(veri.metinler.iletisim), font: `600 120px ${FONT.baslik}`, y: 0.5, renk: RENK_3D.krem, aralik: 8 }],
    });
  }

  // ── Gövdeler: birim kutu, örnek başına ölçek ──
  const govdeler = new InstancedMesh(new BoxGeometry(1, 1, 1), m.grafit, kurulumlar.length);
  const o = new Object3D();
  kurulumlar.forEach((k, i) => {
    o.position.set(k.cip.merkez.x, TABAN + k.yukseklik / 2, k.cip.merkez.z);
    o.scale.set(k.cip.yariX * 2, k.yukseklik, k.cip.yariZ * 2);
    o.updateMatrix();
    govdeler.setMatrixAt(i, o.matrix);
  });
  govdeler.castShadow = true;
  govdeler.receiveShadow = true;
  grup.add(govdeler);

  // ── Bacaklar: kenarlardan dışarı taşan küçük kalay kutular ──
  const bacaklar: Matrix4[] = [];
  const bacak = (x: number, z: number, disX: boolean) => {
    o.position.set(x, 0.05, z);
    o.scale.set(disX ? 0.34 : 0.16, 0.06, disX ? 0.16 : 0.34);
    o.updateMatrix();
    bacaklar.push(o.matrix.clone());
  };
  for (const k of kurulumlar) {
    const { merkez: c, yariX, yariZ } = k.cip;
    const adim = k.bacak === 'hepsi' ? 0.42 : 0.5;
    const dizi = (yari: number) => {
      const n = Math.max(1, Math.floor((yari * 2 - 0.3) / adim));
      return Array.from({ length: n }, (_, j) => (j - (n - 1) / 2) * adim);
    };
    if (k.bacak === 'x' || k.bacak === 'hepsi') {
      for (const yan of [-1, 1]) for (const dz of dizi(yariZ)) bacak(c.x + yan * (yariX + 0.12), c.z + dz, true);
    }
    if (k.bacak === 'z' || k.bacak === 'hepsi') {
      for (const yan of [-1, 1]) for (const dx of dizi(yariX)) bacak(c.x + dx, c.z + yan * (yariZ + 0.12), false);
    }
  }
  const bacakMesh = new InstancedMesh(new BoxGeometry(1, 1, 1), m.kalay, bacaklar.length);
  bacaklar.forEach((mt, i) => bacakMesh.setMatrixAt(i, mt));
  bacakMesh.castShadow = true;
  grup.add(bacakMesh);

  // ── Yazılar: çipin üstünde, "yukarısı" okunma yönüne dönük düz düzlem ──
  for (const k of kurulumlar) {
    // Yazının eni, okunma yönüne dik kenar; boyu okunma yönündeki kenar
    const boyuna = k.yukari.z !== 0 ? k.cip.yariZ : k.cip.yariX;
    const enine = k.yukari.z !== 0 ? k.cip.yariX : k.cip.yariZ;
    const en = enine * 2 * k.oran[0];
    const boy = boyuna * 2 * k.oran[1];
    // Doku genişliği (piksel): yakından okunan Hakkımda ve konnektör 1024; uzaktan görülen bölüm çipi 512, küçük
    // öğe etiketi 256. (İlk denemede hepsi 1024'tü: bölüm çiplerinin dokusu 1024 × 1227 → GPU belleği 58 MB'a çıktı.)
    const pikselEn = k.cip.tur === 'oge' ? 256 : k.cip.tur === 'bolum' ? 512 : 1024;
    const pikselBoy = Math.max(64, Math.round((pikselEn * boy) / en));
    const satirlar = k.satirlar.map((s) => ({ ...s, y: s.y * pikselBoy, font: olcekliFont(s.font, pikselEn / 1024) }));
    const doku = yaziDokusu(renderer, satirlar, pikselEn, pikselBoy, k.zemin);
    dokular.push(doku);
    const malzeme = new MeshStandardMaterial({
      map: doku,
      transparent: !k.zemin,
      roughness: 0.8,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const yazi = new Mesh(new PlaneGeometry(en, boy), malzeme);
    // Yatır (−90° x), sonra y etrafında döndür: düzlemin yerel +y'si dünyada yukari yönüne gelsin.
    // Euler 'YXZ': yerel y → Rx(−90°) → (0, 0, −1) → Ry(θ) → (−sin θ, 0, −cos θ) = (yukari.x, 0, yukari.z)
    yazi.rotation.set(-Math.PI / 2, Math.atan2(-k.yukari.x, -k.yukari.z), 0, 'YXZ');
    yazi.position.set(k.cip.merkez.x, TABAN + k.yukseklik + 0.004, k.cip.merkez.z);
    grup.add(yazi);
  }
  return { grup, dokular };
}

/** "600 84px <aile>" → piksel boyutunu ölçekler (küçük dokularda yazı orantılı kalsın) */
function olcekliFont(font: string, k: number): string {
  return font.replace(/(\d+(?:\.\d+)?)px/, (_, px: string) => `${Math.round(Number(px) * k)}px`);
}
