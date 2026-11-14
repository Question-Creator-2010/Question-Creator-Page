import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectTwoColumnLayout,
  reconstructPdfPageText,
  type PdfTextItem,
} from './pdfLayout';

test('reconstructPdfPageText separates 2-column page into Left Column top-to-bottom then Right Column top-to-bottom', () => {
  const viewportWidth = 842; // A4 landscape pt width
  const items: PdfTextItem[] = [
    // Left column (x < 404)
    { str: '১। প্রথম প্রশ্ন কী?', x: 40, y: 500, width: 140 },
    { str: '২। দ্বিতীয় প্রশ্ন কী?', x: 40, y: 470, width: 150 },
    { str: '৩। তৃতীয় প্রশ্ন কী?', x: 40, y: 440, width: 140 },
    { str: '৪। চতুর্থ প্রশ্ন কী?', x: 40, y: 410, width: 140 },
    // Right column (x >= 404), overlapping same y coordinates!
    { str: '২। সৃজনশীল দুই।', x: 450, y: 500, width: 140 },
    { str: 'ক. জ্ঞানমূলক?', x: 450, y: 470, width: 100 },
    { str: '১', x: 780, y: 470, width: 8 }, // far right margin mark digit -> stripped
    { str: 'খ. অনুধাবন?', x: 450, y: 440, width: 100 },
    { str: '২', x: 780, y: 440, width: 8 }, // far right margin mark digit -> stripped
    { str: 'গ. প্রয়োগ কর।', x: 450, y: 410, width: 110 },
    { str: '৩', x: 780, y: 410, width: 8 }, // far right margin mark digit -> stripped
  ];

  assert.equal(detectTwoColumnLayout(items, viewportWidth), true);

  const text = reconstructPdfPageText(items, viewportWidth);
  const lines = text.split('\n');
  assert.deepEqual(lines, [
    '১। প্রথম প্রশ্ন কী?',
    '২। দ্বিতীয় প্রশ্ন কী?',
    '৩। তৃতীয় প্রশ্ন কী?',
    '৪। চতুর্থ প্রশ্ন কী?',
    '২। সৃজনশীল দুই।',
    'ক. জ্ঞানমূলক?',
    'খ. অনুধাবন?',
    'গ. প্রয়োগ কর।',
  ]);
});

test('reconstructPdfPageText treats continuous single-column lines spanning 48% width as 1-column', () => {
  const viewportWidth = 595; // A4 portrait pt width
  const items: PdfTextItem[] = [
    { str: '১। এটি একটি দীর্ঘ সংক্ষিপ্ত প্রশ্ন যা', x: 50, y: 700, width: 230 },
    { str: 'পৃষ্ঠার মাঝামাঝি পর্যন্ত বিস্তৃত।', x: 285, y: 700, width: 180 },
    { str: '২। দ্বিতীয় প্রশ্নটিও একইভাবে', x: 50, y: 675, width: 220 },
    { str: 'বাম থেকে ডানে চলে গেছে।', x: 274, y: 675, width: 180 },
    { str: '৩। তৃতীয় প্রশ্ন এখানে শুরু', x: 50, y: 650, width: 225 },
    { str: 'এবং ডানে শেষ হয়েছে।', x: 279, y: 650, width: 160 },
    { str: '৪। চতুর্থ প্রশ্নটিও একই রকম', x: 50, y: 625, width: 225 },
    { str: 'সম্পূর্ণ এক কলামে লেখা।', x: 280, y: 625, width: 170 },
  ];

  assert.equal(detectTwoColumnLayout(items, viewportWidth), false);
  const text = reconstructPdfPageText(items, viewportWidth);
  assert.ok(text.includes('১। এটি একটি দীর্ঘ সংক্ষিপ্ত প্রশ্ন যা পৃষ্ঠার মাঝামাঝি পর্যন্ত বিস্তৃত।'));
});

test('reconstructPdfPageText groups items within 4px y-tolerance left-to-right', () => {
  const items: PdfTextItem[] = [
    { str: 'দ্বিতীয় অংশ', x: 200, y: 502, width: 80 },
    { str: 'প্রথম অংশ', x: 40, y: 500, width: 80 },
  ];
  const text = reconstructPdfPageText(items, 595);
  assert.equal(text, 'প্রথম অংশ দ্বিতীয় অংশ');
});
