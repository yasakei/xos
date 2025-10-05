// packages/frontend/src/apps/pdf-viewer/XPDF.tsx
import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { vfsApi } from '../file-manager/api';
import { LoaderCircle } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

interface XPDFProps {
  filePath: string;
}

const XPDF: React.FC<XPDFProps> = ({ filePath }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [pageNum, setPageNum] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPdf = async () => {
            if (!filePath) {
                setError("No PDF file path provided.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const fileData = await vfsApi.readFile(filePath);
                if (!(fileData instanceof Blob)) {
                    throw new Error("Received text data instead of a PDF file.");
                }
                const arrayBuffer = await fileData.arrayBuffer();
                const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
                setPdfDoc(doc);
            } catch (e: unknown) {
                console.error("Error loading PDF", e);
                setError(`Error loading PDF: ${e instanceof Error ? e.message : "An unknown error occurred."}`);
            } finally {
                setIsLoading(false);
            }
        };
        loadPdf();
    }, [filePath]);

    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;
        const renderPage = async () => {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = canvasRef.current!;
            const context = canvas.getContext('2d')!;
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport }).promise;
        };
        renderPage();
    }, [pdfDoc, pageNum]);

    if (isLoading) return <div className="p-4 flex items-center justify-center h-full"><LoaderCircle className="animate-spin mr-2"/>Loading PDF...</div>;
    if (error) return <div className="p-4 text-red-400">{error}</div>;
    
    return (
        <div className="w-full h-full flex flex-col items-center bg-gray-800 overflow-auto">
            <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm p-2 w-full flex items-center justify-center space-x-4 text-white">
                <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50">Prev</button>
                <span>Page {pageNum} of {pdfDoc?.numPages}</span>
                <button onClick={() => setPageNum(p => Math.min(pdfDoc!.numPages, p + 1))} disabled={pageNum >= (pdfDoc?.numPages || 1)} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50">Next</button>
            </div>
            <canvas ref={canvasRef} className="my-4 shadow-lg"/>
        </div>
    );
};

export default XPDF;