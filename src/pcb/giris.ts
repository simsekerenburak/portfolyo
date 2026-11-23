// Giriş betiği (CLAUDE.md §2.2): yedek sayfaya giden TEK 3D betiği. Küçük kalmalı (≤ 5 KB gz): Three.js'i
// içe AKTARMAZ; koşullar tutarsa 3D parçasını (sahne3d/kur.ts + Three.js) tarayıcı boşalınca dinamik import() ile indirir.
//
// Sıra:
//   1. Sunucudan yedek sayfa gelir (tam HTML); ilk boyama onunla olur, içerik hemen okunur.
//   2. Bu betik koşullara bakar (ucBoyutKarari). Tutmazsa yedek sayfada kalınır.
//   3. Tutarsa <html data-gorunum="yukleniyor">: ince bir yükleniyor çizgisi; sayfa bu arada kullanılabilir.
//   4. İlk 3D kare hazır → data-gorunum="3d": sahne yumuşakça belirir, yedek içerik görsel olarak gizlenir (DOM'da kalır).
//   5. Herhangi bir adım başarısızsa (indirme, istisna, webglcontextlost) yedek sayfa; konsola tek satır uyarı.
//
// Karar fonksiyonu ve seçim okuma/yazma saftır (tests/giris.test.ts); DOM'a dokunan kısım girisiCalistir()'da.
import { PCB_VERI_KIMLIGI, pcbVerisiOku, type PcbVerisi } from './veri';

/** 3D açılmıyorsa sebebi. */
export type Neden = 'duz-secildi' | 'hareket-azalt' | 'veri-tasarrufu' | 'webgl-yok' | 'veri-bozuk' | 'hata';

/** Ziyaretçinin kayıtlı seçimi: "Düz görünüm" ya da "3D'yi yine de aç" (hareket azaltma açıkken). */
export type Secim = 'duz' | '3d' | null;

export interface Kosullar {
  secim: Secim;
  /** prefers-reduced-motion: reduce */
  hareketAzalt: boolean;
  /** navigator.connection.saveData */
  veriTasarrufu: boolean;
  /** WebGL2 bağlamı kurulabiliyor mu (pahalı: yalnızca gerekirse sorulur) */
  webgl2: () => boolean;
  /** sayfadaki JSON adası okunabildi mi */
  veriVar: boolean;
}

/**
 * 3D açılsın mı? Sıra önemli: ucuz ve ziyaretçinin kendi seçimi olan koşullar önce, WebGL denemesi en sonda.
 *   "Düz görünüm" seçilmiş → hayır (en güçlü: ziyaretçinin açık isteği)
 *   hareket azaltma açık ve "3D'yi yine de aç" seçilmemiş → hayır
 *   veri tasarrufu → hayır (≈ 135 KB'lık 3D parçası indirilmez)
 *   ada bozuk → hayır; WebGL2 yok → hayır; aksi hâlde evet.
 */
export function ucBoyutKarari(k: Kosullar): { ac: true } | { ac: false; neden: Neden } {
  if (k.secim === 'duz') return { ac: false, neden: 'duz-secildi' };
  if (k.hareketAzalt && k.secim !== '3d') return { ac: false, neden: 'hareket-azalt' };
  if (k.veriTasarrufu) return { ac: false, neden: 'veri-tasarrufu' };
  if (!k.veriVar) return { ac: false, neden: 'veri-bozuk' };
  if (!k.webgl2()) return { ac: false, neden: 'webgl-yok' };
  return { ac: true };
}

/** Yedek sayfada "3D görünüm" düğmesi hangi sebeplerde görünür: ziyaretçinin değiştirebileceği iki durumda. */
export function geriAcilabilir(neden: Neden): boolean {
  return neden === 'duz-secildi' || neden === 'hareket-azalt';
}

export const SECIM_ANAHTARI = 'gorunum';

/** Kayıtlı seçimi okur. localStorage kapalı / yasaklı olabilir (gizli mod, çerez engeli): hata → null. */
export function secimOku(depo: () => Pick<Storage, 'getItem'>): Secim {
  try {
    const d = depo().getItem(SECIM_ANAHTARI);
    return d === 'duz' || d === '3d' ? d : null;
  } catch {
    return null;
  }
}

/** Seçimi yazar (null → siler). Yazılamazsa sessizce geçer: seçim bu sayfa açıkken yine uygulanır. */
export function secimYaz(depo: () => Pick<Storage, 'setItem' | 'removeItem'>, secim: Secim): void {
  try {
    if (secim === null) depo().removeItem(SECIM_ANAHTARI);
    else depo().setItem(SECIM_ANAHTARI, secim);
  } catch {
    /* depolama yok: seçim yalnızca bu sayfada geçerli */
  }
}

// ── DOM ──────────────────────────────────────────────────────────────────────

/** 3D parçasının dışa açtığı arayüz (sahne3d/kur.ts). */
export interface Sahne3d {
  yokEt(): void;
}

