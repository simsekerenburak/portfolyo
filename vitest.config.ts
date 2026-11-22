import { defineConfig } from 'vitest/config';

// Testler DOM'dan bağımsız saf fonksiyonları sınar (kinematik, yay, durum makinesi),
// bu yüzden Astro'nun Vite ayarlarına ihtiyaç yok; düz Vitest yeterli.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
