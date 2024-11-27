const errorHandler = (err, req, res, next) => {
  logger.error("Error:", err);

  if (err.name === "MulterError") {
    return res.status(400).json({
      error: "File upload error",
      details: err.message,
    });
  }

  if (err.name === "SyntaxError" && err.message.includes("JSON")) {
    return res.status(400).json({
      error: "Invalid replacements format",
      details: "Replacements must be valid JSON",
    });
  }

  res.status(500).json({
    error: "Internal server error",
    requestId: req.id,
  });
};
