const express = require("express");
const multer = require("multer");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const config = require("./config");
const { validatePdfRequest } = require("./middleware/validation");
const pdfService = require("./services/pdfService");
const logger = require("./utils/logger");

const app = express();

// 미들웨어 설정
app.use(helmet());
app.use(cors());
app.use(compression());

// 파일 업로드 설정
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSize },
});

// PDF 처리 엔드포인트
app.post(
  "/api/process-pdf",
  upload.single("pdf"),
  validatePdfRequest,
  async (req, res) => {
    try {
      const replacements = req.body.replacements
        ? JSON.parse(req.body.replacements)
        : {};

      const processedPdf = await pdfService.extractAndReplaceText(
        req.file.buffer,
        {
          startPage: 4,
          endPage: 6,
          replacements,
        }
      );

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=processed.pdf",
      });

      res.send(Buffer.from(processedPdf));

      logger.info("PDF processed successfully", {
        originalName: req.file.originalname,
        size: req.file.size,
        replacements: Object.keys(replacements),
      });
    } catch (error) {
      logger.error("Error processing PDF:", error);
      res.status(500).json({
        error: "PDF 처리 중 오류가 발생했습니다.",
      });
    }
  }
);

// 서버 시작
const port = config.port;
app.listen(port, () => {
  logger.info(`서버가 포트 ${port}에서 실행 중입니다.`);
});
