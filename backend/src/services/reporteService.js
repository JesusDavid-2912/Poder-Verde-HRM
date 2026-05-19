import { db } from '../config/db.js';

function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function guardarReporte(
  tipo,
  titulo,
  fechaInicio,
  fechaFin,
  datos,
  generadoPor,
) {
  const [r] = await db.query(
    `INSERT INTO reportes (tipo, titulo, fecha_inicio, fecha_fin, datos, generado_por, fecha_generacion)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [
      tipo,
      titulo,
      fechaInicio,
      fechaFin,
      JSON.stringify(datos),
      generadoPor || null,
    ],
  );
  return { success: true, data: datos, id: r.insertId };
}

export async function generarProductividad(fechaInicio, fechaFin, generadoPor) {
  if (!fechaInicio)
    fechaInicio = localDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  if (!fechaFin)
    fechaFin = localDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [rows] = await db.query(
    `SELECT e.id_empleado,
            CONCAT(e.nombre, ' ', e.apellido) AS empleado,
            e.puesto,
            e.departamento,
            COUNT(CASE WHEN t.estado = 'finalizada' THEN 1 END) AS tareas_completadas,
            COUNT(CASE WHEN t.estado = 'en_progreso' THEN 1 END) AS tareas_en_progreso,
            COUNT(CASE WHEN t.estado = 'pendiente' THEN 1 END) AS tareas_pendientes,
            ROUND(AVG(t.progreso), 2) AS progreso_promedio
     FROM empleados e
     LEFT JOIN tareas t ON e.id_empleado = t.id_empleado_asignado
       AND t.fecha_creacion BETWEEN ? AND ?
     WHERE e.estado = 'activo'
     GROUP BY e.id_empleado, e.nombre, e.apellido, e.puesto, e.departamento
     ORDER BY tareas_completadas DESC`,
    [fechaInicio, fechaFin],
  );
  return guardarReporte(
    'productividad',
    'Reporte de Productividad',
    fechaInicio,
    fechaFin,
    rows,
    generadoPor,
  );
}

export async function generarAsistencia(fechaInicio, fechaFin, generadoPor) {
  if (!fechaInicio)
    fechaInicio = localDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  if (!fechaFin)
    fechaFin = localDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [rows] = await db.query(
    `SELECT e.id_empleado,
            CONCAT(e.nombre, ' ', e.apellido) AS empleado,
            e.puesto,
            COUNT(*) AS total_dias,
            SUM(CASE WHEN a.estado = 'puntual' THEN 1 ELSE 0 END) AS dias_puntual,
            SUM(CASE WHEN a.estado = 'retardo' THEN 1 ELSE 0 END) AS dias_retardo,
            SUM(CASE WHEN a.estado = 'falta' THEN 1 ELSE 0 END) AS dias_falta,
            ROUND(SUM(CASE WHEN a.estado = 'puntual' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0) * 100, 2) AS porcentaje_puntualidad
     FROM empleados e
     LEFT JOIN asistencias a ON e.id_empleado = a.id_empleado AND a.fecha BETWEEN ? AND ?
     WHERE e.estado = 'activo'
     GROUP BY e.id_empleado, e.nombre, e.apellido, e.puesto
     ORDER BY porcentaje_puntualidad DESC`,
    [fechaInicio, fechaFin],
  );
  return guardarReporte(
    'asistencia',
    'Reporte de Asistencia',
    fechaInicio,
    fechaFin,
    rows,
    generadoPor,
  );
}

export async function generarNomina(periodo, generadoPor) {
  const [rows] = await db.query(
    `SELECT e.id_empleado,
            CONCAT(e.nombre, ' ', e.apellido) AS empleado,
            e.puesto,
            e.departamento,
            n.salario_base, n.bonificaciones, n.deducciones, n.neto, n.estado
     FROM empleados e
     LEFT JOIN nomina n ON e.id_empleado = n.id_empleado AND n.periodo = ?
     WHERE e.estado = 'activo'
     ORDER BY e.nombre ASC`,
    [periodo],
  );
  return guardarReporte(
    'nomina',
    `Reporte de Nómina - ${periodo}`,
    null,
    null,
    rows,
    generadoPor,
  );
}

export async function generarGeneral(generadoPor) {
  const datos = {};
  const inicioMes = localDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const finMes = localDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [[a]] = await db.query(
    `SELECT COUNT(*) AS total FROM empleados WHERE estado = 'activo'`,
  );
  datos.empleados_activos = a.total;

  const [[t]] = await db.query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN estado = 'finalizada' THEN 1 ELSE 0 END) AS completadas,
       SUM(CASE WHEN estado = 'en_progreso' THEN 1 ELSE 0 END) AS en_progreso,
       SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes
     FROM tareas
     WHERE fecha_creacion BETWEEN ? AND ?`,
    [inicioMes, finMes],
  );
  datos.tareas_totales_mes = t.total || 0;
  datos.tareas_completadas_mes = t.completadas || 0;
  datos.tareas_en_progreso_mes = t.en_progreso || 0;
  datos.tareas_pendientes_mes = t.pendientes || 0;

  const [[p]] = await db.query(
    `SELECT
       SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
       SUM(CASE WHEN estado = 'aprobado' AND fecha_inicio BETWEEN ? AND ? THEN 1 ELSE 0 END) AS aprobados_mes,
       SUM(CASE WHEN estado = 'rechazado' AND fecha_inicio BETWEEN ? AND ? THEN 1 ELSE 0 END) AS rechazados_mes
     FROM permisos`,
    [inicioMes, finMes, inicioMes, finMes],
  );
  datos.permisos_pendientes = p.pendientes || 0;
  datos.permisos_aprobados_mes = p.aprobados_mes || 0;
  datos.permisos_rechazados_mes = p.rechazados_mes || 0;

  const [[n]] = await db.query(
    `SELECT COUNT(*) AS total, SUM(neto) AS total_pendiente FROM nomina WHERE estado = 'pendiente'`,
  );
  datos.nominas_pendientes = n.total || 0;
  datos.nomina_pendiente_total = n.total_pendiente || 0;

  const [[d]] = await db.query(
    `SELECT COUNT(*) AS total FROM documentos WHERE DATE(fecha_subida) BETWEEN ? AND ?`,
    [inicioMes, finMes],
  );
  datos.documentos_cargados_mes = d.total || 0;

  const [[pt]] = await db.query(
    `SELECT ROUND(SUM(CASE WHEN estado = 'puntual' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0) * 100, 2) AS porcentaje
     FROM asistencias WHERE fecha BETWEEN ? AND ?`,
    [inicioMes, finMes],
  );
  datos.puntualidad_promedio = pt.porcentaje ?? 0;
  return guardarReporte(
    'general',
    'Reporte General del Sistema',
    null,
    null,
    datos,
    generadoPor,
  );
}
