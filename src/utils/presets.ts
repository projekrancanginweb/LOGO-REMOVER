import { WatermarkPreset } from '../types';

export const WATERMARK_PRESETS: WatermarkPreset[] = [
  {
    id: 'gemini-rings-1024',
    name: 'Imagen 3 Standard (1024×1024)',
    width: 1024,
    height: 1024,
    patternType: 'rings',
    position: {
      x: 0.82, // Bottom-right relative position
      y: 0.82,
      size: 110 // Width/Radius in pixels
    },
    alpha: 0.10,
    logoValue: 255,
    description: 'Modulasi cincin frekuensi konsentris yang terletak di sudut kanan bawah. Cocok dengan tanda air melingkar standar Google SynthID.'
  },
  {
    id: 'gemini-spark-landscape',
    name: 'Imagen 3 Landscape (1344×768)',
    width: 1344,
    height: 768,
    patternType: 'logo',
    position: {
      x: 0.85,
      y: 0.78,
      size: 90
    },
    alpha: 0.12,
    logoValue: 255,
    description: 'Tanda air logo merek Gemini Spark berkilau 4 titik yang halus, diterapkan di dekat sudut kanan bawah.'
  },
  {
    id: 'veo-video-grid',
    name: 'Veo Video Generator Grid (1280×720)',
    width: 1280,
    height: 720,
    patternType: 'grid',
    position: {
      x: 0.50, // Centered Full-screen modulation array
      y: 0.50,
      size: 240
    },
    alpha: 0.06,
    logoValue: 240,
    description: 'Kisi pembawa titik-mikro yang tidak terlihat, terpusat di sekitar area fokus untuk melindungi klip dengan framerate tinggi.'
  },
  {
    id: 'custom-radial-dark',
    name: 'Tanda Air Gelap Kustom (Manual)',
    width: 800,
    height: 800,
    patternType: 'circle',
    position: {
      x: 0.50,
      y: 0.50,
      size: 160
    },
    alpha: 0.15,
    logoValue: 30, // Dark watermark elements
    description: 'Simulasi bayangan radial tradisional atau tanda air gelap yang diposisikan langsung di tengah.'
  }
];
