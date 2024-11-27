import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit"; // Import fontkit
import logger from "../utils/logger.mjs";
import fs from "fs";
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

      // Register fontkit
      newPdf.registerFontkit(fontkit);

      // Embed custom font
      const fontPath = path.join(__dirname, "../public/NotoSansKR-Regular.ttf");
      const fontBytes = fs.readFileSync(fontPath);
      const customFont = await newPdf.embedFont(fontBytes);

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
            color: rgb(1, 1, 1), // White to "erase" old text
          });

          copiedPage.drawText(pos.newText, {
            x: pos.x,
            y: pos.y,
            size: pos.fontSize || 12,
            font: customFont, // Use the embedded font
            color: rgb(0, 0, 0), // Black text
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
            height: item.height || 10, // Provide a fallback height
            fontSize: item.height || 12, // Provide a fallback font size
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
