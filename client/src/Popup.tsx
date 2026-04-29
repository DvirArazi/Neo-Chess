import { useEffect, useState, type ReactNode } from "react";

const POPUP_ANIMATION_MS = 220;

type PopupProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
  closeOnBackdropPress?: boolean;
};

export function Popup(props: PopupProps) {
  const [shouldRender, setShouldRender] = useState(props.open);
  const [isVisible, setIsVisible] = useState(false);
  const [displayedContent, setDisplayedContent] = useState(() => ({
    title: props.title,
    children: props.children,
    actions: props.actions,
  }));

  useEffect(() => {
    if (props.open) {
      setDisplayedContent({
        title: props.title,
        children: props.children,
        actions: props.actions,
      });
      setIsVisible(false);
      setShouldRender(true);
      let secondAnimationFrameId: number | null = null;
      const firstAnimationFrameId = requestAnimationFrame(() => {
        secondAnimationFrameId = requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => {
        cancelAnimationFrame(firstAnimationFrameId);
        if (secondAnimationFrameId !== null) {
          cancelAnimationFrame(secondAnimationFrameId);
        }
      };
    }

    setIsVisible(false);
    const timeoutId = window.setTimeout(() => {
      setShouldRender(false);
    }, POPUP_ANIMATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [props.open, props.title, props.children, props.actions]);

  if (!shouldRender) return null;

  return (
    <div
      className={[
        "popup-backdrop",
        props.closeOnBackdropPress ? "popup-backdrop--dismissible" : "",
        isVisible ? "popup--visible" : "popup--hidden",
      ].join(" ")}
      onClick={(event) => {
        if (
          event.target === event.currentTarget &&
          props.closeOnBackdropPress &&
          props.onClose
        ) {
          props.onClose();
        }
      }}
    >
      <section
        className={[
          "popup",
          props.closeOnBackdropPress ? "popup--opaque" : "",
        ].join(" ")}
        role="dialog"
        aria-modal="false"
        aria-label={displayedContent.title}
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
        <h2 className="popup__title">{displayedContent.title}</h2>
        <div className="popup__body">{displayedContent.children}</div>
        {displayedContent.actions
          ? <div className="popup__actions">{displayedContent.actions}</div>
          : null}
      </section>
    </div>
  );
}
