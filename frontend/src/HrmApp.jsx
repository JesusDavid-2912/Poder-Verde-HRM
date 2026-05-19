import React from "react";
import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, API_URL, apiPostForm } from "./lib/api.js";
import { LoginScreen } from "./components/layout/LoginScreen.jsx";
import { Topbar } from "./components/layout/Topbar.jsx";
import { Sidebar } from "./components/layout/Sidebar.jsx";
import { Toasts } from "./components/feedback/Toasts.jsx";
import { ConfirmDialog } from "./components/feedback/ConfirmDialog.jsx";
import { useToasts } from "./hooks/useToasts.js";
import { AllPages } from "./views/AllPages.jsx";
import { ModalsHrm } from "./views/ModalsHrm.jsx";
import { monthValueToPeriodo, todayLocal } from "./lib/utils.js";

export default function HrmApp() {
  const hoy = todayLocal();
  const [token, setToken] = useState(localStorage.getItem("pv_token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pv_user") || "null");
    } catch {
      return null;
    }
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [page, setPage] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [editingEmp, setEditingEmp] = useState(null);
  const { toasts, showToast } = useToasts();
  const [confirm, setConfirm] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [tareasPorEstado, setTareasPorEstado] = useState({ pendiente: [], en_progreso: [], finalizada: [] });
  const [tareas, setTareas] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [nominas, setNominas] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [reportes, setReportes] = useState([]);

  const isAdmin = user?.id_rol === 1;
  const stats = {
    empActivos: empleados.filter((e) => e.estado === "activo").length,
    permPend: permisos.filter((p) => p.estado === "pendiente").length
  };

  const assertSuccess = (response, fallback) => {
    if (!response || response.success === false) {
      const message = response?.message || fallback;
      showToast(message, "error");
      throw new Error(message);
    }
    return response;
  };

  const reload = useCallback(async () => {
    if (!token || !user) return;
    try {
      if (user.id_rol === 1) {
        const e = await apiGet("/api/empleados", token);
        setEmpleados(e.data || []);
        const pt = await apiGet("/api/tareas?action=por_estado", token);
        setTareasPorEstado(pt.data || { pendiente: [], en_progreso: [], finalizada: [] });
        const tr = await apiGet("/api/tareas?action=read", token);
        setTareas(tr.data || []);
        const a = await apiGet(`/api/asistencias?action=general&fecha=${hoy}`, token);
        setAsistencias(a.data || []);
        const p = await apiGet("/api/permisos?action=read", token);
        setPermisos(p.data || []);
        const n = await apiGet("/api/nomina?action=read", token);
        setNominas(n.data || []);
        const d = await apiGet("/api/documentos?action=read", token);
        setDocumentos(d.data || []);
        const r = await apiGet("/api/reportes?action=read", token);
        setReportes(r.data || []);
      } else {
        const tr = await apiGet(`/api/tareas?action=empleado&id_empleado=${user.id_empleado}`, token);
        const list = tr.data || [];
        setTareas(list);
        const g = { pendiente: [], en_progreso: [], finalizada: [] };
        list.forEach((x) => {
          if (g[x.estado]) g[x.estado].push(x);
        });
        setTareasPorEstado(g);
        const mes = String(new Date().getMonth() + 1);
        const anio = String(new Date().getFullYear());
        const a = await apiGet(`/api/asistencias?action=mes&id_empleado=${user.id_empleado}&mes=${mes}&anio=${anio}`, token);
        setAsistencias(a.data || []);
        const p = await apiGet(`/api/permisos?action=empleado&id_empleado=${user.id_empleado}`, token);
        setPermisos(p.data || []);
        const n = await apiGet("/api/nomina?action=read", token);
        setNominas(n.data || []);
        const d = await apiGet("/api/documentos?action=read", token);
        setDocumentos(d.data || []);
        setEmpleados([]);
      }
    } catch (err) {
      if (err?.message === "UNAUTHORIZED") {
        setToken(null);
        setUser(null);
      }
    }
  }, [token, user, hoy]);

  useEffect(() => {
    reload();
  }, [reload]);

  const showPage = (p) => {
    if (user && user.id_rol !== 1 && ["directorio", "configuracion", "reportes"].includes(p)) {
      showToast("Acceso restringido para tu nivel de usuario", "error");
      return;
    }
    setPage(p);
  };

  const doLogin = async () => {
    if (!email || !password) {
      showToast("Correo y contraseña son requeridos", "error");
      return;
    }
    try {
      const r = await apiPost("/api/login", { email, password });
      if (!r.success) {
        showToast(r.message || "Correo o contraseña incorrectos", "error");
        return;
      }
      localStorage.setItem("pv_token", r.token);
      localStorage.setItem("pv_user", JSON.stringify(r.user));
      setToken(r.token);
      setUser(r.user);
      setPage("dashboard");
      showToast("Bienvenido al ecosistema Poder Verde", "success");
    } catch {
      showToast("Correo o contraseña incorrectos", "error");
    }
  };

  const doLogout = () => {
    setConfirm({
      title: "¿Cerrar sesión?",
      msg: "Se cerrará tu sesión actual.",
      onOk: () => {
        localStorage.removeItem("pv_token");
        localStorage.removeItem("pv_user");
        setToken(null);
        setUser(null);
        setConfirm(null);
        showToast("Sesión cerrada correctamente", "info");
      }
    });
  };

  const openModal = (m, data) => {
    setEditingEmp(data || null);
    setModal(m);
  };

  const closeModal = () => {
    setModal(null);
    setEditingEmp(null);
  };

  const onSaveEmpleado = async (action, body) => {
    if (action === "create") {
      const r = await apiPost(
        "/api/empleados?action=create",
        {
          nombre: body.nombre,
          apellido: body.apellido,
          email: body.email,
          telefono: body.telefono || "",
          direccion: body.direccion || "",
          fecha_nacimiento: null,
          puesto: body.puesto,
          departamento: body.departamento,
          salario: body.salario,
          fecha_ingreso: body.fecha_ingreso || hoy,
          estado: "activo",
          id_rol: body.id_rol,
          password: body.password
        },
        token
      );
      assertSuccess(r, "No se pudo crear el empleado");
    } else {
      const r = await apiPost(
        "/api/empleados?action=update",
        {
          id_empleado: body.id_empleado,
          nombre: body.nombre,
          apellido: body.apellido,
          email: body.email,
          telefono: body.telefono,
          direccion: body.direccion,
          fecha_nacimiento: null,
          puesto: body.puesto,
          departamento: body.departamento,
          salario: body.salario,
          fecha_ingreso: body.fecha_ingreso,
          estado: body.estado,
          id_rol: body.id_rol
        },
        token
      );
      assertSuccess(r, "No se pudo actualizar el empleado");
    }
    showToast("Empleado guardado", "success");
    reload();
  };

  const onResetEmpleadoPassword = async (id, nextPassword) => {
    const r = await apiPost("/api/empleados?action=reset_password", { id_empleado: id, password: nextPassword }, token);
    assertSuccess(r, "No se pudo restablecer la contraseña");
    showToast("Contraseña restablecida", "success");
  };

  const onDeleteEmpleado = (id) => {
    setConfirm({
      title: "¿Eliminar empleado?",
      msg: "Esta acción no se puede deshacer.",
      onOk: async () => {
        const r = await apiPost("/api/empleados?action=delete", { id_empleado: id }, token);
        assertSuccess(r, "No se pudo eliminar el empleado");
        setConfirm(null);
        showToast("Eliminado", "info");
        reload();
      }
    });
  };

  const onSaveTarea = async (t) => {
    const r = await apiPost(
      "/api/tareas?action=create",
      {
        titulo: t.titulo,
        descripcion: t.descripcion,
        id_empleado_asignado: t.id_empleado_asignado || null,
        fecha_limite: t.fecha_limite,
        prioridad: t.prioridad,
        categoria: t.categoria,
        estado: "pendiente",
        progreso: 0
      },
      token
    );
    assertSuccess(r, "No se pudo crear la tarea");
    showToast("Tarea creada", "success");
    reload();
  };

  const onTareaAccion = async (t, estado, progreso) => {
    const r = await apiPost("/api/tareas?action=update_estado", { id_tarea: t.id_tarea, estado, progreso }, token);
    assertSuccess(r, "No se pudo actualizar la tarea");
    showToast("Tarea actualizada", "success");
    reload();
  };

  const onSaveNomina = async (n) => {
    const r = await apiPost(
      "/api/nomina?action=create",
      {
        id_empleado: n.id_empleado,
        periodo: monthValueToPeriodo(n.periodo),
        salario_base: n.salario_base,
        bonificaciones: n.bonificaciones,
        deducciones: n.deducciones,
        estado: "pendiente",
        fecha_proceso: hoy
      },
      token
    );
    assertSuccess(r, "No se pudo guardar la nómina");
    showToast("Nómina guardada", "success");
    reload();
  };

  const onPagarNomina = async (id) => {
    const r = await apiPost("/api/nomina?action=update_estado", { id_nomina: id, estado: "pagada", fecha_pago: hoy }, token);
    assertSuccess(r, "No se pudo actualizar la nómina");
    showToast("Estado de nómina actualizado", "success");
    reload();
  };

  const onProcesarNomina = () => {
    setConfirm({
      title: "¿Ejecutar nueva nómina?",
      msg: "Se generarán registros para empleados activos.",
      onOk: async () => {
        const r = await apiPost("/api/nomina?action=procesar", { periodo: monthValueToPeriodo(hoy.slice(0, 7)) }, token);
        assertSuccess(r, "No se pudo procesar la nómina");
        setConfirm(null);
        showToast("Nómina procesada", "success");
        reload();
      }
    });
  };

  const onSaveAsist = async (a) => {
    const r = await apiPost(
      "/api/asistencias?action=registrar",
      {
        id_empleado: a.id_empleado || user.id_empleado,
        fecha: a.fecha,
        hora_entrada: a.hora_entrada,
        hora_salida: a.hora_salida
      },
      token
    );
    assertSuccess(r, "No se pudo registrar la asistencia");
    showToast("Asistencia registrada", "success");
    reload();
  };

  const onSavePerm = async (p) => {
    const idEmp = isAdmin && p.id_empleado ? Number(p.id_empleado) : user.id_empleado;
    const r = await apiPost(
      "/api/permisos?action=create",
      { id_empleado: idEmp, tipo: p.tipo, fecha_inicio: p.fecha_inicio, fecha_fin: p.fecha_fin, motivo: p.motivo },
      token
    );
    assertSuccess(r, "No se pudo enviar la solicitud");
    showToast("Solicitud enviada", "success");
    reload();
  };

  const onPermEstado = async (id, est) => {
    const r = await apiPost("/api/permisos?action=update_estado", { id_permiso: id, estado: est }, token);
    assertSuccess(r, "No se pudo actualizar el permiso");
    showToast("Permiso actualizado", "success");
    reload();
  };

  const onDeletePerm = async (id) => {
    const r = await apiPost("/api/permisos?action=delete", { id_permiso: id }, token);
    assertSuccess(r, "No se pudo eliminar el permiso");
    showToast("Eliminado", "info");
    reload();
  };

  const onDeleteDoc = async (id) => {
    const r = await fetch(`${API_URL}/api/documentos/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id_documento: id })
    });
    const body = await r.json().catch(() => ({}));
    if (r.ok && body.success !== false) {
      showToast("Documento eliminado", "info");
      reload();
    } else showToast(body.message || "Error al eliminar", "error");
  };

  const getDownloadFileName = (response, fallback) => {
    const disposition = response.headers.get("content-disposition") || "";
    const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    const regularMatch = disposition.match(/filename="?([^";]+)"?/i);
    if (encodedMatch?.[1]) return decodeURIComponent(encodedMatch[1]);
    return regularMatch?.[1] || fallback;
  };

  const onExportNominaPdf = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reportes/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al generar PDF");
      }

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/pdf")) {
        throw new Error("La respuesta no es un PDF válido");
      }

      const blob = await response.blob();

      const u = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = u;
      a.download = getDownloadFileName(response, "reporte_poder_verde.pdf");

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(u);

      showToast("PDF generado correctamente", "success");
    } catch (error) {
      console.error(error);
      showToast("Error al generar PDF", "error");
    }
  };

  const onGenerarReporte = async (tipo, opciones = {}) => {
    const periodoActual = monthValueToPeriodo(hoy.slice(0, 7));
    const body = {
      tipo,
      fecha_inicio: opciones.fecha_inicio || hoy,
      fecha_fin: opciones.fecha_fin || hoy,
      periodo: monthValueToPeriodo(opciones.periodo || periodoActual)
    };
    const r = await apiPost("/api/reportes?action=generar", body, token);
    if (r.success !== false) showToast("Reporte generado y guardado", "success");
    else showToast("Error al generar", "error");
    reload();
  };

  const onUploadDocument = async ({ file, id_empleado }) => {
    const fd = new FormData();
    fd.append("archivo", file);
    if (isAdmin && id_empleado) fd.append("id_empleado", id_empleado);
    const r = await apiPostForm("/api/documentos?action=subir", fd, token);
    if (r.success) {
      showToast("Documento subido", "success");
      reload();
      return r;
    }
    showToast(r.message || "Error al subir", "error");
    throw new Error(r.message || "Error al subir");
  };

  const descargarDoc = (id) => {
    const u = `${API_URL}/api/documentos?action=descargar&id_documento=${id}`;
    fetch(u, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return {
          blob: await r.blob(),
          filename: getDownloadFileName(r, "documento")
        };
      })
      .then(({ blob, filename }) => {
        const o = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = o;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(o);
      })
      .catch(() => showToast("Error al descargar", "error"));
  };

  const exportarReporteJson = (id) => {
    const u = `${API_URL}/api/reportes?action=exportar&id_reporte=${id}`;
    fetch(u, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return {
          blob: await r.blob(),
          filename: getDownloadFileName(r, "reporte.json")
        };
      })
      .then(({ blob, filename }) => {
        const o = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = o;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(o);
      })
      .catch(() => showToast("Error al exportar reporte", "error"));
  };

  const exportarReportePdf = (id) => {
    const u = `${API_URL}/api/reportes?action=exportar_pdf&id_reporte=${id}`;
    fetch(u, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return {
          blob: await r.blob(),
          filename: getDownloadFileName(r, "reporte.pdf")
        };
      })
      .then(({ blob, filename }) => {
        const o = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = o;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(o);
      })
      .catch(() => showToast("Error al exportar reporte PDF", "error"));
  };

  if (!token || !user) {
    return (
      <>
        <LoginScreen
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onLogin={doLogin}
        />
        <Toasts toasts={toasts} />
      </>
    );
  }

  return (
    <div id="app-shell" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Topbar user={user} isAdmin={isAdmin} onShowPage={showPage} />
      <div className="app-body">
        <Sidebar page={page} isAdmin={isAdmin} onShowPage={showPage} onLogout={doLogout} />
        <AllPages
          page={page}
          isAdmin={isAdmin}
          user={user}
          empleados={empleados}
          tareasPorEstado={tareasPorEstado}
          tareas={tareas}
          asistencias={asistencias}
          permisos={permisos}
          nominas={nominas}
          documentos={documentos}
          reportes={reportes}
          stats={stats}
          onShowPage={showPage}
          showToast={showToast}
          openModal={openModal}
          token={token}
          onTareaAccion={onTareaAccion}
          onPermEstado={onPermEstado}
          onDeletePerm={onDeletePerm}
          onPagarNomina={onPagarNomina}
          onProcesarNomina={onProcesarNomina}
          onDeleteDoc={onDeleteDoc}
          onDeleteEmpleado={onDeleteEmpleado}
          descargarDoc={descargarDoc}
          onExportNominaPdf={onExportNominaPdf}
          onGenerarReporte={onGenerarReporte}
          onUploadDocument={onUploadDocument}
          onExportReporteJson={exportarReporteJson}
          onExportReportePdf={exportarReportePdf}
          reload={reload}
          onProfileUpdate={(updatedUser) => {
            const nextUser = { ...user, ...updatedUser };
            localStorage.setItem("pv_user", JSON.stringify(nextUser));
            setUser(nextUser);
          }}
        />
      </div>
      <ModalsHrm
        modal={modal}
        onClose={closeModal}
        empleados={empleados}
        onSaveEmpleado={onSaveEmpleado}
        onSaveTarea={onSaveTarea}
        onSaveNomina={onSaveNomina}
        onSaveAsist={onSaveAsist}
        onSavePerm={onSavePerm}
        onResetEmpleadoPassword={onResetEmpleadoPassword}
        editingEmp={editingEmp}
        hoy={hoy}
        user={user}
        isAdmin={isAdmin}
      />
      <Toasts toasts={toasts} />
      <ConfirmDialog confirm={confirm} onCancel={() => setConfirm(null)} />
    </div>
  );
}
