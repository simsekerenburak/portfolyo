// src/i18n/adres.ts: dil düğmesi adresteki #parçayı (pafta/kart kimliği) öteki dile taşır.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dilAdresi } from '../src/i18n/adres';

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
