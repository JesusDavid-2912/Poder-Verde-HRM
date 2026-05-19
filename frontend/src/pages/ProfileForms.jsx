import React from "react";
import { useState } from "react";
import { apiPut, apiPost } from "../lib/api.js";

export function PerfilForm({ user, onSaved, onProfileUpdate, token, showToast }) {
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [apellido, setApellido] = useState(user?.apellido || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [direccion, setDireccion] = useState(user?.direccion || "");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!nombre.trim() || !apellido.trim()) {
          showToast("Nombre y apellido son requeridos", "error");
          return;
        }
        const r = await apiPut(
          "/api/me",
          { nombre, apellido, telefono, direccion },
          token
        );
        if (r.success === false) {
          showToast(r.message || "No se pudo actualizar el perfil", "error");
          return;
        }
        onProfileUpdate?.({ nombre, apellido, telefono, direccion });
        showToast("Perfil actualizado", "success");
        onSaved?.();
      }}
    >
      <div className="form-group-m">
        <label htmlFor="pf-nom">Nombre</label>
        <input id="pf-nom" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="form-group-m">
        <label htmlFor="pf-ape">Apellido</label>
        <input id="pf-ape" value={apellido} onChange={(e) => setApellido(e.target.value)} />
      </div>
      <div className="form-group-m">
        <label htmlFor="pf-tel">Teléfono</label>
        <input id="pf-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
      </div>
      <div className="form-group-m">
        <label htmlFor="pf-dir">Dirección</label>
        <input id="pf-dir" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
      </div>
      <button type="submit" className="btn btn-primary">Guardar Cambios</button>
    </form>
  );
}

export function PasswordForm({ token, showToast }) {
  const [c, setC] = useState("");
  const [n, setN] = useState("");
  const [n2, setN2] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!c || !n || !n2) return showToast("Completa todos los campos", "error");
        if (n !== n2) return showToast("Las contraseñas no coinciden", "error");
        const r = await apiPost("/api/me/password", { current: c, next: n }, token);
        if (r.success) showToast("Contraseña actualizada", "success");
        else showToast(r.message || "Error", "error");
      }}
    >
      <div className="form-group-m">
        <label>Contraseña actual</label>
        <input type="password" value={c} onChange={(e) => setC(e.target.value)} />
      </div>
      <div className="form-group-m">
        <label>Contraseña nueva</label>
        <input type="password" value={n} onChange={(e) => setN(e.target.value)} />
      </div>
      <div className="form-group-m">
        <label>Confirmar contraseña</label>
        <input type="password" value={n2} onChange={(e) => setN2(e.target.value)} />
      </div>
      <button type="submit" className="btn btn-secondary">Cambiar contraseña</button>
    </form>
  );
}
