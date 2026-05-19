import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'poder-verde-dev-secret';

export function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token)
    return res.status(401).json({ success: false, message: 'No autorizado' });
  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 1) {
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  }
  return next();
}
