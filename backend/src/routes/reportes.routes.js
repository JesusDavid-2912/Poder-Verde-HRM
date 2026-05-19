import express from 'express';

export function createReportesRoutes(deps) {
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
    handleStoredReportPdf,
  } = deps;
  const currentPeriod = () =>
    new Date().toLocaleString('es-MX', { month: 'long', year: 'numeric' });
  const today = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  router.get('/api/reportes', auth, async (req, res) => {
    const action = req.query.action || 'read';
    if (action === 'read') {
      const [rows] = await db.query(
        `SELECT r.*, CONCAT(e.nombre,' ',e.apellido) AS generado_por_nombre FROM reportes r LEFT JOIN empleados e ON r.generado_por = e.id_empleado ORDER BY r.fecha_generacion DESC`,
      );
      for (const r of rows) {
        if (r.datos) {
          try {
            r.datos = JSON.parse(r.datos);
          } catch {
            /* ignore */
          }
        }
      }
      return res.json({ success: true, data: rows });
    }
    if (action === 'by_id') {
      const [rows] = await db.query(
        `SELECT * FROM reportes WHERE id_reporte = ?`,
        [req.query.id_reporte],
      );
      const row = rows[0];
      if (row?.datos) {
        try {
          row.datos = JSON.parse(row.datos);
        } catch {
          /* ignore */
        }
      }
      return res.json({ success: true, data: row || null });
    }
    if (action === 'exportar') {
      const [rows] = await db.query(
        `SELECT * FROM reportes WHERE id_reporte = ?`,
        [req.query.id_reporte],
      );
      const reporte = rows[0];
      if (!reporte)
        return res
          .status(404)
          .json({ success: false, message: 'No encontrado' });
      if (reporte.datos) {
        try {
          reporte.datos = JSON.parse(reporte.datos);
        } catch {
          /* ignore */
        }
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="reporte_${reporte.tipo}_${today()}.json"`,
      );
      return res.send(JSON.stringify(reporte, null, 2));
    }
    if (action === 'exportar_pdf') {
      const [rows] = await db.query(
        `SELECT r.*, CONCAT(e.nombre,' ',e.apellido) AS generado_por_nombre
         FROM reportes r LEFT JOIN empleados e ON r.generado_por = e.id_empleado
         WHERE r.id_reporte = ?`,
        [req.query.id_reporte],
      );
      const reporte = rows[0];
      if (!reporte)
        return res
          .status(404)
          .json({ success: false, message: 'No encontrado' });
      return handleStoredReportPdf(reporte, res);
    }
    return res.status(400).json({ success: false, message: 'Acción inválida' });
  });

  router.post('/api/reportes', auth, requireAdmin, async (req, res) => {
    if (req.query.action !== 'generar') {
      return res
        .status(400)
        .json({ success: false, message: 'Acción inválida' });
    }
    const { tipo, fecha_inicio, fecha_fin, periodo } = req.body;
    let out;
    const uid = req.user.id;
    switch (tipo) {
      case 'productividad':
        out = await reporteSvc.generarProductividad(
          fecha_inicio,
          fecha_fin,
          uid,
        );
        break;
      case 'asistencia':
        out = await reporteSvc.generarAsistencia(fecha_inicio, fecha_fin, uid);
        break;
      case 'nomina':
        out = await reporteSvc.generarNomina(periodo || currentPeriod(), uid);
        break;
      case 'general':
        out = await reporteSvc.generarGeneral(uid);
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: 'Tipo de reporte no válido' });
    }
    return res.json(out);
  });

  router.get('/api/reportes/pdf', auth, requireAdmin, async (_req, res) => {
    return handlePdfReport(db, res);
  });


  return router;
}
