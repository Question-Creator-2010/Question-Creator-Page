/**
 * Computes Otsu's optimal binarization threshold for a grayscale histogram (0-255)
 * and applies high-contrast grayscale thresholding in-place on RGBA pixel buffers.
 */
export function computeOtsuThreshold(grayValues: Uint8Array): number {
  if (grayValues.length === 0) return 128;

  const histogram = new Int32Array(256);
  for (let i = 0; i < grayValues.length; i++) {
    histogram[grayValues[i]]++;
  }

  const total = grayValues.length;
  let sum = 0;
  for (let t = 0; t < 256; t++) {
    sum += t * histogram[t];
  }

  let sumB = 0;
  let wB = 0;
  let maxVariance = -1;
  let threshold = 140;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const betweenVar = wB * wF * (mB - mF) * (mB - mF);

    if (betweenVar > maxVariance) {
      maxVariance = betweenVar;
      threshold = t;
    }
  }

  // Slight bias upward (+8) helps preserve faint Bengali matra strokes on light paper
  return Math.min(220, Math.max(60, threshold + 8));
}

/**
 * Converts RGBA pixel buffer to grayscale + high-contrast black/white binarization.
 */
export function binarizeRgbaBuffer(data: Uint8ClampedArray): void {
  const pixelCount = Math.floor(data.length / 4);
  if (pixelCount === 0) return;

  const grays = new Uint8Array(pixelCount);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const lum = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
    );
    grays[p] = lum;
  }

  const threshold = computeOtsuThreshold(grays);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const val = grays[p] >= threshold ? 255 : 0;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
  }
}

export interface PreprocessedImageResult {
  blobs: Blob[];
  isTwoColumnSplit: boolean;
  naturalWidth: number;
  naturalHeight: number;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('ছবিটি লোড করা যায়নি।'));
    };
    img.src = url;
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('ক্যানভাস থেকে ছবি তৈরি করা যায়নি।'));
    }, 'image/png');
  });
}

/**
 * Scales image by 2.5x, applies grayscale + high-contrast Otsu binarization,
 * and optionally splits into Left Half and Right Half canvases when 2-column mode is active.
 */
export async function preprocessImageForOcr(
  file: File,
  splitTwoColumns: boolean | 'auto' = 'auto',
): Promise<PreprocessedImageResult> {
  const img = await loadImageElement(file);
  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;

  // Cap max scaled dimension at 4200px to avoid excessive memory usage on mobile devices
  const rawScale = 2.5;
  const maxDim = Math.max(naturalWidth * rawScale, naturalHeight * rawScale);
  const scale = maxDim > 4200 ? 4200 / Math.max(naturalWidth, naturalHeight) : rawScale;

  const targetWidth = Math.max(1, Math.round(naturalWidth * scale));
  const targetHeight = Math.max(1, Math.round(naturalHeight * scale));

  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = targetWidth;
  fullCanvas.height = targetHeight;

  const ctx = fullCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('ব্রাউজার 2D ক্যানভাস সাপোর্ট করছে না।');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  binarizeRgbaBuffer(imageData.data);
  ctx.putImageData(imageData, 0, 0);

  const shouldSplit =
    splitTwoColumns === 'auto' ? naturalWidth > naturalHeight : splitTwoColumns;

  if (!shouldSplit) {
    const blob = await canvasToPngBlob(fullCanvas);
    return {
      blobs: [blob],
      isTwoColumnSplit: false,
      naturalWidth,
      naturalHeight,
    };
  }

  // Split into Left Half and Right Half with a tiny overlap safety margin (none needed if clean center)
  const halfWidth = Math.floor(targetWidth / 2);

  const leftCanvas = document.createElement('canvas');
  leftCanvas.width = halfWidth;
  leftCanvas.height = targetHeight;
  const leftCtx = leftCanvas.getContext('2d');
  if (!leftCtx) throw new Error('Left canvas context error');
  leftCtx.drawImage(fullCanvas, 0, 0, halfWidth, targetHeight, 0, 0, halfWidth, targetHeight);

  const rightWidth = targetWidth - halfWidth;
  const rightCanvas = document.createElement('canvas');
  rightCanvas.width = rightWidth;
  rightCanvas.height = targetHeight;
  const rightCtx = rightCanvas.getContext('2d');
  if (!rightCtx) throw new Error('Right canvas context error');
  rightCtx.drawImage(
    fullCanvas,
    halfWidth,
    0,
    rightWidth,
    targetHeight,
    0,
    0,
    rightWidth,
    targetHeight,
  );

  const [leftBlob, rightBlob] = await Promise.all([
    canvasToPngBlob(leftCanvas),
    canvasToPngBlob(rightCanvas),
  ]);

  return {
    blobs: [leftBlob, rightBlob],
    isTwoColumnSplit: true,
    naturalWidth,
    naturalHeight,
  };
}
