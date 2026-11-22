// Dil düğmesinin hedef adresi. Bu dosya JSON İÇE AKTARMAZ: DilDugmesi'nin tarayıcı betiğine paketlenir,
// index.ts'yi (iki dilin bütün metinleri) içe aktarsaydı her ziyaretçiye gereksiz yere o metinler de inerdi.

/** Sayfa içi kimlik biçimi: küçük harf, rakam, tire ("#stajlar", "#projeler-simsek"). */
const KIMLIK = /^#[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Öteki dilin adresi + şu anki #parça: ("/en/", "#stajlar") → "/en/#stajlar".
 * Pafta ve kart kimlikleri iki dilde aynıdır, bu yüzden parça hedef sayfada da vardır.
 * Biçime uymayan parça ("#", "#Stajlar", "#a%20b", "#<x>") atılır ve link yalnızca o dilin ana sayfasına gider:
 * adresten gelen metin doğrulanmadan href'e yazılmaz.
 */
export function dilAdresi(taban: string, hash: string): string {
  return KIMLIK.test(hash) ? `${taban}${hash}` : taban;
}
