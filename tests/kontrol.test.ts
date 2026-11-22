// scripts/kontrol.mjs denetimi.
// Yöntem: sağlam bir sahte dist kurulur (hatasız ve uyarısız geçmeli), sonra her kural TEK bir
// değişiklikle bozulur ve TAM OLARAK bir hata beklenir. Böylece hem kuralın kırıldığı görülür hem de
// alakasız yerlerde boşuna hata vermediği. Hiç kırılmayan bir kontrol, kontrol yokluğundan farksızdır.
import { describe, expect, it } from 'vitest';
import { adresCoz, hedefBul, htmlParcala, kontrolEt, sunumAdresi } from '../scripts/kontrol.mjs';

const SITE = 'https://ornek.test';
const PRELOAD = '<link rel="preload" href="/_astro/f.woff2" as="font" type="font/woff2" crossorigin>';
const CSS = '@font-face{font-family:X;src:url(/_astro/f.woff2) format("woff2")}';

/** Astro çıktısına benzeyen bir sayfa. */
function sayfa(lang: string, govde = '', bas = PRELOAD, htmlNit = '') {
  return `<!DOCTYPE html><html lang="${lang}"${htmlNit}><head>${bas}<link rel="stylesheet" href="/_astro/a.css"></head><body>${govde}</body></html>`;
}

/** Sağlam dist; `degisiklik` ile dosya eklenir/değiştirilir, `undefined` dosyayı siler. */
function dist(degisiklik: Record<string, string | undefined> = {}): Map<string, string> {
  const dosyalar: Record<string, string | undefined> = {
    'index.html': sayfa('tr', '<a href="/en/">EN</a><section id="stajlar"></section>'),
    'en/index.html': sayfa('en', '<a href="/">TR</a> <a href="/#stajlar">Internships</a>'),
    '404.html': sayfa('tr', '<a href="/">Ana sayfa</a> <a href="/en/">Home</a>', ''),
    '_astro/a.css': CSS,
    '_astro/f.woff2': '',
    ...degisiklik,
  };
  return new Map(Object.entries(dosyalar).filter((g): g is [string, string] => g[1] !== undefined));
}

const kontrol = (d: Map<string, string>, taslakHata = false) => kontrolEt(d, { site: SITE, taslakHata });

/** Tam olarak bir hata bekler ve mesajında `parca` geçmeli. */
function tekHata(d: Map<string, string>, parca: string) {
  const { hatalar } = kontrol(d);
  expect(hatalar, hatalar.join('\n')).toHaveLength(1);
  expect(hatalar[0]).toContain(parca);
}

describe('kontrolEt: sağlam dist', () => {
  it('hata ve uyarı yok', () => {
    expect(kontrol(dist())).toEqual({ hatalar: [], uyarilar: [] });
  });
});

describe('kontrolEt: 404', () => {
  it('404.html yoksa hata', () => tekHata(dist({ '404.html': undefined }), '404.html yok'));

  it('404 sayfasında göreli link hata (her adreste sunulduğu için)', () => {
    tekHata(dist({ '404.html': sayfa('tr', '<a href="en/">Home</a>', '') }), 'göreli link');
  });
});

describe('kontrolEt: iç linkler', () => {
  const tr = (govde: string) => dist({ 'index.html': sayfa('tr', `<a href="/en/">EN</a><section id="stajlar"></section>${govde}`) });

  it('olmayan sayfa', () => tekHata(tr('<a href="/projeler/">P</a>'), 'böyle bir sayfa yok'));
  it('olmayan dosya', () => tekHata(tr('<img src="/cv.png" alt="">'), 'böyle bir dosya yok'));
  it('sonunda "/" olmayan sayfa linki', () => tekHata(tr('<a href="/en">EN</a>'), 'sonunda "/" yok'));
  it('index.html ile biten link', () => tekHata(tr('<a href="/en/index.html">EN</a>'), 'yönlendirir'));
  it('olmayan #parça', () => tekHata(tr('<a href="#yok">x</a>'), 'id="yok" yok'));
  it('srcset içindeki her aday denetlenir', () => {
    tekHata(tr('<img src="/_astro/f.woff2" srcset="/_astro/f.woff2 1x, /yok.png 2x" alt="">'), 'yok.png');
  });
  it('sitenin tam adresiyle yazılmış link iç sayılır', () => {
    tekHata(tr('<link rel="canonical" href="https://ornek.test/yok/">'), 'böyle bir sayfa yok');
    expect(kontrol(tr('<link rel="canonical" href="https://ornek.test/en/">')).hatalar).toEqual([]);
  });
  it('dış adresler denetlenmez', () => {
    const govde =
      '<a href="https://github.com/simsekerenburak">G</a><a href="mailto:a@b.c">M</a>' +
      '<a href="tel:+905550000000">T</a><script src="//cdn.ornek.dev/x.js"></script><img src="data:image/png;base64,AA" alt="">';
    expect(kontrol(tr(govde)).hatalar).toEqual([]);
  });
  it('yorumdaki ve <script> içindeki metin link sayılmaz', () => {
    const govde = `<!-- <a href="/yok/">eski</a> --><script>const s = '<a href="/yok/">';</script>`;
    expect(kontrol(tr(govde)).hatalar).toEqual([]);
  });
});

