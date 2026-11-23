// Işık ve gölge (CLAUDE.md §2.2 çizim ilkeleri, §4.1 stüdyo hissi): sıcak gökyüzü/zemin ışığı + tek sıcak yönlü ışık.
// Yönlü ışık ("güneş") kamerayla birlikte taşınır: hep kameranın arkasından, sol üstten vurur. Böylece kameraya
// dönük çip yüzleri aydınlık kalır ve gölgeler ileri, sahnenin içine düşer. Gölge haritası yalnızca Yüksek kademede.
import { DirectionalLight, HemisphereLight, PCFShadowMap, type Scene, type WebGLRenderer } from 'three';
import { RENK_3D } from '../renkler';

/** Işığın odak noktasına göre yeri, kameranın yönüne bağlı eksenlerde: sola, yukarı, geriye (kameranın arkasına) */
const GUNES_KONUM = { sol: 9, yukari: 17, geri: 15 };
/** Odak noktası: kameranın ileri baktığı yönde bu kadar önde (gölge kutusu orayı ortalar) */
const ODAK_ILERI = 14;
/** Gölge kutusunun yarı boyu (birim) ve haritanın çözünürlüğü */
const GOLGE_YARI = 20;
/** 1024² derinlik haritası = 4 MB (2048² 16 MB'tı, §2.2 doku bütçesi 32 MB); 40 birimlik kutuda texel ≈ 4 cm, yumuşak gölge için yeterli */
const GOLGE_HARITA = 1024;

export function isikKur(sahne: Scene, renderer: WebGLRenderer) {
  const gok = new HemisphereLight(RENK_3D.isikGok, RENK_3D.zemin, 0.45);
  const gunes = new DirectionalLight(RENK_3D.isikGunes, 2.1);
  gunes.shadow.mapSize.set(GOLGE_HARITA, GOLGE_HARITA);
  Object.assign(gunes.shadow.camera, { left: -GOLGE_YARI, right: GOLGE_YARI, top: GOLGE_YARI, bottom: -GOLGE_YARI, near: 1, far: 70 });
  gunes.shadow.bias = -0.0005;
  gunes.shadow.normalBias = 0.02;
  renderer.shadowMap.type = PCFShadowMap;
  sahne.add(gok, gunes, gunes.target);

  return {
    /**
     * Güneşi kameraya göre yerleştirir. Odak F = kamera + ileri·ODAK_ILERI (tahta düzleminde);
     * güneş F + GUNES_KONUM'da, F'ye bakar. ileri: kameranın baktığı yatay birim yön (tx, tz).
     */
    guncelle(x: number, z: number, tx: number, tz: number) {
      const fx = x + tx * ODAK_ILERI;
      const fz = z + tz * ODAK_ILERI;
      // İleri yön f = (tx, tz) iken kameranın solu (tz, −tx): +z'ye bakarken sol +x (CLAUDE.md §3.1 koordinatları)
      const solX = tz;
      const solZ = -tx;
      gunes.position.set(
        fx + solX * GUNES_KONUM.sol - tx * GUNES_KONUM.geri,
        GUNES_KONUM.yukari,
        fz + solZ * GUNES_KONUM.sol - tz * GUNES_KONUM.geri,
      );
      gunes.target.position.set(fx, 0, fz);
      gunes.target.updateMatrixWorld();
    },
    /** Gölge haritası aç/kapa (kademe değişince). Malzemelerin yeniden derlenmesi gerekir: bir kerelik küçük takılma. */
    golge(acik: boolean) {
      if (renderer.shadowMap.enabled === acik) return;
      renderer.shadowMap.enabled = acik;
      gunes.castShadow = acik;
      sahne.traverse((n) => {
        const m = (n as { material?: { needsUpdate: boolean } | { needsUpdate: boolean }[] }).material;
        for (const x of Array.isArray(m) ? m : m ? [m] : []) x.needsUpdate = true;
      });
    },
    yokEt() {
      gunes.shadow.map?.dispose();
      gunes.dispose();
      gok.dispose();
    },
  };
}
