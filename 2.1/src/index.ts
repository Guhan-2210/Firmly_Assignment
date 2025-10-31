import { Hono } from "hono";
import { cors } from "hono/cors";
import { DatabaseClient } from "../db/client";
import { ProductModel } from "./models/product";
import { initializeR2Logging, logger, flushLogs } from "./logger";
import productRoutes from "./routes/productRoutes";

type Bindings = {
  DB: D1Database;
  LOGS_BUCKET: R2Bucket;
};

type Variables = {
  db: DatabaseClient;
  productModel: ProductModel;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", cors());

app.use("*", async (c, next) => {
  initializeR2Logging(c.env.LOGS_BUCKET);
  const db = new DatabaseClient(c.env.DB);
  c.set("db", db);

  const productModel = new ProductModel(db);
  c.set("productModel", productModel);

  await next();
});

app.use("*", async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  
  await next();
  
  const duration = Date.now() - start;
  logger.info("http_request", {
    method,
    path,
    status: c.res.status,
    duration: `${duration}ms`,
  });
});

// Routes
app.route("/api/products", productRoutes);

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Error handler
app.onError((err, c) => {
  logger.error("unhandled_error", { 
    error: err.message, 
    stack: err.stack,
    path: c.req.path 
  });
  
  return c.json(
    { error: err.message || "Internal server error" },
    500
  );
});

// Flush logs before worker terminates
app.use("*", async (c, next) => {
  await next();

  // Immediate flush
  c.executionCtx.waitUntil(flushLogs().catch(() => {}));

  // Periodic flush (in case worker is reused)
  c.executionCtx.waitUntil(
    new Promise(r => setTimeout(r, 30_000)).then(() => flushLogs().catch(() => {}))
  );
});

export default app;