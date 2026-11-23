// src/pcb/giris.ts: 3D açılsın mı kararı ve ziyaretçi seçiminin saklanması (CLAUDE.md §2.2, §3.4).
import { describe, expect, it, vi } from 'vitest';
import { SECIM_ANAHTARI, geriAcilabilir, secimOku, secimYaz, ucBoyutKarari, type Kosullar } from '../src/pcb/giris';

/** Her şeyin 3D'ye uygun olduğu durum; testler tek bir koşulu bozar. */
const uygun = (degisiklik: Partial<Kosullar> = {}): Kosullar => ({
  secim: null,
  hareketAzalt: false,
  veriTasarrufu: false,
  webgl2: () => true,
  veriVar: true,
  ...degisiklik,
});

describe('ucBoyutKarari', () => {
  it('her koşul uygunsa 3D açılır', () => {
    expect(ucBoyutKarari(uygun())).toEqual({ ac: true });
  });

  it.each([
    ['Düz görünüm seçilmiş', { secim: 'duz' as const }, 'duz-secildi'],
    ['hareket azaltma', { hareketAzalt: true }, 'hareket-azalt'],
    ['veri tasarrufu', { veriTasarrufu: true }, 'veri-tasarrufu'],
    ['JSON adası bozuk', { veriVar: false }, 'veri-bozuk'],
    ['WebGL2 yok', { webgl2: () => false }, 'webgl-yok'],
  ])('%s → yedek sayfa', (_ad, degisiklik, neden) => {
    expect(ucBoyutKarari(uygun(degisiklik))).toEqual({ ac: false, neden });
  });

  it('hareket azaltma + "3D\'yi yine de aç" → açılır', () => {
    expect(ucBoyutKarari(uygun({ hareketAzalt: true, secim: '3d' }))).toEqual({ ac: true });
  });

  it('"Düz görünüm" her şeyden güçlü (3D seçimi kaydedilmiş olsa bile kendisi kayıtlıdır)', () => {
    expect(ucBoyutKarari(uygun({ secim: 'duz', hareketAzalt: true }))).toEqual({ ac: false, neden: 'duz-secildi' });
  });

  it('WebGL denemesi pahalı: önceki bir koşul tutmuyorsa hiç denenmez', () => {
    const webgl2 = vi.fn(() => true);
    ucBoyutKarari(uygun({ secim: 'duz', webgl2 }));
    ucBoyutKarari(uygun({ hareketAzalt: true, webgl2 }));
    ucBoyutKarari(uygun({ veriTasarrufu: true, webgl2 }));
    expect(webgl2).not.toHaveBeenCalled();
    ucBoyutKarari(uygun({ webgl2 }));
    expect(webgl2).toHaveBeenCalledTimes(1);
  });
});

describe('geriAcilabilir: yedek sayfada "3D görünüm" düğmesi', () => {
  it.each([
    ['duz-secildi', true],
    ['hareket-azalt', true],
    ['veri-tasarrufu', false],
    ['webgl-yok', false],
    ['veri-bozuk', false],
    ['hata', false],
  ] as const)('%s → %s', (neden, beklenen) => {
    expect(geriAcilabilir(neden)).toBe(beklenen);
  });
});

/** localStorage'ın küçük bir kopyası */
function sahteDepo() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    m,
  };
}

describe('secimOku / secimYaz', () => {
  it('yaz → oku gidiş-dönüşü; null siler', () => {
    const d = sahteDepo();
    expect(secimOku(() => d)).toBeNull();
    secimYaz(() => d, 'duz');
    expect(d.m.get(SECIM_ANAHTARI)).toBe('duz');
    expect(secimOku(() => d)).toBe('duz');
    secimYaz(() => d, '3d');
    expect(secimOku(() => d)).toBe('3d');
    secimYaz(() => d, null);
    expect(d.m.has(SECIM_ANAHTARI)).toBe(false);
  });

  it('tanınmayan değer → null', () => {
    const d = sahteDepo();
    d.m.set(SECIM_ANAHTARI, 'evet');
    expect(secimOku(() => d)).toBeNull();
  });

  it('depolama yasaksa (gizli mod) hata fırlatmaz', () => {
    const yasak = () => {
      throw new DOMException('erişim yok', 'SecurityError');
    };
    expect(secimOku(yasak)).toBeNull();
    expect(() => secimYaz(yasak, 'duz')).not.toThrow();
    const dolu = { getItem: () => null, setItem: () => { throw new DOMException('dolu', 'QuotaExceededError'); }, removeItem: () => {} };
    expect(() => secimYaz(() => dolu, 'duz')).not.toThrow();
  });
});
