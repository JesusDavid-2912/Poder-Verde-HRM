import express from 'express';

export function createAsistenciasRoutes(deps) {
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
  const today = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  router.get('/api/asistencias', auth, async (req, res) => {
    const action = req.query.action;
    if (action === 'general') {
      if (req.user.role !== 1) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      const [rows] = await db.query(
        `SELECT a.*, e.nombre, e.apellido, e.email FROM asistencias a
         JOIN empleados e ON a.id_empleado = e.id_empleado WHERE a.fecha = ? ORDER BY e.nombre`,
        [req.query.fecha || today()],
      );
      return res.json({ success: true, data: rows });
    }
    if (action === 'fecha') {
      const [rows] = await db.query(
        `SELECT * FROM asistencias WHERE id_empleado=? AND fecha=? LIMIT 1`,
        [req.query.id_empleado || req.user.id, req.query.fecha],
      );
      return res.json({ success: true, data: rows[0] || null });
    }
    if (action === 'rango') {
      const id = Number(req.query.id_empleado || req.user.id);
      if (req.user.role !== 1 && id !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      const [rows] = await db.query(
        `SELECT * FROM asistencias WHERE id_empleado = ? AND fecha BETWEEN ? AND ? ORDER BY fecha DESC`,
        [id, req.query.fecha_inicio, req.query.fecha_fin],
      );
      return res.json({ success: true, data: rows });
    }
    if (action === 'mes') {
      const id = Number(req.query.id_empleado || req.user.id);
      if (req.user.role !== 1 && id !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      const [rows] = await db.query(
        `SELECT * FROM asistencias WHERE id_empleado=? AND MONTH(fecha)=? AND YEAR(fecha)=? ORDER BY fecha DESC`,
        [id, req.query.mes, req.query.anio],
      );
      return res.json({ success: true, data: rows });
    }
    if (action === 'estadisticas') {
      const id = Number(req.query.id_empleado || req.user.id);
      if (req.user.role !== 1 && id !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      const [rows] = await db.query(
        `SELECT COUNT(*) total_dias,
                SUM(CASE WHEN estado = 'puntual' THEN 1 ELSE 0 END) dias_puntual,
                SUM(CASE WHEN estado = 'retardo' THEN 1 ELSE 0 END) dias_retardo,
                SUM(CASE WHEN estado = 'falta' THEN 1 ELSE 0 END) dias_falta,
                ROUND(SUM(CASE WHEN estado = 'puntual' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0) * 100, 2) porcentaje_puntualidad
         FROM asistencias WHERE id_empleado = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?`,
        [id, req.query.mes, req.query.anio],
      );
      return res.json({ success: true, data: rows[0] });
    }
    return res.status(400).json({ success: false, message: 'Acción inválida' });
  });

  router.post('/api/asistencias', auth, async (req, res) => {
    if (req.query.action !== 'registrar')
      return res
        .status(400)
        .json({ success: false, message: 'Acción inválida' });
    const d = req.body;
    let idEmp = Number(d.id_empleado);
    if (req.user.role !== 1) {
      idEmp = req.user.id;
    } else if (!idEmp) {
      return res
        .status(400)
        .json({ success: false, message: 'id_empleado requerido' });
    }
    if (!d.fecha || !d.hora_entrada) {
      return res.status(400).json({
        success: false,
        message: 'Fecha y hora de entrada son requeridas',
      });
    }
    if (d.fecha < today()) {
      return res.status(400).json({
        success: false,
        message: 'No puedes registrar asistencias en fechas anteriores',
      });
    }
    const h = d.hora_entrada || '08:00:00';
    const estadoAuto =
      h <= '08:00:00' ? 'puntual' : h <= '09:00:00' ? 'retardo' : 'falta';
    const estado = d.estado || estadoAuto;
    await db.query(
      `INSERT INTO asistencias (id_empleado, fecha, hora_entrada, hora_salida, estado) VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE hora_entrada=VALUES(hora_entrada), hora_salida=VALUES(hora_salida), estado=VALUES(estado)`,
      [
        idEmp,
        d.fecha || today(),
        h,
        d.hora_salida || null,
        estado,
      ],
    );
    return res.json({ success: true });
  });

  router.post('/api/asistencias/delete', auth, requireAdmin, async (req, res) => {
    await db.query(`DELETE FROM asistencias WHERE id_asistencia=?`, [
      req.body.id_asistencia,
    ]);
    res.json({ success: true });
  });


  return router;
}
