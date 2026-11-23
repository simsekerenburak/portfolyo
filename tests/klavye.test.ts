// src/sahne/klavye.ts: ← → tuşlarının "odağa göre" kuralı (Burak'ın kararı, 2026-11-23).
import { describe, expect, it } from 'vitest';
import { klavyeEylemi, type Baglam, type Tus } from '../src/sahne/klavye';

const tus = (key: string, ek: Partial<Tus> = {}): Tus => ({
  key,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...ek,
});
const SAYFA: Baglam = { kartAlaninda: false, yaziAlaninda: false };
const DESTE: Baglam = { kartAlaninda: true, yaziAlaninda: false };

describe('klavyeEylemi: odak destedeyse kart, değilse pafta', () => {
  it('odak destede/bantta: → sonraki kart, ← önceki kart', () => {
    expect(klavyeEylemi(tus('ArrowRight'), DESTE)).toEqual({ hedef: 'kart', yon: 'ileri' });
    expect(klavyeEylemi(tus('ArrowLeft'), DESTE)).toEqual({ hedef: 'kart', yon: 'geri' });
  });

  it('odak destenin dışında: → sonraki pafta, ← önceki pafta', () => {
    expect(klavyeEylemi(tus('ArrowRight'), SAYFA)).toEqual({ hedef: 'pafta', yon: 'ileri' });
    expect(klavyeEylemi(tus('ArrowLeft'), SAYFA)).toEqual({ hedef: 'pafta', yon: 'geri' });
  });

  it.each(['ArrowUp', 'ArrowDown', 'Enter', ' ', 'Tab', 'a', 'Home'])('%j tuşu → eylem yok', (key) => {
    expect(klavyeEylemi(tus(key), SAYFA)).toBeNull();
    expect(klavyeEylemi(tus(key), DESTE)).toBeNull();
  });

  it.each(['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const)(
    '%s basılıyken → eylem yok (Alt+← tarayıcıda geri gider, Shift+← metin seçer)',
    (degistirici) => {
      expect(klavyeEylemi(tus('ArrowLeft', { [degistirici]: true }), SAYFA)).toBeNull();
      expect(klavyeEylemi(tus('ArrowRight', { [degistirici]: true }), DESTE)).toBeNull();
    },
  );

  it('yazı alanında oklar imleci yürütür → eylem yok', () => {
    expect(klavyeEylemi(tus('ArrowRight'), { kartAlaninda: false, yaziAlaninda: true })).toBeNull();
    expect(klavyeEylemi(tus('ArrowRight'), { kartAlaninda: true, yaziAlaninda: true })).toBeNull();
  });

  it('harf birleştirme (IME) sürerken → eylem yok', () => {
    expect(klavyeEylemi(tus('ArrowRight', { isComposing: true }), SAYFA)).toBeNull();
  });

  it('basılı tutunca: pafta tekrarlanmaz, kart çevirme tekrarlanır', () => {
    expect(klavyeEylemi(tus('ArrowRight', { repeat: true }), SAYFA)).toBeNull();
    expect(klavyeEylemi(tus('ArrowRight', { repeat: true }), DESTE)).toEqual({ hedef: 'kart', yon: 'ileri' });
  });
});
