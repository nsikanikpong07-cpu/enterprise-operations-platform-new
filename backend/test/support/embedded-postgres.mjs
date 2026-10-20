// Optional integration-test adapter. It runs generated TypeORM PostgreSQL SQL
// against PGlite in memory. It never reads .env or contacts your database.
import { EventEmitter } from "node:events";
import { PGlite } from "@electric-sql/pglite";
import { DataSource } from "typeorm";
export async function embeddedDataSource(schema, entities) {
  const db = new PGlite();
  const normalized = schema
    .replace(/^\\.*$/gm, "")
    .replace(/^.* OWNER TO .*;\s*$/gm, "")
    .replace(/^CREATE EXTENSION .*;\s*$/gm, "")
    .replace(/^COMMENT ON EXTENSION .*;\s*$/gm, "")
    .replace(/^GRANT .*;\s*$/gm, "")
    .replace(/^SET transaction_timeout.*;\s*$/gm, "");
  await db.exec(normalized);
  // SQL defaults and constraints from the supplied export remain intact.
  class Client extends EventEmitter {
    query(sql, parameters, callback) {
      if (typeof parameters === "function") {
        callback = parameters;
        parameters = [];
      }
      const work = db
        .query(sql, parameters ?? [])
        .then((result) => ({
          ...result,
          rowCount: result.affectedRows ?? result.rows.length,
          command: sql.trim().split(/\s+/)[0].toUpperCase(),
        }));
      if (callback) {
        work.then(
          (r) => callback(null, r),
          (e) => callback(e),
        );
        return;
      }
      return work;
    }
  }
  class Pool extends EventEmitter {
    connect(cb) {
      cb(null, new Client(), () => {});
    }
    end(cb) {
      cb();
    }
  }
  const source = new DataSource({
    type: "postgres",
    driver: { Pool },
    entities,
    installExtensions: false,
    uuidExtension: "pgcrypto",
    synchronize: false,
    logging: false,
  });
  await source.initialize();
  return {
    source,
    db,
    close: async () => {
      await source.destroy();
      await db.close();
    },
  };
}
