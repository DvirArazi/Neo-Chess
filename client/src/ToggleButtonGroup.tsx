export type ToggleButtonGroupItem = {
  label: string;
  value: string;
};

type ToggleButtonGroupProps = {
  items: ToggleButtonGroupItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
};

export function ToggleButtonGroup(props: ToggleButtonGroupProps) {
  return (
    <div
      className="toggle-button-group"
      role="group"
      aria-label={props.ariaLabel}
    >
      {props.items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={[
            "toggle-button-group__button",
            item.value === props.value
              ? "toggle-button-group__button--selected"
              : "",
          ].filter(Boolean).join(" ")}
          aria-pressed={item.value === props.value}
          onClick={() => props.onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
