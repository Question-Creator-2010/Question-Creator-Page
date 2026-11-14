import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExportFilename,
  buildStandaloneHtml,
  EXACT_SHEET_CSS,
} from './exportHtml';

test('buildExportFilename formats Bengali filename cleanly', () => {
  assert.equal(
    buildExportFilename('ইতিহাস', 'format1'),
    'ইতিহাস_প্রশ্নপত্র_ফরম্যাট-১.html',
  );
  assert.equal(
    buildExportFilename('বিষয়: ব্যবসায় উদ্যোগ', 'format2'),
    'ব্যবসায় উদ্যোগ_প্রশ্নপত্র_ফরম্যাট-২.html',
  );
});

test('buildStandaloneHtml embeds Google Fonts Noto Serif Bengali, exact CSS, and contenteditable sheets', () => {
  const html = buildStandaloneHtml({
    title: 'ইতিহাস প্রশ্নপত্র',
    sheetsHtml: '<div class="sheet" contenteditable="true"><div class="page-col"></div><div class="page-col"></div></div>',
  });
  assert.ok(html.includes('Noto+Serif+Bengali:wght@400;600;700'));
  assert.ok(html.includes('size: A4 landscape;'));
  assert.ok(html.includes(EXACT_SHEET_CSS));
  assert.ok(html.includes('contenteditable="true"'));
  assert.ok(html.includes('q-mark'));
  assert.ok(html.includes('clean-sym'));
});
