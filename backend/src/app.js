import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { handlePdfReport, handleStoredReportPdf } from './services/pdfReportService.js';
import { db } from './config/db.js';
import { auth, requireAdmin } from './middleware/auth.js';
import * as reporteSvc from './services/reporteService.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import { createPerfilRoutes } from './routes/perfil.routes.js';
import { createEmpleadosRoutes } from './routes/empleados.routes.js';
import { createTareasRoutes } from './routes/tareas.routes.js';
import { createAsistenciasRoutes } from './routes/asistencias.routes.js';
import { createPermisosRoutes } from './routes/permisos.routes.js';
import { createNominaRoutes } from './routes/nomina.routes.js';
import { createDocumentosRoutes } from './routes/documentos.routes.js';
import { createReportesRoutes } from './routes/reportes.routes.js';

const jwtSecret = process.env.JWT_SECRET || 'poder-verde-dev-secret';

export function createApp() {
  const app = express();
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const upload = multer({
    dest: uploadsDir,
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  const allowedMime = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
  ]);

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(uploadsDir));

  app.get('/health', async (_req, res) => {
    const [rows] = await db.query('SELECT 1 AS ok');
    res.json({ success: true, db: rows[0]?.ok === 1 });
  });

  const routeDeps = {
    db,
    auth,
    requireAdmin,
    upload,
    allowedMime,
    uploadsDir,
    jwtSecret,
    bcrypt,
    jwt,
    fs,
    path,
    reporteSvc,
    handlePdfReport,
    handleStoredReportPdf,
  };

  app.use(createAuthRoutes(routeDeps));
  app.use(createPerfilRoutes(routeDeps));
  app.use(createEmpleadosRoutes(routeDeps));
  app.use(createTareasRoutes(routeDeps));
  app.use(createAsistenciasRoutes(routeDeps));
  app.use(createPermisosRoutes(routeDeps));
  app.use(createNominaRoutes(routeDeps));
  app.use(createDocumentosRoutes(routeDeps));
  app.use(createReportesRoutes(routeDeps));

  app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'El archivo no debe superar 10 MB'
          : 'No se pudo procesar el archivo';
      return res.status(400).json({ success: false, message });
    }
    console.error('[SERVER ERROR]', err);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  });

  return app;
}
