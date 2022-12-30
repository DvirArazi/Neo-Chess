import { useEffect, useRef } from "react";

export default function Background(props: { side: number }) {
  const { side } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current == null) { return; }

    const canvas = canvasRef.current;
    canvas.style.imageRendering = "pixelated";
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color0;
    for (let x = 0; x < side; x++) {
      for (let y = 0; y < side; y++) {
        if (x % 2 != y % 2) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={side}
      height={side}
      style={{
        background: color1,

        width: `100%`,
        height: `100%`,
        transformOrigin: `50% 50%`
      }}
    />
  );
}

const color0 = `lightblue`;
const color1 = `white`;