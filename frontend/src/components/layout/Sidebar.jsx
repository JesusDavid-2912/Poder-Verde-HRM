import React from "react";

export function Sidebar({ page, isAdmin, onShowPage, onLogout }) {
  const items = [
    ["dashboard", "Panel"],
    isAdmin && ["directorio", "Directorio de Equipo"],
    ["nomina", isAdmin ? "Nómina" : "Mi Nómina"],
    ["tareas", "Tablero de Tareas"],
    ["asistencia", "Control de Asistencia"],
    ["permisos", "Solicitudes de Permiso"],
    ["documentos", "Documentos"],
    isAdmin && ["reportes", "Reportes KPI"],
    isAdmin && ["configuracion", "Configuración"],
    ["perfil", "Mi Perfil"]
  ].filter(Boolean);

  return (
    <div className="sidebar">
      {items.map(([id, label]) => (
        <button
          type="button"
          key={id}
          className={`sidebar-item${page === id ? " active" : ""}`}
          id={`nav-${id}`}
          onClick={() => onShowPage(id)}
        >
          {label}
        </button>
      ))}
      <div className="sidebar-footer">
        <button type="button" className="sidebar-item" onClick={onLogout} style={{ color: "var(--red)" }}>Cerrar Sesión</button>
      </div>
    </div>
  );
}
