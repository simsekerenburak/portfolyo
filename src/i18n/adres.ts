// Adres yardımcıları: dil düğmesinin hedef adresi ve #parçanın kimliği. Bu dosya JSON İÇE AKTARMAZ: DilDugmesi'nin tarayıcı betiğine paketlenir,
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

/**
 * Adresin #parçasındaki kimlik: "#stajlar" → "stajlar". Boş parça ("", "#") → null.
 * Yüzde kodlaması çözülür ("#a%20b" → "a b"); bozuksa (çözülemiyorsa) olduğu gibi döner, hata fırlatmaz.
 * Kart destesi (Pafta.astro) kutu linkini ve adresi karta çevirirken kullanır; M3'te 3D kamera da kullanacak.
 */
export function parcaKimligi(hash: string): string | null {
  const ham = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!ham) return null;
  try {
    return decodeURIComponent(ham);
  } catch {
    return ham;
  }
}
