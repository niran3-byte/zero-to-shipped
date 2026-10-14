import { PDFParse } from "pdf-parse";

/**
 * Extract the text layer from a PDF buffer.
 *
 * pdf-parse v2 wraps pdf.js and is class-based, not the `pdf(buffer)` function
 * you will find in older v1 tutorials. The instance holds a pdf.js worker, so
 * `destroy()` must run or the worker leaks and the process never exits cleanly —
 * hence the try/finally.
 *
 * Note the `new Uint8Array(buffer)`: pdf.js transfers typed arrays to its worker,
 * which takes ownership of the underlying memory. Passing the Buffer directly
 * can leave the caller holding a detached buffer.
 *
 * Scanned/image-only PDFs have no text layer and come back empty. That is a real
 * limitation of text extraction, not a bug — it needs OCR to solve, later.
 */
export async function extractText(buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    // pageJoiner: "" switches off pdf-parse's default "\n-- 1 of 2 --\n" page
    // markers, which would otherwise sit in the stored resume text for no benefit.
    const result = await parser.getText({ pageJoiner: "" });
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}
