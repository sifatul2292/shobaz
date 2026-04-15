'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  file: string;
}

export default function PdfViewer({ file }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [windowWidth, setWindowWidth] = useState(500);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(Math.min(500, window.innerWidth - 40));
    }
  }, []);

  return (
    <Document
      file={file}
      onLoadSuccess={({ numPages: pages }: { numPages: number }) => {
        setNumPages(pages);
      }}
      loading={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 md:gap-6 px-2 md:px-4 py-4 md:py-6">
        {Array.from(new Array(numPages), (_, index) => (
          <Page 
            key={index + 1}
            pageNumber={index + 1} 
            width={windowWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-lg bg-white"
          />
        ))}
      </div>
    </Document>
  );
}