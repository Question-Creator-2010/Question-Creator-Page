import { useRef, useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Printer,
  BookOpen,
  LayoutList,
  Sparkles,
  FileEdit,
  Eye,
} from 'lucide-react';
import type {
  CreativeQuestion,
  ExamMetadata,
  InputTab,
  OutputFormat,
  ParsedQuestionPaper,
  ShortQuestion,
  WorkflowStep,
} from './types/questionPaper';
import {
  DEFAULT_METADATA,
  parseBengaliQuestionPaper,
} from './utils/bengaliParser';
import { SAMPLE_QUESTION_PAPER_TEXT } from './data/sampleQuestionPaper';
import {
  buildExportFilename,
  buildStandaloneHtml,
} from './utils/exportHtml';
import { TopBar } from './components/TopBar';
import { InputWorkspace } from './components/InputWorkspace';
import { StructuredEditor } from './components/StructuredEditor';
import { ResponsiveSheetWrapper } from './components/ResponsiveSheetWrapper';
import { SheetRenderer } from './components/SheetRenderer';

const INITIAL_EMPTY_PAPER: ParsedQuestionPaper = {
  metadata: { ...DEFAULT_METADATA },
  shortQuestions: [],
  creativeQuestions: [],
};

export default function App() {
  const [activeInputTab, setActiveInputTab] = useState<InputTab>('text');
  const [activeStep, setActiveStep] = useState<WorkflowStep>('verify');
  const [activeFormat, setActiveFormat] = useState<OutputFormat>('format1');
  const [rawText, setRawText] = useState('');
  const [paper, setPaper] = useState<ParsedQuestionPaper>(INITIAL_EMPTY_PAPER);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [copiedHtml, setCopiedHtml] = useState(false);

  const sheetsContainerRef = useRef<HTMLDivElement | null>(null);

  const hasContent =
    paper.shortQuestions.length > 0 || paper.creativeQuestions.length > 0;

  const handleParse = (overrideText?: string) => {
    const source = overrideText ?? rawText;
    if (!source.trim()) return;
    const parsed = parseBengaliQuestionPaper(source);
    setPaper(parsed);
    setActiveStep('verify');
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_QUESTION_PAPER_TEXT);
    const parsed = parseBengaliQuestionPaper(SAMPLE_QUESTION_PAPER_TEXT);
    setPaper(parsed);
    setActiveInputTab('text');
    setActiveStep('verify');
  };

  const handleReset = () => {
    setRawText('');
    setPaper(INITIAL_EMPTY_PAPER);
    setActiveStep('verify');
  };

  const handleMetadataChange = (field: keyof ExamMetadata, value: string) => {
    setPaper((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value,
      },
    }));
  };

  const handleUpdateShortQuestions = (updated: ShortQuestion[]) => {
    setPaper((prev) => ({ ...prev, shortQuestions: updated }));
  };

  const handleUpdateCreativeQuestions = (updated: CreativeQuestion[]) => {
    setPaper((prev) => ({ ...prev, creativeQuestions: updated }));
  };

  const handleStemBlur = (cqIndex: number, newHtml: string) => {
    setPaper((prev) => {
      const target = prev.creativeQuestions[cqIndex];
      if (!target || target.stemHtml === newHtml) return prev;
      const updated = [...prev.creativeQuestions];
      updated[cqIndex] = { ...target, stemHtml: newHtml };
      return { ...prev, creativeQuestions: updated };
    });
  };

  const getActiveStandaloneHtml = () => {
    const sheetsHtml = sheetsContainerRef.current?.innerHTML ?? '';
    return buildStandaloneHtml({
      title: `${paper.metadata.subject || 'প্রশ্নপত্র'} - ${paper.metadata.examTitle}`,
      sheetsHtml,
    });
  };

  const handleCopyHtml = async () => {
    if (!hasContent) return;
    const htmlString = getActiveStandaloneHtml();
    try {
      await navigator.clipboard.writeText(htmlString);
      setCopiedHtml(true);
      window.setTimeout(() => setCopiedHtml(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = htmlString;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedHtml(true);
      window.setTimeout(() => setCopiedHtml(false), 2500);
    }
  };

  const handleDownloadHtml = () => {
    if (!hasContent) return;
    const htmlString = getActiveStandaloneHtml();
    const filename = buildExportFilename(paper.metadata.subject, activeFormat);
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!hasContent) return;
    if (activeStep !== 'preview') {
      setActiveStep('preview');
      window.setTimeout(() => window.print(), 120);
      return;
    }
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <TopBar
        activeStep={activeStep}
        onStepChange={setActiveStep}
        onPrint={handlePrint}
        hasContent={hasContent}
        geminiApiKey={geminiApiKey}
        onGeminiApiKeyChange={setGeminiApiKey}
      />

      <main className="flex-1 w-full max-w-[1680px] mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col lg:flex-row items-start gap-5 print:p-0 print:m-0 print:max-w-none print:block">
        <InputWorkspace
          activeTab={activeInputTab}
          onTabChange={setActiveInputTab}
          rawText={rawText}
          onRawTextChange={setRawText}
          onLoadSample={handleLoadSample}
          onParseNow={handleParse}
          onReset={handleReset}
          shortCount={paper.shortQuestions.length}
          creativeCount={paper.creativeQuestions.length}
          geminiApiKey={geminiApiKey}
        />

        {/* Right Main Stage: 2-Step Workflow */}
        <section className="flex-1 min-w-0 w-full flex flex-col gap-4 print:block">
          {/* 2-Step Switcher Bar */}
          <div className="no-print bg-white border border-slate-200 rounded-xl p-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div
              role="tablist"
              aria-label="কাজের ধাপ নির্বাচন"
              className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeStep === 'verify'}
                onClick={() => setActiveStep('verify')}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeStep === 'verify'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <FileEdit className="w-3.5 h-3.5 shrink-0" />
                <span>ধাপ ১: প্রশ্ন যাচাই ও সম্পাদনা</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeStep === 'preview'}
                onClick={() => setActiveStep('preview')}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeStep === 'preview'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>ধাপ ২: এ৪ প্রিভিউ ও প্রিন্ট</span>
              </button>
            </div>

            {hasContent && activeStep === 'preview' && (
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span>Print / Save as PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleCopyHtml()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedHtml ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>কপি সম্পন্ন</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      <span>Copy HTML Code</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Download .html</span>
                </button>
              </div>
            )}
          </div>

          {!hasContent ? (
            <div className="no-print bg-white border border-slate-200 rounded-xl px-6 py-16 text-center flex flex-col items-center justify-center gap-4">
              <div className="max-w-md space-y-2">
                <h1 className="text-lg font-bold text-slate-900">
                  অফলাইন বাংলা প্রশ্নপত্র এক্সট্র্যাক্টর ও এ৪ বুকলেট ফরম্যাটার
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  বাম পাশ থেকে পুরোনো প্রশ্নপত্রের PDF আপলোড করুন, ছবি স্ক্যান করুন, অথবা টেক্সট পেস্ট করুন। কোনো API Key ছাড়াই সম্পূর্ণ ব্রাউজারে ২-কলাম প্রশ্নপত্র সাজানো হবে।
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span>নমুনা প্রশ্ন লোড করুন (Load Sample)</span>
              </button>
            </div>
          ) : activeStep === 'verify' ? (
            <StructuredEditor
              paper={paper}
              onMetadataChange={handleMetadataChange}
              onUpdateShortQuestions={handleUpdateShortQuestions}
              onUpdateCreativeQuestions={handleUpdateCreativeQuestions}
              onProceedToPreview={() => setActiveStep('preview')}
            />
          ) : (
            <div className="space-y-3 print:space-y-0">
              {/* Dual-Format Output Tabs */}
              <div className="no-print bg-white border border-slate-200 rounded-xl p-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div
                  role="tablist"
                  aria-label="আউটপুট ফরম্যাট নির্বাচন"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeFormat === 'format1'}
                    onClick={() => setActiveFormat('format1')}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeFormat === 'format1'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <LayoutList className="w-3.5 h-3.5 shrink-0" />
                    <span>ফরম্যাট-১ (সাধারণ ধারাবাহিক)</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeFormat === 'format2'}
                    onClick={() => setActiveFormat('format2')}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeFormat === 'format2'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span>ফরম্যাট-২ (বুকলেট / ডান পাশ থেকে শুরু)</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500 px-2">
                  প্রিভিউ পাতার যেকোনো লেখায় সরাসরি ক্লিক করেও সম্পাদনা করতে পারবেন (contenteditable)
                </p>
              </div>

              <ResponsiveSheetWrapper sheetCount={2}>
                <SheetRenderer
                  paper={paper}
                  format={activeFormat}
                  sheetsContainerRef={sheetsContainerRef}
                  onStemFocus={() => {}}
                  onStemBlur={handleStemBlur}
                />
              </ResponsiveSheetWrapper>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
