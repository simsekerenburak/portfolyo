// 3D katmanının sayfadan okuduğu kısa veri: sayfadaki JSON adası (CLAUDE.md §3.3).
//   <script type="application/json" id="pcb-veri">{ … }</script>
// Yerleşim için gereken her şey burada (sapak kimliği, tabeladaki sayı, öğelerin kimliği ve kısa adı).
// Kartların asıl metni burada YOK: 3D katmanı onu yedek sayfadaki <article>'dan alır (tek kaynak, metin kopyalanmaz).
// scripts/kontrol.mjs, adadaki her öğe kimliğinin sayfada bir <article aria-labelledby="<kimlik>-baslik"> karşılığı
// olduğunu denetler. Saf: DOM yok (tests/veri.test.ts).
import type { Ozet, PaftaOgesi } from '../pafta/tipler';

export interface PcbSapagi {
  /** bölümün kimliği ve adresi: "projeler" → /#projeler */
  id: string;
  /** tabeladaki ad: "Projeler" */
  ad: string;
  /** tabeladaki büyük sayı ve birimi: 4 · "proje" */
  sayi: number;
  birim: string;
  ogeler: { id: string; kisaAd: string }[];
}

export interface PcbVerisi {
  /** biçim sürümü: ada değişirse eski önbellekteki betik yanlış okumasın */
  surum: 1;
  sapaklar: PcbSapagi[];
}

export const PCB_VERI_KIMLIGI = 'pcb-veri';

/** Bölümlerin (yedek sayfadaki paftalarla aynı veri) adaya giden kısa hâli. */
export function pcbVerisiKur(bolumler: readonly { id: string; ad: string; ogeler: readonly PaftaOgesi[]; ozet: Ozet }[]): PcbVerisi {
  return {
    surum: 1,
    sapaklar: bolumler.map((b) => ({
      id: b.id,
      ad: b.ad,
      sayi: b.ozet.sayi,
      birim: b.ozet.etiket,
      ogeler: b.ogeler.map((o) => ({ id: o.id, kisaAd: o.kisaAd })),
    })),
  };
}

/**
 * JSON'u <script> içine güvenle yazar: "<" → <. Metinde "</script>" geçse bile etiket erken kapanmaz.
 * (JSON.parse <'yi yine "<" okur.)
 */
export function adaMetni(veri: PcbVerisi): string {
  return JSON.stringify(veri).replace(/</g, '\\u003c');
}

const metin = (x: unknown): x is string => typeof x === 'string' && x.length > 0;

/**
 * Adayı okur ve biçimini denetler. Bozuksa null döner (3D açılmaz, yedek sayfada kalınır); hata fırlatmaz.
 * Tarayıcıda çalışır: Zod yerine elle küçük bir denetim (giriş betiği ≤ 5 KB gz kalsın).
 */
export function pcbVerisiOku(json: string | null | undefined): PcbVerisi | null {
  if (!json) return null;
  let ham: unknown;
  try {
    ham = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof ham !== 'object' || ham === null) return null;
  const v = ham as { surum?: unknown; sapaklar?: unknown };
  if (v.surum !== 1 || !Array.isArray(v.sapaklar)) return null;
  for (const s of v.sapaklar as unknown[]) {
    if (typeof s !== 'object' || s === null) return null;
    const sp = s as Partial<Record<keyof PcbSapagi, unknown>>;
    if (!metin(sp.id) || !metin(sp.ad) || !metin(sp.birim) || typeof sp.sayi !== 'number' || !Array.isArray(sp.ogeler)) return null;
    for (const o of sp.ogeler as unknown[]) {
      if (typeof o !== 'object' || o === null) return null;
      const og = o as { id?: unknown; kisaAd?: unknown };
      if (!metin(og.id) || !metin(og.kisaAd)) return null;
    }
  }
  return ham as PcbVerisi;
}
