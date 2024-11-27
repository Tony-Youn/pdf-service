import multer from "multer";
import pdfService from "../services/pdfService.mjs";
import logger from "../utils/logger.mjs";
import { decode } from "querystring";

const upload = multer();

export default async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    // Handle file upload
    await new Promise((resolve, reject) =>
      upload.single("pdf")(req, {}, (err) => {
        if (err) return reject(err);
        resolve();
      })
    );

    // Parse replacements from the request body
    const replacements = req.body.replacements
      ? JSON.parse(req.body.replacements)
      : {};

    // Ensure the uploaded file exists
    if (!req.file || !req.file.buffer) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "No PDF file uploaded" }));
      return;
    }

    // Process the uploaded PDF
    const processedPdf = await pdfService.extractAndReplaceText(
      req.file.buffer,
      {
        startPage: 4,
        endPage: 6,
        replacements,
      }
    );

    // Set headers and send the response
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=processed.pdf");
    res.end(Buffer.from(processedPdf));

    // Log success
    logger.info("PDF processed successfully", {
      originalName: decode(escape(req.file.originalname)),
      size: req.file.size,
      replacements: Object.keys(replacements),
    });
  } catch (error) {
    // Log error
    logger.error("Error processing PDF:", error);

    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Error processing PDF" }));
  }
};
