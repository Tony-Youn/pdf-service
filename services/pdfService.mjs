import { getDocument } from "pdfjs-dist/build/pdf.mjs";
import { PDFDocument } from "pdf-lib";
import logger from "../utils/logger.mjs";

class PdfService {
  /**
   * Extract and replace text in a PDF buffer.
   * @param {Buffer} pdfBuffer - The PDF file as a buffer.
   * @param {Object} options - Configuration options for page range and replacements.
   * @param {number} options.startPage - Starting page number (1-based).
   * @param {number} options.endPage - Ending page number (1-based).
   * @param {Object} options.replacements - Text replacements in the form { oldText: newText }.
   * @returns {Promise<Buffer>} - A buffer of the modified PDF.
   */
  async extractAndReplaceText(pdfBuffer, { startPage, endPage, replacements }) {
    try {
      // Load the original PDF with pdfjs-dist
      const pdfDoc = await getDocument({ data: new Uint8Array(pdfBuffer) })
        .promise;
      const totalPages = pdfDoc.numPages;

      // Validate the page range
      if (startPage < 1 || endPage > totalPages) {
        throw new Error("Invalid page range");
      }

      // Create a new PDF using pdf-lib
      const newPdf = await PDFDocument.create();

      // Process pages in the specified range
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);

        // Extract text from the current page
        const textContent = await page.getTextContent();

        // Perform text replacements
        const textPositions = this.findTextPositions(textContent, replacements);

        // Load the original PDF buffer into pdf-lib for modifications
        const originalPdf = await PDFDocument.load(pdfBuffer);
        const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNum - 1]);

        // Replace text on the copied page
        for (const pos of textPositions) {
          copiedPage.drawRectangle({
            x: pos.x,
            y: pos.y,
            width: pos.width,
            height: pos.height,
            color: { r: 1, g: 1, b: 1 }, // White to "erase" old text
          });

          copiedPage.drawText(pos.newText, {
            x: pos.x,
            y: pos.y,
            size: pos.fontSize || 12,
            color: { r: 0, g: 0, b: 0 }, // Black text
          });
        }

        newPdf.addPage(copiedPage);
      }

      // Save the modified PDF
      return await newPdf.save();
    } catch (error) {
      logger.error("PDF processing error:", error);
      throw new Error("PDF 처리 중 오류가 발생했습니다.");
    }
  }

  /**
   * Find text positions for replacements on a given page's text content.
   * @param {Object} textContent - Text content extracted from a PDF page.
   * @param {Object} replacements - Text replacements in the form { oldText: newText }.
   * @returns {Array} - An array of text positions with their coordinates and dimensions.
   */
  findTextPositions(textContent, replacements) {
    const positions = [];
    const { items } = textContent;

    // Loop through each piece of text on the page
    items.forEach((item) => {
      for (const [oldText, newText] of Object.entries(replacements)) {
        if (item.str.includes(oldText)) {
          // Approximate position and dimensions
          positions.push({
            x: item.transform[4], // X coordinate
            y: item.transform[5], // Y coordinate
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
