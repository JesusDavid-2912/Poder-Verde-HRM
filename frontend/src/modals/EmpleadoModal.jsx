import React from "react";
import { useState } from "react";
import { ModalWrap } from "./ModalWrap.jsx";

const departamentos = ["Operaciones", "I+D", "Logística", "RRHH", "Sostenibilidad", "General"];

export function EmpleadoModal({ value, onChange, onClose, onSave }) {
  const stop = (e) => e.stopPropagation();
  const hasText = (input) => String(input || "").trim().length > 0;
  const canSave =
    hasText(value.nombre) &&
    hasText(value.apellido) &&
    hasText(value.email) &&
    hasText(value.puesto) &&
    hasText(value.departamento) &&
    Number(value.salario) > 0 &&
    hasText(value.password);

  return (
    <ModalWrap onOverlayClick={onClose}>
      <div className="modal" onClick={stop} onKeyDown={stop}>
        <div className="modal-header">
          <div className="modal-title">Nuevo Empleado</div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-row">
          <div className="form-group-m"><label>Nombre</label><input value={value.nombre} onChange={(ev) => onChange({ ...value, nombre: ev.target.value })} /></div>
          <div className="form-group-m"><label>Apellido</label><input value={value.apellido} onChange={(ev) => onChange({ ...value, apellido: ev.target.value })} /></div>
        </div>
        <div className="form-group-m"><label>Email</label><input type="email" value={value.email} onChange={(ev) => onChange({ ...value, email: ev.target.value })} /></div>
        <div className="form-row">
          <div className="form-group-m">
            <label>Depto</label>
            <select value={value.departamento} onChange={(ev) => onChange({ ...value, departamento: ev.target.value })}>
              {departamentos.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group-m"><label>Cargo</label><input value={value.puesto} onChange={(ev) => onChange({ ...value, puesto: ev.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group-m"><label>Salario</label><input type="number" value={value.salario} onChange={(ev) => onChange({ ...value, salario: ev.target.value })} /></div>
          <div className="form-group-m">
            <label>Rol</label>
            <select value={value.id_rol} onChange={(ev) => onChange({ ...value, id_rol: Number(ev.target.value) })}>
              <option value={2}>Empleado</option>
              <option value={1}>Admin</option>
            </select>
          </div>
        </div>
        <div className="form-group-m"><label>Contraseña inicial</label><input required value={value.password} onChange={(ev) => onChange({ ...value, password: ev.target.value })} /></div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-primary" disabled={!canSave} onClick={async () => { await onSave("create", value); onClose(); }}>Crear</button>
        </div>
      </div>
    </ModalWrap>
  );
}

export function EditarEmpleadoModal({ value, onChange, onClose, onSave }) {
  const stop = (e) => e.stopPropagation();
  if (!value) return null;
  const hasText = (input) => String(input || "").trim().length > 0;
  const canSave =
    hasText(value.nombre) &&
    hasText(value.apellido) &&
    hasText(value.email) &&
    hasText(value.puesto) &&
    hasText(value.departamento) &&
    Number(value.salario) > 0;

  return (
    <ModalWrap onOverlayClick={onClose}>
      <div className="modal" onClick={stop} onKeyDown={stop}>
        <div className="modal-header">
          <div className="modal-title">Editar Empleado</div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-row">
          <div className="form-group-m"><label>Nombre</label><input value={value.nombre} onChange={(ev) => onChange({ ...value, nombre: ev.target.value })} /></div>
          <div className="form-group-m"><label>Apellido</label><input value={value.apellido} onChange={(ev) => onChange({ ...value, apellido: ev.target.value })} /></div>
        </div>
        <div className="form-group-m"><label>Email</label><input value={value.email} onChange={(ev) => onChange({ ...value, email: ev.target.value })} /></div>
        <div className="form-row">
          <div className="form-group-m"><label>Depto</label><input value={value.departamento} onChange={(ev) => onChange({ ...value, departamento: ev.target.value })} /></div>
          <div className="form-group-m"><label>Cargo</label><input value={value.puesto} onChange={(ev) => onChange({ ...value, puesto: ev.target.value })} /></div>
        </div>
        <div className="form-group-m"><label>Salario</label><input type="number" value={value.salario} onChange={(ev) => onChange({ ...value, salario: ev.target.value })} /></div>
        <div className="form-group-m">
          <label>Estado</label>
          <select value={value.estado} onChange={(ev) => onChange({ ...value, estado: ev.target.value })}>
            <option value="activo">activo</option>
            <option value="inactivo">inactivo</option>
            <option value="bloqueado">bloqueado</option>
          </select>
        </div>
        <div className="form-group-m">
          <label>Rol</label>
          <select value={value.id_rol} onChange={(ev) => onChange({ ...value, id_rol: Number(ev.target.value) })}>
            <option value={2}>Empleado</option>
            <option value={1}>Admin</option>
          </select>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" disabled={!canSave} onClick={async () => { await onSave("update", value); onClose(); }}>Guardar</button>
        </div>
      </div>
    </ModalWrap>
  );
}

export function AccesoEmpleadoModal({ value, onChange, onClose, onSave, onResetPassword }) {
  const stop = (e) => e.stopPropagation();
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  if (!value) return null;
  const canReset = String(newPassword || "").trim().length > 0;

  return (
    <ModalWrap onOverlayClick={onClose}>
      <div className="modal" onClick={stop} onKeyDown={stop}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Control de Acceso</div>
            <div className="modal-subtitle">{value.nombre} {value.apellido}</div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-row">
          <div className="form-group-m">
            <label>Rol</label>
            <select value={value.id_rol} onChange={(ev) => onChange({ ...value, id_rol: Number(ev.target.value) })}>
              <option value={2}>Empleado</option>
              <option value={1}>Admin</option>
            </select>
          </div>
          <div className="form-group-m">
            <label>Estado</label>
            <select value={value.estado} onChange={(ev) => onChange({ ...value, estado: ev.target.value })}>
              <option value="activo">activo</option>
              <option value="inactivo">inactivo</option>
              <option value="bloqueado">bloqueado</option>
            </select>
          </div>
        </div>
        <div className="access-panel">
          <div className="access-panel-title">Restablecer contraseña</div>
          <div className="access-panel-copy">La contraseña actual no puede mostrarse por seguridad. Si el usuario la pierde, asigna una nueva.</div>
          <div className="form-group-m">
            <label>Nueva contraseña</label>
            <div className="input-action-row">
              <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(ev) => setNewPassword(ev.target.value)} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPassword((current) => !current)}>
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!canReset}
            onClick={async () => {
              await onResetPassword(value.id_empleado, newPassword);
              setNewPassword("");
              setShowPassword(false);
            }}
          >
            Restablecer contraseña
          </button>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={async () => { await onSave("update", value); onClose(); }}>Guardar acceso</button>
        </div>
      </div>
    </ModalWrap>
  );
}
