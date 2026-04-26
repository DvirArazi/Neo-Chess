type ButtonGroupItem = {
  text: string;
  subtext: string;
  onClick: () => void;
};

type ButtonGroupProps = {
  items: ButtonGroupItem[];
};

export function ButtonGroup(props: ButtonGroupProps) {
  return (
    <div className="button-group" role="group">
      {props.items.map((item) => (
        <button
          key={`${item.text}-${item.subtext}`}
          type="button"
          className="button-group__button"
          onClick={item.onClick}
        >
          <span className="button-group__text">{item.text}</span>
          <span className="button-group__subtext">{item.subtext}</span>
        </button>
      ))}
    </div>
  );
}
