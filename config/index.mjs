export default {
  port: process.env.PORT || 3001,
  logLevel: process.env.LOG_LEVEL || "info",
  maxFileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ["application/pdf"],
};
