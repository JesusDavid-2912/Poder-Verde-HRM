import express from 'express';

export function createEmpleadosRoutes(deps) {
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

  const validateEmpleado = (d, includePassword = false) => {
    if (
      !hasText(d.nombre) ||
      !hasText(d.apellido) ||
      !hasText(d.email) ||
      !hasText(d.puesto) ||
      !hasText(d.departamento) ||
      Number(d.salario) <= 0 ||
      (includePassword && !hasText(d.password))
    ) {
      return includePassword
        ? 'Nombre, apellido, email, puesto, departamento, salario y contraseña son requeridos'
        : 'Nombre, apellido, email, puesto, departamento y salario son requeridos';
    }
    return null;
  };

  router.get('/api/empleados', auth, async (req, res) => {
    if (req.user.role !== 1) {
      const [rows] = await db.query(
        `SELECT * FROM empleados WHERE id_empleado=?`,
        [req.user.id],
      );
      return res.json({ success: true, data: rows });
    }
    const [rows] = await db.query(
      `SELECT id_empleado, nombre, apellido, email, telefono, direccion, fecha_nacimiento, puesto, departamento, salario, fecha_ingreso, estado, id_rol FROM empleados ORDER BY id_empleado DESC`,
    );
    res.json({ success: true, data: rows });
  });

  router.post('/api/empleados', auth, requireAdmin, async (req, res) => {
    const action = req.query.action;
    const d = req.body;
    if (action === 'create') {
      const validationError = validateEmpleado(d, true);
      if (validationError) {
        return res
          .status(400)
          .json({ success: false, message: validationError });
      }
      const hash = await bcrypt.hash(d.password, 10);
      const idRol = Number(d.id_rol || 2);
      await db.query(
        `INSERT INTO empleados (nombre, apellido, email, telefono, direccion, fecha_nacimiento, puesto, departamento, salario, fecha_ingreso, estado, id_rol, password)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          d.nombre,
          d.apellido,
          d.email,
          d.telefono,
          d.direccion,
          d.fecha_nacimiento || null,
          d.puesto,
          d.departamento || 'General',
          Number(d.salario || 0),
          d.fecha_ingreso,
          d.estado || 'activo',
          idRol,
          hash,
        ],
      );
      return res.json({ success: true });
    }
    if (action === 'update') {
      const validationError = validateEmpleado(d);
      if (validationError) {
        return res
          .status(400)
          .json({ success: false, message: validationError });
      }
      await db.query(
        `UPDATE empleados SET nombre=?, apellido=?, email=?, telefono=?, direccion=?, fecha_nacimiento=?, puesto=?, departamento=?, salario=?, fecha_ingreso=?, estado=?, id_rol=?
         WHERE id_empleado=?`,
        [
          d.nombre,
          d.apellido,
          d.email,
          d.telefono,
          d.direccion,
          d.fecha_nacimiento,
          d.puesto,
          d.departamento,
          d.salario,
          d.fecha_ingreso,
          d.estado,
          d.id_rol,
          d.id_empleado,
        ],
      );
      return res.json({ success: true });
    }
    if (action === 'reset_password') {
      if (!d.id_empleado || !hasText(d.password)) {
        return res.status(400).json({
          success: false,
          message: 'Empleado y nueva contraseña son requeridos',
        });
      }
      const hash = await bcrypt.hash(d.password, 10);
      await db.query(`UPDATE empleados SET password=? WHERE id_empleado=?`, [
        hash,
        d.id_empleado,
      ]);
      return res.json({ success: true });
    }
    if (action === 'delete') {
      await db.query(`DELETE FROM empleados WHERE id_empleado=?`, [
        d.id_empleado,
      ]);
      return res.json({ success: true });
    }
    return res.status(400).json({ success: false, message: 'Acción inválida' });
  });


  return router;
}
