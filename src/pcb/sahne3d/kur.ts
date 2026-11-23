// 3D parçasının giriş noktası (CLAUDE.md §2.2): giris.ts bunu dinamik import() ile indirir.
// Three.js yalnızca src/pcb/sahne3d/ altında içe aktarılır; yerleşim, kamera yolu, kaydırma ve renkler saf modüllerden.
//
// Sahnenin parçaları: tahta.ts (tahta, ızgara, dağınık via) · yollar.ts (bakır yollar, kavşak via'ları) ·
// cipler.ts (Hakkımda, bölüm, öğe, konnektör) · tabelalar.ts · siluetler.ts (ufkun üstü) · dongu.ts (kaydırma).
// Işık ayarı ve gölge 5. adımda isik.ts / kalite.ts'e taşınacak.
import {
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  LineSegments,
  Mesh,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  WebGLRenderer,
  type Material,
  type Texture,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { duzenKur, OLCU } from '../duzen';
import type { Sahne3d } from '../giris';
import { KAMERA, lensKaydirma } from '../lens';
import { RENK_3D } from '../renkler';
import type { PcbVerisi } from '../veri';
import { yolKur } from '../yol';
import { ciplerKur } from './cipler';
import { donguKur } from './dongu';
import { malzemelerKur } from './malzeme';
import { siluetlerKur } from './siluetler';
import { tabelalarKur } from './tabelalar';
import { tahtaKur } from './tahta';
import { yollarKur } from './yollar';
import { fontlariBekle } from './yazi';

export interface KurSecenekleri {
  tuval: HTMLCanvasElement;
  veri: PcbVerisi;
  /** Hakkımda paneli (yedek sayfadaki #hakkimda bölümü; 3D'de yerinde kalır, kamera ilerledikçe söner) */
  panel: HTMLElement | null;
  /** 3D katmanının kökü ([data-pcb]); kameranın s değeri data-s olarak yazılır */
  kok: HTMLElement;
  /** WebGL bağlamı kaybolursa (sürücü çöktü, GPU sıfırlandı): giriş betiği yedek sayfaya döner */
  kayboldu: () => void;
}

export async function kur({ tuval, veri, panel, kok, kayboldu }: KurSecenekleri): Promise<Sahne3d> {
  const dil = document.documentElement.lang || 'tr';
  const duzen = duzenKur({ sapaklar: veri.sapaklar });
  const lens = lensKaydirma(KAMERA.gorunenFov, KAMERA.ufuk);
  // Serigrafi dokuları sitenin fontlarıyla çizilsin (en fazla 1,5 sn beklenir)
  await fontlariBekle();

  const renderer = new WebGLRenderer({ canvas: tuval, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // Khronos PBR Neutral ton eşleme: marka renklerini (bakır, turuncu) kaydırmaz (CLAUDE.md §4.2)
  renderer.toneMapping = NeutralToneMapping;

  const sahne = new Scene();
  sahne.background = new Color(RENK_3D.zemin);
  sahne.fog = new Fog(RENK_3D.zemin, 30, 95);
  // Ortam ışığı: kodla kurulan bir "oda"nın yumuşak yansıması (indirilen doku yok). Yarı metal bakır onsuz kararıyor,
  // fazlasıyla beyaza dönüyordu; 0,28 prototipte ölçülen dengedir (§4.2).
  const pmrem = new PMREMGenerator(renderer);
  const ortam = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  sahne.environment = ortam;
  sahne.environmentIntensity = 0.28;

  const kamera = new PerspectiveCamera(lens.tamFov, 1, KAMERA.yakin, KAMERA.uzak);
  const m = malzemelerKur();
  const dokular: Texture[] = [ortam];

  sahne.add(tahtaKur(duzen, m));
  sahne.add(yollarKur(duzen, m));
  const cipler = ciplerKur(duzen, veri, m, renderer, dil);
  const tabelalar = tabelalarKur(duzen, veri, m, renderer, dil);
  sahne.add(cipler.grup, tabelalar.grup);
  dokular.push(...cipler.dokular, ...tabelalar.dokular);
  const siluetler = siluetlerKur(m);
  sahne.add(siluetler);

  // ── Işık: sıcak gökyüzü/zemin + tek sıcak yönlü ışık (gölge 5. adımda) ──
  sahne.add(new HemisphereLight(RENK_3D.isikGok, RENK_3D.zemin, 0.45));
  const gunes = new DirectionalLight(RENK_3D.isikGunes, 2.4);
  gunes.position.set(-9, 16, -4);
  sahne.add(gunes);

  // ── Boyut, çizim ve kaydırma döngüsü ──
  const boyutla = () => {
    const W = tuval.clientWidth || window.innerWidth;
    const H = tuval.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false);
    kamera.aspect = W / (H * lens.tamOran);
    kamera.setViewOffset(W, H * lens.tamOran, 0, H * lens.ofsetOran, W, H);
    kamera.updateProjectionMatrix();
  };
  const ciz = () => renderer.render(sahne, kamera);
  boyutla();
  const yol = yolKur(duzen.anaHat.kameraNoktalari, OLCU.kameraYaricap);
  const dongu = donguKur({ kamera, yol, ciz, takipciler: [siluetler], panel, kok });
  // Gölgesiz ve ışıklar sabitken GPU'da derlenmesi gereken her şey ilk karede derlensin (ilk kaydırmada takılmasın)
  renderer.compile(sahne, kamera);
  ciz();
  const yenidenBoyutla = () => {
    boyutla();
    ciz();
  };
  window.addEventListener('resize', yenidenBoyutla);

  const kayip = (olay: Event) => {
    olay.preventDefault();
    kayboldu();
  };
  tuval.addEventListener('webglcontextlost', kayip);

  return {
    yokEt() {
      dongu.yokEt();
      window.removeEventListener('resize', yenidenBoyutla);
      tuval.removeEventListener('webglcontextlost', kayip);
      const paylasilan = new Set<unknown>(Object.values(m));
      sahne.traverse((n) => {
        // Mesh, InstancedMesh ve LineSegments: geometri her zaman, malzeme paylaşılmıyorsa (yazı düzlemi, ızgara)
        if (n instanceof Mesh || n instanceof LineSegments) {
          n.geometry.dispose();
          if (!paylasilan.has(n.material)) (n.material as Material).dispose();
        }
      });
      m.yokEt();
      for (const d of dokular) d.dispose();
      renderer.dispose();
      // Bağlamı hemen bırak (GPU belleği); dinleyici yukarıda kaldırıldı, kayboldu() tetiklenmez.
      renderer.forceContextLoss();
    },
  };
}
