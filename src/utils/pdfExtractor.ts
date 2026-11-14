import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { reconstructPdfPageText, type PdfTextItem } from './pdfLayout';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function extractTextFromPdf(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const items: PdfTextItem[] = [];
    for (const rawItem of textContent.items) {
      if ('str' in rawItem && rawItem.str) {
        const transform = rawItem.transform as number[];
        items.push({
          str: rawItem.str,
          x: transform[4] ?? 0,
          y: transform[5] ?? 0,
          width: 'width' in rawItem ? Number(rawItem.width) : undefined,
        });
      }
    }

    const pageText = reconstructPdfPageText(items, viewport.width);
    if (pageText.trim()) {
      pageTexts.push(pageText);
    }

    if (onProgress) {
      onProgress(Math.round((pageNum / totalPages) * 100));
    }
  }

  return pageTexts.join('\n\n');
}
