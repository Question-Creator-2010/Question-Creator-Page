export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width?: number;
}

const ISOLATED_MARK_DIGIT_REGEX = /^[১২৩৪12348]$/;

function reconstructColumnLines(items: PdfTextItem[]): string[] {
  const valid = items
    .map((it) => ({ ...it, str: it.str.replace(/\u200B/g, '') }))
    .filter((it) => it.str.trim().length > 0);

  if (valid.length === 0) return [];

  const minX = Math.min(...valid.map((it) => it.x));
  const maxX = Math.max(...valid.map((it) => it.x + (it.width ?? 0)));
  const colSpan = Math.max(1, maxX - minX);
  const rightMarginThreshold = minX + colSpan * 0.84;

  // Sort top-to-bottom (y descending), then left-to-right (x ascending)
  const sorted = [...valid].sort((a, b) => {
    if (Math.abs(b.y - a.y) > 4) return b.y - a.y;
    return a.x - b.x;
  });

  // Group items within 4px y-tolerance into lines
  const lines: PdfTextItem[][] = [];
  let currentY: number | null = null;
  let currentLine: PdfTextItem[] = [];

  for (const item of sorted) {
    if (currentY === null || Math.abs(item.y - currentY) <= 4) {
      currentY = currentY ?? item.y;
      currentLine.push(item);
    } else {
      lines.push(currentLine.sort((a, b) => a.x - b.x));
      currentY = item.y;
      currentLine = [item];
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.sort((a, b) => a.x - b.x));
  }

  const outputLines: string[] = [];
  for (const lineItems of lines) {
    // Strip isolated single mark digit positioned at the far right margin of the column
    let filtered = lineItems;
    if (filtered.length >= 2) {
      const last = filtered[filtered.length - 1];
      const prev = filtered[filtered.length - 2];
      const lastTrimmed = last.str.trim();
      const prevRight = prev.x + (prev.width ?? prev.str.length * 4);
      const gap = last.x - prevRight;

      if (
        ISOLATED_MARK_DIGIT_REGEX.test(lastTrimmed) &&
        (last.x >= rightMarginThreshold || gap >= 18)
      ) {
        filtered = filtered.slice(0, -1);
      }
    } else if (filtered.length === 1) {
      const only = filtered[0];
      if (
        ISOLATED_MARK_DIGIT_REGEX.test(only.str.trim()) &&
        only.x >= rightMarginThreshold
      ) {
        filtered = [];
      }
    }

    const joined = filtered
      .map((p) => p.str)
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (joined) {
      outputLines.push(joined);
    }
  }

  return outputLines;
}

export function detectTwoColumnLayout(
  items: PdfTextItem[],
  viewportWidth: number,
): boolean {
  if (viewportWidth <= 0) return false;
  const splitX = viewportWidth * 0.48;
  const nonEmpty = items.filter((it) => it.str.trim().length > 0);
  const leftItems = nonEmpty.filter((it) => it.x < splitX);
  const rightItems = nonEmpty.filter((it) => it.x >= splitX);

  if (leftItems.length < 4 || rightItems.length < 4) {
    return false;
  }

  // Group into y-rows (within 4px) to verify there is a true column split,
  // not a single-column page whose lines simply extend past 48% width.
  const rows: PdfTextItem[][] = [];
  const sortedByY = [...nonEmpty].sort((a, b) => b.y - a.y);
  let curY: number | null = null;
  let curRow: PdfTextItem[] = [];

  for (const it of sortedByY) {
    if (curY === null || Math.abs(it.y - curY) <= 4) {
      curY = curY ?? it.y;
      curRow.push(it);
    } else {
      rows.push(curRow);
      curY = it.y;
      curRow = [it];
    }
  }
  if (curRow.length > 0) rows.push(curRow);

  let bothSidesRows = 0;
  let clearGutterRows = 0;

  for (const row of rows) {
    const rowLeft = row.filter((it) => it.x < splitX);
    const rowRight = row.filter((it) => it.x >= splitX);
    if (rowLeft.length > 0 && rowRight.length > 0) {
      bothSidesRows++;
      const maxLeftEnd = Math.max(
        ...rowLeft.map((it) => it.x + (it.width ?? it.str.length * 4)),
      );
      const minRightStart = Math.min(...rowRight.map((it) => it.x));
      if (minRightStart - maxLeftEnd >= 16) {
        clearGutterRows++;
      }
    }
  }

  // If almost no rows cross the middle seamlessly (either rows are only on one side,
  // or rows with both sides have a clear >=16px column gutter), it is 2-column.
  if (bothSidesRows === 0) return true;
  return clearGutterRows / bothSidesRows >= 0.55;
}

export function reconstructPdfPageText(
  items: PdfTextItem[],
  viewportWidth: number,
): string {
  const nonEmpty = items.filter((it) => it.str.trim().length > 0);
  if (nonEmpty.length === 0) return '';

  const isTwoColumn = detectTwoColumnLayout(nonEmpty, viewportWidth);
  if (!isTwoColumn) {
    return reconstructColumnLines(nonEmpty).join('\n');
  }

  const splitX = viewportWidth * 0.48;
  const leftItems = nonEmpty.filter((it) => it.x < splitX);
  const rightItems = nonEmpty.filter((it) => it.x >= splitX);

  const leftLines = reconstructColumnLines(leftItems);
  const rightLines = reconstructColumnLines(rightItems);

  return [...leftLines, ...rightLines].join('\n');
}
