import { Paper } from "@mui/material";
import { Box, BoxTypeMap, SxProps, width } from "@mui/system";
import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";

export default function OctagonPicker() {

  //[height]
  const [height, setHeight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setHeight(boxRef.current.getBoundingClientRect().height / 3);
  });

  const [beta, setBeta] = useState(0);

  const children: React.ReactNode[] = [];

  const sides = 5;
  const hAlpha = Math.PI / sides;
  const r = height / (2 * Math.tan(hAlpha));
  const crdbh = 1 / (2 * Math.sin(hAlpha)); //circular radius devided by height

  const addChild = (i: number) => {
    const iAlpha = i * 2 * hAlpha;
    const a = crdbh * (
      Math.sin(beta + hAlpha + iAlpha) -
      Math.sin(beta - hAlpha + iAlpha)
    );
    const b = r * Math.sin(beta + iAlpha);
    console.log(height);

    return (
      <Box
        sx={{
          background: `rgba(0, 0, 255, 0.5)`,
          width: `70px`,
          height: `55px`,

          transform: `translate(0, ${b - height * i}px) scale(1, ${a})`,
          transition: `transform 0.1s ease-out`,
        }}
      >
        Lorem
      </Box>
    );
  }

  return <Box component="div"
    ref={boxRef}
    tabIndex={10}
    onKeyDown={(e: React.KeyboardEvent) => {
      if (e.key == "ArrowUp")
        setBeta(beta - 0.1);
      else {
        setBeta(beta + 0.1);
      }
    }}
  >
    {
      [-1, 0, 1].map((i) => addChild(i))
    }
  </Box>
}