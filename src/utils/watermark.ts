import { CalibrationParams, WatermarkPatternType } from '../types';

/**
 * Generates an alpha map (values 0.0 to 1.0) for the watermark area.
 * Returns an array of size (width * height).
 */
export function generateAlphaMap(
  width: number,
  height: number,
  patternType: WatermarkPatternType,
  baseAlpha: number
): Float32Array {
  const alphaMap = new Float32Array(width * height);
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(cx, cy);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);

      if (patternType === 'circle') {
        // Soft circular radial gradient
        const factor = Math.max(0, 1 - r / maxRadius);
        alphaMap[idx] = Math.pow(factor, 1.5) * baseAlpha;
      } else if (patternType === 'rings') {
        // Concentric waves representing high-frequency frequencies (SynthID-style)
        if (r <= maxRadius) {
          const envelope = Math.pow(1 - r / maxRadius, 1.2);
          // Sine waves representing high/medium frequency patterns
          const ringWave = (Math.sin(r * 0.25) + 1) / 2 * 0.7 + 0.3;
          alphaMap[idx] = envelope * ringWave * baseAlpha;
        } else {
          alphaMap[idx] = 0;
        }
      } else if (patternType === 'logo') {
        // Gemini-signature 4-pointed Spark star: |x|^0.5 + |y|^0.5 <= radius^0.5
        const normX = dx / (maxRadius * 0.85);
        const normY = dy / (maxRadius * 0.85);
        const starMetric = Math.sqrt(Math.abs(normX)) + Math.sqrt(Math.abs(normY));
        if (starMetric <= 1) {
          const alphaFactor = Math.pow(1 - starMetric, 0.8);
          alphaMap[idx] = alphaFactor * baseAlpha;
        } else {
          alphaMap[idx] = 0;
        }
      } else if (patternType === 'grid') {
        // Regular lattice of microdots simulating frequency carrier signals
        const cellX = x % 16;
        const cellY = y % 16;
        const dotDx = cellX - 8;
        const dotDy = cellY - 8;
        const dotR = Math.sqrt(dotDx * dotDx + dotDy * dotDy);
        
        // Background smooth envelope
        const envelope = Math.max(0, 1 - r / maxRadius);
        const gridValue = dotR < 3 ? (1 - dotR / 3) * 0.8 : 0;
        alphaMap[idx] = envelope * gridValue * baseAlpha;
      } else {
        // Default text-like linear bounding bar representing traditional watermark
        if (y > height * 0.4 && y < height * 0.6) {
          const xFactor = 1 - Math.abs(x - cx) / cx;
          alphaMap[idx] = Math.max(0, xFactor) * baseAlpha * 0.8;
        } else {
          alphaMap[idx] = 0;
        }
      }
    }
  }

  return alphaMap;
}

/**
 * Procedurally draws a high-quality, elegant landscape image on canvas to test the watermarking tool.
 */
