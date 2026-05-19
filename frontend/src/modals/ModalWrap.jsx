import React from "react";

export function ModalWrap({ onOverlayClick, children }) {
  return (
    <div className="modal-overlay open" role="presentation" onClick={onOverlayClick}>
      {children}
    </div>
  );
}