/** WebGL2 bağlamı kurulabiliyor mu? Yazılım çizicisine (çok yavaş) düşecekse hayır. Deneme bağlamı hemen bırakılır. */
function webgl2Var(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Tarayıcı boşalınca çalıştır (yoksa kısa bir gecikmeyle). */
const bosta = (is: () => void) =>
  'requestIdleCallback' in window ? window.requestIdleCallback(is, { timeout: 2000 }) : setTimeout(is, 200);

export function girisiCalistir(): void {
  const kok = document.documentElement;
  const pcb = document.querySelector<HTMLElement>('[data-pcb]');
  const ilkTuval = pcb?.querySelector<HTMLCanvasElement>('canvas');
  const yedek = document.querySelector<HTMLElement>('[data-yedek]');
  const duzDugmesi = pcb?.querySelector<HTMLButtonElement>('[data-duz-gorunum]');
  const ucDugmesi = document.querySelector<HTMLButtonElement>('[data-3d-ac]');
  if (!pcb || !ilkTuval || !yedek) return;
  /** o anki <canvas> (her açma denemesinde yenisiyle değişir) */
  let tuval: HTMLCanvasElement = ilkTuval;

  const depo = () => window.localStorage;
  const hareketSorgusu = window.matchMedia('(prefers-reduced-motion: reduce)');
  const veri = pcbVerisiOku(document.getElementById(PCB_VERI_KIMLIGI)?.textContent);
  let sahne: Sahne3d | null = null;
  /** her açma denemesinin numarası: eski bir deneme geç biterse (ziyaretçi bu arada "Düz görünüm"e bastı) yok sayılır */
  let deneme = 0;

  /** Hakkımda paneli: 3D'de yerinde kalır (§3.3), yedek sayfanın geri kalanı gezilemez olur. */
  const panel = document.getElementById('hakkimda');
  /**
   * 3D açıkken yedek sayfanın üst düzey parçaları inert olur (çift okuma olmasın, §3.4), Hakkımda'yı içeren hariç:
   * paneldeki "İletişime geç" ve linkler 3D'de de çalışır. inert bir atanın altındaki öğe kurtarılamadığı için
   * <main>'in kendisi değil, tek tek çocukları kilitlenir.
   */
  const yedegiKilitle = (kilit: boolean) => {
    const parcalar = yedek.querySelectorAll<HTMLElement>(':scope > * > *');
    for (const p of parcalar) p.inert = kilit && !(panel && p.contains(panel));
  };

  const yedegeDus = (neden: Neden) => {
    deneme++;
    sahne?.yokEt();
    sahne = null;
    kok.dataset.gorunum = 'yedek';
    yedegiKilitle(false);
    pcb.hidden = true;
    if (ucDugmesi) {
      ucDugmesi.hidden = !geriAcilabilir(neden);
      ucDugmesi.textContent = (neden === 'hareket-azalt' ? ucDugmesi.dataset.metinHareket : ucDugmesi.dataset.metinDuz) ?? '';
    }
  };

  const ac = (veri: PcbVerisi, hemen: boolean) => {
    const bu = ++deneme;
    // Her denemede yeni bir <canvas>: önceki denemenin (bırakılmış) WebGL bağlamı yeniden kullanılmasın.
    const yeni = tuval.cloneNode(false) as HTMLCanvasElement;
    tuval.replaceWith(yeni);
    tuval = yeni;
    kok.dataset.gorunum = 'yukleniyor';
    pcb.hidden = false;
    if (ucDugmesi) ucDugmesi.hidden = true;
    const yukle = async () => {
      try {
        const { kur } = await import('./sahne3d/kur');
        if (bu !== deneme) return;
        const s = await kur({ tuval: yeni, veri, panel, kok: pcb, kayboldu: () => yedegeDus('hata') });
        if (bu !== deneme) return void s.yokEt();
        sahne = s;
        // 3D'de sayfa kaymaz; Hakkımda paneli ekrandaki yerine (sayfanın başı) dönsün
        window.scrollTo(0, 0);
        kok.dataset.gorunum = '3d';
        // Yedek içerik DOM'da kalır (detay kartı metni oradan gelir) ama gezilemez: çift okuma olmasın (§3.4).
        yedegiKilitle(true);
      } catch (hata) {
        if (bu !== deneme) return;
        console.warn('3D açılamadı, düz görünümde kalınıyor:', hata);
        yedegeDus('hata');
      }
    };
    if (hemen) void yukle();
    else bosta(() => void yukle());
  };

  const dene = (hemen: boolean) => {
    const karar = ucBoyutKarari({
      secim: secimOku(depo),
      hareketAzalt: hareketSorgusu.matches,
      veriTasarrufu: (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true,
      webgl2: webgl2Var,
      veriVar: veri !== null,
    });
    if (karar.ac && veri) ac(veri, hemen);
    else if (!karar.ac) yedegeDus(karar.neden);
  };

  duzDugmesi?.addEventListener('click', () => {
    secimYaz(depo, 'duz');
    yedegeDus('duz-secildi');
    ucDugmesi?.focus();
  });
  ucDugmesi?.addEventListener('click', () => {
    // Hareket azaltma açıksa "yine de aç" seçimi kaydedilir; değilse yalnızca "düz" seçimi silinir.
    secimYaz(depo, hareketSorgusu.matches ? '3d' : null);
    dene(true);
  });

  dene(false);
}
