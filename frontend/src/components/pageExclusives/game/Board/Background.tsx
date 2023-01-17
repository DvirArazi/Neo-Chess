import { useEffect, useRef } from "react";
import { BOARD_SIDE } from "shared/globals";

export default function Background() {
  const resolution = 1;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current == null) { return; }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = color0;
    for (let x = 0; x < BOARD_SIDE; x++) {
      for (let y = 0; y < BOARD_SIDE; y++) {
        if (x % 2 != y % 2) {
          ctx.fillRect(x*resolution, y*resolution, resolution, resolution);
        }
      }
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={BOARD_SIDE*resolution}
      height={BOARD_SIDE*resolution}
      style={{
        position: `absolute`,
        left: `0%`,
        background: color1,
        imageRendering: `pixelated`,
        width: `100%`,
        height: `100%`,
      }}
    />
  );
}

const color0 = `lightblue`;
const color1 = `white`;