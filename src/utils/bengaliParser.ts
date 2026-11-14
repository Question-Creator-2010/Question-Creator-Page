import type {
  CreativeQuestion,
  ExamMetadata,
  ParsedQuestionPaper,
  ShortQuestion,
  SubQuestion,
} from '../types/questionPaper';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const EN_TO_BN_DIGIT_MAP: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};
const BN_TO_EN_DIGIT_MAP: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function toBengaliNumber(num: number): string {
  return String(num)
    .split('')
    .map((ch) => EN_TO_BN_DIGIT_MAP[ch] ?? ch)
    .join('');
}

export function parseAnyNumber(token: string): number | null {
  const normalized = token
    .trim()
    .split('')
    .map((ch) => BN_TO_EN_DIGIT_MAP[ch] ?? ch)
    .join('');
  if (!/^\d+$/.test(normalized)) return null;
  const val = Number.parseInt(normalized, 10);
  return Number.isNaN(val) ? null : val;
}

export const DEFAULT_METADATA: ExamMetadata = {
  schoolName: 'হোম চাইল্ড কেজি এন্ড ক্যাডেট স্কুল',
  examTitle: 'বার্ষিক পরীক্ষা-২০২৬ ইং',
  subject: 'ইতিহাস',
  className: 'নবম',
  timeText: 'সময়-২ ঘণ্টা ৩০ মিনিট',
  fullMarksText: 'পূর্ণমান-৭০',
  shortSectionLeft: '১।',
  shortSectionTitle: 'সংক্ষিপ্ত-উত্তর প্রশ্ন (যেকোনো ১০টি)',
  shortSectionMarks: '২ × ১০ = ২০',
  creativeSectionLeft: '২।',
  creativeSectionTitle: 'সৃজনশীল প্রশ্ন (যেকোনো ৫টি)',
  creativeSectionMarks: '৫ × ১০ = ৫০',
};

/**
 * Post-processes raw PDF/OCR Bengali text:
 * - Normalizes Unicode to NFC
 * - Repairs split/broken Bengali vowel signs (াে -> ো, ো -> ো, াৈ -> ৌ, ৌ -> ৌ)
 * - Normalizes whitespace and pipe characters used as danda
 */
export function postProcessBengaliText(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u200B/g, '')
    // Fix broken Bengali composite vowel signs (from PDF font maps / OCR)
    .replace(/\u09BE\u09C7/g, '\u09CB') // া + ে -> ো
    .replace(/\u09C7\u09BE/g, '\u09CB') // ে + া -> ো
    .replace(/\u09BE\u09C8/g, '\u09CC') // া + ৈ -> ৌ
    .replace(/\u09C7\u09D7/g, '\u09CC') // ে + ৗ -> ৌ
    .replace(/\u09C8\u09BE/g, '\u09CC') // ৈ + া -> ৌ
    // Replace pipe | next to Bengali text with Bengali danda ।
    .replace(/([\u0980-\u09FF])\s*\|\s*(?=$|\n|\s)/gm, '$1। ')
    .replace(/\u09DC/g, 'ড়')
    .replace(/\u09DD/g, 'ঢ়')
    .replace(/\u09DF/g, 'য়');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Formats plain Bengali/English text with deterministic typographic rules:
 * - Wraps English words and Roman numerals (i., ii., iii., (i), (ii), (iii), etc.) in <span class="en-text">...</span>
 * - Wraps every ? in <span class="q-mark">?</span>
 * - Converts straight single quotes '...' into <span class='clean-sym'>‘</span>...<span class='clean-sym'>’</span>
 */
