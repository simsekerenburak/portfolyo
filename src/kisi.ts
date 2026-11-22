// Çevrilmeyen kişisel bilgiler: iki dilde de aynı. Kaynak: CLAUDE.md §7 (Hakkımda → İletişim).
// Çevrilen metinler src/i18n/{tr,en}.json'da.
export const KISI = {
  /** İsim iki satırda gösterilir (taslakta "Burak Eren / Şimşek"). */
  adSatirlari: ['Burak Eren', 'Şimşek'],
  github: 'https://github.com/simsekerenburak',
  // "ş" adreste yüzde kodlamalı yazıldı (UTF-8: C5 9F); tarayıcı aynı adrese gider.
  linkedin: 'https://www.linkedin.com/in/burak-eren-%C5%9Fim%C5%9Fek-/',
  eposta: 'burakerensimsek59@gmail.com',
} as const;

export const TAM_AD = KISI.adSatirlari.join(' ');
