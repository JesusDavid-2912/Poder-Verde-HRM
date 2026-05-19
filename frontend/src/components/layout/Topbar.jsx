import React from "react";
import { getInitials } from "../../lib/utils.js";

export function Topbar({ user, isAdmin, onShowPage }) {
  const uname = user ? `${user.nombre} ${user.apellido}` : "";
  const panelLabel = isAdmin ? "Panel de Administración" : "Panel de Empleado";

  return (
    <div className="topbar">
      <div className="topbar-logo">
        <div className="topbar-logo-icon">
          <svg viewBox="0 0 24 24" fill="white"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 2s1.5-3.5 5-3.5S17 8 17 8z" /></svg>
        </div>
        <div>
          <div className="topbar-logo-name">Poder Verde</div>
          <div className="topbar-logo-sub">{panelLabel}</div>
        </div>
      </div>
      {isAdmin && (
        <>
          <div className="topbar-nav">
            <a role="presentation" onClick={() => onShowPage("directorio")}>Directorio</a>
            <a role="presentation" onClick={() => onShowPage("reportes")}>Reportes</a>
          </div>
        </>
      )}
      <div className="topbar-actions">
        <div className="topbar-user" onClick={() => onShowPage("perfil")} role="presentation" style={{ cursor: "pointer" }}>
          <div className="user-avatar" id="topbar-avatar">{getInitials(uname)}</div>
          <span className="user-name" id="topbar-username">{uname}</span>
        </div>
      </div>
    </div>
  );
}
