import { Box, createTheme } from "@mui/material";
import { PieceData } from "shared/types/piece";
import Draggable, { DraggableCore, DraggableEvent } from "react-draggable";
import { Point } from "shared/types/game";
import { useEffect, useRef } from "react";
import Icon from "frontend/src/components/Icon";
import Stateful from "frontend/src/utils/tools/stateful";
import { pieceDataToIconName } from "shared/tools/piece";
import { BOARD_SIDE, SQUARE_SIZE } from "shared/tools/boardLayout";
import { isMobile } from "react-device-detect";

export default function Piece(props: {
  data: PieceData,
  index: number,
  isEnabled: boolean,
  slide: boolean,
  isFlipped: boolean,
  onStart: (globalPos: Point) => void,
  onEnd: (globalPos: Point) => void,
}) {
  const { data, isEnabled, index, slide, isFlipped, onStart, onEnd } = props;

  const mouseDownTime = new Stateful(0);
  const draggableRef = useRef<HTMLDivElement>(null);
  const flipTurns = new Stateful(0);

  useEffect(() => {
    if (
      isFlipped && flipTurns.value * 2 % 2 === 0 ||
      !isFlipped && flipTurns.value * 2 % 2 !== 0
    ) {
      flipTurns.set((v) => v + 0.5)
    }
  }, [isFlipped]);

  const relPos: Point = {
    x: index % BOARD_SIDE * SQUARE_SIZE,
    y: Math.floor(index / BOARD_SIDE) * SQUARE_SIZE,
  };

  return (
    <Draggable nodeRef={draggableRef}
      disabled={!isEnabled}
      position={{ x: 0, y: 0 }}
      onStart={(e) => {
        e.stopPropagation();

        const gPos = getGlobalPos(e);
        if (gPos === null) return;

        mouseDownTime.set(new Date().getTime());
        onStart(gPos);
      }}
      onStop={(e) => {
        e.stopPropagation();

        const gPos = getGlobalPos(e);
        if (gPos === null) return;

        const timePassed = new Date().getTime() - mouseDownTime.value;
        if (timePassed < 300) return;

        onEnd(gPos);
      }}
    >
      {!isMobile ? getInnerPC() : getInnerMobile()}
    </Draggable>
  );

  function getInnerPC() {
    return <Box ref={draggableRef}
      sx={{
        position: `absolute`,
        left: `${relPos.x}%`,
        top: `${relPos.y}%`,
        width: `${SQUARE_SIZE}%`,
        height: `${SQUARE_SIZE}%`,
        zIndex: `10`,
        willChange: `transform`,
        transition: slide ? `left 0.3s, top 0.3s ease-out` : `none`,
        ":hover": {
          cursor: `${isEnabled ? `pointer` : `default`}`,
        },
        ":active": {
          zIndex: `20`,
        },
      }}
    >
      <Box sx={{
        transform: `rotate(${flipTurns.value}turn)`,
        willChange: `transform`,
        transition: `transform 0.3s`,
      }}>
        <Icon name={pieceDataToIconName(data)} />
      </Box>
    </Box>
  }

  function getInnerMobile() {
    return <Box ref={draggableRef}
      sx={{
        position: `absolute`,
        // left: `${relPos.x}%`,
        // top: `${relPos.y}%`,
        width: `${SQUARE_SIZE}%`,
        height: `${SQUARE_SIZE}%`,
        zIndex: `10`,
        ":hover": {
          cursor: `${isEnabled ? `pointer` : `default`}`,
        },
        ":active": {
          zIndex: `20`,
        },
      }}
    >
      <Box
        sx={{
          transform: `translate3d(${relPos.x * 8}%, ${relPos.y * 8}%, 0)`,
          willChange: `transform`,
          transition: slide ? `transform 0.3s ease-out` : `none`,
        }}
      >
        <Box sx={{
          transform: `rotate(${flipTurns.value}turn)`,
          willChange: `transform`,
          transition: `transform 0.3s ease-out`,
        }}>
          <Icon name={pieceDataToIconName(data)} />
        </Box>
      </Box>
    </Box>
  }
}

function getGlobalPos(e: DraggableEvent): Point | null {
  const mouseE = e as React.MouseEvent<HTMLDivElement, MouseEvent>;
  if (mouseE.clientX !== undefined && mouseE.clientY !== undefined) {
    return { x: mouseE.clientX, y: mouseE.clientY };
  }

  const touchE = (e as React.TouchEvent<HTMLDivElement>).changedTouches[0];
  if (touchE.clientX !== undefined && touchE.clientY !== undefined) {
    return { x: touchE.clientX, y: touchE.clientY };
  }

  return null
}