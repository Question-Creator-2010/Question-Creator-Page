export interface ExamMetadata {
  schoolName: string;
  examTitle: string;
  subject: string;
  className: string;
  timeText: string;
  fullMarksText: string;
  shortSectionLeft: string;
  shortSectionTitle: string;
  shortSectionMarks: string;
  creativeSectionLeft: string;
  creativeSectionTitle: string;
  creativeSectionMarks: string;
}

export interface ShortQuestion {
  id: string;
  numberNum: number;
  numberBn: string;
  text: string;
  html: string;
}

export interface SubQuestion {
  label: 'ক' | 'খ' | 'গ' | 'ঘ';
  text: string;
  html: string;
}

export interface CreativeQuestion {
  id: string;
  numberNum: number;
  numberBn: string;
  stemText: string;
  stemExtraHtml: string;
  stemHtml: string;
  subQuestions: SubQuestion[];
}

export interface ParsedQuestionPaper {
  metadata: ExamMetadata;
  shortQuestions: ShortQuestion[];
  creativeQuestions: CreativeQuestion[];
}

export type OutputFormat = 'format1' | 'format2';
export type InputTab = 'pdf' | 'ocr' | 'text';
export type WorkflowStep = 'verify' | 'preview';
