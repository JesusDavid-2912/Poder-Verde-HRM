import PDFDocument from 'pdfkit';

function money(value) {
  return `$${Number(value || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function localDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function safeFilename(value) {
  return String(value || 'reporte')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function labelize(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function reportValue(key, value) {
  if (value === null || value === undefined || value === '') return '—';
  if (key.includes('fecha')) return formatDate(value);
  if (['salario_base', 'bonificaciones', 'deducciones', 'neto', 'nomina_pendiente_total'].includes(key)) {
    return money(value);
  }
  if (key.includes('porcentaje') || key.includes('puntualidad')) return `${Number(value || 0)}%`;
  return String(value);
}

function drawHeader(doc, title = 'Reporte General') {
  doc.rect(0, 0, doc.page.width, 90).fill('#1E7F4F');
  doc.fillColor('white').fontSize(24).text('Poder Verde HRM', 40, 30);
  doc.fontSize(11).text(title, 40, 60);
  doc.moveDown(4);
}

function drawFooter(doc) {
  doc
    .fontSize(9)
    .fillColor('gray')
    .text('Poder Verde HRM - Documento confidencial', 40, 760, {
      align: 'center',
    });
}

function drawTableHeader(doc, y, headers, positions) {
  doc.fillColor('white').rect(40, y, 520, 25).fill('#1E7F4F');
  doc.fillColor('white').fontSize(10);
  headers.forEach((header, i) => {
    doc.text(header, positions[i], y + 7);
  });
}

function ensurePage(doc, y, title, headers, positions) {
  if (y <= 720) return y;
  drawFooter(doc);
  doc.addPage();
  drawHeader(doc, title);
  const nextY = 120;
  drawTableHeader(doc, nextY, headers, positions);
  return nextY + 30;
}

function reportColumns(tipo, sample = {}) {
  const maps = {
    nomina: [
      { key: 'empleado', label: 'Empleado', x: 50, width: 135 },
      { key: 'puesto', label: 'Puesto', x: 185, width: 90 },
      { key: 'salario_base', label: 'Base', x: 280, width: 70 },
      { key: 'bonificaciones', label: 'Bonos', x: 350, width: 70 },
      { key: 'deducciones', label: 'Deducc.', x: 420, width: 70 },
      { key: 'neto', label: 'Neto', x: 490, width: 65 },
    ],
    asistencia: [
      { key: 'empleado', label: 'Empleado', x: 50, width: 145 },
      { key: 'puesto', label: 'Puesto', x: 195, width: 95 },
      { key: 'total_dias', label: 'Días', x: 295, width: 45 },
      { key: 'dias_puntual', label: 'Punt.', x: 345, width: 45 },
      { key: 'dias_retardo', label: 'Ret.', x: 395, width: 45 },
      { key: 'dias_falta', label: 'Faltas', x: 445, width: 50 },
      { key: 'porcentaje_puntualidad', label: '%', x: 500, width: 55 },
    ],
    productividad: [
      { key: 'empleado', label: 'Empleado', x: 50, width: 150 },
      { key: 'puesto', label: 'Puesto', x: 200, width: 100 },
      { key: 'tareas_completadas', label: 'Final.', x: 305, width: 55 },
      { key: 'tareas_en_progreso', label: 'Proceso', x: 365, width: 60 },
      { key: 'tareas_pendientes', label: 'Pend.', x: 430, width: 55 },
      { key: 'progreso_promedio', label: 'Prom.', x: 490, width: 65 },
    ],
  };
  if (maps[tipo]) return maps[tipo];
  return Object.keys(sample)
    .filter((key) => !key.startsWith('id_'))
    .slice(0, 6)
    .map((key, index) => ({
      key,
      label: labelize(key).slice(0, 12),
      x: 50 + index * 85,
      width: 80,
    }));
}

function drawReportTable(doc, title, tipo, rows) {
  if (!rows.length) {
    doc.fillColor('gray').fontSize(11).text('No hay registros para este reporte.');
    return;
  }
  const columns = reportColumns(tipo, rows[0]);
  const headers = columns.map((column) => column.label);
  const positions = columns.map((column) => column.x);
  let y = doc.y + 10;
  drawTableHeader(doc, y, headers, positions);
  y += 30;
  rows.forEach((row, index) => {
    y = ensurePage(doc, y, title, headers, positions);
    if (index % 2 === 0) doc.rect(40, y - 5, 520, 24).fill('#F3F3F3');
    doc.fillColor('black').fontSize(8);
    columns.forEach((column) => {
      doc.text(reportValue(column.key, row[column.key]), column.x, y, {
        width: column.width,
        ellipsis: true,
      });
    });
    y += 26;
  });
  doc.y = y;
}

function drawMetricCards(doc, metrics) {
  let y = doc.y + 10;
  metrics.forEach(([key, value], index) => {
    if (y > 700) {
      drawFooter(doc);
      doc.addPage();
      drawHeader(doc, 'Reporte General del Sistema');
      y = 120;
    }
    const x = index % 2 === 0 ? 40 : 310;
    if (index % 2 === 0 && index !== 0) y += 72;
    doc.roundedRect(x, y, 250, 58, 8).fill('#F3F3F3');
    doc.fillColor('#1E7F4F').fontSize(10).text(labelize(key), x + 14, y + 12, { width: 220 });
    doc.fillColor('black').fontSize(16).text(reportValue(key, value), x + 14, y + 32, { width: 220 });
  });
  doc.y = y + 82;
}

export async function handlePdfReport(db, res) {
  try {
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*) AS total_empleados,
        AVG(salario) AS salario_promedio,
        SUM(salario) AS nomina_total
      FROM empleados
      WHERE estado = 'activo'
    `);

    const [empleados] = await db.query(`
      SELECT nombre, apellido, puesto, departamento, salario
      FROM empleados
      WHERE estado = 'activo'
      ORDER BY departamento, apellido
    `);

    const [roles] = await db.query(`
      SELECT r.nombre AS rol, COUNT(e.id_empleado) AS total
      FROM roles r
      LEFT JOIN empleados e ON e.id_rol = r.id_rol AND e.estado = 'activo'
      GROUP BY r.id_rol, r.nombre
      ORDER BY r.id_rol
    `);

    const [departamentos] = await db.query(`
      SELECT COALESCE(departamento, 'Sin departamento') AS departamento, COUNT(*) AS total
      FROM empleados
      WHERE estado = 'activo'
      GROUP BY departamento
      ORDER BY total DESC
    `);

    const [asistencias] = await db.query(`
      SELECT
        CONCAT(e.nombre, ' ', e.apellido) AS empleado,
        SUM(CASE WHEN a.estado = 'puntual' THEN 1 ELSE 0 END) AS puntuales,
        SUM(CASE WHEN a.estado = 'retardo' THEN 1 ELSE 0 END) AS retardos,
        SUM(CASE WHEN a.estado = 'falta' THEN 1 ELSE 0 END) AS faltas
      FROM empleados e
      LEFT JOIN asistencias a ON e.id_empleado = a.id_empleado
      WHERE e.estado = 'activo'
      GROUP BY e.id_empleado, e.nombre, e.apellido
      ORDER BY e.nombre
    `);

    const [permisos] = await db.query(`
      SELECT
        CONCAT(e.nombre, ' ', e.apellido) AS empleado,
        COUNT(p.id_permiso) AS total,
        SUM(CASE WHEN p.estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN p.estado = 'aprobado' THEN 1 ELSE 0 END) AS aprobados
      FROM empleados e
      LEFT JOIN permisos p ON e.id_empleado = p.id_empleado
      WHERE e.estado = 'activo'
      GROUP BY e.id_empleado, e.nombre, e.apellido
      ORDER BY e.nombre
    `);

    const [tareas] = await db.query(`
      SELECT
        CONCAT(e.nombre, ' ', e.apellido) AS empleado,
        SUM(CASE WHEN t.estado = 'finalizada' THEN 1 ELSE 0 END) AS finalizadas,
        SUM(CASE WHEN t.estado = 'en_progreso' THEN 1 ELSE 0 END) AS en_progreso,
        SUM(CASE WHEN t.estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes
      FROM empleados e
      LEFT JOIN tareas t ON e.id_empleado = t.id_empleado_asignado
      WHERE e.estado = 'activo'
      GROUP BY e.id_empleado, e.nombre, e.apellido
      ORDER BY finalizadas DESC, e.nombre
    `);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_hrm.pdf');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    drawHeader(doc, 'Reporte Ejecutivo General');
    doc.fillColor('black').fontSize(12).text(`Fecha: ${formatDate(new Date())}`);

    const cards = [
      { title: 'Empleados Activos', value: stats.total_empleados || 0 },
      { title: 'Nómina Total', value: money(stats.nomina_total) },
      { title: 'Salario Promedio', value: money(stats.salario_promedio) },
    ];

    cards.forEach((card, index) => {
      const x = 40 + index * 175;
      doc.roundedRect(x, 150, 160, 70, 8).fill('#F3F3F3');
      doc.fillColor('#1E7F4F').fontSize(11).text(card.title, x + 15, 165);
      doc.fillColor('black').fontSize(18).text(String(card.value), x + 15, 188);
    });

    doc.fillColor('#1E7F4F').fontSize(15).text('Empleados por Rol', 40, 250);
    let y = 280;
    drawTableHeader(doc, y, ['Rol', 'Total'], [60, 400]);
    y += 30;
    roles.forEach((r, index) => {
      if (index % 2 === 0) doc.rect(40, y - 5, 520, 22).fill('#F3F3F3');
      doc.fillColor('black').fontSize(11).text(r.rol, 60, y).text(String(r.total || 0), 400, y);
      y += 24;
    });

    y += 16;
    doc.fillColor('#1E7F4F').fontSize(15).text('Empleados por Departamento', 40, y);
    y += 30;
    drawTableHeader(doc, y, ['Departamento', 'Total'], [60, 400]);
    y += 30;
    departamentos.forEach((d, index) => {
      if (index % 2 === 0) doc.rect(40, y - 5, 520, 22).fill('#F3F3F3');
      doc.fillColor('black').fontSize(11).text(d.departamento, 60, y).text(String(d.total || 0), 400, y);
      y += 24;
    });
    drawFooter(doc);

    doc.addPage();
    drawHeader(doc, 'Listado de Empleados');
    y = doc.y;
    drawTableHeader(doc, y, ['Empleado', 'Puesto', 'Departamento', 'Salario'], [50, 210, 345, 465]);
    y += 30;
    empleados.forEach((emp, index) => {
      y = ensurePage(doc, y, 'Listado de Empleados', ['Empleado', 'Puesto', 'Departamento', 'Salario'], [50, 210, 345, 465]);
      if (index % 2 === 0) doc.rect(40, y - 5, 520, 22).fill('#F3F3F3');
      doc
        .fillColor('black')
        .fontSize(9)
        .text(`${emp.nombre} ${emp.apellido}`, 50, y, { width: 150 })
        .text(emp.puesto || '—', 210, y, { width: 125 })
        .text(emp.departamento || '—', 345, y, { width: 110 })
        .text(money(emp.salario), 465, y, { width: 90 });
      y += 24;
    });
    drawFooter(doc);

    doc.addPage();
    drawHeader(doc, 'Asistencia, Permisos y Tareas');
    y = doc.y;
    drawTableHeader(doc, y, ['Empleado', 'Punt.', 'Ret.', 'Faltas'], [50, 300, 380, 455]);
    y += 30;
    asistencias.forEach((a, index) => {
      y = ensurePage(doc, y, 'Asistencia, Permisos y Tareas', ['Empleado', 'Punt.', 'Ret.', 'Faltas'], [50, 300, 380, 455]);
      if (index % 2 === 0) doc.rect(40, y - 5, 520, 22).fill('#F3F3F3');
      doc.fillColor('black').fontSize(9)
        .text(a.empleado, 50, y, { width: 220 })
        .text(String(a.puntuales || 0), 310, y)
        .text(String(a.retardos || 0), 390, y)
        .text(String(a.faltas || 0), 465, y);
      y += 24;
    });

    y += 20;
    drawTableHeader(doc, y, ['Empleado', 'Permisos', 'Pend.', 'Aprob.'], [50, 300, 380, 455]);
    y += 30;
    permisos.forEach((p, index) => {
      y = ensurePage(doc, y, 'Permisos por Empleado', ['Empleado', 'Permisos', 'Pend.', 'Aprob.'], [50, 300, 380, 455]);
      if (index % 2 === 0) doc.rect(40, y - 5, 520, 22).fill('#F3F3F3');
      doc.fillColor('black').fontSize(9)
        .text(p.empleado, 50, y, { width: 220 })
        .text(String(p.total || 0), 310, y)
        .text(String(p.pendientes || 0), 390, y)
        .text(String(p.aprobados || 0), 465, y);
      y += 24;
    });

    y += 20;
    drawTableHeader(doc, y, ['Empleado', 'Final.', 'Proceso', 'Pend.'], [50, 300, 380, 455]);
    y += 30;
    tareas.forEach((t, index) => {
      y = ensurePage(doc, y, 'Tareas por Empleado', ['Empleado', 'Final.', 'Proceso', 'Pend.'], [50, 300, 380, 455]);
      if (index % 2 === 0) doc.rect(40, y - 5, 520, 22).fill('#F3F3F3');
      doc.fillColor('black').fontSize(9)
        .text(t.empleado, 50, y, { width: 220 })
        .text(String(t.finalizadas || 0), 310, y)
        .text(String(t.en_progreso || 0), 390, y)
        .text(String(t.pendientes || 0), 465, y);
      y += 24;
    });

    drawFooter(doc);
    doc.end();
  } catch (error) {
    console.error('[PDF ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar PDF',
    });
  }
}

