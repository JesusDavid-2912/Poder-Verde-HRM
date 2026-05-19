import React from "react";
import { useEffect, useState } from "react";
import { AccesoEmpleadoModal, EmpleadoModal, EditarEmpleadoModal } from "../modals/EmpleadoModal.jsx";
import { TareaModal } from "../modals/TareaModal.jsx";
import { NominaModal } from "../modals/NominaModal.jsx";
import { AsistenciaModal } from "../modals/AsistenciaModal.jsx";
import { PermisoModal } from "../modals/PermisoModal.jsx";

export function ModalsHrm({
  modal,
  onClose,
  empleados,
  onSaveEmpleado,
  onSaveTarea,
  onSaveNomina,
  onSaveAsist,
  onSavePerm,
  onResetEmpleadoPassword,
  editingEmp,
  hoy,
  isAdmin
}) {
  const [eEmp, setEEmp] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    departamento: "Operaciones",
    puesto: "",
    salario: "",
    fecha_ingreso: hoy,
    id_rol: 2,
    password: ""
  });
  const [eEdit, setEEdit] = useState(null);
  const [t, setT] = useState({ titulo: "", descripcion: "", id_empleado_asignado: "", fecha_limite: hoy, prioridad: "normal", categoria: "Investigación" });
  const [n, setN] = useState({ id_empleado: "", periodo: hoy.slice(0, 7), salario_base: "", bonificaciones: 0, deducciones: 0 });
  const [a, setA] = useState({ id_empleado: "", fecha: hoy, hora_entrada: "08:00", hora_salida: "17:00" });
  const [p, setP] = useState({ id_empleado: "", tipo: "Médico", fecha_inicio: hoy, fecha_fin: hoy, motivo: "" });

  useEffect(() => {
    if (editingEmp && ["editar-emp", "acceso"].includes(modal)) {
      setEEdit({
        id_empleado: editingEmp.id_empleado,
        nombre: editingEmp.nombre,
        apellido: editingEmp.apellido,
        email: editingEmp.email,
        telefono: editingEmp.telefono,
        direccion: editingEmp.direccion,
        departamento: editingEmp.departamento,
        puesto: editingEmp.puesto,
        salario: editingEmp.salario,
        fecha_ingreso: (editingEmp.fecha_ingreso || "").slice(0, 10),
        estado: editingEmp.estado,
        id_rol: editingEmp.id_rol
      });
    }
  }, [editingEmp, modal]);

  if (!modal) return null;

  if (modal === "empleado") {
    return (
      <EmpleadoModal
        value={eEmp}
        onChange={setEEmp}
        onClose={onClose}
        onSave={onSaveEmpleado}
      />
    );
  }

  if (modal === "editar-emp") {
    return (
      <EditarEmpleadoModal
        value={eEdit}
        onChange={setEEdit}
        onClose={onClose}
        onSave={onSaveEmpleado}
      />
    );
  }

  if (modal === "tarea") {
    return (
      <TareaModal
        value={t}
        empleados={empleados}
        hoy={hoy}
        onChange={setT}
        onClose={onClose}
        onSave={onSaveTarea}
      />
    );
  }

  if (modal === "nomina") {
    return (
      <NominaModal
        value={n}
        empleados={empleados}
        onChange={setN}
        onClose={onClose}
        onSave={onSaveNomina}
      />
    );
  }

  if (modal === "asistencia") {
    return (
      <AsistenciaModal
        value={a}
        empleados={empleados}
        isAdmin={isAdmin}
        hoy={hoy}
        onChange={setA}
        onClose={onClose}
        onSave={onSaveAsist}
      />
    );
  }

  if (modal === "permiso") {
    return (
      <PermisoModal
        value={p}
        empleados={empleados}
        isAdmin={isAdmin}
        hoy={hoy}
        onChange={setP}
        onClose={onClose}
        onSave={onSavePerm}
      />
    );
  }

  if (modal === "acceso") {
    return (
      <AccesoEmpleadoModal
        value={eEdit}
        onChange={setEEdit}
        onClose={onClose}
        onSave={onSaveEmpleado}
        onResetPassword={onResetEmpleadoPassword}
      />
    );
  }

  return null;
}
