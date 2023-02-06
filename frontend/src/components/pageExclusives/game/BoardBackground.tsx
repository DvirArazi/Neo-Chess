import { THEME } from "frontend/src/pages/_app";
import { useEffect, useRef } from "react";
import { BOARD_SIDE } from "shared/tools/boardLayout";

export default function BoardBackground() {
  const resolution = 1000;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current == null) { return; }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = THEME.boardDark;
    for (let x = 0; x < BOARD_SIDE; x++) {
      for (let y = 0; y < BOARD_SIDE; y++) {
        if (x % 2 != y % 2 && x == 0 && y == 1) {
          ctx.fillRect(x * resolution, y * resolution, resolution, resolution);
        }
      }
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={BOARD_SIDE * resolution}
      height={BOARD_SIDE * resolution}
      style={{
        position: `absolute`,
        left: `0%`,
        background: THEME.boardLight,
        imageRendering: `pixelated`,
        width: `100%`,
        // height: `100%`,
      }}
    />
  );
}