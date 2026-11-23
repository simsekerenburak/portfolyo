// 3D parçasının giriş noktası (CLAUDE.md §2.2): giris.ts bunu dinamik import() ile indirir.
// Three.js yalnızca src/pcb/sahne3d/ altında içe aktarılır; yerleşim, kamera yolu ve renkler saf modüllerden gelir.
//
// M2 3. adım: en küçük gerçek sahne — tahta + bakır yollar (duzen.ts) + lens kaydırmalı kamera + iki sıcak ışık.
// Çipler, tabelalar, serigrafi ve Hakkımda paneli 4. adımda; gölge, kalite kademeleri 5. adımda; kaydırma döngüsü 4. adımda.
import {
  BoxGeometry,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { duzenKur, type Iz } from '../duzen';
import { KAMERA, lensKaydirma } from '../lens';
import { RENK_3D } from '../renkler';
import type { Sahne3d } from '../giris';
import type { PcbVerisi } from '../veri';

export interface KurSecenekleri {
  tuval: HTMLCanvasElement;
  veri: PcbVerisi;
  /** WebGL bağlamı kaybolursa (sürücü çöktü, GPU sıfırlandı): giriş betiği yedek sayfaya döner */
  kayboldu: () => void;
}

/** Bakır yol kalınlığı (tahtadan yükseklik) */
const YOL_KALINLIK = 0.035;

export async function kur({ tuval, veri, kayboldu }: KurSecenekleri): Promise<Sahne3d> {
  const duzen = duzenKur({ sapaklar: veri.sapaklar });
  const lens = lensKaydirma(KAMERA.gorunenFov, KAMERA.ufuk);

  const renderer = new WebGLRenderer({ canvas: tuval, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // Khronos PBR Neutral ton eşleme: marka renklerini (bakır, turuncu) kaydırmaz (CLAUDE.md §4.2)
  renderer.toneMapping = NeutralToneMapping;

  const sahne = new Scene();
  sahne.background = new Color(RENK_3D.zemin);
  sahne.fog = new Fog(RENK_3D.zemin, 30, 95);
  // Ortam ışığı (prototipteki gibi): kodla kurulan bir "oda"nın yumuşak yansıması. Yarı metal bakır onsuz kararıyor,
  // fazlasıyla beyaza dönüyordu; 0,28 şiddet prototipte ölçülen dengedir (§4.2). İndirilen doku yok, ışık kodla üretilir.
  const pmrem = new PMREMGenerator(renderer);
  const ortam = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  sahne.environment = ortam;
  sahne.environmentIntensity = 0.28;

  const kamera = new PerspectiveCamera(lens.tamFov, 1, KAMERA.yakin, KAMERA.uzak);
  kamera.position.set(0, KAMERA.yukseklik, duzen.anaHat.kameraNoktalari[0].z);
  kamera.lookAt(0, KAMERA.yukseklik, kamera.position.z + 1); // düz bakar, eğim yok

  // ── Malzemeler: bakır MAT (§4.2: kameraya yakın yerde beyaza dönmesin) ──
  const maske = new MeshStandardMaterial({ color: RENK_3D.maske, roughness: 0.85 });
  const bakir = new MeshStandardMaterial({ color: RENK_3D.bakir, metalness: 0.35, roughness: 0.7, envMapIntensity: 0.6 });
  const bakirKoyu = new MeshStandardMaterial({ color: RENK_3D.bakirKoyu, metalness: 0.35, roughness: 0.75, envMapIntensity: 0.6 });

  // ── Tahta: yerleşimin sınır kutusundan geniş ──
  const s = duzen.sinir;
  const tahta = new Mesh(new PlaneGeometry(s.x1 - s.x0 + 60, s.z1 - s.z0 + 60), maske);
  tahta.rotation.x = -Math.PI / 2;
  tahta.position.set((s.x0 + s.x1) / 2, 0, (s.z0 + s.z1) / 2);
  sahne.add(tahta);

  // ── Bakır yollar: her parça ince bir kutu (4. adımda InstancedMesh + yuvarlak uçlar) ──
  const yolCiz = (iz: Iz) => {
    const dx = iz.b.x - iz.a.x;
    const dz = iz.b.z - iz.a.z;
    const m = new Mesh(new BoxGeometry(iz.genislik, YOL_KALINLIK, Math.hypot(dx, dz)), iz.tur === 'yan' ? bakirKoyu : bakir);
    m.position.set((iz.a.x + iz.b.x) / 2, YOL_KALINLIK / 2, (iz.a.z + iz.b.z) / 2);
    m.rotation.y = Math.atan2(dx, dz);
    sahne.add(m);
  };
  duzen.izler.forEach(yolCiz);

  // ── Işık: sıcak gökyüzü/zemin + tek sıcak yönlü ışık ──
  sahne.add(new HemisphereLight(RENK_3D.isikGok, RENK_3D.zemin, 0.45));
  const gunes = new DirectionalLight(RENK_3D.isikGunes, 2.4);
  gunes.position.set(-9, 16, -4);
  sahne.add(gunes);

  // ── Boyut ve çizim ──
  const boyutla = () => {
    const W = tuval.clientWidth || window.innerWidth;
    const H = tuval.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false);
    kamera.aspect = W / (H * lens.tamOran);
    kamera.setViewOffset(W, H * lens.tamOran, 0, H * lens.ofsetOran, W, H);
    kamera.updateProjectionMatrix();
  };
  const ciz = () => renderer.render(sahne, kamera);
  const yenidenBoyutla = () => {
    boyutla();
    ciz();
  };
  boyutla();
  ciz();
  window.addEventListener('resize', yenidenBoyutla);

  const kayip = (olay: Event) => {
    olay.preventDefault();
    kayboldu();
  };
  tuval.addEventListener('webglcontextlost', kayip);

  return {
    yokEt() {
      window.removeEventListener('resize', yenidenBoyutla);
      tuval.removeEventListener('webglcontextlost', kayip);
      sahne.traverse((n) => {
        if (n instanceof Mesh) n.geometry.dispose();
      });
      maske.dispose();
      bakir.dispose();
      bakirKoyu.dispose();
      ortam.dispose();
      renderer.dispose();
      // Bağlamı hemen bırak (GPU belleği); dinleyici yukarıda kaldırıldı, kayboldu() tetiklenmez.
      renderer.forceContextLoss();
    },
  };
}
