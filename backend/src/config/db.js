import { createPool } from 'mysql2/promise';

const RETRY_MS = 3000;

export const db = createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'poder_verde_hrm',
  waitForConnections: true,
  connectionLimit: 10,
});

/**
 * Reintenta hasta que MySQL acepte conexiones. Registra fallos y no finaliza el proceso.
 */
export async function waitForDatabase() {
  for (;;) {
    try {
      await db.query('SELECT 1');
      console.log('[DB] Conexión a MySQL lista');
      return;
    } catch (err) {
      console.error(
        `[DB] No disponible, reintento en ${RETRY_MS / 1000}s:`,
        err?.message || err,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
  }
}
