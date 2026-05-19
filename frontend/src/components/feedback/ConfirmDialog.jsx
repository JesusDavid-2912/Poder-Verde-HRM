import React from "react";

export function ConfirmDialog({ confirm, onCancel }) {
  if (!confirm) return null;

  return (
    <div className="confirm-overlay open" role="presentation" onClick={onCancel}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-title">{confirm.title}</div>
        <div className="confirm-msg">{confirm.msg}</div>
        <div className="confirm-btns">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn btn-danger" onClick={confirm.onOk}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}
