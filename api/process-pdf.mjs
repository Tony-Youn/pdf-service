import multer from "multer";
import pdfService from "../services/pdfService.mjs";
import logger from "../utils/logger.mjs";
import { decode } from "querystring";

const upload = multer();

export default async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Ensure `multer` processes the file
    await new Promise((resolve, reject) =>
      upload.single("pdf")(req, res, (err) => {
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
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    // Process the uploaded PDF using PdfService
    const processedPdf = await pdfService.extractAndReplaceText(
      req.file.buffer,
      {
        startPage: 4, // Specify the starting page (1-based index)
        endPage: 6, // Specify the ending page (1-based index)
        replacements, // Pass the replacements object
      }
    );

    // Set the response headers to return the modified PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=processed.pdf",
    });

    // Send the processed PDF as the response
    res.send(Buffer.from(processedPdf));

    // Log the success
    logger.info("PDF processed successfully", {
      originalName: decode(escape(req.file.originalname)),
      size: req.file.size,
      replacements: Object.keys(replacements),
    });
  } catch (error) {
    // Log and handle errors
    logger.error("Error processing PDF:", error);
    res.status(500).json({ error: "Error processing PDF" });
  }
};
