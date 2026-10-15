
import { PDFParse } from "pdf-parse";

/**
 * Extract text from a PDF buffer.
 */
export async function extractText(buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}
