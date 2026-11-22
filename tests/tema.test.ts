// src/tema/tema.ts denetimi: tema seçimi mantığı ve <head>'deki ilk betik.
// İlk betik düz metin olduğu için sahte localStorage/document ile gerçekten ÇALIŞTIRILARAK sınanır.
import { describe, expect, it } from 'vitest';
import { ILK_BETIK, TEMA_ANAHTARI, digerTema, etkinTema, kayitliTema } from '../src/tema/tema';

describe('kayitliTema: depodan okunan değeri doğrular', () => {
  it('yalnızca "koyu" ve "acik" geçerli', () => {
    expect(kayitliTema('koyu')).toBe('koyu');
    expect(kayitliTema('acik')).toBe('acik');
  });
  it.each([null, undefined, '', 'KOYU', 'dark', 'mavi', 1])('%s → null', (deger) => {
    expect(kayitliTema(deger)).toBeNull();
  });
});

describe('etkinTema: ekranda geçerli tema', () => {
  it('kullanıcının seçimi cihaz ayarından önce gelir', () => {
    expect(etkinTema('acik', true)).toBe('acik');
    expect(etkinTema('koyu', false)).toBe('koyu');
  });
  it('seçim yoksa cihaz ayarı', () => {
    expect(etkinTema(null, true)).toBe('koyu');
    expect(etkinTema(null, false)).toBe('acik');
  });
});

describe('digerTema', () => {
  it('iki tema arasında geçer', () => {
    expect(digerTema('koyu')).toBe('acik');
    expect(digerTema('acik')).toBe('koyu');
  });
});

describe('ILK_BETIK: sayfa boyanmadan önce kayıtlı seçimi uygular', () => {
  /** Betiği sahte bir tarayıcı ortamında çalıştırır; html'in data-theme'ini ve meta color-scheme'i döndürür. */
  function calistir(getItem: (anahtar: string) => string | null) {
    const okunanAnahtarlar: string[] = [];
    const meta = { content: 'light dark' };
    const kok = { dataset: {} as Record<string, string> };
    const document = {
      documentElement: kok,
      querySelector: (secici: string) => (secici === 'meta[name="color-scheme"]' ? meta : null),
    };
    const localStorage = {
      getItem: (anahtar: string) => {
        okunanAnahtarlar.push(anahtar);
        return getItem(anahtar);
      },
    };
    new Function('localStorage', 'document', ILK_BETIK)(localStorage, document);
    return { tema: kok.dataset.theme, meta: meta.content, okunanAnahtarlar };
  }

  it('kayıtlı "koyu" → data-theme="koyu", meta "dark" (yükleme sırasında beyaz parlama olmasın)', () => {
    expect(calistir(() => 'koyu')).toMatchObject({ tema: 'koyu', meta: 'dark' });
  });
  it('kayıtlı "acik" → data-theme="acik", meta "light"', () => {
    expect(calistir(() => 'acik')).toMatchObject({ tema: 'acik', meta: 'light' });
  });
  it('kayıt yoksa hiçbir şeye dokunmaz (cihaz ayarı izlenir)', () => {
    expect(calistir(() => null)).toMatchObject({ tema: undefined, meta: 'light dark' });
  });
  it('bozuk kayıt yok sayılır', () => {
    expect(calistir(() => 'mavi')).toMatchObject({ tema: undefined, meta: 'light dark' });
  });
  it('depo erişimi hata fırlatırsa (gizli pencere, engellenmiş çerez) sayfayı bozmaz', () => {
    expect(() =>
      calistir(() => {
        throw new Error('SecurityError');
      }),
    ).not.toThrow();
  });
  it('düğmenin yazdığı anahtarı okur', () => {
    expect(calistir(() => null).okunanAnahtarlar).toEqual([TEMA_ANAHTARI]);
  });
});
