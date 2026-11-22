// tokens.css okuyucu: `--ad: değer;` bildirimlerini temalara ayırır.
//   light-dark(AÇIK, KOYU) → { acik: AÇIK, koyu: KOYU }
//   düz değer              → iki temada aynı

export type Tema = 'koyu' | 'acik';
export const TEMALAR: readonly Tema[] = ['koyu', 'acik'];

/** Parantez derinliğini gözeterek en üst düzeydeki virgüllerden böler: "rgba(1,2,3,.1), #fff" → 2 parça */
function ustDuzeyVirgulle(metin: string): string[] {
  const parcalar: string[] = [];
  let derinlik = 0;
  let bas = 0;
  for (let i = 0; i < metin.length; i++) {
    const c = metin[i];
    if (c === '(') derinlik++;
    else if (c === ')') derinlik--;
    else if (c === ',' && derinlik === 0) {
      parcalar.push(metin.slice(bas, i).trim());
      bas = i + 1;
    }
  }
  parcalar.push(metin.slice(bas).trim());
  return parcalar;
}

/** CSS metnindeki yorumları siler (yorumdaki örnek renkler teste karışmasın) */
export function yorumlariSil(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Tüm özel özellik bildirimlerini okur. Aynı ad birden çok kez geçerse (ör. tema bloklarında
 * yeniden tanımlanan açı) son değer kalır; renk token'ları dosyada tek kez tanımlanır.
 */
export function tokenlariOku(css: string): Map<string, Record<Tema, string>> {
  const sonuc = new Map<string, Record<Tema, string>>();
  for (const [, ad, ham] of yorumlariSil(css).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const deger = ham!.trim();
    const ld = /^light-dark\(([\s\S]*)\)$/.exec(deger);
    if (ld) {
      const parcalar = ustDuzeyVirgulle(ld[1]!);
      if (parcalar.length !== 2) throw new Error(`${ad}: light-dark() tam 2 değer almalı`);
      sonuc.set(ad!, { acik: parcalar[0]!, koyu: parcalar[1]! });
    } else {
      sonuc.set(ad!, { acik: deger, koyu: deger });
    }
  }
  return sonuc;
}

/** CSS metnindeki tüm renk literallerini (#hex, rgb(), rgba()) bulur — "mavi yok" taraması için */
export function renkLiteralleri(css: string): string[] {
  const temiz = yorumlariSil(css);
  return [...new Set(temiz.match(/#[0-9a-f]{8}\b|#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgba?\([^)]*\)/gi) ?? [])];
}
