// src/sahne/sahne.ts ve src/sahne/ilkBetik.ts: pafta destesinin geçişleri (CLAUDE.md §3.1).
// İlk betik düz metin olduğu için sahte bir sayfada gerçekten ÇALIŞTIRILIR ve sonucu saf fonksiyonlarla
// karşılaştırılır: iki uygulama (satır içi betik ve modül) hiçbir durumda ayrışmamalı.
import { describe, expect, it } from 'vitest';
import { SAHNE_ILK_BETIK } from '../src/sahne/ilkBetik';
import {
  PAFTA_SIRASI,
  gecisTuru,
  hedefPafta,
  komsular,
  paftaKonumu,
  parcaKimligi,
  type PaftaKonumu,
} from '../src/sahne/sahne';
import { onceki, sonraki } from '../src/pafta/deste';

/** Öndeki pafta `on` iken bütün paftaların konumları. */
const konumlar = (on: number, n: number): PaftaKonumu[] => Array.from({ length: n }, (_, k) => paftaKonumu(k, on, n));

describe('PAFTA_SIRASI', () => {
  it('CLAUDE.md §3.1 sırası: Hakkımda, Projeler, Stajlar, Yetkinlikler, Belgeler', () => {
    expect(PAFTA_SIRASI).toEqual(['hakkimda', 'projeler', 'stajlar', 'yetkinlikler', 'belgeler']);
  });
});

describe('paftaKonumu: hangi pafta nerede', () => {
  it('açılış: Hakkımda önde, arkasında iki paftanın kenarı, Yetkinlikler gizli, Belgeler çıkan yerde', () => {
    expect(konumlar(0, 5)).toEqual(['on', 'orta', 'arka', 'gizli', 'cikan']);
  });

  it('→ (ileri): öndeki pafta "çıkan" yere kalkar, ortadaki öne gelir, gizli olan arkada belirir', () => {
    expect(konumlar(sonraki(0, 5), 5)).toEqual(['cikan', 'on', 'orta', 'arka', 'gizli']);
  });

  it('← (geri): çıkan yerdeki pafta öne iner, öndeki bir geri çekilir', () => {
    expect(konumlar(onceki(0, 5), 5)).toEqual(['orta', 'arka', 'gizli', 'cikan', 'on']);
  });

  it('her → geçişinde önden kalkan pafta "çıkan" yere gider, her ← geçişinde oradan öne gelir (n ≥ 4)', () => {
    for (let n = 4; n <= 7; n++) {
      for (let on = 0; on < n; on++) {
        expect(paftaKonumu(on, sonraki(on, n), n), `n=${n} on=${on} →`).toBe('cikan');
        expect(paftaKonumu(onceki(on, n), on, n), `n=${n} on=${on} ←`).toBe('cikan');
      }
    }
  });

  it('Belgeler\'den ileri → Hakkımda öne gelir (deste döner)', () => {
    expect(konumlar(sonraki(4, 5), 5)[0]).toBe('on');
  });

  it('her durumda: tam bir pafta önde, en fazla 3 pafta görünür, n ≥ 4 ise tam bir çıkan', () => {
    for (let n = 1; n <= 7; n++) {
      for (let on = 0; on < n; on++) {
        const k = konumlar(on, n);
        const sayi = (x: PaftaKonumu) => k.filter((y) => y === x).length;
        expect(k[on], `n=${n} on=${on}`).toBe('on');
        expect(sayi('on')).toBe(1);
        expect(sayi('on') + sayi('orta') + sayi('arka')).toBe(Math.min(n, 3));
        expect(sayi('cikan')).toBe(n >= 4 ? 1 : 0);
      }
    }
  });

  it('az paftalı deste: 3 paftada çıkan/gizli yok, öndeki → ile en arkaya gider', () => {
    expect(konumlar(0, 3)).toEqual(['on', 'orta', 'arka']);
    expect(konumlar(1, 3)).toEqual(['arka', 'on', 'orta']);
  });
});

describe('gecisTuru: ileri / geri / atla', () => {
  it.each([
    [0, 1, 'ileri'], // Hakkımda → Projeler
    [3, 4, 'ileri'],
    [4, 0, 'ileri'], // Belgeler → Hakkımda (döngü)
    [1, 0, 'geri'],
    [0, 4, 'geri'], // Hakkımda ← Belgeler (döngü)
    [0, 2, 'atla'], // sekmeyle uzaktaki paftaya: kısaltılmış geçiş
    [1, 3, 'atla'],
  ] as const)('%i → %i: %s', (eski, yeni, beklenen) => {
    expect(gecisTuru(eski, yeni, 5)).toBe(beklenen);
  });

  it('aynı pafta → geçiş yok (null)', () => {
    expect(gecisTuru(2, 2, 5)).toBeNull();
  });

  it('2 paftada komşu hem ileri hem geri: ileri sayılır', () => {
    expect(gecisTuru(0, 1, 2)).toBe('ileri');
    expect(gecisTuru(1, 0, 2)).toBe('ileri');
  });
});