export function handleStoredReportPdf(reporte, res) {
  try {
    let datos = reporte.datos || [];
    if (typeof datos === 'string') {
      try {
        datos = JSON.parse(datos);
      } catch {
        datos = [];
      }
    }

    const baseName = safeFilename(`${reporte.titulo || `reporte_${reporte.tipo}`}_${localDate()}`);
    const filename = `${baseName || 'reporte'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    const title = reporte.titulo || 'Reporte';
    drawHeader(doc, title);
    doc.fillColor('black').fontSize(11);
    doc.text(`Tipo: ${labelize(reporte.tipo || 'reporte')}`);
    doc.text(`Generado por: ${reporte.generado_por_nombre || '—'}`);
    doc.text(`Fecha de generación: ${formatDate(reporte.fecha_generacion || new Date())}`);
    if (reporte.fecha_inicio || reporte.fecha_fin) {
      doc.text(`Periodo: ${formatDate(reporte.fecha_inicio)} - ${formatDate(reporte.fecha_fin)}`);
    }
    doc.moveDown(1);

    if (Array.isArray(datos)) {
      drawReportTable(doc, title, reporte.tipo, datos);
    } else {
      const entries = Object.entries(datos || {});
      if (entries.length) {
        doc.fillColor('#1E7F4F').fontSize(15).text('Indicadores del periodo');
        drawMetricCards(doc, entries);
      } else {
        doc.fillColor('gray').fontSize(11).text('No hay datos disponibles para este reporte.');
      }
    }

    drawFooter(doc);
    doc.end();
  } catch (error) {
    console.error('[PDF REPORTE ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar reporte PDF',
    });
  }
}
