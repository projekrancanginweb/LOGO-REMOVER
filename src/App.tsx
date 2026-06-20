import React, { useState } from 'react';
import { Sparkles, Key, CheckCircle, Shield, HelpCircle, ArrowRight } from 'lucide-react';
import WatermarkEditor from './components/WatermarkEditor';
import PresetsCatalog from './components/PresetsCatalog';
import MethodExplainer from './components/MethodExplainer';
import { WATERMARK_PRESETS } from './utils/presets';
import { WatermarkPreset } from './types';

export default function App() {
  // Select the standard circular preset by default
  const [selectedPreset, setSelectedPreset] = useState<WatermarkPreset | null>(WATERMARK_PRESETS[0]);

  const handleSelectPreset = (preset: WatermarkPreset) => {
    setSelectedPreset(preset);
  };

  const handlePresetMatched = (presetId: string) => {
    const matched = WATERMARK_PRESETS.find(p => p.id === presetId);
    if (matched) {
      setSelectedPreset(matched);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 selection:bg-rose-500/30 selection:text-rose-200" id="main-root">
      {/* Visual Ambient Background Ornaments */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-indigo-950/20 via-[#070b16]/5 to-transparent pointer-events-none" />
      <div className="absolute top-[10%] left-[8%] w-96 h-96 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[35%] right-[5%] w-80 h-80 rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative space-y-10">
        
        {/* Header Section */}
        <header className="text-center space-y-3 max-w-3xl mx-auto pt-4" id="app-header">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-rose-350">
            <Sparkles size={12} className="text-rose-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Inti Rekonstruksi Piksel SynthID Mode Ganda</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </div>

          <h1 className="font-sans font-semibold text-3xl sm:text-4xl tracking-tight text-white mb-2">
            Gemini Watermark Remover
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Secara otomatis memecahkan dan menghilangkan tanda air (watermark) domain frekuensi yang tidak terlihat dari gambar buatan Imagen 3 
            dan Veo menggunakan <strong className="text-slate-200">Matematika Reverse Alpha-Blending</strong> tanpa penurunan kualitas (lossless) secara real-time.
          </p>
        </header>

        {/* First Module: Presets Selection (Bento Cards Grid) */}
        <section className="space-y-4" id="presets-section">
          <PresetsCatalog 
            selectedPresetId={selectedPreset ? selectedPreset.id : null}
            onSelectPreset={handleSelectPreset}
          />
        </section>

        {/* Second Module: Active Editing Workspace (Image Sandbox) */}
        <main className="space-y-4" id="workspace-section">
          <div className="bg-gradient-to-r from-rose-500/10 via-indigo-500/5 to-transparent rounded-2xl p-0.5 shadow-xl">
            <div className="bg-[#0b101f]/95 rounded-[14px] p-6">
              <WatermarkEditor 
                selectedPreset={selectedPreset}
                onPresetMatched={handlePresetMatched}
              />
            </div>
          </div>
        </main>

        {/* Third Module: Context, Science & Explainer section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch" id="explainer-section">
          <div className="md:col-span-8">
            <MethodExplainer />
          </div>

          {/* Quick FAQ / Non-proliferation Research Guidelines */}
          <div className="md:col-span-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4" id="quick-faq">
            <div className="space-y-4">
              <h3 className="font-sans font-medium text-slate-150 flex items-center gap-2">
                <Shield size={16} className="text-blue-400" />
                Mekanisme Deteksi
              </h3>
              
              <ul className="space-y-3.5 text-xs text-slate-400 leading-normal">
                <li className="flex gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>
                    <strong>Matematika Lossless:</strong> Penghapus stempel foto tradisional merusak gambar dengan efek buram (lossy), tetapi pemecah ini secara matematis membatalkan pemetaan bobot-alfa yang tepat.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>
                    <strong>Agnostik Resolusi:</strong> Kalibrasi menangani rasio aspek khusus dengan koordinat terukur secara dinamis.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>
                    <strong>Tahan Kompresi:</strong> Algoritma kelebihan penguatan (over-gain) yang dapat disesuaikan memulihkan pola yang rusak akibat penyimpanan JPG atau WebP yang terkompresi.
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-850 text-[10px] text-slate-500 leading-normal">
              Pratinjau Pengembangan V1.0.27 • Didistribusikan sebagai sumber terbuka (open-source) di bawah ketentuan lisensi MIT. Hanya untuk keperluan pengujian non-proliferasi ilmiah dan referensi desain.
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 pb-4 text-xs text-slate-500 space-y-2 border-t border-slate-900" id="app-footer">
          <p>© 2026 Proyek Gemini Watermark Remover. Didukung oleh kalibrasi invers DeepMind SynthID.</p>
          <p className="max-w-2xl mx-auto text-[10px] text-slate-600">
            Pemberitahuan: Semua materi disediakan hanya untuk tujuan pendidikan dan analisis gambar non-destruktif. Tidak ada sertifikat kepenulisan digital yang dimodifikasi atau dipalsukan. Periksa protokol lisensi untuk hak intelektual.
          </p>
        </footer>
      </div>
    </div>
  );
}