describe('kontrolEt: CSS ve fontlar', () => {
  it('CSS dosyasına gömülü font hata', () => {
    tekHata(dist({ '_astro/a.css': `${CSS}@font-face{font-family:Y;src:url(data:font/woff2;base64,AAAA)}` }), 'gömülü');
  });
  it('satır içi <style> içine gömülü font hata', () => {
    const stil = `<style>@font-face{font-family:Y;src:url("data:application/font-woff;base64,AA")}</style>${PRELOAD}`;
    tekHata(dist({ 'index.html': sayfa('tr', '<a href="/en/">EN</a><section id="stajlar"></section>', stil) }), 'gömülü');
  });
  it('CSS url() hedefi yoksa hata', () => {
    tekHata(dist({ '_astro/a.css': `${CSS}.x{background:url(/_astro/yok.png)}` }), 'url(/_astro/yok.png)');
  });
  it('@font-face içinde kullanılmayan font preload edilirse hata', () => {
    const bas = '<link rel="preload" href="/_astro/g.woff2" as="font" type="font/woff2" crossorigin>';
    tekHata(
      dist({ '_astro/g.woff2': '', 'index.html': sayfa('tr', '<a href="/en/">EN</a><section id="stajlar"></section>', bas) }),
      "hiçbir @font-face'te yok",
    );
  });
  it('crossorigin olmayan font preload hata', () => {
    const bas = '<link rel="preload" href="/_astro/f.woff2" as="font" type="font/woff2">';
    tekHata(dist({ 'index.html': sayfa('tr', '<a href="/en/">EN</a><section id="stajlar"></section>', bas) }), 'crossorigin yok');
  });
});

describe('kontrolEt: TR/EN', () => {
  it('EN karşılığı olmayan TR sayfa hata', () => {
    tekHata(dist({ 'projeler/index.html': sayfa('tr') }), 'EN karşılığı yok (en/projeler/index.html');
  });
  it('TR karşılığı olmayan EN sayfa hata', () => {
    tekHata(dist({ 'en/projeler/index.html': sayfa('en') }), 'TR karşılığı yok (projeler/index.html');
  });
  it('yanlış <html lang> hata', () => {
    tekHata(dist({ 'en/index.html': sayfa('tr', '<a href="/">TR</a>') }), '"en" olmalı');
  });
  it('taslak sayfa M1–M5 uyarı, M6+ hata', () => {
    const d = dist({ 'en/index.html': sayfa('en', '<a href="/">TR</a>', PRELOAD, ' data-taslak="true"') });
    expect(kontrol(d)).toEqual({ hatalar: [], uyarilar: [expect.stringContaining('taslak')] });
    expect(kontrol(d, true)).toEqual({ hatalar: [expect.stringContaining('taslak')], uyarilar: [] });
  });
});

describe('yardımcılar', () => {
  it('sunumAdresi: Cloudflare Pages directory kuralı', () => {
    expect(sunumAdresi('index.html')).toBe('/');
    expect(sunumAdresi('en/index.html')).toBe('/en/');
    expect(sunumAdresi('404.html')).toBe('/404.html');
    expect(sunumAdresi('_astro/a.css')).toBe('/_astro/a.css');
  });

  it('adresCoz: göreli yol, parça ve %-kodları tarayıcı gibi çözülür', () => {
    expect(adresCoz('../x/#a', '/en/projeler/', SITE)).toEqual({ tur: 'ic', yol: '/en/x/', parca: 'a' });
    expect(adresCoz('/%C5%9Fim%C5%9Fek/', '/', SITE)).toEqual({ tur: 'ic', yol: '/şimşek/', parca: '' });
    expect(adresCoz('https://github.com/', '/', SITE)).toEqual({ tur: 'dis' });
    expect(adresCoz('/%E0%A4%A/', '/', SITE)).toEqual({ tur: 'gecersiz' });
  });

  it('hedefBul: 404.html gibi sayfaya .html ile link verilmez', () => {
    const d = dist();
    expect(hedefBul('/en/', d)).toEqual({ dosya: 'en/index.html' });
    expect(hedefBul('/_astro/a.css', d)).toEqual({ dosya: '_astro/a.css' });
    expect(hedefBul('/404.html', d)).toEqual({ hata: expect.stringContaining('"/404"') });
  });

  it('htmlParcala: tırnaklı, tek tırnaklı, tırnaksız, değersiz nitelik ve karakter göndermeleri', () => {
    const { etiketler, stiller } = htmlParcala(
      `<a href="/a/?x=1&amp;y=2" title='T' data-n=5 hidden>a</a><style>p{color:red}</style>`,
    );
    expect(etiketler[0]).toEqual({ ad: 'a', nit: { href: '/a/?x=1&y=2', title: 'T', 'data-n': '5', hidden: '' } });
    expect(stiller).toEqual(['p{color:red}']);
  });
});
