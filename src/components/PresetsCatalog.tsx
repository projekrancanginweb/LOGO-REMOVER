import React from 'react';
import { WATERMARK_PRESETS } from '../utils/presets';
import { WatermarkPreset } from '../types';
import { Sparkles, Grid, Disc, Ban, ShieldCheck } from 'lucide-react';

interface PresetsCatalogProps {
  selectedPresetId: string | null;
  onSelectPreset: (preset: WatermarkPreset) => void;
}

export default function PresetsCatalog({ selectedPresetId, onSelectPreset }: PresetsCatalogProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'rings':
        return <Disc size={15} className="text-blue-400 animate-pulse" />;
      case 'logo':
        return <Sparkles size={15} className="text-rose-400" />;
      case 'grid':
        return <Grid size={15} className="text-violet-400" />;
      default:
        return <ShieldCheck size={15} className="text-emerald-400" />;
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl" id="presets-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-sans font-medium text-lg text-slate-100 flex items-center gap-2">
          Pilihan Ukuran &amp; Prasetel Sistem
        </h3>
        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
          {WATERMARK_PRESETS.length} Profil dimuat
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {WATERMARK_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`text-left p-4 rounded-xl border transition-all relative ${
                isSelected
                  ? 'bg-slate-800/80 border-rose-500/60 shadow-lg shadow-rose-950/10 scale-[1.01]'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/70'
              }`}
              id={`preset-${preset.id}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-sans font-medium text-sm text-slate-100">
                  {preset.name}
                </span>
                <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-md text-[10px] font-mono font-medium text-slate-300 border border-slate-800">
                  {getIcon(preset.patternType)}
                  {preset.patternType.toUpperCase()}
                </span>
              </div>

              <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-3">
                {preset.description}
              </p>

              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                <span>
                  Ukuran: <strong className="text-slate-400">{preset.width}×{preset.height}</strong>
                </span>
                <span>•</span>
                <span>
                  Alfa: <strong className="text-slate-400">{(preset.alpha * 100).toFixed(0)}%</strong>
                </span>
                <span>•</span>
                <span>
                  Logo: <strong className="text-slate-400">{preset.logoValue === 255 ? 'Putih' : 'Hitam'}</strong>
                </span>
              </div>

              {isSelected && (
                <div className="absolute bottom-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