describe('komsular: "← önceki / sonraki →" linkleri', () => {
  it('Hakkımda (ilk pafta): geri linki yok, ileri Projeler (taslaktaki gibi)', () => {
    expect(komsular(0, 5)).toEqual({ onceki: null, sonraki: 1 });
  });
  it('ortadaki pafta: iki komşu', () => {
    expect(komsular(2, 5)).toEqual({ onceki: 1, sonraki: 3 });
  });
  it('Belgeler (son pafta): ileri başa döner (Hakkımda)', () => {
    expect(komsular(4, 5)).toEqual({ onceki: 3, sonraki: 0 });
  });
  it('tek pafta: link yok', () => {
    expect(komsular(0, 1)).toEqual({ onceki: null, sonraki: null });
  });
});

describe('parcaKimligi: adresin #parçası', () => {
  it.each([
    ['#stajlar', 'stajlar'],
    ['stajlar', 'stajlar'],
    ['#projeler-simsek', 'projeler-simsek'],
    ['#a%20b', 'a b'],
    ['#%C3%A7', 'ç'],
    ['#%E0%A4%A', '%E0%A4%A'], // bozuk kodlama: hata fırlatmaz, olduğu gibi döner
  ])('%s → %s', (hash, beklenen) => {
    expect(parcaKimligi(hash)).toBe(beklenen);
  });

  it.each(['', '#'])('boş parça (%j) → null', (hash) => {
    expect(parcaKimligi(hash)).toBeNull();
  });
});

describe('hedefPafta: #parçanın gösterdiği pafta', () => {
  const idler = PAFTA_SIRASI;
  const iceren = (kimlik: string) => ({ 'projeler-simsek': 1, iletisim: 0 })[kimlik] ?? -1;

  it('pafta kimliği → o pafta', () => {
    expect(hedefPafta('stajlar', idler, iceren)).toBe(2);
  });
  it('paftanın içindeki bir öğe (kart, iletişim listesi) → onu içeren pafta', () => {
    expect(hedefPafta('projeler-simsek', idler, iceren)).toBe(1);
    expect(hedefPafta('iletisim', idler, iceren)).toBe(0);
  });
  it('tanınmayan ya da boş parça → −1 (pafta değişmez)', () => {
    expect(hedefPafta('yok', idler, iceren)).toBe(-1);
    expect(hedefPafta(null, idler, iceren)).toBe(-1);
    expect(hedefPafta('projeler-simsek', idler)).toBe(-1); // içeren sorulamıyorsa
  });
});

// ─── İlk betik (satır içi) ─────────────────────────────────────────────────
/** Betiğin dokunduğu kadarını taklit eden sahte DOM öğesi. */
class Oge {
  readonly nitelik = new Map<string, string>();
  inert = false;
  constructor(
    nitelikler: Record<string, string> = {},
    readonly cocuklar: Oge[] = [],
  ) {
    for (const [ad, deger] of Object.entries(nitelikler)) this.nitelik.set(ad, deger);
  }
  getAttribute(ad: string) {
    return this.nitelik.get(ad) ?? null;
  }
  setAttribute(ad: string, deger: string) {
    this.nitelik.set(ad, String(deger));
  }
  removeAttribute(ad: string) {
    this.nitelik.delete(ad);
  }
  hasAttribute(ad: string) {
    return this.nitelik.has(ad);
  }
  contains(o: Oge): boolean {
    return o === this || this.cocuklar.some((c) => c.contains(o));
  }
}

/**
 * Sahte sayfa: her paftanın içinde `<id>-baslik` başlığı; Hakkımda'da "iletisim", Projeler'de bir kart.
 * Betiği çalıştırır; paftaları, işaretleri ve hashchange dinleyicisini döndürür.
 */
