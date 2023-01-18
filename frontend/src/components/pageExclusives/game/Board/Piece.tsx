import { Box, createTheme } from "@mui/material";
import { PieceData } from "shared/types/piece";
import Draggable, { ControlPosition } from "react-draggable";
import { Point } from "shared/types/game";
import { useRef } from "react";
import Icon from "frontend/src/components/Icon";
import Stateful from "frontend/src/utils/tools/stateful";
import { pieceDataToIconName } from "shared/tools/piece";
import { BOARD_SIDE, SQUARE_SIZE } from "shared/tools/boardLayout";

export default function Piece(props: {
  data: PieceData,
  index: number,
  isEnabled: boolean,
  slide: boolean,
  onStart: () => void,
  onEnd: () => void,
}) {
  const { data, isEnabled, index, slide, onStart, onEnd } = props;

  const mouseDownTime = new Stateful(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const fracPosition: Point = {
    x: index % BOARD_SIDE * SQUARE_SIZE,
    y: Math.floor(index / BOARD_SIDE) * SQUARE_SIZE,
  };

  return (
    <Draggable nodeRef={boxRef}
      disabled={!isEnabled}
      position={{ x: 0, y: 0 }}
      onStart={(e) => {
        e.stopPropagation();
        mouseDownTime.set(new Date().getTime());
        onStart();
      }}
      onStop={(e) => {
        e.stopPropagation();
        const timePassed = new Date().getTime() - mouseDownTime.value;
        if (timePassed < 300) return;

        onEnd();
      }}
    >
      <Box ref={boxRef}
        sx={{
          position: `absolute`,
          left: `${fracPosition.x}%`,
          top: `${fracPosition.y}%`,
          width: `${SQUARE_SIZE}%`,
          height: `${SQUARE_SIZE}%`,
          zIndex: `10`,
          ":hover": {
            cursor: `${isEnabled ? `pointer` : `default`}`,
          },
          ":active": {
            zIndex: `20`,
          },
          transition: `${slide ? `left 0.3s, top 0.3s` : `none`}`,
        }}
      >
        <Icon path={`chess/${pieceDataToIconName(data)}`} />
      </Box>
    </Draggable>
  );
}