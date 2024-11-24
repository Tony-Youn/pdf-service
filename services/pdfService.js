const { PDFDocument } = require("pdf-lib");
const PDFParser = require("pdf2json");
const logger = require("../utils/logger");

class PdfService {
  async extractAndReplaceText(pdfBuffer, { startPage, endPage, replacements }) {
    try {
      // 1. 원본 PDF 로드
      const pdfDoc = await PDFDocument.load(pdfBuffer);

      // 2. 새 PDF 생성
      const newPdf = await PDFDocument.create();

      // 3. 지정된 페이지 복사 (4-6 페이지는 인덱스로 3-5)
      const pageIndexes = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i - 1
      );

      // 4. 페이지 복사 및 텍스트 교체
      for (const pageIndex of pageIndexes) {
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex]);

        // 텍스트 교체 작업
        if (replacements && Object.keys(replacements).length > 0) {
          for (const [oldText, newText] of Object.entries(replacements)) {
            // 텍스트 찾기 및 교체
            const textPositions = await this.findTextPositions(
              copiedPage,
              oldText
            );
            for (const pos of textPositions) {
              // 기존 텍스트 가리기
              copiedPage.drawRectangle({
                x: pos.x,
                y: pos.y,
                width: pos.width,
                height: pos.height,
                color: { r: 1, g: 1, b: 1 }, // 흰색
              });

              // 새 텍스트 그리기
              copiedPage.drawText(newText, {
                x: pos.x,
                y: pos.y,
                size: pos.fontSize || 12,
                color: { r: 0, g: 0, b: 0 }, // 검정색
              });
            }
          }
        }

        newPdf.addPage(copiedPage);
      }

      // 5. 수정된 PDF 저장
      return await newPdf.save();
    } catch (error) {
      logger.error("PDF processing error:", error);
      throw new Error("PDF 처리 중 오류가 발생했습니다.");
    }
  }

  async findTextPositions(page, searchText) {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataReady", (data) => {
        const positions = [];
        const texts = data.formImage.Pages[0].Texts;

        for (const text of texts) {
          if (text.R[0].T === searchText) {
            positions.push({
              x: text.x,
              y: text.y,
              width: text.w,
              height: text.h,
              fontSize: text.R[0].TS[1],
            });
          }
        }

        resolve(positions);
      });

      pdfParser.on("pdfParser_dataError", (error) => {
        reject(error);
      });

      pdfParser.parseBuffer(page.getBuffer());
    });
  }
}

module.exports = new PdfService();
