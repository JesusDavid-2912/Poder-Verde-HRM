import React from "react";
import { useState } from "react";
import { formatDate, getAvatarColor, getInitials, fmtMoney, labelsKanban, todayLocal } from "../lib/utils.js";
import { PerfilForm, PasswordForm } from "../pages/ProfileForms.jsx";

function classPage(active, name) {
  return `page${active === name ? " active" : ""}`;
}

export function AllPages({
  page,
  isAdmin,
  user,
  empleados,
  tareasPorEstado,
  tareas,
  asistencias,
  permisos,
  nominas,
  documentos,
  reportes = [],
  stats,
  onShowPage,
  showToast,
  openModal,
  token,
  onTareaAccion,
  onPermEstado,
  onDeletePerm,
  onPagarNomina,
  onProcesarNomina,
  onDeleteDoc,
  onDeleteEmpleado,
  descargarDoc,
  onExportNominaPdf,
  onGenerarReporte,
  onUploadDocument,
  onExportReporteJson,
  onExportReportePdf,
  reload,
  onProfileUpdate
}) {
  const [docEmpleado, setDocEmpleado] = useState("");
  const [uploadState, setUploadState] = useState({ status: "idle", fileName: "" });
  const [reportePeriodo, setReportePeriodo] = useState(todayLocal().slice(0, 7));
  const activos = empleados.filter((e) => e.estado === "activo").length;
  const pendTareas = (tareasPorEstado.pendiente || []).length;
  const tareasFinalizadas = (tareasPorEstado.finalizada || []).length;
  const pagosRealizados = nominas.filter((n) => n.estado === "pagada").length;
  const permisosPendientes = permisos.filter((p) => p.estado === "pendiente").length;
  const adminName = user ? `${user.nombre} ${user.apellido}` : "Usuario";
  const priorityClass = (priority) => `task-tag ${priority === "urgente" ? "red" : priority === "alta" ? "yellow" : priority === "baja" ? "blue" : "green"}`;

  return (
    <div className="main-content" id="main-content">
      <div className={classPage(page, "dashboard")} id="page-dashboard" style={{ display: page === "dashboard" ? "block" : "none" }}>
        <div className="page-header-row">
          <div>
            <div className="page-title">{isAdmin ? "Panel General" : "Mi Panel"}</div>
            <div className="page-subtitle">
              {isAdmin ? "Bienvenido de nuevo, visualiza el resumen general de empleados, tareas y solicitudes." : "Bienvenido de nuevo, revisa tus tareas, permisos y pagos recientes."}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {isAdmin && (
              <a
                className="btn btn-secondary"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onExportNominaPdf();
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Descargar Reporte
              </a>
            )}
          </div>
        </div>
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-card-label">{isAdmin ? "Miembros Activos" : "Mis tareas"}</div>
            <div className="stat-card-value">{isAdmin ? activos || stats?.empActivos || "—" : tareas.length}</div>
            <div className="stat-card-change">{isAdmin ? "Datos en vivo" : `${tareasFinalizadas} finalizadas`}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Tareas pendientes</div>
            <div className="stat-card-value">{pendTareas}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">{isAdmin ? "Permisos pendientes" : "Pagos recibidos"}</div>
            <div className="stat-card-value">{isAdmin ? stats?.permPend || permisosPendientes || 0 : pagosRealizados}</div>
          </div>
        </div>
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gray-900)", borderLeft: "3px solid var(--green-600)", paddingLeft: 10, marginBottom: 16 }}>Actividad Reciente</div>
            <div className="activity-item">
              <div className="activity-icon green">
                <svg width="18" height="18" fill="none" stroke="var(--green-700)" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div className="activity-title">
                  <span>{adminName}</span> — sesión activa en el ecosistema HRM.
                </div>
                <div className="activity-meta">Hoy • Sistema Poder Verde</div>
              </div>
            </div>
            {!isAdmin && tareas.slice(0, 2).map((t) => (
              <div key={t.id_tarea} className="activity-item">
                <div className="activity-icon amber">📌</div>
                <div style={{ flex: 1 }}>
                  <div className="activity-title">{t.titulo}</div>
                  <div className="activity-meta">{t.estado} • Fecha límite: {formatDate(t.fecha_limite)}</div>
                </div>
              </div>
            ))}
            {isAdmin && permisos.filter((p) => p.estado === "pendiente").slice(0, 2).map((p) => (
              <div key={p.id_permiso} className="activity-item">
                <div className="activity-icon amber">📋</div>
                <div style={{ flex: 1 }}>
                  <div className="activity-title">Solicitud de permiso {p.tipo}</div>
                  <div className="activity-meta">Pendiente de revisión</div>
                </div>
                <div className="activity-actions">
                  <button type="button" className="act-btn reject" onClick={() => onPermEstado(p.id_permiso, "rechazado")}>✕</button>
                  <button type="button" className="act-btn approve" onClick={() => onPermEstado(p.id_permiso, "aprobado")}>✓</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="tools-grid">
              {!isAdmin && (
                <div className="tool-card dark" onClick={() => onShowPage("nomina")} role="presentation">
                  <div className="tool-card-icon">💳</div>
                  <div className="tool-card-title">Mi Nómina</div>
                  <div className="tool-card-desc">Consulta tus pagos y estados recientes.</div>
                  <div className="tool-card-link">Ver pagos →</div>
                </div>
              )}
              {!isAdmin && (
                <div className="tool-card dark-2" onClick={() => onShowPage("permisos")} role="presentation">
                  <div className="tool-card-icon">📋</div>
                  <div className="tool-card-title">Mis Permisos</div>
                  <div className="tool-card-desc">{permisosPendientes} solicitudes pendientes.</div>
                  <div className="tool-card-link">Revisar →</div>
                </div>
              )}
              {isAdmin && (
                <div className="tool-card dark" onClick={() => onShowPage("configuracion")} role="presentation">
                  <div className="tool-card-icon">👥</div>
                  <div className="tool-card-title">Gestión de Usuarios</div>
                  <div className="tool-card-desc">Administra permisos, roles y accesos.</div>
                  <div className="tool-card-link">Entrar →</div>
                </div>
              )}
              {isAdmin && (
                <div className="tool-card dark-2" onClick={() => onShowPage("reportes")} role="presentation">
                  <div className="tool-card-icon">📊</div>
                  <div className="tool-card-title">Reportes KPI</div>
                  <div className="tool-card-desc">Métricas y salud organizacional.</div>
                  <div className="tool-card-link">Analizar →</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className={classPage(page, "directorio")} id="page-directorio" style={{ display: page === "directorio" ? "block" : "none" }}>
          <div className="page-header-row">
            <div>
              <div className="page-title">Directorio de Equipo</div>
              <div className="page-subtitle">Gestiona los registros de empleados de la organización.</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="btn btn-primary" onClick={() => openModal("empleado")}>
                Nuevo Empleado
              </button>
            </div>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Departamento</th>
                    <th>Cargo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {empleados.map((e) => (
                    <tr key={e.id_empleado}>
                      <td>
                        <div className="user-cell">
                          <div className={`avatar ${getAvatarColor(e.nombre)}`}>{getInitials(`${e.nombre} ${e.apellido}`)}</div>
                          <div>
                            <div className="cell-name">
                              {e.nombre} {e.apellido}
                            </div>
                            <div className="cell-sub">{e.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{e.departamento || "—"}</td>
                      <td>{e.puesto || "—"}</td>
                      <td>
                        <span className={`dot ${e.estado === "activo" ? "dot-green" : e.estado === "bloqueado" ? "dot-red" : "dot-gray"}`} /> {e.estado}
                      </td>
                      <td>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openModal("editar-emp", e)}>Editar</button>{" "}
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => onDeleteEmpleado(e.id_empleado)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className={classPage(page, "nomina")} id="page-nomina" style={{ display: page === "nomina" ? "block" : "none" }}>
        <div className="page-header-row">
          <div>
            <div className="page-title">{isAdmin ? "Gestión de Nómina" : "Mi Nómina"}</div>
            <div className="page-subtitle">{isAdmin ? "Ciclo de nómina y desembolsos" : "Consulta tus pagos registrados y su estado actual"}</div>
          </div>
          {isAdmin && (
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onExportNominaPdf}>
                Exportar reporte general
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => openModal("nomina")}>
                Nómina manual
              </button>
              <button type="button" className="btn btn-primary" onClick={onProcesarNomina}>
                Ejecutar Nueva Nómina
              </button>
            </div>
          )}
        </div>
        <div className="nomina-summary">
          <div className="nomina-card total">
            <div className="nomina-label green">{isAdmin ? "Nómina Total (neto)" : "Total neto registrado"}</div>
            <div className="nomina-value">{fmtMoney(nominas.reduce((s, n) => s + Number(n.neto || 0), 0))}</div>
          </div>
          <div className="nomina-card bono">
            <div className="nomina-label amber">Bonificaciones</div>
            <div className="nomina-value">{fmtMoney(nominas.reduce((s, n) => s + Number(n.bonificaciones || 0), 0))}</div>
          </div>
          <div className="nomina-card dedu">
            <div className="nomina-label red">Deducciones</div>
            <div className="nomina-value">{fmtMoney(nominas.reduce((s, n) => s + Number(n.deducciones || 0), 0))}</div>
          </div>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Profesional</th>
                  <th>Período</th>
                  <th>Base</th>
                  <th>Bono</th>
                  <th>Deducción</th>
                  <th>Neto</th>
                  <th>Estado</th>
                  {isAdmin && <th>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {nominas.map((n) => (
                  <tr key={n.id_nomina}>
                    <td>
                      {n.nombre || user?.nombre} {n.apellido || user?.apellido}
                    </td>
                    <td>{n.periodo}</td>
                    <td>{fmtMoney(n.salario_base)}</td>
                    <td style={{ color: "var(--green-600)", fontWeight: 600 }}>+{fmtMoney(n.bonificaciones)}</td>
                    <td style={{ color: "var(--red)", fontWeight: 600 }}>-{fmtMoney(n.deducciones)}</td>
                    <td style={{ fontWeight: 700 }}>{fmtMoney(n.neto)}</td>
                    <td>
                      <span className={`badge ${n.estado === "pagada" ? "badge-green" : n.estado === "pendiente" ? "badge-amber" : "badge-gray"}`}>{n.estado}</span>
                    </td>
                    {isAdmin && (
                      <td>
                        {n.estado === "pendiente" && (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onPagarNomina(n.id_nomina)}>Pagar</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {nominas.length === 0 && (
                  <tr><td colSpan={isAdmin ? 8 : 7}>No hay registros de nómina.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={classPage(page, "tareas")} id="page-tareas" style={{ display: page === "tareas" ? "block" : "none" }}>
        <div className="page-header-row">
          <div>
            <div className="page-title">Tablero de Tareas</div>
            <div className="page-subtitle">Seguimiento de tareas por estado.</div>
          </div>
          {isAdmin && (
            <button type="button" className="btn btn-primary" onClick={() => openModal("tarea")}>
              Asignar Nueva Tarea
            </button>
          )}
        </div>
        <div className="kanban-board">
          {["semillas", "crecimiento", "cosechado"].map((col) => {
            const keyMap = { semillas: "pendiente", crecimiento: "en_progreso", cosechado: "finalizada" };
            const list = tareasPorEstado[keyMap[col]] || [];
            const meta = labelsKanban[col];
            return (
              <div className="card" key={col}>
                <div className="kanban-col-header">
                  <div className={`kanban-dot ${meta.dot}`} />
                  <div className="kanban-col-title">{meta.label}</div>
                  <div className="kanban-col-count">{String(list.length).padStart(2, "0")}</div>
                </div>
                <div>
                  {list.map((t) => (
                    <div className="task-card" key={t.id_tarea}>
                      <span className={priorityClass(t.prioridad)}>{t.prioridad || "normal"}</span>
                      <div className="task-title">{t.titulo}</div>
                      {t.descripcion && <div className="task-desc">{t.descripcion}</div>}
                      <div className="task-footer">
                        <div className="task-assignee">
                          <div className={`avatar ${getAvatarColor(t.nombre)}`} style={{ width: 22, height: 22, fontSize: 9 }}>
                          {getInitials(`${t.nombre || user?.nombre || ""} ${t.apellido || user?.apellido || ""}`)}
                          </div>
                          {t.nombre || user?.nombre} {t.apellido || user?.apellido}
                        </div>
                        <div className="task-date">Fecha límite: {formatDate(t.fecha_limite)}</div>
                      </div>
                      {!isAdmin && t.id_empleado_asignado === user?.id_empleado && (
                        <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {t.estado !== "en_progreso" && <button type="button" className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); onTareaAccion(t, "en_progreso", 50); }}>En proceso</button>}
                          {t.estado !== "finalizada" && <button type="button" className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); onTareaAccion(t, "finalizada", 100); }}>Finalizar</button>}
                        </div>
                      )}
                    </div>
                  ))}
                  {list.length === 0 && <div className="empty-state">No hay tareas en esta etapa.</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={classPage(page, "asistencia")} id="page-asistencia" style={{ display: page === "asistencia" ? "block" : "none" }}>
        <div className="page-header-row">
          <div>
            <div className="page-title">Control de Asistencia</div>
            <div className="page-subtitle">Consulta y registra asistencias del día </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => openModal("asistencia")}>
            + Registrar Asistencia
          </button>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Fecha</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {asistencias.map((a) => (
                  <tr key={a.id_asistencia || `${a.id_empleado}-${a.fecha}`}>
                    <td>
                      {a.nombre || user?.nombre} {a.apellido || user?.apellido}
                    </td>
                    <td>{formatDate(a.fecha)}</td>
                    <td>{a.hora_entrada || "—"}</td>
                    <td>{a.hora_salida || "—"}</td>
                    <td>
                      <span
                        className={`badge ${
                          a.estado === "puntual" ? "badge-green" : a.estado === "retardo" ? "badge-amber" : "badge-red"
                        }`}
                      >
                        {a.estado}
                      </span>
                    </td>
                  </tr>
                ))}
                {asistencias.length === 0 && (
                  <tr><td colSpan="5">No hay registros de asistencia para este periodo.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={classPage(page, "permisos")} id="page-permisos" style={{ display: page === "permisos" ? "block" : "none" }}>
        <div className="page-header-row">
          <div>
            <div className="page-title">Solicitudes de Permiso</div>
            <div className="page-subtitle">{isAdmin ? "Revisa y aprueba solicitudes" : "Tus solicitudes y nuevas peticiones"}</div>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => openModal("permiso")}>
            + Nueva Solicitud
          </button>
        </div>
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-card-label">Pendientes</div>
            <div className="stat-card-value" style={{ color: "var(--amber)" }}>
              {permisos.filter((p) => p.estado === "pendiente").length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Aprobados</div>
            <div className="stat-card-value" style={{ color: "var(--green-600)" }}>
              {permisos.filter((p) => p.estado === "aprobado").length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Rechazados</div>
            <div className="stat-card-value" style={{ color: "var(--red)" }}>
              {permisos.filter((p) => p.estado === "rechazado").length}
            </div>
          </div>
        </div>
        <div>
          {permisos.map((p) => (
            <div className="permit-item" key={p.id_permiso}>
              <div className="permit-icon" style={{ background: "var(--green-50)", fontSize: 20 }}>📋</div>
              <div className="permit-info">
                <div className="permit-name">
                  {p.nombre || user?.nombre} {p.apellido || user?.apellido}
                </div>
                <div className="permit-type">{p.tipo}</div>
                <div className="permit-dates">📅 {formatDate(p.fecha_inicio)} — {formatDate(p.fecha_fin)}</div>
                <div className="permit-reason">{p.motivo}</div>
                {isAdmin && p.estado === "pendiente" && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => onPermEstado(p.id_permiso, "rechazado")}>Rechazar</button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => onPermEstado(p.id_permiso, "aprobado")}>Aprobar</button>
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <span
                  className={`badge ${
                    p.estado === "aprobado" ? "badge-green" : p.estado === "pendiente" ? "badge-amber" : "badge-red"
                  }`}
                >
                  {p.estado}
                </span>
                {isAdmin && (
                  <button type="button" className="btn btn-danger btn-sm" style={{ marginTop: 8, display: "block" }} onClick={() => onDeletePerm(p.id_permiso)}>Eliminar</button>
                )}
              </div>
            </div>
          ))}
          {permisos.length === 0 && <div className="empty-state">No hay solicitudes de permiso registradas.</div>}
        </div>
      </div>

      <div className={classPage(page, "documentos")} id="page-documentos" style={{ display: page === "documentos" ? "block" : "none" }}>
        <div className="page-header-row">
          <div>
            <div className="page-title">Gestión de Documentos</div>
            <div className="page-subtitle">Carga y descarga segura (máx. 10MB)</div>
          </div>
        </div>
        <div className="grid-2" style={{ marginBottom: 20 }}>
          {isAdmin && (
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Asignar documento a</div>
              <select className="form-input" value={docEmpleado} onChange={(e) => setDocEmpleado(e.target.value)}>
                <option value="">Mi usuario</option>
                {empleados.map((em) => <option key={em.id_empleado} value={em.id_empleado}>{em.nombre} {em.apellido}</option>)}
              </select>
            </div>
          )}
          <label className="upload-zone" htmlFor="file-up">
            <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-700)" }}>Clic para subir</div>
            <div style={{ fontSize: 12, color: "var(--gray-500)" }}>PDF, DOCX, XLSX, imágenes</div>
            <input
              id="file-up"
              type="file"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadState({ status: "uploading", fileName: file.name });
                try {
                  await onUploadDocument({ file, id_empleado: docEmpleado });
                  setUploadState({ status: "uploaded", fileName: file.name });
                  e.target.value = "";
                } catch {
                  setUploadState({ status: "error", fileName: file.name });
                }
              }}
            />
          </label>
        </div>
        {uploadState.status !== "idle" && (
          <div className={`upload-feedback ${uploadState.status}`}>
            {uploadState.status === "uploading" && `Subiendo ${uploadState.fileName}...`}
            {uploadState.status === "uploaded" && `${uploadState.fileName} se subió correctamente.`}
            {uploadState.status === "error" && `No se pudo subir ${uploadState.fileName}.`}
          </div>
        )}
        <div>
          {documentos.map((d) => (
            <div className="doc-item" key={d.id_documento}>
              <div className="doc-icon">📄</div>
              <div className="doc-info">
                <div className="doc-name">{d.nombre_archivo}</div>
                <div className="doc-meta">
                  {isAdmin && `${d.nombre || "Sin usuario"} ${d.apellido || ""} • `}
                  {d.tipo_archivo} • {Math.round((d.tamano_bytes || 0) / 1024)} KB
                  {d.fecha_subida && ` • ${formatDate(d.fecha_subida)}`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => descargarDoc(d.id_documento)}>Descargar</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => onDeleteDoc(d.id_documento)}>🗑</button>
              </div>
            </div>
          ))}
          {documentos.length === 0 && <div className="empty-state">No hay documentos cargados.</div>}
        </div>
      </div>

      {isAdmin && (
        <div className={classPage(page, "reportes")} id="page-reportes" style={{ display: page === "reportes" ? "block" : "none" }}>
          <div className="page-header-row">
            <div>
              <div className="page-title">Reportes KPI</div>
              <div className="page-subtitle">Genera y descarga reportes del sistema</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
              <label>Periodo</label>
              <input
                className="form-input"
                style={{ width: 160 }}
                type="month"
                value={reportePeriodo}
                onChange={(e) => setReportePeriodo(e.target.value)}
              />
              <button type="button" className="btn btn-secondary" onClick={() => onGenerarReporte("productividad")}>
                Productividad
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => onGenerarReporte("asistencia")}>
                Asistencia
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!reportePeriodo}
                onClick={() => onGenerarReporte("nomina", { periodo: reportePeriodo })}
              >
                Nómina
              </button>
              <button type="button" className="btn btn-primary" onClick={() => onGenerarReporte("general")}>
                General
              </button>
            </div>
          </div>
          <div className="grid-4" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-card-label">Empleados activos</div>
              <div className="stat-card-value">{activos}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Tareas (total)</div>
              <div className="stat-card-value">{tareas.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Asistencias hoy</div>
              <div className="stat-card-value">{asistencias.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Permisos pendientes</div>
              <div className="stat-card-value">{permisos.filter((p) => p.estado === "pendiente").length}</div>
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Historial de reportes</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Generado por</th>
                    <th>Fecha</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {reportes.map((r) => (
                    <tr key={r.id_reporte}>
                      <td>{r.titulo}</td>
                      <td>{r.tipo}</td>
                      <td>{r.generado_por_nombre || "—"}</td>
                      <td>{formatDate(r.fecha_generacion)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onExportReporteJson(r.id_reporte)}>JSON</button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onExportReportePdf(r.id_reporte)}>PDF</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reportes.length === 0 && (
                    <tr><td colSpan="5">Aún no hay reportes generados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className={classPage(page, "configuracion")} id="page-configuracion" style={{ display: page === "configuracion" ? "block" : "none" }}>
          <div className="page-title">Control de Acceso</div>
          <div className="page-subtitle" style={{ marginBottom: 20 }}>Administra roles y estados de usuarios</div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol (id)</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {empleados.map((e) => (
                    <tr key={e.id_empleado}>
                      <td>
                        {e.nombre} {e.apellido} — {e.email}
                      </td>
                      <td>{e.id_rol === 1 ? "Admin" : "Empleado"}</td>
                      <td>{e.estado}</td>
                      <td>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openModal("acceso", e)}>Gestionar acceso</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className={classPage(page, "perfil")} id="page-perfil" style={{ display: page === "perfil" ? "block" : "none" }}>
        <div className="page-title" style={{ marginBottom: 20 }}>Mi Perfil</div>
        <div className="page-subtitle" style={{ marginBottom: 20 }}>Actualiza tus datos personales</div>
        <div className="profile-hero">
          <div className="profile-avatar-lg">{getInitials(`${user?.nombre} ${user?.apellido}`)}</div>
          <div>
            <div className="profile-name">
              {user?.nombre} {user?.apellido}
            </div>
            <div className="profile-role">{isAdmin ? "Administrador" : "Empleado"}</div>
            <div className="profile-id">ID: #{user?.id_empleado}</div>
          </div>
        </div>
        <div className="grid-2">
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Información Personal</div>
            <PerfilForm user={user} onSaved={reload} onProfileUpdate={onProfileUpdate} token={token} showToast={showToast} />
          </div>
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Seguridad de Cuenta</div>
            <PasswordForm token={token} showToast={showToast} />
          </div>
        </div>
      </div>
    </div>
  );
}
