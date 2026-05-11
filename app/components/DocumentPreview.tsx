"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

// IMPORTANT:
// Do not import `react-pdf` / `pdfjs-dist` at the top-level.
// `pdfjs-dist` can crash during Next.js module evaluation.
// Next's `dynamic` works best when the loader resolves to a component.
// We must avoid returning a module namespace object.
const Document = dynamic(() => import("react-pdf").then((m) => m.Document), {
  ssr: false,
  loading: () => <div className="text-gray-500 text-sm">Loading PDF…</div>,
});

const Page = dynamic(() => import("react-pdf").then((m) => m.Page), {
  ssr: false,
});

export default function DocumentPreview({ file }: { file: string }) {
  const [numPages, setNumPages] = useState<number>();

  const isImage = useMemo(() => {
    const lower = file.toLowerCase();
    return (
      lower.endsWith(".png") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg")
    );
  }, [file]);

  if (isImage) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <img src={file} alt="preview" className="max-h-full rounded-lg" />
      </div>
    );
  }

  // Render PDF only after dynamic import resolves (client-only).
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Document
        file={file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={() => {
          // Keep UI stable; chat page should not crash.
          setNumPages(undefined);
        }}
      >
        <Page pageNumber={1} />
      </Document>
    </div>
  );
}
