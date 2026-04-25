import type { ReactNode } from "react";

type PopupProps = {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
};

export function Popup(props: PopupProps) {
  return (
    <section
      className="popup"
      role="dialog"
      aria-modal="false"
      aria-label={props.title}
    >
      {props.onClose
        ? (
          <button
            type="button"
            className="popup__close"
            aria-label="Close popup"
            onClick={props.onClose}
          >
            x
          </button>
        )
        : null}
      <h2 className="popup__title">{props.title}</h2>
      <div className="popup__body">{props.children}</div>
      {props.actions ? <div className="popup__actions">{props.actions}</div> : null}
    </section>
  );
}
