import express from "express";
import processPdf from "./api/process-pdf.mjs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Local testing route for process-pdf
app.post("/api/process-pdf", processPdf);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
