import { Router, error, json } from 'itty-router';
import { DatabaseClient } from "../db/client";
import { ProductModel } from "./models/product";
import { initializeR2Logging, logger, flushLogs } from "./logger";
import { productRoutes } from "./routes/productRoutes";

type Env = {
  DB: D1Database;
  LOGS_BUCKET: R2Bucket;
};

type RequestWithEnv = Request & {
  env: Env;
  db?: DatabaseClient;
  productModel?: ProductModel;
  executionCtx?: ExecutionContext;
};

const router = Router();

// CORS middleware
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

router.all('*', (req: RequestWithEnv) => {
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
});

// Initialize DB and models middleware
router.all('*', (req: RequestWithEnv) => {
  initializeR2Logging(req.env.LOGS_BUCKET);
  const db = new DatabaseClient(req.env.DB);
  req.db = db;
  req.productModel = new ProductModel(db);
});

// Logging middleware
router.all('*', async (req: RequestWithEnv) => {
  const start = Date.now();
  const method = req.method;
  const path = new URL(req.url).pathname;
  
  // Store start time for later use
  (req as any).startTime = start;
  (req as any).requestPath = path;
});

// Mount product routes
productRoutes(router);

// Health check
router.get('/health', () => 
  json({ status: "ok", timestamp: new Date().toISOString() })
);

// 404 handler
router.all('*', () => 
  json({ error: "Not found" }, { status: 404 })
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const req = request as RequestWithEnv;
    req.env = env;
    req.executionCtx = ctx;

    try {
      const response = await router.handle(req);
      
      // Log request after handling
      if ((req as any).startTime && (req as any).requestPath) {
        const duration = Date.now() - (req as any).startTime;
        logger.info("http_request", {
          method: req.method,
          path: (req as any).requestPath,
          status: response.status,
          duration: `${duration}ms`,
        });
      }

      // Add CORS headers to response
      const corsResponse = new Response(response.body, response);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        corsResponse.headers.set(key, value);
      });

      // Flush logs
      ctx.waitUntil(flushLogs().catch(() => {}));
      ctx.waitUntil(
        new Promise(r => setTimeout(r, 30_000)).then(() => flushLogs().catch(() => {}))
      );

      return corsResponse;
    } catch (err: any) {
      logger.error("unhandled_error", { 
        error: err.message, 
        stack: err.stack,
        path: new URL(req.url).pathname
      });
      
      return json(
        { error: err.message || "Internal server error" },
        { status: 500, headers: corsHeaders }
      );
    }
  }
};