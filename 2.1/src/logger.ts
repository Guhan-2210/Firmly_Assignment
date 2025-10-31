// Cloudflare Workers-compatible logger with R2 support
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
}

class CloudflareLogger {
  private r2Bucket: R2Bucket | null = null;
  private logBuffer: LogEntry[] = [];
  private bufferSize = 50;

  setR2Bucket(bucket: R2Bucket) {
    this.r2Bucket = bucket;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
    };

    // Console output
    const consoleMsg = `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`;
    if (metadata) {
      console.log(consoleMsg, JSON.stringify(metadata));
    } else {
      console.log(consoleMsg);
    }

    // Buffer for R2
    this.logBuffer.push(entry);

    // Auto-flush if buffer is full
    if (this.logBuffer.length >= this.bufferSize) {
      this.flush().catch(err => console.error("Failed to flush logs:", err));
    }
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log("debug", message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: Record<string, any>) {
    this.log("error", message, metadata);
  }

  async flush() {
    if (!this.r2Bucket || this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const date = new Date().toISOString().split("T")[0];
      const filename = `logs/${date}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jsonl`;
      const content = logsToFlush.map(entry => JSON.stringify(entry)).join("\n");

      await this.r2Bucket.put(filename, content, {
        httpMetadata: {
          contentType: "application/json",
        },
      });
    } catch (error) {
      console.error("Failed to write logs to R2:", error);
      // Re-add logs to buffer on failure
      this.logBuffer.unshift(...logsToFlush);
    }
  }
}

export const logger = new CloudflareLogger();

export function initializeR2Logging(r2Bucket: R2Bucket) {
  logger.setR2Bucket(r2Bucket);
}

export function flushLogs() {
  return logger.flush();
}