export function drawTestPattern(canvas: HTMLCanvasElement, artworkType: 'cosmos' | 'sunset' | 'radial') {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  if (artworkType === 'cosmos') {
    // Dark deep blue and violet cosmos nebula
    const gd = ctx.createRadialGradient(w/2, h/2, 10, w/2, h/2, Math.max(w, h));
    gd.addColorStop(0, '#311059');
    gd.addColorStop(0.3, '#100a30');
    gd.addColorStop(0.7, '#07041a');
    gd.addColorStop(1, '#020108');
    ctx.fillStyle = gd;
    ctx.fillRect(0, 0, w, h);

    // Draw some stylized planetary circles & dust
    ctx.fillStyle = 'rgba(120, 80, 240, 0.15)';
    ctx.beginPath();
    ctx.arc(w * 0.4, h * 0.35, Math.min(w, h) * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(230, 80, 150, 0.1)';
    ctx.beginPath();
    ctx.arc(w * 0.7, h * 0.6, Math.min(w, h) * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Elegant glowing golden sphere
    const goldenGd = ctx.createRadialGradient(w * 0.2, h * 0.2, 5, w * 0.2, h * 0.2, w * 0.15);
    goldenGd.addColorStop(0, '#ffeaaa');
    goldenGd.addColorStop(0.2, '#ffd369');
    goldenGd.addColorStop(1, 'rgba(255, 120, 0, 0)');
    ctx.fillStyle = goldenGd;
    ctx.beginPath();
    ctx.arc(w * 0.2, h * 0.2, w * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Cosmic grids
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
  } else if (artworkType === 'sunset') {
    // Warm retro-sunset design
    const gd = ctx.createLinearGradient(0, 0, 0, h);
    gd.addColorStop(0, '#f85f73');
    gd.addColorStop(0.4, '#f7db69');
    gd.addColorStop(0.7, '#343f56');
    gd.addColorStop(1, '#1c1e30');
    ctx.fillStyle = gd;
    ctx.fillRect(0, 0, w, h);

    // Big central sun
    const sunGd = ctx.createLinearGradient(0, h*0.25, 0, h*0.65);
    sunGd.addColorStop(0, '#ffffff');
    sunGd.addColorStop(1, '#ff6a6a');
    ctx.fillStyle = sunGd;
    ctx.beginPath();
    ctx.arc(w/2, h*0.42, w * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Sun block notches simulating retro scanlines
    ctx.fillStyle = '#f85f73';
    for (let sy = h*0.48; sy < h*0.65; sy += 10) {
      ctx.fillRect(w/2 - w * 0.2, sy, w * 0.4, 4);
    }

    // Mountains silhouette
    ctx.fillStyle = '#0f111a';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w * 0.3, h * 0.65);
    ctx.lineTo(w * 0.55, h * 0.78);
    ctx.lineTo(w * 0.8, h * 0.58);
    ctx.lineTo(w, h);
    ctx.fill();
  } else {
    // Minimal radial geometric pattern
    ctx.fillStyle = '#fbfbfa';
    ctx.fillRect(0, 0, w, h);

    // Dynamic grid arcs
    ctx.strokeStyle = '#e1e1de';
    ctx.lineWidth = 1.5;
    for (let r = w * 0.1; r < w * 0.9; r += w * 0.08) {
      ctx.beginPath();
      ctx.arc(w/2, h/2, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // High contrast accent lines
    ctx.strokeStyle = '#f43f5e'; // rose color
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(w/2, h/2, w * 0.34, 0, Math.PI * 0.65);
    ctx.stroke();

    ctx.strokeStyle = '#3b82f6'; // blue accent
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w/2, h/2, w * 0.5, Math.PI * 0.8, Math.PI * 1.4);
    ctx.stroke();

    // Central circular disk
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(w/2, h/2, w * 0.06, 0, Math.PI*2);
    ctx.fill();
  }
}

/**
 * Appends a watermark onto the image on the canvas using standard alpha blending.
 * Equation: Output = Alpha * LogoValue + (1 - Alpha) * Original
 */
export function blendWatermarkOnCanvas(
  ctx: CanvasRenderingContext2D,
  alphaMap: Float32Array,
  xOffset: number,
  yOffset: number,
  rectW: number,
  rectH: number,
  logoValue: number
) {
  const currentImgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = currentImgData.data;
  const canvasW = ctx.canvas.width;

  for (let row = 0; row < rectH; row++) {
    for (let col = 0; col < rectW; col++) {
      const destX = xOffset + col;
      const destY = yOffset + row;

      // Wrap-around security or ignore if out of canvas bounds
      if (destX < 0 || destX >= canvasW || destY < 0 || destY >= ctx.canvas.height) {
        continue;
      }

      const pixelIdx = (destY * canvasW + destX) * 4;
      const alphaIdx = row * rectW + col;
      const alpha = alphaMap[alphaIdx];

      if (alpha <= 0) continue;

      // Blend Red, Green, Blue
      for (let c = 0; c < 3; c++) {
        const originalVal = data[pixelIdx + c];
        const blended = alpha * logoValue + (1 - alpha) * originalVal;
        data[pixelIdx + c] = Math.max(0, Math.min(255, Math.round(blended)));
      }
    }
  }

  ctx.putImageData(currentImgData, 0, 0);
}

/**
 * Solves the watermark using reverse alpha blending formula.
 * Equation: Original = (Watermarked - alpha * LogoValue) / (1 - alpha)
 */
export function solveWatermarkOnCanvas(
  ctx: CanvasRenderingContext2D,
  alphaMap: Float32Array,
  xOffset: number,
  yOffset: number,
  rectW: number,
  rectH: number,
  params: CalibrationParams
): { changedPixels: number; durationMs: number; stopReason: string } {
  const start = performance.now();
  const currentImgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = currentImgData.data;
  const canvasW = ctx.canvas.width;
  const canvasH = ctx.canvas.height;

  const { alphaGain, noiseFloor, logoValue } = params;
  let changedPixels = 0;

  const ALPHA_NOISE_FLOOR = noiseFloor / 255;
  const ALPHA_THRESHOLD = 0.002;
  const MAX_ALPHA = 0.99;

  for (let row = 0; row < rectH; row++) {
    for (let col = 0; col < rectW; col++) {
      const destX = Math.round(xOffset + col);
      const destY = Math.round(yOffset + row);

      if (destX < 0 || destX >= canvasW || destY < 0 || destY >= canvasH) {
        continue;
      }

      const pixelIdx = (destY * canvasW + destX) * 4;
      const alphaIdx = row * rectW + col;

      const rawAlpha = alphaMap[alphaIdx];
      const alphaMagnitude = Math.abs(rawAlpha);

      // Apply noise floor deduction
      const signalAlpha = Math.max(0, alphaMagnitude - ALPHA_NOISE_FLOOR) * alphaGain;

      // If alpha is below noise trigger, skip processing to avoid quantization noise amplification
      if (signalAlpha < ALPHA_THRESHOLD) {
        continue;
      }

      // Constrain alpha to safe levels to avoid division-by-zero or blowing up values
      const alpha = Math.min(alphaMagnitude * alphaGain, MAX_ALPHA);
      const oneMinusAlpha = 1.0 - alpha;

      let pixelChanged = false;
      for (let c = 0; c < 3; c++) {
        const watermarked = data[pixelIdx + c];
        // Solve formula: (W - alpha * L) / (1 - alpha)
        const solved = (watermarked - alpha * logoValue) / oneMinusAlpha;
        const clamped = Math.max(0, Math.min(255, Math.round(solved)));
        
        if (clamped !== watermarked) {
          data[pixelIdx + c] = clamped;
          pixelChanged = true;
        }
      }

      if (pixelChanged) {
        changedPixels++;
      }
    }
  }

  ctx.putImageData(currentImgData, 0, 0);
  const end = performance.now();

  return {
    changedPixels,
    durationMs: end - start,
    stopReason: changedPixels > 0 ? 'residual-under-control' : 'zero-match-within-threshold'
  };
}

/**
 * Helper to compute an approximate PSNR (Peak-Signal-To-Noise Ratio) between two canvases
 * to display restoration quality metrics.
 */
export function calculatePSNR(
  originalData: Uint8ClampedArray,
  processedData: Uint8ClampedArray
): { psnr: number; mse: number } {
  let sse = 0;
  const count = originalData.length;

  for (let i = 0; i < count; i += 4) {
    const dr = originalData[i] - processedData[i];
    const dg = originalData[i + 1] - processedData[i + 1];
    const db = originalData[i + 2] - processedData[i + 2];
    sse += dr * dr + dg * dg + db * db;
  }

  // Calculate Mean Square Error (divided by RGB components excluding Alpha)
  const pixelCount = count / 4;
  const mse = sse / (pixelCount * 3);

  if (mse === 0) {
    return { psnr: 99.9, mse: 0 }; // Identical images
  }

  // PSNR = 20 * log10(MAX_I) - 10 * log10(MSE)
  const psnr = 20 * Math.log10(255) - 10 * Math.log10(mse);
  return { psnr: Math.round(psnr * 10) / 10, mse: Math.round(mse * 100) / 100 };
}
