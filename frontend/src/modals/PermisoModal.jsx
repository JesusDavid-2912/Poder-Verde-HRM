import React from "react";
import { ModalWrap } from "./ModalWrap.jsx";

export function PermisoModal({ value, empleados, isAdmin, hoy, onChange, onClose, onSave }) {
  const stop = (e) => e.stopPropagation();
  const hasText = (input) => String(input || "").trim().length > 0;
  const canSave =
    hasText(value.tipo) &&
    value.fecha_inicio &&
    value.fecha_fin &&
    value.fecha_inicio >= hoy &&
    value.fecha_fin >= value.fecha_inicio &&
    hasText(value.motivo);

  return (
    <ModalWrap onOverlayClick={onClose}>
      <div className="modal" onClick={stop}>
        <div className="modal-header"><div className="modal-title">Permiso</div><button type="button" className="modal-close" onClick={onClose}>✕</button></div>
        {isAdmin && (
          <div className="form-group-m">
            <label>Empleado (opcional)</label>
            <select value={value.id_empleado} onChange={(ev) => onChange({ ...value, id_empleado: ev.target.value })}>
              <option value="">Usar mi usuario</option>
              {empleados.map((em) => <option key={em.id_empleado} value={em.id_empleado}>{em.nombre} {em.apellido}</option>)}
            </select>
          </div>
        )}
        <div className="form-group-m"><label>Tipo</label><input value={value.tipo} onChange={(ev) => onChange({ ...value, tipo: ev.target.value })} /></div>
        <div className="form-row">
          <div className="form-group-m"><label>Inicio</label><input type="date" min={hoy} value={value.fecha_inicio} onChange={(ev) => onChange({ ...value, fecha_inicio: ev.target.value, fecha_fin: value.fecha_fin < ev.target.value ? ev.target.value : value.fecha_fin })} /></div>
          <div className="form-group-m"><label>Fin</label><input type="date" min={value.fecha_inicio || hoy} value={value.fecha_fin} onChange={(ev) => onChange({ ...value, fecha_fin: ev.target.value })} /></div>
        </div>
        <div className="form-group-m"><label>Motivo</label><textarea rows={3} value={value.motivo} onChange={(ev) => onChange({ ...value, motivo: ev.target.value })} /></div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" disabled={!canSave} onClick={async () => { await onSave(value); onClose(); }}>Enviar</button>
        </div>
      </div>
    </ModalWrap>
  );
}
