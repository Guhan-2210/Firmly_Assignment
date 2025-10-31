import { logger } from "../src/logger";

export class DatabaseClient {
  constructor(private db: D1Database) {}

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      logger.debug("db_query", { sql, params });
      const result = await this.db.prepare(sql).bind(...params).all();
      return result.results as T[];
    } catch (error: any) {
      logger.error("db_query_error", { sql, params, error: error.message });
      throw error;
    }
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    try {
      logger.debug("db_query_one", { sql, params });
      const result = await this.db.prepare(sql).bind(...params).first();
      return result as T | null;
    } catch (error: any) {
      logger.error("db_query_one_error", { sql, params, error: error.message });
      throw error;
    }
  }

  async execute(sql: string, params: any[] = []): Promise<D1Result> {
    try {
      logger.debug("db_execute", { sql, params });
      const result = await this.db.prepare(sql).bind(...params).run();
      return result;
    } catch (error: any) {
      logger.error("db_execute_error", { sql, params, error: error.message });
      throw error;
    }
  }

  async batch(statements: { sql: string; params: any[] }[]): Promise<D1Result[]> {
    try {
      logger.debug("db_batch", { count: statements.length });
      const preparedStatements = statements.map(stmt => 
        this.db.prepare(stmt.sql).bind(...stmt.params)
      );
      const results = await this.db.batch(preparedStatements);
      return results;
    } catch (error: any) {
      logger.error("db_batch_error", { error: error.message });
      throw error;
    }
  }

  getD1Database(): D1Database {
    return this.db;
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}