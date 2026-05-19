import express from 'express';

export function createNominaRoutes(deps) {
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

  router.get('/api/nomina', auth, async (req, res) => {
    const action = req.query.action || 'read';
    if (action === 'read') {
      if (req.user.role === 1) {
        const [rows] = await db.query(
          `SELECT n.*, e.nombre, e.apellido, e.puesto, e.departamento FROM nomina n JOIN empleados e ON n.id_empleado = e.id_empleado ORDER BY n.periodo DESC`,
        );
        return res.json({ success: true, data: rows });
      }
      const [rows] = await db.query(
        `SELECT n.*, e.nombre, e.apellido FROM nomina n JOIN empleados e ON n.id_empleado = e.id_empleado WHERE n.id_empleado = ? ORDER BY n.periodo DESC`,
        [req.user.id],
      );
      return res.json({ success: true, data: rows });
    }
    if (action === 'periodo') {
      const [rows] = await db.query(
        `SELECT n.*, e.nombre, e.apellido, e.puesto, e.departamento FROM nomina n JOIN empleados e ON n.id_empleado = e.id_empleado WHERE n.periodo = ? ORDER BY e.nombre`,
        [req.query.periodo],
      );
      const data =
        req.user.role === 1
          ? rows
          : rows.filter((n) => n.id_empleado === req.user.id);
      return res.json({ success: true, data });
    }
    if (action === 'empleado') {
      const id = Number(req.query.id_empleado || req.user.id);
      if (req.user.role !== 1 && id !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      const [rows] = await db.query(
        `SELECT * FROM nomina WHERE id_empleado = ? AND periodo = ?`,
        [id, req.query.periodo],
      );
      return res.json({ success: true, data: rows[0] || null });
    }
    if (action === 'estadisticas') {
      if (req.user.role !== 1) {
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      }
      const periodo = req.query.periodo;
      const where = periodo ? 'WHERE periodo = ?' : '';
      const [rows] = await db.query(
        `SELECT COUNT(DISTINCT id_empleado) empleados, SUM(salario_base) total_base, SUM(bonificaciones) total_bonos,
         SUM(deducciones) total_deducciones, SUM(neto) total_neto, ROUND(AVG(neto),2) promedio_neto FROM nomina ${where}`,
        periodo ? [periodo] : [],
      );
      return res.json({ success: true, data: rows[0] });
    }
    return res.status(400).json({ success: false, message: 'Acción inválida' });
  });

  router.post('/api/nomina', auth, async (req, res) => {
    const action = req.query.action;
    const d = req.body;
    if (action === 'create') {
      if (req.user.role !== 1)
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      if (!d.id_empleado || !String(d.periodo || '').trim() || Number(d.salario_base) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Empleado, periodo y salario base son requeridos',
        });
      }
      const neto =
        Number(d.salario_base) +
        Number(d.bonificaciones || 0) -
        Number(d.deducciones || 0);
      await db.query(
        `INSERT INTO nomina (id_empleado, periodo, salario_base, bonificaciones, deducciones, neto, estado, fecha_proceso)
         VALUES (?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE salario_base=VALUES(salario_base), bonificaciones=VALUES(bonificaciones), deducciones=VALUES(deducciones), neto=VALUES(neto)`,
        [
          d.id_empleado,
          d.periodo,
          d.salario_base,
          d.bonificaciones || 0,
          d.deducciones || 0,
          neto,
          d.estado || 'pendiente',
          d.fecha_proceso || today(),
        ],
      );
      return res.json({ success: true });
    }
    if (action === 'procesar') {
      if (req.user.role !== 1)
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      const periodo =
        d.periodo ||
        new Date().toLocaleString('es-MX', { month: 'long', year: 'numeric' });
      const [employees] = await db.query(
        `SELECT id_empleado, salario FROM empleados WHERE estado='activo'`,
      );
      let procesados = 0;
      for (const emp of employees) {
        const ded = Number((Number(emp.salario) * 0.1).toFixed(2));
        const neto = Number(emp.salario) - ded;
        await db.query(
          `INSERT INTO nomina (id_empleado, periodo, salario_base, bonificaciones, deducciones, neto, estado, fecha_proceso)
           VALUES (?,?,?,0,?,?,'pendiente',CURDATE())
           ON DUPLICATE KEY UPDATE salario_base=VALUES(salario_base), deducciones=VALUES(deducciones), neto=VALUES(neto)`,
          [emp.id_empleado, periodo, emp.salario, ded, neto],
        );
        procesados += 1;
      }
      return res.json({
        success: true,
        data: { procesados, total: employees.length },
      });
    }
    if (action === 'update_estado') {
      if (req.user.role !== 1)
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      await db.query(
        `UPDATE nomina SET estado=?, fecha_pago=? WHERE id_nomina=?`,
        [d.estado, d.fecha_pago || null, d.id_nomina],
      );
      return res.json({ success: true });
    }
    if (action === 'delete') {
      if (req.user.role !== 1)
        return res
          .status(403)
          .json({ success: false, message: 'Acceso denegado' });
      await db.query(`DELETE FROM nomina WHERE id_nomina=?`, [d.id_nomina]);
      return res.json({ success: true });
    }
    return res.status(400).json({ success: false, message: 'Acción inválida' });
  });


  return router;
}
