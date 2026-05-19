import { useState } from "react";

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const showToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  return { toasts, showToast };
}
