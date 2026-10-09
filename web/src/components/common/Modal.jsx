import { useEffect } from "react";

/** Accessible-enough modal: closes on Escape or backdrop click. */
const Modal = ({ title, onClose, children }) => {
  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && onClose();

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default Modal;
