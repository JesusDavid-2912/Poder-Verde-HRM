import express from 'express';

export function createAuthRoutes(deps) {
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

  router.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
      const [rows] = await db.query(
        "SELECT id_empleado, nombre, apellido, email, telefono, direccion, puesto, departamento, salario, id_rol, password FROM empleados WHERE email = ? AND estado = 'activo' LIMIT 1",
        [email],
      );

      const user = rows[0];

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: 'Credenciales inválidas' });
      }

      // Ajuste de prefijo para compatibilidad con bcrypt de Node.js
      const normalizedHash = user.password.replace('$2y$', '$2b$');
      const isMatch = await bcrypt.compare(password, normalizedHash);

      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        {
          id: user.id_empleado,
          role: user.id_rol,
          name: `${user.nombre} ${user.apellido}`,
        },
        jwtSecret,
        { expiresIn: '8h' },
      );

      // Eliminamos el password del objeto antes de enviarlo al cliente
      delete user.password;

      res.json({
        success: true,
        token,
        user,
      });
    } catch (error) {
      console.error('[LOGIN][ERROR]', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  });

  router.post('/api/logout', (_req, res) => res.json({ success: true }));


  return router;
}
