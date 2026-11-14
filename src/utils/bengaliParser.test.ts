import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSingleBoxHtml,
  buildTableHtml,
  formatRichTextToHtml,
  parseBengaliQuestionPaper,
  postProcessBengaliText,
  toBengaliNumber,
} from './bengaliParser';
import { SAMPLE_QUESTION_PAPER_TEXT } from '../data/sampleQuestionPaper';

test('toBengaliNumber converts Arabic numerals to Bengali digits', () => {
  assert.equal(toBengaliNumber(1), '১');
  assert.equal(toBengaliNumber(15), '১৫');
  assert.equal(toBengaliNumber(2026), '২০২৬');
});

test('postProcessBengaliText repairs broken Bengali vowel signs and normalizes NFC', () => {
  const broken = 'কোনাে েকাথাও গেলাে পাৈষ';
  const fixed = postProcessBengaliText(broken);
  assert.ok(fixed.includes('কোনো'));
  assert.ok(fixed.includes('গেলো'));
  assert.ok(fixed.includes('পৌষ'));
});

test('formatRichTextToHtml wraps English words, Roman numerals, question marks, and quotes', () => {
  const input = "ইতিহাস 'East India Company' ও (i) এবং ii. সম্পর্কে কী বলে?";
  const html = formatRichTextToHtml(input);
  assert.match(html, /<span class='clean-sym'>‘<\/span><span class="en-text">East India Company<\/span><span class='clean-sym'>’<\/span>/);
  assert.match(html, /<span class="en-text">\(i\)<\/span>/);
  assert.match(html, /<span class="en-text">ii\.<\/span>/);
  assert.match(html, /<span class="q-mark">\?<\/span>/);
});

test('parseBengaliQuestionPaper parses complete 15 short + 8 creative sample paper', () => {
  const parsed = parseBengaliQuestionPaper(SAMPLE_QUESTION_PAPER_TEXT);

  assert.equal(parsed.metadata.schoolName, 'হোম চাইল্ড কেজি এন্ড ক্যাডেট স্কুল');
  assert.equal(parsed.metadata.examTitle, 'বার্ষিক পরীক্ষা-২০২৬ ইং');
  assert.equal(parsed.metadata.subject, 'ইতিহাস');
  assert.equal(parsed.metadata.className, 'নবম');
  assert.equal(parsed.metadata.timeText, 'সময়-২ ঘণ্টা ৩০ মিনিট');
  assert.equal(parsed.metadata.fullMarksText, 'পূর্ণমান-৭০');

  assert.equal(parsed.shortQuestions.length, 15);
  assert.equal(parsed.shortQuestions[0].numberBn, '১');
  assert.equal(parsed.shortQuestions[14].numberBn, '১৫');
  assert.ok(parsed.shortQuestions[7].text.endsWith('।'));

  assert.equal(parsed.creativeQuestions.length, 8);
  assert.equal(parsed.creativeQuestions[0].numberBn, '১');
  assert.equal(parsed.creativeQuestions[7].numberBn, '৮');

  const q1SubD = parsed.creativeQuestions[0].subQuestions.find((s) => s.label === 'ঘ');
  assert.ok(q1SubD);
  assert.ok(!q1SubD.text.endsWith('8'));
  assert.ok(!q1SubD.text.endsWith('৪'));
  assert.ok(q1SubD.text.endsWith('।'));

  assert.match(parsed.creativeQuestions[0].stemHtml, /<span class="en-text">\(i\)<\/span>/);
  assert.match(parsed.creativeQuestions[0].stemHtml, /<span class="en-text">\(ii\)<\/span>/);
});

test('parseBengaliQuestionPaper sorts out-of-order short and creative questions numerically', () => {
  const outOfOrder = `
    সংক্ষিপ্ত-উত্তর প্রশ্ন
    ৩। তৃতীয় প্রশ্ন কী?
    ১। প্রথম প্রশ্ন কী?
    ২। দ্বিতীয় প্রশ্ন কী
    সৃজনশীল প্রশ্ন
    ২। দ্বিতীয় উদ্দীপক। ক. ক২? ১ খ. খ২? ২ গ. গ২। ৩ ঘ. ঘ২। 8
    ১। প্রথম উদ্দীপক। ক. ক১? ১ খ. খ১? ২ গ. গ১। ৩ ঘ. ঘ১। ৪
  `;
  const parsed = parseBengaliQuestionPaper(outOfOrder);
  assert.equal(parsed.shortQuestions.length, 3);
  assert.ok(parsed.shortQuestions[0].text.startsWith('প্রথম'));
  assert.ok(parsed.shortQuestions[1].text.startsWith('দ্বিতীয়'));
  assert.ok(parsed.shortQuestions[2].text.startsWith('তৃতীয়'));

  assert.equal(parsed.creativeQuestions.length, 2);
  assert.ok(parsed.creativeQuestions[0].stemText.startsWith('প্রথম'));
  assert.ok(parsed.creativeQuestions[1].stemText.startsWith('দ্বিতীয়'));
});

test('buildTableHtml and buildSingleBoxHtml generate valid styled stem blocks', () => {
  const tableHtml = buildTableHtml(['ছক-১', 'ছক-২'], ['উপাদান A', 'উপাদান B']);
  assert.match(tableHtml, /<table class="q-table">/);
  assert.match(tableHtml, /<span class="en-text">A<\/span>/);

  const boxHtml = buildSingleBoxHtml(['প্রথম তথ্য', 'দ্বিতীয় তথ্য']);
  assert.match(boxHtml, /<div class="single-box">/);
  assert.match(boxHtml, /<span class="en-text">i\.<\/span>/);
  assert.match(boxHtml, /<span class="en-text">ii\.<\/span>/);
});
