import express from 'express';

export function createPerfilRoutes(deps) {
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

  router.get('/api/me', auth, async (req, res) => {
    const [rows] = await db.query(
      `SELECT id_empleado, nombre, apellido, email, telefono, direccion, fecha_nacimiento, puesto, departamento, salario, fecha_ingreso, estado, id_rol
       FROM empleados WHERE id_empleado = ?`,
      [req.user.id],
    );
    res.json({ success: true, data: rows[0] || null });
  });

  router.put('/api/me', auth, async (req, res) => {
    const d = req.body;
    if (!hasText(d.nombre) || !hasText(d.apellido)) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y apellido son requeridos',
      });
    }
    await db.query(
      `UPDATE empleados SET nombre=?, apellido=?, telefono=?, direccion=?
       WHERE id_empleado=?`,
      [d.nombre, d.apellido, d.telefono, d.direccion, req.user.id],
    );
    res.json({ success: true });
  });

  router.post('/api/me/password', auth, async (req, res) => {
    const { current, next: nextPwd } = req.body;
    const [rows] = await db.query(
      `SELECT password FROM empleados WHERE id_empleado=?`,
      [req.user.id],
    );
    const row = rows[0];
    if (!row || !(await bcrypt.compare(current || '', row.password))) {
      return res
        .status(400)
        .json({ success: false, message: 'Contraseña actual incorrecta' });
    }
    if (!nextPwd) {
      return res
        .status(400)
        .json({ success: false, message: 'Nueva contraseña requerida' });
    }
    const hash = await bcrypt.hash(nextPwd, 10);
    await db.query(`UPDATE empleados SET password=? WHERE id_empleado=?`, [
      hash,
      req.user.id,
    ]);
    res.json({ success: true });
  });


  return router;
}
