import { Box } from "@mui/material";
import Image from "next/image";

export default function Icon(props: { path: string, size?: number, color?: string }) {
  const { path } = props;
  const size = props.size ?? 22;
  const color = props.color ?? "black";

  return (
      <img
        src={`/${path}.svg`}
        style={{
          objectFit: `contain`,
          width: `100%`,
          height: `100%`,
          // maxWidth: `100%`,
          // maxHeight: `100%`,
          overflow: `visible`,
        }}
      ></img>
  );
}