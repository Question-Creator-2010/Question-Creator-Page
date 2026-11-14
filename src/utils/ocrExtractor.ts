import { createWorker } from 'tesseract.js';
import { preprocessImageForOcr } from './imagePreprocess';

export interface OcrOptions {
  splitTwoColumns: boolean | 'auto';
  onProgress?: (percent: number, statusLabel: string) => void;
}

export async function extractTextFromImage(
  file: File,
  options: OcrOptions | ((percent: number, statusLabel: string) => void),
): Promise<string> {
  const opts: OcrOptions =
    typeof options === 'function'
      ? { splitTwoColumns: 'auto', onProgress: options }
      : options;

  const { splitTwoColumns, onProgress } = opts;

  onProgress?.(5, 'ছবিটি ২.৫ গুণ বড় ও হাই-কনট্রাস্ট করা হচ্ছে...');
  const { blobs, isTwoColumnSplit } = await preprocessImageForOcr(
    file,
    splitTwoColumns,
  );

  let currentPart = 0;
  const totalParts = blobs.length;

  const worker = await createWorker(['ben', 'eng'], 1, {
    logger: (message) => {
      if (onProgress && typeof message.progress === 'number') {
        const partBase = 10 + (currentPart / totalParts) * 90;
        const partSpan = 90 / totalParts;
        const pct = Math.min(
          99,
          Math.max(10, Math.round(partBase + message.progress * partSpan)),
        );
        const partLabel = isTwoColumnSplit
          ? currentPart === 0
            ? 'বাম কলাম স্ক্যান হচ্ছে...'
            : 'ডান কলাম স্ক্যান হচ্ছে...'
          : 'ছবি থেকে বাংলা ও ইংরেজি লেখা শনাক্ত হচ্ছে...';

        const label =
          message.status === 'loading language traineddata'
            ? 'বাংলা ও ইংরেজি OCR ডেটা লোড হচ্ছে...'
            : message.status === 'recognizing text'
              ? partLabel
              : 'OCR ইঞ্জিন প্রস্তুত হচ্ছে...';

        onProgress(pct, label);
      }
    },
  });

  try {
    const texts: string[] = [];
    for (let i = 0; i < blobs.length; i++) {
      currentPart = i;
      const {
        data: { text },
      } = await worker.recognize(blobs[i]);
      if (text.trim()) {
        texts.push(text.trim());
      }
    }
    onProgress?.(100, 'স্ক্যান সম্পন্ন হয়েছে');
    return texts.join('\n\n').trim();
  } finally {
    await worker.terminate();
  }
}
