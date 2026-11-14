import { useState } from 'react';
import {
  Printer,
  KeyRound,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from 'lucide-react';
import type { WorkflowStep } from '../types/questionPaper';

interface TopBarProps {
  activeStep: WorkflowStep;
  onStepChange: (step: WorkflowStep) => void;
  onPrint: () => void;
  hasContent: boolean;
  geminiApiKey: string;
  onGeminiApiKeyChange: (key: string) => void;
}

export function TopBar({
  activeStep,
  onStepChange,
  onPrint,
  hasContent,
  geminiApiKey,
  onGeminiApiKeyChange,
}: TopBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [draftKey, setDraftKey] = useState(geminiApiKey);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveKey = () => {
    onGeminiApiKeyChange(draftKey.trim());
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleClearKey = () => {
    setDraftKey('');
    onGeminiApiKeyChange('');
  };

  return (
    <div className="no-print bg-white border-b border-slate-200">
      <header className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4 sm:gap-8 max-w-[1680px] mx-auto">
        <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          প্রশ্নপত্র ফরম্যাটার
        </span>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onStepChange('verify')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeStep === 'verify'
                ? 'text-slate-900 font-semibold underline underline-offset-4'
                : 'hover:text-slate-900'
            }`}
          >
            ধাপ ১: যাচাই ও সম্পাদনা
          </button>
          <button
            type="button"
            onClick={() => onStepChange('preview')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeStep === 'preview'
                ? 'text-slate-900 font-semibold underline underline-offset-4'
                : 'hover:text-slate-900'
            }`}
          >
            ধাপ ২: এ৪ প্রিভিউ ও প্রিন্ট
          </button>
          <button
            type="button"
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span>Advanced: Optional Gemini API Key</span>
            {showAdvanced ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced((v) => !v)}
            aria-label="Advanced: Optional Gemini API Key"
            className="md:hidden inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>AI Key</span>
          </button>
          <button
            type="button"
            onClick={onPrint}
            disabled={!hasContent}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>প্রিন্ট / PDF</span>
          </button>
        </div>
      </header>

      {showAdvanced && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-3">
          <div className="max-w-[1680px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600 space-y-0.5">
              <p className="font-semibold text-slate-800">
                ঐচ্ছিক ক্লাউড ভিশন মোড (Optional — স্বাভাবিক ব্যবহারের জন্য প্রয়োজন নেই)
              </p>
              <p>
                অ্যাপটি সম্পূর্ণ অফলাইন ও API Key ছাড়াই চলে। তবে চাইলে আপনার বিনামূল্যের Gemini API Key এখানে দিলে ছবি/PDF থেকে <code className="font-mono text-slate-800">gemini-2.5-flash</code> ভিশন এক্সট্র্যাকশন ব্যবহার করতে পারবেন।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <input
                type="password"
                aria-label="Optional Gemini API Key"
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                placeholder="AIza... (ঐচ্ছিক)"
                className="w-56 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer whitespace-nowrap"
              >
                {savedNotice ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>সংরক্ষিত</span>
                  </>
                ) : (
                  <span>সক্রিয় করুন</span>
                )}
              </button>
              {geminiApiKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 bg-white rounded-md cursor-pointer whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>মুছুন</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
