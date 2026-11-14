import { useEffect, useRef, useState, type ReactNode } from 'react';

// 297mm and 210mm at standard CSS 96 DPI (1 inch = 25.4mm)
const A4_LANDSCAPE_WIDTH_PX = (297 * 96) / 25.4; // ~1122.52px
const A4_LANDSCAPE_HEIGHT_PX = (210 * 96) / 25.4; // ~793.70px
const SHEET_GAP_PX = 25;

interface ResponsiveSheetWrapperProps {
  sheetCount: number;
  children: ReactNode;
}

export function ResponsiveSheetWrapper({
  sheetCount,
  children,
}: ResponsiveSheetWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const availableWidth = el.clientWidth;
      if (availableWidth <= 0) return;
      const nextScale = Math.min(1, availableWidth / A4_LANDSCAPE_WIDTH_PX);
      setScale(nextScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const totalUnscaledHeight =
    sheetCount * A4_LANDSCAPE_HEIGHT_PX + Math.max(0, sheetCount - 1) * SHEET_GAP_PX;
  const scaledWidth = A4_LANDSCAPE_WIDTH_PX * scale;
  const scaledHeight = totalUnscaledHeight * scale;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden flex justify-center"
      data-testid="responsive-sheet-container"
    >
      <div
        className="print:!w-auto print:!h-auto"
        style={{
          width: scale < 1 ? `${scaledWidth}px` : `${A4_LANDSCAPE_WIDTH_PX}px`,
          height: scale < 1 ? `${scaledHeight}px` : 'auto',
        }}
      >
        <div
          className="preview-scale-wrapper origin-top-left"
          style={{
            width: `${A4_LANDSCAPE_WIDTH_PX}px`,
            transform: scale < 1 ? `scale(${scale})` : 'none',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
