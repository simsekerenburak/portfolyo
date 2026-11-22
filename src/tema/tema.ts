// Tema seçimi (CLAUDE.md §4.2).
//   - Varsayılan: cihaz ayarı (tokens.css → `color-scheme: light dark`, JS kapalıyken de çalışır).
//   - Düğmeyle seçilen tema <html data-theme="koyu|acik"> olur ve localStorage'da saklanır.
// Bu dosya DOM'a dokunmaz (testler doğrudan çağırır); DOM işini TemaDugmesi.astro yapar.

export type Tema = 'koyu' | 'acik';

/** localStorage anahtarı: düğme buraya yazar, ILK_BETIK buradan okur. */
export const TEMA_ANAHTARI = 'tema';

/** Depodan (veya data-theme'den) okunan değeri doğrular: yalnızca 'koyu' | 'acik'; gerisi null. */
export function kayitliTema(deger: unknown): Tema | null {
  return deger === 'koyu' || deger === 'acik' ? deger : null;
}

/** Ekranda geçerli olan tema: kullanıcının seçimi varsa o, yoksa cihaz ayarı. */
export function etkinTema(kayitli: Tema | null, cihazKoyu: boolean): Tema {
  return kayitli ?? (cihazKoyu ? 'koyu' : 'acik');
}

/** Düğmeye basınca geçilecek tema. */
export function digerTema(tema: Tema): Tema {
  return tema === 'koyu' ? 'acik' : 'koyu';
}

/**
 * <head>'de, sayfa BOYANMADAN önce çalışan satır içi betik (Duzen.astro basar).
 * Kayıtlı seçim varsa data-theme'i koyar ve <meta name="color-scheme">'i ona çeker (CSS gelmeden
 * önceki an da doğru renkte olsun). Kayıt yoksa hiçbir şeye dokunmaz → cihaz ayarı izlenir.
 * try/catch: gizli pencere veya engellenmiş depolamada localStorage erişimi hata fırlatabilir.
 * Neden düz metin: modül olsaydı tarayıcı onu ayrıca indirip sayfa boyandıktan sonra çalıştırırdı
 * ve sayfa bir an yanlış temada parlardı. Doğrulama mantığı kayitliTema ile aynı (testte çalıştırılarak sınanır).
 */
export const ILK_BETIK =
  `try{var t=localStorage.getItem(${JSON.stringify(TEMA_ANAHTARI)});` +
  `if(t==='koyu'||t==='acik'){document.documentElement.dataset.theme=t;` +
  `var m=document.querySelector('meta[name="color-scheme"]');if(m)m.content=t==='koyu'?'dark':'light'}}catch(e){}`;
