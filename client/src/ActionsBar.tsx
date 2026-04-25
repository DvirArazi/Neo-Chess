export type ActionsBar = {
  iconSrc: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type ActionsBarProps = {
  actions: ActionsBar[];
};

export function ActionsBar(props: ActionsBarProps) {
  return (
    <nav
      className="playback-controls"
      aria-label="Game controls"
      style={{
        gridTemplateColumns: `repeat(${props.actions.length}, minmax(0, 1fr))`,
      }}
    >
      {props.actions.map((action) => (
        <button
          key={action.label}
          type="button"
          className="playback-controls__button"
          onClick={action.onClick}
          disabled={action.disabled}
          aria-label={action.label}
          title={action.label}
        >
          <img
            className="playback-controls__icon"
            src={action.iconSrc}
            alt=""
          />
        </button>
      ))}
    </nav>
  );
}
