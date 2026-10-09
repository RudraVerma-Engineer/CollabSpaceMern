import { useState } from "react";

import Modal from "./Modal.jsx";

/** A button that asks "are you sure?" before running `onConfirm`. */
const ConfirmButton = ({
  children,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  className = "btn btn-danger btn-sm",
}) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>

      {open && (
        <Modal title={title} onClose={() => setOpen(false)}>
          <p className="muted">{message}</p>
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger-solid"
              disabled={busy}
              onClick={handleConfirm}
            >
              {busy ? "Working…" : confirmLabel}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ConfirmButton;
