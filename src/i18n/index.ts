// Arayüz ve sayfa metinleri, dile göre.
// TR şemadır: `Metinler = typeof tr`. EN'de bir anahtar eksikse `astro check` tip hatası verir;
// EN'de fazladan anahtar olması ise tipte yakalanmaz, onu tests/i18n.test.ts yakalar.
import en from './en.json';
import tr from './tr.json';

export type Dil = 'tr' | 'en';
export type Metinler = typeof tr;

export const DILLER: readonly Dil[] = ['tr', 'en'];
export const METINLER: Record<Dil, Metinler> = { tr, en };

/** Dilin ana sayfa adresi: TR öneksiz (`/`), EN `/en/` (astro.config.mjs → prefixDefaultLocale: false). */
export const anaSayfa = (dil: Dil): string => (dil === 'tr' ? '/' : '/en/');

/** İki dilli sitede "öteki" dil. */
export const otekiDil = (dil: Dil): Dil => (dil === 'tr' ? 'en' : 'tr');
