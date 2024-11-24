const upload = require("multer")();
const pdfService = require("../src/services/pdfService");
const logger = require("../src/utils/logger");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  upload.single("pdf")(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: "File upload failed" });
      return;
    }

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
      res.status(500).json({ error: "Error processing PDF" });
    }
  });
};
