import * as pdfjsLib from "pdfjs-dist";

// Use CDN worker to avoid bundling issues in Next.js
const PDFJS_VERSION = "5.7.284";
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

export interface ExtractProgress {
  stage: "loading" | "extracting" | "done";
  currentPage: number;
  totalPages: number;
  percent: number;
}

export async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: ExtractProgress) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({ stage: "loading", currentPage: 0, totalPages: 0, percent: 10 });

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;

  onProgress?.({ stage: "extracting", currentPage: 0, totalPages, percent: 20 });

  let fullText = "";
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: unknown) => {
        const textItem = item as { str: string };
        return textItem.str;
      })
      .join(" ");
    fullText += pageText + "\n";

    const percent = 20 + Math.round((i / totalPages) * 70);
    onProgress?.({ stage: "extracting", currentPage: i, totalPages, percent });
  }

  onProgress?.({ stage: "done", currentPage: totalPages, totalPages, percent: 100 });

  return fullText.trim();
}
