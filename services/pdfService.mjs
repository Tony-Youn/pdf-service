import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import { PDFDocument } from "pdf-lib";
import logger from "../utils/logger.mjs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve the current file and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set the worker source to the correct local path
const workerPath = path.join(
  __dirname,
  "../node_modules/pdfjs-dist/build/pdf.worker.min.mjs"
);
pdfjsLib.GlobalWorkerOptions.workerSrc = `file://${workerPath}`;

class PdfService {
  async extractAndReplaceText(pdfBuffer, { startPage, endPage, replacements }) {
    try {
      const pdfDoc = await pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
      }).promise;
      const totalPages = pdfDoc.numPages;

      if (startPage < 1 || endPage > totalPages) {
        throw new Error("Invalid page range");
      }

      const newPdf = await PDFDocument.create();

      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const textPositions = this.findTextPositions(textContent, replacements);

        const originalPdf = await PDFDocument.load(pdfBuffer);
        const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNum - 1]);

        for (const pos of textPositions) {
          copiedPage.drawRectangle({
            x: pos.x,
            y: pos.y,
            width: pos.width,
            height: pos.height,
            color: { r: 1, g: 1, b: 1 },
          });

          copiedPage.drawText(pos.newText, {
            x: pos.x,
            y: pos.y,
            size: pos.fontSize || 12,
            color: { r: 0, g: 0, b: 0 },
          });
        }

        newPdf.addPage(copiedPage);
      }

      return await newPdf.save();
    } catch (error) {
      logger.error("PDF processing error:", error);
      throw new Error("PDF 처리 중 오류가 발생했습니다.");
    }
  }

  findTextPositions(textContent, replacements) {
    const positions = [];
    const { items } = textContent;

    items.forEach((item) => {
      for (const [oldText, newText] of Object.entries(replacements)) {
        if (item.str.includes(oldText)) {
          positions.push({
            x: item.transform[4],
            y: item.transform[5],
            width: item.width,
            height: item.height || 10,
            fontSize: item.height || 12,
            oldText,
            newText,
          });
        }
      }
    });

    return positions;
  }
}

export default new PdfService();
