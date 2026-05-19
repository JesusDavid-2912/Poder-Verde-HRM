import express from 'express';

export function createPermisosRoutes(deps) {
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
  const hasText = (value) => String(value || '').trim().length > 0;
  const today = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  router.get('/api/permisos', auth, async (req, res) => {
    const action = req.query.action || 'read';
    if (action === 'read') {
      if (req.user.role !== 1) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      const [rows] = await db.query(
        `SELECT p.*, e.nombre, e.apellido, e.email FROM permisos p JOIN empleados e ON p.id_empleado = e.id_empleado ORDER BY p.fecha_solicitud DESC`,
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
        `SELECT * FROM permisos WHERE id_empleado = ? ORDER BY fecha_inicio DESC`,
        [id],
      );
      return res.json({ success: true, data: rows });
    }
    if (action === 'pendientes') {
      if (req.user.role !== 1) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      const [rows] = await db.query(
        `SELECT p.*, e.nombre, e.apellido FROM permisos p JOIN empleados e ON p.id_empleado = e.id_empleado WHERE p.estado = 'pendiente' ORDER BY p.fecha_solicitud DESC`,
      );
      return res.json({ success: true, data: rows });
    }
    if (action === 'by_id') {
      const [rows] = await db.query(
        `SELECT p.*, e.nombre, e.apellido FROM permisos p JOIN empleados e ON p.id_empleado = e.id_empleado WHERE p.id_permiso = ?`,
        [req.query.id_permiso],
      );
      const row = rows[0];
      if (row && req.user.role !== 1 && row.id_empleado !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      return res.json({ success: true, data: row || null });
    }
    if (action === 'estadisticas') {
      if (req.user.role !== 1) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      const [rows] = await db.query(
        `SELECT COUNT(*) total,
         SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) pendientes,
         SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) aprobados,
         SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END) rechazados FROM permisos`,
      );
      return res.json({ success: true, data: rows[0] });
    }
    return res.status(400).json({ success: false, message: 'Acción inválida' });
  });

  router.post('/api/permisos', auth, async (req, res) => {
    const d = req.body;
    if (req.query.action === 'create') {
      if (
        !hasText(d.tipo) ||
        !d.fecha_inicio ||
        !d.fecha_fin ||
        !hasText(d.motivo)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Tipo, fechas y motivo son requeridos',
        });
      }
      if (d.fecha_inicio < today() || d.fecha_fin < today()) {
        return res.status(400).json({
          success: false,
          message: 'No puedes solicitar permisos en fechas anteriores',
        });
      }
      if (d.fecha_fin < d.fecha_inicio) {
        return res.status(400).json({
          success: false,
          message: 'La fecha fin no puede ser anterior a la fecha inicio',
        });
      }
      const idEmp =
        req.user.role === 1 && d.id_empleado ? d.id_empleado : req.user.id;
      await db.query(
        `INSERT INTO permisos (id_empleado, tipo, fecha_inicio, fecha_fin, motivo, estado, fecha_solicitud) VALUES (?,?,?,?,?,'pendiente',NOW())`,
        [idEmp, d.tipo, d.fecha_inicio, d.fecha_fin, d.motivo],
      );
      return res.json({ success: true });
    }
    if (req.query.action === 'update_estado') {
      if (req.user.role !== 1) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      await db.query(`UPDATE permisos SET estado=? WHERE id_permiso=?`, [
        d.estado,
        d.id_permiso,
      ]);
      return res.json({ success: true });
    }
    if (req.query.action === 'delete') {
      if (req.user.role !== 1) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      await db.query(`DELETE FROM permisos WHERE id_permiso=?`, [d.id_permiso]);
      return res.json({ success: true });
    }
    return res.status(400).json({ success: false, message: 'Acción inválida' });
  });


  return router;
}
