# Order Management API - Cloudflare D1 & R2

Order management API built with Cloudflare Workers, D1 (database), and R2 (log storage).

## Fixed Import Errors

The following issues have been resolved:

1. ✅ Fixed incorrect import path in `src/server.ts` (changed `./db/client` to `../db/client`)
2. ✅ Fixed incorrect import paths in `src/routes/orderRoutes.ts` (updated model imports)
3. ✅ Updated `wrangler.toml` main entry point from `src/index.ts` to `src/server.ts`
4. ✅ Updated `tsconfig.json` to use ES modules (required for Cloudflare Workers)
5. ✅ Replaced Winston logger with Cloudflare Workers-compatible custom logger
6. ✅ Removed Winston dependency from `package.json`
7. ✅ Added proper TypeScript types for Cloudflare Workers (`@cloudflare/workers-types`)

## Features

- RESTful API using [Hono](https://hono.dev/) framework
- Cloudflare D1 database for data persistence
- R2 bucket for application logs
- Product and Order management
- Automatic log buffering and flushing to R2

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create D1 Database

```bash
npm run db:create
```

Copy the database ID from the output and update `wrangler.toml`:

```toml
[[ d1_databases ]]
binding = "DB"
database_name = "order_management_db"
database_id = "your-database-id-here"
```

### 3. Initialize Database Schema

For local development:
```bash
npm run db:init:local
```

For production:
```bash
npm run db:init
```

### 4. Create R2 Bucket

```bash
npm run r2:create
```

## Development

Run locally with Wrangler:

```bash
npm run dev
```

The API will be available at `http://localhost:8787`

## API Endpoints

### Products

- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders

- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/user/:userId` - Get orders by user ID
- `PATCH /api/orders/:id/status` - Update order status

### Health Check

- `GET /health` - API health status

## Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Logs

Logs are automatically buffered and flushed to R2 storage. View logs:

```bash
# List all log files
npm run logs:list

# Get specific log file
npm run logs:get -- <filename>
```

## Database Queries

Execute custom queries:

```bash
# Local
npm run db:query:local -- "SELECT * FROM products"

# Production
npm run db:query -- "SELECT * FROM products"
```

## Architecture

- **Framework**: Hono (lightweight web framework)
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **Runtime**: Cloudflare Workers (edge computing platform)
- **TypeScript**: Fully typed with strict mode enabled

