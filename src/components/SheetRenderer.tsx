import type { RefObject } from 'react';
import type {
  CreativeQuestion,
  ExamMetadata,
  OutputFormat,
  ParsedQuestionPaper,
} from '../types/questionPaper';
import { formatClassDisplay, formatSubjectDisplay } from '../utils/bengaliParser';

interface SheetRendererProps {
  paper: ParsedQuestionPaper;
  format: OutputFormat;
  sheetsContainerRef: RefObject<HTMLDivElement | null>;
  onStemFocus: (cqIndex: number) => void;
  onStemBlur: (cqIndex: number, newHtml: string) => void;
}

function PageHeader({ metadata }: { metadata: ExamMetadata }) {
  return (
    <>
      <div className="header">
        <div className="school-name">{metadata.schoolName}</div>
        <div className="exam-title">{metadata.examTitle}</div>
        <div className="subject">{formatSubjectDisplay(metadata.subject)}</div>
        <div className="class-name">{formatClassDisplay(metadata.className)}</div>
      </div>
      <div className="meta-row">
        <span>{metadata.timeText}</span>
        <span>{metadata.fullMarksText}</span>
      </div>
    </>
  );
}

function CreativeQuestionItem({
  cq,
  cqIndex,
  marginBottomPx,
  onStemFocus,
  onStemBlur,
}: {
  cq: CreativeQuestion;
  cqIndex: number;
  marginBottomPx?: number;
  onStemFocus: (idx: number) => void;
  onStemBlur: (idx: number, html: string) => void;
}) {
  return (
    <div
      className="cq-item"
      style={marginBottomPx ? { marginBottom: `${marginBottomPx}px` } : undefined}
      data-cq-index={cqIndex}
    >
      <div className="cq-no">{cq.numberBn}।</div>
      <div className="cq-content">
        <div
          className="stem"
          data-stem-index={cqIndex}
          onFocus={() => onStemFocus(cqIndex)}
          onBlur={(e) => onStemBlur(cqIndex, e.currentTarget.innerHTML)}
          dangerouslySetInnerHTML={{ __html: cq.stemHtml }}
        />
        <ul className="sub-q">
          {cq.subQuestions.map((sub) => (
            <li key={`${cq.id}-${sub.label}`}>
              <span className="sub-label">{sub.label}.</span>
              <span dangerouslySetInnerHTML={{ __html: sub.html }} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PageOneColumn({
  paper,
  onStemFocus,
  onStemBlur,
}: {
  paper: ParsedQuestionPaper;
  onStemFocus: (idx: number) => void;
  onStemBlur: (idx: number, html: string) => void;
}) {
  const { metadata, shortQuestions, creativeQuestions } = paper;
  const firstCreative = creativeQuestions[0];

  return (
    <div className="page-col">
      <PageHeader metadata={metadata} />

      <div className="section-bar">
        <span className="section-left">{metadata.shortSectionLeft}</span>
        <span className="section-title">{metadata.shortSectionTitle}</span>
        <span className="section-marks">{metadata.shortSectionMarks}</span>
      </div>

      <ul className="short-q-list">
        {shortQuestions.map((sq) => (
          <li key={sq.id}>
            <span className="q-no">{sq.numberBn}.</span>
            <span dangerouslySetInnerHTML={{ __html: sq.html }} />
          </li>
        ))}
      </ul>

      <div className="section-bar">
        <span className="section-left">{metadata.creativeSectionLeft}</span>
        <span className="section-title">{metadata.creativeSectionTitle}</span>
        <span className="section-marks">{metadata.creativeSectionMarks}</span>
      </div>

      {firstCreative && (
        <CreativeQuestionItem
          cq={firstCreative}
          cqIndex={0}
          onStemFocus={onStemFocus}
          onStemBlur={onStemBlur}
        />
      )}
    </div>
  );
}

function PageTwoColumn({
  creativeQuestions,
  onStemFocus,
  onStemBlur,
}: {
  creativeQuestions: CreativeQuestion[];
  onStemFocus: (idx: number) => void;
  onStemBlur: (idx: number, html: string) => void;
}) {
  // Creative Questions 2, 3, 4, and 5 (indices 1..4)
  const items = creativeQuestions.slice(1, 5);
  return (
    <div className="page-col">
      {items.map((cq, localIdx) => (
        <CreativeQuestionItem
          key={cq.id}
          cq={cq}
          cqIndex={localIdx + 1}
          onStemFocus={onStemFocus}
          onStemBlur={onStemBlur}
        />
      ))}
    </div>
  );
}

function PageThreeColumn({
  creativeQuestions,
  onStemFocus,
  onStemBlur,
}: {
  creativeQuestions: CreativeQuestion[];
  onStemFocus: (idx: number) => void;
  onStemBlur: (idx: number, html: string) => void;
}) {
  // Creative Questions 6, 7, and 8 (indices 5..7), applying margin-bottom: 14px on Q6 and Q7
  const items = creativeQuestions.slice(5, 8);
  return (
    <div className="page-col">
      <div className="page-num">-৩-</div>
      {items.map((cq, localIdx) => {
        const globalIdx = localIdx + 5;
        const marginBottomPx = globalIdx === 5 || globalIdx === 6 ? 14 : undefined;
        return (
          <CreativeQuestionItem
            key={cq.id}
            cq={cq}
            cqIndex={globalIdx}
            marginBottomPx={marginBottomPx}
            onStemFocus={onStemFocus}
            onStemBlur={onStemBlur}
          />
        );
      })}
    </div>
  );
}

export function SheetRenderer({
  paper,
  format,
  sheetsContainerRef,
  onStemFocus,
  onStemBlur,
}: SheetRendererProps) {
  return (
    <div ref={sheetsContainerRef} data-active-format={format}>
      {format === 'format1' ? (
        <>
          {/* ফরম্যাট-১: Sheet 1 (Left: Page 1, Right: Page 2) */}
          <div
            className="sheet"
            contentEditable={true}
            suppressContentEditableWarning={true}
            aria-label="প্রথম পাতা - ফরম্যাট ১"
          >
            <PageOneColumn
              paper={paper}
              onStemFocus={onStemFocus}
              onStemBlur={onStemBlur}
            />
            <PageTwoColumn
              creativeQuestions={paper.creativeQuestions}
              onStemFocus={onStemFocus}
              onStemBlur={onStemBlur}
            />
          </div>

          {/* ফরম্যাট-১: Sheet 2 (Left: Page 3, Right: Empty) */}
          <div
            className="sheet"
            contentEditable={true}
            suppressContentEditableWarning={true}
            aria-label="দ্বিতীয় পাতা - ফরম্যাট ১"
          >
            <PageThreeColumn
              creativeQuestions={paper.creativeQuestions}
              onStemFocus={onStemFocus}
              onStemBlur={onStemBlur}
            />
            <div className="page-col"></div>
          </div>
        </>
      ) : (
        <>
          {/* ফরম্যাট-২: Sheet 1 (Left: Empty, Right: Page 1) */}
          <div
            className="sheet"
            contentEditable={true}
            suppressContentEditableWarning={true}
            aria-label="প্রথম পাতা - ফরম্যাট ২"
          >
            <div className="page-col"></div>
            <PageOneColumn
              paper={paper}
              onStemFocus={onStemFocus}
              onStemBlur={onStemBlur}
            />
          </div>

          {/* ফরম্যাট-২: Sheet 2 (Left: Page 2, Right: Page 3) */}
          <div
            className="sheet"
            contentEditable={true}
            suppressContentEditableWarning={true}
            aria-label="দ্বিতীয় পাতা - ফরম্যাট ২"
          >
            <PageTwoColumn
              creativeQuestions={paper.creativeQuestions}
              onStemFocus={onStemFocus}
              onStemBlur={onStemBlur}
            />
            <PageThreeColumn
              creativeQuestions={paper.creativeQuestions}
              onStemFocus={onStemFocus}
              onStemBlur={onStemBlur}
            />
          </div>
        </>
      )}
    </div>
  );
}
