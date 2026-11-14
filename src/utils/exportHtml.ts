import type { OutputFormat } from '../types/questionPaper';

export const EXACT_SHEET_CSS = `:root {
    --ink-color: #000000;
    --paper-bg: #ffffff;
    --font-bn: 'Noto Serif Bengali', serif;
    --font-en: 'Times New Roman', Times, serif;
}

.sheet {
    width: 297mm;
    height: 210mm;
    background: var(--paper-bg);
    color: var(--ink-color);
    font-family: var(--font-bn);
    font-size: 13px;
    line-height: 1.44;
    margin: 0 auto 25px auto;
    padding: 11mm 14mm 18mm 14mm;
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 16mm;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    position: relative;
    box-sizing: border-box;
}

.sheet * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

.sheet::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    border-left: 1px dashed #cbd5e1;
}

.page-col {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
}

.header {
    text-align: center;
    margin-bottom: 4px;
}

.school-name {
    font-size: 18.5px;
    font-weight: 700;
    margin-bottom: 1px;
}

.exam-title, .subject, .class-name {
    font-size: 13.5px;
    line-height: 1.32;
}

.en-text {
    font-family: var(--font-en);
}

.q-mark {
    font-family: var(--font-bn);
    font-size: 11px;
    font-weight: 400;
    margin-left: 0.5px;
}

.clean-sym {
    font-family: var(--font-en);
    font-weight: 400;
}

.meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12.8px;
    margin-top: 2px;
    margin-bottom: 2px;
}

.section-bar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    margin: 2px 0 5px 0;
    font-size: 12.8px;
}

.section-left {
    text-align: left;
}

.section-title {
    font-weight: 700;
    text-align: center;
    font-size: 11.5px;
}

.section-marks {
    text-align: right;
    font-size: 12.8px;
    white-space: nowrap;
}

.short-q-list {
    list-style: none;
    margin-bottom: 12px;
}

.short-q-list li {
    display: flex;
    margin-bottom: 1.5px;
}

.short-q-list .q-no {
    width: 24px;
    flex-shrink: 0;
}

.cq-item {
    display: flex;
    margin-bottom: 10px;
    text-align: justify;
}

.cq-item:last-child {
    margin-bottom: 0;
}

.cq-no {
    width: 19px;
    flex-shrink: 0;
}

.cq-content {
    flex: 1;
}

.stem {
    margin-bottom: 2.5px;
}

.sub-q {
    list-style: none;
}

.sub-q li {
    display: flex;
    margin-bottom: 1px;
}

.sub-q .sub-label {
    width: 19px;
    flex-shrink: 0;
}

.q-table {
    width: 88%;
    margin: 4px auto 5px auto;
    border-collapse: collapse;
    text-align: center;
    font-size: 12.2px;
}

.q-table th, .q-table td {
    border: 1px solid #000000;
    padding: 2.5px 6px;
    font-weight: 400;
    vertical-align: middle;
}

.single-box {
    width: 58%;
    margin: 4px auto 5px auto;
    border: 1px solid #000000;
    padding: 3.5px 10px;
    font-size: 12.2px;
    text-align: left;
}

.page-num {
    text-align: center;
    font-size: 12.5px;
    margin-bottom: 6px;
}

@media print {
    body {
        background: none !important;
        padding: 0 !important;
        margin: 0 !important;
    }
    .no-print {
        display: none !important;
    }
    .preview-scale-wrapper {
        transform: none !important;
        width: auto !important;
        height: auto !important;
    }
    .sheet {
        box-shadow: none !important;
        margin: 0 !important;
        width: 297mm !important;
        height: 210mm !important;
        page-break-after: always;
    }
    .sheet::after {
        display: none !important;
    }
    @page {
        size: A4 landscape;
        margin: 0;
    }
}`;

export function buildExportFilename(subject: string, format: OutputFormat): string {
  const cleanSubject = subject
    .replace(/^বিষ(?:য়|য়)\s*[:\-–—]?\s*/, '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_') || 'প্রশ্নপত্র';
  const formatLabel = format === 'format1' ? 'ফরম্যাট-১' : 'ফরম্যাট-২';
  return `${cleanSubject}_প্রশ্নপত্র_${formatLabel}.html`;
}

function escapeTitle(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildStandaloneHtml(params: {
  title: string;
  sheetsHtml: string;
}): string {
  const safeTitle = escapeTitle(params.title || 'প্রশ্নপত্র');

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      background: #e2e8f0;
      padding: 20px 0;
      margin: 0;
      font-family: 'Noto Serif Bengali', serif;
    }
${EXACT_SHEET_CSS}
  </style>
</head>
<body>
${params.sheetsHtml}
<script>
  (function () {
    function normalizeTextNodes(root) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      var nodes = [];
      var node;
      while ((node = walker.nextNode())) {
        if (node.parentElement && (node.parentElement.classList.contains('q-mark') || node.parentElement.classList.contains('clean-sym'))) {
          continue;
        }
        if (/[?']/.test(node.nodeValue || '')) {
          nodes.push(node);
        }
      }
      nodes.forEach(function (textNode) {
        var val = textNode.nodeValue || '';
        var html = val
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/'([^'\\n]+)'/g, "<span class='clean-sym'>‘</span>$1<span class='clean-sym'>’</span>")
          .replace(/\\?/g, '<span class="q-mark">?</span>');
        var span = document.createElement('span');
        span.innerHTML = html;
        var frag = document.createDocumentFragment();
        while (span.firstChild) frag.appendChild(span.firstChild);
        textNode.parentNode.replaceChild(frag, textNode);
      });
    }

    document.querySelectorAll('.sheet').forEach(function (sheet) {
      sheet.setAttribute('contenteditable', 'true');
      sheet.addEventListener('blur', function () {
        normalizeTextNodes(sheet);
      });
    });
  })();
</script>
</body>
</html>`;
}
