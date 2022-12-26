export default function Icon(props: { path: string, size?: number, color?: string }) {
  const { path } = props;
  const size = props.size ?? 22;
  const color = props.color ?? "black";

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        WebkitMask: `url(${path}.svg) no-repeat center`,
        WebkitMaskSize: `${size}px`,
      }}
    />
  );
}