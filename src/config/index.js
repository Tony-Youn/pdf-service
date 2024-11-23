module.exports = {
  port: process.env.PORT || 3000,
  logLevel: process.env.LOG_LEVEL || "info",
  maxFileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ["application/pdf"],
};
