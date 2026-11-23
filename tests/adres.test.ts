// src/i18n/adres.ts: dil düğmesi adresteki #parçayı (bölüm/kart kimliği) öteki dile taşır; #parçanın kimliği.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dilAdresi, parcaKimligi } from '../src/i18n/adres';

describe('dilAdresi', () => {
  it.each([
    ['/en/', '#stajlar', '/en/#stajlar'],
    ['/', '#belgeler', '/#belgeler'],
    ['/en/', '#projeler-simsek', '/en/#projeler-simsek'], // kart kimliği: o kart önde açılır
    ['/en/', '', '/en/'], // parça yok
  ])('(%s, "%s") → %s', (taban, hash, beklenen) => {
    expect(dilAdresi(taban, hash)).toBe(beklenen);
  });

  it.each(['#', '#Stajlar', '#a%20b', '#<script>', '#stajlar?x=1', '#-stajlar', '#stajlar-', 'stajlar', '#a"b'])(
    'biçime uymayan parça atılır: "%s"',
    (hash) => {
      expect(dilAdresi('/en/', hash)).toBe('/en/');
    },
  );

  it('modül JSON içe aktarmıyor (tarayıcı betiğine iki dilin metinleri paketlenmesin)', () => {
    const kaynak = readFileSync(new URL('../src/i18n/adres.ts', import.meta.url), 'utf8');
    expect(kaynak).not.toMatch(/^import /m);
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
