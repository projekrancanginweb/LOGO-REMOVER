import React, { useEffect, useRef, useState, useTransition } from 'react';
import { 
  Upload, Sparkles, Sliders, Play, RotateCcw, Image as ImageIcon, 
  Layers, CheckCircle, Terminal, HelpCircle, AlertTriangle, Monitor, Download 
} from 'lucide-react';
import { CalibrationParams, WatermarkPreset, WatermarkPatternType } from '../types';
import { 
  generateAlphaMap, 
  drawTestPattern, 
  blendWatermarkOnCanvas, 
  solveWatermarkOnCanvas,
  calculatePSNR 
} from '../utils/watermark';
import { WATERMARK_PRESETS } from '../utils/presets';

interface WatermarkEditorProps {
  selectedPreset: WatermarkPreset | null;
  onPresetMatched: (presetId: string) => void;
}

export default function WatermarkEditor({ selectedPreset, onPresetMatched }: WatermarkEditorProps) {
  const [, startTransition] = useTransition();
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const blendCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const restoreCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Calibration States
  const [params, setParams] = useState<CalibrationParams>({
    x: 82,
    y: 82,
    size: 25,
    alpha: 0.10,
    logoValue: 255,
    patternType: 'rings',
    alphaGain: 1.0,
    noiseFloor: 3.0
  });

  const [activeTab, setActiveTab] = useState<'simulate' | 'solve'>('solve');
  const [artworkType, setArtworkType] = useState<'cosmos' | 'sunset' | 'radial' | 'uploaded'>('cosmos');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isWatermarked, setIsWatermarked] = useState<boolean>(true);
  
  // Metrics & console logs
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<{
    durationMs: number;
    changedPixels: number;
    psnr: number;
    mse: number;
    stopReason: string;
  } | null>(null);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);

  // Helper to append telemetry log
  const logMessage = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 48)]);
  };

  // Sync parameters when a preset is selected from parent
  useEffect(() => {
    if (selectedPreset) {
      logMessage(`Beralih ke prasetel: ${selectedPreset.nameValue || selectedPreset.name}`);
      setParams({
        x: Math.round(selectedPreset.position.x * 100),
        y: Math.round(selectedPreset.position.y * 100),
        size: Math.round((selectedPreset.position.size / Math.min(selectedPreset.width, selectedPreset.height)) * 100),
        alpha: selectedPreset.alpha,
        logoValue: selectedPreset.logoValue,
        patternType: selectedPreset.patternType,
        alphaGain: 1.0,
        noiseFloor: 3.0
      });
      // Ensure we match canvas size
      if (sourceCanvasRef.current) {
        sourceCanvasRef.current.width = selectedPreset.width;
        sourceCanvasRef.current.height = selectedPreset.height;
      }
      setIsWatermarked(true);
      triggerRender();
    }
  }, [selectedPreset]);

  // Initial Draw
  useEffect(() => {
    initCanvas();
  }, [artworkType]);

  // Handle manual coordinate changes
  const initCanvas = () => {
    const canvas = sourceCanvasRef.current;
    if (!canvas) return;

    if (artworkType !== 'uploaded') {
      canvas.width = selectedPreset?.width || 1024;
      canvas.height = selectedPreset?.height || 1024;
      drawTestPattern(canvas, artworkType);
      logMessage(`Inisialisasi templat kanvas: ${artworkType.toUpperCase()} (${canvas.width}×${canvas.height})`);
      setIsWatermarked(true);
      triggerRender();
    }
  };

  const triggerRender = () => {
    startTransition(() => {
      // Small timeout to guarantee canvas bounds has settled
      setTimeout(() => {
        applyPipeline();
      }, 50);
    });
  };

  // Run the full pipeline: Original -> Watermarked -> Restored
  const applyPipeline = () => {
    const sourceCanvas = sourceCanvasRef.current;
    const blendCanvas = blendCanvasRef.current;
    const restoreCanvas = restoreCanvasRef.current;

    if (!sourceCanvas || !blendCanvas || !restoreCanvas) return;

    const w = sourceCanvas.width;
    const h = sourceCanvas.height;

    // Set matching dimensions
    blendCanvas.width = w;
    blendCanvas.height = h;
    restoreCanvas.width = w;
    restoreCanvas.height = h;

    const srcCtx = sourceCanvas.getContext('2d');
    const blendCtx = blendCanvas.getContext('2d');
    const restoreCtx = restoreCanvas.getContext('2d');

    if (!srcCtx || !blendCtx || !restoreCtx) return;

    // 1. Copy original image to blending (watermarked) canvas
    blendCtx.clearRect(0, 0, w, h);
    blendCtx.drawImage(sourceCanvas, 0, 0);

    // Calculate absolute size and position
    const actualSize = Math.max(20, Math.round((params.size / 100) * Math.min(w, h)));
    const actualX = Math.round((params.x / 100) * w - actualSize / 2);
    const actualY = Math.round((params.y / 100) * h - actualSize / 2);

    // 2. If watermarking is enabled, generate alpha map & blend on top
    if (isWatermarked) {
      const alphaMap = generateAlphaMap(actualSize, actualSize, params.patternType, params.alpha);
      blendWatermarkOnCanvas(blendCtx, alphaMap, actualX, actualY, actualSize, actualSize, params.logoValue);
    }

    // 3. Initialize restoring canvas with blended image
    restoreCtx.clearRect(0, 0, w, h);
    restoreCtx.drawImage(blendCanvas, 0, 0);

    // 4. Solve / Remove using Alpha maps
    const alphaMapSolver = generateAlphaMap(actualSize, actualSize, params.patternType, params.alpha);
    const solveResults = solveWatermarkOnCanvas(
      restoreCtx,
      alphaMapSolver,
      actualX,
      actualY,
      actualSize,
      actualSize,
      params
    );

    // 5. Compare cleaned output with original to derive PSNR
    const origData = srcCtx.getImageData(0, 0, w, h).data;
    const cleanData = restoreCtx.getImageData(0, 0, w, h).data;
    const psnrMetric = calculatePSNR(origData, cleanData);

    setMetrics({
      durationMs: solveResults.durationMs,
      changedPixels: solveResults.changedPixels,
      psnr: psnrMetric.psnr,
      mse: psnrMetric.mse,
      stopReason: solveResults.stopReason
    });

    logMessage(
      `Alur selesai: PSNR = ${psnrMetric.psnr} dB, piksel SSE dimodifikasi = ${solveResults.changedPixels}`
    );
  };

  // Handle uploaded files
  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = sourceCanvasRef.current;
        if (!canvas) return;

        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, img.width, img.height);
          ctx.drawImage(img, 0, 0);
          setUploadedFileName(file.name);
          setArtworkType('uploaded');
          setIsWatermarked(true);
          logMessage(`Pengguna mengimpor aset kustom: ${file.name} (${img.width}×${img.height})`);
          
          // Try to auto-match size preset
          const matchingPreset = WATERMARK_PRESETS.find(
            p => p.width === img.width && p.height === img.height
          );
          if (matchingPreset) {
            logMessage(`Resolusi otomatis cocok dengan prasetel: ${matchingPreset.name}`);
            onPresetMatched(matchingPreset.id);
          } else {
            // Setup robust defaults
            setParams(p => ({
              ...p,
              x: 85,
              y: 85,
              size: 20
            }));
          }

          triggerRender();
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const canvas = restoreCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `restored_${uploadedFileName || 'gemini_unwatermarked'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    logMessage(`Aset PNG hasil pemulihan diunduh: ${link.download}`);
  };

  // Drag and drop events
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const resetParameters = () => {
    setParams({
      x: 82,
      y: 82,
      size: 25,
      alpha: 0.10,
      logoValue: 255,
      patternType: 'rings',
      alphaGain: 1.0,
      noiseFloor: 3.0
    });
    setIsWatermarked(true);
    initCanvas();
    logMessage('Parameter editor disetel ulang ke cincin melingkar default.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="editor-grid">
      {/* Canvas View Area (left 7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon size={18} className="text-rose-400" />
              <span className="font-sans font-medium text-slate-100 text-sm">
                Interactive Multi-Canvas Viewport
              </span>
            </div>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setArtworkType('cosmos')}
                className={`px-2.5 py-1 rounded-md font-sans transition ${
                  artworkType === 'cosmos' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cosmos
              </button>
              <button
                onClick={() => setArtworkType('sunset')}
                className={`px-2.5 py-1 rounded-md font-sans transition ${
                  artworkType === 'sunset' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sunset
              </button>
              <button
                onClick={() => setArtworkType('radial')}
                className={`px-2.5 py-1 rounded-md font-sans transition ${
                  artworkType === 'radial' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Geometry
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`px-2.5 py-1 rounded-md font-sans transition flex items-center gap-1 ${
                  artworkType === 'uploaded' ? 'bg-slate-800 text-rose-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload size={12} />
                Upload
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Canvas Drag Area & Grid */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative rounded-xl overflow-hidden bg-slate-950 border transition-all ${
              isDragging ? 'border-rose-500 bg-rose-950/10' : 'border-slate-850'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {/* Left Display - Watermarked Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                  <span>MASUKAN: Sumber Ber-watermark</span>
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {sourceCanvasRef.current ? `${sourceCanvasRef.current.width}×${sourceCanvasRef.current.height}` : '--'}
                  </span>
                </div>
                <div className="aspect-square bg-slate-900 rounded-lg flex items-center justify-center p-2 border border-slate-850/50 relative overflow-hidden group">
                  <canvas ref={blendCanvasRef} className="max-w-full max-h-full object-contain rounded" />
                  {!isWatermarked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm">
                      <p className="text-xs text-slate-400">Simulasi Watermark Mati</p>
                    </div>
                  )}
                  {/* Absolute Target Coordinate Indicator Overlay */}
                  {isWatermarked && (
                    <div 
                      className="absolute border border-rose-500/80 bg-rose-500/10 rounded-full animate-pulse flex items-center justify-center pointer-events-none"
                      style={{
                        left: `${params.x}%`,
                        top: `${params.y}%`,
                        width: `${params.size}%`,
                        height: `${params.size}%`,
                        transform: 'translate(-50%, -50%)',
                        maxWidth: '80%',
                        maxHeight: '80%'
                      }}
                    >
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Display - Restored Lossless Result */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                  <span className="text-slate-150 flex items-center gap-1">
                    <CheckCircle size={12} className="text-rose-400" />
                    KELUARAN: Solusi Tanpa Cacat
                  </span>
                  {metrics && (
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
                      PSNR: {metrics.psnr} dB
                    </span>
                  )}
                </div>
                <div className="aspect-square bg-slate-900 rounded-lg flex items-center justify-center p-2 border border-slate-850/50 relative overflow-hidden group">
                  <canvas ref={restoreCanvasRef} className="max-w-full max-h-full object-contain rounded" />
                  
                  {/* Floating Action Button inside Output */}
                  <button
                    onClick={handleDownload}
                    className="absolute bottom-3 right-3 p-2 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 hover:text-slate-100 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs"
                    title="Ekspor gambar hasil pemulihan"
                  >
                    <Download size={14} />
                    Unduh PNG
                  </button>
                </div>
              </div>
            </div>

            {/* Hidden canvas holding pure original content */}
            <canvas ref={sourceCanvasRef} className="hidden" />

            {/* Drag and drop helper text */}
            {artworkType !== 'uploaded' && (
              <div className="p-4 bg-slate-950/70 border-t border-slate-850/80 flex items-center justify-center gap-3 text-xs text-slate-400">
                <Upload size={14} className="text-slate-500" />
                <span>Tarik dan seret foto AI yang memiliki watermark langsung ke dalam editor</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Web console logs */}
        <div className="bg-slate-955 rounded-2xl border border-slate-850 p-4 shadow-inner">
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-400 font-mono tracking-wider uppercase border-b border-slate-850 pb-2">
            <Terminal size={14} className="text-slate-500" />
            Konsol telemetri kalibrasi
          </div>
          <div className="font-mono text-xs text-slate-300 space-y-1 max-h-28 overflow-y-auto select-all leading-normal">
            {logs.map((log, i) => (
              <div 
                key={i} 
                className={`${i === 0 ? 'text-rose-400 font-medium' : 'text-slate-400'}`}
              >
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-slate-600 italic">Belum ada log. Geser penggeser manual untuk memutar telemetri pemecah.</div>
            )}
          </div>
        </div>
      </div>
      {/* Settings Panel & Parameters (right 5 cols) */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders size={18} className="text-slate-300" />
              <h3 className="font-sans font-medium text-lg text-slate-100">
                Kontrol Kalibrasi
              </h3>
            </div>
            <button
              onClick={resetParameters}
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded transition"
              title="Reset penggeser manual"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Operation Tabs */}
          <div className="flex bg-slate-955 p-1 rounded-xl border border-slate-800/60 text-xs text-center font-sans">
            <button
              onClick={() => {
                setActiveTab('solve');
                setIsWatermarked(true);
                triggerRender();
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'solve' ? 'bg-slate-900 text-rose-300 shadow-sm border border-slate-800/60' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pemulihan Aktif
            </button>
            <button
              onClick={() => {
                setActiveTab('simulate');
                setIsWatermarked(false);
                triggerRender();
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'simulate' ? 'bg-slate-905 text-slate-100 shadow-sm border border-slate-800/60' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mode Simulasi (Mati)
            </button>
          </div>

          {/* Quick Metrics display inside panel */}
          {metrics && (
            <div className="bg-slate-955/65 rounded-xl p-4 border border-slate-800/60 grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">Kemiripan PSNR</span>
                <span className="text-lg font-semibold text-slate-100 font-mono">{metrics.psnr} dB</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">Waktu Pemecahan</span>
                <span className="text-lg font-semibold text-rose-400 font-mono">{metrics.durationMs.toFixed(2)} ms</span>
              </div>
            </div>
          )}

          {/* Coordinate Parameters */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono tracking-wider text-slate-400 uppercase select-none border-b border-slate-800/40 pb-1">
              Geometri Jangkar Watermark
            </h4>
            
            {/* Center X */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-350 font-sans">Lokasi Watermark X</span>
                <span className="text-slate-400 font-mono bg-slate-955 px-1.5 py-0.5 rounded border border-slate-800/50">{params.x}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.x}
                onChange={(e) => {
                  setParams((p) => ({ ...p, x: parseInt(e.target.value) }));
                  triggerRender();
                }}
                className="w-full h-1.5 bg-slate-955 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            {/* Center Y */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-350 font-sans">Lokasi Watermark Y</span>
                <span className="text-slate-400 font-mono bg-slate-955 px-1.5 py-0.5 rounded border border-slate-800/50">{params.y}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.y}
                onChange={(e) => {
                  setParams((p) => ({ ...p, y: parseInt(e.target.value) }));
                  triggerRender();
                }}
                className="w-full h-1.5 bg-slate-955 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            {/* Size */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-350 font-sans">Jangkauan Area Watermark</span>
                <span className="text-slate-400 font-mono bg-slate-955 px-1.5 py-0.5 rounded border border-slate-800/50">{params.size}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                value={params.size}
                onChange={(e) => {
                  setParams((p) => ({ ...p, size: parseInt(e.target.value) }));
                  triggerRender();
                }}
                className="w-full h-1.5 bg-slate-955 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          </div>

          {/* Pattern Type Controls */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono tracking-wider text-slate-400 uppercase select-none border-b border-slate-800/40 pb-1">
              Modulasi &amp; Bentuk Gelombang
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(['rings', 'logo', 'grid', 'circle', 'text'] as WatermarkPatternType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setParams((p) => ({ ...p, patternType: type }));
                    triggerRender();
                  }}
                  className={`px-3 py-2 rounded-xl text-left border flex items-center justify-between ${
                    params.patternType === type
                      ? 'bg-slate-800/80 text-rose-350 border-rose-500/40 font-medium'
                      : 'bg-slate-955/35 text-slate-400 border-slate-850 hover:bg-slate-955/65'
                  }`}
                >
                  <span className="capitalize font-sans">{type === 'rings' ? 'Cincin' : type === 'grid' ? 'Kisi' : type === 'circle' ? 'Lingkaran' : type === 'text' ? 'Teks' : type}</span>
                  {params.patternType === type && <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Math coefficients */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono tracking-wider text-slate-400 uppercase select-none border-b border-slate-800/40 pb-1 flex items-center gap-1.5">
              <Sliders size={12} className="text-slate-500" />
              Kalibrasi penyaring derau (de-noising) lanjut
            </h4>

            {/* Base alpha depth coefficient */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Opasitas Amplop Target (α)</span>
                <span className="text-slate-400 font-mono font-semibold">{(params.alpha * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                value={Math.round(params.alpha * 100)}
                onChange={(e) => {
                  setParams((p) => ({ ...p, alpha: parseFloat(e.target.value) / 100 }));
                  triggerRender();
                }}
                className="w-full h-1.5 bg-slate-955 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            {/* Inverse Solver Over-Gain */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Pengali Penguatan Pemulihan (Gain)</span>
                <span className="text-slate-400 font-mono font-semibold">x{params.alphaGain.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={Math.round(params.alphaGain * 100)}
                onChange={(e) => {
                  setParams((p) => ({ ...p, alphaGain: parseFloat(e.target.value) / 100 }));
                  triggerRender();
                }}
                className="w-full h-1.5 bg-slate-955 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            {/* Quantization Noise Floor limit */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Batas Bawah Derau (Noise Floor)</span>
                <span className="text-slate-400 font-mono font-semibold">{params.noiseFloor.toFixed(1)} / 255</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={params.noiseFloor}
                onChange={(e) => {
                  setParams((p) => ({ ...p, noiseFloor: parseFloat(e.target.value) }));
                  triggerRender();
                }}
                className="w-full h-1.5 bg-slate-955 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Diagnostic Banner */}
        <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 flex gap-3 text-xs items-start">
          <AlertTriangle className="text-rose-400 mt-0.5 shrink-0" size={16} />
          <div className="text-slate-400 leading-normal">
            <strong className="text-slate-200 font-sans font-semibold">Panduan pengaturan optimal:</strong> Cincin SynthID standar 
            biasanya berada di kisaran area 20% terbawah dari amplop gambar asli. Jika templat yang Anda unggah 
            menunjukkan lingkaran halo berwarna, silakan kurangi penggeser <strong className="text-slate-200 font-sans font-medium">Pengali Penguatan Pemulihan</strong> secara militer/mikroskopis ke bawah dari 1.00.
          </div>
        </div>
      </div>
    </div>
  );
}
