// Sahnenin ilk karesi: paftalar sayfa BOYANMADAN önce desteye dizilir.
//
// Neden ayrı, düz metin bir betik: Sahne.astro'nun asıl betiği bir modüldür; tarayıcı onu sayfa ayrıştırıldıktan
// sonra çalıştırır. O ana kadar paftalar JS'siz düzende (alt alta) görünür, sonra birden desteye toplanırdı
// (sayfa zıplar, /#stajlar gibi bir linkle gelen önce Hakkımda'yı görürdü). Bu betik Sahne'nin HTML'inin hemen
// sonuna satır içi konur ve ayrıştırıcı oraya gelince eşzamanlı çalışır: ilk boyamada deste zaten doğru paftada.
// JS kapalıysa hiç çalışmaz → paftalar alt alta kalır (§3.3).
//
// Yaptığı yalnızca şu: adresteki #parçadan öndeki paftayı bulur, her paftaya data-konum yazar (arkadakiler inert),
// sekme ve gösterge işaretine aria-current koyar, sahneye data-sahne="etkin" der. Hareket, tıklama ve klavye
// modülün işi. Modül yüklenemezse diye #parça değişince konumları (animasyonsuz) yine günceller; modül hazır
// olunca (data-hazir) bu işi bırakır.
//
// Konum ve hedef kuralı src/sahne/sahne.ts'tekiyle (paftaKonumu, hedefPafta) aynı olmak ZORUNDA.
// tests/sahne.test.ts bu metni sahte bir sayfada çalıştırıp her durumda o fonksiyonlarla karşılaştırır.
// Yazım eski usul (var, function): satır içi olduğu için derlenmiyor, her tarayıcıda olduğu gibi çalışmalı.
export const SAHNE_ILK_BETIK = `(function(){
var s=document.querySelector('[data-sahne]');if(!s)return;
var p=s.querySelectorAll('[data-sahne-paftasi]'),n=p.length;if(n<2)return;
function id(i){return p[i].getAttribute('data-sahne-paftasi')}
function hedef(){var h=location.hash.slice(1),i,e;if(!h)return -1;
try{h=decodeURIComponent(h)}catch(x){}
for(i=0;i<n;i++)if(id(i)===h)return i;
e=document.getElementById(h);
if(e)for(i=0;i<n;i++)if(p[i].contains(e))return i;
return -1}
function uygula(on){var i,d,m=s.querySelectorAll('[data-isaret]');
for(i=0;i<n;i++){d=((i-on)%n+n)%n;
p[i].setAttribute('data-konum',d<3?['on','orta','arka'][d]:d===n-1?'cikan':'gizli');p[i].inert=d!==0}
for(i=0;i<m.length;i++){if(m[i].getAttribute('data-isaret')===id(on))m[i].setAttribute('aria-current','true');else m[i].removeAttribute('aria-current')}}
var k=hedef();uygula(k<0?0:k);s.setAttribute('data-sahne','etkin');
addEventListener('hashchange',function(){var k=hedef();if(k>=0&&!s.hasAttribute('data-hazir'))uygula(k)})
})();`;