function sahneKur(hash: string, idler: readonly string[] = PAFTA_SIRASI, sahneVar = true) {
  const kimlikler = new Map<string, Oge>();
  const paftalar = idler.map((id) => {
    const icerik = [new Oge({ id: `${id}-baslik` })];
    if (id === 'hakkimda') icerik.push(new Oge({ id: 'iletisim' }));
    if (id === 'projeler') icerik.push(new Oge({ id: 'projeler-simsek' }));
    for (const o of icerik) kimlikler.set(o.getAttribute('id')!, o);
    return new Oge({ 'data-sahne-paftasi': id }, icerik);
  });
  // İşaretler: her pafta için bir sekme linki ve bir gösterge noktası
  const isaretler = idler.flatMap((id) => [new Oge({ 'data-isaret': id }), new Oge({ 'data-isaret': id })]);
  const sahne = Object.assign(new Oge({ 'data-sahne': '' }, paftalar), {
    querySelectorAll: (secici: string) =>
      secici === '[data-sahne-paftasi]' ? paftalar : secici === '[data-isaret]' ? isaretler : [],
  });
  const document = {
    querySelector: (secici: string) => (sahneVar && secici === '[data-sahne]' ? sahne : null),
    getElementById: (id: string) => kimlikler.get(id) ?? null,
  };
  const location = { hash };
  const dinleyiciler: Record<string, () => void> = {};
  const addEventListener = (olay: string, f: () => void) => {
    dinleyiciler[olay] = f;
  };
  new Function('document', 'location', 'addEventListener', SAHNE_ILK_BETIK)(document, location, addEventListener);
  const durum = () => ({
    konumlar: paftalar.map((p) => p.getAttribute('data-konum')),
    inert: paftalar.map((p) => p.inert),
    isaretli: [...new Set(isaretler.filter((m) => m.getAttribute('aria-current') === 'true').map((m) => m.getAttribute('data-isaret')))],
  });
  return { sahne, location, dinleyiciler, durum };
}

describe('SAHNE_ILK_BETIK: ilk karede paftaları desteye dizer', () => {
  /** Saf fonksiyonlara göre beklenen ilk kare */
  const beklenen = (hash: string, idler: readonly string[] = PAFTA_SIRASI) => {
    const iceren = (kimlik: string) => idler.findIndex((id) => kimlik === `${id}-baslik` || (id === 'hakkimda' && kimlik === 'iletisim') || (id === 'projeler' && kimlik === 'projeler-simsek'));
    const k = hedefPafta(parcaKimligi(hash), idler, iceren);
    const on = k < 0 ? 0 : k;
    return { konumlar: konumlar(on, idler.length), inert: idler.map((_, i) => i !== on), isaretli: [idler[on]] };
  };

  it.each(['', '#', '#hakkimda', '#projeler', '#stajlar', '#yetkinlikler', '#belgeler', '#projeler-simsek', '#iletisim', '#stajlar-baslik', '#yok', '#%E0%A4%A'])(
    'adres %j → saf fonksiyonlarla aynı konumlar, inert ve işaret',
    (hash) => {
      const { sahne, durum } = sahneKur(hash);
      expect(durum()).toEqual(beklenen(hash));
      expect(sahne.getAttribute('data-sahne')).toBe('etkin');
    },
  );

  it('örnek: /#stajlar → Stajlar önde, Hakkımda çıkan yerde', () => {
    expect(sahneKur('#stajlar').durum().konumlar).toEqual(['gizli', 'cikan', 'on', 'orta', 'arka']);
  });

  it('her pafta sayısında (2–7) ve her öndeki paftada saf fonksiyonla aynı', () => {
    for (let n = 2; n <= 7; n++) {
      const idler = Array.from({ length: n }, (_, i) => `p${i}`);
      for (let on = 0; on < n; on++) {
        expect(sahneKur(`#p${on}`, idler).durum().konumlar, `n=${n} on=${on}`).toEqual(konumlar(on, n));
      }
    }
  });

  it('modül yüklenmeden adres değişirse konumları günceller; modül hazırsa (data-hazir) karışmaz', () => {
    const { sahne, location, dinleyiciler, durum } = sahneKur('#hakkimda');
    location.hash = '#belgeler';
    dinleyiciler.hashchange!();
    expect(durum()).toEqual(beklenen('#belgeler'));

    sahne.setAttribute('data-hazir', '');
    location.hash = '#projeler';
    dinleyiciler.hashchange!();
    expect(durum().isaretli).toEqual(['belgeler']);
  });

  it('tanınmayan #parçaya geçilince öndeki pafta değişmez', () => {
    const { location, dinleyiciler, durum } = sahneKur('#stajlar');
    location.hash = '#yok';
    dinleyiciler.hashchange!();
    expect(durum().isaretli).toEqual(['stajlar']);
  });

  it('sahne yoksa (ör. 404 sayfası) ya da tek pafta varsa hiçbir şeye dokunmaz', () => {
    expect(() => sahneKur('#stajlar', PAFTA_SIRASI, false)).not.toThrow();
    const tek = sahneKur('', ['hakkimda']);
    expect(tek.sahne.getAttribute('data-sahne')).toBe('');
    expect(tek.durum().konumlar).toEqual([null]);
  });
});
