// logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, json } = format;

const level = process.env.LOG_LEVEL || 'info';

const logger = createLogger({
  level,
  format: combine(
    timestamp(),
    // JSON structured logs
    json()
  ),
  transports: [
    // Console transport outputs structured JSON - useful for containerized apps / log aggregation
    new transports.Console()
    // In production add File or external transports (Logstash, CloudWatch, etc.)
  ],
  exitOnError: false
});

module.exports = logger;