export function formatRichTextToHtml(raw: string): string {
  if (!raw) return '';
  const escaped = escapeHtml(raw);

  const OPEN_Q = '\uE000';
  const CLOSE_Q = '\uE001';
  const withQuoteMarkers = escaped.replace(
    /'([^'\n]+)'/g,
    `${OPEN_Q}$1${CLOSE_Q}`,
  );

  const tokenRegex =
    /(\((?:i|ii|iii|iv|v|vi|vii|viii|ix|x)\)|[A-Za-z0-9]+(?:[\s.\-/&']*[A-Za-z0-9]+)*\.?|\?|\uE000|\uE001)/gi;

  return withQuoteMarkers.replace(tokenRegex, (match) => {
    if (match === '?') {
      return '<span class="q-mark">?</span>';
    }
    if (match === OPEN_Q) {
      return "<span class='clean-sym'>‘</span>";
    }
    if (match === CLOSE_Q) {
      return "<span class='clean-sym'>’</span>";
    }
    const trailingSpaces = match.match(/\s+$/)?.[0] ?? '';
    const core = trailingSpaces ? match.slice(0, -trailingSpaces.length) : match;
    if (!core) return match;
    return `<span class="en-text">${core}</span>${trailingSpaces}`;
  });
}

export function ensureEndingPunctuation(text: string): string {
  const trimmed = text.trim().replace(/\|+$/, '।');
  if (!trimmed) return '';
  if (/[।?!:]$/.test(trimmed)) {
    return trimmed;
  }
  if (/[।?!]['’”"]$/.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}।`;
}

function stripInlineMarks(text: string): string {
  return text
    .replace(/\(\s*[০-৯0-9]+\s*[×xX*]\s*[০-৯0-9]+\s*=\s*[০-৯0-9]+\s*\)/g, '')
    .replace(/\[\s*[০-৯0-9]+\s*\]/g, '')
    .replace(/\(\s*(?:মান|নম্বর|marks?)?\s*[:\-]?\s*[০-৯0-9]+\s*\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function stripTrailingSubQuestionMark(text: string): string {
  let cleaned = text.trim();
  // Pattern 1: "...? ৪" or "...। ২" or "...? 8"
  cleaned = cleaned.replace(/([।?!])\s*[১২৩৪12348]\s*$/, '$1');
  // Pattern 2: "...তৈরি কর   ৪" (2+ spaces or tab at end)
  cleaned = cleaned.replace(/[\t ]{2,}[১২৩৪12348]\s*$/, '');
  // Pattern 3: Single space + trailing mark digit after Bengali char
  cleaned = cleaned.replace(/([\u0980-\u09FF])\s+[১২৩৪8]\s*$/, '$1');
  return cleaned.trim();
}

function extractMetadata(lines: string[]): ExamMetadata {
  const meta: ExamMetadata = { ...DEFAULT_METADATA };

  const headerScanLimit = Math.min(lines.length, 16);
  for (let i = 0; i < headerScanLimit; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (/হোম\s*চাইল্ড|ক্যাডেট\s*স্কুল|স্কুল|বিদ্যালয়|বিদ্যালয়/i.test(line) && i < 4) {
      meta.schoolName = line;
    }

    if (/বার্ষিক\s*পরীক্ষা|অর্ধবার্ষিক|নির্বাচনি|মডেল\s*টেস্ট|সাময়িক\s*পরীক্ষা/i.test(line)) {
      meta.examTitle = line.replace(/\s{2,}/g, ' ').trim();
    }

    const subjectMatch = line.match(
      /বিষ(?:য়|য়)\s*[:\-–—]?\s*([^\n|]+?)(?=\s+(?:শ্রেণি|শ্রেণী|সময়|সময়|পূর্ণমান)|$)/,
    );
    if (subjectMatch && subjectMatch[1]) {
      const val = subjectMatch[1].trim();
      if (val) meta.subject = val;
    } else if (/^বিষ(?:য়|য়)\s*[:\-–—]/.test(line)) {
      const val = line.replace(/^বিষ(?:য়|য়)\s*[:\-–—]?\s*/, '').trim();
      if (val) meta.subject = val;
    }

    const classMatch = line.match(
      /শ্রে[ণন][িী]\s*[:\-–—]?\s*([^\n|]+?)(?=\s+(?:বিষ(?:য়|য়)|সময়|সময়|পূর্ণমান)|$)/,
    );
    if (classMatch && classMatch[1]) {
      const val = classMatch[1].trim();
      if (val) meta.className = val;
    } else if (/^শ্রে[ণন][িী]\s*[:\-–—]/.test(line)) {
      const val = line.replace(/^শ্রে[ণন][িী]\s*[:\-–—]?\s*/, '').trim();
      if (val) meta.className = val;
    }

    const timeMatch = line.match(
      /(সম(?:য়|য়)\s*[:\-–—]?\s*[^\n|]+?)(?=\s+পূর্ণমান|$)/,
    );
    if (timeMatch && timeMatch[1]) {
      meta.timeText = timeMatch[1].trim();
    } else if (/সম(?:য়|য়)\s*[:\-–—]/.test(line)) {
      const extracted = line.match(
        /সম(?:য়|য়)\s*[:\-–—]?\s*[\d০-৯]+\s*(?:ঘণ্টা|ঘন্টা|মিনিট)[^পূর্ণমান]*/,
      );
      if (extracted) meta.timeText = extracted[0].trim();
    }

    const marksMatch = line.match(/পূর্ণমান\s*[:\-–—]?\s*[০-৯0-9]+/);
    if (marksMatch) {
      meta.fullMarksText = marksMatch[0].trim();
    }
  }

  return meta;
}

const SHORT_HEADER_REGEX =
  /সংক্ষিপ্ত[\-\s]*উত্তর\s*প্রশ্ন|সংক্ষিপ্ত\s*প্রশ্ন|ক[\-\s]*বিভাগ\s*[:\-]?\s*সংক্ষিপ্ত/i;
const CREATIVE_HEADER_REGEX =
  /সৃজনশীল\s*প্রশ্ন|রচনামূলক\s*প্রশ্ন|খ[\-\s]*বিভাগ\s*[:\-]?\s*সৃজনশীল/i;
const QUESTION_PREFIX_REGEX = /^([০-৯0-9]{1,2})\s*[।.|)\]]\s*(.*)$/;
const SUB_Q_PREFIX_REGEX = /^\(?\s*([কখগঘ])\s*[।.|)\]]\s*(.*)$/;

function splitInlineSubQuestions(text: string): string[] {
  return text
    .replace(/\s+(?=\(?[কখগঘ][।.)])/g, '\n')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildCreativeQuestion(
  numberNum: number,
  rawLines: string[],
): CreativeQuestion {
  const expandedLines: string[] = [];
  for (const line of rawLines) {
    expandedLines.push(...splitInlineSubQuestions(line));
  }

  const stemLines: string[] = [];
  const subMap: Partial<Record<'ক' | 'খ' | 'গ' | 'ঘ', string[]>> = {};
  let currentSub: 'ক' | 'খ' | 'গ' | 'ঘ' | null = null;

  for (const line of expandedLines) {
    const subMatch = line.match(SUB_Q_PREFIX_REGEX);
    if (subMatch) {
      const label = subMatch[1] as 'ক' | 'খ' | 'গ' | 'ঘ';
      currentSub = label;
      if (!subMap[label]) subMap[label] = [];
      if (subMatch[2]?.trim()) {
        subMap[label]!.push(subMatch[2].trim());
      }
    } else if (currentSub) {
      subMap[currentSub]!.push(line.trim());
    } else {
      stemLines.push(line.trim());
    }
  }

  const stemText = stemLines.join(' ').replace(/\s{2,}/g, ' ').trim();
  const labels: Array<'ক' | 'খ' | 'গ' | 'ঘ'> = ['ক', 'খ', 'গ', 'ঘ'];
  const subQuestions: SubQuestion[] = labels.map((label) => {
    const rawSub = (subMap[label] ?? []).join(' ').replace(/\s{2,}/g, ' ').trim();
    const cleaned = rawSub
      ? ensureEndingPunctuation(stripTrailingSubQuestionMark(rawSub))
      : '';
    return {
      label,
      text: cleaned,
      html: formatRichTextToHtml(cleaned),
    };
  });

  const numberBn = toBengaliNumber(numberNum);
  const stemHtml = formatRichTextToHtml(stemText);

  return {
    id: `cq-${numberNum}`,
    numberNum,
    numberBn,
    stemText,
    stemExtraHtml: '',
    stemHtml,
    subQuestions,
  };
}

export function buildTableHtml(headers: [string, string], cells: [string, string]): string {
  const h1 = formatRichTextToHtml(headers[0].trim() || 'ছক-১');
  const h2 = formatRichTextToHtml(headers[1].trim() || 'ছক-২');
  const c1 = formatRichTextToHtml(cells[0].trim() || 'তথ্য ক');
  const c2 = formatRichTextToHtml(cells[1].trim() || 'তথ্য খ');
  return `<table class="q-table"><tbody><tr><th>${h1}</th><th>${h2}</th></tr><tr><td>${c1}</td><td>${c2}</td></tr></tbody></table>`;
}

export function buildSingleBoxHtml(items: string[]): string {
  const roman = ['i.', 'ii.', 'iii.', 'iv.', 'v.'];
  const cleanItems = items.map((s) => s.trim()).filter(Boolean);
  const list = cleanItems.length > 0 ? cleanItems : ['তথ্য ১', 'তথ্য ২'];
  const body = list
    .map((item, idx) => {
      const marker = roman[idx] ?? `${idx + 1}.`;
      return `<span class="en-text">${marker}</span> ${formatRichTextToHtml(item)}`;
    })
    .join('<br>');
  return `<div class="single-box">${body}</div>`;
}

export function parseBengaliQuestionPaper(rawText: string): ParsedQuestionPaper {
  const processed = postProcessBengaliText(rawText);

  const lines = processed
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 0);

  const metadata = extractMetadata(lines);

  const shortQuestions: ShortQuestion[] = [];
  const creativeBlocks: Array<{ numberNum: number; lines: string[] }> = [];

  type SectionMode = 'HEADER' | 'SHORT' | 'CREATIVE';
  let mode: SectionMode = 'HEADER';
  let currentShort: { numberNum: number; lines: string[] } | null = null;
  let currentCreative: { numberNum: number; lines: string[] } | null = null;

  const flushShort = () => {
    if (!currentShort) return;
    const joined = currentShort.lines.join(' ').replace(/\s{2,}/g, ' ').trim();
    const cleaned = ensureEndingPunctuation(stripInlineMarks(joined));
    if (cleaned) {
      const numberNum = currentShort.numberNum;
      shortQuestions.push({
        id: `sq-${numberNum}`,
        numberNum,
        numberBn: toBengaliNumber(numberNum),
        text: cleaned,
        html: formatRichTextToHtml(cleaned),
      });
    }
    currentShort = null;
  };

  const flushCreative = () => {
    if (!currentCreative) return;
    creativeBlocks.push(currentCreative);
    currentCreative = null;
  };

  for (const line of lines) {
    if (CREATIVE_HEADER_REGEX.test(line)) {
      flushShort();
      flushCreative();
      mode = 'CREATIVE';
      continue;
    }

    if (SHORT_HEADER_REGEX.test(line)) {
      flushShort();
      flushCreative();
      mode = 'SHORT';
      continue;
    }

    const qMatch = line.match(QUESTION_PREFIX_REGEX);
    if (qMatch) {
      const qNum = parseAnyNumber(qMatch[1]);
      const rest = (qMatch[2] ?? '').trim();

      if (SHORT_HEADER_REGEX.test(rest)) {
        flushShort();
        flushCreative();
        mode = 'SHORT';
        continue;
      }
      if (CREATIVE_HEADER_REGEX.test(rest)) {
        flushShort();
        flushCreative();
        mode = 'CREATIVE';
        continue;
      }

      if (qNum !== null && qNum >= 1 && qNum <= 25) {
        if (mode === 'HEADER') {
          mode = 'SHORT';
        }

        if (mode === 'SHORT' && qNum === 1 && shortQuestions.length >= 10) {
          flushShort();
          mode = 'CREATIVE';
        }

        if (mode === 'SHORT') {
          flushShort();
          currentShort = { numberNum: qNum, lines: rest ? [rest] : [] };
          continue;
        } else {
          flushCreative();
          currentCreative = { numberNum: qNum, lines: rest ? [rest] : [] };
          continue;
        }
      }
    }

    if (mode === 'SHORT' && currentShort) {
      if (
        SUB_Q_PREFIX_REGEX.test(line) &&
        currentShort.numberNum <= 8 &&
        shortQuestions.length >= 10
      ) {
        const promoted = currentShort;
        currentShort = null;
        mode = 'CREATIVE';
        currentCreative = {
          numberNum: promoted.numberNum,
          lines: [...promoted.lines, line],
        };
        continue;
      }
      currentShort.lines.push(line);
    } else if (mode === 'CREATIVE' && currentCreative) {
      currentCreative.lines.push(line);
    }
  }

  flushShort();
  flushCreative();

  // Sort short questions numerically (1..15) even if extracted out of order
  const sortedShort = [...shortQuestions]
    .sort((a, b) => a.numberNum - b.numberNum)
    .slice(0, 15)
    .map((q, idx) => {
      const seq = idx + 1;
      return {
        ...q,
        id: `sq-${seq}`,
        numberNum: seq,
        numberBn: toBengaliNumber(seq),
      };
    });

  // Sort creative questions numerically (1..8) even if extracted out of order
  const sortedCreative = [...creativeBlocks]
    .sort((a, b) => a.numberNum - b.numberNum)
    .slice(0, 8)
    .map((block, idx) => buildCreativeQuestion(idx + 1, block.lines));

  return {
    metadata,
    shortQuestions: sortedShort,
    creativeQuestions: sortedCreative,
  };
}

export function formatSubjectDisplay(subject: string): string {
  const s = subject.trim();
  if (!s) return 'বিষয়- নির্ধারিত নয়';
  if (/^বিষ(?:য়|য়)/.test(s)) return s;
  return `বিষয়- ${s}`;
}

export function formatClassDisplay(className: string): string {
  const c = className.trim();
  if (!c) return 'শ্রেণি- নবম';
  if (/^শ্রে[ণন][িী]/.test(c)) return c;
  return `শ্রেণি- ${c}`;
}

export { BN_DIGITS };
