import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Table2,
  Square,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import type {
  CreativeQuestion,
  ExamMetadata,
  ParsedQuestionPaper,
  ShortQuestion,
  SubQuestion,
} from '../types/questionPaper';
import {
  buildSingleBoxHtml,
  buildTableHtml,
  ensureEndingPunctuation,
  formatRichTextToHtml,
  toBengaliNumber,
} from '../utils/bengaliParser';

interface StructuredEditorProps {
  paper: ParsedQuestionPaper;
  onMetadataChange: (field: keyof ExamMetadata, value: string) => void;
  onUpdateShortQuestions: (updated: ShortQuestion[]) => void;
  onUpdateCreativeQuestions: (updated: CreativeQuestion[]) => void;
  onProceedToPreview: () => void;
}

interface MiniTableDraft {
  h1: string;
  h2: string;
  c1: string;
  c2: string;
}

export function StructuredEditor({
  paper,
  onMetadataChange,
  onUpdateShortQuestions,
  onUpdateCreativeQuestions,
  onProceedToPreview,
}: StructuredEditorProps) {
  const [shortAccordionOpen, setShortAccordionOpen] = useState(true);
  const [tableEditorIndex, setTableEditorIndex] = useState<number | null>(null);
  const [tableDraft, setTableDraft] = useState<MiniTableDraft>({
    h1: 'ছক-১',
    h2: 'ছক-২',
    c1: 'উপাদান ক',
    c2: 'উপাদান খ',
  });

  const [boxEditorIndex, setBoxEditorIndex] = useState<number | null>(null);
  const [boxItemsDraft, setBoxItemsDraft] = useState<[string, string, string]>([
    'প্রথম তথ্য',
    'দ্বিতীয় তথ্য',
    '',
  ]);

  const handleShortTextChange = (idx: number, value: string) => {
    const next = [...paper.shortQuestions];
    const target = next[idx];
    if (!target) return;
    const cleaned = value.trim() ? ensureEndingPunctuation(value) : '';
    next[idx] = {
      ...target,
      text: value,
      html: formatRichTextToHtml(cleaned || value),
    };
    onUpdateShortQuestions(next);
  };

  const handleShortBlur = (idx: number) => {
    const next = [...paper.shortQuestions];
    const target = next[idx];
    if (!target || !target.text.trim()) return;
    const punctuated = ensureEndingPunctuation(target.text);
    next[idx] = {
      ...target,
      text: punctuated,
      html: formatRichTextToHtml(punctuated),
    };
    onUpdateShortQuestions(next);
  };

  const handleAddShortQuestionSlot = () => {
    if (paper.shortQuestions.length >= 15) return;
    const nextNum = paper.shortQuestions.length + 1;
    const next: ShortQuestion[] = [
      ...paper.shortQuestions,
      {
        id: `sq-${nextNum}`,
        numberNum: nextNum,
        numberBn: toBengaliNumber(nextNum),
        text: '',
        html: '',
      },
    ];
    onUpdateShortQuestions(next);
  };

  const handleStemChange = (cqIdx: number, stemText: string) => {
    const next = [...paper.creativeQuestions];
    const cq = next[cqIdx];
    if (!cq) return;
    next[cqIdx] = {
      ...cq,
      stemText,
      stemHtml: `${formatRichTextToHtml(stemText)}${cq.stemExtraHtml}`,
    };
    onUpdateCreativeQuestions(next);
  };

  const handleSubQuestionChange = (
    cqIdx: number,
    subLabel: SubQuestion['label'],
    value: string,
  ) => {
    const next = [...paper.creativeQuestions];
    const cq = next[cqIdx];
    if (!cq) return;
    const updatedSubs = cq.subQuestions.map((sub) => {
      if (sub.label !== subLabel) return sub;
      const cleaned = value.trim() ? ensureEndingPunctuation(value) : '';
      return {
        ...sub,
        text: value,
        html: formatRichTextToHtml(cleaned || value),
      };
    });
    next[cqIdx] = { ...cq, subQuestions: updatedSubs };
    onUpdateCreativeQuestions(next);
  };

  const handleSubQuestionBlur = (cqIdx: number, subLabel: SubQuestion['label']) => {
    const next = [...paper.creativeQuestions];
    const cq = next[cqIdx];
    if (!cq) return;
    const updatedSubs = cq.subQuestions.map((sub) => {
      if (sub.label !== subLabel || !sub.text.trim()) return sub;
      const punctuated = ensureEndingPunctuation(sub.text);
      return {
        ...sub,
        text: punctuated,
        html: formatRichTextToHtml(punctuated),
      };
    });
    next[cqIdx] = { ...cq, subQuestions: updatedSubs };
    onUpdateCreativeQuestions(next);
  };

  const openTableBuilder = (cqIdx: number) => {
    setBoxEditorIndex(null);
    setTableEditorIndex(cqIdx === tableEditorIndex ? null : cqIdx);
    setTableDraft({
      h1: 'ছক-১',
      h2: 'ছক-২',
      c1: 'উপাদান ক',
      c2: 'উপাদান খ',
    });
  };

  const applyTableToStem = (cqIdx: number) => {
    const tableHtml = buildTableHtml(
      [tableDraft.h1, tableDraft.h2],
      [tableDraft.c1, tableDraft.c2],
    );
    const next = [...paper.creativeQuestions];
    const cq = next[cqIdx];
    if (!cq) return;
    const nextExtra = `${cq.stemExtraHtml}${tableHtml}`;
    next[cqIdx] = {
      ...cq,
      stemExtraHtml: nextExtra,
      stemHtml: `${formatRichTextToHtml(cq.stemText)}${nextExtra}`,
    };
    onUpdateCreativeQuestions(next);
    setTableEditorIndex(null);
  };

  const openBoxBuilder = (cqIdx: number) => {
    setTableEditorIndex(null);
    setBoxEditorIndex(cqIdx === boxEditorIndex ? null : cqIdx);
    setBoxItemsDraft(['প্রথম তথ্য', 'দ্বিতীয় তথ্য', '']);
  };

  const applyBoxToStem = (cqIdx: number) => {
    const boxHtml = buildSingleBoxHtml(boxItemsDraft);
    const next = [...paper.creativeQuestions];
    const cq = next[cqIdx];
    if (!cq) return;
    const nextExtra = `${cq.stemExtraHtml}${boxHtml}`;
    next[cqIdx] = {
      ...cq,
      stemExtraHtml: nextExtra,
      stemHtml: `${formatRichTextToHtml(cq.stemText)}${nextExtra}`,
    };
    onUpdateCreativeQuestions(next);
    setBoxEditorIndex(null);
  };

  const clearStemExtras = (cqIdx: number) => {
    const next = [...paper.creativeQuestions];
    const cq = next[cqIdx];
    if (!cq) return;
    next[cqIdx] = {
      ...cq,
      stemExtraHtml: '',
      stemHtml: formatRichTextToHtml(cq.stemText),
    };
    onUpdateCreativeQuestions(next);
  };

  const handleAddCreativeCard = () => {
    if (paper.creativeQuestions.length >= 8) return;
    const nextNum = paper.creativeQuestions.length + 1;
    const labels: Array<SubQuestion['label']> = ['ক', 'খ', 'গ', 'ঘ'];
    const newCard: CreativeQuestion = {
      id: `cq-${nextNum}`,
      numberNum: nextNum,
      numberBn: toBengaliNumber(nextNum),
      stemText: '',
      stemExtraHtml: '',
      stemHtml: '',
      subQuestions: labels.map((label) => ({ label, text: '', html: '' })),
    };
    onUpdateCreativeQuestions([...paper.creativeQuestions, newCard]);
  };

  return (
    <div className="space-y-5">
      {/* Header Metadata Fields Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              শিরোনাম ও মানবণ্টন (Header Fields)
            </h2>
            <p className="text-xs text-slate-500">
              প্রতিষ্ঠান, পরীক্ষা, বিষয়, শ্রেণি, সময় এবং পূর্ণমান যাচাই ও সংশোধন করুন
            </p>
          </div>
          <button
            type="button"
            onClick={onProceedToPreview}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>ধাপ ২: এ৪ প্রিভিউ দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="verify-school" className="block text-xs font-medium text-slate-600 mb-1">
              স্কুলের নাম
            </label>
            <input
              id="verify-school"
              type="text"
              value={paper.metadata.schoolName}
              onChange={(e) => onMetadataChange('schoolName', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="verify-exam" className="block text-xs font-medium text-slate-600 mb-1">
              পরীক্ষার শিরোনাম
            </label>
            <input
              id="verify-exam"
              type="text"
              value={paper.metadata.examTitle}
              onChange={(e) => onMetadataChange('examTitle', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="verify-subject" className="block text-xs font-medium text-slate-600 mb-1">
              বিষয়
            </label>
            <input
              id="verify-subject"
              type="text"
              value={paper.metadata.subject}
              onChange={(e) => onMetadataChange('subject', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="verify-class" className="block text-xs font-medium text-slate-600 mb-1">
              শ্রেণি
            </label>
            <input
              id="verify-class"
              type="text"
              value={paper.metadata.className}
              onChange={(e) => onMetadataChange('className', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="verify-time" className="block text-xs font-medium text-slate-600 mb-1">
              সময়
            </label>
            <input
              id="verify-time"
              type="text"
              value={paper.metadata.timeText}
              onChange={(e) => onMetadataChange('timeText', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="verify-marks" className="block text-xs font-medium text-slate-600 mb-1">
              পূর্ণমান
            </label>
            <input
              id="verify-marks"
              type="text"
              value={paper.metadata.fullMarksText}
              onChange={(e) => onMetadataChange('fullMarksText', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="verify-short-marks" className="block text-xs font-medium text-slate-600 mb-1">
              সংক্ষিপ্ত নম্বর
            </label>
            <input
              id="verify-short-marks"
              type="text"
              value={paper.metadata.shortSectionMarks}
              onChange={(e) => onMetadataChange('shortSectionMarks', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="verify-cq-marks" className="block text-xs font-medium text-slate-600 mb-1">
              সৃজনশীল নম্বর
            </label>
            <input
              id="verify-cq-marks"
              type="text"
              value={paper.metadata.creativeSectionMarks}
              onChange={(e) => onMetadataChange('creativeSectionMarks', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Short Questions Accordion (1-15) */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShortAccordionOpen((v) => !v)}
          aria-expanded={shortAccordionOpen}
          className="w-full px-4 sm:px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-900">
              সংক্ষিপ্ত-উত্তর প্রশ্ন (১–১৫)
            </h2>
            <span className="text-xs text-slate-500 tabular-nums">
              {toBengaliNumber(paper.shortQuestions.length)}টি প্রশ্ন
            </span>
          </div>
          {shortAccordionOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
          )}
        </button>

        {shortAccordionOpen && (
          <div className="p-4 sm:p-5 space-y-2.5">
            {paper.shortQuestions.map((sq, idx) => (
              <div key={sq.id} className="flex items-center gap-2.5">
                <span className="w-7 text-sm font-semibold text-slate-700 tabular-nums shrink-0 text-right">
                  {sq.numberBn}.
                </span>
                <input
                  type="text"
                  aria-label={`সংক্ষিপ্ত প্রশ্ন ${sq.numberBn}`}
                  value={sq.text}
                  onChange={(e) => handleShortTextChange(idx, e.target.value)}
                  onBlur={() => handleShortBlur(idx)}
                  placeholder={`${sq.numberBn}নং সংক্ষিপ্ত প্রশ্ন লিখুন...`}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
            ))}

            {paper.shortQuestions.length < 15 && (
              <button
                type="button"
                onClick={handleAddShortQuestionSlot}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন সংক্ষিপ্ত প্রশ্ন যোগ করুন</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* Creative Questions Cards (1-8) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              সৃজনশীল প্রশ্ন (১–৮)
            </h2>
            <p className="text-xs text-slate-500">
              প্রতিটি উদ্দীপক ও ক, খ, গ, ঘ প্রশ্ন যাচাই করুন এবং প্রয়োজনে ছক বা বক্স যুক্ত করুন
            </p>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {toBengaliNumber(paper.creativeQuestions.length)}টি প্রশ্ন
          </span>
        </div>

        <div className="space-y-4">
          {paper.creativeQuestions.map((cq, cqIdx) => (
            <article
              key={cq.id}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  {cq.numberBn}নং সৃজনশীল প্রশ্ন
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openTableBuilder(cqIdx)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    <Table2 className="w-3.5 h-3.5 shrink-0" />
                    <span>ছক যোগ করুন (+ Table)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openBoxBuilder(cqIdx)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    <Square className="w-3.5 h-3.5 shrink-0" />
                    <span>বক্স যোগ করুন (+ Box)</span>
                  </button>

                  {cq.stemExtraHtml && (
                    <button
                      type="button"
                      onClick={() => clearStemExtras(cqIdx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>ছক/বক্স মুছুন</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Stem Textarea */}
              <div>
                <label
                  htmlFor={`cq-stem-${cq.numberNum}`}
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  উদ্দীপক ({cq.numberBn})
                </label>
                <textarea
                  id={`cq-stem-${cq.numberNum}`}
                  rows={3}
                  value={cq.stemText}
                  onChange={(e) => handleStemChange(cqIdx, e.target.value)}
                  placeholder="উদ্দীপক লিখুন..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Mini 2x2 Grid Table Builder */}
              {tableEditorIndex === cqIdx && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      মিনি ২×২ ছক এডিটর (ছক-১ / ছক-২)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      aria-label="ছক শিরোনাম ১"
                      value={tableDraft.h1}
                      onChange={(e) =>
                        setTableDraft((d) => ({ ...d, h1: e.target.value }))
                      }
                      placeholder="ছক-১"
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                    />
                    <input
                      type="text"
                      aria-label="ছক শিরোনাম ২"
                      value={tableDraft.h2}
                      onChange={(e) =>
                        setTableDraft((d) => ({ ...d, h2: e.target.value }))
                      }
                      placeholder="ছক-২"
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                    />
                    <input
                      type="text"
                      aria-label="ছক তথ্য ১"
                      value={tableDraft.c1}
                      onChange={(e) =>
                        setTableDraft((d) => ({ ...d, c1: e.target.value }))
                      }
                      placeholder="তথ্য ক"
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      aria-label="ছক তথ্য ২"
                      value={tableDraft.c2}
                      onChange={(e) =>
                        setTableDraft((d) => ({ ...d, c2: e.target.value }))
                      }
                      placeholder="তথ্য খ"
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setTableEditorIndex(null)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 bg-white rounded-md cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTableToStem(cqIdx)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
                    >
                      উদ্দীপকে ছক যুক্ত করুন
                    </button>
                  </div>
                </div>
              )}

              {/* Mini Box Builder (i., ii., iii.) */}
              {boxEditorIndex === cqIdx && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                  <span className="block text-xs font-bold text-slate-800">
                    সিঙ্গেল বক্স তালিকা (i., ii., iii.)
                  </span>
                  <div className="space-y-1.5">
                    {(['i.', 'ii.', 'iii.'] as const).map((marker, itemIdx) => (
                      <div key={marker} className="flex items-center gap-2">
                        <span className="w-6 text-xs font-mono text-slate-600 text-right shrink-0">
                          {marker}
                        </span>
                        <input
                          type="text"
                          aria-label={`বক্স আইটেম ${marker}`}
                          value={boxItemsDraft[itemIdx]}
                          onChange={(e) => {
                            const updated: [string, string, string] = [...boxItemsDraft];
                            updated[itemIdx] = e.target.value;
                            setBoxItemsDraft(updated);
                          }}
                          placeholder={`তথ্য ${itemIdx + 1} (ঐচ্ছিক)`}
                          className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setBoxEditorIndex(null)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 bg-white rounded-md cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      onClick={() => applyBoxToStem(cqIdx)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
                    >
                      উদ্দীপকে বক্স যুক্ত করুন
                    </button>
                  </div>
                </div>
              )}

              {/* Attached Stem Table/Box Preview inside Card */}
              {cq.stemExtraHtml && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="block text-[11px] font-medium text-slate-500 mb-1">
                    সংযুক্ত ছক / বক্স প্রিভিউ:
                  </span>
                  <div
                    className="text-xs text-slate-900"
                    dangerouslySetInnerHTML={{ __html: cq.stemExtraHtml }}
                  />
                </div>
              )}

              {/* 4 Sub-question Inputs */}
              <div className="grid grid-cols-1 gap-2">
                {cq.subQuestions.map((sub) => (
                  <div key={`${cq.id}-${sub.label}`} className="flex items-center gap-2.5">
                    <span className="w-6 text-sm font-semibold text-slate-700 shrink-0 text-right">
                      {sub.label}.
                    </span>
                    <input
                      type="text"
                      aria-label={`${cq.numberBn}নং সৃজনশীল ${sub.label} প্রশ্ন`}
                      value={sub.text}
                      onChange={(e) =>
                        handleSubQuestionChange(cqIdx, sub.label, e.target.value)
                      }
                      onBlur={() => handleSubQuestionBlur(cqIdx, sub.label)}
                      placeholder={`${sub.label}. প্রশ্ন লিখুন...`}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {paper.creativeQuestions.length < 8 ? (
            <button
              type="button"
              onClick={handleAddCreativeCard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন সৃজনশীল প্রশ্ন যোগ করুন</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onProceedToPreview}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>ধাপ ২: এ৪ প্রিভিউ ও প্রিন্ট দেখুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
