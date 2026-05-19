import React from "react";
import { ModalWrap } from "./ModalWrap.jsx";

export function NominaModal({ value, empleados = [], onChange, onClose, onSave }) {
  const stop = (e) => e.stopPropagation();
  const canSave = value.id_empleado && String(value.periodo || "").trim() && Number(value.salario_base) > 0;

  return (
    <ModalWrap onOverlayClick={onClose}>
      <div className="modal" onClick={stop}>
        <div className="modal-header"><div className="modal-title">Nómina manual</div><button type="button" className="modal-close" onClick={onClose}>✕</button></div>
        <div className="form-group-m">
          <label>Empleado</label>
          <select value={value.id_empleado} onChange={(ev) => onChange({ ...value, id_empleado: ev.target.value })}>
            <option value="">Seleccione un empleado</option>
            {empleados.map((em) => <option key={em.id_empleado} value={em.id_empleado}>{em.nombre} {em.apellido}</option>)}
          </select>
        </div>
        <div className="form-group-m"><label>Período</label><input type="month" value={value.periodo} onChange={(ev) => onChange({ ...value, periodo: ev.target.value })} /></div>
        <div className="form-row">
          <div className="form-group-m"><label>Salario base</label><input type="number" value={value.salario_base} onChange={(ev) => onChange({ ...value, salario_base: ev.target.value })} /></div>
          <div className="form-group-m"><label>Bonif.</label><input type="number" value={value.bonificaciones} onChange={(ev) => onChange({ ...value, bonificaciones: ev.target.value })} /></div>
        </div>
        <div className="form-group-m"><label>Deducciones</label><input type="number" value={value.deducciones} onChange={(ev) => onChange({ ...value, deducciones: ev.target.value })} /></div>
        <div className="form-help">Al ejecutar nómina automática, el sistema calcula una deducción base del 10% sobre el salario.</div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" disabled={!canSave} onClick={async () => { await onSave(value); onClose(); }}>Guardar</button>
        </div>
      </div>
    </ModalWrap>
  );
}
