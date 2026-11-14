import { useRef, useState, type ChangeEvent } from 'react';
import {
  FileText,
  FileUp,
  Camera,
  Sparkles,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Wand2,
} from 'lucide-react';
import type { InputTab } from '../types/questionPaper';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { extractTextFromImage } from '../utils/ocrExtractor';
import { extractTextWithOptionalGemini } from '../utils/geminiExtractor';
import { toBengaliNumber } from '../utils/bengaliParser';

interface InputWorkspaceProps {
  activeTab: InputTab;
  onTabChange: (tab: InputTab) => void;
  rawText: string;
  onRawTextChange: (value: string) => void;
  onLoadSample: () => void;
  onParseNow: (textToParse?: string) => void;
  onReset: () => void;
  shortCount: number;
  creativeCount: number;
  geminiApiKey: string;
}

export function InputWorkspace({
  activeTab,
  onTabChange,
  rawText,
  onRawTextChange,
  onLoadSample,
  onParseNow,
  onReset,
  shortCount,
  creativeCount,
  geminiApiKey,
}: InputWorkspaceProps) {
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfError, setPdfError] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [lastPdfFile, setLastPdfFile] = useState<File | null>(null);

  const [ocrStatus, setOcrStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLabel, setOcrLabel] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [lastImageFile, setLastImageFile] = useState<File | null>(null);
  // 'auto' auto-detects when width > height; true forces 2-column split
  const [forceSplitTwoCol, setForceSplitTwoCol] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);
  const ocrCameraInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLastPdfFile(file);
    setPdfFileName(file.name);
    setPdfStatus('loading');
    setPdfProgress(10);
    setPdfError('');

    try {
      const text = await extractTextFromPdf(file, (pct) => setPdfProgress(pct));
      if (!text.trim()) {
        setPdfStatus('error');
        setPdfError(
          'এই PDF ফাইলটিতে কোনো টেক্সট পাওয়া যায়নি। এটি স্ক্যান করা ছবি হলে "ছবি থেকে স্ক্যান" ট্যাব ব্যবহার করুন।',
        );
        return;
      }
      onRawTextChange(text);
      onParseNow(text);
      setPdfStatus('done');
    } catch (err) {
      setPdfStatus('error');
      setPdfError(
        err instanceof Error
          ? `PDF পড়তে সমস্যা হয়েছে: ${err.message}`
          : 'PDF ফাইলটি প্রসেস করা যায়নি।',
      );
    } finally {
      e.target.value = '';
    }
  };

  const runImageOcr = async (file: File, splitSetting: boolean | 'auto') => {
    setOcrStatus('loading');
    setOcrProgress(0);
    setOcrLabel('ছবিটি প্রসেস হচ্ছে...');
    setOcrError('');

    try {
      const text = await extractTextFromImage(file, {
        splitTwoColumns: splitSetting,
        onProgress: (pct, label) => {
          setOcrProgress(pct);
          setOcrLabel(label);
        },
      });
      if (!text.trim()) {
        setOcrStatus('error');
        setOcrError(
          'ছবি থেকে কোনো লেখা শনাক্ত করা যায়নি। অনুগ্রহ করে আরও স্পষ্ট ছবি ব্যবহার করুন।',
        );
        return;
      }
      onRawTextChange(text);
      onParseNow(text);
      setOcrStatus('done');
      setOcrProgress(100);
      setOcrLabel('স্ক্যান সম্পন্ন হয়েছে');
    } catch (err) {
      setOcrStatus('error');
      setOcrError(
        err instanceof Error
          ? `ছবি স্ক্যান করতে সমস্যা হয়েছে: ${err.message}`
          : 'ছবি থেকে লেখা পড়া যায়নি।',
      );
    }
  };

  const handleImageFile = async (file: File) => {
    if (ocrPreviewUrl) {
      URL.revokeObjectURL(ocrPreviewUrl);
    }
    const preview = URL.createObjectURL(file);
    setOcrPreviewUrl(preview);
    setLastImageFile(file);
    await runImageOcr(file, forceSplitTwoCol ? true : 'auto');
  };

  const handleImageInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleImageFile(file);
    }
    e.target.value = '';
  };

  const handleGeminiExtraction = async (file: File, target: 'pdf' | 'ocr') => {
    if (!geminiApiKey.trim()) return;
    if (target === 'pdf') {
      setPdfStatus('loading');
      setPdfProgress(50);
      setPdfError('');
    } else {
      setOcrStatus('loading');
      setOcrProgress(50);
      setOcrLabel('Gemini 2.5 Flash ভিশন দিয়ে পড়া হচ্ছে...');
      setOcrError('');
    }

    try {
      const text = await extractTextWithOptionalGemini(file, geminiApiKey);
      onRawTextChange(text);
      onParseNow(text);
      if (target === 'pdf') {
        setPdfProgress(100);
        setPdfStatus('done');
      } else {
        setOcrProgress(100);
        setOcrStatus('done');
        setOcrLabel('Gemini ভিশন স্ক্যান সম্পন্ন');
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Gemini এক্সট্র্যাকশন ব্যর্থ হয়েছে।';
      if (target === 'pdf') {
        setPdfStatus('error');
        setPdfError(msg);
      } else {
        setOcrStatus('error');
        setOcrError(msg);
      }
    }
  };

  return (
    <aside
      id="input-studio"
      className="no-print w-full lg:w-[370px] xl:w-[400px] shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
    >
      {/* Input Method Tabs */}
      <div className="p-3 bg-slate-50 border-b border-slate-200">
        <div
          role="tablist"
          aria-label="প্রশ্নপত্র ইনপুট মাধ্যম"
          className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-lg"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pdf'}
            onClick={() => onTabChange('pdf')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'pdf'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileUp className="w-3.5 h-3.5 shrink-0" />
            <span>PDF আপলোড</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ocr'}
            onClick={() => onTabChange('ocr')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'ocr'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>ছবি থেকে স্ক্যান</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'text'}
            onClick={() => onTabChange('text')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'text'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>টেক্সট পেস্ট</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-4">
        {activeTab === 'pdf' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">
                PDF প্রশ্নপত্র আপলোড
              </span>
              <button
                type="button"
                onClick={onLoadSample}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3 h-3" />
                <span>নমুনা লোড</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              কোর্ডিনেট-সচেতন ২-কলাম ইঞ্জিন স্বয়ংক্রিয়ভাবে বাম ও ডান কলাম আলাদা করে বাংলা টেক্সট সাজিয়ে নেয় (ডান পাশের নম্বর বাদ দিয়ে)।
            </p>

            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handlePdfUpload}
              className="hidden"
              id="pdf-upload-input"
            />

            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              disabled={pdfStatus === 'loading'}
              className="w-full py-7 px-4 border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-lg bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-2 text-center cursor-pointer disabled:opacity-50"
            >
              <FileUp className="w-6 h-6 text-slate-700" />
              <span className="text-sm font-semibold text-slate-800">
                {pdfStatus === 'loading' ? 'PDF প্রসেস হচ্ছে...' : 'PDF ফাইল নির্বাচন করুন'}
              </span>
              <span className="text-xs text-slate-500 truncate max-w-full">
                {pdfFileName ? pdfFileName : '১-কলাম বা ২-কলাম ইউনিকোড .pdf ফাইল'}
              </span>
            </button>

            {geminiApiKey.trim() && lastPdfFile && (
              <button
                type="button"
                onClick={() => void handleGeminiExtraction(lastPdfFile, 'pdf')}
                disabled={pdfStatus === 'loading'}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer disabled:opacity-50"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Gemini 2.5 Flash ভিশন দিয়ে পুনরায় পড়ুন</span>
              </button>
            )}

            {pdfStatus === 'loading' && (
              <div className="space-y-1.5" role="status" aria-live="polite">
                <div className="flex justify-between text-xs text-slate-700 tabular-nums">
                  <span>কোর্ডিনেট-সহ টেক্সট বের হচ্ছে...</span>
                  <span>{pdfProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 transition-all duration-200"
                    style={{ width: `${pdfProgress}%` }}
                  />
                </div>
              </div>
            )}

            {pdfStatus === 'done' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>PDF থেকে প্রশ্নগুলো পার্স হয়েছে। ডানপাশের ধাপ ১-এ প্রতিটি প্রশ্ন যাচাই করুন।</span>
              </div>
            )}

            {pdfStatus === 'error' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{pdfError}</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ocr' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">
                ছবি থেকে বাংলা OCR স্ক্যান
              </span>
              <button
                type="button"
                onClick={onLoadSample}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3 h-3" />
                <span>নমুনা লোড</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ছবিকে ২.৫× বড় করে হাই-কনট্রাস্ট সাদা-কালো প্রি-প্রসেসিং করা হয় যাতে বাংলা মাত্রা ও যুক্তাক্ষর স্পষ্টভাবে শনাক্ত হয়।
            </p>

            {/* 2-Column Image Split Toggle */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={forceSplitTwoCol}
                onChange={(e) => setForceSplitTwoCol(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-xs leading-snug">
                <span className="block font-semibold text-slate-900">
                  ২-কলাম ছবি (Split 2-Column Image)
                </span>
                <span className="text-slate-500">
                  চালু থাকলে (বা প্রস্থ &gt; উচ্চতা হলে স্বয়ংক্রিয়ভাবে) বাম ও ডান অর্ধেক আলাদাভাবে স্ক্যান হবে।
                </span>
              </span>
            </label>

            <input
              ref={ocrFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              onChange={handleImageInputChange}
              className="hidden"
              id="ocr-file-input"
            />
            <input
              ref={ocrCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageInputChange}
              className="hidden"
              id="ocr-camera-input"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => ocrFileInputRef.current?.click()}
                disabled={ocrStatus === 'loading'}
                className="py-3 px-3 border border-slate-300 hover:border-slate-500 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FileUp className="w-4 h-4 shrink-0" />
                <span>ছবি আপলোড</span>
              </button>

              <button
                type="button"
                onClick={() => ocrCameraInputRef.current?.click()}
                disabled={ocrStatus === 'loading'}
                className="py-3 px-3 border border-slate-300 hover:border-slate-500 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>ক্যামেরা দিয়ে তুলুন</span>
              </button>
            </div>

            {ocrPreviewUrl && (
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <img
                  src={ocrPreviewUrl}
                  alt="আপলোড করা প্রশ্নপত্রের ছবি"
                  className="w-full max-h-40 object-contain"
                />
              </div>
            )}

            {lastImageFile && ocrStatus !== 'loading' && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void runImageOcr(
                      lastImageFile,
                      forceSplitTwoCol ? true : 'auto',
                    )
                  }
                  className="w-full px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer"
                >
                  বর্তমান সেটিংস অনুযায়ী পুনরায় স্ক্যান করুন
                </button>

                {geminiApiKey.trim() && (
                  <button
                    type="button"
                    onClick={() => void handleGeminiExtraction(lastImageFile, 'ocr')}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Gemini 2.5 Flash ভিশন দিয়ে স্ক্যান করুন</span>
                  </button>
                )}
              </div>
            )}

            {ocrStatus === 'loading' && (
              <div className="space-y-1.5" role="status" aria-live="polite">
                <div className="flex justify-between text-xs text-slate-700 tabular-nums">
                  <span className="truncate pr-2">{ocrLabel || 'স্ক্যান হচ্ছে...'}</span>
                  <span className="font-semibold shrink-0">{ocrProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              </div>
            )}

            {ocrStatus === 'done' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>ছবি স্ক্যান সম্পন্ন! ডানপাশের ধাপ ১-এ প্রশ্নগুলো যাচাই ও সম্পাদনা করুন।</span>
              </div>
            )}

            {ocrStatus === 'error' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{ocrError}</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="raw-question-input"
                className="text-sm font-semibold text-slate-900"
              >
                কাঁচা প্রশ্নপত্র পেস্ট করুন
              </label>
              <button
                type="button"
                onClick={onLoadSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>নমুনা প্রশ্ন লোড করুন (Load Sample)</span>
              </button>
            </div>

            <textarea
              id="raw-question-input"
              value={rawText}
              onChange={(e) => onRawTextChange(e.target.value)}
              rows={10}
              placeholder="এখানে বাংলা প্রশ্নপত্রের টেক্সট পেস্ট করুন (১-১৫ সংক্ষিপ্ত এবং ১-৮ সৃজনশীল প্রশ্ন) অথবা উপরের 'নমুনা প্রশ্ন লোড করুন' বাটনে ক্লিক করুন..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 leading-relaxed"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
                <span>সংক্ষিপ্ত: {toBengaliNumber(shortCount)}টি</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>সৃজনশীল: {toBengaliNumber(creativeCount)}টি</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onReset}
                  disabled={!rawText}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>রিসেট</span>
                </button>
                <button
                  type="button"
                  onClick={() => onParseNow()}
                  disabled={!rawText.trim()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                >
                  পার্স ও যাচাই করুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Status Footer inside Input Panel */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 tabular-nums">
          <span>শনাক্তকৃত প্রশ্ন</span>
          <span>
            সংক্ষিপ্ত {toBengaliNumber(shortCount)}টি · সৃজনশীল {toBengaliNumber(creativeCount)}টি
          </span>
        </div>
      </div>
    </aside>
  );
}
