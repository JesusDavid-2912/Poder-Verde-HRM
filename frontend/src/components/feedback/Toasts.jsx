import React from "react";

export function Toasts({ toasts }) {
  return (
    <div className="toast-container" style={{ position: "fixed", top: 72, right: 20, zIndex: 300 }}>
      {toasts.map((t) => (
        <div key={t.id} className={`toast${t.type === "error" ? " error" : t.type === "warning" ? " warning" : ""}`}>{t.msg}</div>
      ))}
    </div>
  );
}
