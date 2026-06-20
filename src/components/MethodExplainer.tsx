import React from 'react';
import { HelpCircle, RefreshCw, Layers, ShieldCheck } from 'lucide-react';

export default function MethodExplainer() {
  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl" id="explainer-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
          <HelpCircle size={20} />
        </div>
        <h3 className="font-sans font-medium text-lg text-slate-100">
          Cara Kerja Penghapusan Reverse-Alpha Lossless
        </h3>
      </div>

      <p className="text-slate-300 text-sm leading-relaxed mb-6">
        Berbeda dengan jaringan saraf generatif yang "memperkirakan" piksel dan menghasilkan keburaman (inpainting), 
        Gemini Watermark Remover menggunakan 
        <strong className="text-slate-100"> pemecah matematika invers langsung</strong>. Karena tanda air 
        digabungkan secara digital menggunakan persamaan alfa standar, kita dapat mengekstrak piksel asli dengan ketepatan (fidelity) 100%.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-2 mb-2 text-xs text-slate-400 font-mono tracking-wider uppercase">
            <Layers size={14} className="text-blue-400" />
            1. Penggabungan Maju (Pemberian Watermark)
          </div>
          <div className="font-mono text-sm bg-slate-900 px-3 py-2 rounded-lg text-blue-300 font-semibold text-center select-none overflow-x-auto">
            W = α × L + (1 - α) × O
          </div>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            Gambar bertanda air <strong className="text-slate-300">(W)</strong> adalah jumlah gabungan dari 
            masker templat logo <strong className="text-slate-300">(L)</strong> dengan opasitas 
            <strong className="text-slate-300">(α)</strong> dan gambar asli <strong className="text-slate-300">(O)</strong>.
          </p>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-2 mb-2 text-xs text-slate-400 font-mono tracking-wider uppercase">
            <RefreshCw size={14} className="text-rose-400" />
            2. Rekonstruksi Terbalik (Penghapusan)
          </div>
          <div className="font-mono text-sm bg-slate-900 px-3 py-2 rounded-lg text-rose-300 font-semibold text-center select-none overflow-x-auto">
            O = (W - α × L) / (1 - α)
          </div>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            Kurangi vektor logo berbobot dari sinyal bertanda air dan normalisasikan dengan koefisien 
            opasitas yang tersisa <strong className="text-slate-300">(1 - α)</strong>.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-rose-500/5 p-4 border border-rose-500/15 rounded-xl">
        <ShieldCheck className="text-rose-400 shrink-0 mt-0.5" size={16} />
        <div className="text-xs text-slate-400 leading-relaxed">
          <span className="text-slate-300 font-medium font-sans">Mengapa SynthID Butuh Kalibrasi:</span> Tanda air 
          yang disisipkan dengan SynthID oleh Google mengandung peta radial multifrekuensi kompleks dari cincin konsentris yang 
          hampir tidak terlihat. Untuk mencapai pemulihan tanpa penurunan kualitas (lossless), kita harus mengkalibrasi posisi X/Y, batas bawah 
          derau (noise floor), dan rasio alfa agar cocok dengan karakteristik enkoder asli.
        </div>
      </div>
    </div>
  );
}
