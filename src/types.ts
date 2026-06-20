export type WatermarkPatternType = 'rings' | 'grid' | 'logo' | 'circle' | 'text';

export interface WatermarkPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  patternType: WatermarkPatternType;
  position: {
    x: number; // proportional coordinates 0-1 or absolute pixel offset
    y: number;
    size: number; // width or radius of the watermark region
  };
  alpha: number; // base watermark opacity
  logoValue: number; // default logo brightness: 255 for white, 0 for black
  description: string;
}

export interface CalibrationParams {
  x: number; // percent 0-100
  y: number; // percent 0-100
  size: number; // percent 0-100
  alpha: number; // 0-1
  logoValue: number; // 0-255
  patternType: WatermarkPatternType;
  alphaGain: number; // 0.1-5
  noiseFloor: number; // 0-10
}

export interface ProcessedImage {
  id: string;
  name: string;
  size: string;
  originalUrl: string;
  processedUrl: string | null;
  status: 'idle' | 'processing' | 'done' | 'failed';
  metrics?: {
    durationMs: number;
    changedPixels: number;
    psnr: number; // Peak Signal-to-Noise Ratio (simulated/calculated)
    mse: number; // Mean Squared Error
    stopReason: string;
  };
}
