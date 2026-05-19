import React from "react";
import { ModalWrap } from "./ModalWrap.jsx";

export function AsistenciaModal({ value, empleados, isAdmin, hoy, onChange, onClose, onSave }) {
  const stop = (e) => e.stopPropagation();
  const canSave = value.fecha && value.fecha >= hoy && value.hora_entrada && (!isAdmin || value.id_empleado);

  const normalized = {
    ...value,
    hora_entrada: value.hora_entrada.length === 5 ? `${value.hora_entrada}:00` : value.hora_entrada,
    hora_salida: value.hora_salida.length === 5 ? `${value.hora_salida}:00` : value.hora_salida
  };

  return (
    <ModalWrap onOverlayClick={onClose}>
      <div className="modal" onClick={stop}>
        <div className="modal-header"><div className="modal-title">Asistencia</div><button type="button" className="modal-close" onClick={onClose}>✕</button></div>
        {isAdmin && (
          <div className="form-group-m">
            <label>Empleado</label>
            <select value={value.id_empleado} onChange={(ev) => onChange({ ...value, id_empleado: ev.target.value })}>
              <option value="">Seleccione un empleado</option>
              {empleados.map((em) => <option key={em.id_empleado} value={em.id_empleado}>{em.nombre} {em.apellido}</option>)}
            </select>
          </div>
        )}
        <div className="form-row">
          <div className="form-group-m"><label>Fecha</label><input type="date" min={hoy} value={value.fecha} onChange={(ev) => onChange({ ...value, fecha: ev.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group-m"><label>Entrada</label><input type="time" value={value.hora_entrada} onChange={(ev) => onChange({ ...value, hora_entrada: ev.target.value })} /></div>
          <div className="form-group-m"><label>Salida</label><input type="time" value={value.hora_salida} onChange={(ev) => onChange({ ...value, hora_salida: ev.target.value })} /></div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" disabled={!canSave} onClick={async () => { await onSave(normalized); onClose(); }}>Registrar</button>
        </div>
      </div>
    </ModalWrap>
  );
}
