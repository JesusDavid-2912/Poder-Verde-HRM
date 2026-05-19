import express from 'express';

export function createDocumentosRoutes(deps) {
  const router = express.Router();
  const {
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
  } = deps;

  router.get('/api/documentos', auth, async (req, res) => {
    const action = req.query.action || 'read';
    if (action === 'read') {
      if (req.user.role === 1) {
        const [rows] = await db.query(
          `SELECT d.*, e.nombre, e.apellido FROM documentos d LEFT JOIN empleados e ON d.id_empleado = e.id_empleado ORDER BY d.fecha_subida DESC`,
        );
        return res.json({ success: true, data: rows });
      }
      const [rows] = await db.query(
        `SELECT * FROM documentos WHERE id_empleado = ? ORDER BY fecha_subida DESC`,
        [req.user.id],
      );
      return res.json({ success: true, data: rows });
    }
    if (action === 'empleado') {
      const id = Number(req.query.id_empleado || req.user.id);
      if (req.user.role !== 1 && id !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      const [rows] = await db.query(
        `SELECT * FROM documentos WHERE id_empleado = ? ORDER BY fecha_subida DESC`,
        [id],
      );
      return res.json({ success: true, data: rows });
    }
    if (action === 'by_id') {
      const [rows] = await db.query(
        `SELECT * FROM documentos WHERE id_documento = ?`,
        [req.query.id_documento],
      );
      const row = rows[0];
      if (row && req.user.role !== 1 && row.id_empleado !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      return res.json({ success: true, data: row || null });
    }
    if (action === 'descargar') {
      const [rows] = await db.query(
        `SELECT * FROM documentos WHERE id_documento = ?`,
        [req.query.id_documento],
      );
      const doc = rows[0];
      if (!doc)
        return res
          .status(404)
          .json({ success: false, message: 'No encontrado' });
      if (req.user.role !== 1 && doc.id_empleado !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      const rel = doc.ruta_archivo.replace(/^.*\/uploads\//, '');
      const filePath = path.join(uploadsDir, rel);
      if (!fs.existsSync(filePath))
        return res
          .status(404)
          .json({ success: false, message: 'Archivo no encontrado' });
      res.setHeader(
        'Content-Type',
        doc.tipo_archivo || 'application/octet-stream',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${doc.nombre_archivo}"`,
      );
      return fs.createReadStream(filePath).pipe(res);
    }
    return res.status(400).json({ success: false, message: 'Acción inválida' });
  });

  router.post('/api/documentos/delete', auth, async (req, res) => {
    const [rows] = await db.query(
      `SELECT ruta_archivo, id_empleado FROM documentos WHERE id_documento=?`,
      [req.body.id_documento],
    );
    const doc = rows[0];
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: 'Documento no encontrado' });
    }
    if (req.user.role !== 1 && doc.id_empleado !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: 'Acceso denegado' });
    }
    if (doc.ruta_archivo) {
      const rel = doc.ruta_archivo.replace(/^.*\/uploads\//, '');
      const filePath = path.join(uploadsDir, rel);
      if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
    }
    await db.query(`DELETE FROM documentos WHERE id_documento=?`, [
      req.body.id_documento,
    ]);
    return res.json({ success: true });
  });

  router.post(
    '/api/documentos',
    auth,
    upload.single('archivo'),
    async (req, res) => {
      try {
        if (req.query.action !== 'subir') {
          return res
            .status(400)
            .json({ success: false, message: 'Acción inválida' });
        }
        if (!req.file)
          return res
            .status(400)
            .json({ success: false, message: 'Archivo requerido' });
        const idEmp =
          req.user.role === 1 && req.body.id_empleado
            ? Number(req.body.id_empleado)
            : req.user.id;
        const fullPath = req.file.path;
        const mime = req.file.mimetype;
        const extension = path.extname(req.file.originalname || '').toLowerCase();
        const allowedExtensions = new Set([
          '.pdf',
          '.doc',
          '.docx',
          '.xls',
          '.xlsx',
          '.jpg',
          '.jpeg',
          '.png',
          '.gif',
        ]);
        if (!allowedMime.has(mime) && !allowedExtensions.has(extension)) {
          await fs.promises.unlink(fullPath);
          return res
            .status(400)
            .json({ success: false, message: 'Tipo de archivo no permitido' });
        }
        const rel = `/uploads/${req.file.filename}`;
        await db.query(
          `INSERT INTO documentos (id_empleado, nombre_archivo, tipo_archivo, ruta_archivo, tamano_bytes, fecha_subida) VALUES (?,?,?,?,?,NOW())`,
          [idEmp, req.file.originalname, mime || 'application/octet-stream', rel, req.file.size],
        );
        return res.json({ success: true, id: req.file.filename });
      } catch (error) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          await fs.promises.unlink(req.file.path).catch(() => {});
        }
        console.error('[DOCUMENTOS UPLOAD ERROR]', error);
        return res
          .status(500)
          .json({ success: false, message: 'No se pudo subir el archivo' });
      }
    },
  );


  return router;
}
