import React from "react";
import { ModalWrap } from "./ModalWrap.jsx";

export function TareaModal({ value, empleados, hoy, onChange, onClose, onSave }) {
  const stop = (e) => e.stopPropagation();
  const hasText = (input) => String(input || "").trim().length > 0;
  const canSave = hasText(value.titulo) && hasText(value.descripcion) && value.id_empleado_asignado && value.fecha_limite && value.fecha_limite >= hoy;
  const empleadosAsignables = empleados.filter((em) => em.id_rol !== 1);

  return (
    <ModalWrap onOverlayClick={onClose}>
      <div className="modal" onClick={stop}>
        <div className="modal-header">
          <div className="modal-title">Nueva Tarea</div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-group-m"><label>Título</label><input value={value.titulo} onChange={(ev) => onChange({ ...value, titulo: ev.target.value })} /></div>
        <div className="form-group-m"><label>Descripción</label><textarea rows={3} value={value.descripcion} onChange={(ev) => onChange({ ...value, descripcion: ev.target.value })} /></div>
        <div className="form-row">
          <div className="form-group-m">
            <label>Asignar a</label>
            <select value={value.id_empleado_asignado} onChange={(ev) => onChange({ ...value, id_empleado_asignado: ev.target.value })}>
              <option value="">—</option>
              {empleadosAsignables.map((em) => (
                <option key={em.id_empleado} value={em.id_empleado}>{em.nombre} {em.apellido}</option>
              ))}
            </select>
          </div>
          <div className="form-group-m"><label>Fecha límite</label><input type="date" min={hoy} value={value.fecha_limite} onChange={(ev) => onChange({ ...value, fecha_limite: ev.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group-m">
            <label>Prioridad</label>
            <select value={value.prioridad} onChange={(ev) => onChange({ ...value, prioridad: ev.target.value })}>
              {["baja", "normal", "alta", "urgente"].map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="form-group-m"><label>Categoría</label><input value={value.categoria} onChange={(ev) => onChange({ ...value, categoria: ev.target.value })} /></div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" disabled={!canSave} onClick={async () => { await onSave(value); onClose(); }}>Crear</button>
        </div>
      </div>
    </ModalWrap>
  );
}
