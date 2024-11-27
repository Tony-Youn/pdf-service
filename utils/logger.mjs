import winston from "winston";
import path from "path";
import fs from "fs";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [],
});

// For production (Vercel), use console logging only
if (process.env.NODE_ENV === "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
} else {
  // For development, use file-based logging and console logging

  // Ensure logs directory exists
  const logDir = path.join(process.cwd(), "logs"); // Use `process.cwd()` for consistent root directory resolution
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
    })
  );

  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export default logger;
