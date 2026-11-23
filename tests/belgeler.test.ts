// Belgeler: şema (ayırt edici birleşim: cv | sertifika), içerik (src/content/belgeler/{tr,en}.json)
// ve dönüşüm (src/pafta/belgeler.ts). CV'nin "Yakında" ve "hazır" durumları sahte `dosyaVar` ile sınanır.
import { describe, expect, it } from 'vitest';
import { belgeSemasi, belgelerDosyasiSemasi, type Belge } from '../src/icerik/sema';
import { belgeOgeleri, belgeOzeti, type DosyaVar } from '../src/pafta/belgeler';
import { jsonIcerik } from './yardimci/icerik';

const DILLER = ['tr', 'en'] as const;
type D = (typeof DILLER)[number];
const ham = { tr: jsonIcerik('belgeler', 'tr'), en: jsonIcerik('belgeler', 'en') };
const belgeler = (dil: D) => belgelerDosyasiSemasi.parse(ham[dil]).belgeler;

const YOK: DosyaVar = () => false; // M6'ya kadarki durum: PDF'ler yok
const VAR: DosyaVar = () => true; // M6: PDF'ler public/cv/ altında

const CV = {
  id: 'cv',
  tur: 'cv',
  kisaAd: 'CV',
  ad: 'Özgeçmiş',
  altBaslik: 'alt',
  aciklama: 'hazır',
  yakindaAciklama: 'yakında',
  dosyalar: [{ dil: 'tr', yol: '/cv/ornek-tr.pdf' }],
};
const SERTIFIKA = {
  id: 'ornek',
  tur: 'sertifika',
  kisaAd: 'Kurum',
  ad: 'Kurs',
  kurum: 'Kurum',
  tarih: '2026-09',
  belgeTuru: 'sertifika',
  aciklama: 'açıklama',
  dogrulanabilir: true,
};

describe('belge şeması', () => {
  it('geçerli CV ve sertifika geçiyor', () => {
    expect(belgeSemasi.safeParse(CV).success).toBe(true);
    expect(belgeSemasi.safeParse(SERTIFIKA).success).toBe(true);
    expect(belgeSemasi.safeParse({ ...SERTIFIKA, dogrulamaNo: 'X-1', dogrulamaAdresi: 'https://ornek.dev/x' }).success).toBe(true);
  });

  it.each([
    ['bilinmeyen tür', { ...SERTIFIKA, tur: 'diploma' }],
    ['sertifikada CV alanı (strict)', { ...SERTIFIKA, dosyalar: [] }],
    ['CV yolu /cv/ dışında', { ...CV, dosyalar: [{ dil: 'tr', yol: '/gizli/cv.pdf' }] }],
    ['CV yolunda ".." kaçışı', { ...CV, dosyalar: [{ dil: 'tr', yol: '/cv/../x.pdf' }] }],
    ['CV tam adres', { ...CV, dosyalar: [{ dil: 'tr', yol: 'https://ornek.dev/cv.pdf' }] }],
    ['CV PDF değil', { ...CV, dosyalar: [{ dil: 'tr', yol: '/cv/cv.docx' }] }],
    ['aynı dilde iki CV', { ...CV, dosyalar: [{ dil: 'tr', yol: '/cv/a.pdf' }, { dil: 'tr', yol: '/cv/b.pdf' }] }],
    ['doğrulama no var ama doğrulanabilir değil', { ...SERTIFIKA, dogrulanabilir: false, dogrulamaNo: 'X-1' }],
    ['doğrulama adresi http', { ...SERTIFIKA, dogrulamaAdresi: 'http://ornek.dev/x' }],
    ['tarih biçimi', { ...SERTIFIKA, tarih: 'Eylül 2026' }],
    ['belge türü', { ...SERTIFIKA, belgeTuru: 'diploma' }],
  ])('reddediyor: %s', (_, veri) => {
    expect(belgeSemasi.safeParse(veri).success).toBe(false);
  });
});

describe('belgeler içeriği', () => {
  it.each(DILLER)('%s.json şemadan geçiyor', (dil) => {
    const r = belgelerDosyasiSemasi.safeParse(ham[dil]);
    const mesaj = r.success ? '' : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    expect(r.success, mesaj).toBe(true);
  });

  it('CLAUDE.md §7: özgeçmiş + 4 sertifika, bu sırayla; CV iki dilde', () => {
    const b = belgeler('tr');
    expect(b.map((x) => x.id)).toEqual(['ozgecmis', 'ai-business-school', 'huawei', 'udemy-flutter', 'nasa-space-apps']);
    const cv = b[0]!;
    expect(cv.tur === 'cv' && cv.dosyalar.map((d) => d.dil)).toEqual(['tr', 'en']);
  });

  it('TR ve EN: aynı id’ler, türler, tarihler, doğrulama bilgileri ve aynı CV dosyaları', () => {
    const ortak = (b: Belge) =>
      b.tur === 'cv'
        ? { id: b.id, tur: b.tur, dosyalar: b.dosyalar }
        : { id: b.id, tur: b.tur, tarih: b.tarih, belgeTuru: b.belgeTuru, d: b.dogrulanabilir, no: b.dogrulamaNo, adres: b.dogrulamaAdresi, unvan: b.unvan };
    expect(belgeler('en').map(ortak)).toEqual(belgeler('tr').map(ortak));
  });

  it('TR asıl dil: taslak değil; düz kesme işareti yok', () => {
    expect(belgelerDosyasiSemasi.parse(ham.tr).taslak).toBe(false);
    for (const dil of DILLER) expect(JSON.stringify(ham[dil]), dil).not.toContain("'");
  });
});

