import express from 'express';

export function createTareasRoutes(deps) {
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

  router.get('/api/tareas', auth, async (req, res) => {
    const action = req.query.action || 'read';
    if (action === 'read') {
      const [rows] = await db.query(
        `SELECT t.*, e.nombre, e.apellido FROM tareas t LEFT JOIN empleados e ON t.id_empleado_asignado = e.id_empleado ORDER BY t.fecha_limite ASC`,
      );
      const data =
        req.user.role !== 1
          ? rows.filter((t) => t.id_empleado_asignado === req.user.id)
          : rows;
      return res.json({ success: true, data });
    }
    if (action === 'por_estado') {
      let [rows] = await db.query(`SELECT * FROM tareas`);
      if (req.user.role !== 1)
        rows = rows.filter((t) => t.id_empleado_asignado === req.user.id);
      return res.json({
        success: true,
        data: {
          pendiente: rows.filter((r) => r.estado === 'pendiente'),
          en_progreso: rows.filter((r) => r.estado === 'en_progreso'),
          finalizada: rows.filter((r) => r.estado === 'finalizada'),
        },
      });
    }
    if (action === 'empleado') {
      const id = Number(req.query.id_empleado || req.user.id);
      if (req.user.role !== 1 && id !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      const [rows] = await db.query(
        `SELECT * FROM tareas WHERE id_empleado_asignado = ? ORDER BY fecha_limite ASC`,
        [id],
      );
      return res.json({ success: true, data: rows });
    }
    if (action === 'estadisticas') {
      if (req.user.role !== 1) {
        const [rows] = await db.query(
          `SELECT COUNT(*) total,
            SUM(CASE WHEN estado='pendiente' THEN 1 ELSE 0 END) pendientes,
            SUM(CASE WHEN estado='en_progreso' THEN 1 ELSE 0 END) en_progreso,
            SUM(CASE WHEN estado='finalizada' THEN 1 ELSE 0 END) finalizadas,
            AVG(progreso) progreso_promedio
           FROM tareas WHERE id_empleado_asignado = ?`,
          [req.user.id],
        );
        return res.json({ success: true, data: rows[0] });
      }
      const [rows] = await db.query(
        `SELECT COUNT(*) total,
          SUM(CASE WHEN estado='pendiente' THEN 1 ELSE 0 END) pendientes,
          SUM(CASE WHEN estado='en_progreso' THEN 1 ELSE 0 END) en_progreso,
          SUM(CASE WHEN estado='finalizada' THEN 1 ELSE 0 END) finalizadas,
          AVG(progreso) progreso_promedio FROM tareas`,
      );
      return res.json({ success: true, data: rows[0] });
    }
    return res.status(400).json({ success: false, message: 'Acción inválida' });
  });

  router.post('/api/tareas', auth, async (req, res) => {
    const action = req.query.action;
    const d = req.body;
    if (
      req.user.role !== 1 &&
      ['create', 'delete', 'update', 'update_estado'].includes(action)
    ) {
      if (action === 'update' || action === 'update_estado') {
        const [t] = await db.query(
          `SELECT id_empleado_asignado FROM tareas WHERE id_tarea=?`,
          [d.id_tarea],
        );
        if (!t[0] || t[0].id_empleado_asignado !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Solo puedes actualizar tus tareas',
          });
        }
      } else {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
    }
    if (action === 'create') {
      if (
        !hasText(d.titulo) ||
        !hasText(d.descripcion) ||
        !d.id_empleado_asignado ||
        !d.fecha_limite
      ) {
        return res.status(400).json({
          success: false,
          message: 'Título, descripción, empleado asignado y fecha límite son requeridos',
        });
      }
      if (d.fecha_limite < today()) {
        return res.status(400).json({
          success: false,
          message: 'No puedes crear tareas con fecha límite anterior a hoy',
        });
      }
      await db.query(
        `INSERT INTO tareas (titulo, descripcion, id_empleado_asignado, fecha_creacion, fecha_limite, estado, prioridad, categoria, progreso)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          d.titulo,
          d.descripcion,
          d.id_empleado_asignado || null,
          d.fecha_creacion || today(),
          d.fecha_limite || null,
          d.estado || 'pendiente',
          d.prioridad || 'normal',
          d.categoria || '',
          Number(d.progreso || 0),
        ],
      );
      return res.json({ success: true });
    }
    if (action === 'update' || action === 'update_estado') {
      await db.query(
        `UPDATE tareas SET estado=?, progreso=?, titulo=COALESCE(?, titulo), descripcion=COALESCE(?, descripcion),
         id_empleado_asignado=COALESCE(?, id_empleado_asignado), fecha_limite=COALESCE(?, fecha_limite), prioridad=COALESCE(?, prioridad), categoria=COALESCE(?, categoria)
         WHERE id_tarea=?`,
        [
          d.estado,
          Number(d.progreso || 0),
          d.titulo ?? null,
          d.descripcion ?? null,
          d.id_empleado_asignado ?? null,
          d.fecha_limite ?? null,
          d.prioridad ?? null,
          d.categoria ?? null,
          d.id_tarea,
        ],
      );
      return res.json({ success: true });
    }
    if (action === 'delete') {
      await db.query(`DELETE FROM tareas WHERE id_tarea=?`, [d.id_tarea]);
      return res.json({ success: true });
    }
    return res.status(400).json({ success: false, message: 'Acción inválida' });
  });


  return router;
}
