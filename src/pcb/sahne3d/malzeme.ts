// Sahnenin malzemeleri tek yerde (renkler src/pcb/renkler.ts'ten). Ayarlar CLAUDE.md §4.2:
// bakır MAT (metalness 0,35, roughness 0,7, ortam yansıması 0,6): alçak açıda beyaza dönmesin.
import { MeshBasicMaterial, MeshStandardMaterial, type Material } from 'three';
import { RENK_3D } from '../renkler';

export function malzemelerKur() {
  const m = {
    maske: new MeshStandardMaterial({ color: RENK_3D.maske, roughness: 0.85 }),
    bakir: new MeshStandardMaterial({ color: RENK_3D.bakir, metalness: 0.35, roughness: 0.7, envMapIntensity: 0.6 }),
    bakirKoyu: new MeshStandardMaterial({ color: RENK_3D.bakirKoyu, metalness: 0.35, roughness: 0.75, envMapIntensity: 0.6 }),
    grafit: new MeshStandardMaterial({ color: RENK_3D.grafit, roughness: 0.7 }),
    kalay: new MeshStandardMaterial({ color: RENK_3D.kalay, metalness: 0.9, roughness: 0.3 }),
    altin: new MeshStandardMaterial({ color: RENK_3D.altin, metalness: 0.9, roughness: 0.3 }),
    // Turuncu (kavşak via'sı, tabela çerçevesi): mat ve az ışımalı. Parlak hâli (roughness 0,4, ışıma 0,25)
    // ışık altında somon/pembeye kaçıyordu (ekranda #FAAF9A, ton 13°).
    turuncu: new MeshStandardMaterial({ color: RENK_3D.turuncu, roughness: 0.65, emissive: RENK_3D.turuncu, emissiveIntensity: 0.1 }),
    tabela: new MeshStandardMaterial({ color: RENK_3D.tabela, roughness: 0.5 }),
    // Silüetler ışıksız, sissiz ve ton eşlemesiz: renkleri ekrandaki son renktir (sise karışmış hâlleri seçildi).
    // toneMapped: false şart: PBR Neutral çok koyu renklerde kırmızıyı sıfıra çekip doygunluğu artırıyor,
    // #14362A ekranda #013123'e (camgöbeğine yakın) dönüyordu.
    siluetKoyu: new MeshBasicMaterial({ color: RENK_3D.siluetKoyu, fog: false, toneMapped: false }),
    siluetAcik: new MeshBasicMaterial({ color: RENK_3D.siluetAcik, fog: false, toneMapped: false }),
    siluetBakir: new MeshBasicMaterial({ color: RENK_3D.siluetBakir, fog: false, toneMapped: false }),
  };
  return {
    ...m,
    yokEt() {
      for (const x of Object.values(m) as Material[]) x.dispose();
    },
  };
}

export type Malzemeler = ReturnType<typeof malzemelerKur>;