describe('özgeçmiş kartı: PDF yokken "Yakında", varken bağlantılar', () => {
  it('PDF yok (M6 öncesi): Yakında etiketi, yakında açıklaması, hiç bağlantı yok', () => {
    const cv = belgeOgeleri(belgeler('tr'), 'tr', YOK)[0]!;
    expect(cv.etiket).toBe('Yakında');
    expect(cv.aciklama).toBe('Türkçe ve İngilizce özgeçmişim çok yakında burada olacak.');
    expect(cv.baglantilar).toBeUndefined();
    expect(cv.ustSatir).toBe('Türkçe · İngilizce');
  });

  it('PDF’ler var (M6): etiket yok, iki dilde bağlantı', () => {
    const cv = belgeOgeleri(belgeler('tr'), 'tr', VAR)[0]!;
    expect(cv.etiket).toBeUndefined();
    expect(cv.baglantilar).toEqual([
      { metin: 'Türkçe PDF', adres: '/cv/burak-eren-simsek-cv-tr.pdf' },
      { metin: 'İngilizce PDF', adres: '/cv/burak-eren-simsek-cv-en.pdf' },
    ]);
  });

  it('yalnızca biri varsa: hâlâ Yakında, ama var olan bağlanır (kırık link yok)', () => {
    const yalnizTr: DosyaVar = (yol) => yol.endsWith('-tr.pdf');
    const cv = belgeOgeleri(belgeler('en'), 'en', yalnizTr)[0]!;
    expect(cv.etiket).toBe('Coming soon');
    expect(cv.baglantilar).toEqual([{ metin: 'Turkish PDF', adres: '/cv/burak-eren-simsek-cv-tr.pdf' }]);
  });
});

describe('sertifika kartları', () => {
  const kartlar = belgeOgeleri(belgeler('tr'), 'tr', YOK).slice(1);

  it('üst satır tarih, alt satır kurum', () => {
    expect(kartlar.map((k) => k.ustSatir)).toEqual(['Eylül 2026', 'Ağustos 2026', 'Temmuz 2026', 'Kasım 2026']);
    expect(kartlar.map((k) => k.altSatir)).toEqual(['AI Business School', 'Huawei', 'Udemy', 'NASA Space Apps Challenge · Galactic Team Member']);
  });

  it('doğrulama numarası açıklamaya eklenir; haplar tür + doğrulanabilir', () => {
    expect(kartlar[0]!.aciklama).toBe('Yapay zekâ temelleri eğitimi. Yeterlilik no: CERT-094BCBC0.');
    expect(kartlar[2]!.aciklama).toBe('Flutter ve Dart ile mobil uygulama geliştirme kursu (25,5 saat). Yeterlilik no: UC-593389b9-5056-430c-9ac2-48217381e84d.');
    expect(kartlar.map((k) => k.haplar)).toEqual([
      ['Sertifika', 'Doğrulanabilir'],
      ['Katılım belgesi'],
      ['Sertifika', 'Doğrulanabilir'],
      ['Sertifika', 'Hackathon', 'Teknik destek', 'Organizasyon'],
    ]);
  });

  it('NASA Space Apps (Burak, 2026-11-23): unvan belgedeki gibi AYNEN, rol ayrıca; yarışmacı değil, teknik ekip', () => {
    const nasa = kartlar[3]!;
    expect(nasa.baslik).toBe('NASA Space Apps Challenge 2026 – Sivas');
    expect(nasa.altSatir).toContain('Galactic Team Member');
    expect(nasa.aciklama).toMatch(/Rolüm: teknik ekip \(görevli öğrenci\), yarışmacılara teknik destek\.$/);
    expect(nasa.aciklama).not.toMatch(/yarışmacıydım|katıldım|takımımız/i);
  });

  it('id’ler "belgeler-" önekli ve benzersiz', () => {
    const idler = belgeOgeleri(belgeler('tr'), 'tr', YOK).map((k) => k.id);
    expect(new Set(idler).size).toBe(5);
    expect(idler.every((id) => id.startsWith('belgeler-'))).toBe(true);
  });
});

describe('özet menüsü', () => {
  it('TR: 5 belge → 4 sertifika / 2 dilde CV (PDF yokken Yakında)', () => {
    expect(belgeOzeti(belgeler('tr'), 'tr', YOK)).toEqual({
      sayi: 5,
      etiket: 'belge',
      gruplar: [
        {
          sayi: 4,
          etiket: 'sertifika',
          satirlar: [
            { baslik: 'AI Business School', aciklama: 'Eylül 2026' },
            { baslik: 'Huawei', aciklama: 'Ağustos 2026' },
            { baslik: 'Udemy', aciklama: 'Temmuz 2026' },
            { baslik: 'NASA Space Apps Challenge', aciklama: 'Kasım 2026' },
          ],
        },
        {
          sayi: 2,
          etiket: 'dilde CV',
          satirlar: [
            { baslik: 'Türkçe', aciklama: 'Yakında' },
            { baslik: 'İngilizce', aciklama: 'Yakında' },
          ],
        },
      ],
    });
  });

  it('PDF’ler varken CV satırları "PDF"', () => {
    const cvGrubu = belgeOzeti(belgeler('tr'), 'tr', VAR).gruplar[1]!;
    expect(cvGrubu.satirlar.map((s) => s.aciklama)).toEqual(['PDF', 'PDF']);
  });

  it('EN: 5 documents → 4 certificates / 2 CV languages', () => {
    const o = belgeOzeti(belgeler('en'), 'en', YOK);
    expect(`${o.sayi} ${o.etiket}`).toBe('5 documents');
    expect(o.gruplar.map((g) => `${g.sayi} ${g.etiket}`)).toEqual(['4 certificates', '2 CV languages']);
  });
});
